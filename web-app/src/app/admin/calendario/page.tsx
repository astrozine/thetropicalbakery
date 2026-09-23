'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DeliveryDate {
  delivery_date: string;
  is_open: boolean;
  notes: string | null;
  notified_at: string | null;
}

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const toISO = (d: Date) => d.toISOString().slice(0, 10);

export default function DeliveryCalendarAdmin() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [dates, setDates] = useState<Record<string, DeliveryDate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');
  const [selectedNote, setSelectedNote] = useState<{ date: string; text: string } | null>(null);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => {
    load();
  }, [year, month]);

  const load = async () => {
    setLoading(true);
    const first = toISO(new Date(year, month, 1));
    const last = toISO(new Date(year, month + 1, 0));
    const { data } = await supabase
      .from('delivery_dates')
      .select('*')
      .gte('delivery_date', first)
      .lte('delivery_date', last);

    const map: Record<string, DeliveryDate> = {};
    (data || []).forEach(d => { map[d.delivery_date] = d; });
    setDates(map);
    setLoading(false);
  };

  const toggleDate = async (iso: string) => {
    const existing = dates[iso];
    const nextOpen = !existing?.is_open;
    setSaving(iso);

    const { error } = await supabase
      .from('delivery_dates')
      .upsert({ delivery_date: iso, is_open: nextOpen, notes: existing?.notes || null }, { onConflict: 'delivery_date' });

    if (!error) {
      setDates(prev => ({ ...prev, [iso]: { delivery_date: iso, is_open: nextOpen, notes: existing?.notes || null, notified_at: existing?.notified_at || null } }));
    }
    setSaving(null);
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    const existing = dates[selectedNote.date];
    await supabase
      .from('delivery_dates')
      .upsert({ delivery_date: selectedNote.date, is_open: existing?.is_open ?? true, notes: selectedNote.text || null }, { onConflict: 'delivery_date' });
    setDates(prev => ({ ...prev, [selectedNote.date]: { delivery_date: selectedNote.date, is_open: existing?.is_open ?? true, notes: selectedNote.text || null, notified_at: existing?.notified_at || null } }));
    setSelectedNote(null);
  };

  const openDates = Object.values(dates).filter(d => d.is_open);
  const unnotifiedOpenDates = openDates.filter(d => !d.notified_at);

  const notifyCustomers = async () => {
    setNotifying(true);
    setNotifyResult('');
    try {
      const res = await fetch('/api/notify-delivery-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: unnotifiedOpenDates.map(d => d.delivery_date) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao enviar');
      setNotifyResult(`✅ E-mail enviado para ${json.sent} cliente(s).`);
      load();
    } catch (err: any) {
      setNotifyResult(`❌ ${err.message}`);
    }
    setNotifying(false);
  };

  const whatsappMessage = unnotifiedOpenDates.length > 0
    ? `Oi! 🌴 Abrimos novas datas de entrega da Caixa de Degustação: ${unnotifiedOpenDates.map(d => new Date(d.delivery_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })).join(', ')}. Garanta a sua: https://thetropicalbakery.com/caixas`
    : '';

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(year, month, i + 1)))];

  const today = toISO(new Date());

  return (
    <div style={{ maxWidth: '760px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Calendário de Entregas</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Clique num dia para abrir ou fechar a entrega. Só os dias abertos aparecem para o cliente
        escolher no checkout — o resto fica bloqueado automaticamente.
      </p>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => setMonthOffset(m => m - 1)} style={{ background: '#f1f2f6', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: '1.2rem', color: '#2c3e50' }}>{MONTH_NAME[month]} {year}</h2>
          <button onClick={() => setMonthOffset(m => m + 1)} style={{ background: '#f1f2f6', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>→</button>
        </div>

        {loading ? <p style={{ color: '#7f8c8d' }}>Carregando...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
            {WEEKDAY.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#95a5a6', fontWeight: 'bold', paddingBottom: '0.4rem' }}>{w}</div>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const info = dates[iso];
              const isPast = iso < today;
              const dayNum = Number(iso.slice(-2));
              return (
                <div key={iso} style={{ position: 'relative' }}>
                  <button
                    onClick={() => !isPast && toggleDate(iso)}
                    disabled={isPast || saving === iso}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: '10px', border: 'none', cursor: isPast ? 'default' : 'pointer',
                      background: isPast ? '#f1f2f6' : info?.is_open ? '#0b6b3a' : '#fdf7ee',
                      color: isPast ? '#bdc3c7' : info?.is_open ? 'white' : '#3c2a21',
                      fontWeight: 700, fontSize: '0.95rem',
                      opacity: saving === iso ? 0.5 : 1,
                    }}
                  >
                    {dayNum}
                  </button>
                  {info?.is_open && (
                    <button
                      onClick={() => setSelectedNote({ date: iso, text: info?.notes || '' })}
                      title="Adicionar nota"
                      style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', border: 'none', background: '#d4af37', color: 'white', fontSize: '0.6rem', cursor: 'pointer', lineHeight: '18px' }}
                    >
                      ✎
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedNote && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.5rem' }}>
            Nota para {new Date(selectedNote.date + 'T00:00:00').toLocaleDateString('pt-BR')}
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={selectedNote.text}
              onChange={e => setSelectedNote({ ...selectedNote, text: e.target.value })}
              placeholder="Ex: Edição Outono, só até 15h"
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #dfe4ea' }}
            />
            <button onClick={saveNote} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
            <button onClick={() => setSelectedNote(null)} style={{ background: 'transparent', border: '1px solid #dfe4ea', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#2c3e50', marginBottom: '0.75rem' }}>Avisar clientes</h3>
        {unnotifiedOpenDates.length === 0 ? (
          <p style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Nenhuma data nova aberta para avisar. Abra um dia no calendário acima.</p>
        ) : (
          <>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Datas novas ainda não avisadas: <strong style={{ color: '#3c2a21' }}>{unnotifiedOpenDates.map(d => new Date(d.delivery_date + 'T00:00:00').toLocaleDateString('pt-BR')).join(', ')}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button onClick={notifyCustomers} disabled={notifying} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {notifying ? 'Enviando...' : '✉️ Enviar e-mail para clientes'}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(whatsappMessage)}
                style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                📋 Copiar mensagem para WhatsApp
              </button>
            </div>
            <p style={{ color: '#95a5a6', fontSize: '0.8rem', lineHeight: 1.6 }}>
              O envio automático por WhatsApp ainda não está disponível (aguardando o registro da empresa no Twilio).
              Por enquanto, copie a mensagem acima e envie pela sua lista de transmissão do WhatsApp.
            </p>
            {notifyResult && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: notifyResult.startsWith('✅') ? '#0b6b3a' : '#c0392b' }}>{notifyResult}</p>}
          </>
        )}
      </div>
    </div>
  );
}
