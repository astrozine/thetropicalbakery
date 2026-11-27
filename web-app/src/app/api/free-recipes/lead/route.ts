import { NextRequest, NextResponse, after } from 'next/server';
import { fbcFromClickId, sendCapiLead } from '@/lib/metaCapi';
import { alertAfterResponse } from '@/lib/email/alerts';
import { OrderError } from '@/lib/payments/order';
import { siteUrl } from '@/lib/payments/server';
import { ebookCheckoutUrl, unavailableMethod } from '@/lib/payments/ebook';
import { createLead, funnelThanksUrl, publicLead, setInterest, type LeadInput } from '@/lib/payments/funnel';

export const dynamic = 'force-dynamic';

const bearer = (req: NextRequest) => {
  const auth = req.headers.get('authorization') || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;
};

/**
 * The free-recipes sign-up. Body: { name, email, lang, segment, utm_*?, referrer?, bump?: { payMethod } }.
 * Saves the lead, e-mails the PDF and, with the order bump ticked, creates the book order (price from the server).
 * Answers with where to go next: the thank-you page, plus the Pix code or the card / PayPal page for the book.
 */
export async function POST(req: NextRequest) {
  let body: LeadInput & { event_id?: string; fbclid?: string; consent?: string; page?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid sign-up.' }, { status: 400 }); }

  if (body.bump) {
    const off = unavailableMethod(body.bump.payMethod);
    if (off) return NextResponse.json({ error: off }, { status: 503 });
  }

  try {
    // The country comes from Vercel's own location header, never from what the visitor sends.
    const lead = await createLead({ ...body, country: req.headers.get('x-vercel-ip-country') }, bearer(req));
    alertAfterResponse();
    // Tell Meta about the sign-up from the server (same event_id as the browser pixel), unless cookies were declined.
    if (body.consent !== 'declined') {
      const email = String(body.email || '');
      const eventId = String(body.event_id || '').slice(0, 80);
      const fbc = req.cookies.get('_fbc')?.value || fbcFromClickId(body.fbclid);
      const fbp = req.cookies.get('_fbp')?.value || null;
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
      const userAgent = req.headers.get('user-agent');
      const url = `${siteUrl()}${String(body.page || '/free-recipes').slice(0, 200)}`;
      after(() => sendCapiLead({ email, eventId, url, ip, userAgent, fbc, fbp }));
    }
    const thanks = funnelThanksUrl(siteUrl(), lead);
    const book = lead.book;
    if (!book) return NextResponse.json({ ok: true, id: lead.id, thanks });
    if (book.method === 'pix') return NextResponse.json({ ok: true, id: lead.id, thanks, book: { reference: book.reference, key: book.key, pix: book.pix } });
    const url = await ebookCheckoutUrl(book, String(body.email || ''), thanks);
    return NextResponse.json({ ok: true, id: lead.id, thanks, url });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/free-recipes/lead:', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again in a moment.' }, { status: 500 });
  }
}

/** The thank-you page reads its own sign-up, by the unguessable id in its link. */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await publicLead(req.nextUrl.searchParams.get('id') || ''));
  } catch (e) {
    console.error('GET /api/free-recipes/lead:', e);
    return NextResponse.json({ found: false }, { status: 500 });
  }
}

/** "What would you love most?" Body: { id, interest }. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    await setInterest(String(body?.id || ''), body?.interest);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('PATCH /api/free-recipes/lead:', e);
    return NextResponse.json({ error: 'Not saved.' }, { status: 500 });
  }
}
