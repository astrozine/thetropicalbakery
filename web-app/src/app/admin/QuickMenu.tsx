'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { PINNED, buildGroups } from './adminNav';

/**
 * Big-button version of the admin menu for the overview page. Every section of the backend is one
 * compact tile: a big word that says what it is at a glance, the full name underneath.
 *
 * The tiles flow as ONE continuous grid so rows are always full. When a new group starts in the
 * middle of a row, its first tile carries the group's colour and name above it, and the rest of that
 * group's tiles keep the colour bar, so you can still tell where each group begins and ends.
 */

interface Cell {
  key: string;
  path: string;
  emoji: string;
  word: string;
  name: string;
  hint: string;
  accent: string;
  /** Set on the first tile of a group: the header shown above it. */
  header?: string;
}

/** White text on dark accents, dark text on light ones (the yellow, the lime). */
const textOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#2c3e50' : '#ffffff';
};

export default function QuickMenu() {
  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    PINNED.filter(p => p.path !== '/admin').forEach((item, i) => out.push({
      key: item.path, path: item.path, emoji: item.emoji, word: item.word, name: item.name, hint: item.hint, accent: '#f4c542',
      header: i === 0 ? '⭐ Principais' : undefined,
    }));
    buildGroups().forEach(g => g.items.forEach((item, i) => out.push({
      key: item.path, path: item.path, emoji: item.emoji, word: item.word, name: item.name, hint: item.hint, accent: g.accent,
      header: i === 0 ? `${g.emoji} ${g.name}` : undefined,
    })));
    return out;
  }, []);

  return (
    <nav aria-label="Atalhos do painel">
      <h2 style={{ fontSize: '1.05rem', color: '#7f8c8d', margin: '0 0 0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Atalhos</h2>

      <div className="admin-quick-grid">
        {cells.map(c => (
          <div key={c.key} className="admin-quick-cell">
            <div className="admin-quick-head" style={{ borderBottomColor: c.accent }}>
              {c.header && (
                <span title={c.header} style={{ background: c.accent, color: textOn(c.accent) }}>{c.header}</span>
              )}
            </div>
            <Link
              href={c.path}
              title={c.hint}
              className="admin-quick-tile"
              style={{ ['--tile-accent' as string]: c.accent } as React.CSSProperties}
            >
              <span aria-hidden className="admin-quick-tile__emoji">{c.emoji}</span>
              <span className="admin-quick-tile__word">{c.word}</span>
              <span className="admin-quick-tile__name">{c.name}</span>
            </Link>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(156px, 1fr)); gap: 0.6rem 0.75rem; }
        .admin-quick-cell { display: flex; flex-direction: column; min-width: 0; }
        .admin-quick-head {
          height: 1.5rem; display: flex; align-items: flex-end; border-bottom: 4px solid transparent;
          border-radius: 4px 4px 0 0; margin-bottom: -4px; position: relative; z-index: 1;
        }
        .admin-quick-head span {
          display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 0.76rem; font-weight: 800; line-height: 1; padding: 0.3rem 0.6rem; border-radius: 7px 7px 0 0;
        }
        .admin-quick-tile {
          flex: 1; display: flex; flex-direction: column; gap: 0.1rem; text-decoration: none;
          background: #fff; border-radius: 0 0 12px 12px; padding: 0.85rem 0.9rem 0.85rem;
          border: 1px solid #eef1f4; border-top: 4px solid var(--tile-accent);
          box-shadow: 0 3px 6px rgba(0,0,0,0.05); transition: transform .15s ease, box-shadow .15s ease;
        }
        .admin-quick-tile:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
        .admin-quick-tile:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--tile-accent); }
        .admin-quick-tile__emoji { font-size: 1.6rem; line-height: 1.1; }
        .admin-quick-tile__word { font-size: 1.3rem; font-weight: 800; color: #2c3e50; font-family: var(--font-heading); line-height: 1.15; overflow-wrap: anywhere; }
        .admin-quick-tile__name { font-size: 0.76rem; color: #7f8c8d; line-height: 1.35; margin-top: 0.15rem; }
        @media (max-width: 520px) { .admin-quick-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; } .admin-quick-tile__word { font-size: 1.15rem; } }
        @media (prefers-reduced-motion: reduce) { .admin-quick-tile { transition: none; } .admin-quick-tile:hover { transform: none; } }
      ` }} />
    </nav>
  );
}
