import 'server-only';
import { findOrder, siteUrl, supabaseAdmin } from './server';
import { OrderError } from './order';
import { createMercadoPagoCheckout } from './mercadopago';
import { generatePixData } from '@/utils/pix';
import { APP_PLUS } from '@/lib/vontade';
import { sendAppPlusPix, sendAppPlusUnlocked } from '@/lib/email/appPlusMail';

/**
 * Buying the app's Tropical+ (migration 49). Same rules as the other orders: the browser says how to pay, the
 * SERVER sets the price (APP_PLUS) and saves the order with the service key. The buyer must be signed in, because
 * what they buy is access on their account. is_tropical_plus() reads the order back: card = PAID, Pix = confirmed
 * by Dolly in the inbox.
 */

export interface CreatedAppPlusOrder {
  reference: string;
  total: number;
  method: 'pix' | 'mercadopago';
  pix?: { payload: string; base64: string };
  url?: string;
}

export const isAppPlusReference = (ref: unknown) => /^APP/.test(String(ref ?? ''));

export async function createAppPlusOrder(input: { payMethod?: string; whatsapp?: string }, userToken: string | null): Promise<CreatedAppPlusOrder> {
  const db = supabaseAdmin();
  if (!userToken) throw new OrderError(401, 'Entre na sua conta para o Tropical+ ficar com você.');
  const { data: auth } = await db.auth.getUser(userToken);
  const user = auth.user;
  if (!user) throw new OrderError(401, 'Entre na sua conta para o Tropical+ ficar com você.');
  const email = String(user.email ?? '').toLowerCase();
  const name = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').trim() || email.split('@')[0] || 'Cliente';
  const whatsapp = String(input.whatsapp ?? user.phone ?? '').replace(/\D/g, '').slice(0, 20);

  const method: CreatedAppPlusOrder['method'] = input.payMethod === 'card' ? 'mercadopago' : 'pix';
  const total = APP_PLUS.brl;
  const reference = `APP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.substring(0, 25);
  const today = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

  const base = {
    customer_name: name,
    customer_email: email || null,
    customer_whatsapp: whatsapp,
    delivery_address: 'APP · Tropical+ do Bateu Vontade? (digital)',
    requested_date: today,
    total_price: total,
    pix_transaction_id: reference,
    status: 'PENDING',
    order_type: 'EVENTO',
  };
  const rich = { ...base, payment_provider: method, order_kind: 'app', fulfillment: 'digital', user_id: user.id, delivery_fee: 0, items_summary: `1x ${APP_PLUS.name}` };

  // user_id is what unlocks it, so the rich row must save; the plain one is only a last resort the admin can fix.
  let saved = false;
  for (const row of [rich, { ...base, user_id: user.id, items_summary: rich.items_summary }]) {
    const { error } = await db.from('orders').insert([row]);
    if (!error) { saved = true; break; }
    console.error('createAppPlusOrder insert failed:', error.message);
  }
  if (!saved) throw new OrderError(500, 'Não conseguimos salvar o pedido agora. Tente de novo em um instante.');

  try {
    await db.rpc('email_contact_upsert', { p_email: email, p_full_name: name, p_tags: ['cliente', 'app-vontade'], p_source: 'app-vontade' });
  } catch { /* the sale matters more */ }

  if (method === 'pix') {
    const pix = await generatePixData({ value: total, transactionId: reference });
    try { await sendAppPlusPix(db, { name, email, reference, total, pixPayload: pix.payload }); } catch (e) { console.error('app-plus pix mail:', e); }
    return { reference, total, method, pix: { payload: pix.payload, base64: pix.base64 } };
  }

  const order = await findOrder(reference);
  if (!order) throw new OrderError(500, 'Não conseguimos abrir o pagamento agora. Tente de novo, ou pague por Pix.');
  const url = await createMercadoPagoCheckout(order, {
    returnUrl: `${siteUrl()}/vontade?pago=${reference}`,
    title: `${APP_PLUS.name} · pagamento único`,
  });
  return { reference, total, method, url };
}

/** Paid (card via markOrderPaid, or a Pix Dolly confirmed): the "it's unlocked" e-mail, once per order. */
export async function onAppPlusPaid(order: Record<string, unknown>) {
  await sendAppPlusUnlocked(supabaseAdmin(), {
    name: String(order.customer_name ?? ''),
    email: String(order.customer_email ?? ''),
    reference: String(order.pix_transaction_id ?? ''),
  });
}
