'use client';

import React from 'react';
import Link from 'next/link';

/** Pinned strip shown when an admin opens someone's private area from "Ver como". */
export default function PreviewBanner({ who, area }: { who: string; area: string }) {
  return (
    <div role="status" style={{
      position: 'sticky', top: '0.75rem', zIndex: 50, maxWidth: '900px', margin: '0 auto 1.25rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap',
      background: '#2c3e50', color: '#fff', borderRadius: '14px', padding: '0.75rem 1.1rem',
      boxShadow: '0 10px 24px rgba(0,0,0,0.2)', fontSize: '0.92rem', lineHeight: 1.5,
    }}>
      <span>👀 <strong>Pré-visualização do admin.</strong> Você está vendo o {area} exatamente como <strong>{who}</strong> vê. Nada é enviado daqui.</span>
      <Link href="/admin/ver-como" style={{ background: '#f4c542', color: '#2c3e50', padding: '0.4rem 0.9rem', borderRadius: '999px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        ← Voltar
      </Link>
    </div>
  );
}
