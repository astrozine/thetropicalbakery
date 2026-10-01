'use client';

import React from 'react';
import { SOS_EXPLAINER, WHOLE_FOOD } from '@/lib/sugarCaffeine';

/**
 * "O que é SOS-free?": a one-tap answer wherever the word appears (the menu, the philosophy section,
 * a treat's full view). Most people have never heard the term, so it's never used without this nearby.
 * The words live in SOS_EXPLAINER (sugarCaffeine.ts) so every page tells it the same way, credits
 * Alan Goldhamer, and never implies a link with him.
 *
 * A native <details>: works without JavaScript, keyboard and screen-reader friendly, and closed by
 * default so it costs one line of space.
 */
export default function SosFreeExplainer({ tone = 'light', open = false, style }: {
  /** 'dark' on the cocoa sections (the /menu catalogue), 'light' on cream and white. */
  tone?: 'light' | 'dark';
  open?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <details className="sosx" data-tone={tone} open={open} style={style}>
      <summary>
        <span aria-hidden>{WHOLE_FOOD.yes.emoji}</span> <span className="sosx__q">{SOS_EXPLAINER.question}</span>
        <span aria-hidden className="sosx__caret">▾</span>
      </summary>
      <div className="sosx__body">
        <p>{SOS_EXPLAINER.what}</p>
        <p>{SOS_EXPLAINER.ours}</p>
        <p className="sosx__exception">{SOS_EXPLAINER.exception}</p>
        <p className="sosx__occasion">{SOS_EXPLAINER.occasion}</p>
        <p className="sosx__credit">{SOS_EXPLAINER.credit}</p>
      </div>
      <style>{`
        .sosx { max-width: 40rem; font-size: 0.88rem; line-height: 1.6; text-align: left; }
        .sosx summary {
          display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; cursor: pointer; list-style: none;
          font-weight: 700; color: #6b7f3a;
        }
        .sosx__q { text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }
        .sosx summary::-webkit-details-marker { display: none; }
        .sosx summary:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; border-radius: 4px; }
        .sosx__caret { font-size: 0.75rem; transition: transform .18s; display: inline-block; }
        .sosx[open] .sosx__caret { transform: rotate(180deg); }
        .sosx__body { display: grid; gap: 0.55rem; margin-top: 0.3rem; padding: 0.9rem 1rem; border-radius: 12px;
          background: #f4f6ec; border: 1px solid #d5ddbd; color: #3f4a2a; text-align: left; }
        .sosx__body p { margin: 0; }
        .sosx__exception { padding: 0.5rem 0.7rem; border-radius: 8px; background: #fbeee2; color: #6e3a10; }
        .sosx__occasion { font-weight: 700; }
        .sosx__credit { font-size: 0.78rem; opacity: 0.8; }
        .sosx[data-tone="dark"] summary { color: #c9dba0; }
        .sosx[data-tone="dark"] .sosx__body { background: rgba(253,250,243,0.08); border-color: rgba(201,219,160,0.35); color: #f3e9d6; }
        .sosx[data-tone="dark"] .sosx__exception { background: rgba(160,97,43,0.3); color: #fbe3cc; }
        @media (prefers-reduced-motion: reduce) { .sosx__caret { transition: none; } }
      `}</style>
    </details>
  );
}
