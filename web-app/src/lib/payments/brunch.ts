import 'server-only';
import { supabaseAdmin } from './server';
import { OrderError } from './order';
import { generatePixData } from '@/utils/pix';
import { HOLD_HOURS, normalizeEvent, type BrunchEvent } from '@/lib/brunch';
import { sendBrunchConfirmed, sendBrunchReserved, sendBrunchWaitlist } from '@/lib/email/brunchMail';

/**
 * Buying a seat at a Brunch Tropical. Same rules as a box order (lib/payments/order.ts): the browser says WHICH
 * brunch and how to pay; the SERVER reads the price from brunch_events, takes the seat with brunch_reserve()
 * (locks the row: two people can never get the last seat), and saves the order with the service key.
 * Card / PayPal then charge the amount stored in the order.
 *
 * The buyer must be signed in: the seat comes with a place in the group chat and a networking card, which live
 * on their account.
 */

export interface BrunchOrderInput {
  eventId?: string;
  name?: string;
  /** Only used when the account has no e-mail (signed in by phone): every brunch message goes by e-mail. */
  email?: string;
  whatsapp?: string;
  payMethod?: string;
}

export interface CreatedBrunchOrder {
  result: 'ok' | 'espera' | 'pago';
  reference?: string;
  total: number;
  method: 'pix' | 'mercadopago' | 'paypal' | 'free';
  slug: string;
  pix?: { payload: string; base64: string };
}

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

const REASONS: Record<string, string> = {
  fechado: 'As vendas deste brunch estão fechadas.',
  ja_tem: 'Você já tem um lugar garantido neste brunch. Ele está em Minha Conta.',
  so_membros: 'Por enquanto este brunch está aberto só para quem já é do Círculo Tropical (quem já veio a um brunch ou assina a caixa). Logo abre para todo mundo: deixe seu nome na lista de espera.',
  lotado: 'Os lugares acabaram.',
};

