'use client';

import React from 'react';

/**
 * Wide horizontal bands in the house cocoa-and-gold-foil palette, with a thin
 * foil pinstripe between them — the awning/ticking stripe of an old patisserie
 * rather than a flat colour block.
 *
 * Built from a repeating gradient instead of an image so it stays crisp at any
 * size, costs nothing to load, and never has to be re-exported when the
 * palette changes.
 */

type Tone = 'dark' | 'light';

interface StripedBackgroundProps {
  children: React.ReactNode;
  /** 'dark' for cocoa bands with gold foil; 'light' for cream and sand. */
  tone?: Tone;
  /** Band height in px. Bigger reads calmer and more expensive. */
  bandHeight?: number;
  /**
   * A photo laid behind the text, desaturated and tinted cocoa so it adds texture without
   * competing with the heading. Use it for headers; it replaces the stripes.
   */
  image?: string;
  /** CSS background-position for `image`, to choose which part of the photo shows. */
  imagePosition?: string;
  id?: string;
  style?: React.CSSProperties;
  className?: string;
}

const TONES: Record<Tone, { a: string; b: string; foil: string; text: string }> = {
  dark: {
    a: '#3c2a21', // deep cocoa
    b: '#33231b', // one shade down, so the banding is felt more than seen
    foil: 'rgba(212,175,55,0.38)',
    text: '#fdfaf3',
  },
  light: {
    a: '#fdfaf3', // vintage cream
    b: '#f5efe2', // warm sand
    foil: 'rgba(212,175,55,0.30)',
    text: '#3c2a21',
  },
};

export default function StripedBackground({
  children,
  tone = 'dark',
  bandHeight = 88,
  image,
  imagePosition = 'center',
  id,
  style,
  className,
}: StripedBackgroundProps) {
  const t = TONES[tone];
  const foilWidth = 2;
  const period = bandHeight * 2 + foilWidth * 2;

  return (
    <section
      id={id}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        color: t.text,
        backgroundColor: t.a,
        backgroundImage: `repeating-linear-gradient(
          180deg,
          ${t.a} 0px,
          ${t.a} ${bandHeight}px,
          ${t.foil} ${bandHeight}px,
          ${t.foil} ${bandHeight + foilWidth}px,
          ${t.b} ${bandHeight + foilWidth}px,
          ${t.b} ${bandHeight * 2 + foilWidth}px,
          ${t.foil} ${bandHeight * 2 + foilWidth}px,
          ${t.foil} ${period}px
        )`,
        ...style,
      }}
    >
      {image && (
        <>
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: imagePosition,
              filter: 'grayscale(1) sepia(0.45) contrast(1.1)',
            }}
          />
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'rgba(60,42,33,0.66)' }} />
        </>
      )}
      {/* A soft vignette so the stripes recede behind the text instead of
          competing with it. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: tone === 'dark'
            ? 'radial-gradient(ellipse at 50% 40%, rgba(60,42,33,0.35) 0%, rgba(60,42,33,0.78) 100%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(253,250,243,0.55) 0%, rgba(253,250,243,0.88) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </section>
  );
}
