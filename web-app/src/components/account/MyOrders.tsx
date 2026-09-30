'use client';

import React from 'react';
import Link from 'next/link';
import { formatBRL } from '@/lib/deliveryZones';
import { JourneyOrder, ORDER_STAGE } from '@/lib/loyalty';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function kindLabel(o: JourneyOrder) {
  if (o.order_kind === 'quote') return 'Orçamento de evento';
  if (o.order_kind === 'events') return 'Menu de eventos';
  return o.fulfillment === 'pickup' ? 'Caixa · retirada' : 'Caixa · entrega';
}

/** The customer's last orders, newest first, each with a way to have it again. */
export default function MyOrders({ orders }: { orders: JourneyOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <section aria-label="Histórico de pedidos" className="acct-orders">
      <h2 className="acct-h2" style={{ marginBottom: '1rem' }}>Seus pedidos</h2>
      <ul>
        {orders.map(o => {
          const d = new Date(o.requested_date ? `${o.requested_date}T00:00:00` : o.created_at);
          const stage = ORDER_STAGE[o.stage] ?? ORDER_STAGE.awaiting_payment;
          const again = o.order_kind === 'box' ? '/caixas' : '/menu';
          return (
            <li key={o.id} className="acct-order">
              <div className="acct-order-date" aria-hidden>
                <span>{MONTHS[d.getMonth()]}</span>
                <strong>{d.getDate()}</strong>
              </div>
              <div className="acct-order-body">
                <p className="acct-order-kind">{kindLabel(o)}</p>
                <p className="acct-order-summary">{o.items_summary || 'Pedido'}</p>
                <div className="acct-order-meta">
                  <span className="acct-pill" style={{ background: stage.bg, color: stage.color }}>{stage.label}</span>
                  {o.total_price ? <span>{formatBRL(Number(o.total_price))}</span> : null}
                </div>
              </div>
              {(o.stage === 'done' || o.stage === 'confirmed') && (
                <Link href={again} className="acct-order-again">Pedir de novo</Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
