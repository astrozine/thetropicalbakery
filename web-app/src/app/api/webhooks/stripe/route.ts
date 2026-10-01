import { NextRequest, NextResponse } from 'next/server';
import { confirmStripeSession, verifyStripeSignature } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';

/** Quick "is it there?" check from a browser. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'stripe-webhook' });
}

/**
 * Stripe tells us a Checkout session was paid. The body is only trusted because the signature matches; we still
 * re-read the session from Stripe (confirmStripeSession) before marking anything paid. Answering 200 for events
 * we don't care about stops Stripe from retrying them.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'))) {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }
  try {
    const event = JSON.parse(raw);
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const id = String(event.data?.object?.id || '');
      const result = await confirmStripeSession(id);
      if (!result.ok && result.status === 'paid') {
        // Paid at Stripe but we could not mark it: let Stripe retry.
        return NextResponse.json({ ok: false, status: result.status }, { status: 500 });
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('webhooks/stripe:', e);
    return NextResponse.json({ error: 'webhook error' }, { status: 500 });
  }
}
