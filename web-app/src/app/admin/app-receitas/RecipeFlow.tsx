'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ALLERGENS } from '@/lib/allergens';
import { brandConfirm } from '@/lib/brandDialog';
import { uploadPublicImage } from '@/lib/imageUpload';
import {
  COLORS, CRAVINGS, PANTRY, GUIDELINES, checkGuidelines, inkFor, suggestAllergens,
  type GuidelineIssue, type RecipeRow,
} from '@/lib/vontade';
import '../caixas/caixas.css';
import '../crm/crm.css';
import './appRecipes.css';

const STEPS = ['Nome', 'Foto e cor', 'Vontade', 'Tempo', 'Ingredientes', 'Indispensável', 'Passo a passo', 'Dica e alérgenos', 'Quem vê', 'Revisar'];
const REVIEW = STEPS.length - 1;

const EMOJIS = ['🍫', '🍨', '🥭', '🍌', '🫐', '🍓', '🥥', '🥑', '🍎', '🌴', '🌰', '🥜', '🌻', '🥄', '🍮', '🍧', '💛', '🍋'];
const WAITS = [
  { min: 0, label: 'Não precisa' },
  { min: 30, label: '30 min' },
  { min: 60, label: '1 hora' },
  { min: 120, label: '2 horas' },
  { min: 480, label: 'A noite toda' },
];

/** Words in an ingredient line that mean a pantry item, so "Indispensável" can come pre-ticked. */
const PANTRY_WORDS: Record<string, RegExp> = {
  'banana-congelada': /banana[^,]*congelad/, banana: /banana(?![^,]*congelad)/, 'frutas-vermelhas': /frutas? vermelhas|morango|mirtilo|amora|framboesa/,
  'manga-congelada': /manga[^,]*congelad/, manga: /manga(?![^,]*congelad)/, maracuja: /maracuja/, maca: /\bmaca\b/, abacate: /abacate/,
  tamara: /tamara/, cacau: /cacau/, castanhas: /castanha|caju|nozes|amendoa/, 'pasta-amendoim': /pasta de amendoim/,
  sementes: /semente|girassol|abobora/, chia: /chia|linhaca/, coco: /\bcoco\b/, 'leite-vegetal': /leite vegetal|leite de/,
};
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const suggestNeeds = (lines: string[]) => {
  const optional = /opcional|para servir|por cima|para enrolar/;
  const t = lines.filter(l => !optional.test(fold(l))).map(fold).join(' | ');
  return Object.entries(PANTRY_WORDS).filter(([, re]) => re.test(t)).map(([k]) => k);
};

export const slugify = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'receita';

export type Draft = Omit<RecipeRow, 'id' | 'slug' | 'sort' | 'updated_at'> & { id?: string; slug?: string; sort?: number };

export const emptyDraft = (): Draft => ({
  name: '', emoji: '🍓', photo_url: null, color: COLORS[0].hex, cravings: [], minutes: 5, wait_minutes: 0,
  needs: [], ingredients: [''], steps: [''], tip: '', contains: [], is_free: false, published: true,
});

const clean = (l: string[]) => l.map(s => s.trim()).filter(Boolean);
const timeText = (d: Draft) => `${d.minutes} min${d.wait_minutes ? ` + ${WAITS.find(w => w.min === d.wait_minutes)?.label.toLowerCase() ?? `${d.wait_minutes} min`} na geladeira` : ''}`;

/**
 * One question per screen, the way /admin/caixas creates a box: a recipe for the "Bateu Vontade?" app. A new recipe
 * walks through every step; an existing one opens on the review, where "Mudar" jumps to any part. The guideline
 * check (GUIDELINES: Fuhrman + Goldhamer) runs live under the ingredients and steps and again before publishing.
 * Saves to `app_recipes` (migration 48).
 */
