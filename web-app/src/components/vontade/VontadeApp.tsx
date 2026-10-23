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
  CRAVINGS, TIMES, PANTRY, RESCUES, FREE_COUNT, STORE_KEY,
  emptyStore, isTropicalPlus, lastSevenDays, missingFor, pantryLabel, rankRescues, streak, todayISO,
  type Craving, type Rescue, type TimeBudget, type VontadeStore,
} from '@/lib/vontade';
import './vontade.css';

type Tab = 'sos' | 'receitas' | 'plus';
type Step = 'home' | 'craving' | 'time' | 'pantry' | 'result' | 'won';

const SHARE_URL = 'https://the-tropical-bakery.vercel.app/vontade';

function readStore(): VontadeStore {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const s = JSON.parse(raw);
    return { wins: Array.isArray(s.wins) ? s.wins.filter((w: unknown) => typeof w === 'string') : [], pantry: Array.isArray(s.pantry) ? s.pantry : [] };
  } catch { return emptyStore(); }
}
function writeStore(s: VontadeStore) {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* private window: the app still works */ }
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

const Lock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" /></svg>
);

const timeLabel = (r: Rescue) => r.waitMinutes ? `${r.minutes} min + ${Math.round(r.waitMinutes / 60)}h na geladeira` : `${r.minutes} min`;

/**
 * /vontade: "Bateu Vontade?", the craving-rescue app. Feels like its own app (full screen, its own tab bar, can be
 * added to the home screen), but every screen ends one step from the bakery: Tropical+ comes with a box, the box is
 * one tap away, and the free recipes funnel (/receitas) is the next freebie. Data and rules: lib/vontade.ts.
 */
