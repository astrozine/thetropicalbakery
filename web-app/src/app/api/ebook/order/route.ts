import { NextRequest, NextResponse } from 'next/server';
import { OrderError } from '@/lib/payments/order';
import { createEbookOrder, thanksUrl, type EbookOrderInput } from '@/lib/payments/ebook';
import { findOrder, siteUrl } from '@/lib/payments/server';
import { createMercadoPagoCheckout, mercadoPagoConfigured } from '@/lib/payments/mercadopago';
import { createPayPalCheckout, paypalConfigured } from '@/lib/payments/paypal';
import { EBOOK } from '@/lib/ebook';

export const dynamic = 'force-dynamic';

/**
 * Buys the e-book. Body: { name, email, whatsapp?, payMethod: 'pix' | 'card' | 'paypal' }.
 * The price comes from the server (lib/ebook.ts). Answers with the reference, the download key and either
 * the Pix code or the card / PayPal page to send the buyer to.
 */
export async function POST(req: NextRequest) {
  let body: EbookOrderInput;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid order.' }, { status: 400 }); }

  if (body.payMethod === 'card' && !mercadoPagoConfigured()) return NextResponse.json({ error: 'Card payments are not switched on yet. Please use Pix.' }, { status: 503 });
  if (body.payMethod === 'paypal' && !paypalConfigured()) return NextResponse.json({ error: 'PayPal is not switched on yet. Please use Pix or card.' }, { status: 503 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;

  try {
    const order = await createEbookOrder(body, token);
    if (order.method === 'pix') return NextResponse.json({ ok: true, ...order });

    const saved = await findOrder(order.reference);
    if (!saved) throw new Error('order vanished after saving');
    const opts = { returnUrl: thanksUrl(siteUrl(), order.reference, order.lang), title: `${EBOOK.title} e-book (PDF) · The Tropical Bakery` };
    const url = order.method === 'mercadopago'
      ? await createMercadoPagoCheckout(saved, opts)
      : await createPayPalCheckout(saved, { ...opts, locale: order.lang === 'pt' ? 'pt-BR' : order.lang === 'es' ? 'es-ES' : order.lang === 'nl' ? 'nl-NL' : 'en-US' });
    return NextResponse.json({ ok: true, ...order, url });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/ebook/order:', e);
    return NextResponse.json({ error: 'The payment page did not open. Please try again, or pay with Pix.' }, { status: 500 });
  }
}
