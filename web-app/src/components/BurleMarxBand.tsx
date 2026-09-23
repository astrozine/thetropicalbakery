import React from 'react';

interface BurleMarxBandProps {
  height?: number;
  style?: React.CSSProperties;
}

/**
 * The real Burle Marx move isn't one faint shape in a corner — it's several
 * solid, high-contrast organic bands winding through and over each other
 * (like the Copacabana calçada or his garden mosaics), punctuated by round
 * "tree well" accents. This is that, reduced to a decorative strip: three
 * interlocking flowing ribbons in the house palette plus a scatter of solid
 * circles, at full opacity so it actually reads instead of disappearing.
 */
export default function BurleMarxBand({ height = 130, style }: BurleMarxBandProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px`, overflow: 'hidden', ...style }} aria-hidden>
      <svg viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* Base ribbon — deep cocoa, widest, sits furthest back */}
        <path
          d="M0,120 C 140,60 220,170 380,110 C 540,50 620,150 800,100 C 980,50 1080,160 1260,100 C 1360,68 1440,110 1440,110 L1440,200 L0,200 Z"
          fill="#3c2a21"
        />
        {/* Second ribbon — gold, interlocking with the first, offset higher */}
        <path
          d="M0,150 C 160,100 260,190 420,150 C 600,105 700,185 880,150 C 1060,110 1160,190 1320,150 C 1380,135 1440,155 1440,155 L1440,200 L0,200 Z"
          fill="#d4af37"
          opacity="0.9"
        />
        {/* Third ribbon — sage green, thinnest, riding the top edge */}
        <path
          d="M0,70 C 120,40 240,95 400,55 C 580,10 660,90 840,55 C 1020,20 1120,90 1280,55 C 1360,38 1440,60 1440,60 L1440,0 L0,0 Z"
          fill="#2e4432"
        />
        {/* Tree-well accent circles, scattered like the reference gardens */}
        <circle cx="180" cy="100" r="16" fill="#fdfaf3" />
        <circle cx="700" cy="130" r="11" fill="#fdfaf3" opacity="0.85" />
        <circle cx="1150" cy="90" r="20" fill="#fdfaf3" />
        <circle cx="1340" cy="130" r="9" fill="#fdfaf3" opacity="0.85" />
      </svg>
    </div>
  );
}
