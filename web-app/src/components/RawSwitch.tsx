'use client';

import React from 'react';
import { RAW, isRaw, type RawableTreat, type RawFilter } from '@/lib/treatTypes';

/**
 * "Todos · 🌿 Raw · 🔥 Do forno": the one control for raw, which is a yes/no on every treat rather
 * than a kind of treat (see RAW in treatTypes.ts). It sits above the type pills and crosses with them,
 * so "Raw" + "Bolos" is the raw cakes. A segmented switch rather than one more pill because the three
 * answers exclude each other, and because raw is the question some guests arrive with ("do you have
 * raw?"): it should be the first thing they can answer with one tap.
 *
 * Hidden when it can only do nothing: no raw treat at all, or every treat raw.
 */
export default function RawSwitch({ treats, value, onChange, tone = 'dark' }: {
  /** The WHOLE catalogue, so the counts don't move while the other filters change. */
  treats: RawableTreat[];
  value: RawFilter;
  onChange: (next: RawFilter) => void;
  /** 'dark' for the cocoa /menu section, 'light' for the admin's grey. */
  tone?: 'dark' | 'light';
}) {
  const raw = treats.filter(isRaw).length;
  const cooked = treats.length - raw;
  if (raw === 0 || cooked === 0) return null;

  const options: { id: RawFilter; label: React.ReactNode; n: number; on: string; text: string }[] = [
    { id: 'all', label: 'Todos', n: treats.length, on: '#d4af37', text: '#3c2a21' },
    { id: 'raw', label: <><span aria-hidden>{RAW.emoji}</span> {RAW.label}</>, n: raw, on: RAW.accent, text: '#ffffff' },
    { id: 'cooked', label: <><span aria-hidden>🔥</span> Do forno</>, n: cooked, on: '#b8743a', text: '#ffffff' },
  ];

  return (
    <div className="rsw" data-tone={tone}>
      <div className="rsw__track" role="radiogroup" aria-label="Raw ou do forno">
        {options.map(o => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              className="rsw__opt"
              data-on={on ? 'true' : 'false'}
              onClick={() => onChange(o.id)}
              style={on ? { background: o.on, color: o.text } : undefined}
            >
              {o.label} <span className="rsw__n">{o.n}</span>
            </button>
          );
        })}
      </div>
      {value === 'raw' && (
        <p className="rsw__hint"><strong>{RAW.emoji} Raw</strong> = {RAW.hint}.</p>
      )}

      <style>{`
        /* Wide screens: hug the buttons and line up with the type pills on the right. */
        .rsw { display: flex; flex-direction: column; align-items: flex-end; gap: 0.45rem; min-width: 0; max-width: 100%; text-align: right; }
        .rsw__track {
          display: inline-flex; gap: 3px; padding: 3px; border-radius: 999px;
          background: rgba(253,250,243,0.12); border: 1px solid rgba(212,175,55,0.45);
        }
        .rsw[data-tone="light"] .rsw__track { background: #fff; border-color: #e6ddcd; }
        .rsw__opt {
          flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
          min-height: 40px; padding: 0.4rem 1rem; border: none; border-radius: 999px; cursor: pointer;
          white-space: nowrap; font-family: inherit; font-size: 0.86rem; font-weight: 700; line-height: 1;
          background: transparent; color: #f3e9d6; transition: background .15s, color .15s;
        }
        .rsw[data-tone="light"] .rsw__opt { color: #6d5c50; }
        .rsw__opt[data-on="false"]:hover { background: rgba(253,250,243,0.14); }
        .rsw[data-tone="light"] .rsw__opt[data-on="false"]:hover { background: #f6f1e7; }
        .rsw__opt[data-on="true"] { box-shadow: 0 3px 10px rgba(0,0,0,0.22); }
        .rsw__opt:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; }
        .rsw__n { font-size: 0.75rem; opacity: 0.7; }
        .rsw__hint { margin: 0; max-width: 34rem; font-size: 0.8rem; line-height: 1.5; color: #e9dcc4; }
        .rsw[data-tone="light"] .rsw__hint { color: #4d6b3a; }
        .rsw__hint strong { color: #a9cf8c; }
        .rsw[data-tone="light"] .rsw__hint strong { color: ${RAW.accent}; }
        /* Phones: the switch spans the column, three equal thirds, easy to hit with a thumb. */
        @media (max-width: 1023px) {
          .rsw { align-items: stretch; text-align: left; }
          .rsw__track { display: flex; }
          .rsw__opt { flex: 1 1 0; padding-inline: 0.5rem; }
        }
        @media (prefers-reduced-motion: reduce) { .rsw__opt { transition: none; } }
      `}</style>
    </div>
  );
}
