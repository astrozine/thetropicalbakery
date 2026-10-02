'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { deliveryWindowLabel, longDay, type BoxWindowFields } from '@/lib/boxWindow';
import { toISODate } from '@/lib/deliverySchedule';

export interface GearBox extends BoxWindowFields {
  id: string;
  title: string;
}

interface Props {
  /** Next week's box, sold before it is baked (sale_mode = 'presale'). */
  presale: GearBox;
  /** The ready box on the site now, if any: it leaves the site when the pre-sale takes its place. */
  stock: GearBox | null;
  /** Called after the switch, so the page re-reads the boxes. */
  onChanged: () => void;
}

/**
 * The pre-sale, and the one gear change that ends it: "a fornada saiu do forno".
 *
 * While it is a pre-sale Dolly only needs two numbers: how many were ordered and until when people can
 * still order. When she has baked, she says how many EXTRA boxes she made on top of the orders, and the
 * same box becomes the ready box ("pronta entrega"), exactly the way boxes have always been sold: the
 * orders stay counted as sold, the extras are what is left, and it stays on sale until they run out.
 * From then on its delivery window rolls over like every ready box, so leftovers keep being delivered.
 */
export default function PresaleGear({ presale, stock, onChanged }: Props) {
  const [extras, setExtras] = useState(4);
  const [busy, setBusy] = useState(false);

  const ordered = presale.sold_quantity;
  const cap = presale.total_quantity > 0 ? presale.total_quantity : null;
  const today = toISODate(new Date());
  const closed = !!presale.orders_close_on && today > presale.orders_close_on;
  const window = deliveryWindowLabel(presale);
  const stockLeft = stock ? Math.max(0, stock.total_quantity - stock.sold_quantity) : 0;

  const bake = async () => {
    const n = Math.max(0, Math.floor(Number(extras) || 0));
    const lines = [
      `"${presale.title}" passa a ser a caixa de pronta entrega: as ${ordered} encomendas continuam contadas e ${n === 0 ? 'nenhuma caixa extra fica à venda (aparece como esgotada)' : `${n} caixa(s) extra(s) ficam à venda até acabar`}.`,
      stock && stock.id !== presale.id
        ? `A caixa pronta de agora, "${stock.title}"${stock.total_quantity > 0 ? ` (${stockLeft} restante(s))` : ''}, sai do site. Os pedidos dela continuam valendo.`
        : '',
      'Depois você pode abrir a pré-venda da semana seguinte.',
    ].filter(Boolean).join('\n\n');
    if (!(await brandConfirm(lines, { title: 'A fornada saiu do forno?', confirmLabel: 'Sim, vender como pronta entrega' }))) return;

    setBusy(true);
    try {
      if (stock && stock.id !== presale.id) {
        const { error } = await supabase.from('tasting_boxes').update({ is_active: false }).eq('id', stock.id);
        if (error) throw error;
      }
      // Re-read the orders count: someone may have ordered while this page was open.
      const { data: fresh, error: readErr } = await supabase.from('tasting_boxes').select('sold_quantity').eq('id', presale.id).single();
      if (readErr || !fresh) throw readErr ?? new Error('caixa não encontrada');
      const { error } = await supabase.from('tasting_boxes').update({
        sale_mode: 'stock',
        total_quantity: fresh.sold_quantity + n,
        orders_close_on: null,
        is_active: true,
      }).eq('id', presale.id);
      if (error) throw error;
      onChanged();
    } catch (e) {
      brandAlert(`Não foi possível trocar: ${(e as Error)?.message ?? ''}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #8e44ad', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8e44ad', margin: '0 0 0.3rem' }}>
        🗓️ Pré-venda no ar
      </p>
      <h2 style={{ fontSize: '1.25rem', color: '#2c3e50', margin: '0 0 0.6rem' }}>{presale.title}</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.75rem', alignItems: 'baseline', marginBottom: '0.9rem' }}>
        <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#2c3e50', lineHeight: 1 }}>
          {ordered}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#7f8c8d' }}>{cap ? ` de ${cap}` : ''} encomenda(s)</span>
        </span>
        {window && <span style={{ color: '#594a42' }}>🚚 entregas {window}</span>}
        {presale.orders_close_on && (
          <span style={{ fontWeight: 700, color: closed ? '#c0392b' : '#1e6b3c' }}>
            {closed ? `🔒 encomendas fecharam ${longDay(presale.orders_close_on)}: hora de assar` : `⏳ encomendas até ${longDay(presale.orders_close_on)}`}
          </span>
        )}
      </div>

      <div style={{ background: '#f8f4fb', borderRadius: '10px', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <p style={{ margin: 0, color: '#2c3e50', lineHeight: 1.55, fontSize: '0.92rem' }}>
          <strong>Assou?</strong> Diga quantas caixas você fez <strong>a mais</strong> que as encomendas. A caixa vira a de
          <strong> pronta entrega</strong>, do jeito de sempre: as extras ficam à venda até acabar, e as entregas seguem pelo calendário enquanto sobrar caixa.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Caixas extras
            <input type="number" min={0} max={200} value={extras} onChange={e => setExtras(Number(e.target.value))}
              style={{ width: '80px', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem' }} />
          </label>
          <span style={{ color: '#7f8c8d', fontSize: '0.88rem' }}>= {ordered + Math.max(0, Math.floor(Number(extras) || 0))} caixas na fornada</span>
          <button type="button" onClick={bake} disabled={busy} style={{ background: '#8e44ad', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 1.2rem', fontWeight: 'bold', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Trocando…' : '🔥 Fornada pronta: vender como pronta entrega'}
          </button>
        </div>
      </div>
    </div>
  );
}
