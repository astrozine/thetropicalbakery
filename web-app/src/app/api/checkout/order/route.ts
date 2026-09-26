import { NextRequest, NextResponse } from 'next/server';
import { createOrder, OrderError, type OrderInput } from '@/lib/payments/order';

export const dynamic = 'force-dynamic';

/**
 * Places an order. The browser sends what was picked; the server prices it (see lib/payments/order.ts)
 * and answers with the reference and the real total, which is what the Pix code and the card page charge.
 */
export async function POST(req: NextRequest) {
  let body: OrderInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;

  try {
    const order = await createOrder(body, token);
    return NextResponse.json({ ok: true, ...order });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/checkout/order:', e);
    return NextResponse.json({ error: 'Não conseguimos registrar o pedido agora. Tente de novo em instantes.' }, { status: 500 });
  }
}
