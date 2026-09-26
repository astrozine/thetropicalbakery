'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ItemType = 'job_application' | 'order' | 'retreat_inquiry' | 'course_inquiry' | 'waitlist' | 'contact_lead';

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
  /** A box the customer will collect themselves. */
  pickup?: boolean;
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
    { status: 'cancelled', icon: '🚫', label: 'Cancelado (caixas liberadas)', color: '#6c757d', bg: '#f1f2f6' },
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
  // Someone who tapped a "Falar no WhatsApp" button and left their details first (migration 23).
  contact_lead: [
    { status: 'new', icon: '❓', label: 'Novo', color: '#c0392b', bg: '#fdecea' },
    { status: 'contacted', icon: '📞', label: 'Contato Feito', color: '#8a6d1f', bg: '#fdf7ee' },
    { status: 'resolved', icon: '✅', label: 'Resolvido', color: '#0b6b3a', bg: '#e6f4ec' },
  ],
};

/** Same steps as a delivery, worded for someone collecting their box. Customers' Minha Conta reads these steps too. */
const PICKUP_ORDER_FLOW: StatusStep[] = [
  { status: 'new', icon: '❓', label: 'Novo Pedido (retirada)', color: '#c0392b', bg: '#fdecea' },
  { status: 'confirmed', icon: '💰', label: 'Pagamento Confirmado (libera o endereço)', color: '#8a6d1f', bg: '#fdf7ee' },
  { status: 'preparing', icon: '👩‍🍳', label: 'Em Preparo', color: '#a6832b', bg: '#fdf7ee' },
  { status: 'shipped', icon: '🛍️', label: 'Pronta para retirada', color: '#1a5276', bg: '#eaf2f8' },
  { status: 'delivered', icon: '✅', label: 'Retirado', color: '#0b6b3a', bg: '#e6f4ec' },
  { status: 'cancelled', icon: '🚫', label: 'Cancelado (caixas liberadas)', color: '#6c757d', bg: '#f1f2f6' },
];

const flowFor = (item: InboxItem) => (item.pickup ? PICKUP_ORDER_FLOW : FLOWS[item.type]);

/**
 * Where each kind of message lives in the sidebar. The colours are the sidebar
 * group colours, so a card's stripe matches the folder it belongs to.
 */
const TYPE_INFO: Record<ItemType, { label: string; icon: string; section: string; color: string; bg: string; href?: string; hrefLabel?: string }> = {
  order: { label: 'Pedido', icon: '📦', section: 'Pedidos & Entregas', color: '#b5560f', bg: '#fdebd9' },
  waitlist: { label: 'Fila de Espera', icon: '⏳', section: 'Pedidos & Entregas', color: '#b5560f', bg: '#fdebd9', href: '/admin/waitlist', hrefLabel: 'Fila de Espera' },
  course_inquiry: { label: 'Interesse em Curso', icon: '🍰', section: 'Cursos & Retiros', color: '#b0322a', bg: '#fbe3e0', href: '/admin/inscricoes', hrefLabel: 'Inscrições em Cursos' },
  retreat_inquiry: { label: 'Interesse em Retiro', icon: '🏡', section: 'Cursos & Retiros', color: '#b0322a', bg: '#fbe3e0', href: '/admin/inscricoes', hrefLabel: 'Inscrições em Cursos' },
  contact_lead: { label: 'Contato pelo site', icon: '💬', section: 'Parcerias & Contatos', color: '#0b6b3a', bg: '#e6f4ec' },
  job_application: { label: 'Candidatura', icon: '👷', section: 'Equipe & Casa', color: '#2f6f9f', bg: '#e1eefa', href: '/admin/vagas', hrefLabel: 'Candidaturas de Emprego' },
};

const TYPE_ORDER: ItemType[] = ['order', 'contact_lead', 'course_inquiry', 'retreat_inquiry', 'waitlist', 'job_application'];

