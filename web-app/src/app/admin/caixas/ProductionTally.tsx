'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { boxPlan, type BoxOrderItems } from '@/lib/boxPicks';
import { toTreatCount } from '@/lib/boxSizes';

interface Props {
  box: { id: string; title: string } | null;
}

interface Tally {
  rows: { name: string; orders: number; subs: number }[];
  diceOrders: number;
  diceSubs: number;
  boxesOrders: number;
  boxesSubs: number;
  oldOrders: number;
}

/**
 * "Quanto fazer de cada doce": since customers choose (2-box = favourites, 6-box = complete + 2),
 * a box no longer means one of each. Adds up every treat for the active box from
 *   - one-off orders (orders.items, written by createOrder), leaving out cancelled ones, and
 *   - one delivery of every active subscription (subscription_picks, migration 28; no choice = the dice).
 * Orders saved before the picks existed have no orders.items: they are counted apart, not guessed.
 */
export default function ProductionTally({ box }: Props) {
  const [tally, setTally] = useState<Tally | null>(null);

  useEffect(() => {
    if (!box) { setTally(null); return; }
    (async () => {
      const [boxRes, ordersRes, statusRes, subsRes, picksRes] = await Promise.all([
        supabase.from('tasting_boxes').select('items').eq('id', box.id).single(),
        supabase.from('orders').select('id, items, items_summary').eq('order_kind', 'box').order('created_at', { ascending: false }).limit(1000),
        supabase.from('inbox_status').select('source_id, status').eq('source_table', 'orders'),
        supabase.from('subscriptions').select('id, box_size, boxes_per_week').eq('status', 'active'),
        supabase.from('subscription_picks').select('subscription_id, picks, surprise').eq('tasting_box_id', box.id),
      ]);
      const treats = ((boxRes.data?.items || []) as { id?: string; name?: string }[]).filter(t => t && t.id && t.name) as { id: string; name: string }[];
      if (treats.length === 0 || ordersRes.error) { setTally(null); return; }

      const rows = new Map(treats.map(t => [t.id, { name: t.name, orders: 0, subs: 0 }]));
      const t: Tally = { rows: [], diceOrders: 0, diceSubs: 0, boxesOrders: 0, boxesSubs: 0, oldOrders: 0 };
      const add = (who: 'orders' | 'subs', size: number, picks: string[], qty: number) => {
        const plan = boxPlan(treats.length, toTreatCount(size));
        for (const tr of treats.slice(0, plan.fixed)) rows.get(tr.id)![who] += qty;
        const valid = picks.filter(p => rows.has(p));
        if (plan.picks > 0 && valid.length === 0) {
          if (who === 'orders') t.diceOrders += plan.picks * qty; else t.diceSubs += plan.picks * qty;
        } else {
          for (const p of valid.slice(0, plan.picks)) rows.get(p)![who] += qty;
        }
        if (who === 'orders') t.boxesOrders += qty; else t.boxesSubs += qty;
      };

      const cancelled = new Set(((statusRes.data || []) as { source_id: string; status: string }[])
        .filter(s => s.status === 'cancelled').map(s => String(s.source_id)));
      for (const o of (ordersRes.data || []) as { id: string; items: BoxOrderItems | null; items_summary: string | null }[]) {
        if (cancelled.has(String(o.id))) continue;
        if (o.items?.kind !== 'caixa') {
          if ((o.items_summary || '').toLowerCase().includes(box.title.toLowerCase())) t.oldOrders++;
          continue;
        }
        for (const b of o.items.boxes || []) if (b.box_id === box.id) add('orders', b.size, b.picks || [], b.qty || 1);
      }

      // Before migration 28 there are no picks rows: every subscriber counts as the dice.
      const picks = new Map(((picksRes.error ? [] : picksRes.data) || []).map(r => [r.subscription_id, r as { picks: string[]; surprise: boolean }]));
      for (const s of (subsRes.data || []) as { id: string; box_size: number | null; boxes_per_week: number | null }[]) {
        const row = picks.get(s.id);
        add('subs', s.box_size || 4, row && !row.surprise ? (row.picks || []).map(String) : [], Math.max(1, s.boxes_per_week || 1));
      }

      t.rows = [...rows.values()];
      setTally(t);
    })();
  }, [box]);

  if (!box || !tally || (tally.boxesOrders === 0 && tally.boxesSubs === 0 && tally.oldOrders === 0)) return null;

  const cell: React.CSSProperties = { padding: '0.5rem 0.6rem', borderBottom: '1px solid #f1f2f6', textAlign: 'right', whiteSpace: 'nowrap' };
  const total = (o: number, s: number) => <strong style={{ color: '#2c3e50' }}>{o + s}</strong>;

  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.2rem', color: '#2c3e50', margin: '0 0 0.3rem' }}>🧁 Quanto fazer de cada doce</h2>
      <p style={{ color: '#7f8c8d', fontSize: '0.86rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
        “{box.title}”: {tally.boxesOrders} caixa(s) de pedidos (sem os cancelados) e {tally.boxesSubs} de assinantes ativos, contando uma entrega de cada.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', color: '#576574' }}>
          <thead>
            <tr style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ ...cell, textAlign: 'left' }}>Doce</th>
              <th style={cell}>Pedidos</th>
              <th style={cell}>Assinantes</th>
              <th style={cell}>Total</th>
            </tr>
          </thead>
          <tbody>
            {tally.rows.map(r => (
              <tr key={r.name}>
                <td style={{ ...cell, textAlign: 'left', whiteSpace: 'normal', color: '#2c3e50' }}>{r.name}</td>
                <td style={cell}>{r.orders}</td>
                <td style={cell}>{r.subs}</td>
                <td style={cell}>{total(r.orders, r.subs)}</td>
              </tr>
            ))}
            {(tally.diceOrders > 0 || tally.diceSubs > 0) && (
              <tr style={{ background: '#fff8e6' }}>
                <td style={{ ...cell, textAlign: 'left', whiteSpace: 'normal', color: '#b9770e' }}>🎲 À sua escolha (dado, ou assinante que não escolheu)</td>
                <td style={cell}>{tally.diceOrders}</td>
                <td style={cell}>{tally.diceSubs}</td>
                <td style={cell}>{total(tally.diceOrders, tally.diceSubs)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {tally.oldOrders > 0 && (
        <p style={{ color: '#b9770e', fontSize: '0.82rem', marginTop: '0.75rem' }}>
          + {tally.oldOrders} pedido(s) desta caixa feitos antes da escolha de doces: veja o que cada um pediu na Caixa de Entrada.
        </p>
      )}
    </div>
  );
}
