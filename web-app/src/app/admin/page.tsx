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

        {/* Always open: every area is one tap away, right under the two big cards. */}
        <section className="admin-overview__all" aria-label="Todas as áreas do painel">
          <QuickMenu />
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-overview { display: grid; gap: 1.5rem 2rem; grid-template-columns: minmax(0, 1fr);
          grid-template-areas: "hero" "comms" "all"; align-items: start; align-content: start; }
        .admin-overview__hero { grid-area: hero; }
        .admin-overview__comms { grid-area: comms; }
        .admin-overview__all { grid-area: all; background: #fff; border-radius: 16px; box-shadow: 0 3px 8px rgba(0,0,0,0.06); padding: 1.25rem; }
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
