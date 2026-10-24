import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/payments/server';
import { CRAVINGS, isTropicalPlus, type Craving, type CravingPlan } from '@/lib/vontade';
import { PLANS } from '@/lib/vontadePlans';

export const dynamic = 'force-dynamic';

/**
 * The plan for one craving of "Bateu Vontade?".
 *
 *   GET  ?c=salgadinho   the plan: whole for Tropical+ and for the craving a person chose as their gift; for everyone
 *                        else the outline (every phase's title, the first phase in full, the traps' names).
 *   POST { c }           a signed-in person claims their ONE gifted plan (migration 49, app_free_plan).
 *
 * Who someone is comes only from their own session token, so nobody can ask on someone else's behalf.
 */

type Who = { userId: string | null; plus: boolean; gift: Craving | null };

async function who(token: string): Promise<Who> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !token) return { userId: null, plus: false, gift: null };
  const db = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: user } = await db.auth.getUser(token);
  const userId = user.user?.id ?? null;
  if (!userId) return { userId: null, plus: false, gift: null };

  // is_tropical_plus() (migrations 48/49) knows every way in; before it exists, the box and subscription reads.
  let plus = false;
  const { data: rpc, error } = await db.rpc('is_tropical_plus');
  if (!error) plus = rpc === true;
  else {
    const [{ data: j }, { data: subs }] = await Promise.all([
      db.rpc('my_journey'),
      db.from('subscriptions').select('status').eq('user_id', userId).limit(5),
    ]);
    plus = isTropicalPlus(Number((j as { paid_boxes?: number } | null)?.paid_boxes ?? 0), (subs || []).some(s => s.status && s.status !== 'cancelled'));
  }
  const { data: g } = await db.from('app_free_plan').select('craving').eq('user_id', userId).maybeSingle();
  return { userId, plus, gift: (g?.craving as Craving | undefined) ?? null };
}

const tokenOf = (req: NextRequest) => {
  const auth = req.headers.get('authorization') || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
};
const isCraving = (c: unknown): c is Craving => CRAVINGS.some(x => x.id === c);

export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get('c');
  if (!isCraving(c)) return NextResponse.json({ error: 'Vontade desconhecida.' }, { status: 400 });

  let w: Who = { userId: null, plus: false, gift: null };
  try { w = await who(tokenOf(req)); } catch { /* treated as a visitor */ }

  const p = PLANS[c];
  const full = w.plus || w.gift === c;
  const plan: CravingPlan = full
    ? { ...p, full: true }
    : {
        phases: p.phases.map((x, i) => (i === 0 ? x : { when: x.when, title: x.title })),
        traps: p.traps.map(t => ({ trap: t.trap })),
        careful: p.careful,
        full: false,
      };
  return NextResponse.json(
    { plus: w.plus, signedIn: !!w.userId, gift: w.gift, plan },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function POST(req: NextRequest) {
  let body: { c?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }
  if (!isCraving(body.c)) return NextResponse.json({ error: 'Vontade desconhecida.' }, { status: 400 });

  const w = await who(tokenOf(req)).catch(() => null);
  if (!w?.userId) return NextResponse.json({ error: 'Entre na sua conta para ganhar o seu plano.' }, { status: 401 });
  if (w.plus) return NextResponse.json({ ok: true, gift: w.gift });
  if (w.gift) return NextResponse.json({ error: 'Você já escolheu o seu plano de presente.', gift: w.gift }, { status: 409 });

  // ignoreDuplicates: two taps at once still give exactly one gift.
  const { error } = await supabaseAdmin().from('app_free_plan').upsert({ user_id: w.userId, craving: body.c }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) {
    console.error('app_free_plan claim:', error.message);
    return NextResponse.json({ error: /app_free_plan/.test(error.message) ? 'O presente ainda não está ativo (falta rodar a migration 49).' : 'Não deu certo agora. Tente de novo.' }, { status: 500 });
  }
  const { data: g } = await supabaseAdmin().from('app_free_plan').select('craving').eq('user_id', w.userId).maybeSingle();
  return NextResponse.json({ ok: true, gift: g?.craving ?? body.c });
}
