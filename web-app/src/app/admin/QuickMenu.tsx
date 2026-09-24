'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { PINNED, buildGroups, type NavItem } from './adminNav';

/**
 * Big-button version of the admin menu for the overview page: every section of the backend,
 * grouped and colour-coded like the sidebar, one tap away. It lives ABOVE the inbox feed so a
 * long list of new messages never pushes the buttons out of sight.
 */

function Tile({ item, accent }: { item: NavItem; accent: string }) {
  return (
    <Link
      href={item.path}
      className="admin-quick-tile"
      style={{ ['--tile-accent' as string]: accent } as React.CSSProperties}
    >
      <span aria-hidden className="admin-quick-tile__emoji">{item.emoji}</span>
      <span className="admin-quick-tile__name">{item.name}</span>
      <span className="admin-quick-tile__hint">{item.hint}</span>
    </Link>
  );
}

export default function QuickMenu() {
  const groups = useMemo(() => buildGroups(), []);
  const inbox = PINNED.find(p => p.path === '/admin/inbox');

  const heading: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.05rem', color: '#2c3e50', margin: '0 0 0.85rem', fontWeight: 800 };

  return (
    <nav aria-label="Atalhos do painel" style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '1.2rem', color: '#7f8c8d', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Atalhos</h2>

      <div style={{ display: 'grid', gap: '1.75rem' }}>
        {inbox && (
          <section>
            <h3 style={heading}><span aria-hidden style={{ width: 6, height: '1.3em', borderRadius: 3, background: '#f4c542' }} />📥 Tudo o que chega</h3>
            <div className="admin-quick-grid"><Tile item={inbox} accent="#f4c542" /></div>
          </section>
        )}

        {groups.map(g => (
          <section key={g.id}>
            <h3 style={heading}>
              <span aria-hidden style={{ width: 6, height: '1.3em', borderRadius: 3, background: g.accent }} />
              {g.emoji} {g.name}
            </h3>
            <div className="admin-quick-grid">
              {g.items.map(item => <Tile key={item.path} item={item} accent={g.accent} />)}
            </div>
          </section>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1rem; }
        .admin-quick-tile {
          display: flex; flex-direction: column; gap: 0.35rem; text-decoration: none;
          background: #fff; border-radius: 14px; padding: 1.25rem 1.3rem 1.3rem;
          border: 1px solid #eef1f4; border-top: 5px solid var(--tile-accent);
          box-shadow: 0 4px 8px rgba(0,0,0,0.05); transition: transform .15s ease, box-shadow .15s ease;
        }
        .admin-quick-tile:hover, .admin-quick-tile:focus-visible { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.12); outline: none; }
        .admin-quick-tile:focus-visible { box-shadow: 0 0 0 3px var(--tile-accent); }
        .admin-quick-tile__emoji { font-size: 2.3rem; line-height: 1.1; margin-bottom: 0.25rem; }
        .admin-quick-tile__name { font-size: 1.12rem; font-weight: 800; color: #2c3e50; font-family: var(--font-heading); line-height: 1.25; }
        .admin-quick-tile__hint { font-size: 0.85rem; color: #7f8c8d; line-height: 1.5; }
        @media (max-width: 520px) { .admin-quick-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; } .admin-quick-tile { padding: 1rem; } .admin-quick-tile__hint { display: none; } }
        @media (prefers-reduced-motion: reduce) { .admin-quick-tile { transition: none; } .admin-quick-tile:hover { transform: none; } }
      ` }} />
    </nav>
  );
}
