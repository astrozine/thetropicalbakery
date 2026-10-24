import { NextRequest, NextResponse } from 'next/server';
import { OrderError } from '@/lib/payments/order';
import { mercadoPagoConfigured } from '@/lib/payments/mercadopago';
import { createAppPlusOrder } from '@/lib/payments/appPlus';

export const dynamic = 'force-dynamic';

/**
 * Buys the app's Tropical+ (lib/payments/appPlus.ts). Body: { payMethod: 'pix' | 'card', whatsapp? }, with the
 * session's bearer token (required: the purchase is access on the account). Answers with the Pix code or the card page.
 */
export async function POST(req: NextRequest) {
  let body: { payMethod?: string; whatsapp?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }
  if (body.payMethod === 'card' && !mercadoPagoConfigured()) return NextResponse.json({ error: 'O cartão ainda não está ativo. Use o Pix.' }, { status: 503 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;
  try {
    return NextResponse.json({ ok: true, ...(await createAppPlusOrder(body, token)) });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/vontade/buy:', e);
    return NextResponse.json({ error: 'O pagamento não abriu. Tente de novo, ou pague por Pix.' }, { status: 500 });
  }
}
