'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ItemType = 'job_application' | 'order' | 'retreat_inquiry' | 'course_inquiry' | 'waitlist';

interface InboxItem {
  key: string;
  source_table: string;
  source_id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
}

interface StatusStep {
  status: string;
  icon: string;
  label: string;
  color: string;
  bg: string;
}

const FLOWS: Record<ItemType, StatusStep[]> = {
  job_application: [
    { status: 'new', icon: '❓', label: 'Novo', color: '#c0392b', bg: '#fdecea' },
    { status: 'contacted', icon: '📞', label: 'Contatado', color: '#8a6d1f', bg: '#fdf7ee' },
    { status: 'resolved', icon: '✅', label: 'Resolvido', color: '#0b6b3a', bg: '#e6f4ec' },
  ],
  order: [
    { status: 'new', icon: '❓', label: 'Novo Pedido', color: '#c0392b', bg: '#fdecea' },
    { status: 'confirmed', icon: '💰', label: 'Pagamento Confirmado', color: '#8a6d1f', bg: '#fdf7ee' },
    { status: 'preparing', icon: '👩‍🍳', label: 'Em Preparo', color: '#a6832b', bg: '#fdf7ee' },
    { status: 'shipped', icon: '🛵', label: 'Saiu para Entrega', color: '#1a5276', bg: '#eaf2f8' },
    { status: 'delivered', icon: '✅', label: 'Entregue', color: '#0b6b3a', bg: '#e6f4ec' },
  ],
  retreat_inquiry: [
    { status: 'new', icon: '❓', label: 'Novo', color: '#c0392b', bg: '#fdecea' },
    { status: 'contacted', icon: '📞', label: 'Contato Feito', color: '#8a6d1f', bg: '#fdf7ee' },
    { status: 'scheduling', icon: '🗓️', label: 'Agendando', color: '#a6832b', bg: '#fdf7ee' },
    { status: 'scheduled', icon: '✅', label: 'Evento Agendado', color: '#0b6b3a', bg: '#e6f4ec' },
  ],
  course_inquiry: [
    { status: 'new', icon: '❓', label: 'Novo', color: '#c0392b', bg: '#fdecea' },
    { status: 'contacted', icon: '📞', label: 'Contato Feito', color: '#8a6d1f', bg: '#fdf7ee' },
    { status: 'scheduling', icon: '🗓️', label: 'Agendando', color: '#a6832b', bg: '#fdf7ee' },
    { status: 'scheduled', icon: '✅', label: 'Curso Agendado', color: '#0b6b3a', bg: '#e6f4ec' },
  ],
  waitlist: [
    { status: 'new', icon: '❓', label: 'Novo', color: '#c0392b', bg: '#fdecea' },
    { status: 'resolved', icon: '✅', label: 'Resolvido', color: '#0b6b3a', bg: '#e6f4ec' },
  ],
};

const TYPE_LABELS: Record<ItemType, { label: string; icon: string }> = {
  job_application: { label: 'Candidatura', icon: '👷' },
  order: { label: 'Pedido', icon: '📦' },
  retreat_inquiry: { label: 'Interesse em Retiro', icon: '🏡' },
  course_inquiry: { label: 'Interesse em Curso', icon: '🍰' },
  waitlist: { label: 'Fila de Espera', icon: '⏳' },
};

const digitsOnly = (v: string | null | undefined) => (v || '').replace(/\D/g, '');

