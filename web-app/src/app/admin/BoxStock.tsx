'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * "Sobraram quantas?" — the one number Dolly changes most often, as two big buttons.
 *
 * Nothing here opens the long box form: each tap changes the live count straight away, so a box
 * eaten at home or broken on the way out takes two seconds from a phone.
 *
 * What moves, and why:
 *   - "ainda à venda" (total − vendidas) moves TOTAL, never "vendidas". A box we ate is not a sale;
 *     the sales count has to keep matching the orders, or the money never adds up.
 *   - "vendidas" has its own small row for the two cases the orders cannot know about: a box sold by
 *     hand (Pix in person, a neighbour) and a cancellation.
 *
 * Taps are collected for a moment and written once, as a *relative* change re-read from the database
 * and guarded on the numbers that were there (like HeldBoxes does), because a customer may be buying
 * at this very second and a blind write would erase their box.
 */

export interface StockBox {
  id: string;
  title: string;
  total_quantity: number;
  sold_quantity: number;
}

interface Props {
  box: StockBox | null;
  /** Called with the numbers now in the database, so the page around this can catch up. */
  onChanged?: (boxId: string, total: number, sold: number) => void;
  /** Overview version: a little quieter, no explanations. */
  compact?: boolean;
}

/** How long taps are collected before one write goes out. */
const FLUSH_MS = 700;
const UNDO_MS = 12000;

const round = (size: number, bg: string, color: string): React.CSSProperties => ({
  width: size, height: size, flexShrink: 0, borderRadius: '50%', border: 'none', background: bg, color,
  fontSize: size > 50 ? '2rem' : '1.2rem', fontWeight: 700, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(60,42,33,0.25)',
  touchAction: 'manipulation',
});

