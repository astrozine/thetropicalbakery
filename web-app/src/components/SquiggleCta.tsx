'use client';

import React from 'react';

const DIAGONAL = 'M10,20 Q40,40 80,80 M55,80 L80,80 L80,55';   // points down and to the right
const STRAIGHT = 'M10,50 Q50,40 90,50 M65,40 L90,50 L65,60';   // points right

const Arrow = ({ d, mirror, className, w, h }: { d: string; mirror?: boolean; className: string; w: number; h: number }) => (
  <span aria-hidden className={`sq-cta-arrow ${className}`}>
    <svg width={w} height={h} viewBox="0 0 100 100" style={mirror ? { transform: 'scaleX(-1)' } : undefined}>
      <path d={d} fill="none" stroke="#e67e22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

/**
 * The hand-drawn, wobbling orange arrows from the /menu header, pointing in at a
 * call-to-action button from both sides (and from above on phones, where the
 * button fills the width). Wrap the button: <SquiggleCta><a ...>Reservar</a></SquiggleCta>
 */
export default function SquiggleCta({ children }: { children: React.ReactNode }) {
  return (
    <div className="sq-cta">
      <style>{`
        @keyframes sqCtaWiggle {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-2px, 2px) rotate(-1deg) scale(1.02); }
          66% { transform: translate(2px, -1px) rotate(1deg) scale(0.98); }
        }
        .sq-cta { position: relative; width: min(100%, 440px); margin: 0 auto; }
        .sq-cta-arrow { position: absolute; z-index: 2; pointer-events: none; line-height: 0;
          animation: sqCtaWiggle 0.3s steps(3, end) infinite; filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.25)); }
        .sq-cta-a1 { top: -52px; left: -120px; }
        .sq-cta-a2 { top: 50%; left: -118px; margin-top: -22px; }
        .sq-cta-a3 { top: -52px; right: -120px; }
        .sq-cta-a4 { top: 50%; right: -118px; margin-top: -22px; }
        @media (max-width: 767px) {
          .sq-cta-a1 { top: -50px; left: 6%; }
          .sq-cta-a3 { top: -50px; right: 6%; }
          .sq-cta-a2, .sq-cta-a4 { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .sq-cta-arrow { animation: none; } }
      `}</style>
      <Arrow d={DIAGONAL} className="sq-cta-a1" w={84} h={64} />
      <Arrow d={STRAIGHT} className="sq-cta-a2" w={92} h={44} />
      {children}
      <Arrow d={DIAGONAL} mirror className="sq-cta-a3" w={84} h={64} />
      <Arrow d={STRAIGHT} mirror className="sq-cta-a4" w={92} h={44} />
    </div>
  );
}
