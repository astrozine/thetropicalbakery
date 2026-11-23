import { NextRequest, NextResponse } from 'next/server';
import { alertAfterResponse } from '@/lib/email/alerts';
import { bonusCallStatus, claimBonusCall, siteBuyer, type ClaimInput } from '@/lib/payments/bonusCall';

export const dynamic = 'force-dynamic';

/**
 * The free call with Dolly that comes with Sweet Escape (lib/bonusCall.ts).
 * GET → { on } (should the pop-ups and cards show?), plus, with ?ref=&k=, the buyer's own details to prefill.
 * POST → save a claim (site order or Amazon order number); the team alert e-mail goes out after the answer.
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref') || '';
  const k = req.nextUrl.searchParams.get('k') || '';
  try {
    const { on } = await bonusCallStatus();
    const buyer = ref && k ? await siteBuyer(ref, k) : null;
    return NextResponse.json({ on, buyer }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('bonus-call GET:', e);
    // Fail open: a buyer must still see their bonus.
    return NextResponse.json({ on: true, buyer: null });
  }
}

export async function POST(req: NextRequest) {
  let body: ClaimInput;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'generic' }, { status: 400 }); }
  try {
    const r = await claimBonusCall(body);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    alertAfterResponse();
    return NextResponse.json({ ok: true, later: r.later });
  } catch (e) {
    console.error('bonus-call POST:', e);
    return NextResponse.json({ error: 'generic' }, { status: 500 });
  }
}
