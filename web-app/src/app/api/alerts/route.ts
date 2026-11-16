import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/payments/server';
import { sendNewArrivalAlerts } from '@/lib/email/alerts';

export const dynamic = 'force-dynamic';

/**
 * "Something new was just saved, tell the team." Pinged by the site's forms after they save.
 * Takes no input on purpose: it can only announce rows that really exist, once each (see lib/email/alerts.ts).
 */
export async function POST() {
  try {
    const r = await sendNewArrivalAlerts(supabaseAdmin());
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error('POST /api/alerts:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
