'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { parseISODate } from '@/lib/deliverySchedule';

interface PickupOrder {
  order_id: string;
  requested_date: string | null;
  items_summary: string | null;
  total_price: number | null;
  stage: 'awaiting_payment' | 'confirmed' | 'preparing' | 'ready' | 'picked_up';
  pickup_address: string | null;
  pickup_instructions: string | null;
}

const STEPS: { stage: PickupOrder['stage']; label: string }[] = [
  { stage: 'confirmed', label: 'Pix confirmado' },
  { stage: 'preparing', label: 'Em preparo' },
  { stage: 'ready', label: 'Pronta para retirar' },
  { stage: 'picked_up', label: 'Retirada' },
];

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const icsEscape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const compact = (iso: string) => iso.replace(/-/g, '');

/** A one-day calendar entry the customer can drop into their phone's calendar. */
function downloadIcs(order: PickupOrder) {
  if (!order.requested_date) return;
  const start = parseISODate(order.requested_date);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const endIso = `${end.getFullYear()}${String(end.getMonth() + 1).padStart(2, '0')}${String(end.getDate()).padStart(2, '0')}`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Tropical Bakery//Retirada//PT', 'BEGIN:VEVENT',
    `UID:pickup-${order.order_id}@thetropicalbakery.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${compact(order.requested_date)}`,
    `DTEND;VALUE=DATE:${endIso}`,
    `SUMMARY:${icsEscape('Retirar minha caixa - The Tropical Bakery')}`,
    order.pickup_address ? `LOCATION:${icsEscape(order.pickup_address)}` : '',
    order.pickup_instructions ? `DESCRIPTION:${icsEscape(order.pickup_instructions)}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'retirada-tropical-bakery.ics';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * "Minha retirada": for customers who chose to pick their box up. Shows the day
 * (as a little calendar tile), how far along the order is, and, only once the
 * Pix is confirmed, where to go. The address comes from a database function that
 * checks this is really the customer's own order; it is not in the site's code
 * and is not on any public page.
 * Renders nothing for anyone without a pickup order.
 */
export default function MyPickups() {
  const [orders, setOrders] = useState<PickupOrder[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('my_pickup_orders');
      // Function missing (migration not run yet) or nothing to show: stay invisible.
      if (!cancelled && !error && Array.isArray(data)) setOrders(data as PickupOrder[]);
    })();
    return () => { cancelled = true; };
  }, []);

  if (orders.length === 0) return null;

  return (
    <section style={{ marginBottom: '2rem' }} aria-label="Minhas retiradas">
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
        🛍️ Minha retirada
      </h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {orders.map(o => {
          const date = o.requested_date ? parseISODate(o.requested_date) : null;
          const stepIndex = STEPS.findIndex(s => s.stage === o.stage);
          const mapsUrl = o.pickup_address
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.pickup_address.replace(/\n/g, ', '))}`
            : '';
          return (
            <div key={o.order_id} className="liquid-glass-card" style={{ padding: 'clamp(1.1rem, 3vw, 1.6rem)' }}>
              <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {date && (
                  <div aria-hidden style={{ width: '84px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', textAlign: 'center', background: '#fff', boxShadow: '0 6px 18px rgba(60,42,33,0.15)', border: '1px solid rgba(212,175,55,0.5)' }}>
                    <div style={{ background: '#d4af37', color: '#3c2a21', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em', padding: '0.25rem 0' }}>{MONTHS[date.getMonth()]}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.1rem', lineHeight: 1.1, color: '#3c2a21', paddingTop: '0.25rem' }}>{date.getDate()}</div>
                    <div style={{ fontSize: '0.72rem', color: '#7a6a61', paddingBottom: '0.35rem', textTransform: 'capitalize' }}>
                      {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </div>
                  </div>
                )}
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a6832b', fontWeight: 700 }}>
                    {date ? `Retirada ${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}` : 'Retirada — data a combinar'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: '#3c2a21', lineHeight: 1.3 }}>
                    {o.items_summary || 'Caixa de Degustação'}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', margin: '1.25rem 0 0', padding: 0 }}>
                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={s.stage} style={{ textAlign: 'center' }}>
                      <div style={{ height: '6px', borderRadius: '3px', background: done ? '#d4af37' : '#e8e1d7', marginBottom: '0.4rem' }} />
                      <span style={{ fontSize: '0.72rem', lineHeight: 1.3, color: done ? '#3c2a21' : '#a89a90', fontWeight: done ? 700 : 500 }}>{s.label}</span>
                    </li>
                  );
                })}
              </ol>

              {o.stage === 'awaiting_payment' && (
                <p style={{ marginTop: '1.1rem', padding: '0.9rem 1rem', borderRadius: '12px', background: 'rgba(212,175,55,0.12)', color: '#594a42', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  🔒 Assim que confirmarmos o seu Pix, o endereço para retirada aparece aqui.
                </p>
              )}

              {o.pickup_address && (
                <div style={{ marginTop: '1.1rem', padding: '1.1rem 1.25rem', borderRadius: '14px', background: 'linear-gradient(135deg, #3c2a21 0%, #5a3d2e 100%)', color: '#fdfaf3' }}>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffd166', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {o.stage === 'ready' ? '✅ Sua caixa está pronta! Onde retirar' : 'Onde retirar'}
                  </p>
                  <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: '1rem' }}>{o.pickup_address}</p>
                  {o.pickup_instructions && (
                    <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: '0.9rem', marginTop: '0.6rem', color: 'rgba(253,250,243,0.85)' }}>{o.pickup_instructions}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>Como chegar</a>
                    {o.requested_date && (
                      <button type="button" onClick={() => downloadIcs(o)} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', background: 'transparent', color: '#fdfaf3', borderColor: 'rgba(253,250,243,0.6)' }}>
                        Adicionar ao calendário
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(253,250,243,0.6)', marginTop: '0.8rem' }}>
                    Este endereço é só para você. Por favor, não compartilhe.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