export default function VontadeApp() {
  const plus = useTropicalPlus();
  const [tab, setTab] = useState<Tab>('sos');
  const [step, setStep] = useState<Step>('home');
  const [craving, setCraving] = useState<Craving | null>(null);
  const [time, setTime] = useState<TimeBudget | null>(null);
  const [pantry, setPantry] = useState<string[]>([]);
  const [pick, setPick] = useState(0);
  const [store, setStore] = useState<VontadeStore>(emptyStore);
  const [open, setOpen] = useState<Rescue | null>(null);
  const [shared, setShared] = useState('');

  useEffect(() => {
    const s = readStore();
    setStore(s);
    setPantry(s.pantry);
    trackMeta('ViewContent', { content_name: 'app-vontade', content_type: 'product', value: 0 });
  }, []);

  const unlocked = useCallback((r: Rescue) => r.free || plus.plus, [plus.plus]);
  const ranked = useMemo(() => (craving && time ? rankRescues(craving, time, pantry) : []), [craving, time, pantry]);
  const open_ = ranked.filter(unlocked);
  const current = open_.length ? open_[pick % open_.length] : null;
  // The better recipe behind the lock, shown at the moment the craving is strongest.
  const betterLocked = !plus.plus && current ? ranked.slice(0, ranked.indexOf(current)).find(r => !r.free) ?? ranked.find(r => !r.free && r !== current) : null;

  const go = (t: Tab) => { setTab(t); setOpen(null); document.querySelector('.va-scroll')?.scrollTo({ top: 0 }); };

  const win = () => {
    const next = { ...store, wins: [...store.wins, todayISO()].slice(-400) };
    setStore(next);
    writeStore(next);
    setStep('won');
    setOpen(null);
    go('sos');
  };

  const togglePantry = (key: string) => {
    setPantry(p => {
      const next = p.includes(key) ? p.filter(k => k !== key) : [...p, key];
      const s = { ...store, pantry: next };
      setStore(s);
      writeStore(s);
      return next;
    });
  };

  const share = async () => {
    const n = store.wins.length;
    const text = `Bateu vontade de doce e eu venci ${n === 1 ? 'pela primeira vez' : `${n} vezes`} com o app da The Tropical Bakery 🌴 Receitas em 2 a 5 minutos, sem açúcar refinado:`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Bateu Vontade?', text, url: SHARE_URL }); return; }
      await navigator.clipboard.writeText(`${text} ${SHARE_URL}`);
      setShared('Link copiado! Cole no WhatsApp ou no Instagram.');
    } catch { /* cancelled */ }
  };

  const week = lastSevenDays(store.wins);
  const days = streak(store.wins);
  const weekWins = week.reduce((n, d) => n + d.count, 0);

  return (
    <div className="va-shell">
      <header className="va-top">
        <Link href="/" className="va-brand" aria-label="The Tropical Bakery: voltar ao site">
          <img src="/hero-logo-transparent.png" alt="" width={34} height={34} />
          <span><strong>Bateu Vontade?</strong><small>by The Tropical Bakery</small></span>
        </Link>
        {plus.plus
          ? <span className="va-badge">🌴 Tropical+</span>
          : <button className="va-badge va-badge--ghost" onClick={() => go('plus')}><Lock /> Tropical+</button>}
      </header>

      <div className="va-scroll">
        {open ? (
          <RecipeView r={open} pantry={pantry} onBack={() => setOpen(null)} onWin={win} />
        ) : tab === 'sos' ? (
          <section className="va-screen">
            {step === 'home' && (
              <div className="va-home">
                <p className="va-kicker">Bateu aquela vontade de doce?</p>
                <h1 className="va-h1">A gente resolve em <em>3 toques</em>.</h1>
                <p className="va-lead">Um docinho de verdade em 2 a 5 minutos, com o que você tem em casa. Vegano, sem glúten, sem açúcar refinado.</p>
                <button className="va-sos" onClick={() => setStep('craving')}>
                  <span className="va-sos__ring" aria-hidden />
                  <span className="va-sos__emoji" aria-hidden>🍫</span>
                  <span>Bateu vontade!</span>
                </button>
                <div className="va-card va-week">
                  <div className="va-week__head">
                    <span><IconTile size={28}>🔥</IconTile> {days > 0 ? `${days} ${days === 1 ? 'dia' : 'dias'} seguidos` : 'Comece sua sequência hoje'}</span>
                    <strong>{weekWins} {weekWins === 1 ? 'vitória' : 'vitórias'} na semana</strong>
                  </div>
                  <ol className="va-dots">
                    {week.map(d => (
                      <li key={d.iso} data-on={d.count > 0 || undefined} data-today={d.iso === todayISO() || undefined}>
                        <span>{d.count > 0 ? '🌴' : ''}</span><small>{d.label}</small>
                      </li>
                    ))}
                  </ol>
                </div>
                <InstallHint />
              </div>
            )}

            {step === 'craving' && (
              <Question n={1} title="Bateu vontade de quê?" onBack={() => setStep('home')}>
                <div className="va-grid">
                  {CRAVINGS.map(c => (
                    <button key={c.id} className="va-choice" style={{ background: c.hex, color: c.ink }}
                      onClick={() => { setCraving(c.id); setPick(0); setStep('time'); }}>
                      <span className="va-choice__emoji" aria-hidden>{c.emoji}</span>
                      <strong>{c.label}</strong><small>{c.hint}</small>
                    </button>
                  ))}
                </div>
              </Question>
            )}

            {step === 'time' && (
              <Question n={2} title="Quanto tempo você tem?" onBack={() => setStep('craving')}>
                <div className="va-list">
                  {TIMES.map(t => (
                    <button key={t.id} className="va-row" onClick={() => { setTime(t.id); setPick(0); setStep('pantry'); }}>
                      <IconTile size={44}>{t.emoji}</IconTile>
                      <span><strong>{t.label}</strong><small>{t.hint}</small></span>
                      <span aria-hidden className="va-row__go">›</span>
                    </button>
                  ))}
                </div>
              </Question>
            )}

            {step === 'pantry' && (
              <Question n={3} title="O que tem aí na cozinha?" sub="Toque no que tiver. Fica salvo para a próxima vez." onBack={() => setStep('time')}>
                <div className="va-chips">
                  {PANTRY.map(p => (
                    <button key={p.key} className="va-chip" aria-pressed={pantry.includes(p.key)} onClick={() => togglePantry(p.key)}>
                      <span aria-hidden>{p.emoji}</span> {p.label}
                    </button>
                  ))}
                </div>
                <button className="va-cta" onClick={() => { setPick(0); setStep('result'); }}>
                  {pantry.length ? 'Me salva, Dolly! 🌴' : 'Pular e ver a receita'}
                </button>
              </Question>
            )}

            {step === 'result' && (
              <div className="va-result">
                <button className="va-back" onClick={() => setStep('pantry')}>‹ Voltar</button>
                <p className="va-kicker">A receita certa para agora</p>
                {current ? (
                  <>
                    <RecipeCard r={current} pantry={pantry} onOpen={() => setOpen(current)} />
                    <div className="va-actions">
                      <button className="va-cta" onClick={() => setOpen(current)}>Fazer agora</button>
                      {open_.length > 1 && <button className="va-ghost" onClick={() => setPick(p => p + 1)}>Outra opção ↻</button>}
                    </div>
                  </>
                ) : (
                  <p className="va-lead">Para essa combinação, as receitas são Tropical+.</p>
                )}
                {betterLocked && (
                  <button className="va-locked" onClick={() => go('plus')}>
                    <span className="va-locked__emoji" aria-hidden>{betterLocked.emoji}</span>
                    <span><small><Lock /> A Dolly tem uma ainda melhor para você</small><strong>{betterLocked.name}</strong><small>Libere com Tropical+ ›</small></span>
                  </button>
                )}
                <LetDollyBake />
              </div>
            )}

            {step === 'won' && (
              <div className="va-won">
                <div className="va-confetti" aria-hidden>{['🌴', '🍫', '🥭', '🥥', '✨', '🌺', '🍌', '✨'].map((e, i) => <span key={i} style={{ '--i': i } as React.CSSProperties}>{e}</span>)}</div>
                <p className="va-kicker">Vontade vencida!</p>
                <h1 className="va-h1">{store.wins.length === 1 ? 'Sua primeira vitória.' : `${store.wins.length} vitórias.`}</h1>
                <p className="va-lead">{days > 1 ? `${days} dias seguidos escolhendo um doce que faz bem.` : 'Doce de verdade, sem culpa e sem açúcar refinado. Amanhã tem mais.'}</p>
                <div className="va-actions">
                  <button className="va-cta" onClick={share}>Contar para uma amiga 💛</button>
                  <button className="va-ghost" onClick={() => setStep('home')}>Voltar ao início</button>
                </div>
                {shared && <p className="va-note" role="status">{shared}</p>}
                <Link href="/receitas?utm_source=app-vontade" className="va-card va-next">
                  <IconTile size={44}>🎁</IconTile>
                  <span><strong>Ganhe 2 receitas completas de festa</strong><small>Do livro Sweet Escape da Dolly, grátis no seu e-mail</small></span>
                  <span aria-hidden className="va-row__go">›</span>
                </Link>
              </div>
            )}
          </section>
        ) : tab === 'receitas' ? (
          <section className="va-screen">
            <p className="va-kicker">Receitas de resgate</p>
            <h1 className="va-h1">{RESCUES.length} docinhos, todos em minutos.</h1>
            <p className="va-lead">{plus.plus ? 'Você tem todas. Bom proveito!' : `${FREE_COUNT} grátis para sempre. As outras ${RESCUES.length - FREE_COUNT} vêm com o Tropical+.`}</p>
            <div className="va-lib">
              {RESCUES.map(r => unlocked(r) ? (
                <button key={r.id} className="va-tile" style={{ background: r.hex, color: r.ink }} onClick={() => setOpen(r)}>
                  <span className="va-tile__emoji" aria-hidden>{r.emoji}</span><strong>{r.name}</strong><small>{timeLabel(r)}</small>
                </button>
              ) : (
                <button key={r.id} className="va-tile va-tile--locked" onClick={() => go('plus')}>
                  <span className="va-tile__emoji" aria-hidden>{r.emoji}</span><strong>{r.name}</strong><small><Lock /> Tropical+</small>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <PlusScreen plus={plus} />
        )}
      </div>

      <nav className="va-tabs" aria-label="App">
        <button aria-current={tab === 'sos' || undefined} onClick={() => { go('sos'); if (step === 'won') setStep('home'); }}><span aria-hidden>🆘</span>Bateu vontade</button>
        <button aria-current={tab === 'receitas' || undefined} onClick={() => go('receitas')}><span aria-hidden>📖</span>Receitas</button>
        <button aria-current={tab === 'plus' || undefined} onClick={() => go('plus')}><span aria-hidden>🌴</span>Tropical+</button>
      </nav>
    </div>
  );
}

function Question({ n, title, sub, onBack, children }: { n: number; title: string; sub?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="va-q">
      <div className="va-q__top">
        <button className="va-back" onClick={onBack}>‹ Voltar</button>
        <span className="va-progress" aria-label={`Pergunta ${n} de 3`}>{[1, 2, 3].map(i => <i key={i} data-on={i <= n || undefined} />)}</span>
      </div>
      <h1 className="va-h1">{title}</h1>
      {sub && <p className="va-lead">{sub}</p>}
      {children}
    </div>
  );
}

function RecipeCard({ r, pantry, onOpen }: { r: Rescue; pantry: string[]; onOpen: () => void }) {
  const missing = pantry.length ? missingFor(r, pantry) : [];
  return (
    <button className="va-recipe" style={{ background: r.hex, color: r.ink }} onClick={onOpen}>
      <span className="va-recipe__emoji" aria-hidden>{r.emoji}</span>
      <strong>{r.name}</strong>
      <span className="va-meta"><span>⏱️ {timeLabel(r)}</span><span>🌱 vegano</span></span>
      {missing.length > 0 && <small>Falta: {missing.map(pantryLabel).join(', ')}</small>}
    </button>
  );
}

function RecipeView({ r, pantry, onBack, onWin }: { r: Rescue; pantry: string[]; onBack: () => void; onWin: () => void }) {
  const [done, setDone] = useState<number[]>([]);
  const contains = ALLERGENS.filter(a => r.contains.includes(a.id));
  const missing = pantry.length ? missingFor(r, pantry) : [];
  return (
    <article className="va-screen va-view">
      <button className="va-back" onClick={onBack}>‹ Voltar</button>
      <div className="va-view__head" style={{ background: r.hex, color: r.ink }}>
        <span className="va-recipe__emoji" aria-hidden>{r.emoji}</span>
        <h1>{r.name}</h1>
        <span className="va-meta"><span>⏱️ {timeLabel(r)}</span><span>🌱 vegano</span><span>sem glúten</span></span>
      </div>
      {contains.length > 0 && <p className="va-contains">Contém: {contains.map(a => `${a.emoji} ${a.label}`).join(' · ')}</p>}
      {missing.length > 0 && <p className="va-contains">Falta em casa: {missing.map(pantryLabel).join(', ')}</p>}
      <h2 className="va-h2"><IconTile size={28}>🧺</IconTile> Você vai usar</h2>
      <ul className="va-ing">{r.ingredients.map(i => <li key={i}>{i}</li>)}</ul>
      <h2 className="va-h2"><IconTile size={28}>👩‍🍳</IconTile> Passo a passo</h2>
      <ol className="va-steps">
        {r.steps.map((s, i) => (
          <li key={i}>
            <button aria-pressed={done.includes(i)} onClick={() => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])}>
              <span className="va-steps__n" aria-hidden>{done.includes(i) ? '✓' : i + 1}</span><span>{s}</span>
            </button>
          </li>
        ))}
      </ol>
      {r.tip && <p className="va-tip"><strong>Dica:</strong> {r.tip}</p>}
      <button className="va-cta va-cta--win" onClick={onWin}>Venci a vontade! 🎉</button>
    </article>
  );
}

