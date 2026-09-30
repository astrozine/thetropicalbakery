import { NextRequest, NextResponse } from 'next/server';
import { ebookAccess, validKey } from '@/lib/payments/ebook';

export const dynamic = 'force-dynamic';

/** Is this buyer's e-book unlocked yet? Needs the order reference AND its key, so a guessed reference reveals nothing. */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref') || '';
  const k = req.nextUrl.searchParams.get('k') || '';
  try {
    if (!validKey(ref, k)) return NextResponse.json({ found: false, paid: false }, { status: 404 });
    return NextResponse.json(await ebookAccess(ref));
  } catch (e) {
    console.error('ebook/access:', e);
    return NextResponse.json({ found: false, paid: false }, { status: 500 });
  }
}
