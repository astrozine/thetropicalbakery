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
 *
 * Section colours reduce the "wall of white" feeling:
 *   - hero cards: transparent (they carry their own vivid accent colours)
 *   - atalhos: warm cream, so the shortcut tiles read as one region
 *   - comms column: soft blue-slate, so it clearly belongs to the right rail
 */
export default function AdminDashboard() {
  const stats = useAdminStats();

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: '#2c3e50', margin: '0 0 1.25rem' }}>{greeting()}! 🌴</h1>

      <div className="admin-overview">
        <div className="admin-overview__hero">
          <OverviewHero stats={stats} />
        </div>

        {/* Comms column wrapped in a soft blue-slate panel so it reads as a distinct zone */}
        <div className="admin-overview__comms">
          <div className="admin-comms-panel">
            <CommsColumn stats={stats} />
          </div>
        </div>

        {/* Atalhos: warm cream background so this region is visually distinct */}
        <section className="admin-overview__all" aria-label="Todas as áreas do painel">
          <QuickMenu />
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-overview {
          display: grid; gap: 1.5rem 2rem; grid-template-columns: minmax(0, 1fr);
          grid-template-areas: "hero" "comms" "all"; align-items: start; align-content: start;
        }
        .admin-overview__hero  { grid-area: hero; }
        .admin-overview__comms { grid-area: comms; }

        /* Comms column: soft steel-blue tint, clearly the "communication" zone */
        .admin-comms-panel {
          background: linear-gradient(160deg, #e8f1f8 0%, #ecf3f9 100%);
          border-radius: 20px;
          border: 1px solid #cddcea;
          padding: 1.25rem 1.25rem 0.75rem;
        }

        /* Atalhos: warm bakery-cream, reads as a single shortcut region */
        .admin-overview__all {
          grid-area: all;
          background: linear-gradient(160deg, #fdf9f0 0%, #f9f4e6 100%);
          border-radius: 18px;
          border: 1px solid #e6dcc6;
          box-shadow: 0 2px 10px rgba(60,42,33,0.06);
          padding: 1.25rem;
        }

        @media (min-width: 1100px) {
          .admin-overview {
            grid-template-columns: minmax(0, 1fr) 380px;
            grid-template-areas: "hero comms" "all comms";
          }
          .admin-overview__comms { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; }
        }
        @media (min-width: 1500px) {
          .admin-overview { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
        }
      ` }} />
    </div>
  );
}
