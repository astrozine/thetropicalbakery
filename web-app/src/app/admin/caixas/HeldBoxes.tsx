'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';

/**
 * Boxes are reserved the moment an order is created, and Pix is confirmed by hand, so a Pix that is never
 * paid keeps its boxes for good and the edition can look sold out with stock unsold. This lists the Pix
 * orders for the box on sale that are still unconfirmed after a day, and lets Dolly give their boxes back
 * one order at a time.
 *
 * Deliberately narrow: only Pix (Dolly is the one who confirms those, so she knows the money did not come),
 * never a card or PayPal order (the payment page can still be paid later), and never one already paid.
 */
const HOLD_HOURS = 24;

interface Held {
  id: string;
  name: string;
  hoursAgo: number;
  summary: string;
  /** null = the order text does not show a quantity for this box (the title was edited): adjust by hand. */
  qty: number | null;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Props {
  box: { id: string; title: string } | null;
  /** Called after boxes were given back, so the page re-reads the sold counts. */
  onReleased: () => void;
}

export default function HeldBoxes({ box, onReleased }: Props) {
  const [held, setHeld] = useState<Held[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!box) { setHeld([]); return; }
    const cutoff = new Date(Date.now() - HOLD_HOURS * 3600 * 1000).toISOString();
    const [ordersRes, statusRes] = await Promise.all([
      supabase.from('orders')
        .select('id, customer_name, created_at, items_summary, order_kind, payment_provider, status')
        .eq('order_kind', 'box').lt('created_at', cutoff).order('created_at', { ascending: false }).limit(200),
      supabase.from('inbox_status').select('source_id, status').eq('source_table', 'orders'),
    ]);
    // An older database without these columns simply shows nothing here; it must never break the page.
    if (ordersRes.error) { setHeld([]); return; }

    const inbox = new Map<string, string>(
      ((statusRes.data || []) as { source_id: string; status: string }[]).map(s => [String(s.source_id), s.status]));
    const line = new RegExp(`(\\d+)\\s*x\\s+${escapeRegExp(box.title)}`, 'i');

    const rows: Held[] = [];
    for (const o of (ordersRes.data || []) as {
      id: string; customer_name: string | null; created_at: string; items_summary: string | null;
      payment_provider: string | null; status: string | null;
    }[]) {
      if ((inbox.get(String(o.id)) || 'new') !== 'new') continue;            // already confirmed, prepared or cancelled
      if (String(o.status || '').toUpperCase() === 'PAID') continue;
      if (o.payment_provider && o.payment_provider !== 'pix') continue;      // card / PayPal: not ours to release
      const summary = o.items_summary || '';
      if (!summary.toLowerCase().includes(box.title.toLowerCase())) continue; // an order for another edition
      const m = summary.match(line);
      rows.push({
        id: String(o.id),
        name: o.customer_name || 'Sem nome',
        hoursAgo: Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600000),
        summary,
        qty: m ? Number(m[1]) : null,
      });
    }
    setHeld(rows);
  }, [box]);

  useEffect(() => { load(); }, [load]);

  const release = async (h: Held) => {
    if (!box || h.qty == null || busy) return;
    const ok = await brandConfirm(
      `Liberar ${h.qty} ${h.qty === 1 ? 'caixa' : 'caixas'} do pedido de ${h.name}? Só faça isso se o Pix não foi pago. O pedido fica como cancelado.`,
      { title: 'Liberar caixas', icon: '📦', confirmLabel: 'Liberar', cancelLabel: 'Voltar', danger: true },
    );
    if (!ok) return;
    setBusy(h.id);
    try {
      // 1. Mark the order cancelled FIRST: if this fails nothing has changed, and it cannot be released twice.
      const marked = await supabase.from('inbox_status').upsert(
        { source_table: 'orders', source_id: h.id, status: 'cancelled', updated_at: new Date().toISOString() },
        { onConflict: 'source_table,source_id' },
      );
      if (marked.error) {
        await brandAlert('Não consegui marcar o pedido como cancelado, então nada foi mudado. Tente de novo.');
        return;
      }

      // 2. Give the boxes back, but only if the counter has not moved since it was read: a customer may
      //    be buying at this very moment, and a blind write would erase their reservation.
      let done = false;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        const { data: cur, error: readErr } = await supabase.from('tasting_boxes').select('sold_quantity').eq('id', box.id).single();
        if (readErr || !cur) break;
        const { data: updated, error: writeErr } = await supabase.from('tasting_boxes')
          .update({ sold_quantity: Math.max(0, cur.sold_quantity - h.qty) })
          .eq('id', box.id).eq('sold_quantity', cur.sold_quantity).select('id');
        if (!writeErr && updated && updated.length > 0) done = true;
      }

      if (!done) {
        // Put the order back exactly as it was, so the boxes are still accounted for.
        await supabase.from('inbox_status').upsert(
          { source_table: 'orders', source_id: h.id, status: 'new', updated_at: new Date().toISOString() },
          { onConflict: 'source_table,source_id' },
        );
        await brandAlert('Não consegui devolver as caixas agora, então o pedido continua como estava. Tente de novo em instantes.');
        return;
      }

      await brandAlert(`Pronto: ${h.qty} ${h.qty === 1 ? 'caixa voltou' : 'caixas voltaram'} para a venda.`, { icon: '✅' });
      onReleased();
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (!box || held.length === 0) return null;

  const total = held.reduce((n, h) => n + (h.qty ?? 0), 0);

  return (
    <section style={{ background: '#fff8e6', border: '2px solid #e0a800', borderRadius: '14px', padding: '1.25rem 1.4rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', color: '#5a3d00', marginBottom: '0.35rem' }}>
        ⏳ Pix sem pagamento segurando caixas{total > 0 ? ` (${total})` : ''}
      </h2>
      <p style={{ color: '#6b5200', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
        Estes pedidos de &ldquo;{box.title}&rdquo; foram feitos há mais de {HOLD_HOURS} horas e o Pix ainda não foi confirmado no Inbox.
        Cada um continua reservando as caixas dele. Se o pagamento não veio, libere as caixas para voltarem à venda.
      </p>
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {held.map(h => (
          <div key={h.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', background: '#fff', borderRadius: '10px', padding: '0.7rem 0.9rem' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <strong style={{ color: '#2c3e50' }}>{h.name}</strong>
              <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}> · há {h.hoursAgo >= 48 ? `${Math.floor(h.hoursAgo / 24)} dias` : `${h.hoursAgo} h`}</span>
              <div style={{ color: '#7f8c8d', fontSize: '0.85rem', overflowWrap: 'anywhere' }}>{h.summary}</div>
            </div>
            {h.qty != null ? (
              <button
                type="button"
                onClick={() => release(h)}
                disabled={busy !== null}
                style={{ minHeight: '44px', padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', background: '#c0392b', color: '#fff', fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy && busy !== h.id ? 0.5 : 1 }}
              >
                {busy === h.id ? 'Liberando…' : `Liberar ${h.qty} ${h.qty === 1 ? 'caixa' : 'caixas'}`}
              </button>
            ) : (
              <span style={{ color: '#7f8c8d', fontSize: '0.85rem', maxWidth: '230px' }}>Não achei a quantidade neste pedido: ajuste &ldquo;Vendidas&rdquo; à mão.</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
