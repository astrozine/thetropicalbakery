import { NextResponse } from 'next/server';
import { mercadoPagoConfigured } from '@/lib/payments/mercadopago';
import { paypalConfigured } from '@/lib/payments/paypal';

export const dynamic = 'force-dynamic';

/**
 * Which ways to pay are switched on. The checkout only offers a method once its
 * keys are in Vercel, so the site keeps working (Pix only) until then.
 */
export async function GET() {
  const serviceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    card: serviceKey && mercadoPagoConfigured(),
    paypal: serviceKey && paypalConfigured(),
  });
}
