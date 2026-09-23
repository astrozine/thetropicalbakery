import React from 'react';

interface OrganicDividerProps {
  /** The color the wave flows INTO (the section below/above it). */
  color?: string;
  /** 'down' = wave sits at the bottom of a section, bulging down into what follows. */
  direction?: 'down' | 'up';
  height?: number;
  style?: React.CSSProperties;
}

/**
 * A hand-tuned organic wave, not a mechanical sine curve — the Burle Marx
 * calçada-wave motif reduced to a single flowing wave, used as a section
 * transition instead of a hard rectangular cut. Sits on top of whatever it
 * overlaps (negative margin handles the overlap at the call site).
 */
export default function OrganicDivider({ color = '#fdfaf3', direction = 'down', height = 90, style }: OrganicDividerProps) {
  const path = direction === 'down'
    ? 'M0,40 C 180,110 320,-10 520,50 C 720,110 860,-20 1080,40 C 1300,100 1440,10 1440,10 L1440,120 L0,120 Z'
    : 'M0,80 C 180,10 320,130 520,70 C 720,10 860,140 1080,80 C 1300,20 1440,110 1440,110 L1440,0 L0,0 Z';

  return (
    <div style={{ position: 'relative', height: `${height}px`, overflow: 'hidden', lineHeight: 0, ...style }} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <path d={path} fill={color} />
      </svg>
    </div>
  );
}
