import { NextRequest, NextResponse } from 'next/server';
import { confirmMercadoPagoPayment } from '@/lib/payments/mercadopago';

export const dynamic = 'force-dynamic';

/**
 * Called by the "thank you" page with the payment number Mercado Pago put in
 * the return address. It only asks Mercado Pago what happened, so nothing the
 * visitor sends can mark an order paid. (The webhook does the same, later, if
 * the customer never comes back.)
 */
export async function POST(req: NextRequest) {
  try {
    const { payment_id } = await req.json();
    const result = await confirmMercadoPagoPayment(String(payment_id || ''));
    return NextResponse.json(result);
  } catch (e) {
    console.error('pay/mercadopago/confirm:', e);
    return NextResponse.json({ ok: false, status: 'error' }, { status: 500 });
  }
}
