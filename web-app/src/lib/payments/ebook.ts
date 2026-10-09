import 'server-only';
import crypto from 'node:crypto';
import { supabaseAdmin, isPaid, findOrder } from './server';
import { createMercadoPagoCheckout, mercadoPagoConfigured } from './mercadopago';
import { createPayPalCheckout, paypalConfigured } from './paypal';
import { createStripeCheckout, stripeConfigured } from './stripe';
import { OrderError } from './order';
import { BOOK_FILES, BOOK_OFFERS, EBOOK, STRIPE_EUR, downloadName, isBookLang, stripeMoney, type BookLang, type BookOffer, type StripeCurrency } from '@/lib/ebook';
import { generatePixData } from '@/utils/pix';
import { sendEbookOrderReceived, sendEbookPaid } from '@/lib/email/ebookReceipts';
import { isEbookLang, type EbookLang } from '@/lib/ebookCopy';

/**
 * Selling the e-book. Same rules as a box order (lib/payments/order.ts): the browser says who is buying and
 * how they want to pay, the SERVER decides the price (from lib/ebook.ts) and saves the order with the
 * service key. Payment then goes through the usual providers, which charge the amount stored in the order.
 *
 * Delivery: every buyer gets a personal link, /sweet-escape/thank-you?ref=…&k=…, where `k` is an HMAC of the
 * reference. Nobody can make one up for someone else's order. The link works from the moment the order is
 * paid (card and PayPal confirm themselves; a Pix counts once Dolly confirms it in the inbox, exactly the
 * rule Minha Conta uses), and it hands out a short-lived signed URL to the private PDF in Supabase Storage.
 */

export interface EbookOrderInput {
  name?: string;
  email?: string;
  whatsapp?: string;
  payMethod?: string;
  /** Which version of the page they bought from: the e-mails and download page follow it. */
  lang?: string;
  /** Which language of the book they want: en, pt, es or nl (anything else is the English edition). */
  book?: string;
  /** A welcome-price link from the free-recipes e-mails (offerToken). Anything invalid or expired = full price. */
  offer?: string;
}

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** The secret for download keys. A dedicated one if set, otherwise derived from the service key (server-only either way). */
function linkSecret(): string {
  const s = process.env.EBOOK_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.');
  return `ebook:${s}`;
}

export function ebookKey(reference: string): string {
  return crypto.createHmac('sha256', linkSecret()).update(reference).digest('base64url').slice(0, 24);
}

