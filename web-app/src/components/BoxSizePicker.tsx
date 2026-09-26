'use client';

import React from 'react';
import { TREAT_COUNTS, TreatCount } from '@/lib/boxSizes';
import { formatBRL } from '@/lib/deliveryZones';

interface Props {
  value: TreatCount;
  onChange: (size: TreatCount) => void;
  /** Price of one box of each size, already worked out for where it is shown (one-off or a plan). */
  priceOf: (size: TreatCount) => number;
  /** Small line under each price, e.g. "por caixa". */
  priceNote?: string;
  /** Light cards (order form) or on a dark background. */
  tone?: 'light' | 'dark';
  title?: string;
}

/**
 * "Quantos doces?": three cards, 2 / 4 / 6 treats, with a row of little dots so the size reads at a glance.
 * Used on /caixas and in the subscription form, so a box is chosen the same way everywhere.
 */
export default function BoxSizePicker({ value, onChange, priceOf, priceNote, tone = 'light', title = 'Quantos doces na caixa?' }: Props) {
  return (
    <div className={`bsp bsp-${tone}`}>
      <style>{`
        .bsp-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.7rem; }
        .bsp-light .bsp-title { color: #3c2a21; }
        .bsp-dark .bsp-title { color: #fdfaf3; }
        .bsp-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
        .bsp-opt { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; min-height: 44px;
          padding: 0.9rem 0.4rem 0.8rem; border-radius: 16px; cursor: pointer; font: inherit; text-align: center;
          transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s, background 0.15s; }
        .bsp-light .bsp-opt { background: #fdf7ee; border: 2px solid #e8e1d7; color: #3c2a21; }
        .bsp-dark .bsp-opt { background: rgba(255,255,255,0.06); border: 2px solid rgba(212,175,55,0.35); color: #fdfaf3; }
        .bsp-opt:hover { transform: translateY(-2px); }
        .bsp-opt[aria-checked="true"] { border-color: #d4af37; box-shadow: 0 10px 24px rgba(212,175,55,0.28); }
        .bsp-light .bsp-opt[aria-checked="true"] { background: #fff8e6; }
        .bsp-dark .bsp-opt[aria-checked="true"] { background: rgba(212,175,55,0.16); }
        .bsp-opt:focus-visible { outline: 3px solid #d4af37; outline-offset: 2px; }
        .bsp-dots { display: grid; grid-template-columns: repeat(var(--cols), 10px); gap: 4px; justify-content: center; min-height: 24px; align-content: center; }
        .bsp-dot { width: 10px; height: 10px; border-radius: 50%; background: #d4af37; box-shadow: inset 0 -2px 0 rgba(0,0,0,0.15); }
        .bsp-n { font-family: var(--font-heading); font-size: 1.35rem; line-height: 1; }
        .bsp-word { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
        .bsp-price { font-weight: 800; font-size: 1rem; }
        .bsp-note { font-size: 0.75rem; opacity: 0.75; margin-top: -0.25rem; }
        .bsp-tick { position: absolute; top: -8px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: #d4af37; color: #fff;
          font-size: 0.75rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        @media (prefers-reduced-motion: reduce) { .bsp-opt { transition: none; } .bsp-opt:hover { transform: none; } }
      `}</style>
      {title && <p className="bsp-title">{title}</p>}
      <div className="bsp-row" role="radiogroup" aria-label={title || 'Tamanho da caixa'}>
        {TREAT_COUNTS.map(size => {
          const on = size === value;
          return (
            <button key={size} type="button" role="radio" aria-checked={on} className="bsp-opt" onClick={() => onChange(size)}>
              {on && <span className="bsp-tick" aria-hidden>✓</span>}
              <span className="bsp-dots" aria-hidden style={{ ['--cols' as string]: size > 4 ? 3 : 2 }}>
                {Array.from({ length: size }).map((_, i) => <span key={i} className="bsp-dot" />)}
              </span>
              <span className="bsp-n">{size}</span>
              <span className="bsp-word">doces</span>
              <span className="bsp-price">{formatBRL(priceOf(size))}</span>
              {priceNote && <span className="bsp-note">{priceNote}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
