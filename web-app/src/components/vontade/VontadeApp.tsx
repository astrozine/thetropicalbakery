'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ALLERGENS } from '@/lib/allergens';
import { trackMeta } from '@/lib/metaPixel';
import LoginPanel from '@/components/LoginPanel';
import IconTile from '@/components/IconTile';
import DollyChat from '@/components/DollyChat';
import {
  APP_PLUS, CRAVINGS, CRAVING_GROUPS, TIMES, RESCUES, GUIDELINES, GUIDES, GBOMBS, DENSITY, EFFORT_LABEL, STORE_KEY,
  cravingOf, densityInsight, emptyStore, freeCount, isTropicalPlus, lastSevenDays, missingFor, pantryFor, pantryLabel,
  rankRescues, rescueFromRow, streak, todayISO, topCraving,
  type RecipeCard, type RecipeRow, type CravingPlan,
  type Craving, type Rescue, type TimeBudget, type VontadeStore,
} from '@/lib/vontade';
import './vontade.css';

type Tab = 'hoje' | 'vontades' | 'receitas' | 'plus';
type Step = 'home' | 'craving' | 'time' | 'pantry' | 'result' | 'won';

const SHARE_URL = 'https://the-tropical-bakery.vercel.app/vontade';

/** A short tap on phones that can (Android); silent everywhere else. */
const buzz = () => { try { navigator.vibrate?.(8); } catch { /* not supported */ } };

function readStore(): VontadeStore {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const s = JSON.parse(raw);
    const strings = (a: unknown) => (Array.isArray(a) ? a.filter((w): w is string => typeof w === 'string') : []);
    const log = Array.isArray(s.log) ? s.log.filter((l: { d?: unknown; c?: unknown }) => typeof l?.d === 'string' && cravingOf(String(l.c))) : [];
    const gb: Record<string, string[]> = {};
    if (s.gb && typeof s.gb === 'object') for (const [k, v] of Object.entries(s.gb)) gb[k] = strings(v);
    return { wins: strings(s.wins), pantry: strings(s.pantry), log, gb };
  } catch { return emptyStore(); }
}
function writeStore(s: VontadeStore) {
  // Keep it small: the last 400 wins and cravings, the last 60 days of G-BOMBS.
  const days = Object.keys(s.gb).sort().slice(-60);
  const trimmed = { ...s, wins: s.wins.slice(-400), log: s.log.slice(-400), gb: Object.fromEntries(days.map(d => [d, s.gb[d]])) };
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(trimmed)); } catch { /* private window: the app still works */ }
}

/**
 * What this person has: Tropical+ (bought in the app, or a thank-you for box buyers and subscribers: all decided by
 * is_tropical_plus(), migration 49) and their gifted plan (app_free_plan). `refresh` re-reads after a purchase.
 */
function useAccess() {
  const { user, loading } = useAuth();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ checked: boolean; plus: boolean; gift: Craving | null }>({ checked: false, plus: false, gift: null });
  useEffect(() => {
    if (loading) return;
    if (!user) { setState({ checked: true, plus: false, gift: null }); return; }
    let alive = true;
    (async () => {
      let plus = false;
      const { data: rpc, error } = await supabase.rpc('is_tropical_plus');
      if (!error) plus = rpc === true;
      else {
        // Before migration 48/49: the two reads Minha Conta makes.
        const [{ data: j }, { data: subs }] = await Promise.all([
          supabase.rpc('my_journey'),
          supabase.from('subscriptions').select('status').order('created_at', { ascending: false }).limit(5),
        ]);
        plus = isTropicalPlus(Number((j as { paid_boxes?: number } | null)?.paid_boxes ?? 0), (subs || []).some(s => s.status && s.status !== 'cancelled'));
      }
      const { data: g } = await supabase.from('app_free_plan').select('craving').eq('user_id', user.id).maybeSingle();
      if (alive) setState({ checked: true, plus, gift: (g?.craving as Craving | undefined) ?? null });
    })().catch(() => { if (alive) setState({ checked: true, plus: false, gift: null }); });
    return () => { alive = false; };
  }, [user, loading, tick]);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  return { ...state, signedIn: !!user, refresh };
}
type Access = ReturnType<typeof useAccess>;

/**
 * The recipes Dolly published in /admin/app-receitas (migration 48). Every card comes from app_recipe_cards(); the
 * full recipe only when the table lets this person read it (free, or Tropical+), so a locked one never reaches the
 * phone. Until migration 48 runs: the built-in launch set, unlocked by the same Tropical+ rule in the browser.
 */
function useRescues(signedInId: string | null) {
  const [state, setState] = useState<{ list: Rescue[]; fromDb: boolean }>({ list: RESCUES, fromDb: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: cards, error } = await supabase.rpc('app_recipe_cards');
      if (error || !Array.isArray(cards) || cards.length === 0) return;
      const { data: rows } = await supabase.from('app_recipes').select('*').eq('published', true);
      const full = new Map(((rows || []) as RecipeRow[]).map(r => [r.slug, r]));
      const list = (cards as RecipeCard[]).map(c => {
        const row = full.get(c.slug);
        return row ? rescueFromRow(row) : rescueFromRow(c, true);
      });
      if (alive) setState({ list, fromDb: true });
    })().catch(() => {});
    return () => { alive = false; };
  }, [signedInId]);
  return state;
}