export default function BoxStock({ box, onChanged, compact }: Props) {
  // What the screen shows: moves on the tap, then settles on what the database says.
  const [shown, setShown] = useState({ total: box?.total_quantity ?? 0, sold: box?.sold_quantity ?? 0 });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [undo, setUndo] = useState<{ total: number; sold: number } | null>(null);

  const pending = useRef({ total: 0, sold: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxId = box?.id ?? '';

  // A fresh read from the page (or another box) wins, unless taps are still waiting to go out.
  useEffect(() => {
    if (!box) return;
    if (pending.current.total || pending.current.sold || saving) return;
    setShown({ total: box.total_quantity, sold: box.sold_quantity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box?.id, box?.total_quantity, box?.sold_quantity]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const flush = async () => {
    const delta = pending.current;
    pending.current = { total: 0, sold: 0 };
    if (!boxId || (!delta.total && !delta.sold)) return;

    setSaving(true);
    setNote('');
    let done: { total: number; sold: number } | null = null;

    for (let attempt = 0; attempt < 4 && !done; attempt++) {
      const { data: cur, error } = await supabase
        .from('tasting_boxes').select('total_quantity, sold_quantity').eq('id', boxId).single();
      if (error || !cur) break;

      const sold = Math.max(0, cur.sold_quantity + delta.sold);
      // Never fewer made than sold: that would mean selling boxes that do not exist.
      const total = Math.max(sold, cur.total_quantity + delta.total);

      const { data, error: writeErr } = await supabase.from('tasting_boxes')
        .update({ total_quantity: total, sold_quantity: sold })
        .eq('id', boxId)
        .eq('total_quantity', cur.total_quantity)
        .eq('sold_quantity', cur.sold_quantity)
        .select('total_quantity, sold_quantity')
        .maybeSingle();
      if (!writeErr && data) done = { total: data.total_quantity, sold: data.sold_quantity };
    }

    setSaving(false);
    if (!done) {
      setShown({ total: box?.total_quantity ?? 0, sold: box?.sold_quantity ?? 0 });
      setUndo(null);
      setNote('Não consegui salvar agora. Tente de novo.');
      return;
    }

    setShown(done);
    setNote('Salvo ✓');
    setTimeout(() => setNote(n => (n === 'Salvo ✓' ? '' : n)), 2500);
    onChanged?.(boxId, done.total, done.sold);
  };

  /** Queue a change: the screen moves now, the database a moment later. */
  const bump = (delta: { total?: number; sold?: number }, forUndo = true) => {
    if (!box) return;
    const dTotal = delta.total || 0;
    const dSold = delta.sold || 0;

    setShown(s => {
      const sold = Math.max(0, s.sold + dSold);
      return { sold, total: Math.max(sold, s.total + dTotal) };
    });
    pending.current = { total: pending.current.total + dTotal, sold: pending.current.sold + dSold };

    if (forUndo) {
      setUndo(u => ({ total: (u?.total ?? 0) - dTotal, sold: (u?.sold ?? 0) - dSold }));
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, FLUSH_MS);
  };

  const undoAll = () => {
    if (!undo) return;
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    bump(undo, false);
  };

  if (!box) return null;

  const left = Math.max(0, shown.total - shown.sold);
  const soldOut = left === 0;

  return (
    <section
      aria-label="Caixas ainda à venda"
      style={{
        background: soldOut ? 'linear-gradient(160deg, #fdecea 0%, #fbdedb 100%)' : 'linear-gradient(160deg, #fff8e6 0%, #fdefc9 100%)',
        border: `2px solid ${soldOut ? '#e7a79f' : '#e8c665'}`,
        borderRadius: '18px', padding: compact ? '1rem 1.1rem' : '1.15rem 1.35rem',
        marginBottom: compact ? 0 : '1.75rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <strong style={{ color: '#5a3d00', fontSize: '1.05rem' }}>📦 Sobraram quantas?</strong>
        <span style={{ color: '#8a6d1f', fontSize: '0.88rem', minWidth: 0, overflowWrap: 'anywhere' }}>{box.title}</span>
      </div>

      {/* The big row: − [ 12 à venda ] + */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(0.75rem, 4vw, 1.5rem)' }}>
        <button type="button" onClick={() => bump({ total: -1 })} disabled={left === 0}
          aria-label="Uma caixa a menos à venda"
          style={{ ...round(64, left === 0 ? '#d8cfc0' : '#3c2a21', '#f4c542'), cursor: left === 0 ? 'not-allowed' : 'pointer' }}>−</button>

        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.8rem, 12vw, 3.6rem)', lineHeight: 1, color: soldOut ? '#c0392b' : '#3c2a21' }}>
            {left}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: soldOut ? '#c0392b' : '#8a6d1f', marginTop: '0.2rem' }}>
            {soldOut ? 'esgotada' : 'ainda à venda'}
          </div>
        </div>

        <button type="button" onClick={() => bump({ total: 1 })}
          aria-label="Uma caixa a mais à venda"
          style={round(64, '#3c2a21', '#f4c542')}>+</button>
      </div>

      {!compact && (
        <p style={{ fontSize: '0.83rem', color: '#8a6d1f', textAlign: 'center', lineHeight: 1.5, margin: '0.8rem 0 0' }}>
          Use o <strong>−</strong> quando uma caixa sair da venda sem ser vendida: comemos, quebrou, virou presente.
          As vendidas continuam iguais.
        </p>
      )}

      {/* The quiet row: the sales count, for what the orders cannot know */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginTop: '0.9rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(138,109,31,0.4)' }}>
        <span style={{ fontSize: '0.9rem', color: '#5a3d00', fontWeight: 700 }}>
          {shown.sold} {shown.sold === 1 ? 'vendida' : 'vendidas'} · {shown.total} {shown.total === 1 ? 'feita' : 'feitas'}
        </span>
        <button type="button" onClick={() => bump({ sold: -1 })} disabled={shown.sold === 0}
          aria-label="Uma venda a menos (cancelamento)"
          style={{ ...round(38, '#fff', '#5a3d00'), border: '1px solid #e0c98a', boxShadow: 'none', opacity: shown.sold === 0 ? 0.45 : 1 }}>−</button>
        <button type="button" onClick={() => bump({ sold: 1 })} disabled={left === 0}
          aria-label="Vendi uma por fora"
          style={{ ...round(38, '#fff', '#5a3d00'), border: '1px solid #e0c98a', boxShadow: 'none', opacity: left === 0 ? 0.45 : 1, width: 'auto', padding: '0 0.8rem', borderRadius: '19px', fontSize: '0.85rem', fontWeight: 700 }}>
          + vendi por fora
        </button>
      </div>

      <div style={{ minHeight: '1.5rem', marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
        {saving && <span style={{ fontSize: '0.85rem', color: '#8a6d1f' }}>Salvando…</span>}
        {!saving && note && <span style={{ fontSize: '0.85rem', fontWeight: 700, color: note.startsWith('Salvo') ? '#1e6b3c' : '#c0392b' }}>{note}</span>}
        {undo && (
          <button type="button" onClick={undoAll}
            style={{ background: 'none', border: 'none', color: '#5a3d00', textDecoration: 'underline', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', minHeight: '32px' }}>
            Desfazer
          </button>
        )}
      </div>
    </section>
  );
}
