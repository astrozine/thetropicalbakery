import { NextRequest, NextResponse } from 'next/server';
import { OrderError } from '@/lib/payments/order';
import { siteUrl } from '@/lib/payments/server';
import { unavailableMethod } from '@/lib/payments/ebook';
import { buyBookFromLead } from '@/lib/payments/funnel';

export const dynamic = 'force-dynamic';

/**
 * The one-time offer on the free-recipes thank-you page. Body: { id, payMethod }. The name and e-mail come from the
 * sign-up itself, the price from the server. Answers with the Pix code, or the card / PayPal page to go to.
 */
export async function POST(req: NextRequest) {
  let body: { id?: string; payMethod?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid order.' }, { status: 400 }); }
  const off = unavailableMethod(body.payMethod);
  if (off) return NextResponse.json({ error: off }, { status: 503 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;
  try {
    const { book, thanks, url } = await buyBookFromLead(String(body.id || ''), body.payMethod, token, siteUrl());
    return NextResponse.json({ ok: true, thanks, url, reference: book.reference, key: book.key, pix: book.pix });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/free-recipes/book:', e);
    return NextResponse.json({ error: 'The payment page did not open. Please try again, or pay with Pix.' }, { status: 500 });
  }
}
