import React from 'react';
import { STORE_INSTAGRAM_URL } from '@/lib/siteContact';

export const INSTAGRAM_HANDLE = '@_thetropicalbakery_';

/** The Instagram glyph as a plain outline, so it takes the colour of the text around it. */
export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * A quiet link to Dolly's Instagram. Deliberately never gold and never a button: gold is what
 * buys a box, and we don't want the feed competing with that. Opens in a new tab so the shop stays open.
 */
export default function InstagramLink({ size = 20, showHandle = false, style }: {
  size?: number;
  showHandle?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={STORE_INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Instagram ${INSTAGRAM_HANDLE}`}
      title={`Instagram ${INSTAGRAM_HANDLE}`}
      className="notranslate"
      translate="no"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        color: 'inherit', textDecoration: 'none', minHeight: 44, minWidth: 44,
        justifyContent: showHandle ? 'flex-start' : 'center',
        ...style,
      }}
    >
      <InstagramIcon size={size} />
      {showHandle && <span>{INSTAGRAM_HANDLE}</span>}
    </a>
  );
}
