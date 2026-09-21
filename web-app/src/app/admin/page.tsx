'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>Visão Geral</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Catálogo de Doces Card */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#3c2a21', marginBottom: '1rem' }}>Catálogo de Doces</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>Adicione novos doces, atualize preços, altere fotos e marque itens como esgotados.</p>
          <Link href="/admin/treats" style={{ display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Gerenciar Menu
          </Link>
        </div>

        {/* CRM & Campanhas Card */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#3c2a21', marginBottom: '1rem' }}>CRM & Campanhas (WhatsApp)</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>Crie mensagens personalizadas para grupos específicos (ex: sem açúcar, aniversariantes).</p>
          <Link href="/admin/crm" style={{ display: 'inline-block', background: '#10ac84', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Acessar CRM
          </Link>
        </div>

      </div>
    </div>
  );
}
