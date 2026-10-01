import { NextRequest, NextResponse } from 'next/server';
import { ebookAccess, signedEbookUrl, validKey } from '@/lib/payments/ebook';
import { EBOOK } from '@/lib/ebook';

export const dynamic = 'force-dynamic';

/**
 * The download button. Checks the key and the payment, then redirects to a ten-minute signed link to the
 * private PDF (the file is ~38 MB, far too big to pass through a Vercel function, so Storage serves it).
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref') || '';
  const k = req.nextUrl.searchParams.get('k') || '';
  const lang = (req.nextUrl.searchParams.get('lang') || 'en').replace(/[^a-z]/g, '').slice(0, 2);
  const back = new URL(`${EBOOK.thanksPath}?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}&lang=${lang}`, req.nextUrl.origin);

  try {
    if (!validKey(ref, k)) return NextResponse.redirect(new URL(EBOOK.pagePath, req.nextUrl.origin));
    const access = await ebookAccess(ref);
    if (!access.paid) return NextResponse.redirect(back);
    return NextResponse.redirect(await signedEbookUrl());
  } catch (e) {
    console.error('ebook/download:', e);
    back.searchParams.set('erro', '1');
    return NextResponse.redirect(back);
  }
}
