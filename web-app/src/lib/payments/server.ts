import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/email/layout';

/**
 * Server-only helpers shared by the card (Mercado Pago) and PayPal routes.
 *
 * These routes are called by the payment companies, not by a signed-in person,
 * so they cannot use a browser session. They use the Supabase service-role key,
 * which lives ONLY in a Vercel environment variable (never NEXT_PUBLIC_, never
 * in the repo) and is used for exactly two things: reading an order's amount
 * and marking it paid.
 */

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.');
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** Where payment companies send people back to. Overridable for testing on a preview URL. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, '');

export interface PayableOrder {
  id: string;
  reference: string;
  total: number;
  status: string;
  customerName: string;
  customerEmail: string | null;
  itemsSummary: string | null;
}

/** The order the customer just placed, found by its reference (orders.pix_transaction_id). */
export async function findOrder(reference: string): Promise<PayableOrder | null> {
  if (!/^[A-Za-z0-9]{6,40}$/.test(reference)) return null;
  const { data, error } = await supabaseAdmin()
    .from('orders')
    .select('*')
    .eq('pix_transaction_id', reference)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    reference,
    total: Number(data.total_price),
    status: String(data.status ?? ''),
    customerName: data.customer_name ?? '',
    customerEmail: data.customer_email ?? null,
    itemsSummary: data.items_summary ?? null,
  };
}

export const isPaid = (status: string) => status.toUpperCase() === 'PAID';

/**
 * Marks an order paid, and moves it to "Pagamento Confirmado" in the admin inbox
 * (which is also what unlocks the pickup address for pickup orders).
 * Safe to call twice: the second call changes nothing.
 */
export async function markOrderPaid(order: PayableOrder, provider: 'mercadopago' | 'paypal', paymentId: string) {
  const db = supabaseAdmin();
  if (isPaid(order.status)) return;

  const now = new Date().toISOString();
  const full = await db.from('orders')
    .update({ status: 'PAID', payment_provider: provider, payment_id: paymentId, paid_at: now })
    .eq('id', order.id);
  if (full.error) {
    // Migration 18 not run yet: still record that it was paid.
    const plain = await db.from('orders').update({ status: 'PAID' }).eq('id', order.id);
    if (plain.error) throw new Error(`Não foi possível marcar o pedido como pago: ${plain.error.message}`);
  }

  const { data: existing } = await db.from('inbox_status')
    .select('status').eq('source_table', 'orders').eq('source_id', order.id).maybeSingle();
  if (!existing || existing.status === 'new') {
    await db.from('inbox_status').upsert(
      { source_table: 'orders', source_id: order.id, status: 'confirmed', updated_at: now },
      { onConflict: 'source_table,source_id' },
    );
  }
}

/** A cent-safe comparison: providers round to 2 decimals. */
export const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.01;