/** One craving's plan from /api/vontade/plan: whole for Tropical+, the outline for everyone else. */
function usePlan(c: Craving, signedInId: string | null, again: unknown) {
  const [state, setState] = useState<{ loading: boolean; plan: CravingPlan | null }>({ loading: true, plan: null });
  useEffect(() => {
    let alive = true;
    setState({ loading: true, plan: null });
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch(`/api/vontade/plan?c=${c}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const j = await res.json();
      if (alive) setState({ loading: false, plan: j.plan ?? null });
    })().catch(() => { if (alive) setState({ loading: false, plan: null }); });
    return () => { alive = false; };
  }, [c, signedInId, again]);
  return state;
}

const Lock = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" /></svg>
);

const waitLabel = (m: number) => (m >= 60 ? `${Math.round(m / 60)}h esperando` : `${m} min esperando`);
const timeLabel = (r: Rescue) => (r.waitMinutes ? `${r.minutes} min + ${waitLabel(r.waitMinutes)}` : `${r.minutes} min`);
const cssVars = (v: Record<string, string>) => v as React.CSSProperties;

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/**
 * /vontade: "Bateu Vontade?", the craving app. Any craving (sweet, salt, umami, cheese, fried, soda, bread) gets the
 * same pleasure back inside whole plant food. Feels like its own app (full screen, its own tab bar, can be added to
 * the home screen), designed like the game-like habit apps: chunky pressable buttons, progress always in sight.
 *
 * Free: the rescue flow, every craving's guide (what you really want, the swaps, the honest truth), the G-BOMBS day
 * tracker and the free recipes. Tropical+ (comes with a box or the subscription): every recipe and every craving's
 * full plan. Data and rules: lib/vontade.ts; plans: lib/vontadePlans.ts via /api/vontade/plan.
 */
export default function VontadeApp() {
  const access = useAccess();
  const [tab, setTab] = useState<Tab>('hoje');
  const [step, setStep] = useState<Step>('home');
  const [craving, setCraving] = useState<Craving | null>(null);
  const [time, setTime] = useState<TimeBudget | null>(null);
  const [pantry, setPantry] = useState<string[]>([]);
  const [pick, setPick] = useState(0);
  const [store, setStore] = useState<VontadeStore>(emptyStore);
  const [open, setOpen] = useState<Rescue | null>(null);
  const [guide, setGuide] = useState<Craving | null>(null);
  const [filter, setFilter] = useState<Craving | 'todas'>('todas');
  const [shared, setShared] = useState('');

  const [paidNote, setPaidNote] = useState('');

  useEffect(() => {
    const s = readStore();
    setStore(s);
    setPantry(s.pantry);
    trackMeta('ViewContent', { content_name: 'app-vontade', content_type: 'product', value: 0 });
  }, []);

  // Back from the card page (Mercado Pago): ask Mercado Pago itself what happened, then re-read the access.
  const { refresh } = access;
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ref = q.get('pago');
    if (!ref) return;
    const paymentId = q.get('payment_id') || q.get('collection_id');
    window.history.replaceState(null, '', '/vontade');
    setTab('plus');
    if (!paymentId || q.get('result') === 'failure') { setPaidNote('O pagamento não foi concluído. Pode tentar de novo quando quiser, ou pagar por Pix.'); return; }
    fetch('/api/pay/mercadopago/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_id: paymentId }) })
      .then(r => r.json())
      .then(j => {
        setPaidNote(j.ok ? 'Pagamento confirmado. Obrigada! 🌴' : 'Estamos esperando o Mercado Pago confirmar. Assim que confirmar, libera sozinho e você recebe um e-mail.');
        refresh();
      })
      .catch(() => setPaidNote('Estamos esperando a confirmação do pagamento. Você recebe um e-mail assim que liberar.'));
  }, [refresh]);

  const { user, loading: authLoading } = useAuth();
  // Signed in from the guest sheet: they had just hit the bag, so pick up right there, at the first question.
  useEffect(() => {
    if (!user) return;
    try {
      if (sessionStorage.getItem(NEXT_KEY) !== 'craving') return;
      sessionStorage.removeItem(NEXT_KEY);
    } catch { return; }
    setTab('hoje'); setStep('craving');
  }, [user]);
  const { list, fromDb } = useRescues(user?.id ?? null);
  const unlocked = useCallback((r: Rescue) => (fromDb ? !r.locked : r.free || access.plus), [fromDb, access.plus]);
  const ranked = useMemo(() => (craving && time ? rankRescues(list, craving, time, pantry) : []), [list, craving, time, pantry]);
  const free = freeCount(list);
  const open_ = ranked.filter(unlocked);
  const current = open_.length ? open_[pick % open_.length] : null;
  // Mid-craving we only help: no locks, no offers. The one exception is honest information: when the same craving
  // keeps coming back, say so, and point to its (free) guide.
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return todayISO(d); })();
  const repeats = craving ? store.log.filter(l => l.c === craving && l.d >= weekAgo).length : 0;

  const save = (next: VontadeStore) => { setStore(next); writeStore(next); };
  const scrollTop = () => document.querySelector('.va-scroll')?.scrollTo({ top: 0 });
  const go = (t: Tab) => { buzz(); setTab(t); setOpen(null); setGuide(null); if (t === 'hoje' && step === 'won') setStep('home'); scrollTop(); };

  /** A craving hit: log it (the G-BOMBS insight needs it) and go to the next question. */
  const chooseCraving = (c: Craving) => {
    buzz();
    setCraving(c); setPick(0); setStep('time');
    save({ ...store, log: [...store.log, { d: todayISO(), c }] });
    setTab('hoje'); setGuide(null); setOpen(null); scrollTop();
  };

  const win = () => {
    buzz();
    save({ ...store, wins: [...store.wins, todayISO()] });
    setStep('won'); setOpen(null); setGuide(null); setTab('hoje'); scrollTop();
  };

  const togglePantry = (key: string) => {
    buzz();
    const next = pantry.includes(key) ? pantry.filter(k => k !== key) : [...pantry, key];
    setPantry(next);
    save({ ...store, pantry: next });
  };

  const today = todayISO();
  const ticked = store.gb[today] ?? [];
  const toggleGb = (id: string) => {
    buzz();
    const next = ticked.includes(id) ? ticked.filter(x => x !== id) : [...ticked, id];
    save({ ...store, gb: { ...store.gb, [today]: next } });
  };

  const share = async () => {
    const n = store.wins.length;
    const text = `Bateu vontade e eu venci ${n === 1 ? 'pela primeira vez' : `${n} vezes`} com o app da The Tropical Bakery 🌴 Doce, salgado, fritura, queijo, refri: toda vontade tem uma troca feita só de planta, em minutos:`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Bateu Vontade?', text, url: SHARE_URL }); return; }
      await navigator.clipboard.writeText(`${text} ${SHARE_URL}`);
      setShared('Link copiado! Cole no WhatsApp ou no Instagram.');
    } catch { /* cancelled */ }
  };

  const week = lastSevenDays(store.wins);
  const days = streak(store.wins);
  const weekWins = week.reduce((n, d) => n + d.count, 0);
  const g = craving ? GUIDES[craving] : null;
  const gbCard = <GbombsCard ticked={ticked} onToggle={toggleGb} />;
  const weekCard = (
    <div className="va-card va-week">
      <div className="va-week__head">
        <span><IconTile size={30}>🔥</IconTile> {days > 0 ? `${days} ${days === 1 ? 'dia' : 'dias'} seguidos` : 'Comece sua sequência hoje'}</span>
        <strong>{weekWins} {weekWins === 1 ? 'vitória' : 'vitórias'} na semana</strong>
      </div>
      <ol className="va-dots">
        {week.map(d => (
          <li key={d.iso} data-on={d.count > 0 || undefined} data-today={d.iso === today || undefined}>
            <span>{d.count > 0 ? '✓' : ''}</span><small>{d.label}</small>
          </li>
        ))}
      </ol>
    </div>
  );
  const cv = craving ? cravingOf(craving) : null;
  const firstName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '').trim().split(' ')[0];

  // The app is for members of the site: a free account first, always (Andrew, 2026-10-23).
  if (authLoading) return <div className="va-shell va-splash"><img src="/vontade/dolly-avatar.webp" alt="" width={72} height={72} /></div>;
  if (!user) return <GuestApp />;

  return (
    <div className="va-shell">
      <header className="va-top">
        <Link href="/" className="va-brand" aria-label="The Tropical Bakery: voltar ao site">
          <img src="/hero-logo-transparent.png" alt="" width={32} height={32} />
          <strong>Bateu Vontade?</strong>
        </Link>
        <div className="va-stats">
          <span className="va-stat" data-on={days > 0 || undefined} title="Dias seguidos"><span aria-hidden>🔥</span>{days}</span>
          <span className="va-stat va-stat--green" data-on={ticked.length > 0 || undefined} title="G-BOMBS de hoje"><span aria-hidden>🥬</span>{ticked.length}/6</span>
          <span className="va-stat" data-on={store.wins.length > 0 || undefined} title="Vontades vencidas"><span aria-hidden>🏆</span>{store.wins.length}</span>
          {access.plus && <span className="va-stat va-stat--plus" title="Tropical+"><span aria-hidden>🌴</span>+</span>}
        </div>
      </header>

      <div className="va-scroll">
        {open ? (
          <RecipeView r={open} pantry={pantry} onBack={() => setOpen(null)} onWin={win} />
        ) : guide ? (
          <GuideView c={guide} list={list} unlocked={unlocked} userId={user?.id ?? null} access={access}
            onBack={() => setGuide(null)} onRecipe={r => (unlocked(r) ? setOpen(r) : go('plus'))} onNow={() => chooseCraving(guide)} onPlus={() => go('plus')} />
        ) : tab === 'hoje' ? (
          <section className="va-screen" key={step}>
            {step === 'home' && (
              <div className="va-home">
                <Arena
                  name={firstName} energy={ticked.length} foe={Math.max(0, 100 - weekWins * 20)} streak={days} round={store.wins.length + 1}
                  lines={homeLines(days, ticked.length, store.wins.length, firstName)} onHit={() => setStep('craving')}
                />
                <div className="va-day">
                  {gbCard}
                  <div>
                    {weekCard}
                    <Insight store={store} onGuide={c => { buzz(); setGuide(c); scrollTop(); }} />
                  </div>
                </div>
                <InstallHint />
                <Guidelines />
              </div>
            )}

            {step === 'craving' && (
              <Question n={1} title="Bateu vontade de quê?" onBack={() => setStep('home')}>
                <DollyChat lines={['Respira. Tô aqui com você. 🤍', 'Me conta: bateu vontade de quê?']} />
                {CRAVING_GROUPS.map(grp => (
                  <div key={grp.id} className="va-group">
                    <h2 className="va-group__label">{grp.label}</h2>
                    <div className="va-grid">
                      {CRAVINGS.filter(c => c.group === grp.id).map(c => (
                        <button key={c.id} className="va-choice" style={cssVars({ '--c': c.hex, color: c.ink })} onClick={() => chooseCraving(c.id)}>
                          <span className="va-choice__emoji" aria-hidden>{c.emoji}</span>
                          <strong>{c.label}</strong><small>{c.hint}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </Question>
            )}

            {step === 'time' && cv && (
              <Question n={2} title="Quanto tempo você tem?" onBack={() => setStep('craving')} chip={`${cv.emoji} ${cv.label}`}>
                <div className="va-list">
                  {TIMES.map(t => (
                    <button key={t.id} className="va-row" onClick={() => { buzz(); setTime(t.id); setPick(0); setStep('pantry'); }}>
                      <IconTile size={46}>{t.emoji}</IconTile>
                      <span><strong>{t.label}</strong><small>{t.hint}</small></span>
                      <span aria-hidden className="va-row__go">›</span>
                    </button>
                  ))}
                </div>
              </Question>
            )}

            {step === 'pantry' && craving && cv && (
              <Question n={3} title="O que tem aí na cozinha?" sub="Toque no que tiver. Fica salvo para a próxima vez." onBack={() => setStep('time')} chip={`${cv.emoji} ${cv.label}`}>
                <div className="va-chips">
                  {pantryFor(list, craving).map(p => (
                    <button key={p.key} className="va-chip" aria-pressed={pantry.includes(p.key)} onClick={() => togglePantry(p.key)}>
                      <span aria-hidden>{p.emoji}</span> {p.label}
                    </button>
                  ))}
                </div>
                <div className="va-dock">
                  <button className="va-btn" onClick={() => { buzz(); setPick(0); setStep('result'); }}>
                    {pantry.length ? 'Me salva, Dolly!' : 'Pular e ver a troca'}
                  </button>
                </div>
              </Question>
            )}

            {step === 'result' && craving && g && cv && (
              <div className="va-result">
                <button className="va-back" onClick={() => setStep('pantry')}>‹ Voltar</button>
                <DollyChat lines={['Achei a sua troca! 🙌', 'Faz essa comigo. Se faltar alguma coisa, improvisa: o que importa é a troca.']} />
                <div className="va-same" style={cssVars({ '--c': cv.hex })}>
                  <small>O mesmo prazer, dentro da fibra</small>
                  <strong>{g.principle}</strong>
                </div>
                {current ? (
                  <>
                    <RecipeCardView r={current} pantry={pantry} onOpen={() => { buzz(); setOpen(current); }} />
                    <div className="va-actions">
                      <button className="va-btn" onClick={() => { buzz(); setOpen(current); }}>Fazer agora</button>
                      {open_.length > 1 && <button className="va-btn va-btn--ghost" onClick={() => { buzz(); setPick(p => p + 1); }}>Outra opção ↻</button>}
                    </div>
                  </>
                ) : (
                  <SwapList c={craving} />
                )}
                <button className="va-card va-next" onClick={() => { buzz(); setGuide(craving); scrollTop(); }}>
                  <IconTile size={46}>{cv.emoji}</IconTile>
                  {repeats >= 3
                    ? <span><strong>{repeats}ª vez nesta semana: {cv.label.toLowerCase()}</strong><small>Quando ela volta assim, tem motivo. Veja o que ela procura e como fazer ela parar de voltar.</small></span>
                    : <span><strong>Vencer essa vontade de vez</strong><small>O que ela procura, quanto tempo leva e o plano semana a semana</small></span>}
                  <span aria-hidden className="va-row__go">›</span>
                </button>
                <LetDollyBake />
              </div>
            )}

            {step === 'won' && (
              <div className="va-won">
                <div className="va-confetti" aria-hidden>{['🌴', '🍋', '🥭', '🍄', '✨', '🌺', '🥑', '✨'].map((e, i) => <span key={i} style={cssVars({ '--i': String(i) })}>{e}</span>)}</div>
                <DollyPhoto src="/vontade/dolly-tray.webp">Isso! Mais uma vencida. Tô orgulhosa de você. 🌴</DollyPhoto>
                <p className="va-kicker">Vontade vencida!</p>
                <h1 className="va-title">{store.wins.length === 1 ? 'Sua primeira vitória.' : `${store.wins.length} vitórias.`}</h1>
                <p className="va-lead">{days > 1 ? `${days} dias seguidos escolhendo o que faz bem.` : 'O mesmo prazer, só de planta. Amanhã tem mais.'}</p>
                <div className="va-actions">
                  <button className="va-btn" onClick={share}>Contar para uma amiga 💛</button>
                  <button className="va-btn va-btn--ghost" onClick={() => setStep('home')}>Voltar ao início</button>
                </div>
                {shared && <p className="va-note" role="status">{shared}</p>}
                {craving && <WinOffer c={craving} access={access} onGuide={() => { buzz(); setGuide(craving); scrollTop(); }} onPlus={() => go('plus')} />}
                <Link href="/receitas?utm_source=app-vontade" className="va-card va-next">
                  <IconTile size={46}>🎁</IconTile>
                  <span><strong>Ganhe 2 receitas completas de festa</strong><small>Do livro Sweet Escape da Dolly, grátis no seu e-mail</small></span>
                  <span aria-hidden className="va-row__go">›</span>
                </Link>
              </div>
            )}
          </section>
        ) : tab === 'vontades' ? (
          <section className="va-screen">
            <p className="va-kicker">Guia das vontades</p>
            <h1 className="va-title">Toda vontade tem troca.</h1>
            <p className="va-lead">Escolha uma e veja o que ela procura de verdade, o que colocar no lugar e quanto tempo leva, sem enrolação.</p>
            {CRAVING_GROUPS.map(grp => (
              <div key={grp.id} className="va-group">
                <h2 className="va-group__label">{grp.label}</h2>
                <div className="va-guides">
                  {CRAVINGS.filter(c => c.group === grp.id).map(c => (
                    <button key={c.id} className="va-gcard" style={cssVars({ '--c': c.hex, color: c.ink })} onClick={() => { buzz(); setGuide(c.id); scrollTop(); }}>
                      <span className="va-gcard__emoji" aria-hidden>{c.emoji}</span>
                      <strong>{c.label}</strong>
                      <Effort n={GUIDES[c.id].effort} small />
                      <small>{EFFORT_LABEL[GUIDES[c.id].effort]} · {GUIDES[c.id].reset}</small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : tab === 'receitas' ? (
          <section className="va-screen">
            <p className="va-kicker">Receitas de resgate</p>
            <h1 className="va-title">{list.length} trocas, todas em minutos.</h1>
            <p className="va-lead">{list.every(unlocked) ? 'Você tem todas. Bom proveito!' : `${free} grátis para sempre. As outras ${list.length - free} vêm com o Tropical+.`}</p>
            <div className="va-filter" role="tablist" aria-label="Filtrar por vontade">
              {[{ id: 'todas' as const, emoji: '✨', label: 'Todas' }, ...CRAVINGS].map(c => (
                <button key={c.id} role="tab" aria-selected={filter === c.id} className="va-chip" onClick={() => { buzz(); setFilter(c.id); }}>
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
            <div className="va-lib">
              {list.filter(r => filter === 'todas' || r.cravings.includes(filter)).map(r => (
                <RecipeTile key={r.id} r={r} unlocked={unlocked(r)} onOpen={() => { buzz(); if (unlocked(r)) setOpen(r); else go('plus'); }} />
              ))}
            </div>
          </section>
        ) : (
          <PlusScreen access={access} total={list.length} free={free} note={paidNote} />
        )}
      </div>

      <nav className="va-tabs" aria-label="App">
        <SideBrand />
        {([
          ['hoje', '🏠', 'Hoje'],
          ['vontades', '🧭', 'Vontades'],
          ['receitas', '📖', 'Receitas'],
          ['plus', '🌴', 'Tropical+'],
        ] as const).map(([id, emoji, label]) => (
          <button key={id} aria-current={(tab === id && !open && !guide) || undefined} onClick={() => { go(id); if (id === 'hoje') setStep('home'); }}>
            <span className="va-tabs__icon" aria-hidden>{emoji}</span>{label}
          </button>
        ))}
      </nav>

    </div>
  );
}

const NEXT_KEY = 'tb-vontade-next';

/**
 * What someone who isn't signed in gets: the real home, entertainment first. Dolly says hi and the punching bag is
 * there, faded, the burger and the soda still jabbing. Hitting it plays the whole POW, and only then Dolly's chat
 * slides up with the free sign-up ("essa doeu, hein?"). Any other tab opens the same sheet. After signing in they
 * land right in the first question (NEXT_KEY), so the sign-up leads into the experience instead of guarding it.
 */
function GuestApp() {
  const [sheet, setSheet] = useState<'' | 'hit' | 'tab'>('');
  const open = (why: 'hit' | 'tab') => {
    try { sessionStorage.setItem(NEXT_KEY, why === 'hit' ? 'craving' : 'home'); } catch { /* still fine */ }
    setSheet(why);
  };
  const free = [
    { emoji: '🥊', text: 'Socorro na hora: doce, sal, fritura, queijo, refri' },
    { emoji: '🌱', text: 'A troca certa, feita de planta, em 2 a 5 minutos' },
    { emoji: '🥬', text: 'G-BOMBS do dia, sequência e vitórias' },
    { emoji: '🎁', text: 'Um plano completo de presente' },
  ];
  return (
    <div className="va-shell">
      <header className="va-top">
        <Link href="/" className="va-brand" aria-label="The Tropical Bakery: voltar ao site">
          <img src="/hero-logo-transparent.png" alt="" width={32} height={32} />
          <strong>Bateu Vontade?</strong>
        </Link>
        <button className="va-btn va-btn--ghost va-btn--sm" onClick={() => open('tab')}>Entrar</button>
      </header>
      <div className="va-scroll">
        <section className="va-screen va-home">
          <Arena
            name="" energy={0} foe={100} streak={0} round={1} faded
            lines={['Oi! Eu sou a Dolly 👋', 'Doce, sal, fritura, queijo, refri: toda vontade tem uma troca feita de planta.', 'Tá com raiva da vontade? Bate no saco. 🥊']}
            onHit={() => open('hit')}
          />
          <ul className="va-perks va-guest__perks">{free.map(p => <li key={p.text}><IconTile size={40}>{p.emoji}</IconTile><span>{p.text}</span></li>)}</ul>
        </section>
      </div>
      <nav className="va-tabs" aria-label="App">
        <SideBrand />
        {([['🏠', 'Hoje'], ['🧭', 'Vontades'], ['📖', 'Receitas'], ['🌴', 'Tropical+']] as const).map(([emoji, label], i) => (
          <button key={label} aria-current={i === 0 || undefined} onClick={() => (i === 0 ? null : open('tab'))}>
            <span className="va-tabs__icon" aria-hidden>{emoji}</span>{label}
          </button>
        ))}
      </nav>


      {sheet && (
        <div className="va-sheet" role="dialog" aria-modal="true" aria-label="Crie a sua conta grátis">
          <button className="va-sheet__backdrop" aria-label="Fechar" onClick={() => setSheet('')} />
          <div className="va-sheet__panel">
            <span className="va-sheet__grip" aria-hidden />
            <img className="va-sheet__photo" src="/vontade/dolly-tray.webp" alt="Dolly oferecendo docinhos no jardim" />
            <div className="va-sheet__body">
            <DollyChat key={sheet} lines={sheet === 'hit'
              ? ['Essa doeu, hein? 😅', 'Agora deixa comigo: eu te mostro a troca certa em 3 toques.', 'Só crie a sua conta grátis antes, pra eu guardar as suas vitórias. Leva 10 segundos.']
              : ['Opa! Isso fica dentro da sua conta. 🙂', 'Crie a sua conta grátis e é tudo seu: as trocas, os guias e o seu plano de presente.']} />
            <div className="va-card va-card--light va-sheet__login">
              <LoginPanel message="Crie a sua conta grátis" subMessage="Com Google ou Facebook é um toque. Ou receba um link no e-mail." />
            </div>
            <p className="va-fine va-center">Sem cartão, sem cobrança. Seus dados ficam só com a gente.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SOUND_KEY = 'tb-vontade-sound';

/** A punch, synthesized (no audio file to license): a low thump with a short slap of noise on top. */
function punchSound() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(170, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.3);
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
    n.buffer = buf; f.type = 'lowpass'; f.frequency.value = 2400; ng.gain.value = 0.55;
    n.connect(f).connect(ng).connect(ctx.destination);
    n.start(t);
    window.setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch { /* no sound, no problem */ }
}

/**
 * The home as a fight screen. On a phone it's the stack people know (title, Dolly, the bag). From 900px it's a
 * game on a TV: a dark arena under spotlights with ring ropes and a mat, fighting-game bars on top (YOU: energy =
 * today's G-BOMBS; THE CRAVING: life drops 20 points per win this week), the round and the streak in the middle,
 * an arcade title, the bag big, "click or press space", and Dolly in a story-mode dialog box at the bottom.
 * The punch has a sound (on by default with a mouse, off on touch screens; the speaker button remembers).
 */
function Arena({ name, energy, foe, streak, round, lines, faded, onHit }: {
  name: string; energy: number; foe: number; streak: number; round: number; lines: string[]; faded?: boolean; onHit: () => void;
}) {
  const [sound, setSound] = useState(false);
  useEffect(() => {
    let on = !window.matchMedia('(pointer: coarse)').matches;
    try { const v = localStorage.getItem(SOUND_KEY); if (v) on = v === '1'; } catch { /* default */ }
    setSound(on);
  }, []);
  const toggle = () => {
    const next = !sound;
    setSound(next);
    try { localStorage.setItem(SOUND_KEY, next ? '1' : '0'); } catch { /* still toggles */ }
  };
  return (
    <div className={`va-arena${faded ? ' va-arena--guest' : ''}`}>
      <div className="va-hud" aria-hidden>
        <div className="va-hud__side">
          <img src="/vontade/dolly-avatar.webp" alt="" width={44} height={44} />
          <div className="va-hud__info">
            <b>{name ? name.toUpperCase() : 'VOCÊ'}</b>
            <span className="va-hud__bar va-hud__bar--you"><i style={{ width: `${(energy / 6) * 100}%` }} /></span>
            <small>Energia · G-BOMBS {energy}/6</small>
          </div>
        </div>
        <div className="va-hud__mid">
          <small>Round</small>
          <b>{round}</b>
          <span>🔥 {streak}</span>
        </div>
        <div className="va-hud__side va-hud__side--foe">
          <div className="va-hud__info">
            <b>A VONTADE</b>
            <span className="va-hud__bar va-hud__bar--foe"><i style={{ width: `${foe}%` }} /></span>
            <small>Vida {foe}%</small>
          </div>
          <span className="va-hud__foe"><img src="/vontade/fx/burger.webp" alt="" /><img src="/vontade/fx/shake.webp" alt="" /></span>
        </div>
      </div>
      <button className="va-hud__sound" onClick={toggle} aria-label={sound ? 'Tirar o som' : 'Ligar o som'} aria-pressed={sound}>{sound ? '🔊' : '🔇'}</button>

      <div className="va-arena__title">
        <p className="va-kicker">{greeting()} 🌴</p>
        <h1 className="va-title">Bateu vontade?</h1>
      </div>
      <div className="va-arena__dialog">
        <DollyChat lines={lines} />
      </div>
      <div className="va-arena__stage">
        <span className="va-arena__ropes" aria-hidden><i /><i /><i /></span>
        <PunchBag faded={faded} sound={sound} hotkey onHit={onHit} />
        <p className="va-ring__cap">Quando a vontade bate, bate forte. <strong>Toque no saco e revide!</strong></p>
        <p className="va-arena__press" aria-hidden>Clique no saco · ou aperte espaço</p>
      </div>
    </div>
  );
}

/** The brand at the top of the desktop sidebar (on phones the top bar carries it). */
function SideBrand() {
  return (
    <Link href="/" className="va-tabs__brand" aria-label="The Tropical Bakery: voltar ao site">
      <img src="/hero-logo-transparent.png" alt="" width={40} height={40} />
      <span><strong>Bateu Vontade?</strong><small>by The Tropical Bakery</small></span>
    </Link>
  );
}

function Question({ n, title, sub, chip, onBack, children }: { n: number; title: string; sub?: string; chip?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="va-q">
      <div className="va-q__top">
        <button className="va-back va-back--x" onClick={onBack} aria-label="Voltar">‹</button>
        <span className="va-progress" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={n} aria-label={`Pergunta ${n} de 3`}>
          <i style={{ width: `${(n / 3) * 100}%` }} />
        </span>
      </div>
      {chip && <span className="va-pill">{chip}</span>}
      <h1 className="va-title va-title--q">{title}</h1>
      {sub && <p className="va-lead">{sub}</p>}
      {children}
    </div>
  );
}

/** Six taps a day: the denser the day, the weaker the craving. */
function GbombsCard({ ticked, onToggle }: { ticked: string[]; onToggle: (id: string) => void }) {
  const n = ticked.length;
  const msg = n === 0 ? 'Cada um que entra no prato enfraquece a próxima vontade.'
    : n < 4 ? `Bom começo! Com 4, a vontade costuma perder força.`
      : n < 6 ? 'Dia denso! A vontade fica bem mais fraca.'
        : 'G-BOMBS completo. Que dia! 🎉';
  return (
    <div className="va-card va-gb">
      <div className="va-gb__head">
        <span><IconTile size={30}>🥬</IconTile><strong>Prato denso hoje</strong></span>
        <b>{n}/6</b>
      </div>
      <span className="va-bar" aria-hidden><i style={{ width: `${(n / 6) * 100}%` }} /></span>
      <div className="va-gb__grid">
        {GBOMBS.map(b => (
          <button key={b.id} className="va-gb__item" aria-pressed={ticked.includes(b.id)} onClick={() => onToggle(b.id)}>
            <span className="va-gb__letter" aria-hidden>{b.letter}</span>
            <span className="va-gb__emoji" aria-hidden>{b.emoji}</span>
            <small>{b.label}</small>
          </button>
        ))}
      </div>
      <p className="va-gb__msg">{msg}</p>
      <details className="va-more">
        <summary>{DENSITY.title} <span aria-hidden>▾</span></summary>
        {DENSITY.text.map(t => <p key={t}>{t}</p>)}
        <p className="va-fine">{DENSITY.note}</p>
      </details>
    </div>
  );
}

/** The person's own evidence: cravings on dense days vs the rest. Before there's enough data, their top craving. */
function Insight({ store, onGuide }: { store: VontadeStore; onGuide: (c: Craving) => void }) {
  const ins = densityInsight(store);
  const top = topCraving(store);
  if (ins) {
    const max = Math.max(ins.dense, ins.light, 0.1);
    const f = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return (
      <div className="va-card va-insight">
        <p className="va-kicker">O seu corpo, em números</p>
        <div className="va-insight__row"><span>Dias densos (4+)</span><span className="va-insight__bar"><i data-tone="good" style={{ width: `${(ins.dense / max) * 100}%` }} /></span><b>{f(ins.dense)}</b></div>
        <div className="va-insight__row"><span>Os outros dias</span><span className="va-insight__bar"><i style={{ width: `${(ins.light / max) * 100}%` }} /></span><b>{f(ins.light)}</b></div>
        <small>vontades por dia, nos últimos 30 dias</small>
      </div>
    );
  }
  if (!top) return null;
  const c = cravingOf(top)!;
  return (
    <button className="va-card va-next" onClick={() => onGuide(top)}>
      <IconTile size={46}>{c.emoji}</IconTile>
      <span><strong>Sua vontade mais frequente: {c.label}</strong><small>Veja o que ela procura de verdade e como vencer de vez</small></span>
      <span aria-hidden className="va-row__go">›</span>
    </button>
  );
}

function Effort({ n, small }: { n: number; small?: boolean }) {
  return (
    <span className={`va-effort${small ? ' va-effort--sm' : ''}`} role="img" aria-label={`Dificuldade ${n} de 5: ${EFFORT_LABEL[n]}`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} data-on={i <= n || undefined} data-level={n} />)}
    </span>
  );
}

function SwapList({ c }: { c: Craving }) {
  return (
    <ul className="va-swaps">
      {GUIDES[c].swaps.map(s => (
        <li key={s.to}>
          <span className="va-swaps__from">{s.from}</span>
          <span className="va-swaps__arrow" aria-hidden>↓</span>
          <strong>{s.to}</strong>
          <small>{s.why}</small>
        </li>
      ))}
    </ul>
  );
}

/** One craving, the whole portal page: free guide on top, the Tropical+ plan below it. */
function GuideView({ c, list, unlocked, userId, access, onBack, onRecipe, onNow, onPlus }: {
  c: Craving; list: Rescue[]; unlocked: (r: Rescue) => boolean; userId: string | null; access: Access;
  onBack: () => void; onRecipe: (r: Rescue) => void; onNow: () => void; onPlus: () => void;
}) {
  const cv = cravingOf(c)!;
  const g = GUIDES[c];
  const ally = GBOMBS.find(b => b.id === g.gbomb);
  const recipes = list.filter(r => r.cravings.includes(c)).sort((a, b) => Number(unlocked(b)) - Number(unlocked(a)));
  const { loading, plan } = usePlan(c, userId, `${access.gift}:${access.plus}`);
  const [claiming, setClaiming] = useState(false);
  const [claimErr, setClaimErr] = useState('');

  /** The one gifted plan: this craving's, chosen by the person. */
  const claim = async () => {
    buzz();
    setClaiming(true); setClaimErr('');
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/vontade/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
        body: JSON.stringify({ c }),
      });
      const j = await res.json();
      if (!res.ok) setClaimErr(j.error || 'Não deu certo agora. Tente de novo.');
      access.refresh();
    } catch { setClaimErr('Sem conexão agora. Tente de novo.'); }
    setClaiming(false);
  };
  return (
    <article className="va-screen va-guide">
      <button className="va-back" onClick={onBack}>‹ Voltar</button>
      <header className="va-hero" style={cssVars({ '--c': cv.hex, color: cv.ink })}>
        <span className="va-hero__emoji" aria-hidden>{cv.emoji}</span>
        <small>Vontade de</small>
        <h1>{cv.label}</h1>
        <p>{g.behind}</p>
      </header>

      <h2 className="va-h2"><IconTile size={30}>🌱</IconTile> O mesmo prazer, dentro da fibra</h2>
      <p className="va-lead va-lead--tight">{g.principle}</p>
      <SwapList c={c} />

      <h2 className="va-h2"><IconTile size={30}>🤝</IconTile> Sem enrolação</h2>
      <DollyChat lines={['Vou ser sincera com você.', 'Não é mágica, mas funciona. Olha quanto tempo costuma levar:']} />
      <div className="va-card va-honest">
        <div className="va-honest__row">
          <span><small>Dificuldade</small><strong>{EFFORT_LABEL[g.effort]}</strong></span>
          <Effort n={g.effort} />
        </div>
        <div className="va-honest__row">
          <span><small>O paladar costuma se ajustar em</small><strong>{g.reset}</strong></span>
        </div>
        <p>{g.honest}</p>
        {ally && <p className="va-ally"><span aria-hidden>{ally.emoji}</span> Seu aliado no G-BOMBS: <strong>{ally.label}</strong></p>}
      </div>

      {recipes.length > 0 && (
        <>
          <h2 className="va-h2"><IconTile size={30}>📖</IconTile> Receitas para essa vontade</h2>
          <div className="va-rail">
            {recipes.map(r => <RecipeTile key={r.id} r={r} unlocked={unlocked(r)} onOpen={() => { buzz(); onRecipe(r); }} />)}
          </div>
        </>
      )}

      <h2 className="va-h2"><IconTile size={30}>🗺️</IconTile> Plano para vencer de vez</h2>
      {loading ? <div className="va-card va-skeleton" aria-busy /> : plan && (
        <>
          <ol className="va-path">
            {plan.phases.map((p, i) => (
              <li key={p.title} data-locked={!p.text || undefined}>
                <span className="va-path__node" aria-hidden>{p.text ? i + 1 : <Lock size={18} />}</span>
                <div className="va-path__body">
                  <small>{p.when}</small>
                  <strong>{p.title}</strong>
                  {p.text ? <p>{p.text}</p> : <p className="va-blur" aria-label="Disponível no Tropical+">Esta fase do plano está no Tropical+, com o passo a passo completo.</p>}
                </div>
              </li>
            ))}
          </ol>
          <div className="va-card va-traps">
            <p className="va-kicker">As armadilhas e o que fazer</p>
            <ul>
              {plan.traps.map(t => (
                <li key={t.trap}>
                  <strong>{t.trap}</strong>
                  {t.move ? <span>{t.move}</span> : <span className="va-muted"><Lock /> no Tropical+</span>}
                </li>
              ))}
            </ul>
            {plan.daily && <p className="va-ally"><span aria-hidden>🥬</span> {plan.daily}</p>}
          </div>
          {plan.careful && <p className="va-fine va-careful">⚕️ {plan.careful}</p>}
          {plan.full && access.gift === c && !access.plus && (
            <p className="va-note">🎁 Este é o seu plano de presente. É seu para sempre.</p>
          )}
          {!plan.full && access.checked && (
            !access.signedIn ? (
              <div className="va-gift">
                <DollyPhoto src="/vontade/dolly-offer.webp" small>Um presente meu pra você 🎁</DollyPhoto>
                <strong>O seu primeiro plano é presente</strong>
                <p>Entre (é grátis) e escolha uma vontade: o plano dela abre inteiro, para sempre. Sem cartão, sem compromisso.</p>
                <div className="va-card--light va-gift__login">
                  <LoginPanel message="Entre para ganhar o seu plano" subMessage="Com Google, Facebook ou e-mail. Seus dados ficam só com a gente." />
                </div>
              </div>
            ) : !access.gift ? (
              <div className="va-gift">
                <DollyPhoto src="/vontade/dolly-offer.webp" small>Um presente meu pra você 🎁</DollyPhoto>
                <strong>Quer o plano de {cv.label.toLowerCase()} de presente?</strong>
                <p>Você pode escolher um plano, inteiro e para sempre, sem pagar nada. Escolha a vontade que mais pesa para você.</p>
                <button className="va-btn" onClick={claim} disabled={claiming}>{claiming ? 'Abrindo…' : `Quero este de presente 🎁`}</button>
                {claimErr && <p className="va-fine" role="alert">{claimErr}</p>}
              </div>
            ) : (
              <button className="va-unlock" onClick={onPlus}>
                <span className="va-unlock__icon" aria-hidden>🌴</span>
                <span>
                  <strong>Todos os planos, por {formatPrice(APP_PLUS.brl)}</strong>
                  <small>Você já tem o de {cravingOf(access.gift)?.label.toLowerCase()}. O Tropical+ abre este e todos os outros, mais todas as receitas. Uma vez só.</small>
                </span>
                <span aria-hidden className="va-row__go">›</span>
              </button>
            )
          )}
        </>
      )}

      <div className="va-dock">
        <button className="va-btn" onClick={onNow}>{cv.emoji} Bateu agora? Me salva</button>
      </div>
    </article>
  );
}

function RecipeTile({ r, unlocked, onOpen }: { r: Rescue; unlocked: boolean; onOpen: () => void }) {
  return unlocked ? (
    <button className="va-tile" style={cssVars({ '--c': r.hex, color: r.ink })} onClick={onOpen}>
      {r.photo ? <Photo src={r.photo} /> : <span className="va-tile__emoji" aria-hidden>{r.emoji}</span>}
      <strong>{r.name}</strong><small>{timeLabel(r)}</small>
    </button>
  ) : (
    <button className="va-tile va-tile--locked" onClick={onOpen}>
      <span className="va-tile__emoji" aria-hidden>{r.emoji}</span><strong>{r.name}</strong><small><Lock /> Tropical+</small>
    </button>
  );
}

function RecipeCardView({ r, pantry, onOpen }: { r: Rescue; pantry: string[]; onOpen: () => void }) {
  const missing = pantry.length ? missingFor(r, pantry) : [];
  return (
    <button className="va-recipe" style={cssVars({ '--c': r.hex, color: r.ink })} onClick={onOpen}>
      {r.photo ? <Photo src={r.photo} /> : <span className="va-recipe__emoji" aria-hidden>{r.emoji}</span>}
      <strong>{r.name}</strong>
      <span className="va-meta"><span>⏱️ {timeLabel(r)}</span><span>🌱 só planta inteira</span></span>
      {missing.length > 0 && <small>Falta: {missing.map(pantryLabel).join(', ')}</small>}
    </button>
  );
}

function RecipeView({ r, pantry, onBack, onWin }: { r: Rescue; pantry: string[]; onBack: () => void; onWin: () => void }) {
  const [done, setDone] = useState<number[]>([]);
  const contains = ALLERGENS.filter(a => r.contains.includes(a.id));
  const missing = pantry.length ? missingFor(r, pantry) : [];
  const why = r.cravings[0] ? GUIDES[r.cravings[0]]?.principle : null;
  const progress = r.steps.length ? done.length / r.steps.length : 0;
  return (
    <article className="va-screen va-view">
      <button className="va-back" onClick={onBack}>‹ Voltar</button>
      <div className="va-hero" style={cssVars({ '--c': r.hex, color: r.ink })}>
        {r.photo ? <Photo src={r.photo} /> : <span className="va-hero__emoji" aria-hidden>{r.emoji}</span>}
        <h1>{r.name}</h1>
        <span className="va-meta"><span>⏱️ {timeLabel(r)}</span><span>🌱 vegano</span><span>sem glúten</span><span>sem sal, óleo e açúcar</span></span>
      </div>
      {why && <p className="va-why"><strong>Por que funciona:</strong> {why}</p>}
      {contains.length > 0 && <p className="va-contains">Contém: {contains.map(a => `${a.emoji} ${a.label}`).join(' · ')}</p>}
      {missing.length > 0 && <p className="va-contains">Falta em casa: {missing.map(pantryLabel).join(', ')}</p>}
      <h2 className="va-h2"><IconTile size={30}>🧺</IconTile> Você vai usar</h2>
      <ul className="va-ing">{r.ingredients.map(i => <li key={i}>{i}</li>)}</ul>
      <h2 className="va-h2"><IconTile size={30}>👩‍🍳</IconTile> Passo a passo</h2>
      <span className="va-bar va-bar--steps" aria-hidden><i style={{ width: `${progress * 100}%` }} /></span>
      <ol className="va-steps">
        {r.steps.map((s, i) => (
          <li key={i}>
            <button aria-pressed={done.includes(i)} onClick={() => { buzz(); setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i]); }}>
              <span className="va-steps__n" aria-hidden>{done.includes(i) ? '✓' : i + 1}</span><span>{s}</span>
            </button>
          </li>
        ))}
      </ol>
      {r.tip && <p className="va-tip"><strong>Dica:</strong> {r.tip}</p>}
      <div className="va-dock">
        <DollyChat small lines={['Você consegue! 💪', 'Marca os passos aí e, quando terminar, aperta o botão verde.']} />
        <button className="va-btn" onClick={onWin}>Venci a vontade! 🎉</button>
      </div>
    </article>
  );
}

/**
 * Dolly is the app's coach (the role the owl plays in the game-like habit apps): she chats with you (DollyChat)
 * on the screens where a person needs a push, and her real photos offering treats mark the moments that deserve one.
 */
function DollyPhoto({ src, small, children }: { src: string; small?: boolean; children: React.ReactNode }) {
  return (
    <figure className={`va-dolly-photo${small ? ' va-dolly-photo--sm' : ''}`}>
      <img src={src} alt="Dolly oferecendo docinhos no jardim" loading="lazy" />
      <figcaption><strong>Dolly</strong>{children}</figcaption>
    </figure>
  );
}

/**
 * The SOS button is a punching bag: "bateu vontade" literally means the craving hit you. A burger and a soda, each
 * throwing a boxing glove, take turns jabbing it from the edges of the screen; tapping it hits back (both slam in,
 * the bag squashes, POW) and opens the questions. The frustration is the point: you're allowed to be mad at it.
 * Art: Microsoft Fluent Emoji 3D (MIT, public/vontade/fx/LICENSE-fluent-emoji.txt); the bag is drawn in CSS to match.
 */
function PunchBag({ onHit, faded, sound, hotkey }: { onHit: () => void; faded?: boolean; sound?: boolean; hotkey?: boolean }) {
  const [ko, setKo] = useState(false);
  const hit = useCallback(() => {
    if (ko) return;
    try { navigator.vibrate?.([25, 40, 35]); } catch { /* not supported */ }
    if (sound) window.setTimeout(punchSound, 140);
    setKo(true);
    window.setTimeout(() => { setKo(false); onHit(); }, 700);
  }, [ko, sound, onHit]);
  // The space bar (or Enter) throws the punch, like a game; never while typing somewhere.
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return;
      if (document.querySelector('.va-sheet')) return;
      e.preventDefault();
      hit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey, hit]);
  return (
    <div className={`va-ring${ko ? ' is-ko' : ''}${faded && !ko ? ' va-ring--faded' : ''}`}>
      <span className="va-ring__beam" aria-hidden />
      <span className="va-fighter va-fighter--l" aria-hidden>
        <img className="va-fighter__food" src="/vontade/fx/burger.webp" alt="" />
        <img className="va-fighter__glove" src="/vontade/fx/glove.webp" alt="" />
      </span>
      <button className="va-bag" onClick={hit} aria-label="Bateu vontade! Pedir socorro">
        <span className="va-bag__chain" aria-hidden />
        <span className="va-bag__body">
          <span className="va-bag__band va-bag__band--top" aria-hidden />
          <strong>SOS</strong>
          <small>Bateu vontade!</small>
          <span className="va-bag__band va-bag__band--bot" aria-hidden />
        </span>
      </button>
      <span className="va-fighter va-fighter--r" aria-hidden>
        <img className="va-fighter__food" src="/vontade/fx/shake.webp" alt="" />
        <img className="va-fighter__glove" src="/vontade/fx/glove.webp" alt="" />
      </span>
      <span className="va-pow" aria-hidden><img src="/vontade/fx/pow.webp" alt="" /><b>POW!</b></span>
    </div>
  );
}

/** What Dolly says on the home screen: the streak first, then a dense day, then the welcome. */
function homeLines(days: number, gb: number, wins: number, name: string) {
  const hi = name ? `Oi, ${name}!` : 'Oi!';
  if (days >= 2) return [`${days} dias seguidos! 🔥`, 'Tô muito orgulhosa de você.', 'Bateu vontade? Bate no saco que eu te salvo.'];
  if (gb >= 4) return ['Que dia denso! 🥬', 'Com esse prato, a vontade vai ter trabalho para aparecer.'];
  if (wins > 0) return [`${hi} Que bom te ver de novo.`, 'Doce, salgado ou fritura: bate no saco e a gente acha a troca.'];
  return [`${hi} Eu sou a Dolly 👋`, 'Doce, sal, fritura, queijo, refri: toda vontade tem uma troca feita de planta.', 'Quando bater, bate no saco. Eu te salvo em 3 toques.'];
}

/** Dolly's photo of a recipe, as a band across the top of its colored card. */
function Photo({ src }: { src: string }) {
  return <span className="va-photo" aria-hidden><img src={src} alt="" loading="lazy" /></span>;
}

/** "Como são as receitas": the rules behind every recipe, one tap away (credits Fuhrman and Goldhamer, no link implied). */
function Guidelines() {
  return (
    <details className="va-rules">
      <summary>🍓 {GUIDELINES.title} <span aria-hidden>▾</span></summary>
      <ul>{GUIDELINES.rules.map(g => <li key={g.text}><span aria-hidden>{g.emoji}</span>{g.text}</li>)}</ul>
      <p>{GUIDELINES.credit}</p>
    </details>
  );
}

function LetDollyBake() {
  return (
    <Link href="/caixas?utm_source=app-vontade" className="va-card va-next">
      <IconTile size={46}>📦</IconTile>
      <span><strong>Sem tempo hoje? A Dolly faz por você</strong><small>Caixa da semana em Ubatuba e região, entregue em casa</small></span>
      <span aria-hidden className="va-row__go">›</span>
    </Link>
  );
}

const formatPrice = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
const OFFER_KEY = 'tb-vontade-offer';

/**
 * After a win, the one place the app brings up money, and only gently: at most once a day, and the first thing it
 * offers is the free gifted plan for the craving just beaten. Only someone who already has their gift sees a price.
 */
function WinOffer({ c, access, onGuide, onPlus }: { c: Craving; access: Access; onGuide: () => void; onPlus: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(OFFER_KEY) === todayISO()) return;
      localStorage.setItem(OFFER_KEY, todayISO());
    } catch { /* private window: show it, it is once per visit anyway */ }
    setShow(true);
  }, []);
  if (!show || access.plus || !access.checked) return null;
  const cv = cravingOf(c)!;
  const hasGift = !!access.gift;
  const otherGift = hasGift && access.gift !== c;
  return (
    <div className="va-offer">
      <button className="va-offer__x" onClick={() => setShow(false)} aria-label="Fechar">×</button>
      <p className="va-kicker">Próximo passo</p>
      <strong>Você venceu hoje. Quer que essa vontade pare de voltar?</strong>
      <p>{otherGift
        ? `O plano de ${cv.label.toLowerCase()} mostra fase por fase como o paladar muda, e o que fazer em cada armadilha. Ele vem com o Tropical+: ${formatPrice(APP_PLUS.brl)}, uma vez só.`
        : hasGift
          ? 'O seu plano de presente é justamente desta vontade. Siga a próxima fase.'
          : `O plano de ${cv.label.toLowerCase()} mostra fase por fase como o paladar muda. O seu primeiro plano é presente: escolha este, se for o que mais pesa.`}</p>
      <button className="va-btn" onClick={otherGift ? onPlus : onGuide}>
        {otherGift ? 'Ver o Tropical+' : hasGift ? 'Abrir o meu plano' : 'Ganhar o plano de presente 🎁'}
      </button>
    </div>
  );
}

/**
 * Tropical+: what stays free forever (said first, plainly), what it adds, one honest price, and the payment right
 * here (Pix or card), on the account so it never gets lost.
 */
function PlusScreen({ access, total, free, note }: { access: Access; total: number; free: number; note: string }) {
  const [card, setCard] = useState(false);
  const [busy, setBusy] = useState<'' | 'pix' | 'card'>('');
  const [err, setErr] = useState('');
  const [pix, setPix] = useState<{ reference: string; payload: string; base64: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { refresh, plus } = access;

  useEffect(() => {
    fetch('/api/pay/methods').then(r => r.json()).then(j => setCard(!!j.card)).catch(() => {});
  }, []);
  // Waiting on a Pix: look again every 20 seconds; it unlocks the moment Dolly confirms it.
  useEffect(() => {
    if (!pix || plus) return;
    const t = window.setInterval(refresh, 20000);
    return () => window.clearInterval(t);
  }, [pix, plus, refresh]);

  const buy = async (payMethod: 'pix' | 'card') => {
    buzz();
    setBusy(payMethod); setErr('');
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/vontade/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
        body: JSON.stringify({ payMethod }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error || 'Não deu certo agora. Tente de novo.'); setBusy(''); return; }
      trackMeta('InitiateCheckout', { content_name: 'app-vontade-plus', value: APP_PLUS.brl, currency: 'BRL' });
      if (j.url) { window.location.href = j.url; return; }
      if (j.pix) setPix({ reference: j.reference, payload: j.pix.payload, base64: j.pix.base64 });
    } catch { setErr('Sem conexão agora. Tente de novo.'); }
    setBusy('');
  };

  const copy = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.payload); setCopied(true); } catch { /* the code is on screen to copy by hand */ }
  };

  const freeForever = [
    'O socorro na hora da vontade, quantas vezes quiser',
    'Pelo menos uma receita para cada vontade',
    'O guia de cada vontade: o que ela procura, as trocas e a verdade sobre o tempo',
    'O G-BOMBS do dia, a sua sequência e os seus números',
    'Um plano completo de presente, à sua escolha',
  ];
  const adds = [
    { emoji: '🗺️', text: `O plano completo de todas as ${CRAVINGS.length} vontades, fase por fase` },
    { emoji: '🪤', text: 'As armadilhas de cada vontade e o que fazer em cada uma' },
    { emoji: '📖', text: `Todas as ${total} receitas (${total - free} a mais que no grátis)` },
    { emoji: '💛', text: 'E você ajuda uma cozinha pequena a continuar fazendo isso' },
  ];

  if (plus) {
    return (
      <section className="va-screen">
        {note && <p className="va-note" role="status">{note}</p>}
        <div className="va-medal" aria-hidden>🌴</div>
        <p className="va-kicker">Tropical+</p>
        <h1 className="va-title">Tudo liberado.</h1>
        <p className="va-lead">Todos os planos e todas as receitas são seus, para sempre. Obrigada por apoiar a cozinha da Dolly.</p>
        <Link href="/minha-conta" className="va-card va-next">
          <IconTile size={46}>👤</IconTile>
          <span><strong>Minha conta</strong><small>Seus pedidos e o Clube Tropical</small></span>
          <span aria-hidden className="va-row__go">›</span>
        </Link>
      </section>
    );
  }

  return (
    <section className="va-screen">
      {note && <p className="va-note" role="status">{note}</p>}
      <p className="va-kicker">Tropical+</p>
      <h1 className="va-title">O app ajuda de graça. O Tropical+ é para vencer de vez.</h1>
      <DollyPhoto src="/vontade/dolly-spatula.webp">
        O que é grátis continua grátis, para sempre, com ou sem você comprar. O Tropical+ é para quem quer ir mais fundo, e ajuda a minha cozinha a continuar.
      </DollyPhoto>

      <div className="va-card">
        <p className="va-kicker">Grátis, para sempre</p>
        <ul className="va-checks">{freeForever.map(t => <li key={t}>{t}</li>)}</ul>
      </div>

      <div className="va-card va-compare--plus">
        <p className="va-kicker">O Tropical+ acrescenta</p>
        <ul className="va-perks">{adds.map(p => <li key={p.text}><IconTile size={40}>{p.emoji}</IconTile><span>{p.text}</span></li>)}</ul>
        <div className="va-price">
          <strong>{formatPrice(APP_PLUS.brl)}</strong>
          <span>{APP_PLUS.promise}</span>
        </div>

        {pix ? (
          <div className="va-pix">
            <p><strong>Pague com o Pix</strong> e o Tropical+ libera aqui sozinho assim que a Dolly confirmar. Você também recebe um e-mail.</p>
            <img src={pix.base64} alt="QR code do Pix" width={200} height={200} />
            <button className="va-btn va-btn--ghost" onClick={copy}>{copied ? 'Código copiado ✓' : 'Copiar o Pix copia e cola'}</button>
            <p className="va-fine">Pedido {pix.reference}</p>
          </div>
        ) : !access.checked ? null : !access.signedIn ? (
          <div className="va-card--light va-gift__login">
            <LoginPanel message="Entre para o Tropical+ ficar na sua conta" subMessage="Assim ele nunca se perde, em qualquer celular." />
          </div>
        ) : (
          <div className="va-actions">
            <button className="va-btn" onClick={() => buy('pix')} disabled={!!busy}>{busy === 'pix' ? 'Gerando o Pix…' : 'Pagar com Pix'}</button>
            {card && <button className="va-btn va-btn--ghost" onClick={() => buy('card')} disabled={!!busy}>{busy === 'card' ? 'Abrindo…' : 'Pagar com cartão'}</button>}
            {err && <p className="va-fine" role="alert">{err}</p>}
          </div>
        )}
      </div>

      <p className="va-fine va-center">Já é cliente da caixa ou assinante? O Tropical+ já vem incluído como agradecimento: é só entrar com a mesma conta.</p>
    </section>
  );
}

/** "Put it on your home screen": Android gets the real prompt, iPhone gets the two taps to do it by hand. */
function InstallHint() {
  const [prompt, setPrompt] = useState<(Event & { prompt: () => Promise<void> }) | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as Event & { prompt: () => Promise<void> }); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  if (installed || (!prompt && !ios)) return null;
  return (
    <div className="va-card va-install">
      <IconTile size={46}>📲</IconTile>
      <span>
        <strong>Deixe na tela do celular</strong>
        <small>{prompt ? 'Para a próxima vontade, um toque e pronto.' : 'No Safari, toque em Compartilhar ⬆️ e depois em "Adicionar à Tela de Início".'}</small>
      </span>
      {prompt && <button className="va-btn va-btn--ghost va-btn--sm" onClick={() => prompt.prompt().catch(() => {})}>Instalar</button>}
    </div>
  );
}
