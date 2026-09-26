'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { NEW_BOX_PATH, PINNED, buildGroups, type NavItem } from './adminNav';

/**
 * The admin menu, grouped by what you're trying to do. Groups open on click (not hover: hover
 * misfires with a mouse and doesn't exist on a phone), the group holding the current page opens
 * itself, only one is open at a time, and which one is remembered on this device.
 */

const STORAGE_KEY = 'admin_nav_open_groups';

export default function AdminSidebarNav({ pathname, unreadCount, partnerCount = 0, onNavigate }: {
  pathname: string; unreadCount: number; partnerCount?: number; onNavigate?: () => void;
}) {
  const groups = useMemo(buildGroups, []);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const activeGroupId = groups.find(g => g.items.some(i => pathname === i.path))?.id;

  const remember = (next: Set<string>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
  };

  // Only one group is open at a time, so the menu never outgrows the screen. Restore the one that
  // was open, unless the current page lives in another group: that one wins.
  useEffect(() => {
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { /* ignore */ }
    const first = activeGroupId || saved.find(id => groups.some(g => g.id === id));
    setOpen(new Set(first ? [first] : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeGroupId) return;
    setOpen(prev => (prev.size === 1 && prev.has(activeGroupId) ? prev : new Set([activeGroupId])));
  }, [activeGroupId]);

  const toggle = (id: string, header: HTMLElement | null) => {
    const next = open.has(id) ? new Set<string>() : new Set([id]);
    setOpen(next);
    remember(next);
    // The group that was open above shrinks as this one opens; keep the header under the cursor.
    if (next.size && header) setTimeout(() => header.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 280);
  };

  const q = query.trim().toLowerCase();
  const matches = (i: NavItem) => !q || `${i.name} ${i.hint}`.toLowerCase().includes(q);

  const linkStyle = (active: boolean, accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem 0.7rem 1.25rem', margin: '2px 0.6rem',
    borderRadius: '10px', textDecoration: 'none', color: active ? '#fff' : '#dfe7ee',
    background: active ? `${accent}33` : 'transparent', fontWeight: active ? 700 : 500, fontSize: '0.95rem',
    boxShadow: active ? `inset 3px 0 0 ${accent}` : 'none', transition: 'background 0.15s',
  });

  const renderLink = (item: NavItem, accent: string) => {
    const active = pathname === item.path;
    return (
      <Link key={item.path} href={item.path} title={item.hint} onClick={onNavigate} aria-current={active ? 'page' : undefined}
        style={linkStyle(active, accent)}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
        <span aria-hidden style={{ fontSize: '1.15rem', width: '1.6rem', textAlign: 'center' }}>{item.emoji}</span>
        <span style={{ flex: 1 }}>{item.name}</span>
        {!!item.badge && (
          <span style={{ background: '#e74c3c', color: 'white', fontSize: '0.72rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '20px', minWidth: '18px', textAlign: 'center' }}>{item.badge}</span>
        )}
      </Link>
    );
  };

  const badgeFor = (path: string) => (path === '/admin/inbox' ? unreadCount : path === '/admin/parceiros' ? partnerCount : undefined);
  const pinned = PINNED.map(p => ({ ...p, badge: badgeFor(p.path) }));

  return (
    <nav aria-label="Menu do painel" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingBottom: '1rem' }}>
      {/* Quick find */}
      <div style={{ padding: '1rem 1rem 0.5rem' }}>
        <input
          type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Buscar no painel…" aria-label="Buscar no painel"
          style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* The one thing Dolly does every week */}
      <div style={{ padding: '0.4rem 0.9rem 0.5rem' }}>
        <Link href={NEW_BOX_PATH} onClick={onNavigate} title="Montar a caixa de degustação da semana"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.9rem', borderRadius: '14px', textDecoration: 'none', background: 'linear-gradient(135deg, #f4c542, #e2a52a)', color: '#3c2a21', fontWeight: 800, fontSize: '0.98rem', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
          <span aria-hidden style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#3c2a21', color: '#f4c542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', lineHeight: 1, paddingBottom: '0.15rem' }}>+</span>
          Nova caixa da semana
        </Link>
      </div>

      {/* Always-visible, most used: the overview and orders, then the people we talk to */}
      <div style={{ padding: '0.2rem 0 0.6rem' }}>
        {pinned.filter(matches).slice(0, 2).map(item => renderLink(item, '#f4c542'))}
        {pinned.filter(matches).length > 2 && (
          <p style={{ margin: '0.7rem 1.4rem 0.2rem', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8ea3b5', fontWeight: 800 }}>Comunicação</p>
        )}
        {pinned.filter(matches).slice(2).map(item => renderLink(item, '#f4c542'))}
      </div>

      {/* Groups */}
      {groups.map(g => {
        const visibleItems = g.items.filter(matches);
        if (q && visibleItems.length === 0) return null;
        const isOpen = q ? true : open.has(g.id);
        const hasActive = g.id === activeGroupId;
        const panelId = `nav-panel-${g.id}`;
        return (
          <div key={g.id} style={{ background: g.shade, borderLeft: `4px solid ${g.accent}`, marginTop: '2px' }}>
            <button
              type="button"
              onClick={e => toggle(g.id, e.currentTarget)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.95rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', textAlign: 'left' }}
            >
              <span aria-hidden style={{ width: '2.1rem', height: '2.1rem', borderRadius: '10px', background: `${g.accent}30`, border: `1px solid ${g.accent}80`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                {g.emoji}
              </span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: '0.98rem', letterSpacing: '0.01em' }}>{g.name}</span>
              {hasActive && !isOpen && <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: g.accent }} />}
              <span aria-hidden style={{ color: g.accent, fontSize: '0.8rem', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
            </button>
            <div id={panelId} style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ paddingBottom: isOpen ? '0.6rem' : 0 }}>
                  {visibleItems.map(item => renderLink(item, g.accent))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {q && groups.every(g => g.items.filter(matches).length === 0) && pinned.filter(matches).length === 0 && (
        <p style={{ padding: '1rem 1.25rem', color: '#9fb0c0', fontSize: '0.88rem' }}>Nada encontrado para “{query}”.</p>
      )}
    </nav>
  );
}
