'use client';

import React from 'react';
import QuickMenu from './QuickMenu';
import OverviewHero from './OverviewHero';
import CommsColumn from './CommsColumn';
import { useAdminStats } from './adminStats';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

/**
 * The overview is deliberately short: the box of the week and the orders first, then the people
 * who are writing to us. Everything else is one tap away in "Todas as áreas", closed by default.
 *
 * Wide screens: the two big cards on the left, a Comunicação column on the right.
 * Phones: one column, in the order of importance (cards, comunicação, the rest).
 */
export default function AdminDashboard() {
  const stats = useAdminStats();

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: '#2c3e50', margin: '0 0 1.25rem' }}>{greeting()}! 🌴</h1>

      <div className="admin-overview">
        <div className="admin-overview__hero"><OverviewHero stats={stats} /></div>
        <div className="admin-overview__comms"><CommsColumn stats={stats} /></div>

        <details className="admin-overview__all">
          <summary>
            <span>🧭 Todas as áreas do painel</span>
            <span className="admin-overview__all-hint" />
          </summary>
          <div style={{ paddingTop: '1.25rem' }}>
            <QuickMenu />
          </div>
        </details>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-overview { display: grid; gap: 1.5rem 2rem; grid-template-columns: minmax(0, 1fr);
          grid-template-areas: "hero" "comms" "all"; align-items: start; }
        .admin-overview__hero { grid-area: hero; }
        .admin-overview__comms { grid-area: comms; }
        .admin-overview__all { grid-area: all; background: #fff; border-radius: 16px; box-shadow: 0 3px 8px rgba(0,0,0,0.06); padding: 0 1.25rem; }
        .admin-overview__all > summary {
          list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 1rem 0; font-weight: 800; color: #2c3e50; font-size: 1.02rem;
        }
        .admin-overview__all > summary::-webkit-details-marker { display: none; }
        .admin-overview__all-hint { font-size: 0.8rem; font-weight: 700; color: #7f8c8d; background: #f1f2f6; padding: 0.25rem 0.75rem; border-radius: 999px; }
        .admin-overview__all:not([open]) .admin-overview__all-hint::after { content: 'abrir ▼'; }
        .admin-overview__all[open] .admin-overview__all-hint::after { content: 'fechar ▲'; }
        .admin-overview__all[open] { padding-bottom: 1.25rem; }
        @media (min-width: 1100px) {
          .admin-overview { grid-template-columns: minmax(0, 1fr) 380px; grid-template-areas: "hero comms" "all comms"; }
          .admin-overview__comms { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; }
        }
        /* Big screens: split the width roughly in half so the two sides feel balanced. */
        @media (min-width: 1500px) {
          .admin-overview { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
        }
      ` }} />
    </div>
  );
}