export async function createBrunchOrder(input: BrunchOrderInput, userToken: string | null): Promise<CreatedBrunchOrder> {
  const db = supabaseAdmin();
  if (!userToken) throw new OrderError(401, 'Entre na sua conta para garantir o seu lugar.');
  const { data: auth } = await db.auth.getUser(userToken);
  const user = auth.user;
  if (!user) throw new OrderError(401, 'Entre na sua conta para garantir o seu lugar.');
  const email = (user.email || text(input.email, 160)).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new OrderError(400, 'Precisamos do seu e-mail: é por ele que chegam o endereço e o grupo.');

  const name = text(input.name, 120) || String(user.user_metadata?.full_name ?? '').trim();
  const whatsapp = text(input.whatsapp, 40).replace(/\D/g, '');
  if (name.length < 2) throw new OrderError(400, 'Conte pra gente o seu nome.');
  if (whatsapp.length < 10) throw new OrderError(400, 'Precisamos do seu WhatsApp com DDD, para a Dolly te achar no dia.');

  const { data: row } = await db.from('brunch_events').select('*').eq('id', text(input.eventId, 60)).maybeSingle();
  if (!row) throw new OrderError(404, 'Brunch não encontrado.');
  const event: BrunchEvent = normalizeEvent(row);

  const free = event.price <= 0;
  const method: CreatedBrunchOrder['method'] = free ? 'free'
    : input.payMethod === 'card' ? 'mercadopago' : input.payMethod === 'paypal' ? 'paypal' : 'pix';
  const reference = free ? null : `BRU${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.substring(0, 25);

  const { data: res, error: resErr } = await db.rpc('brunch_reserve', {
    p_event: event.id, p_user: user.id, p_email: email, p_name: name, p_whatsapp: whatsapp,
    p_reference: reference, p_price: event.price,
    p_hold_hours: method === 'pix' ? HOLD_HOURS.pix : HOLD_HOURS.card,
    p_waitlist: true,
  });
  if (resErr) {
    console.error('brunch_reserve failed:', resErr.message);
    throw new OrderError(500, /brunch_reserve/.test(resErr.message)
      ? 'Os brunches ainda não estão ativos (falta rodar a migration 41).'
      : 'Não conseguimos reservar agora. Tente de novo em um instante.');
  }
  const result = String((res as { result?: string })?.result ?? '');
  const ticketId = String((res as { ticket_id?: string })?.ticket_id ?? '');

  // Their e-mail on the list, tagged for brunch news. Never fatal.
  try {
    await db.rpc('email_contact_upsert', { p_email: email, p_full_name: name, p_tags: ['cliente', 'brunch'], p_source: 'brunch' });
  } catch { /* the seat matters more */ }

  if (result === 'espera') {
    try { await sendBrunchWaitlist(db, { event, name, email }); } catch (e) { console.error('brunch waitlist mail:', e); }
    return { result: 'espera', total: event.price, method, slug: event.slug };
  }
  if (result !== 'ok') throw new OrderError(409, REASONS[result] ?? 'Não foi possível reservar.');

  if (free) {
    try { await sendBrunchConfirmed(db, { event, name, email, reference: null, total: 0 }); } catch (e) { console.error('brunch confirm mail:', e); }
    return { result: 'pago', total: 0, method, slug: event.slug };
  }

  const when = new Date(event.starts_at);
  const base = {
    customer_name: name,
    customer_email: email,
    customer_whatsapp: whatsapp,
    delivery_address: `BRUNCH · ${event.venue_name || event.city || 'Itamambuca'}`,
    requested_date: new Date(when.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10),
    total_price: event.price,
    pix_transaction_id: reference,
    status: 'PENDING',
    order_type: 'EVENTO',
  };
  const rich = {
    ...base,
    payment_provider: method,
    order_kind: 'brunch',
    fulfillment: 'evento',
    user_id: user.id,
    delivery_fee: 0,
    items_summary: `1x Ingresso Brunch Tropical: ${event.title}`,
  };

  // Newest columns first, then fall back, so a missing column never loses a seat.
  let saved = false;
  for (const attempt of [rich, base]) {
    const { error } = await db.from('orders').insert([attempt]);
    if (!error) { saved = true; break; }
    console.error('createBrunchOrder insert failed:', error.message);
  }
  if (!saved) {
    // Give the seat back: the order is what makes it payable.
    await db.from('brunch_tickets').update({ status: 'cancelado' }).eq('id', ticketId);
    throw new OrderError(500, 'Não conseguimos salvar o seu pedido agora. Tente de novo em um instante.');
  }

  const pix = method === 'pix' ? await generatePixData({ value: event.price, transactionId: reference! }) : undefined;

  try {
    await sendBrunchReserved(db, { event, name, email, reference: reference!, total: event.price, method, pixPayload: pix?.payload ?? null });
  } catch (e) {
    console.error('createBrunchOrder: receipt e-mail failed (seat is saved):', e);
  }

  return { result: 'ok', reference: reference!, total: event.price, method, slug: event.slug, ...(pix ? { pix: { payload: pix.payload, base64: pix.base64 } } : {}) };
}

/**
 * A brunch order was paid (card / PayPal via markOrderPaid, or a Pix Dolly confirmed). Marks the seat paid and
 * sends the welcome e-mail with the room link. Safe to call twice: the e-mail goes once per reference.
 */
export async function onBrunchOrderPaid(order: Record<string, unknown>) {
  const db = supabaseAdmin();
  const reference = String(order.pix_transaction_id ?? '');
  const { data: ticket } = await db.from('brunch_tickets').select('*').eq('reference', reference).maybeSingle();
  if (!ticket) return;
  if (ticket.status !== 'pago') {
    await db.from('brunch_tickets').update({ status: 'pago', paid_at: new Date().toISOString() }).eq('id', ticket.id);
  }
  const { data: row } = await db.from('brunch_events').select('*').eq('id', ticket.event_id).maybeSingle();
  if (!row) return;
  await sendBrunchConfirmed(db, {
    event: normalizeEvent(row),
    name: String(ticket.full_name ?? order.customer_name ?? ''),
    email: String(ticket.email ?? order.customer_email ?? ''),
    reference,
    total: Number(order.total_price ?? ticket.price ?? 0),
  });
}

export const isBrunchReference = (ref: unknown) => /^BRU/.test(String(ref ?? ''));
