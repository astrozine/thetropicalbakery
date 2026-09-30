'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ALLERGENS, allergenById, normalizeAllergens } from '@/lib/allergens';
import { KitchenFacts } from '@/components/TreatInfo';
import { RAW, matchesRaw, typeChipFor, typeKeyOf, type RawFilter } from '@/lib/treatTypes';
import { AVOID_FILTERS, WHOLE_FOOD, avoidFilterById, isWholeFood, passesAvoid, undeclaredFor } from '@/lib/sugarCaffeine';

/** The bits of a treat the refine menu looks at. */
export interface RefinableTreat {
  name: string;
  is_available: boolean;
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
  treat_type?: string | null;
  is_raw?: boolean | null;
  sugars?: string[] | null;
  caffeine?: string | null;
}

export type RefineMode = 'contains' | 'may' | 'free';

export interface RefineState {
  search: string;
  mode: RefineMode;
  allergens: string[];
  ingredients: string[]; // stored lower-case
  status: string[];      // 'menu' | 'hidden' | 'incomplete'
  /** Treat-type keys (see treatTypes.ts). Several are OR'd; empty means every type. */
  types: string[];
  /** Raw or not, a separate yes/no that crosses with the type (see RAW in treatTypes.ts). Absent means 'all'. */
  raw?: RawFilter;
  /** 🌾 Integral: only treats known to have nothing refined (no crystal sugar from industrial chocolate). */
  wholeFood?: boolean;
  /** "Sem açúcar de cana", "Sem cafeína"… (AVOID_FILTERS in sugarCaffeine.ts). Always "avoid", whatever the mode. */
  avoid?: string[];
}

export const emptyRefine: RefineState = { search: '', mode: 'contains', allergens: [], ingredients: [], status: [], types: [], raw: 'all', avoid: [] };

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const norm = (s: string) => s.trim().toLowerCase();
const isIncomplete = (t: RefinableTreat) =>
  (t.ingredients?.length || 0) + (t.contains?.length || 0) + (t.may_contain?.length || 0) === 0;

/** Treats a "free of" search hides because nobody has filled in their allergens yet. */
export const unknownHidden = (treats: RefinableTreat[], r: RefineState) =>
  r.mode === 'free' && r.allergens.length + r.ingredients.length > 0 ? treats.filter(isIncomplete).length : 0;

export const refineCount = (r: RefineState) =>
  r.allergens.length + r.ingredients.length + r.status.length + r.types.length + (r.search.trim() ? 1 : 0)
  + (r.raw === 'raw' ? 1 : 0) + (r.wholeFood ? 1 : 0) + (r.avoid?.length || 0);

const STATUSES = [
  { id: 'menu', label: '✅ No menu' },
  { id: 'hidden', label: '🙈 Fora do menu' },
  { id: 'incomplete', label: '📝 Falta preencher' },
];

/** True when the treat passes every active refinement. */
export function matchesRefine(t: RefinableTreat, r: RefineState, opts: { hideUnknownWhenFree?: boolean } = {}): boolean {
  if (r.search.trim() && !norm(t.name).includes(norm(r.search))) return false;

  // Type is its own axis, OR'd within itself: "cookies or chocolates", then AND'd with everything else.
  if (r.types.length > 0 && !r.types.includes(typeKeyOf(t))) return false;
  if (!matchesRaw(t, r.raw || 'all')) return false;
  // Integral: unknown is not integral, so an undeclared treat is left out.
  if (r.wholeFood && isWholeFood(t) !== true) return false;
  // Sugar/caffeine: an undeclared treat never passes, so "sem cafeína" can't show something unknown.
  if (!passesAvoid(t, r.avoid)) return false;

  if (r.status.length > 0) {
    const ok = r.status.some(s =>
      s === 'menu' ? t.is_available : s === 'hidden' ? !t.is_available : isIncomplete(t));
    if (!ok) return false;
  }

  const ing = (t.ingredients || []).map(norm);
  const con = normalizeAllergens(t.contains);
  const may = normalizeAllergens(t.may_contain);

  if (r.mode === 'free') {
    // A treat with nothing filled in is "unknown", not "free". Customers must never see it as safe.
    if (opts.hideUnknownWhenFree && (r.allergens.length + r.ingredients.length > 0) && isIncomplete(t)) return false;
    // Free of: none of the selected allergens declared (contains or may contain), none of the ingredients.
    if (r.allergens.some(a => con.includes(a) || may.includes(a))) return false;
    if (r.ingredients.some(i => ing.includes(i))) return false;
    return true;
  }
  const list = r.mode === 'contains' ? con : may;
  if (!r.allergens.every(a => list.includes(a))) return false;
  if (!r.ingredients.every(i => ing.includes(i))) return false;
  return true;
}

