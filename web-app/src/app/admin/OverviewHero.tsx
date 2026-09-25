'use client';

import React from 'react';
import Link from 'next/link';
import type { AdminStats } from './adminStats';

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/**
 * The two things the bakery cares about first thing in the morning:
 *   1. start the box of the week (one big plus sign)
 *   2. how many orders have come in
 * Everything else on the overview is quieter than these.
 */
export default function OverviewHero({ stats }: { stats: AdminStats }) {
  const { box, newOrders, weekOrders, weekRevenue, loading } = stats;
  const sold = box?.sold_quantity ?? 0;
  const total = box?.total_quantity ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;

  return (
    <div className="admin-hero">
      {/* ---- the big plus */}
      <Link href="/admin/caixas" className="admin-hero__card admin-hero__plus" aria-label="Criar a caixa de degustação da semana">
        <span aria-hidden className="admin-hero__circle">+</span>
        <span style={{ minWidth: 0 }}>
          <strong className="admin-hero__title">Nova caixa da semana</strong>
          {loading ? (
            <span className="admin-hero__sub">Carregando…</span>
          ) : box ? (
            <>
              <span className="admin-hero__sub">
                No ar agora: <b>{box.title}</b>{box.batch_date_label ? ` · ${box.batch_date_label}` : ''}
              </span>
              <span className="admin-hero__bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>
              <span className="admin-hero__sub" style={{ fontSize: '0.82rem' }}>
                {sold} de {total} vendidas{sold >= total && total > 0 ? ' — esgotada! 🎉' : ''}
              </span>
            </>
          ) : (
            <span className="admin-hero__sub">Nenhuma caixa no ar. Toque para montar a desta semana.</span>
          )}
        </span>
      </Link>

      {/* ---- the orders */}
      <Link href="/admin/inbox" className="admin-hero__card admin-hero__orders" aria-label="Ver os pedidos">
        <span className="admin-hero__kicker">📦 Pedidos</span>
        <span className="admin-hero__number">{loading ? '…' : newOrders}</span>
        <strong className="admin-hero__title" style={{ color: '#2c3e50' }}>
          {newOrders === 1 ? 'pedido novo' : 'pedidos novos'}
        </strong>
        <span className="admin-hero__sub" style={{ color: '#7f8c8d' }}>
          {loading ? '' : `${weekOrders} nos últimos 7 dias${weekRevenue > 0 ? ` · ${brl(weekRevenue)}` : ''}`}
        </span>
      </Link>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-hero { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); margin-bottom: 1.75rem; }
        @media (min-width: 640px) { .admin-hero { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); } }
        .admin-hero__card {
          display: flex; text-decoration: none; border-radius: 22px; padding: clamp(1.1rem, 2.4vw, 1.6rem);
          transition: transform .15s ease, box-shadow .15s ease; box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }
        .admin-hero__card:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(0,0,0,0.14); }
        .admin-hero__card:focus-visible { outline: 3px solid #2c3e50; outline-offset: 3px; }
        .admin-hero__plus { align-items: center; gap: 1.25rem; background: linear-gradient(135deg, #f4c542 0%, #e2a52a 100%); color: #3c2a21; }
        .admin-hero__circle {
          flex-shrink: 0; width: clamp(72px, 12vw, 104px); height: clamp(72px, 12vw, 104px); border-radius: 50%;
          background: #3c2a21; color: #f4c542; display: flex; align-items: center; justify-content: center;
          font-size: clamp(3rem, 7vw, 4.6rem); font-weight: 300; line-height: 1; padding-bottom: 0.35rem;
          box-shadow: 0 6px 14px rgba(60,42,33,0.35);
        }
        .admin-hero__title { display: block; font-family: var(--font-heading); font-size: clamp(1.25rem, 2.6vw, 1.7rem); line-height: 1.15; }
        .admin-hero__sub { display: block; font-size: 0.92rem; line-height: 1.45; margin-top: 0.3rem; }
        .admin-hero__bar { display: block; height: 9px; border-radius: 999px; background: rgba(60,42,33,0.18); overflow: hidden; margin-top: 0.6rem; }
        .admin-hero__bar span { display: block; height: 100%; border-radius: 999px; background: #3c2a21; transition: width .5s; }
        .admin-hero__orders { flex-direction: column; justify-content: center; background: #fff; border-top: 6px solid #e2792a; }
        .admin-hero__kicker { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #b5560f; }
        .admin-hero__number { font-family: var(--font-heading); font-size: clamp(3rem, 7vw, 4.4rem); font-weight: 800; line-height: 1; color: #e2792a; margin: 0.15rem 0 0.1rem; }
        @media (prefers-reduced-motion: reduce) { .admin-hero__card { transition: none; } .admin-hero__card:hover { transform: none; } }
      ` }} />
    </div>
  );
}
