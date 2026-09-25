'use client';

import React from 'react';
import { InboxSummary } from './InboxFeed';
import QuickMenu from './QuickMenu';

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '1.5rem' }}>Visão Geral</h1>

      {/* Wide screens: buttons on the left, what just arrived on the right, both visible at once.
          Narrow screens: buttons first, inbox underneath. */}
      <div className="admin-overview">
        <QuickMenu />
        <aside className="admin-overview__inbox" aria-label="Chegou agora">
          <InboxSummary limit={5} />
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-overview { display: grid; gap: 2rem; grid-template-columns: minmax(0, 1fr); align-items: start; }
        .admin-overview__inbox section { margin-bottom: 0 !important; }
        @media (min-width: 1100px) {
          .admin-overview { grid-template-columns: minmax(0, 1fr) 400px; }
          .admin-overview__inbox { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; }
        }
      ` }} />
    </div>
  );
}
