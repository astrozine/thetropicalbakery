'use client';

import React, { useEffect, useState } from 'react';

export interface HeroBoxPhoto {
  src: string;
  /** Small caption on the card, e.g. the name of that earlier box. */
  caption?: string;
}

/**
 * A big tilted photo card that floats over a hero, like a print left on the table.
 * With more than one photo it slowly cross-fades through them (never when the visitor
 * prefers reduced motion). `side` picks where it sits on wide screens; on narrow
 * screens the page shows a strip instead, so this card is hidden there.
 */
export default function HeroBoxCard({ photos, side, delayMs = 0 }: { photos: HeroBoxPhoto[]; side: 'left' | 'right'; delayMs?: number }) {
  const [index, setIndex] = useState(0);
  const count = photos.length;

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => setIndex(i => (i + 1) % count), 5500);
    }, delayMs);
    return () => { clearTimeout(start); if (interval) clearInterval(interval); };
  }, [count, delayMs]);

  if (count === 0) return null;
  const current = photos[index % count];

  return (
    <figure className={`hero-box-card hero-box-card--${side}`} aria-label="Foto de uma caixa anterior">
      <div className="hero-box-card__frame">
        {photos.map((p, i) => (
          <img
            key={p.src}
            src={p.src}
            alt={p.caption ? `Caixa anterior: ${p.caption}` : 'Caixa de degustação anterior'}
            loading="lazy"
            style={{ opacity: i === index % count ? 1 : 0 }}
          />
        ))}
      </div>
      <figcaption>
        <span className="hero-box-card__tag">Edição anterior</span>
        {current.caption && <span className="hero-box-card__name">{current.caption}</span>}
      </figcaption>

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-box-card {
          display: none; margin: 0; position: absolute; top: 50%; z-index: 1;
          width: clamp(210px, 19vw, 440px);
          background: #fdfaf3; padding: clamp(8px, 0.8vw, 14px) clamp(8px, 0.8vw, 14px) 0; border-radius: 18px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.35);
          transition: transform .4s ease;
        }
        .hero-box-card--left  { left: 1.5vw;  transform: translateY(-50%) rotate(-5deg); }
        .hero-box-card--right { right: 1.5vw; transform: translateY(-46%) rotate(4deg); }
        .hero-box-card--left:hover  { transform: translateY(-50%) rotate(-2deg) scale(1.02); }
        .hero-box-card--right:hover { transform: translateY(-46%) rotate(2deg) scale(1.02); }
        .hero-box-card__frame { position: relative; aspect-ratio: 3 / 4; border-radius: 10px; overflow: hidden; background: #3c2a21; }
        .hero-box-card__frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 1.2s ease; }
        .hero-box-card figcaption { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0.7rem 0.5rem 0.9rem; color: #3c2a21; text-align: center; }
        .hero-box-card__tag { font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase; color: #a6832b; font-weight: 700; }
        .hero-box-card__name { font-family: var(--font-heading); font-size: 0.9rem; line-height: 1.25; }
        @media (min-width: 1360px) { .hero-box-card { display: block; } }
        @media (prefers-reduced-motion: reduce) { .hero-box-card, .hero-box-card__frame img { transition: none; } }
      ` }} />
    </figure>
  );
}

/** On screens too narrow for side cards: two smaller tilted photos in a row above the badge. */
export function HeroBoxStrip({ photos }: { photos: HeroBoxPhoto[] }) {
  const shown = photos.slice(0, 2);
  if (shown.length === 0) return null;
  return (
    <div className="hero-box-strip" aria-hidden={false}>
      {shown.map((p, i) => (
        <div key={p.src} className="hero-box-strip__item" style={{ transform: `rotate(${i === 0 ? -4 : 3.5}deg)`, marginTop: i === 0 ? 0 : '1.2rem' }}>
          <img src={p.src} alt={p.caption ? `Caixa anterior: ${p.caption}` : 'Caixa de degustação anterior'} loading="lazy" />
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        .hero-box-strip { display: flex; justify-content: center; gap: 0.9rem; margin: 0 auto 2rem; max-width: 460px; }
        .hero-box-strip__item { flex: 1 1 0; background: #fdfaf3; padding: 6px; border-radius: 14px; box-shadow: 0 16px 32px rgba(0,0,0,0.5); }
        .hero-box-strip__item img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 9px; }
        @media (min-width: 1360px) { .hero-box-strip { display: none; } }
      ` }} />
    </div>
  );
}
