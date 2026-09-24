'use client';

import React from 'react';
import { InboxSummary } from './InboxFeed';
import QuickMenu from './QuickMenu';

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>Visão Geral</h1>

      {/* The buttons come first: the inbox below can get long and must not push them off screen. */}
      <QuickMenu />

      <InboxSummary />
    </div>
  );
}
