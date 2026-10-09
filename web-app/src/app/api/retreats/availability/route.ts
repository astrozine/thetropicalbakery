import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readBusy, syncRetreatCalendars } from '@/lib/retreatCalendarServer';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET: the nights each retreat room is taken (Airbnb/Booking + our reservations), dates only, for the package
 * builder. Re-reads the platforms first when the copy is more than 10 minutes old, but never makes the visitor
 * wait more than a few seconds for Airbnb: past that, the last copy is served.
 */
export async function GET() {
  try {
    await Promise.race([syncRetreatCalendars(false), new Promise(r => setTimeout(r, 4000))]);
    return NextResponse.json(await readBusy(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'erro' }, { status: 500 });
  }
}

/** POST (admin): "Sincronizar agora" — re-read every platform link right away and say how each one went. */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const asAdmin = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: isAdmin } = await asAdmin.rpc('is_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 });

  const results = await syncRetreatCalendars(true);
  return NextResponse.json({ results, ...(await readBusy()) });
}
