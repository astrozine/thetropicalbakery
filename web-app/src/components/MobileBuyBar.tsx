'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  /** Small line above the price, e.g. "Caixa da semana". */
  kicker?: string;
  /** Already formatted: "R$ 99" or "a partir de R$ 99". */
  price: string;
  /** Tiny note under the price, e.g. "6 doces · entrega grátis". */
  note?: string;
  label: string;
  /** Where the real buy section lives on the page, e.g. "#order". */
  targetId: string;
}

/**
 * The bar every shopping app keeps under your thumb: what it costs, and one
 * button to buy it, always there.
 *
 * On this site the first buy button sat five to seven screens down, so a phone
 * visitor had to scroll past the whole story before finding out they could order
 * at all. This puts the price and the action on screen from the first swipe.
 *
 * It hides itself while the real order form is on screen — two identical buttons
 * fighting for the same tap is worse than none.
 */
export default function MobileBuyBar({ kicker, price, note, label, targetId }: Props) {
  const [hidden, setHidden] = useState(true);
  const raf = useRef(0);

  useEffect(() => {
    document.body.classList.add('has-buybar');

    const target = document.querySelector(targetId);
    // Show it once the reader has moved past the hero, and hide it again when
    // the real form is in front of them.
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const pastHero = window.scrollY > window.innerHeight * 0.55;
        let formVisible = false;
        if (target) {
          const r = target.getBoundingClientRect();
          formVisible = r.top < window.innerHeight * 0.85 && r.bottom > 0;
        }
        setHidden(!pastHero || formVisible);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.body.classList.remove('has-buybar');
    };
  }, [targetId]);

  const go = () => {
    const el = document.querySelector(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="tb-buybar" data-hidden={hidden ? 'true' : 'false'}>
      <div className="tb-buybar__price">
        {kicker && <span className="tb-buybar__kicker">{kicker}</span>}
        <strong>{price}</strong>
        {note && <span className="tb-buybar__note">{note}</span>}
      </div>
      <button type="button" onClick={go} className="tb-buybar__cta">{label}</button>

      <style>{`
        .tb-buybar { display: none; }
        @media (max-width: 767px) {
          .tb-buybar {
            position: fixed;
            /* sits directly on top of the bottom tab bar */
            bottom: calc(72px + env(safe-area-inset-bottom, 0px));
            left: 0; right: 0;
            z-index: 999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0.85rem;
            background: rgba(253,250,243,0.97);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid rgba(212,175,55,0.35);
            box-shadow: 0 -8px 24px rgba(60,42,33,0.13);
            transition: transform .28s cubic-bezier(.16,1,.3,1), opacity .28s;
          }
          .tb-buybar[data-hidden="true"] {
            transform: translateY(130%);
            opacity: 0;
            pointer-events: none;
          }
          .tb-buybar__price { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
          .tb-buybar__kicker { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: #a6832b; font-weight: 800; }
          .tb-buybar__price strong { font-family: var(--font-heading); font-size: 1.3rem; color: #3c2a21; }
          .tb-buybar__note { font-size: 0.72rem; color: #7a6a61; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .tb-buybar__cta {
            margin-left: auto;
            flex: 0 0 auto;
            min-height: 48px;
            padding: 0 1.4rem;
            border: none;
            border-radius: 999px;
            background: linear-gradient(135deg, #d4af37, #c19b2e);
            color: #3c2a21;
            font-family: inherit;
            font-weight: 800;
            font-size: 0.98rem;
            letter-spacing: 0.02em;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(212,175,55,0.45);
          }
          .tb-buybar__cta:active { transform: scale(0.97); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tb-buybar { transition: none; }
        }
      `}</style>
    </div>
  );
}
