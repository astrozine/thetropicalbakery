import { NextRequest, NextResponse } from 'next/server';
import { confirmStripeSession } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';

/**
 * Called by the e-book thank-you page with the session number Stripe put in the return address. It only asks
 * Stripe what happened, so nothing the visitor sends can mark an order paid. (The webhook does the same later,
 * if the buyer never comes back.)
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    return NextResponse.json(await confirmStripeSession(String(session_id || '')));
  } catch (e) {
    console.error('pay/stripe/confirm:', e);
    return NextResponse.json({ ok: false, status: 'error' }, { status: 500 });
  }
}
