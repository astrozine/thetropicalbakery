'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * The admin menu, grouped by what you're trying to do. Groups open on click (not hover: hover
 * misfires with a mouse and doesn't exist on a phone), the group holding the current page opens
 * itself, and what you leave open is remembered on this device.
 */

interface NavItem {
  name: string;
  path: string;
  emoji: string;
  /** Plain-words explanation, shown on hover. */
  hint: string;
  badge?: number;
}

interface NavGroup {
  id: string;
  name: string;
  emoji: string;
  /** Retro-70s accent for this group. */
  accent: string;
  /** A slightly different shade of the sidebar blue for this group's panel. */
  shade: string;
  items: NavItem[];
}

const PINNED: Omit<NavItem, 'badge'>[] = [
  { name: 'Visão Geral', path: '/admin', emoji: '🏠', hint: 'Resumo do que está acontecendo' },
  { name: 'Caixa de Entrada', path: '/admin/inbox', emoji: '📥', hint: 'Tudo o que chega do site: pedidos, candidaturas, contatos' },
];

const buildGroups = (): NavGroup[] => [
  {
    id: 'pedidos', name: 'Pedidos & Entregas', emoji: '🚚', accent: '#e2792a', shade: '#2a3d52',
    items: [
      { name: 'Calendário de Entregas', path: '/admin/calendario', emoji: '📅', hint: 'Em quais dias as caixas saem (toda sexta, dias soltos…)' },
      { name: 'Assinaturas', path: '/admin/assinaturas', emoji: '🔁', hint: 'Quem assina a caixa semanal' },
      { name: 'Fila de Espera', path: '/admin/waitlist', emoji: '⏳', hint: 'Gente esperando o próximo lote' },
    ],
  },
  {
    id: 'doces', name: 'Doces & Caixas', emoji: '🍫', accent: '#f4c542', shade: '#2e455c',
    items: [
      { name: 'Caixas de Degustação', path: '/admin/caixas', emoji: '📦', hint: 'Criar a caixa da semana com cada doce, ingredientes e alérgenos' },
      { name: 'Menu de Eventos (doces)', path: '/admin/treats', emoji: '🧁', hint: 'O catálogo de doces para eventos e atacado' },
    ],
  },
  {
    id: 'cursos', name: 'Cursos & Retiros', emoji: '🌴', accent: '#d9453a', shade: '#324c66',
    items: [
      { name: 'Cursos', path: '/admin/courses', emoji: '🎓', hint: 'Criar e editar os cursos' },
      { name: 'Inscrições em Cursos', path: '/admin/inscricoes', emoji: '✍️', hint: 'Quem se inscreveu' },
      { name: 'Retiros: fotos e preços', path: '/admin/retreats', emoji: '🏝️', hint: 'Fotos, diárias e capacidade das acomodações' },
    ],
  },
  {
    id: 'divulgacao', name: 'Divulgação', emoji: '📣', accent: '#9bab3c', shade: '#36536f',
    items: [
      { name: 'E-mails', path: '/admin/emails', emoji: '✉️', hint: 'Escrever e enviar e-mails para clientes, parceiros e candidatos' },
      { name: 'Faixa de Anúncio', path: '/admin/anuncio', emoji: '🎉', hint: 'O aviso especial que aparece no topo da página inicial' },
      { name: 'Clientes & Campanhas', path: '/admin/crm', emoji: '💌', hint: 'Lista de clientes e mensagens em massa' },
    ],
  },
  {
    id: 'equipe', name: 'Equipe & Casa', emoji: '🏡', accent: '#5aa9e6', shade: '#3a5a78',
    items: [
      { name: 'Candidaturas de Emprego', path: '/admin/vagas', emoji: '🧑‍🍳', hint: 'Pessoas que querem trabalhar com a gente' },
      { name: 'Contatos de Reparos', path: '/admin/manutencao', emoji: '🔧', hint: 'Encanador, eletricista, geladeira, forno…' },
      { name: 'Administradores', path: '/admin/administradores', emoji: '🔑', hint: 'Quem pode entrar neste painel' },
    ],
  },
];

const STORAGE_KEY = 'admin_nav_open_groups';

export default function AdminSidebarNav({ pathname, unreadCount, onNavigate }: {
  pathname: string; unreadCount: number; onNavigate?: () => void;
}) {
  const groups = useMemo(buildGroups, []);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const activeGroupId = groups.find(g => g.items.some(i => pathname === i.path))?.id;

  // Restore what was open, then make sure the group holding the current page is open.
  useEffect(() => {
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { /* ignore */ }
    const next = new Set(saved);
    if (activeGroupId) next.add(activeGroupId);
    setOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeGroupId) return;
    setOpen(prev => (prev.has(activeGroupId) ? prev : new Set(prev).add(activeGroupId)));
  }, [activeGroupId]);

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
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

  const pinned = PINNED.map(p => ({ ...p, badge: p.path === '/admin/inbox' ? unreadCount : undefined }));

  return (
    <nav aria-label="Menu do painel" style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
      {/* Quick find */}
      <div style={{ padding: '1rem 1rem 0.5rem' }}>
        <input
          type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Buscar no painel…" aria-label="Buscar no painel"
          style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* Always-visible, most used */}
      <div style={{ padding: '0.4rem 0 0.6rem' }}>
        {pinned.filter(matches).map(item => renderLink(item, '#f4c542'))}
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
              onClick={() => toggle(g.id)}
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
