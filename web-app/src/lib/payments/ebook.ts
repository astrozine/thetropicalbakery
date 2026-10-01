import 'server-only';
import crypto from 'node:crypto';
import { supabaseAdmin, isPaid } from './server';
import { OrderError } from './order';
import { BOOK_FILES, EBOOK, downloadName, isBookLang, type BookLang } from '@/lib/ebook';
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
  const method = input.payMethod === 'card' ? 'mercadopago' : input.payMethod === 'paypal' ? 'paypal' : input.payMethod === 'stripe' ? 'stripe' : 'pix';
  const total = EBOOK.priceBRL;
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
    items_summary: method === 'stripe' ? `1x ${EBOOK.lineName} · US$ ${EBOOK.priceUSD} (Stripe)` : `1x ${EBOOK.lineName}`,
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
    await sendEbookOrderReceived(db, { reference, customerName: name, customerEmail: email, total, method, pixPayload: pix?.payload ?? null, key: ebookKey(reference), lang, book });
  } catch (e) {
    console.error('createEbookOrder: receipt e-mail failed (order is saved):', e);
  }

  return { reference, key: ebookKey(reference), total, method, lang, book, ...(pix ? { pix: { payload: pix.payload, base64: pix.base64 } } : {}) };
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
  });
}
