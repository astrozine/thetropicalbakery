import { NextRequest, NextResponse } from 'next/server';
import { findOrder, isPaid } from '@/lib/payments/server';
import { createPayPalCheckout, paypalConfigured } from '@/lib/payments/paypal';

export const dynamic = 'force-dynamic';

/** Body: { reference }. Returns { url } — the PayPal page to send the customer to. */
export async function POST(req: NextRequest) {
  try {
    if (!paypalConfigured()) return NextResponse.json({ error: 'PayPal ainda não está ativo.' }, { status: 503 });
    const { reference } = await req.json();
    const order = await findOrder(String(reference || ''));
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    if (isPaid(order.status)) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });
    if (!Number.isFinite(order.total) || order.total <= 0) return NextResponse.json({ error: 'Valor do pedido inválido.' }, { status: 400 });

    return NextResponse.json({ url: await createPayPalCheckout(order) });
  } catch (e) {
    console.error('pay/paypal:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao iniciar o pagamento.' }, { status: 500 });
  }
}