const MODES: { id: RefineMode; label: string; help: string }[] = [
  { id: 'contains', label: '⚠️ Contém', help: 'Mostra os doces que têm TODOS os itens marcados.' },
  { id: 'may', label: '🔸 Pode conter', help: 'Mostra os doces que podem conter (contaminação cruzada) TODOS os alérgenos marcados.' },
  { id: 'free', label: '🌱 Livre de', help: 'Mostra os doces que não têm NENHUM dos itens marcados, nem como traço.' },
];

export default function TreatRefineMenu({ treats, value, onChange, shown, variant = 'admin', defaultOpen = false, sheetBelow, fabBottom = '1rem' }: {
  treats: RefinableTreat[]; value: RefineState; onChange: (next: RefineState) => void; shown: number;
  /** 'public' is the customer-facing look: no admin-only folder, friendlier wording, open by default. */
  variant?: 'admin' | 'public';
  /** Start expanded (the public look always does). Used when it sits in a side column. */
  defaultOpen?: boolean;
  /** Below this viewport width the panel becomes a bottom sheet (a bar in the page, plus a floating button once it scrolls away). */
  sheetBelow?: number;
  /** Distance of the floating button from the bottom edge (leave room for a tab bar). */
  fabBottom?: string;
}) {
  const isPublic = variant === 'public';
  const [open, setOpen] = useState(isPublic || defaultOpen);
  const [openFolders, setOpenFolders] = useState<string[]>([]);

  // Phone/tablet: a bottom sheet instead of an inline panel.
  const [narrow, setNarrow] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [barPassed, setBarPassed] = useState(false);
  const barRef = useRef<HTMLButtonElement>(null);
  const sheet = narrow && !!sheetBelow;

  useEffect(() => {
    if (!sheetBelow) return;
    const mq = window.matchMedia(`(max-width: ${sheetBelow - 1}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [sheetBelow]);

  // While the sheet is open, the page behind it must not scroll; Escape closes it.
  useEffect(() => {
    if (!sheet || !sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [sheet, sheetOpen]);

  // The floating button only appears once the in-page bar has scrolled up out of view (not before you've reached it).
  // A scroll check rather than an IntersectionObserver: that one never fires when the page jumps straight past the bar.
  useEffect(() => {
    if (!sheet) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const bar = barRef.current;
      if (bar) setBarPassed(bar.getBoundingClientRect().bottom < 72);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sheet]);

  // One folder open at a time, so the panel never grows into a wall of chips.
  const toggleFolder = (id: string) =>
    setOpenFolders(f => (f.includes(id) ? [] : [id]));

  const toggle = (key: 'allergens' | 'ingredients' | 'status' | 'types', id: string) =>
    onChange({ ...value, [key]: value[key].includes(id) ? value[key].filter(x => x !== id) : [...value[key], id] });
  const avoid = value.avoid || [];
  const toggleAvoid = (id: string) =>
    onChange({ ...value, avoid: avoid.includes(id) ? avoid.filter(x => x !== id) : [...avoid, id] });

  // How many treats declare each allergen and use each ingredient.
  const counts = useMemo(() => {
    const allergen = new Map<string, number>();
    const ingredient = new Map<string, { label: string; n: number }>();
    treats.forEach(t => {
      new Set(normalizeAllergens([...(t.contains || []), ...(t.may_contain || [])])).forEach(a => allergen.set(a, (allergen.get(a) || 0) + 1));
      const seen = new Set<string>();
      (t.ingredients || []).forEach(i => {
        const key = norm(i);
        if (!key || seen.has(key)) return;
        seen.add(key);
        const cur = ingredient.get(key);
        ingredient.set(key, { label: cur?.label || i.trim(), n: (cur?.n || 0) + 1 });
      });
    });
    return { allergen, ingredient };
  }, [treats]);

  const ingredientList = useMemo(
    () => [...counts.ingredient.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => collator.compare(a.label, b.label)),
    [counts],
  );

  const statusCount = (id: string) =>
    treats.filter(t => (id === 'menu' ? t.is_available : id === 'hidden' ? !t.is_available : isIncomplete(t))).length;

  const active = refineCount(value);
  const modes = isPublic
    ? [
        { id: 'free' as const, label: '🌱 Sem', help: 'Mostra só os doces que não têm NENHUM dos itens marcados, nem como traço.' },
        { id: 'contains' as const, label: '⚠️ Com', help: 'Mostra os doces que têm TODOS os itens marcados.' },
        { id: 'may' as const, label: '🔸 Pode conter', help: 'Mostra os doces que podem conter (por contaminação cruzada) TODOS os alérgenos marcados.' },
      ]
    : MODES;
  const mode = modes.find(m => m.id === value.mode)!;
  const hiddenUnknown = isPublic ? unknownHidden(treats, value) : 0;
  const avoidUnknown = undeclaredFor(treats, value.avoid);
  const clearAll = () => onChange({ ...emptyRefine, mode: value.mode });

  /**
   * Everything that is currently on, as one removable row. Without this you have to
   * open every folder to remember what you asked for — the single biggest thing that
   * made the old panel hard to read.
   */
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(value.search.trim() ? [{
      key: 'search', label: `“${value.search.trim()}”`, onRemove: () => onChange({ ...value, search: '' }),
    }] : []),
    ...(value.raw === 'raw' ? [{
      key: 'raw', label: `${RAW.emoji} Só ${RAW.label}`, onRemove: () => onChange({ ...value, raw: 'all' }),
    }] : []),
    ...(value.wholeFood ? [{
      key: 'wholeFood', label: `${WHOLE_FOOD.yes.emoji} Só ${WHOLE_FOOD.yes.label.toLowerCase()}`, onRemove: () => onChange({ ...value, wholeFood: false }),
    }] : []),
    ...value.types.map(id => {
      const c = typeChipFor(id);
      return { key: `type-${id}`, label: `${c.emoji} ${c.label}`, onRemove: () => toggle('types', id) };
    }),
    ...avoid.map(id => {
      const f = avoidFilterById(id);
      return { key: `avoid-${id}`, label: `${f?.emoji || ''} ${f?.label || id}`.trim(), onRemove: () => toggleAvoid(id) };
    }),
    ...value.allergens.map(id => {
      const a = allergenById(id);
      return { key: `allergen-${id}`, label: `${a?.emoji || ''} ${a?.label || id}`.trim(), onRemove: () => toggle('allergens', id) };
    }),
    ...value.ingredients.map(id => ({
      key: `ing-${id}`, label: counts.ingredient.get(id)?.label || id, onRemove: () => toggle('ingredients', id),
    })),
    ...value.status.map(id => ({
      key: `status-${id}`, label: STATUSES.find(s => s.id === id)?.label || id, onRemove: () => toggle('status', id),
    })),
  ];

  const chip = (on: boolean, tone: 'allergen' | 'ingredient' | 'status' | 'type' | 'avoid'): React.CSSProperties => {
    const palette = tone === 'avoid'
      ? { bg: '#f4f0fa', border: '#8e74b8', color: '#5b4a7a' }
      : tone === 'ingredient'
      ? { bg: '#f0faf4', border: '#27ae60', color: '#1e6b3c' }
      : tone === 'status'
        ? { bg: '#eaf2fb', border: '#3b82c4', color: '#245d94' }
        : tone === 'type'
          ? { bg: '#fdf6e3', border: '#d4af37', color: '#8a6d1f' }
          : value.mode === 'free'
            ? { bg: '#eaf7ee', border: '#27ae60', color: '#1e6b3c' }
            : value.mode === 'may'
              ? { bg: '#fff4e0', border: '#e6a23c', color: '#8a5a00' }
              : { bg: '#fdecea', border: '#e74c3c', color: '#c0392b' };
    return {
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.82rem', cursor: 'pointer',
      fontFamily: 'inherit', lineHeight: 1.2,
      border: `1px solid ${on ? palette.border : '#e6ddcd'}`, background: on ? palette.bg : '#fff', color: on ? palette.color : '#6d5c50', fontWeight: on ? 700 : 500,
    };
  };
  const countBadge: React.CSSProperties = { fontSize: '0.72rem', opacity: 0.65, fontWeight: 700 };
  const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' };

  const folder = (id: string, icon: string, title: string, selected: number, children: React.ReactNode) => {
    const isOpen = openFolders.includes(id);
    return (
      <div key={id} className="trm-folder" data-open={isOpen ? 'true' : 'false'}>
        <button type="button" onClick={() => toggleFolder(id)} aria-expanded={isOpen} className="trm-folder__btn">
          <span aria-hidden className="trm-folder__icon">{icon}</span>
          <span className="trm-folder__title">{title}</span>
          {selected > 0 && <span className="trm-folder__badge">{selected}</span>}
          <span aria-hidden className="trm-folder__caret">▾</span>
        </button>
        {/* Long lists (ingredients) scroll inside the folder; the sheet already scrolls as a whole. */}
        {isOpen && <div className="trm-folder__body" style={sheet ? undefined : { maxHeight: '16rem', overflowY: 'auto' }}>{children}</div>}
      </div>
    );
  };

  const bodyContent = (
    <>
      <div className="trm-search">
        <span aria-hidden className="trm-search__icon">🔎</span>
        <input
          type="search" value={value.search} onChange={e => onChange({ ...value, search: e.target.value })}
          placeholder="Buscar pelo nome do doce…" aria-label="Buscar pelo nome do doce"
        />
        {value.search && (
          <button type="button" aria-label="Limpar busca" className="trm-search__clear" onClick={() => onChange({ ...value, search: '' })}>✕</button>
        )}
      </div>

      <div>
        <div role="group" aria-label="Como usar os itens marcados" className="trm-modes">
          {modes.map(m => (
            <button key={m.id} type="button" onClick={() => onChange({ ...value, mode: m.id })} aria-pressed={value.mode === m.id}
              data-on={value.mode === m.id ? 'true' : 'false'}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="trm-help">{mode.help}</p>
      </div>

      {activeChips.length > 0 && (
        <div className="trm-active">
          <span className="trm-active__label">Filtrando por</span>
          <div className="trm-active__chips">
            {activeChips.map(c => (
              <button key={c.key} type="button" className="trm-active__chip" onClick={c.onRemove} title="Remover este filtro">
                {c.label} <span aria-hidden>✕</span>
              </button>
            ))}
            <button type="button" className="trm-active__clear" onClick={clearAll}>Limpar tudo</button>
          </div>
        </div>
      )}

      {isPublic && value.mode === 'free' && value.allergens.length + value.ingredients.length > 0 && (
        <p className="trm-warn">
          ⚠️ Baseado no que informamos para cada doce. Tudo é feito na mesma cozinha, então em caso de alergia grave fale com a gente no WhatsApp antes de pedir.
          {hiddenUnknown > 0 && <> {hiddenUnknown} {hiddenUnknown === 1 ? 'doce ainda sem' : 'doces ainda sem'} informação de alérgenos {hiddenUnknown === 1 ? 'foi ocultado' : 'foram ocultados'} desta busca.</>}
        </p>
      )}

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {!isPublic && folder('status', '🏷️', 'Situação', value.status.length,
          <div style={chipRow}>
            {STATUSES.map(s => (
              <button key={s.id} type="button" onClick={() => toggle('status', s.id)} style={chip(value.status.includes(s.id), 'status')}>
                {s.label} <span style={countBadge}>{statusCount(s.id)}</span>
              </button>
            ))}
          </div>,
        )}

        {folder('allergens', '⚠️', isPublic ? 'Alergias' : 'Alérgenos', value.allergens.filter(id => ALLERGENS.some(a => a.id === id)).length,
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div style={chipRow}>
              {ALLERGENS.map(a => (
                <button key={a.id} type="button" title={a.hint} onClick={() => toggle('allergens', a.id)} style={chip(value.allergens.includes(a.id), 'allergen')}>
                  {a.emoji} {a.label} <span style={countBadge}>{counts.allergen.get(a.id) || 0}</span>
                </button>
              ))}
            </div>
            {isPublic && <KitchenFacts style={{ paddingTop: '0.75rem', borderTop: '1px dashed #e8e1d7' }} />}
          </div>,
        )}

        {folder('sugar', '🍬', 'Açúcar e cafeína', avoid.length,
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            <div style={chipRow}>
              {AVOID_FILTERS.map(f => (
                <button key={f.id} type="button" title={f.hint} onClick={() => toggleAvoid(f.id)} aria-pressed={avoid.includes(f.id)} style={chip(avoid.includes(f.id), 'avoid')}>
                  {f.emoji} {f.label} <span style={countBadge}>{treats.filter(f.ok).length}</span>
                </button>
              ))}
            </div>
            {/* The hint of the last filter switched on: it's the one the person is thinking about right now. */}
            {avoid.length > 0 && (
              <p style={{ fontSize: '0.78rem', color: '#6d5c7f', lineHeight: 1.55, margin: 0 }}>{avoidFilterById(avoid[avoid.length - 1])?.hint}</p>
            )}
            {avoidUnknown > 0 && (
              <p style={{ fontSize: '0.78rem', color: '#8a5a00', lineHeight: 1.55, margin: 0 }}>
                {avoidUnknown} {avoidUnknown === 1 ? 'doce ainda não tem' : 'doces ainda não têm'} essa informação e {avoidUnknown === 1 ? 'ficou' : 'ficaram'} de fora.
                {isPublic ? ' Pergunte pra gente no WhatsApp.' : ''}
              </p>
            )}
          </div>,
        )}

        {folder('ingredients', '🌿', 'Ingredientes', value.ingredients.length,
          ingredientList.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', margin: 0 }}>Nenhum ingrediente cadastrado ainda.</p>
          ) : (
            <div style={chipRow}>
              {ingredientList.map(i => (
                <button key={i.key} type="button" onClick={() => toggle('ingredients', i.key)} style={chip(value.ingredients.includes(i.key), 'ingredient')}>
                  {i.label} <span style={countBadge}>{i.n}</span>
                </button>
              ))}
            </div>
          ),
        )}
      </div>
    </>
  );

  const title = isPublic ? 'Alergias e preferências' : 'Refinar busca';

  return (
    <>
      <style>{`
        .trm-panel { background: #fff; border: 1px solid rgba(212,175,55,0.3); border-radius: 16px; box-shadow: 0 10px 28px rgba(60,42,33,0.09); margin-bottom: 1.5rem; overflow: hidden; }

        /* ── Header: icon · title over the count · badge · caret. One tidy line each, no wrapping. ── */
        .trm-head { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1.05rem; border: none; cursor: pointer; text-align: left;
          background: linear-gradient(135deg, #6f4c39 0%, #8b6249 100%); font-family: inherit; transition: filter .15s; }
        .trm-head:hover { filter: brightness(1.08); }
        .trm-head:focus-visible { outline: 2px solid #f4d675; outline-offset: -3px; }
        .trm-head__icon { flex: none; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; background: rgba(255,255,255,0.16); font-size: 1rem; }
        .trm-head__text { flex: 1; min-width: 0; display: block; }
        .trm-head__text b { display: block; font-size: 0.98rem; font-weight: 800; color: #fff; line-height: 1.25; }
        .trm-head__text i { display: block; font-style: normal; font-size: 0.76rem; color: rgba(255,255,255,0.75); margin-top: 0.15rem; }
        .trm-head__badge { flex: none; background: #f4d675; color: #3c2a21; border-radius: 999px; padding: 0.15rem 0.6rem; font-size: 0.76rem; font-weight: 800; }
        .trm-head__caret { flex: none; color: #f4d675; font-size: 0.9rem; transition: transform .18s; }
        .trm-head[data-open="true"] .trm-head__caret { transform: rotate(180deg); }

        .trm-body { padding: 1rem; display: grid; gap: 0.9rem; border-top: 1px solid #f2ece1; }

        /* ── Search ── */
        .trm-search { position: relative; display: flex; align-items: center; }
        .trm-search__icon { position: absolute; left: 0.75rem; font-size: 0.85rem; opacity: 0.55; pointer-events: none; }
        .trm-search input { width: 100%; min-height: 42px; padding: 0.6rem 2.2rem 0.6rem 2.25rem; border: 1px solid #e6ddcd; border-radius: 10px; font-size: 0.92rem; font-family: inherit; color: #3c2a21; background: #fffdf8; }
        .trm-search input:focus { outline: none; border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.18); }
        .trm-search input::-webkit-search-cancel-button { display: none; }
        .trm-search__clear { position: absolute; right: 0.45rem; width: 28px; height: 28px; border: none; border-radius: 50%; background: #f1ece2; color: #6d5c50; cursor: pointer; font-size: 0.75rem; line-height: 1; }

        /* ── Mode switch ── */
        .trm-modes { display: flex; padding: 3px; gap: 3px; background: #f5efe4; border-radius: 12px; }
        .trm-modes button { flex: 1; min-width: 0; min-height: 38px; padding: 0.45rem 0.35rem; border: none; border-radius: 9px; cursor: pointer;
          font-family: inherit; font-size: 0.82rem; font-weight: 700; line-height: 1.15; color: #7a6a5d; background: transparent; transition: background .15s, color .15s; }
        .trm-modes button[data-on="true"] { background: #3c2a21; color: #fff; box-shadow: 0 2px 6px rgba(60,42,33,0.25); }
        .trm-modes button:focus-visible { outline: 2px solid #d4af37; outline-offset: 1px; }
        .trm-help { font-size: 0.78rem; color: #8a7a6b; line-height: 1.5; margin: 0.55rem 0 0; }

        /* ── What's on right now ── */
        .trm-active { background: #fdf8ef; border: 1px solid rgba(212,175,55,0.35); border-radius: 12px; padding: 0.7rem 0.8rem; }
        .trm-active__label { display: block; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #9a7a1f; margin-bottom: 0.5rem; }
        .trm-active__chips { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
        .trm-active__chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.6rem; border-radius: 999px; cursor: pointer;
          background: #fff; border: 1px solid #e0d3b4; color: #5d4c42; font-family: inherit; font-size: 0.78rem; font-weight: 600; }
        .trm-active__chip:hover { border-color: #c0392b; color: #c0392b; }
        .trm-active__chip span { opacity: 0.5; font-size: 0.7rem; }
        .trm-active__chip:hover span { opacity: 1; }
        .trm-active__clear { margin-left: auto; padding: 0.3rem 0.2rem; background: none; border: none; cursor: pointer; font-family: inherit;
          font-size: 0.76rem; font-weight: 700; color: #8a6d1f; text-decoration: underline; }

        .trm-warn { font-size: 0.8rem; color: #8a5a00; background: #fff4e0; border: 1px solid #f0d09a; border-radius: 10px; padding: 0.65rem 0.8rem; margin: 0; line-height: 1.6; }

        /* ── Folders ── */
        .trm-folder { border: 1px solid #f0e9dd; border-radius: 12px; background: #fff; overflow: hidden; }
        .trm-folder[data-open="true"] { border-color: rgba(212,175,55,0.45); }
        .trm-folder__btn { width: 100%; display: flex; align-items: center; gap: 0.6rem; min-height: 46px; padding: 0.6rem 0.8rem; border: none; cursor: pointer;
          text-align: left; background: #fff; font-family: inherit; font-size: 0.9rem; font-weight: 700; color: #3c2a21; }
        .trm-folder[data-open="true"] .trm-folder__btn { background: #fdf8ef; }
        .trm-folder__btn:focus-visible { outline: 2px solid #d4af37; outline-offset: -2px; }
        .trm-folder__icon { flex: none; font-size: 0.95rem; }
        .trm-folder__title { flex: 1; min-width: 0; }
        .trm-folder__badge { flex: none; background: #d4af37; color: #fff; border-radius: 999px; padding: 0.05rem 0.5rem; font-size: 0.73rem; font-weight: 800; }
        .trm-folder__caret { flex: none; color: #b99a3e; font-size: 0.75rem; transition: transform .18s; }
        .trm-folder[data-open="true"] .trm-folder__caret { transform: rotate(180deg); }
        .trm-folder__body { padding: 0.15rem 0.8rem 0.85rem; }

        /* ── Phone sheet ── */
        .trm-fab { position: fixed; left: 50%; transform: translateX(-50%); z-index: 950; display: inline-flex; align-items: center; gap: .5rem;
          padding: .8rem 1.3rem; border: none; border-radius: 999px; background: linear-gradient(135deg, #7a5540, #93694f); color: #fff;
          font-family: inherit; font-weight: 800; font-size: .95rem; box-shadow: 0 10px 28px rgba(60,42,33,.4); cursor: pointer; white-space: nowrap; }
        .trm-fab-count { background: rgba(255,255,255,.22); border-radius: 999px; padding: .05rem .55rem; font-size: .78rem; font-weight: 700; }
        .trm-backdrop { position: fixed; inset: 0; z-index: 9990; background: rgba(0,0,0,.5); display: flex; align-items: flex-end; }
        .trm-sheet { width: 100%; max-height: 88vh; max-height: 88dvh; background: #fff; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; box-shadow: 0 -10px 40px rgba(0,0,0,.3); }
        .trm-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid #f2ece1; }
        .trm-sheet-body { overflow-y: auto; padding: 1rem 1.25rem; display: grid; gap: 0.9rem; align-content: start; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .trm-sheet-foot { display: flex; gap: .6rem; padding: .9rem 1.25rem calc(.9rem + env(safe-area-inset-bottom)); border-top: 1px solid #f2ece1; }
        @media (prefers-reduced-motion: reduce) { .trm-head__caret, .trm-folder__caret { transition: none; } }
      `}</style>

      <div className="trm-panel">
        <button type="button" ref={barRef} className="trm-head" data-open={open && !sheet ? 'true' : 'false'}
          onClick={() => (sheet ? setSheetOpen(true) : setOpen(o => !o))} aria-expanded={sheet ? sheetOpen : open}>
          <span aria-hidden className="trm-head__icon">🔎</span>
          <span className="trm-head__text">
            <b>{title}</b>
            <i>Mostrando {shown} de {treats.length} doces</i>
          </span>
          {active > 0 && <span className="trm-head__badge">{active}</span>}
          <span aria-hidden className="trm-head__caret">▾</span>
        </button>

        {open && !sheet && <div className="trm-body">{bodyContent}</div>}
      </div>

      {sheet && (
        <>
          {barPassed && !sheetOpen && (
            <button type="button" className="trm-fab" style={{ bottom: `calc(${fabBottom} + env(safe-area-inset-bottom))` }} onClick={() => setSheetOpen(true)}>
              <span aria-hidden>🔎</span> Filtrar{active > 0 ? ` · ${active}` : ''}
              <span className="trm-fab-count">{shown}/{treats.length}</span>
            </button>
          )}
          {sheetOpen && (
            <div className="trm-backdrop" onClick={() => setSheetOpen(false)}>
              <div className="trm-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
                <div className="trm-sheet-head">
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#3c2a21' }}>🔎 {title}</strong>
                    <span style={{ fontSize: '0.82rem', color: '#8a7a6b' }}>Mostrando {shown} de {treats.length} doces</span>
                  </div>
                  <button type="button" aria-label="Fechar" onClick={() => setSheetOpen(false)} style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', border: 'none', background: '#f1ece2', fontSize: '1.2rem', cursor: 'pointer', color: '#3c2a21' }}>✕</button>
                </div>
                <div className="trm-sheet-body">{bodyContent}</div>
                <div className="trm-sheet-foot">
                  {active > 0 && (
                    <button type="button" onClick={clearAll} style={{ padding: '0.85rem 1.1rem', background: '#f1ece2', color: '#3c2a21', border: 'none', borderRadius: '10px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Limpar</button>
                  )}
                  <button type="button" onClick={() => setSheetOpen(false)} style={{ flex: 1, padding: '0.85rem 1.1rem', background: '#3c2a21', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontFamily: 'inherit', fontSize: '1rem', cursor: 'pointer' }}>
                    Ver {shown} {shown === 1 ? 'doce' : 'doces'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
