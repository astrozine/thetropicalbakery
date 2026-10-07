import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/payments/server';
import { BOOK_PERK, hasBookPerk } from '@/lib/bookPerk';

export const dynamic = 'force-dynamic';

/**
 * Does the SIGNED-IN visitor have the reader's gift (15% off, lib/bookPerk.ts)? Lets the checkout and the brunch panel
 * show the lower price before paying. Answers only for the address of the session itself, never for an e-mail in the
 * request, so nobody can use it to find out who bought the book. The discount itself is always decided again when
 * the order is created.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return NextResponse.json({ perk: false });
  try {
    const db = supabaseAdmin();
    const { data } = await db.auth.getUser(token);
    const perk = await hasBookPerk(db, data.user?.email);
    return NextResponse.json({ perk, percent: BOOK_PERK.percent });
  } catch {
    return NextResponse.json({ perk: false });
  }
}
