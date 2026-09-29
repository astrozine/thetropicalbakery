'use client';

import React, { useMemo } from 'react';
import { OUTROS_ACCENT, OUTROS_KEY, TREAT_TYPES, textOn, typeKeyOf, type TypeableTreat } from '@/lib/treatTypes';

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
export default function TreatTypeBar({ treats, value, onChange, label = 'Ver só' }: {
  /** The WHOLE catalogue, not the filtered view: the counts must not jump around as you pick. */
  treats: TypeableTreat[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const options = useMemo(() => {
    const counts = new Map<string, number>();
    treats.forEach(t => {
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
  }, [treats]);

  // One kind of treat (or none) is not a choice — don't show a filter that can only do nothing.
  if (options.length < 2) return null;

  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);

  return (
    <div className="ttb" role="group" aria-label="Filtrar por tipo de doce">
      <span className="ttb__label">{label}</span>
      <div className="ttb__scroll">
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
          Todos <span className="ttb__n">{treats.length}</span>
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
      </div>

      <style>{`
        .ttb { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
        .ttb__label { flex: none; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #d4af37; }
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
        .ttb__n { font-size: 0.72rem; font-weight: 700; opacity: 0.65; }
        .ttb__pill[data-on="true"] .ttb__n { opacity: 0.85; }

        @media (max-width: 1023px) {
          .ttb { gap: 0.5rem; }
          .ttb__label { display: none; }
          /* Let the strip run to the screen edge so it's obviously swipeable. */
          .ttb__scroll { margin-inline: -1rem; padding-inline: 1rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ttb__pill { transition: none; }
          .ttb__pill:active { transform: none; }
        }
      `}</style>
    </div>
  );
}
