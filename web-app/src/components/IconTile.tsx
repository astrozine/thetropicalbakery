import React from 'react';

/**
 * A simple emoji (or small icon) in a pale grey embossed tile: lit from above, pressed into the paper.
 * The site's signpost, used in the menu and anywhere a heading needs one inside JSX. For plain headings,
 * the `data-sign` / `data-sign-top` attributes in globals.css draw the same tile with no extra markup.
 */
export default function IconTile({ size = 30, children, style }: { size?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span aria-hidden style={{
      width: size, height: size, flexShrink: 0, borderRadius: size * 0.3,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.52, lineHeight: 1,
      background: 'var(--sign-bg)', boxShadow: 'var(--sign-shadow)', color: '#3c2a21',
      fontStyle: 'normal', fontWeight: 'normal', letterSpacing: 0, textTransform: 'none',
      ...style,
    }}>{children}</span>
  );
}
