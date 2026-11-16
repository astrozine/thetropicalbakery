import { NextRequest, NextResponse } from 'next/server';
import { alertAfterResponse } from '@/lib/email/alerts';
import { OrderError } from '@/lib/payments/order';
import { createEbookOrder, ebookCheckoutUrl, thanksUrl, unavailableMethod, type EbookOrderInput } from '@/lib/payments/ebook';
import { siteUrl } from '@/lib/payments/server';

export const dynamic = 'force-dynamic';

/**
 * Buys the e-book. Body: { name, email, whatsapp?, payMethod: 'pix' | 'card' | 'paypal' | 'stripe', offer? }.
 * The price comes from the server (lib/ebook.ts BOOK_OFFERS; `offer` is a signed welcome-price link or nothing).
 * Answers with the reference, the download key and either the Pix code or the card / PayPal page to send the buyer to.
 */
export async function POST(req: NextRequest) {
  let body: EbookOrderInput;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid order.' }, { status: 400 }); }

  const off = unavailableMethod(body.payMethod);
  if (off) return NextResponse.json({ error: off }, { status: 503 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;

  try {
    const order = await createEbookOrder(body, token);
    alertAfterResponse();
    if (order.method === 'pix') return NextResponse.json({ ok: true, ...order });

    const url = await ebookCheckoutUrl(order, String(body.email || ''), thanksUrl(siteUrl(), order.reference, order.lang));
    return NextResponse.json({ ok: true, ...order, url });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/ebook/order:', e);
    return NextResponse.json({ error: 'The payment page did not open. Please try again, or pay with Pix.' }, { status: 500 });
  }
}
