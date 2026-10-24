'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ALLERGENS } from '@/lib/allergens';
import { trackMeta } from '@/lib/metaPixel';
import LoginPanel from '@/components/LoginPanel';
import IconTile from '@/components/IconTile';
import {
  CRAVINGS, CRAVING_GROUPS, TIMES, RESCUES, GUIDELINES, GUIDES, GBOMBS, DENSITY, EFFORT_LABEL, STORE_KEY,
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

/** Tropical+ = signed in and in the Clube (a paid box) or subscribed. The same two reads Minha Conta makes. */
function useTropicalPlus() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<{ checked: boolean; plus: boolean; paidBoxes: number }>({ checked: false, plus: false, paidBoxes: 0 });
  useEffect(() => {
    if (loading) return;
    if (!user) { setState({ checked: true, plus: false, paidBoxes: 0 }); return; }
    let alive = true;
    (async () => {
      const [{ data: j }, { data: subs }] = await Promise.all([
        supabase.rpc('my_journey'),
        supabase.from('subscriptions').select('status').order('created_at', { ascending: false }).limit(5),
      ]);
      if (!alive) return;
      const paidBoxes = Number((j as { paid_boxes?: number } | null)?.paid_boxes ?? 0);
      const subscriber = (subs || []).some(s => s.status && s.status !== 'cancelled');
      setState({ checked: true, plus: isTropicalPlus(paidBoxes, subscriber), paidBoxes });
    })().catch(() => { if (alive) setState({ checked: true, plus: false, paidBoxes: 0 }); });
    return () => { alive = false; };
  }, [user, loading]);
  return { ...state, signedIn: !!user };
}

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
function usePlan(c: Craving, signedInId: string | null) {
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
  }, [c, signedInId]);
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
  const plus = useTropicalPlus();
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

  useEffect(() => {
    const s = readStore();
    setStore(s);
    setPantry(s.pantry);
    trackMeta('ViewContent', { content_name: 'app-vontade', content_type: 'product', value: 0 });
  }, []);

  const { user } = useAuth();
  const { list, fromDb } = useRescues(user?.id ?? null);
  const unlocked = useCallback((r: Rescue) => (fromDb ? !r.locked : r.free || plus.plus), [fromDb, plus.plus]);
  const ranked = useMemo(() => (craving && time ? rankRescues(list, craving, time, pantry) : []), [list, craving, time, pantry]);
  const free = freeCount(list);
  const open_ = ranked.filter(unlocked);
  const current = open_.length ? open_[pick % open_.length] : null;
  // The better recipe behind the lock, shown at the moment the craving is strongest.
  const betterLocked = !plus.plus ? (current ? ranked.slice(0, ranked.indexOf(current)).find(r => !unlocked(r)) : null) ?? ranked.find(r => !unlocked(r) && r !== current) : null;

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
  const cv = craving ? cravingOf(craving) : null;

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
          {plus.plus
            ? <span className="va-stat va-stat--plus" title="Tropical+"><span aria-hidden>🌴</span>+</span>
            : <button className="va-stat va-stat--lock" onClick={() => go('plus')} aria-label="Tropical+"><Lock /> +</button>}
        </div>
      </header>

      <div className="va-scroll">
        {open ? (
          <RecipeView r={open} pantry={pantry} onBack={() => setOpen(null)} onWin={win} />
        ) : guide ? (
          <GuideView c={guide} list={list} unlocked={unlocked} userId={user?.id ?? null}
            onBack={() => setGuide(null)} onRecipe={r => (unlocked(r) ? setOpen(r) : go('plus'))} onNow={() => chooseCraving(guide)} onPlus={() => go('plus')} />
        ) : tab === 'hoje' ? (
          <section className="va-screen" key={step}>
            {step === 'home' && (
              <div className="va-home">
                <p className="va-kicker">{greeting()} 🌴</p>
                <h1 className="va-title">Bateu vontade?</h1>
                <p className="va-lead">Doce, sal, fritura, queijo, refri: toda vontade tem uma troca de verdade, feita de planta inteira, pronta em minutos.</p>
                <button className="va-sos" onClick={() => { buzz(); setStep('craving'); }}>
                  <span className="va-sos__ring" aria-hidden />
                  <span className="va-sos__emoji" aria-hidden>🆘</span>
                  <span>Bateu agora!</span>
                </button>

                <GbombsCard ticked={ticked} onToggle={toggleGb} />
                <Insight store={store} onGuide={c => { buzz(); setGuide(c); scrollTop(); }} />

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
                <InstallHint />
                <Guidelines />
              </div>
            )}

            {step === 'craving' && (
              <Question n={1} title="Bateu vontade de quê?" onBack={() => setStep('home')}>
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
                {betterLocked && (
                  <button className="va-locked" onClick={() => go('plus')}>
                    <span className="va-locked__emoji" aria-hidden>{betterLocked.emoji}</span>
                    <span><small><Lock /> A Dolly tem uma ainda melhor para você</small><strong>{betterLocked.name}</strong><small>Libere com Tropical+ ›</small></span>
                  </button>
                )}
                <button className="va-card va-next" onClick={() => { buzz(); setGuide(craving); scrollTop(); }}>
                  <IconTile size={46}>{cv.emoji}</IconTile>
                  <span><strong>Vencer essa vontade de vez</strong><small>O que ela procura, quanto tempo leva e o plano semana a semana</small></span>
                  <span aria-hidden className="va-row__go">›</span>
                </button>
                <LetDollyBake />
              </div>
            )}

            {step === 'won' && (
              <div className="va-won">
                <div className="va-confetti" aria-hidden>{['🌴', '🍋', '🥭', '🍄', '✨', '🌺', '🥑', '✨'].map((e, i) => <span key={i} style={cssVars({ '--i': String(i) })}>{e}</span>)}</div>
                <div className="va-medal" aria-hidden>🏆</div>
                <p className="va-kicker">Vontade vencida!</p>
                <h1 className="va-title">{store.wins.length === 1 ? 'Sua primeira vitória.' : `${store.wins.length} vitórias.`}</h1>
                <p className="va-lead">{days > 1 ? `${days} dias seguidos escolhendo o que faz bem.` : 'O mesmo prazer, só de planta. Amanhã tem mais.'}</p>
                <div className="va-actions">
                  <button className="va-btn" onClick={share}>Contar para uma amiga 💛</button>
                  <button className="va-btn va-btn--ghost" onClick={() => setStep('home')}>Voltar ao início</button>
                </div>
                {shared && <p className="va-note" role="status">{shared}</p>}
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
          <PlusScreen plus={plus} total={list.length} free={free} />
        )}
      </div>

      <nav className="va-tabs" aria-label="App">
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
function GuideView({ c, list, unlocked, userId, onBack, onRecipe, onNow, onPlus }: {
  c: Craving; list: Rescue[]; unlocked: (r: Rescue) => boolean; userId: string | null;
  onBack: () => void; onRecipe: (r: Rescue) => void; onNow: () => void; onPlus: () => void;
}) {
  const cv = cravingOf(c)!;
  const g = GUIDES[c];
  const ally = GBOMBS.find(b => b.id === g.gbomb);
  const recipes = list.filter(r => r.cravings.includes(c)).sort((a, b) => Number(unlocked(b)) - Number(unlocked(a)));
  const { loading, plan } = usePlan(c, userId);
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
          {!plan.full && (
            <button className="va-unlock" onClick={onPlus}>
              <span className="va-unlock__icon" aria-hidden>🌴</span>
              <span><strong>Libere o plano completo</strong><small>Todas as fases, as armadilhas e todas as receitas. Vem com o Tropical+.</small></span>
              <span aria-hidden className="va-row__go">›</span>
            </button>
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
        <button className="va-btn" onClick={onWin}>Venci a vontade! 🎉</button>
      </div>
    </article>
  );
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

function PlusScreen({ plus, total, free }: { plus: ReturnType<typeof useTropicalPlus>; total: number; free: number }) {
  const perks = [
    { emoji: '🗺️', text: `O plano completo de cada uma das ${CRAVINGS.length} vontades, fase por fase` },
    { emoji: '🪤', text: 'As armadilhas de cada vontade e o que fazer em cada uma' },
    { emoji: '📖', text: `Todas as ${total} receitas de resgate (${total - free} só para Tropical+)` },
    { emoji: '🎯', text: 'A melhor receita para a sua vontade, sempre, não só as grátis' },
    { emoji: '🌴', text: 'Vem junto com o Clube Tropical: selos, níveis e mimos da Dolly' },
  ];
  return (
    <section className="va-screen">
      <p className="va-kicker">Tropical+</p>
      {plus.plus ? (
        <>
          <div className="va-medal" aria-hidden>🌴</div>
          <h1 className="va-title">Você é Tropical+</h1>
          <p className="va-lead">Todos os planos e todas as receitas estão liberados. Obrigada por fazer parte da família.</p>
          <Link href="/minha-conta" className="va-card va-next">
            <IconTile size={46}>🎟️</IconTile>
            <span><strong>Seu Clube Tropical</strong><small>Selos, nível e próximos pedidos</small></span>
            <span aria-hidden className="va-row__go">›</span>
          </Link>
        </>
      ) : (
        <>
          <h1 className="va-title">Vencer de vez, com o plano completo.</h1>
          <p className="va-lead">O app ajuda de graça na hora da vontade. O Tropical+ é o caminho para ela parar de mandar em você. Não se paga à parte: vem com qualquer caixa comprada ou com a assinatura.</p>
          <ul className="va-perks">{perks.map(p => <li key={p.text}><IconTile size={40}>{p.emoji}</IconTile><span>{p.text}</span></li>)}</ul>
          <div className="va-actions">
            <Link href="/caixas?utm_source=app-vontade" className="va-btn">Quero a minha caixa 📦</Link>
            <Link href="/assinatura?utm_source=app-vontade" className="va-btn va-btn--ghost">Ver a assinatura</Link>
          </div>
          {!plus.checked ? null : !plus.signedIn ? (
            <div className="va-card va-card--light">
              <LoginPanel message="Já comprou uma caixa? Entre para liberar" subMessage="Use o mesmo e-mail ou WhatsApp do seu pedido." />
            </div>
          ) : (
            <p className="va-note">Sua conta está conectada, mas ainda não encontramos uma caixa paga nela. Assim que a primeira for confirmada, tudo libera aqui.</p>
          )}
          <Link href="/receitas?utm_source=app-vontade" className="va-card va-next">
            <IconTile size={46}>🎁</IconTile>
            <span><strong>Mora longe? Comece pelo livro</strong><small>2 receitas completas do Sweet Escape, grátis no e-mail</small></span>
            <span aria-hidden className="va-row__go">›</span>
          </Link>
        </>
      )}
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
