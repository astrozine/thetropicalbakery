import React, { useId } from 'react';

/**
 * A neon-salmon sticker that floats beside the hero photo on wide screens: a solid disc with
 * the number of boxes still available punched out of it (the photo shows through the digits),
 * and "caixas disponíveis" written across it in script, at a diagonal.
 * Phones already show the count in the counter and the buy bar, so this only appears on wide
 * screens, next to the side photo cards (same breakpoint as HeroBoxCard).
 */
export default function BoxesLeftBadge({ remaining }: { remaining: number }) {
  const maskId = useId();
  if (remaining <= 0) return null;

  const digits = String(remaining).length;
  const fontSize = digits === 1 ? 128 : digits === 2 ? 98 : 70;

  return (
    <div className="boxes-left" role="img" aria-label={`${remaining} ${remaining === 1 ? 'caixa disponível' : 'caixas disponíveis'}`}>
      <svg className="boxes-left__disc" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="200" height="200" fill="#fff" />
            <text x="100" y="104" textAnchor="middle" dominantBaseline="central" fill="#000"
              style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize, letterSpacing: '-0.03em' }}>
              {remaining}
            </text>
          </mask>
        </defs>
        <circle cx="100" cy="100" r="92" fill="#ff7675" mask={`url(#${maskId})`} />
        <circle cx="100" cy="100" r="97.5" fill="none" stroke="#ff7675" strokeWidth="1.6" strokeDasharray="2 7" strokeLinecap="round" opacity="0.85" />
      </svg>
      <span className="boxes-left__label" aria-hidden="true">
        {remaining === 1 ? 'caixa' : 'caixas'}<br />{remaining === 1 ? 'disponível' : 'disponíveis'}
      </span>

      <style dangerouslySetInnerHTML={{ __html: `
        .boxes-left {
          display: none; position: absolute; z-index: 2; pointer-events: none;
          top: 9%; left: calc(1.5vw + clamp(210px, 19vw, 440px) - 2.2rem);
          width: clamp(128px, 9.5vw, 200px);
          animation: boxes-left-float 6s ease-in-out infinite;
        }
        .boxes-left__disc { display: block; width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 0 10px rgba(255,118,117,0.55)) drop-shadow(0 6px 18px rgba(0,0,0,0.4)); }
        .boxes-left__label {
          position: absolute; right: 12%; top: 100%; margin-top: 0.3rem; transform-origin: right top; transform: rotate(-13deg);
          font-family: 'Yellowtail', 'Brush Script MT', cursive; font-weight: 400;
          font-size: clamp(1.7rem, 2.1vw, 2.9rem); line-height: 0.95; white-space: nowrap; text-align: right;
          color: #ff7675; text-shadow: 0 0 14px rgba(255,118,117,0.5), 0 2px 10px rgba(0,0,0,0.55);
        }
        @keyframes boxes-left-float { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-8px) rotate(-4deg); } }
        @media (min-width: 1360px) { .boxes-left { display: block; } }
        @media (prefers-reduced-motion: reduce) { .boxes-left { animation: none; transform: rotate(-4deg); } }
      ` }} />
    </div>
  );
}
