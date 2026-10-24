import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CRAVINGS, isTropicalPlus, type Craving, type CravingPlan } from '@/lib/vontade';
import { PLANS } from '@/lib/vontadePlans';

export const dynamic = 'force-dynamic';

/**
 * The plan for one craving of "Bateu Vontade?" (GET ?c=salgadinho, with the session's bearer token if signed in).
 * Tropical+ gets it whole. Everyone else gets the outline: every phase's title, the first phase in full and the names
 * of the traps, so the free version shows the shape of the plan. Tropical+ is read AS the person (their own token,
 * the same two reads Minha Conta makes), so nobody can ask on someone else's behalf.
 */
async function isPlus(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !token) return false;
  const db = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return false;
  const [{ data: j }, { data: subs }] = await Promise.all([
    db.rpc('my_journey'),
    db.from('subscriptions').select('status').eq('user_id', user.user.id).order('created_at', { ascending: false }).limit(5),
  ]);
  const paidBoxes = Number((j as { paid_boxes?: number } | null)?.paid_boxes ?? 0);
  return isTropicalPlus(paidBoxes, (subs || []).some(s => s.status && s.status !== 'cancelled'));
}

export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get('c') as Craving | null;
  if (!c || !CRAVINGS.some(x => x.id === c)) return NextResponse.json({ error: 'Vontade desconhecida.' }, { status: 400 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  let plus = false;
  try { plus = await isPlus(token); } catch { plus = false; }

  const p = PLANS[c];
  const plan: CravingPlan = plus
    ? { ...p, full: true }
    : {
        phases: p.phases.map((x, i) => (i === 0 ? x : { when: x.when, title: x.title })),
        traps: p.traps.map(t => ({ trap: t.trap })),
        careful: p.careful,
        full: false,
      };
  return NextResponse.json({ plus, plan }, { headers: { 'Cache-Control': 'private, no-store' } });
}
