'use client';

import React, { useMemo } from 'react';
import { OUTROS_ACCENT, OUTROS_KEY, RAW, TREAT_TYPES, isRaw, textOn, typeKeyOf, type TypeableTreat } from '@/lib/treatTypes';
import { WHOLE_FOOD, isWholeFood, sugarsOf } from '@/lib/sugarCaffeine';
import type { RefineState } from '@/components/TreatRefineMenu';

/** An on/off pill at the start of the row: a way of making treats (Raw, Integral), not a kind of treat. */
export interface StyleToggle {
  key: string;
  emoji: string;
  label: string;
  accent: string;
  hint: string;
  on: boolean;
  /** How many treats it keeps. */
  n: number;
  match: (t: never) => boolean;
  onToggle: () => void;
  /** Shown under the row while it's on. */
  note?: string;
}

type StyleTreat = TypeableTreat & { is_raw?: boolean | null; sugars?: string[] | null; sugar?: string | null; ingredients?: string[] | null };

/**
 * 🌿 Raw and 🌾 Integral, the two "how is it made" questions, as pills in the same row as the kinds of
 * treat: one row of controls instead of a switch plus a row. Each only appears when it can change
 * something (Raw: some treats are raw and some aren't; Integral: at least one treat is known not to be).
 */
export function styleToggles<T extends StyleTreat>(treats: T[], refine: RefineState, onChange: (next: RefineState) => void): StyleToggle[] {
  const raw = treats.filter(t => isRaw(t)).length;
  const whole = treats.filter(t => isWholeFood(t) === true).length;
  const notWhole = treats.filter(t => isWholeFood(t) === false).length;
  const unknown = treats.filter(t => !sugarsOf(t) && isWholeFood(t) === null).length;
  const rawOn = refine.raw === 'raw';
  const out: StyleToggle[] = [];
  if (raw > 0 && raw < treats.length) out.push({
    key: 'raw', emoji: RAW.emoji, label: RAW.label, accent: RAW.accent, hint: RAW.hint, on: rawOn, n: raw,
    match: (t: StyleTreat) => isRaw(t),
    onToggle: () => onChange({ ...refine, raw: rawOn ? 'all' : 'raw' }),
    note: `${RAW.emoji} Raw = ${RAW.hint}.`,
  } as StyleToggle);
  // Both sides must exist: before Dolly declares anything, "SOS-free 0" would only look broken.
  if (notWhole > 0 && whole > 0) out.push({
    key: 'integral', emoji: WHOLE_FOOD.yes.emoji, label: WHOLE_FOOD.yes.label, accent: WHOLE_FOOD.yes.accent, hint: WHOLE_FOOD.yes.hint,
    on: !!refine.wholeFood, n: whole,
    match: (t: StyleTreat) => isWholeFood(t) === true,
    onToggle: () => onChange({ ...refine, wholeFood: !refine.wholeFood }),
    note: `${WHOLE_FOOD.yes.emoji} SOS-free = ${WHOLE_FOOD.yes.hint}. Ficam de fora os doces com chocolate vegano, o único ingrediente nosso que vem com açúcar e óleo`
      + (unknown ? ` e ${unknown} ${unknown === 1 ? 'doce' : 'doces'} que ainda não informamos.` : '.'),
  } as StyleToggle);
  return out;
}

/**
 * "Ver só…" — pick which KINDS of treat you want to look at.
 *
 * This crosses with the allergy/ingredient panel rather than replacing it: pick
 * Cookies here and "sem castanhas" there and you get cookies without nuts. It is
 * its own control, and its own row, because it answers a different question —
 * that one is "what can I eat", this one is "what am I in the mood for".
 *
 * Each pill wears the colour its group's tab wears over the cards, so picking
 * 🍪 Cookies and then seeing the brown 🍪 Cookies tab appear in the grid reads
 * as the same thing twice, not two unrelated bits of UI.
 *
 * Several pills can be on at once (they're OR'd — a treat has only one type), and
 * "Todos" is simply the state where none is chosen.
 */
