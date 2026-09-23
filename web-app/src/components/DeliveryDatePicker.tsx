'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OpenDate {
  delivery_date: string;
  notes: string | null;
}

interface DeliveryDatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

const toISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Only lets the customer pick a date Dolly has actually opened for delivery
 * (see /admin/calendario) — no more "choosing" a Tuesday when boxes only go
 * out some Saturdays. Falls back to an honest empty state rather than
 * silently allowing any date if nothing is open yet.
 */
export default function DeliveryDatePicker({ value, onChange }: DeliveryDatePickerProps) {
  const [openDates, setOpenDates] = useState<OpenDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = toISO(new Date());
    supabase
      .from('delivery_dates')
      .select('delivery_date, notes')
      .eq('is_open', true)
      .gte('delivery_date', today)
      .order('delivery_date')
      .then(({ data }) => {
        setOpenDates(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p style={{ color: '#7a6a61', fontSize: '0.9rem' }}>Carregando datas disponíveis...</p>;
  }

  if (openDates.length === 0) {
    return (
      <div style={{ padding: '1rem', background: '#fff4e5', border: '1px solid #f5c6cb', borderRadius: '8px', color: '#7a4a00', fontSize: '0.9rem', lineHeight: 1.6 }}>
        Nenhuma data de entrega aberta no momento. Fale com a gente no WhatsApp para saber a próxima edição.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
      {openDates.map(d => {
        const date = new Date(d.delivery_date + 'T00:00:00');
        const isSelected = value === d.delivery_date;
        return (
          <button
            key={d.delivery_date}
            type="button"
            onClick={() => onChange(d.delivery_date)}
            style={{
              padding: '0.75rem 1.1rem', borderRadius: '10px', border: '1px solid',
              borderColor: isSelected ? '#d4af37' : 'rgba(212,175,55,0.4)',
              background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.7)',
              color: '#3c2a21', cursor: 'pointer', textAlign: 'center', minWidth: '110px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
            {d.notes && <div style={{ fontSize: '0.72rem', color: '#a6832b', marginTop: '0.2rem' }}>{d.notes}</div>}
          </button>
        );
      })}
    </div>
  );
}