export function validKey(reference: string, key: string): boolean {
  if (!/^[A-Za-z0-9]{6,40}$/.test(reference) || !key) return false;
  const a = Buffer.from(ebookKey(reference));
  const b = Buffer.from(String(key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * The welcome price (BOOK_OFFERS.welcome) travels as `<expiry>.<signature>` in the link of one free-recipes e-mail.
 * Not tied to a person on purpose: it is a coupon that runs out, and passing it to a friend is fine. The server
 * checks the signature and the date; nobody can make one up or stretch one.
 */
export function offerToken(expiresAt: Date): string {
  const exp = Math.floor(expiresAt.getTime() / 1000);
  return `${exp}.${crypto.createHmac('sha256', linkSecret()).update(`welcome:${exp}`).digest('base64url').slice(0, 16)}`;
}

/** When a welcome link runs out, or null if it is not one of ours or has already run out. */
export function offerExpiry(token: unknown): Date | null {
  const m = /^(\d{9,11})\.([A-Za-z0-9_-]{16})$/.exec(String(token ?? ''));
  if (!m) return null;
  const want = Buffer.from(offerToken(new Date(Number(m[1]) * 1000)).split('.')[1]);
  const got = Buffer.from(m[2]);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  const at = new Date(Number(m[1]) * 1000);
  return at.getTime() > Date.now() ? at : null;
}

export function thanksUrl(site: string, reference: string, lang: EbookLang = 'en'): string {
  return `${site}${EBOOK.thanksPath}?ref=${reference}&k=${ebookKey(reference)}&lang=${lang}`;
}

/**
 * The buyer's language rides on the order's delivery_address (a free-text field that for an e-book only ever says
 * "digital delivery"), so the payment webhook, hours later, still knows which language to write the e-mail in.
 */
const ADDRESS = 'E-BOOK · entrega digital por e-mail';
export const ebookAddress = (lang: EbookLang, book: BookLang) => `${ADDRESS} · ${lang} · ${book}`;
const TAIL = /·\s*(en|pt|es|nl)\s*(?:·\s*(en|pt|es|nl)\s*)?$/;
export const langFromAddress = (address: unknown): EbookLang => {
  const m = TAIL.exec(String(address ?? ''));
  return m && isEbookLang(m[1]) ? m[1] : 'en';
};
/** The book language they bought: the second tag, or (older orders) the page language. */
export const bookFromAddress = (address: unknown): BookLang => {
  const m = TAIL.exec(String(address ?? ''));
  const b = m?.[2] ?? m?.[1];
  return isBookLang(b) ? b : 'en';
};

export interface CreatedEbookOrder {
  reference: string;
  key: string;
  total: number;
  method: 'pix' | 'mercadopago' | 'paypal' | 'stripe';
  lang: EbookLang;
  book: BookLang;
  offer: BookOffer;
  /** What this order charges in dollars if paid through Stripe. */
  usd: number;
  /** The currency Stripe charges it in ('stripe-eur' from the browser = euros). */
  currency: StripeCurrency;
  pix?: { payload: string; base64: string };
}

export async function createEbookOrder(input: EbookOrderInput, userToken: string | null): Promise<CreatedEbookOrder> {
  const name = text(input.name, 120);
  const email = text(input.email, 160).toLowerCase();
  const whatsapp = text(input.whatsapp, 40).replace(/\D/g, '');
  if (name.length < 2) throw new OrderError(400, 'Please tell us your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new OrderError(400, 'We need a valid e-mail: that is where your book goes.');
  if (whatsapp && whatsapp.length < 10) throw new OrderError(400, 'That WhatsApp number looks too short. Include the country and area code, or leave it empty.');

  const db = supabaseAdmin();

  let userId: string | null = null;
  if (userToken) {
    const { data } = await db.auth.getUser(userToken);
    userId = data.user?.id ?? null;
  }

  const lang: EbookLang = isEbookLang(input.lang) ? input.lang : 'en';
  const book: BookLang = isBookLang(input.book) ? input.book : 'en';
  // 'stripe' charges US dollars (EBOOK.priceUSD); everything else charges reais (EBOOK.priceBRL). The order's
  // total_price is always the BRL list price so the admin's numbers stay in one currency; the dollars are noted
  // in items_summary and verified against Stripe itself (lib/payments/stripe.ts).
  const method = input.payMethod === 'card' ? 'mercadopago' : input.payMethod === 'paypal' ? 'paypal' : input.payMethod === 'stripe' || input.payMethod === STRIPE_EUR ? 'stripe' : 'pix';
  const currency: StripeCurrency = input.payMethod === STRIPE_EUR ? 'eur' : 'usd';
  const offer: BookOffer = offerExpiry(input.offer) ? 'welcome' : 'full';
  const { brl: total, usd } = BOOK_OFFERS[offer];
  const charged = stripeMoney(BOOK_OFFERS[offer][currency], currency);
  const reference = `EBK${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.substring(0, 25);
  const today = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

  const base = {
    customer_name: name,
    customer_email: email,
    customer_whatsapp: whatsapp,
    delivery_address: ebookAddress(lang, book),
    requested_date: today,
    total_price: total,
    pix_transaction_id: reference,
    status: 'PENDING',
    order_type: 'EBOOK',
  };
  const rich = {
    ...base,
    payment_provider: method,
    order_kind: 'ebook',
    fulfillment: 'digital',
    user_id: userId,
    delivery_fee: 0,
    items_summary: `1x ${EBOOK.lineName}${offer === 'welcome' ? ' · preço de boas-vindas' : ''}${method === 'stripe' ? ` · ${charged} (Stripe)` : ''}`,
  };

  // Newest columns first, then fall back, so a missing migration never loses a sale. `order_type` has only
  // ever held CAIXA_DEGUSTACAO / EVENTO; if the database turns out to restrict it, the order still saves.
  const attempts = [rich, { ...rich, order_type: 'EVENTO' }, base, { ...base, order_type: 'EVENTO' }];
  let saved = false;
  for (const row of attempts) {
    const { error } = await db.from('orders').insert([row]);
    if (!error) { saved = true; break; }
    console.error('createEbookOrder insert attempt failed:', error.message);
  }
  if (!saved) throw new OrderError(500, 'We could not save your order just now. Please try again in a moment.');

  // Their e-mail on the list (tagged as a customer); never fatal.
  try {
    await db.rpc('email_contact_upsert', { p_email: email, p_full_name: name, p_tags: ['cliente'], p_source: 'ebook' });
  } catch { /* the sale matters more */ }

  const pix = method === 'pix' ? await generatePixData({ value: total, transactionId: reference }) : undefined;

  try {
    await sendEbookOrderReceived(db, { reference, customerName: name, customerEmail: email, total, method, pixPayload: pix?.payload ?? null, key: ebookKey(reference), lang, book, charged: method === 'stripe' ? charged : undefined });
  } catch (e) {
    console.error('createEbookOrder: receipt e-mail failed (order is saved):', e);
  }

  return { reference, key: ebookKey(reference), total, method, lang, book, offer, usd, currency, ...(pix ? { pix: { payload: pix.payload, base64: pix.base64 } } : {}) };
}

/** Why this way of paying cannot be used right now (its keys are not in Vercel), or null if it can. */
export function unavailableMethod(payMethod: unknown): string | null {
  if (payMethod === 'card' && !mercadoPagoConfigured()) return 'Card payments are not switched on yet. Please use Pix.';
  if ((payMethod === 'stripe' || payMethod === STRIPE_EUR) && !stripeConfigured()) return 'Card payments are not switched on yet. Please use Pix.';
  if (payMethod === 'paypal' && !paypalConfigured()) return 'PayPal is not switched on yet. Please use Pix or card.';
  return null;
}

/**
 * The card / PayPal page for a just-created e-book order, returning the buyer to `returnUrl` (the book's own thank-you
 * page, or the free-recipes one). Charges what the order stores; Stripe charges the dollars of that same offer.
 */
export async function ebookCheckoutUrl(order: CreatedEbookOrder, email: string, returnUrl: string): Promise<string> {
  const saved = await findOrder(order.reference);
  if (!saved) throw new Error('order vanished after saving');
  const opts = { returnUrl, title: `${EBOOK.title} e-book (PDF) · The Tropical Bakery` };
  if (order.method === 'stripe') return createStripeCheckout({ reference: order.reference, email: email.trim(), lang: order.lang, returnUrl, currency: order.currency, amount: BOOK_OFFERS[order.offer][order.currency] });
  if (order.method === 'mercadopago') return createMercadoPagoCheckout(saved, opts);
  return createPayPalCheckout(saved, { ...opts, locale: order.lang === 'pt' ? 'pt-BR' : order.lang === 'es' ? 'es-ES' : order.lang === 'nl' ? 'nl-NL' : 'en-US' });
}

export interface EbookAccess {
  found: boolean;
  paid: boolean;
  method?: string;
  /** The language of the book they bought. */
  book?: BookLang;
  firstName?: string;
  total?: number;
}

/**
 * Has this e-book order been paid? Paid = status PAID (card / PayPal), or moved past "new" in the admin inbox
 * (how a Pix is confirmed by hand), and not cancelled.
 */
export async function ebookAccess(reference: string): Promise<EbookAccess> {
  const db = supabaseAdmin();
  const { data } = await db.from('orders').select('*').eq('pix_transaction_id', reference).maybeSingle();
  if (!data) return { found: false, paid: false };
  if (!/^EBK/.test(reference) && data.order_kind !== 'ebook') return { found: false, paid: false };

  let paid = isPaid(String(data.status ?? ''));
  if (!paid) {
    const { data: inbox } = await db.from('inbox_status')
      .select('status').eq('source_table', 'orders').eq('source_id', data.id).maybeSingle();
    paid = !!inbox && inbox.status !== 'new' && inbox.status !== 'cancelled';
  }
  return {
    found: true,
    paid,
    method: String(data.payment_provider ?? ''),
    book: bookFromAddress(data.delivery_address),
    firstName: String(data.customer_name ?? '').trim().split(' ')[0],
    total: Number(data.total_price ?? 0),
  };
}

/**
 * A download link to the private PDF of that language, good for a few minutes. If that language's file has not been
 * uploaded (yet), the buyer gets the English one rather than nothing.
 */
export async function signedEbookUrl(book: BookLang = 'en'): Promise<string> {
  const storage = supabaseAdmin().storage.from(EBOOK.bucket);
  for (const lang of book === 'en' ? (['en'] as const) : ([book, 'en'] as const)) {
    const { data, error } = await storage.createSignedUrl(BOOK_FILES[lang], 60 * 10, { download: downloadName(lang) });
    if (!error && data?.signedUrl) return data.signedUrl;
    console.error(`signedEbookUrl: ${BOOK_FILES[lang]} not available:`, error?.message);
  }
  throw new Error('E-book file not available');
}

/**
 * The "your book is ready" e-mail for a saved e-book order row. The one place that builds it, used when a card or
 * PayPal payment is confirmed (markOrderPaid) and when Dolly confirms a Pix by hand in the inbox. Safe to call twice:
 * email_sends has one row per order and address, so nobody gets it twice.
 */
export async function sendPaidEmailForOrder(row: Record<string, unknown>) {
  const reference = String(row.pix_transaction_id ?? '');
  await sendEbookPaid(supabaseAdmin(), {
    reference, key: ebookKey(reference),
    lang: langFromAddress(row.delivery_address), book: bookFromAddress(row.delivery_address),
    customerName: String(row.customer_name ?? ''), customerEmail: (row.customer_email as string | null) ?? null,
    total: Number(row.total_price ?? 0), method: String(row.payment_provider ?? ''),
    // Stripe orders note what they charged ("· € 9 (Stripe)"), so the receipt says euros or dollars correctly.
    charged: /· ((?:US\$|€) [\d.]+) \(Stripe\)/.exec(String(row.items_summary ?? ''))?.[1],
  });
}