export default function RecipeFlow({ initial, nextSort, onDone, onCancel }: {
  initial: Draft | null;
  nextSort: number;
  onDone: (name: string) => void;
  onCancel: () => void;
}) {
  const editing = !!initial?.id;
  const [d, setD] = useState<Draft>(() => initial ? { ...initial, ingredients: initial.ingredients.length ? initial.ingredients : [''], steps: initial.steps.length ? initial.steps : [''] } : emptyDraft());
  const [step, setStep] = useState(editing ? REVIEW : 0);
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD(x => ({ ...x, [k]: v })); setDirty(true); };
  const toggle = (k: 'cravings' | 'needs' | 'contains', id: string) => set(k, d[k].includes(id) ? d[k].filter(x => x !== id) : [...d[k], id]);

  const ingIssues = useMemo(() => checkGuidelines(clean(d.ingredients)), [d.ingredients]);
  const stepIssues = useMemo(() => checkGuidelines(clean(d.steps)).filter(i => i.level === 'erro'), [d.steps]);
  const errors = [...ingIssues, ...stepIssues].filter(i => i.level === 'erro');

  const problemAt = (s: number): string => {
    if (s === 0 && !d.name.trim()) return 'Dê um nome para a receita.';
    if (s === 2 && d.cravings.length === 0) return 'Escolha pelo menos uma vontade.';
    if (s === 4 && clean(d.ingredients).length === 0) return 'Escreva pelo menos um ingrediente.';
    if (s === 6 && clean(d.steps).length === 0) return 'Escreva pelo menos um passo.';
    return '';
  };

  const goTo = (s: number) => {
    setProblem('');
    // Arriving at a screen that can fill itself from what was typed before.
    if (s === 5 && d.needs.length === 0) setD(x => ({ ...x, needs: suggestNeeds(clean(x.ingredients)) }));
    if (s === 7 && d.contains.length === 0) setD(x => ({ ...x, contains: suggestAllergens(clean(x.ingredients)) }));
    setStep(s);
  };
  const next = () => {
    const p = problemAt(step);
    setProblem(p);
    if (!p) goTo(editing ? REVIEW : Math.min(step + 1, REVIEW));
  };
  const back = () => goTo(editing ? REVIEW : Math.max(step - 1, 0));

  const leave = async () => {
    if (!dirty || await brandConfirm('Sair sem salvar? O que você mudou aqui se perde.', { confirmLabel: 'Sair sem salvar' })) onCancel();
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setProblem('');
    try { set('photo_url', await uploadPublicImage(file, 'app-recipes')); }
    catch { setProblem('Não deu para enviar a foto. Tente outra.'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    for (const s of [0, 2, 4, 6]) {
      const p = problemAt(s);
      if (p) { setStep(s); setProblem(p); return; }
    }
    if (d.published && errors.length > 0) {
      const ok = await brandConfirm(
        `Esta receita tem ${errors.length === 1 ? '1 ponto' : `${errors.length} pontos`} fora das regras do app (${[...new Set(errors.map(e => e.label))].join(', ')}). Publicar mesmo assim?`,
        { confirmLabel: 'Publicar mesmo assim', cancelLabel: 'Voltar e ajustar', icon: '⚠️' },
      );
      if (!ok) return;
    }
    setSaving(true);
    setProblem('');
    const row = {
      name: d.name.trim(), emoji: d.emoji || '🍓', photo_url: d.photo_url, color: d.color, cravings: d.cravings,
      minutes: d.minutes, wait_minutes: d.wait_minutes, needs: d.needs, ingredients: clean(d.ingredients), steps: clean(d.steps),
      tip: d.tip?.trim() || null, contains: d.contains, is_free: d.is_free, published: d.published,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from('app_recipes').update(row).eq('id', d.id!));
    } else {
      // The slug is the recipe's address in the app's memory: made once from the name, made unique if taken.
      const base = slugify(d.name);
      for (let i = 0; i < 5; i++) {
        ({ error } = await supabase.from('app_recipes').insert({ ...row, slug: i ? `${base}-${i + 1}` : base, sort: nextSort }));
        if (!error || error.code !== '23505') break;
      }
    }
    setSaving(false);
    if (error) {
      console.error('app_recipes save failed:', error);
      setProblem(error.code === '42P01' || error.code === 'PGRST205' || /app_recipes/.test(error.message || '') ? 'Falta rodar a migration 48 no Supabase.' : 'Não deu para salvar. Tente de novo.');
      return;
    }
    onDone(row.name);
  };

  const ink = inkFor(d.color);

  return (
    <div className="bx">
      <div className="bx-flow">
        <div className="bx-flow__top">
          <span style={{ fontWeight: 800 }}>{editing ? `Editando: ${initial?.name}` : 'Nova receita no app'}</span>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={leave}>✕ Sair</button>
        </div>
        <div className="bx-progress" aria-hidden>
          {STEPS.map((_, i) => <span key={i} className={i <= step ? 'is-done' : ''}><i /></span>)}
        </div>

        <div className="bx-step" key={step}>
          <p className="bx-step__kicker">{editing && step !== REVIEW ? STEPS[step] : `Passo ${step + 1} de ${STEPS.length}`}</p>

          {step === 0 && (
            <>
              <h1 className="bx-step__title">Como se chama o docinho?</h1>
              <p className="bx-step__lead">O nome que aparece no app. Curto e com água na boca.</p>
              <input className="bx-input bx-input--big" autoFocus value={d.name} onChange={e => set('name', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') next(); }} placeholder="Brigadeiro de tâmara" maxLength={80} />
              <p className="bx-step__kicker" style={{ marginTop: '1.5rem' }}>E um emoji para o cartão</p>
              <div className="ar-emojis">
                {EMOJIS.map(e => (
                  <button key={e} type="button" className={`ar-emoji${d.emoji === e ? ' is-on' : ''}`} onClick={() => set('emoji', e)} aria-pressed={d.emoji === e}>{e}</button>
                ))}
                <input className="bx-input ar-emoji-input" value={EMOJIS.includes(d.emoji) ? '' : d.emoji} onChange={e => set('emoji', [...e.target.value].slice(-2).join(''))} placeholder="outro" aria-label="Outro emoji" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="bx-step__title">Uma foto e a cor do cartão</h1>
              <p className="bx-step__lead">A foto é opcional: sem ela, o cartão mostra o emoji sobre a cor. As cores são as sete do Sweet Escape.</p>
              <button type="button" className="bx-drop" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {d.photo_url && <img src={d.photo_url} alt="" />}
                <span className="bx-drop__label">{uploading ? 'Enviando…' : d.photo_url ? '📷 Trocar a foto' : '📷 Escolher uma foto'}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => pickPhoto(e.target.files?.[0])} />
              {d.photo_url && <button type="button" className="bx-link bx-link--danger" style={{ marginTop: '0.6rem' }} onClick={() => set('photo_url', null)}>Tirar a foto</button>}
              <p className="bx-step__kicker" style={{ marginTop: '1.5rem' }}>Cor do cartão</p>
              <div className="ar-swatches">
                {COLORS.map(c => (
                  <button key={c.hex} type="button" className={`ar-swatch${d.color === c.hex ? ' is-on' : ''}`} style={{ background: c.hex, color: c.ink }}
                    onClick={() => set('color', c.hex)} aria-pressed={d.color === c.hex} title={c.name}>{d.color === c.hex ? '✓' : ''}</button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="bx-step__title">Que vontade ela resolve?</h1>
              <p className="bx-step__lead">É a primeira pergunta do app. Pode marcar mais de uma: a primeira que você marcar conta mais.</p>
              <div className="bx-choices">
                {CRAVINGS.map(c => (
                  <button key={c.id} type="button" className={`bx-choice${d.cravings.includes(c.id) ? ' is-on' : ''}`} onClick={() => toggle('cravings', c.id)} aria-pressed={d.cravings.includes(c.id)}>
                    <span className="bx-choice__icon">{c.emoji}</span>
                    <span className="bx-choice__title">{c.label}{d.cravings[0] === c.id && d.cravings.length > 1 ? ' · principal' : ''}</span>
                    <span className="bx-choice__text">{c.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="bx-step__title">Quanto tempo leva?</h1>
              <p className="bx-step__lead">O app só mostra receitas que cabem no tempo da pessoa: até 3 minutos, até 5, ou “posso esperar”.</p>
              <div className="bx-card">
                <div className="bx-counter">
                  <span className="bx-counter__label">Mão na massa<small>minutos fazendo</small></span>
                  <span className="bx-counter__ctl">
                    <button type="button" className="bx-round" onClick={() => set('minutes', Math.max(1, d.minutes - 1))} disabled={d.minutes <= 1} aria-label="Menos um minuto">−</button>
                    <span className="bx-counter__value">{d.minutes}</span>
                    <button type="button" className="bx-round" onClick={() => set('minutes', Math.min(120, d.minutes + 1))} aria-label="Mais um minuto">+</button>
                  </span>
                </div>
              </div>
              <p className="bx-step__kicker" style={{ marginTop: '1.5rem' }}>Precisa gelar depois?</p>
              <div className="crm-pills">
                {WAITS.map(w => (
                  <button key={w.min} type="button" className={`crm-pill${d.wait_minutes === w.min ? ' is-on' : ''}`} onClick={() => set('wait_minutes', w.min)} aria-pressed={d.wait_minutes === w.min}>🧊 {w.label}</button>
                ))}
              </div>
              <p className="bx-say">{d.minutes + d.wait_minutes <= 3 ? '⚡ Aparece até para quem tem só 3 minutos.' : d.minutes + d.wait_minutes <= 5 ? '⏱️ Aparece para quem tem 5 minutinhos.' : '🧊 Aparece para quem pode esperar.'}</p>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="bx-step__title">O que vai na receita?</h1>
              <p className="bx-step__lead">Um ingrediente por linha, com a quantidade. Dá para colar uma lista inteira de uma vez.</p>
              <LineList lines={d.ingredients} onChange={l => set('ingredients', l)} placeholder="5 tâmaras sem caroço" />
              <Checker issues={ingIssues} />
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="bx-step__title">Sem o que não dá para fazer?</h1>
              <p className="bx-step__lead">Quando a pessoa conta o que tem em casa, o app escolhe as receitas que ela consegue fazer. Já marcamos pelo que você escreveu; o que é opcional fica de fora.</p>
              <div className="crm-pills">
                {PANTRY.map(p => (
                  <button key={p.key} type="button" className={`crm-pill${d.needs.includes(p.key) ? ' is-on' : ''}`} onClick={() => toggle('needs', p.key)} aria-pressed={d.needs.includes(p.key)}>{p.emoji} {p.label}</button>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className="bx-step__title">Como se faz?</h1>
              <p className="bx-step__lead">Um passo por linha, curtinho. No app, a pessoa vai tocando em cada um conforme faz.</p>
              <LineList lines={d.steps} onChange={l => set('steps', l)} placeholder="Amasse as tâmaras com um garfo até virar pasta." multiline />
              <Checker issues={stepIssues} />
            </>
          )}

          {step === 7 && (
            <>
              <h1 className="bx-step__title">Uma dica sua e os alérgenos</h1>
              <p className="bx-step__lead">A dica aparece no fim da receita, num cartão amarelo. Pode pular.</p>
              <textarea className="bx-input" rows={3} value={d.tip ?? ''} onChange={e => set('tip', e.target.value)} maxLength={300}
                placeholder="Ex.: guarde 2 na geladeira, amanhã a vontade volta." />
              <p className="bx-step__kicker" style={{ marginTop: '1.5rem' }}>⚠️ Contém (marcamos pelo que você escreveu)</p>
              <div className="crm-pills">
                {ALLERGENS.map(a => (
                  <button key={a.id} type="button" className={`crm-pill crm-pill--warn${d.contains.includes(a.id) ? ' is-on' : ''}`} onClick={() => toggle('contains', a.id)} aria-pressed={d.contains.includes(a.id)}>{a.emoji} {a.label}</button>
                ))}
              </div>
            </>
          )}

          {step === 8 && (
            <>
              <h1 className="bx-step__title">Quem pode ver?</h1>
              <p className="bx-step__lead">As grátis fazem o app ser compartilhado. As Tropical+ são o motivo para comprar uma caixa: quem não tem vê o nome com um cadeado.</p>
              <div className="bx-choices">
                <button type="button" className={`bx-choice${d.is_free ? ' is-on' : ''}`} onClick={() => set('is_free', true)} aria-pressed={d.is_free}>
                  <span className="bx-choice__icon">🎁</span><span className="bx-choice__title">Grátis para todo mundo</span>
                  <span className="bx-choice__text">Qualquer pessoa abre e faz.</span>
                </button>
                <button type="button" className={`bx-choice${!d.is_free ? ' is-on' : ''}`} onClick={() => set('is_free', false)} aria-pressed={!d.is_free}>
                  <span className="bx-choice__icon">🌴</span><span className="bx-choice__title">Só Tropical+</span>
                  <span className="bx-choice__text">Para quem comprou uma caixa ou assina.</span>
                </button>
              </div>
              <button type="button" className={`bx-switch${d.published ? ' is-on' : ''}`} style={{ marginTop: '1.25rem' }} onClick={() => set('published', !d.published)} role="switch" aria-checked={d.published}>
                <span><strong>{d.published ? '🟢 Aparece no app' : '📝 Rascunho, escondida'}</strong><br /><small style={{ color: '#6a6a6a' }}>{d.published ? 'Assim que salvar, já está no app.' : 'Fica guardada aqui até você ligar.'}</small></span>
                <span className="bx-switch__knob" />
              </button>
            </>
          )}

          {step === REVIEW && (
            <>
              <h1 className="bx-step__title">Confira e salve</h1>
              <p className="bx-step__lead">Assim fica o cartão no app. Toque em “Mudar” para ajustar qualquer parte.</p>
              <div className="ar-preview" style={{ background: d.color, color: ink }}>
                {d.photo_url ? <span className="ar-preview__photo"><img src={d.photo_url} alt="" /></span> : <span className="ar-preview__emoji">{d.emoji}</span>}
                <strong>{d.name || 'Sem nome'}</strong>
                <span className="ar-preview__meta"><span>⏱️ {timeText(d)}</span><span>{d.is_free ? '🎁 Grátis' : '🌴 Tropical+'}</span></span>
              </div>
              {errors.length > 0
                ? <Checker issues={[...ingIssues, ...stepIssues]} />
                : <p className="ar-ok">✓ Dentro das regras do app: sem sal, sem óleo, sem açúcar, só alimento inteiro.</p>}
              <div className="bx-review">
                {[
                  { s: 0, t: 'Nome', v: `${d.emoji} ${d.name.trim() || '—'}` },
                  { s: 1, t: 'Foto e cor', v: `${d.photo_url ? '📷 Com foto' : 'Sem foto'} · ${COLORS.find(c => c.hex === d.color)?.name ?? d.color}` },
                  { s: 2, t: 'Vontade', v: d.cravings.map(id => CRAVINGS.find(c => c.id === id)?.label).filter(Boolean).join(', ') || '—' },
                  { s: 3, t: 'Tempo', v: timeText(d) },
                  { s: 4, t: 'Ingredientes', v: clean(d.ingredients).join(' · ') || '—' },
                  { s: 5, t: 'Indispensável', v: d.needs.map(k => PANTRY.find(p => p.key === k)?.label ?? k).join(', ') || 'Nada marcado' },
                  { s: 6, t: 'Passo a passo', v: `${clean(d.steps).length} passos` },
                  { s: 7, t: 'Dica e alérgenos', v: [d.tip?.trim() && `“${d.tip.trim()}”`, d.contains.length ? `Contém ${ALLERGENS.filter(a => d.contains.includes(a.id)).map(a => a.label.toLowerCase()).join(', ')}` : 'Sem alérgenos marcados'].filter(Boolean).join(' · ') },
                  { s: 8, t: 'Quem vê', v: `${d.is_free ? 'Grátis' : 'Tropical+'} · ${d.published ? 'aparece no app' : 'rascunho'}` },
                ].map(r => (
                  <div key={r.s} className="bx-review__row">
                    <div style={{ minWidth: 0 }}><strong>{r.t}</strong><span>{r.v}</span></div>
                    <button type="button" className="bx-link" onClick={() => goTo(r.s)}>Mudar</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bx-footer">
          {step > 0 && !(editing && step === REVIEW) ? <button type="button" className="bx-link" onClick={back}>← {editing ? 'Revisar' : 'Voltar'}</button> : <span />}
          {problem && <span className="bx-footer__msg" role="alert">{problem}</span>}
          {step < REVIEW ? (
            <button type="button" className="bx-btn bx-btn--dark" onClick={next}>{editing ? 'Pronto' : step === 7 && !d.tip?.trim() && !d.contains.length ? 'Pular' : 'Avançar'}</button>
          ) : (
            <button type="button" className="bx-btn bx-btn--gold" onClick={save} disabled={saving || uploading}>
              {saving ? 'Salvando…' : editing ? '✓ Salvar mudanças' : d.published ? '✓ Publicar no app' : '✓ Salvar rascunho'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Lines you can type, reorder and remove. Pasting several lines at once splits them into rows. */
function LineList({ lines, onChange, placeholder, multiline = false }: { lines: string[]; onChange: (l: string[]) => void; placeholder: string; multiline?: boolean }) {
  const refs = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>([]);
  // The new row gets the cursor in the same commit that adds it, so fast typing after Enter never lands in the old row.
  const wantFocus = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (wantFocus.current === null) return;
    refs.current[wantFocus.current]?.focus();
    wantFocus.current = null;
  });
  const focus = (i: number) => { wantFocus.current = i; };
  const setAt = (i: number, v: string) => onChange(lines.map((l, j) => (j === i ? v : l)));
  const add = (at = lines.length) => { onChange([...lines.slice(0, at), '', ...lines.slice(at)]); focus(at); };
  const remove = (i: number) => onChange(lines.length > 1 ? lines.filter((_, j) => j !== i) : ['']);
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= lines.length) return;
    const next = [...lines];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const paste = (i: number, e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!/\n/.test(text.trim())) return;
    e.preventDefault();
    const parts = text.split(/\r?\n/).map(s => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
    onChange([...lines.slice(0, i), ...parts, ...lines.slice(i + 1)].filter((l, j, all) => l.trim() || all.length === 1));
  };
  return (
    <div className="ar-lines">
      {lines.map((l, i) => (
        <div key={i} className="ar-line">
          <span className="ar-line__n" aria-hidden>{i + 1}</span>
          {multiline ? (
            <textarea ref={el => { refs.current[i] = el; }} className="bx-input" rows={2} value={l} placeholder={i === 0 ? placeholder : ''}
              onChange={e => setAt(i, e.target.value)} onPaste={e => paste(i, e)} maxLength={300} />
          ) : (
            <input ref={el => { refs.current[i] = el; }} className="bx-input" value={l} placeholder={i === 0 ? placeholder : ''}
              onChange={e => setAt(i, e.target.value)} onPaste={e => paste(i, e)} maxLength={160}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(i + 1); } }} />
          )}
          <span className="ar-line__tools">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === lines.length - 1} aria-label="Descer">↓</button>
            <button type="button" onClick={() => remove(i)} aria-label="Apagar linha">✕</button>
          </span>
        </div>
      ))}
      <button type="button" className="bx-btn bx-btn--ghost" onClick={() => add()}>+ Mais uma linha</button>
    </div>
  );
}

/** The live guideline check: red for what breaks the rules (with what to use instead), amber for labels to check. */
function Checker({ issues }: { issues: GuidelineIssue[] }) {
  const errors = issues.filter(i => i.level === 'erro');
  const checks = issues.filter(i => i.level === 'conferir');
  if (!issues.length) return <p className="ar-ok">✓ Dentro das regras do app.</p>;
  return (
    <div className="ar-check">
      {errors.map((e, i) => (
        <p key={`e${i}`} className="ar-check__err"><strong>✋ {e.label}</strong> em “{e.line}”{e.instead && <><br /><span>👉 {e.instead}</span></>}</p>
      ))}
      {checks.map((c, i) => <p key={`c${i}`} className="ar-check__warn">🏷️ Confira o rótulo: {c.label}</p>)}
      <details className="ar-rules">
        <summary>Ver as regras do app</summary>
        <ul>{GUIDELINES.rules.map(g => <li key={g.text}>{g.emoji} {g.text}</li>)}</ul>
      </details>
    </div>
  );
}
