'use client';

import React from 'react';

export type SectionTone = 'ok' | 'todo' | 'quiet';

interface Props {
  id: string;
  emoji: string;
  /** The section's own colour: the stripe, the emoji tile and the open glow. */
  accent: string;
  title: string;
  /** One line that tells you what's inside without opening it. */
  summary: React.ReactNode;
  status?: { label: string; tone: SectionTone };
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const TONES: Record<SectionTone, { bg: string; color: string }> = {
  ok: { bg: '#e6f4ec', color: '#0b6b3a' },
  todo: { bg: '#fdf1d6', color: '#8a6d1f' },
  quiet: { bg: '#f1ece3', color: '#8b7d72' },
};

/**
 * One fold of the account page. Closed, it still says what's inside and whether
 * it needs attention; open, it slides down. The content stays mounted so what
 * someone has typed is never lost by closing a fold.
 */
export default function AccountSection({ id, emoji, accent, title, summary, status, open, onToggle, children }: Props) {
  const tone = status ? TONES[status.tone] : null;
  return (
    <section
      style={{
        background: '#fff',
        border: `1px solid ${open ? accent : '#e8e1d7'}`,
        borderLeft: `6px solid ${accent}`,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: open ? `0 16px 40px ${accent}30` : '0 4px 14px rgba(60,42,33,0.05)',
        transition: 'box-shadow .3s, border-color .3s',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`acc-${id}`}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.05rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <span
          aria-hidden
          style={{ flexShrink: 0, width: '52px', height: '52px', borderRadius: '16px', background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.65rem' }}
        >
          {emoji}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.05rem, 2.6vw, 1.25rem)', color: '#3c2a21', lineHeight: 1.2 }}>
            {title}
          </strong>
          <span style={{ display: 'block', color: '#7a6a61', fontSize: '0.86rem', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {summary}
          </span>
        </span>
        {status && tone && (
          <span style={{ flexShrink: 0, background: tone.bg, color: tone.color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', padding: '0.28rem 0.7rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
            {status.tone === 'ok' ? '✓ ' : ''}{status.label}
          </span>
        )}
        <span
          aria-hidden
          style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: open ? accent : '#f5efe2', color: open ? '#fff' : '#3c2a21', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .25s, background .25s' }}
        >
          +
        </span>
      </button>

      {/* grid-rows 0fr -> 1fr is the smooth open/close; visibility keeps closed inputs out of the tab order */}
      <div
        id={`acc-${id}`}
        style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease', visibility: open ? 'visible' : 'hidden' }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '0.25rem 1.5rem 1.6rem', borderTop: '1px dashed #eee7db', marginTop: '0.1rem', paddingTop: '1.4rem' }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