const digitsOnly = (v: string | null | undefined) => (v || '').replace(/\D/g, '');
const waLink = (v: string | null) => {
  const d = digitsOnly(v);
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`;
};
const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? `R$ ${n.toFixed(2).replace('.', ',')}` : 'Valor a confirmar';
};

function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [jobsRes, ordersRes, coursesRes, waitlistRes, statusRes, leadsRes] = await Promise.all([
      supabase.from('job_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('course_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('inbox_status').select('*'),
      // Absent until migration 23 runs: the error just leaves this list empty.
      supabase.from('contact_leads').select('*').order('created_at', { ascending: false }),
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
        title: o.customer_name,
        // A quote request from /menu has no price yet: show what they asked for instead of R$ 0.
        // The public may not set a status on a lead (migration 22), so recognise it by what it carries;
        // 'ORCAMENTO' still matches the rows saved before that rule existed.
        subtitle: o.items?.kind === 'orcamento_evento' || o.status === 'ORCAMENTO'
          ? `📝 Orçamento de evento${o.items?.picks?.length ? ` · ${o.items.picks.slice(0, 3).join(', ')}${o.items.picks.length > 3 ? ` +${o.items.picks.length - 3}` : ''}` : ''}${o.items?.guests ? ` · ${o.items.guests} convidados` : ''}${o.requested_date ? ` · ${new Date(o.requested_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}`
          : `${money(o.total_price)}${o.requested_date ? ` · ${o.fulfillment === 'pickup' ? '🛍️ Retirada' : 'Entrega'} ${new Date(o.requested_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}`,
        whatsapp: o.customer_whatsapp, email: o.customer_email, created_at: o.created_at,
        pickup: o.fulfillment === 'pickup',
      })),
      ...(coursesRes.data || []).map((c: any) => ({
        key: `course_registrations:${c.id}`, source_table: 'course_registrations', source_id: c.id,
        type: (c.interest_type === 'retiro' ? 'retreat_inquiry' : 'course_inquiry') as ItemType,
        title: c.customer_name, subtitle: c.specific_interest || (c.interest_type === 'retiro' ? 'Retiro' : 'Curso'),
        whatsapp: c.customer_whatsapp, email: c.email, created_at: c.created_at,
      })),
      ...(leadsRes.data || []).map((l: any) => ({
        key: `contact_leads:${l.id}`, source_table: 'contact_leads', source_id: l.id,
        type: 'contact_lead' as const,
        title: l.name, subtitle: `${l.topic || 'Contato'}${l.signed_in ? ' · entrou com conta' : ''}`,
        whatsapp: l.whatsapp, email: l.email, created_at: l.created_at,
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const advanceStatus = async (item: InboxItem) => {
    // 'cancelled' is set only by "Liberar caixas" on /admin/caixas (it gives the boxes back), never by tapping
    // through the steps, and a cancelled order is not reopened by a stray tap.
    const flow = flowFor(item).filter(f => f.status !== 'cancelled');
    const current = statusMap[item.key] || 'new';
    if (current === 'cancelled') return;
    const idx = flow.findIndex(f => f.status === current);
    const next = flow[(idx + 1) % flow.length].status;

    setStatusMap(prev => ({ ...prev, [item.key]: next }));
    await supabase.from('inbox_status').upsert(
      { source_table: item.source_table, source_id: item.source_id, status: next, updated_at: new Date().toISOString() },
      { onConflict: 'source_table,source_id' },
    );
  };

  return { items, statusMap, loading, advanceStatus };
}

/** The big, coloured "what is this and where does it live" tag on every card. */
function TypeTag({ type, large }: { type: ItemType; large?: boolean }) {
  const t = TYPE_INFO[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
      background: t.bg, color: t.color, borderRadius: '999px', fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
      padding: large ? '0.4rem 0.95rem' : '0.3rem 0.75rem',
      fontSize: large ? '0.95rem' : '0.8rem',
    }}>
      <span style={{ fontSize: large ? '1.15rem' : '1rem' }}>{t.icon}</span> {t.label}
    </span>
  );
}

function ItemCard({ item, step, isUnread, onAdvance, compact }: {
  item: InboxItem; step: StatusStep; isUnread: boolean; onAdvance: () => void; compact?: boolean;
}) {
  const t = TYPE_INFO[item.type];
  return (
    <div
      style={{
        background: 'white', padding: compact ? '0.9rem 1.1rem 0.9rem 1.25rem' : '1.25rem 1.5rem 1.25rem 1.75rem', borderRadius: '12px',
        boxShadow: isUnread ? '0 2px 8px rgba(192,57,43,0.12)' : '0 2px 4px rgba(0,0,0,0.05)',
        border: isUnread ? '1px solid rgba(192,57,43,0.25)' : '1px solid transparent',
        borderLeft: `7px solid ${t.color}`,
        display: 'flex', gap: compact ? '1rem' : '1.5rem', alignItems: 'center', flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <TypeTag type={item.type} large={!compact} />
          <span style={{ fontSize: '0.78rem', color: '#7f8c8d', fontWeight: 600 }}>
            em <strong style={{ color: t.color }}>{t.section}</strong>
          </span>
        </div>
        <h3 style={{ fontSize: compact ? '1rem' : '1.15rem', margin: '0 0 0.2rem', color: '#2c3e50', fontWeight: isUnread ? 800 : 600 }}>{item.title}</h3>
        <p style={{ color: '#7f8c8d', fontSize: '0.88rem', margin: 0 }}>{item.subtitle}</p>
        <p style={{ color: '#95a5a6', fontSize: '0.78rem', marginTop: '0.3rem' }}>
          {new Date(item.created_at).toLocaleString('pt-BR')}
          {t.href && !compact && (
            <> · <Link href={t.href} style={{ color: t.color, fontWeight: 700, textDecoration: 'none' }}>Abrir em {t.hrefLabel} →</Link></>
          )}
        </p>
      </div>

      {digitsOnly(item.whatsapp) && (
        <a
          href={waLink(item.whatsapp)}
          target="_blank" rel="noopener noreferrer"
          style={{ background: '#25D366', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
        >
          WhatsApp
        </a>
      )}

      <button
        onClick={onAdvance}
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
}

const pill = (active: boolean): React.CSSProperties => ({
  padding: '0.7rem 1.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
  background: active ? '#2c3e50' : '#f1f2f6', color: active ? 'white' : '#7f8c8d',
});

/** The full inbox page: status tabs plus a filter per kind of message. */
export function InboxFull() {
  const { items, statusMap, loading, advanceStatus } = useInbox();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');

  const isNew = useCallback((i: InboxItem) => (statusMap[i.key] || 'new') === 'new', [statusMap]);
  const unreadCount = useMemo(() => items.filter(isNew).length, [items, isNew]);
  const pool = filter === 'unread' ? items.filter(isNew) : items;
  const visible = typeFilter === 'all' ? pool : pool.filter(i => i.type === typeFilter);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>📥 Caixa de Entrada</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Tudo que chega de fora — candidaturas, pedidos, interesse em cursos e retiros, fila de espera —
        num só lugar. Cada cartão mostra o tipo em destaque e a pasta do menu a que pertence.
        Clique no selo de status para avançar a etapa.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('unread')} style={pill(filter === 'unread')}>
          Não Vistos {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button onClick={() => setFilter('all')} style={pill(filter === 'all')}>
          Tudo ({items.length})
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTypeFilter('all')}
          style={{ padding: '0.45rem 0.95rem', borderRadius: '999px', border: '2px solid #2c3e50', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: typeFilter === 'all' ? '#2c3e50' : 'white', color: typeFilter === 'all' ? 'white' : '#2c3e50' }}
        >
          Todos os tipos ({pool.length})
        </button>
        {TYPE_ORDER.map(type => {
          const t = TYPE_INFO[type];
          const n = pool.filter(i => i.type === type).length;
          const active = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{ padding: '0.45rem 0.95rem', borderRadius: '999px', border: `2px solid ${t.color}`, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: active ? t.color : t.bg, color: active ? 'white' : t.color, opacity: n === 0 && !active ? 0.55 : 1 }}
            >
              {t.icon} {t.label} ({n})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {filter === 'unread' ? 'Tudo visto! Nenhum item pendente. 🎉' : 'Nada por aqui ainda.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {visible.map(item => {
            const flow = flowFor(item);
            const current = statusMap[item.key] || 'new';
            const step = flow.find(f => f.status === current) || flow[0];
            return <ItemCard key={item.key} item={item} step={step} isUnread={current === 'new'} onAdvance={() => advanceStatus(item)} />;
          })}
        </div>
      )}
    </div>
  );
}

/** The "what just arrived" panel on the Visão Geral page: newest unseen items, plus a count per kind. */
export function InboxSummary({ limit = 6 }: { limit?: number }) {
  const { items, statusMap, loading, advanceStatus } = useInbox();

  const unread = useMemo(() => items.filter(i => (statusMap[i.key] || 'new') === 'new'), [items, statusMap]);
  const shown = unread.slice(0, limit);

  return (
    <section style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: 'clamp(1.25rem, 3vw, 2rem)', marginBottom: '2rem', borderTop: '6px solid #d9453a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#2c3e50', margin: 0 }}>
          📥 Chegou agora
          {!loading && unread.length > 0 && (
            <span style={{ marginLeft: '0.6rem', background: '#d9453a', color: 'white', borderRadius: '999px', fontSize: '0.85rem', padding: '0.2rem 0.7rem', verticalAlign: 'middle' }}>
              {unread.length} {unread.length === 1 ? 'novo' : 'novos'}
            </span>
          )}
        </h2>
        <Link href="/admin/inbox" style={{ color: '#2c3e50', fontWeight: 800, textDecoration: 'none', fontSize: '0.95rem' }}>
          Abrir a Caixa de Entrada completa →
        </Link>
      </div>

      {loading ? (
        <p style={{ color: '#7f8c8d' }}>Carregando...</p>
      ) : unread.length === 0 ? (
        <p style={{ color: '#7f8c8d', padding: '1rem 0' }}>Tudo visto! Nenhuma mensagem nova. 🎉</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
            {TYPE_ORDER.map(type => {
              const n = unread.filter(i => i.type === type).length;
              if (!n) return null;
              const t = TYPE_INFO[type];
              return (
                <Link key={type} href="/admin/inbox" style={{ background: t.bg, color: t.color, borderRadius: '999px', padding: '0.4rem 0.9rem', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none' }}>
                  {t.icon} {n} {t.label}
                </Link>
              );
            })}
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {shown.map(item => {
              const flow = flowFor(item);
              const step = flow.find(f => f.status === 'new') || flow[0];
              return <ItemCard key={item.key} item={item} step={step} isUnread compact onAdvance={() => advanceStatus(item)} />;
            })}
          </div>
          {unread.length > shown.length && (
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/admin/inbox" style={{ color: '#7f8c8d', fontWeight: 700, textDecoration: 'none' }}>
                + mais {unread.length - shown.length} na Caixa de Entrada
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
