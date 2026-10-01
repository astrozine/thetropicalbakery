import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/payments/server';
import { ebookAccess, sendPaidEmailForOrder } from '@/lib/payments/ebook';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Dolly confirms a Pix e-book payment in the inbox: this sends the buyer "your book is ready" (the same e-mail card
 * and PayPal buyers get on their own). Admin only, like /api/email/send. Anything that is not an e-book order, or is
 * not actually confirmed yet, is quietly ignored, so the inbox can call it for every order it confirms.
 * Body: { orderId }.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const asAdmin = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: isAdmin } = await asAdmin.rpc('is_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 });

  try {
    const { orderId } = await req.json();
    const { data: order } = await supabaseAdmin().from('orders').select('*').eq('id', String(orderId || '')).maybeSingle();
    if (!order || !/^EBK/.test(String(order.pix_transaction_id ?? ''))) return NextResponse.json({ ok: true, sent: false, why: 'not an e-book order' });

    const access = await ebookAccess(String(order.pix_transaction_id));
    if (!access.paid) return NextResponse.json({ ok: true, sent: false, why: 'not confirmed yet' });

    await sendPaidEmailForOrder(order);
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    console.error('admin/ebook-paid:', e);
    return NextResponse.json({ error: 'Não foi possível enviar o e-mail.' }, { status: 500 });
  }
}