export default function InboxAdmin() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    const [jobsRes, ordersRes, coursesRes, waitlistRes, statusRes] = await Promise.all([
      supabase.from('job_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('course_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('inbox_status').select('*'),
    ]);

    const merged: InboxItem[] = [
      ...(jobsRes.data || []).map((j: any) => ({
        key: `job_applications:${j.id}`, source_table: 'job_applications', source_id: j.id,
        type: 'job_application' as const,
        title: j.full_name, subtitle: `Vaga: ${j.role}${j.city ? ` · ${j.city}` : ''}`,
        whatsapp: j.whatsapp, email: j.email, created_at: j.created_at,
      })),
      ...(ordersRes.data || []).map((o: any) => ({
        key: `orders:${o.id}`, source_table: 'orders', source_id: o.id,
        type: 'order' as const,
        title: o.customer_name, subtitle: `R$ ${Number(o.total_price).toFixed(2)}${o.requested_date ? ` · Entrega ${new Date(o.requested_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}`,
        whatsapp: o.customer_whatsapp, email: o.customer_email, created_at: o.created_at,
      })),
      ...(coursesRes.data || []).map((c: any) => ({
        key: `course_registrations:${c.id}`, source_table: 'course_registrations', source_id: c.id,
        type: (c.interest_type === 'retiro' ? 'retreat_inquiry' : 'course_inquiry') as ItemType,
        title: c.customer_name, subtitle: c.specific_interest || (c.interest_type === 'retiro' ? 'Retiro' : 'Curso'),
        whatsapp: c.customer_whatsapp, email: c.email, created_at: c.created_at,
      })),
      ...(waitlistRes.data || []).map((w: any) => ({
        key: `waitlist:${w.id}`, source_table: 'waitlist', source_id: w.id,
        type: 'waitlist' as const,
        title: w.name, subtitle: 'Entrou na fila de espera',
        whatsapp: w.whatsapp, email: w.email, created_at: w.created_at,
      })),
    ];

    merged.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    setItems(merged);

    const sMap: Record<string, string> = {};
    (statusRes.data || []).forEach((s: any) => { sMap[`${s.source_table}:${s.source_id}`] = s.status; });
    setStatusMap(sMap);

    setLoading(false);
  };

  const advanceStatus = async (item: InboxItem) => {
    const flow = FLOWS[item.type];
    const current = statusMap[item.key] || 'new';
    const idx = flow.findIndex(f => f.status === current);
    const next = flow[(idx + 1) % flow.length].status;

    setStatusMap(prev => ({ ...prev, [item.key]: next }));
    await supabase.from('inbox_status').upsert(
      { source_table: item.source_table, source_id: item.source_id, status: next, updated_at: new Date().toISOString() },
      { onConflict: 'source_table,source_id' },
    );
  };

  const unreadCount = useMemo(() => items.filter(i => (statusMap[i.key] || 'new') === 'new').length, [items, statusMap]);
  const visible = filter === 'unread' ? items.filter(i => (statusMap[i.key] || 'new') === 'new') : items;

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Caixa de Entrada</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Tudo que chega de fora — candidaturas, pedidos, interesse em cursos e retiros, fila de espera —
        num só lugar. Clique no selo de status para avançar a etapa.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFilter('unread')}
          style={{ padding: '0.7rem 1.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filter === 'unread' ? '#2c3e50' : '#f1f2f6', color: filter === 'unread' ? 'white' : '#7f8c8d' }}
        >
          Não Vistos {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{ padding: '0.7rem 1.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filter === 'all' ? '#2c3e50' : '#f1f2f6', color: filter === 'all' ? 'white' : '#7f8c8d' }}
        >
          Tudo ({items.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {filter === 'unread' ? 'Tudo visto! Nenhum item pendente. 🎉' : 'Nada por aqui ainda.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {visible.map(item => {
            const flow = FLOWS[item.type];
            const current = statusMap[item.key] || 'new';
            const step = flow.find(f => f.status === current) || flow[0];
            const typeInfo = TYPE_LABELS[item.type];
            const isUnread = current === 'new';
            return (
              <div
                key={item.key}
                style={{
                  background: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px',
                  boxShadow: isUnread ? '0 2px 8px rgba(192,57,43,0.12)' : '0 2px 4px rgba(0,0,0,0.05)',
                  border: isUnread ? '1px solid rgba(192,57,43,0.25)' : '1px solid transparent',
                  display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.2rem', color: '#2c3e50', fontWeight: isUnread ? 800 : 600 }}>{item.title}</h3>
                  <p style={{ color: '#7f8c8d', fontSize: '0.88rem', margin: 0 }}>{item.subtitle}</p>
                  <p style={{ color: '#b2bec3', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                {digitsOnly(item.whatsapp) && (
                  <a
                    href={`https://wa.me/${digitsOnly(item.whatsapp).length <= 11 ? '55' + digitsOnly(item.whatsapp) : digitsOnly(item.whatsapp)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ background: '#25D366', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    WhatsApp
                  </a>
                )}

                <button
                  onClick={() => advanceStatus(item)}
                  title="Clique para avançar o status"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '20px',
                    border: 'none', cursor: 'pointer', background: step.bg, color: step.color, fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{step.icon}</span> {step.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