function LetDollyBake() {
  return (
    <Link href="/caixas?utm_source=app-vontade" className="va-card va-next">
      <IconTile size={44}>📦</IconTile>
      <span><strong>Sem tempo hoje? A Dolly faz por você</strong><small>Caixa da semana em Ubatuba e região, entregue em casa</small></span>
      <span aria-hidden className="va-row__go">›</span>
    </Link>
  );
}

function PlusScreen({ plus }: { plus: ReturnType<typeof useTropicalPlus> }) {
  const perks = [
    { emoji: '📖', text: `Todas as ${RESCUES.length} receitas de resgate (${RESCUES.length - FREE_COUNT} só para Tropical+)` },
    { emoji: '🎯', text: 'A melhor receita para a sua vontade, sempre, não só as grátis' },
    { emoji: '🌴', text: 'Vem junto com o Clube Tropical: selos, níveis e mimos da Dolly' },
  ];
  return (
    <section className="va-screen">
      <p className="va-kicker">Tropical+</p>
      {plus.plus ? (
        <>
          <h1 className="va-h1">Você é Tropical+ 🌴</h1>
          <p className="va-lead">Todas as receitas estão liberadas. Obrigada por fazer parte da família.</p>
          <Link href="/minha-conta" className="va-card va-next">
            <IconTile size={44}>🎟️</IconTile>
            <span><strong>Seu Clube Tropical</strong><small>Selos, nível e próximos pedidos</small></span>
            <span aria-hidden className="va-row__go">›</span>
          </Link>
        </>
      ) : (
        <>
          <h1 className="va-h1">Não se paga à parte. Vem com a caixa.</h1>
          <p className="va-lead">Tropical+ está incluído para quem é do Clube Tropical: qualquer caixa comprada ou a assinatura libera tudo.</p>
          <ul className="va-perks">{perks.map(p => <li key={p.text}><IconTile size={36}>{p.emoji}</IconTile><span>{p.text}</span></li>)}</ul>
          {!plus.checked ? null : !plus.signedIn ? (
            <div className="va-card">
              <LoginPanel message="Já comprou uma caixa? Entre para liberar" subMessage="Use o mesmo e-mail ou WhatsApp do seu pedido." />
            </div>
          ) : (
            <p className="va-note">Sua conta está conectada, mas ainda não encontramos uma caixa paga nesta conta. Assim que a primeira for confirmada, tudo libera aqui.</p>
          )}
          <div className="va-actions">
            <Link href="/caixas?utm_source=app-vontade" className="va-cta">Quero a minha caixa 📦</Link>
            <Link href="/assinatura?utm_source=app-vontade" className="va-ghost">Ver a assinatura</Link>
          </div>
          <Link href="/receitas?utm_source=app-vontade" className="va-card va-next">
            <IconTile size={44}>🎁</IconTile>
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
      <IconTile size={44}>📲</IconTile>
      <span>
        <strong>Deixe na tela do celular</strong>
        <small>{prompt ? 'Para a próxima vontade, um toque e pronto.' : 'No Safari, toque em Compartilhar ⬆️ e depois em "Adicionar à Tela de Início".'}</small>
      </span>
      {prompt && <button className="va-ghost" onClick={() => prompt.prompt().catch(() => {})}>Instalar</button>}
    </div>
  );
}
