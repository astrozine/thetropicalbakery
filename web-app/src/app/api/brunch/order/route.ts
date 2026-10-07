import { NextRequest, NextResponse } from 'next/server';
import { OrderError } from '@/lib/payments/order';
import { createBrunchOrder, type BrunchOrderInput } from '@/lib/payments/brunch';
import { findOrder } from '@/lib/payments/server';
import { createMercadoPagoCheckout, mercadoPagoConfigured } from '@/lib/payments/mercadopago';
import { createPayPalCheckout, paypalConfigured } from '@/lib/payments/paypal';

export const dynamic = 'force-dynamic';

/**
 * Buys a seat at a brunch. Body: { eventId, name, whatsapp, payMethod: 'pix' | 'card' | 'paypal' } with the
 * signed-in person's token in Authorization. The price and the seat are decided on the server
 * (lib/payments/brunch.ts). Answers { result: 'ok' | 'espera' | 'pago', reference, pix? | url? }.
 */
export async function POST(req: NextRequest) {
  let body: BrunchOrderInput;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }

  if (body.payMethod === 'card' && !mercadoPagoConfigured()) return NextResponse.json({ error: 'O cartão ainda não está ativo. Use o Pix.' }, { status: 503 });
  if (body.payMethod === 'paypal' && !paypalConfigured()) return NextResponse.json({ error: 'O PayPal ainda não está ativo. Use o Pix ou o cartão.' }, { status: 503 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;

  try {
    const order = await createBrunchOrder(body, token);
    if (order.result !== 'ok' || order.method === 'pix' || order.method === 'free') return NextResponse.json({ ok: true, ...order });

    const saved = await findOrder(order.reference!);
    if (!saved) throw new Error('order vanished after saving');
    // The usual return page (/checkout/retorno) confirms the payment and links to the brunch room.
    const opts = { title: 'Ingresso Brunch Tropical · The Tropical Bakery' };
    const url = order.method === 'mercadopago'
      ? await createMercadoPagoCheckout(saved, opts)
      : await createPayPalCheckout(saved, { ...opts, locale: 'pt-BR' });
    return NextResponse.json({ ok: true, ...order, url });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/brunch/order:', e);
    return NextResponse.json({ error: 'A página de pagamento não abriu. Tente de novo, ou pague com Pix.' }, { status: 500 });
  }
}
