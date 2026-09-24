import { NextRequest, NextResponse } from 'next/server';
import { confirmMercadoPagoPayment, verifyMercadoPagoSignature } from '@/lib/payments/mercadopago';

export const dynamic = 'force-dynamic';

/**
 * Mercado Pago calls this whenever a payment changes. We answer 200 quickly for
 * anything that isn't a payment, and 5xx only when we really failed (so Mercado
 * Pago retries).
 */
export async function POST(req: NextRequest) {
  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try { body = await req.json(); } catch { /* some notices carry everything in the query string */ }

  const q = req.nextUrl.searchParams;
  const type = q.get('type') || q.get('topic') || body.type || '';
  const dataId = String(q.get('data.id') || q.get('id') || body.data?.id || '');

  if (type !== 'payment' || !dataId) return NextResponse.json({ ok: true, ignored: true });

  if (!verifyMercadoPagoSignature(req.headers, dataId)) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  try {
    const result = await confirmMercadoPagoPayment(dataId);
    return NextResponse.json({ received: true, ...result });
  } catch (e) {
    console.error('webhook/mercadopago:', e);
    return NextResponse.json({ error: 'Falha ao processar.' }, { status: 500 });
  }
}

/** Handy for checking in a browser that the address is live. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'mercadopago-webhook' });
}
