'use client';

import React from 'react';
import Link from 'next/link';
import { InboxSummary } from './InboxFeed';
import type { AdminStats } from './adminStats';

/**
 * "Comunicação": everyone who is talking to the bakery, in one place. The people-and-partners
 * shortcuts sit on top (with a count when something is waiting), then what just arrived.
 */
export default function CommsColumn({ stats }: { stats: AdminStats }) {
  const partnerWaiting = stats.partnersPending + stats.restockOpen;

  const cards: { href: string; emoji: string; word: string; line: string; badge?: number; accent: string }[] = [
    {
      href: '/admin/crm', emoji: '💌', word: 'Clientes', accent: '#d9453a',
      line: stats.loading ? '' : `${stats.customers} ${stats.customers === 1 ? 'pessoa' : 'pessoas'} · campanhas`,
    },
    {
      href: '/admin/parceiros', emoji: '🤝', word: 'Parceiros', accent: '#9bab3c', badge: partnerWaiting,
      line: stats.loading ? '' : partnerWaiting
        ? [stats.partnersPending && `${stats.partnersPending} aguardando`, stats.restockOpen && `${stats.restockOpen} reposição`].filter(Boolean).join(' · ')
        : 'hotéis, pousadas, afiliados',
    },
    { href: '/admin/emails', emoji: '✉️', word: 'E-mails', accent: '#5aa9e6', line: 'escrever e enviar' },
  ];

  return (
    <aside aria-label="Comunicação" className="admin-comms">
      <h2 className="admin-comms__title">💬 Comunicação</h2>

      <div className="admin-comms__cards">
        {cards.map(c => (
          <Link key={c.href} href={c.href} className="admin-comms__card" style={{ ['--accent' as string]: c.accent } as React.CSSProperties}>
            <span aria-hidden className="admin-comms__emoji">{c.emoji}</span>
            <span style={{ minWidth: 0 }}>
              <strong className="admin-comms__word">{c.word}</strong>
              <span className="admin-comms__line">{c.line}</span>
            </span>
            {!!c.badge && <span className="admin-comms__badge">{c.badge}</span>}
          </Link>
        ))}
      </div>

      <div className="admin-comms__inbox">
        <InboxSummary limit={5} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-comms__title { font-size: 1.05rem; color: #7f8c8d; margin: 0 0 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .admin-comms__cards { display: grid; gap: 0.6rem; margin-bottom: 1rem; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
        .admin-comms__card {
          position: relative; display: flex; align-items: center; gap: 0.85rem; text-decoration: none; background: #fff;
          border-radius: 14px; padding: 0.85rem 1rem; border-left: 6px solid var(--accent); box-shadow: 0 3px 8px rgba(0,0,0,0.06);
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .admin-comms__card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.12); }
        .admin-comms__card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
        .admin-comms__emoji { font-size: 1.7rem; flex-shrink: 0; }
        .admin-comms__word { display: block; font-family: var(--font-heading); font-size: 1.15rem; color: #2c3e50; line-height: 1.15; }
        .admin-comms__line { display: block; font-size: 0.78rem; color: #7f8c8d; margin-top: 0.15rem; }
        .admin-comms__badge { margin-left: auto; background: #e74c3c; color: #fff; font-size: 0.78rem; font-weight: 800; min-width: 24px; text-align: center; padding: 0.15rem 0.5rem; border-radius: 999px; }
        .admin-comms__inbox section { margin-bottom: 0 !important; }
        @media (min-width: 1100px) {
          .admin-comms__cards { grid-template-columns: minmax(0, 1fr); }
        }
        @media (prefers-reduced-motion: reduce) { .admin-comms__card { transition: none; } .admin-comms__card:hover { transform: none; } }
      ` }} />
    </aside>
  );
}
