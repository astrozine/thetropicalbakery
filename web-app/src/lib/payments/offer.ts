import 'server-only';
import { supabaseAdmin, findOrder, isPaid, siteUrl, type PayableOrder } from './server';
import { OrderError } from './order';
import { createMercadoPagoCheckout, mercadoPagoConfigured } from './mercadopago';
import { createPayPalCheckout, paypalConfigured } from './paypal';
import { createStripeOrderCheckout, stripeConfigured } from './stripe';
import { generatePixData } from '@/utils/pix';
import { firstName, type Offer, type PublicOffer } from '@/lib/offers';
import { BOOK_PERK, hasBookPerk, perkDiscount } from '@/lib/bookPerk';

/**
 * Paying a proposal (migration 36). Same rules as every other purchase: the PRICE is the one Dolly saved on the
 * proposal, read here with the service key, never anything the browser sends. Paying creates (or reuses) one
 * ordinary order, reference PRP…, so it shows up in the inbox, a Pix is confirmed there by hand, and card, PayPal
 * and Stripe confirm themselves through the usual routes.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Brazil's calendar day (the server runs in UTC). */
const brasiliaToday = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

export async function loadOffer(id: string): Promise<Offer | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await supabaseAdmin().from('payment_offers').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    price: Number(data.price),
    anchor_price: data.anchor_price == null ? null : Number(data.anchor_price),
    included: Array.isArray(data.included) ? data.included.map(String) : [],
    bonuses: Array.isArray(data.bonuses) ? data.bonuses.map(String) : [],
  } as Offer;
}

async function orderOf(offer: Offer): Promise<PayableOrder | null> {
  return offer.order_reference ? findOrder(offer.order_reference) : null;
}

/**
 * What this proposal costs this client: Dolly's price, or 15% less with the reader's gift (bought Sweet Escape and
 * nothing else since, lib/bookPerk.ts). Once paid, what they paid.
 */
async function priceFor(offer: Offer, order: PayableOrder | null): Promise<{ price: number; perk: boolean }> {
  if (order && isPaid(order.status)) return { price: order.total, perk: order.total < offer.price - 0.009 };
  const perk = await hasBookPerk(supabaseAdmin(), offer.customer_email);
  return { price: perk ? Math.round((offer.price - perkDiscount(offer.price)) * 100) / 100 : offer.price, perk };
}

/** What the client's page shows. Leaves out their phone and e-mail. */
export async function publicOffer(id: string): Promise<PublicOffer | null> {
  const offer = await loadOffer(id);
  if (!offer) return null;
  const order = await orderOf(offer);
  const paid = !!order && isPaid(order.status);
  const { price, perk } = await priceFor(offer, order);
  return {
    id: offer.id, kind: offer.kind, lang: offer.lang, title: offer.title, dates_label: offer.dates_label,
    price, perk,
    anchor_price: perk ? Math.max(offer.anchor_price ?? 0, offer.price) : offer.anchor_price, included: offer.included, bonuses: offer.bonuses,
    note: offer.note, image_url: offer.image_url, expires_on: offer.expires_on, status: offer.status,
    firstName: firstName(offer.customer_name),
    paid,
    reference: offer.order_reference,
    expired: !paid && !!offer.expires_on && brasiliaToday() > offer.expires_on,
  };
}

export type OfferMethod = 'pix' | 'card' | 'paypal' | 'stripe';

export interface OfferPayment {
  reference: string;
  pix?: { payload: string; qr: string };
  url?: string;
}

const PROVIDER: Record<OfferMethod, string> = { pix: 'pix', card: 'mercadopago', paypal: 'paypal', stripe: 'stripe' };

/** Starts paying a proposal: the Pix code, or the address of the card / PayPal / Stripe page. */
export async function payOffer(id: string, method: OfferMethod): Promise<OfferPayment> {
  const offer = await loadOffer(id);
  if (!offer) throw new OrderError(404, 'Proposta não encontrada.');
  if (offer.status !== 'open') throw new OrderError(409, 'Esta proposta não está mais disponível.');
  if (offer.expires_on && brasiliaToday() > offer.expires_on) throw new OrderError(409, 'Esta proposta expirou. Fale com a Dolly no WhatsApp.');
  if (method === 'card' && !mercadoPagoConfigured()) throw new OrderError(503, 'O cartão ainda não está ativo.');
  if (method === 'paypal' && !paypalConfigured()) throw new OrderError(503, 'O PayPal ainda não está ativo.');
  if (method === 'stripe' && !stripeConfigured()) throw new OrderError(503, 'O cartão internacional ainda não está ativo.');

  const db = supabaseAdmin();
  let order = await orderOf(offer);
  if (order && isPaid(order.status)) throw new OrderError(409, 'Esta proposta já foi paga.');

  // One order per proposal: trying another way to pay reuses it, at the proposal's price (with the reader's gift, if any).
  const { price, perk } = await priceFor(offer, order);
  if (order && Math.abs(order.total - price) > 0.009) order = null;
  if (order) {
    await db.from('orders').update({ payment_provider: PROVIDER[method] }).eq('id', order.id);
  } else {
    const reference = `PRP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.substring(0, 25);
    const label = offer.kind === 'retiro' ? 'Retiro' : 'Curso';
    const base = {
      customer_name: offer.customer_name,
      customer_email: offer.customer_email || '',
      customer_whatsapp: (offer.customer_whatsapp || '').replace(/\D/g, ''),
      delivery_address: `${label.toUpperCase()} · proposta${offer.dates_label ? ` · ${offer.dates_label}` : ''}`,
      requested_date: brasiliaToday(),
      total_price: price,
      pix_transaction_id: reference,
      status: 'PENDING',
      order_type: label.toUpperCase(),
    };
    const rich = {
      ...base,
      payment_provider: PROVIDER[method],
      order_kind: offer.kind,
      delivery_fee: 0,
      items_summary: `1x ${label}: ${offer.title}${offer.dates_label ? ` · ${offer.dates_label}` : ''} (proposta)${perk ? ` · ${BOOK_PERK.line}` : ''}`,
    };
    // Newest columns first, then fall back (as the e-book does), so a missing migration never loses a sale.
    const attempts = [rich, { ...rich, order_type: 'EVENTO' }, base, { ...base, order_type: 'EVENTO' }];
    let saved = false;
    for (const row of attempts) {
      const { error } = await db.from('orders').insert([row]);
      if (!error) { saved = true; break; }
      console.error('payOffer insert attempt failed:', error.message);
    }
    if (!saved) throw new OrderError(500, 'Não conseguimos registrar o pagamento agora. Tente de novo em instantes.');
    await db.from('payment_offers').update({ order_reference: reference, updated_at: new Date().toISOString() }).eq('id', offer.id);
    order = await findOrder(reference);
    if (!order) throw new OrderError(500, 'Não conseguimos registrar o pagamento agora. Tente de novo em instantes.');
  }

  const returnUrl = `${siteUrl()}/proposta/${offer.id}?ref=${order.reference}`;
  if (method === 'pix') {
    const { payload, base64 } = await generatePixData({ value: order.total, transactionId: order.reference });
    return { reference: order.reference, pix: { payload, qr: base64 } };
  }
  if (method === 'card') return { reference: order.reference, url: await createMercadoPagoCheckout(order, { returnUrl, title: offer.title }) };
  if (method === 'paypal') return { reference: order.reference, url: await createPayPalCheckout(order, { returnUrl, title: offer.title, locale: offer.lang === 'en' ? 'en-US' : 'pt-BR' }) };
  return { reference: order.reference, url: await createStripeOrderCheckout(order, { returnUrl }) };
}