export default function TreatTypeBar({ treats, value, onChange, label = 'Ver só', tone = 'dark', bleed = false, toggles = [] }: {
  /** The WHOLE catalogue, not the filtered view: the counts must not jump around as you pick. */
  treats: TypeableTreat[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  /** The surface behind the row: 'dark' for the cocoa /menu section, 'light' for the admin's grey. */
  tone?: 'dark' | 'light';
  /**
   * Let the strip run past the page gutter to the screen edge on phones, so it reads as
   * swipeable. Only safe where an ancestor clips horizontally, as /menu's <main> does.
   */
  bleed?: boolean;
  /** Raw / Integral pills, first in the row (see styleToggles). */
  toggles?: StyleToggle[];
}) {
  // The kinds are counted inside whatever Raw / Integral already keeps, so "Raw" only offers kinds that have one.
  const within = useMemo(
    () => treats.filter(t => toggles.every(g => !g.on || (g.match as (x: TypeableTreat) => boolean)(t))),
    [treats, toggles],
  );
  const options = useMemo(() => {
    const counts = new Map<string, number>();
    within.forEach(t => {
      const k = typeKeyOf(t);
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    const real = TREAT_TYPES.filter(t => counts.get(t.id)).map(t => ({
      key: t.id, emoji: t.emoji, label: t.label, accent: t.accent, n: counts.get(t.id) || 0, hint: t.hint,
    }));
    const outros = counts.get(OUTROS_KEY)
      ? [{ key: OUTROS_KEY, emoji: '✨', label: 'Outros', accent: OUTROS_ACCENT, n: counts.get(OUTROS_KEY) || 0, hint: undefined }]
      : [];
    return [...real, ...outros];
  }, [within]);

  // One kind of treat (or none) is not a choice — don't show a filter that can only do nothing.
  if (options.length < 2 && toggles.length === 0) return null;
  const notes = toggles.filter(g => g.on && g.note).map(g => g.note!);

  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);

  return (
    <div className="ttb-wrap" data-tone={tone}>
    <div className="ttb" data-tone={tone} data-bleed={bleed ? 'true' : 'false'} role="group" aria-label="Filtrar por tipo de doce">
      <span className="ttb__label">{label}</span>
      <div className="ttb__scroll">
        {/* Raw / Integral first, as on/off pills with a check, then a thin rule, then the kinds. */}
        {toggles.map(g => (
          <button
            key={g.key}
            type="button"
            className="ttb__pill ttb__pill--toggle"
            title={g.hint}
            aria-pressed={g.on}
            data-on={g.on ? 'true' : 'false'}
            onClick={g.onToggle}
            style={g.on ? { background: g.accent, color: '#fff', borderColor: g.accent } : { ['--pill-accent' as string]: g.accent } as React.CSSProperties}
          >
            <span aria-hidden>{g.on ? '✓' : g.emoji}</span> {g.label} <span className="ttb__n">{g.n}</span>
          </button>
        ))}
        {toggles.length > 0 && options.length >= 2 && <span aria-hidden className="ttb__rule" />}
        {options.length >= 2 && <>
        {/* "Todos" is gold rather than the cocoa the rest of the site uses for a pressed button:
            this row sits on a dark cocoa section, where cocoa-on-cocoa would read as nothing at all. */}
        <button
          type="button"
          className="ttb__pill"
          aria-pressed={value.length === 0}
          data-on={value.length === 0 ? 'true' : 'false'}
          onClick={() => onChange([])}
          style={value.length === 0 ? { background: '#d4af37', color: '#3c2a21', borderColor: '#d4af37' } : undefined}
        >
          Todos <span className="ttb__n">{within.length}</span>
        </button>

        {options.map(o => {
          const on = value.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              className="ttb__pill"
              title={o.hint}
              aria-pressed={on}
              data-on={on ? 'true' : 'false'}
              onClick={() => toggle(o.key)}
              style={on ? { background: o.accent, color: textOn(o.accent), borderColor: o.accent } : { ['--pill-accent' as string]: o.accent } as React.CSSProperties}
            >
              <span aria-hidden>{o.emoji}</span> {o.label} <span className="ttb__n">{o.n}</span>
            </button>
          );
        })}
        </>}
      </div>
    </div>
      {notes.length > 0 && <p className="ttb__note">{notes.join(' ')}</p>}

      <style>{`
        /* min-width/max-width matter: without them this flex item sizes to its content, the inner
           strip never gets to scroll, and the pills push the whole page sideways. */
        .ttb { display: flex; align-items: center; gap: 0.7rem; min-width: 0; max-width: 100%; }
        .ttb__label { flex: none; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #d4af37; }
        /* On a light surface the gold label washes out and the cream ring below disappears. */
        .ttb[data-tone="light"] .ttb__label { color: #8a6d1f; }
        /* Phones: one swipeable strip rather than a block of chips that pushes the treats down the page. */
        .ttb__scroll { display: flex; gap: 0.4rem; min-width: 0; overflow-x: auto; padding: 0.15rem 0.1rem; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .ttb__scroll::-webkit-scrollbar { display: none; }
        .ttb__pill {
          flex: none; display: inline-flex; align-items: center; gap: 0.35rem; min-height: 38px;
          padding: 0.42rem 0.85rem; border-radius: 999px; cursor: pointer; white-space: nowrap;
          font-family: inherit; font-size: 0.83rem; font-weight: 700; line-height: 1;
          background: #fff; color: #6d5c50; border: 1px solid #e6ddcd;
          transition: background .15s, color .15s, border-color .15s, transform .12s;
        }
        .ttb__pill:hover { border-color: var(--pill-accent, #d4af37); color: #3c2a21; }
        .ttb__pill:active { transform: scale(0.97); }
        .ttb__pill:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; }
        /* A cream ring around whatever is switched on, so even the darkest accent (Chocolates)
           still separates from the dark cocoa section behind it. */
        .ttb__pill[data-on="true"] { box-shadow: 0 0 0 2px rgba(253,250,243,0.85), 0 4px 12px rgba(0,0,0,0.25); }
        .ttb[data-tone="light"] .ttb__pill[data-on="true"] { box-shadow: 0 2px 8px rgba(44,62,80,0.22); }
        .ttb-wrap { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; max-width: 100%; }
        .ttb__rule { flex: none; width: 1px; align-self: stretch; margin: 0.35rem 0.2rem; background: rgba(212,175,55,0.45); }
        .ttb-wrap[data-tone="light"] .ttb__rule { background: #d8cfbf; }
        /* Toggles wear a dashed ring while off, so they read as switches rather than one more kind. */
        .ttb__pill--toggle[data-on="false"] { border-style: dashed; border-color: var(--pill-accent); }
        .ttb__note { margin: 0; max-width: 40rem; font-size: 0.8rem; line-height: 1.5; color: #e9dcc4; }
        .ttb-wrap[data-tone="light"] .ttb__note { color: #5d4c42; }
        .ttb__n { font-size: 0.72rem; font-weight: 700; opacity: 0.65; }
        .ttb__pill[data-on="true"] .ttb__n { opacity: 0.85; }

        @media (max-width: 1023px) {
          .ttb { gap: 0.5rem; }
          .ttb__label { display: none; }
          .ttb[data-bleed="true"] .ttb__scroll { margin-inline: -1rem; padding-inline: 1rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ttb__pill { transition: none; }
          .ttb__pill:active { transform: none; }
        }
      `}</style>
    </div>
  );
}
