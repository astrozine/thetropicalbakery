import { NextRequest, NextResponse } from 'next/server';
import { findOrder, isPaid } from '@/lib/payments/server';
import { createStripeOrderCheckout, stripeConfigured } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';

/**
 * Body: { reference }. Returns { url }: the Stripe page for an order placed in /checkout (cards from any country).
 * The amount is the one the server stored for the order, never anything the browser sends.
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripeConfigured()) return NextResponse.json({ error: 'O cartão internacional ainda não está ativo.' }, { status: 503 });
    const { reference } = await req.json();
    const ref = String(reference || '');
    if (!/^ORD[A-Za-z0-9]+$/.test(ref)) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    const order = await findOrder(ref);
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    if (isPaid(order.status)) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });
    if (!Number.isFinite(order.total) || order.total <= 0) return NextResponse.json({ error: 'Valor do pedido inválido.' }, { status: 400 });

    return NextResponse.json({ url: await createStripeOrderCheckout(order) });
  } catch (e) {
    console.error('pay/stripe:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao iniciar o pagamento.' }, { status: 500 });
  }
}
