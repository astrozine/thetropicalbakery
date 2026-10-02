import { NextRequest, NextResponse } from 'next/server';
import { payOffer, type OfferMethod } from '@/lib/payments/offer';
import { OrderError } from '@/lib/payments/order';

export const dynamic = 'force-dynamic';

const METHODS: OfferMethod[] = ['pix', 'card', 'paypal', 'stripe'];

/**
 * Body: { id, method }. Starts paying a proposal (/proposta/<id>): returns the Pix code, or { url } of the
 * card / PayPal / Stripe page. The price comes from the saved proposal, never from the browser.
 */
export async function POST(req: NextRequest) {
  try {
    const { id, method } = await req.json();
    const m = METHODS.includes(method) ? (method as OfferMethod) : 'pix';
    return NextResponse.json(await payOffer(String(id || ''), m));
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('proposta/pay:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Não foi possível abrir o pagamento.' }, { status: 500 });
  }
}
