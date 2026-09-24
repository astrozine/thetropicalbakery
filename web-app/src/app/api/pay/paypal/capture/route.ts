import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/payments/paypal';

export const dynamic = 'force-dynamic';

/** Body: { token, reference }. `token` is the PayPal order number PayPal puts in the return address. */
export async function POST(req: NextRequest) {
  try {
    const { token, reference } = await req.json();
    const result = await capturePayPalOrder(String(token || ''), String(reference || ''));
    return NextResponse.json(result);
  } catch (e) {
    console.error('pay/paypal/capture:', e);
    return NextResponse.json({ ok: false, status: 'error' }, { status: 500 });
  }
}
