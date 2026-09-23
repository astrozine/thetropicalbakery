import React from 'react';

interface BlobAccentProps {
  color?: string;
  size?: number;
  opacity?: number;
  rotate?: number;
  style?: React.CSSProperties;
}

/**
 * A single Burle Marx-style biomorphic blob — an irregular, asymmetric
 * organic shape (never a circle or a rounded rectangle), meant to be
 * scattered behind headings or in empty corners as a quiet decorative
 * accent, the way his garden beds and murals use flat colour shapes rather
 * than literal ornament.
 */
export default function BlobAccent({ color = '#d4af37', size = 260, opacity = 0.12, rotate = 0, style }: BlobAccentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ position: 'absolute', opacity, transform: `rotate(${rotate}deg)`, pointerEvents: 'none', ...style }}
      aria-hidden
    >
      <path
        d="M52,18 C82,2 128,4 152,28 C178,52 190,92 176,124 C162,156 122,178 86,180 C50,182 14,164 6,130 C-2,96 8,54 30,34 C36,28 44,22 52,18 Z"
        fill={color}
      />
    </svg>
  );
}
