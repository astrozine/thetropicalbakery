'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BUCKETS, BUCKET_ORDER, bucketOf, urgencyOf, urgencyRank, type Bucket, type Urgency } from './inboxStatus';

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
  /** The day an order is due out ('YYYY-MM-DD'), for the red "delivery is tomorrow" flag. */
  dueDate?: string | null;
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
        // A quote request's date is the event day, not a delivery we are late on.
        dueDate: o.items?.kind === 'orcamento_evento' || o.status === 'ORCAMENTO' ? null : (o.requested_date || null),
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

  const setStatus = async (item: InboxItem, next: string) => {
    setStatusMap(prev => ({ ...prev, [item.key]: next }));
    await supabase.from('inbox_status').upsert(
      { source_table: item.source_table, source_id: item.source_id, status: next, updated_at: new Date().toISOString() },
      { onConflict: 'source_table,source_id' },
    );
  };

  /**
   * One step forward. It stops at the last step (a finished item does not loop back to "new";
   * "Reabrir" does that on purpose). 'cancelled' is set only by "Liberar caixas" on /admin/caixas
   * (it gives the boxes back), never by walking through the steps, and a cancelled order is not reopened.
   */
  const advanceStatus = async (item: InboxItem) => {
    const flow = flowFor(item).filter(f => f.status !== 'cancelled');
    const current = statusMap[item.key] || 'new';
    if (current === 'cancelled' || current === 'archived') return;
    const idx = flow.findIndex(f => f.status === current);
    const next = flow[idx + 1];
    if (next) await setStatus(item, next.status);
  };

  return { items, statusMap, loading, advanceStatus, setStatus };
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

/** A message plus everything the screen needs to know about where it stands. */
interface Row {
  item: InboxItem;
  status: string;
  flow: StatusStep[];
  step: StatusStep;
  bucket: Bucket;
  urgency: Urgency | null;
}

function describe(item: InboxItem, statusMap: Record<string, string>): Row {
  const flow = flowFor(item);
  const status = statusMap[item.key] || 'new';
  const bucket = bucketOf(flow, status);
  const step = flow.find(f => f.status === status)
    ?? (status === 'archived' ? { status, icon: '🗄️', label: 'Arquivado', color: '#6c757d', bg: '#f1f2f6' } : flow[0]);
  const urgency = urgencyOf({ bucket, status, createdAt: item.created_at, dueDate: item.dueDate, pickup: item.pickup });
  return { item, status, flow, step, bucket, urgency };
}

/** "Where is this?" in one glance: the mail-style place it sits in, then the exact step. */
function StatusBadge({ row }: { row: Row }) {
  const b = BUCKETS[row.bucket];
  return (
    <span
      title={`${b.label}: ${b.hint}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: b.bg, color: b.color, borderRadius: '999px', padding: '0.28rem 0.75rem', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap' }}
    >
      <span>{b.icon}</span>
      <span>{b.label}</span>
      {row.step.label !== b.label && <span style={{ fontWeight: 600, opacity: 0.85 }}>· {row.step.label}</span>}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const urgent = urgency.level === 'urgent';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '999px', padding: '0.28rem 0.75rem', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap',
      background: urgent ? '#c0392b' : '#fff1e0', color: urgent ? '#fff' : '#b5560f',
    }}>
      {urgent ? '🚨' : '⏰'} {urgency.text}
    </span>
  );
}

const actionBtn = (bg: string, color: string, border = 'transparent'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', borderRadius: '999px',
  border: `1px solid ${border}`, background: bg, color, fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', whiteSpace: 'nowrap',
});

/**
 * Layout for the cards and the lists around them. On a wide screen a card is a row: the message on the left, its buttons in a column
 * on the right. On a phone that cannot work (the nowrap buttons push past the card's edge), so the card becomes a stack in the way
 * mobile apps do it: the message, then ONE big primary button across the full width (next step, 48px tall), then WhatsApp / Concluir /
 * Arquivar side by side underneath, each at least 44px tall for a thumb. The white box around the "Chegou agora" list is dropped on
 * phones so the cards use the whole screen width, and the filter tabs become a swipeable strip instead of wrapping into rows.
 */
function InboxStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .inbox-card { background: #fff; padding: 1.15rem 1.5rem 1.15rem 1.75rem; border-radius: 12px; display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
      .inbox-card--compact { padding: 0.9rem 1.1rem 0.9rem 1.25rem; gap: 1rem; }
      .inbox-card__main { flex: 1 1 320px; min-width: 0; overflow-wrap: anywhere; }
      .inbox-card__actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: stretch; flex: 0 0 auto; margin-left: auto; }
      .inbox-card__more { display: flex; gap: 0.4rem; justify-content: flex-end; flex-wrap: wrap; }
      .inbox-summary { background: #fff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: clamp(1.25rem, 3vw, 2rem); margin-bottom: 2rem; border-top: 6px solid #d9453a; }
      .inbox-toast { position: fixed; left: 50%; bottom: 2rem; transform: translateX(-50%); z-index: 50; max-width: 92vw; }

      @media (max-width: 767px) {
        /* clear the phone's bottom bar */
        .inbox-toast { bottom: calc(5.5rem + env(safe-area-inset-bottom)); }
      }
      @media (max-width: 640px) {
        .inbox-summary { background: transparent; box-shadow: none; border-top: 0; border-radius: 0; padding: 0; margin-bottom: 1.25rem; }
        .inbox-card, .inbox-card--compact { flex-direction: column; align-items: stretch; flex-wrap: nowrap; gap: 0.9rem; padding: 1rem 1rem 1rem 1.1rem; border-radius: 14px; }
        .inbox-card__main { flex: none; width: 100%; }
        .inbox-card__actions { flex-direction: row; flex-wrap: wrap; align-items: stretch; margin-left: 0; width: 100%; gap: 0.5rem; }
        .inbox-card__more { display: contents; }
        .inbox-btn { flex: 1 1 0; min-width: 6.5rem; min-height: 44px; justify-content: center; text-align: center; white-space: normal !important; font-size: 0.9rem !important; }
        .inbox-btn--primary { flex: 1 1 100%; order: -1; min-height: 48px; font-size: 0.95rem !important; }

        .inbox-strip { flex-wrap: nowrap !important; overflow-x: auto; margin-left: -1rem; margin-right: -1rem; padding: 0.15rem 1rem 0.5rem; scroll-snap-type: x proximity; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .inbox-strip::-webkit-scrollbar { display: none; }
        .inbox-strip > * { flex: 0 0 auto; scroll-snap-align: start; }
        .inbox-strip > button { min-height: 44px; }
      }
    ` }} />
  );
}

const stamp = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function ItemCard({ row, onSet, compact }: {
  row: Row; onSet: (status: string, message: string) => void; compact?: boolean;
}) {
  const { item, flow, status, bucket, urgency } = row;
  const t = TYPE_INFO[item.type];
  const steps = flow.filter(f => f.status !== 'cancelled');
  const idx = steps.findIndex(f => f.status === status);
  const next = bucket === 'attention' || bucket === 'progress' ? steps[Math.max(idx, 0) + 1] : undefined;
  const last = steps[steps.length - 1];
  const canSkipToDone = !!next && next.status !== last.status;
  // Orders keep their steps because the customer's own page reads them; an order is ended by cancelling it
  // (Liberar caixas) rather than archiving, so only the other kinds of message can be archived.
  const canArchive = item.type !== 'order' && bucket !== 'closed';
  const canReopen = (bucket === 'done' || bucket === 'closed') && status !== 'cancelled';
  const isUnread = bucket === 'attention';

  return (
    <div
      className={`inbox-card${compact ? ' inbox-card--compact' : ''}`}
      style={{
        boxShadow: urgency?.level === 'urgent' ? '0 2px 10px rgba(192,57,43,0.22)' : isUnread ? '0 2px 8px rgba(192,57,43,0.12)' : '0 2px 4px rgba(0,0,0,0.05)',
        border: urgency?.level === 'urgent' ? '1px solid rgba(192,57,43,0.55)' : isUnread ? '1px solid rgba(192,57,43,0.25)' : '1px solid transparent',
        borderLeft: `7px solid ${t.color}`,
        opacity: bucket === 'closed' ? 0.78 : 1,
      }}
    >
      <div className="inbox-card__main">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <TypeTag type={item.type} large={!compact} />
          <span style={{ fontSize: '0.78rem', color: '#7f8c8d', fontWeight: 600 }}>
            em <strong style={{ color: t.color }}>{t.section}</strong>
          </span>
        </div>
        <h3 style={{ fontSize: compact ? '1rem' : '1.15rem', margin: '0 0 0.2rem', color: '#2c3e50', fontWeight: isUnread ? 800 : 600 }}>{item.title}</h3>
        <p style={{ color: '#7f8c8d', fontSize: '0.88rem', margin: 0 }}>{item.subtitle}</p>
        <p style={{ color: '#95a5a6', fontSize: '0.78rem', marginTop: '0.3rem' }}>
          {stamp(item.created_at)}
          {t.href && !compact && (
            <> · <Link href={t.href} style={{ color: t.color, fontWeight: 700, textDecoration: 'none' }}>Abrir em {t.hrefLabel} →</Link></>
          )}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
          <StatusBadge row={row} />
          {urgency && <UrgencyBadge urgency={urgency} />}
        </div>
      </div>

      <div className="inbox-card__actions">
        {digitsOnly(item.whatsapp) && (
          <a
            className="inbox-btn"
            href={waLink(item.whatsapp)}
            target="_blank" rel="noopener noreferrer"
            style={{ ...actionBtn('#25D366', 'white'), justifyContent: 'center', textDecoration: 'none' }}
          >
            💬 WhatsApp
          </a>
        )}

        {next && (
          <button
            className="inbox-btn inbox-btn--primary"
            onClick={() => onSet(next.status, next.status === last.status ? `Movido para ${BUCKETS.done.tab}` : `Marcado como “${next.label}”`)}
            title={`Avançar este item para: ${next.label}`}
            style={{ ...actionBtn('#2c3e50', 'white'), justifyContent: 'center' }}
          >
            {next.icon} {next.label} →
          </button>
        )}

        {(canSkipToDone || canArchive || canReopen) && (
          <div className="inbox-card__more">
            {canSkipToDone && (
              <button className="inbox-btn" onClick={() => onSet(last.status, `Movido para ${BUCKETS.done.tab}`)} title="Pular direto para concluído" style={actionBtn('#e6f4ec', '#0b6b3a', '#b9e0c8')}>
                ✓ Concluir
              </button>
            )}
            {canArchive && (
              <button className="inbox-btn" onClick={() => onSet('archived', `Movido para ${BUCKETS.closed.tab}`)} title="Tirar da frente (fica em Arquivados)" style={actionBtn('#f1f2f6', '#5d6d7e', '#dfe3ea')}>
                🗄️ Arquivar
              </button>
            )}
            {canReopen && (
              <button className="inbox-btn" onClick={() => onSet('new', 'Reaberto: voltou para “Precisa de você”')} title="Voltar para “Precisa de você”" style={actionBtn('#fff', '#2c3e50', '#cfd6dd')}>
                ↩ Reabrir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', borderRadius: '10px', cursor: 'pointer',
  border: `2px solid ${active ? color : 'transparent'}`, fontWeight: 800, fontSize: '0.92rem',
  background: active ? '#fff' : '#f1f2f6', color: active ? color : '#6b7a89', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
});

const countStyle = (color: string, active: boolean): React.CSSProperties => ({
  background: active ? color : '#dfe3ea', color: active ? '#fff' : '#5d6d7e', borderRadius: '999px', padding: '0.05rem 0.55rem', fontSize: '0.78rem', fontWeight: 800,
});

/** The full inbox page: mail-style tabs (needs you / in progress / done / archived), plus a filter per kind of message. */
export function InboxFull() {
  const { items, statusMap, loading, setStatus } = useInbox();
  const [tab, setTab] = useState<Bucket | 'all'>('attention');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [toast, setToast] = useState<{ text: string; undo: () => void } | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = useMemo(() => items.map(i => describe(i, statusMap)), [items, statusMap]);
  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { attention: 0, progress: 0, done: 0, closed: 0 };
    rows.forEach(r => { c[r.bucket] += 1; });
    return c;
  }, [rows]);
  const redFlags = useMemo(() => rows.filter(r => r.urgency?.level === 'urgent').length, [rows]);

  const pool = tab === 'all' ? rows : rows.filter(r => r.bucket === tab);
  // Red flags first, then the newest.
  const visible = (typeFilter === 'all' ? pool : pool.filter(r => r.item.type === typeFilter))
    .slice()
    .sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency) || (b.item.created_at || '').localeCompare(a.item.created_at || ''));

  const act = (row: Row, next: string, message: string) => {
    const before = row.status;
    setStatus(row.item, next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text: message, undo: () => { setStatus(row.item, before); setToast(null); } });
    toastTimer.current = setTimeout(() => setToast(null), 7000);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div>
      <InboxStyles />
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>📥 Caixa de Entrada</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        Tudo que chega de fora, num só lugar. Cada item passa por três etapas:{' '}
        <strong style={{ color: BUCKETS.attention.color }}>{BUCKETS.attention.icon} Precisa de você</strong> →{' '}
        <strong style={{ color: BUCKETS.progress.color }}>{BUCKETS.progress.icon} Em andamento</strong> →{' '}
        <strong style={{ color: BUCKETS.done.color }}>{BUCKETS.done.icon} Concluído</strong>.
        Use os botões de cada cartão para mover; <strong>🗄️ Arquivar</strong> tira da frente sem apagar.
        Um <strong style={{ color: '#c0392b' }}>🚨 selo vermelho</strong> avisa o que não pode esperar.
      </p>

      {redFlags > 0 && (
        <div style={{ background: '#fdecea', border: '1px solid rgba(192,57,43,0.4)', color: '#a93226', borderRadius: '12px', padding: '0.85rem 1.1rem', marginBottom: '1.25rem', fontWeight: 700 }}>
          🚨 {redFlags} {redFlags === 1 ? 'item não pode esperar' : 'itens não podem esperar'} (entrega perto e ainda sem sair). Estão no topo da lista.
        </div>
      )}

      <div className="inbox-strip" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {BUCKET_ORDER.map(b => (
          <button key={b} onClick={() => setTab(b)} style={tabStyle(tab === b, BUCKETS[b].color)}>
            <span>{BUCKETS[b].icon}</span> {BUCKETS[b].tab}
            <span style={countStyle(BUCKETS[b].color, tab === b)}>{counts[b]}</span>
          </button>
        ))}
        <button onClick={() => setTab('all')} style={tabStyle(tab === 'all', '#2c3e50')}>
          Tudo <span style={countStyle('#2c3e50', tab === 'all')}>{rows.length}</span>
        </button>
      </div>

      <div className="inbox-strip" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTypeFilter('all')}
          style={{ padding: '0.45rem 0.95rem', borderRadius: '999px', border: '2px solid #2c3e50', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: typeFilter === 'all' ? '#2c3e50' : 'white', color: typeFilter === 'all' ? 'white' : '#2c3e50' }}
        >
          Todos os tipos ({pool.length})
        </button>
        {TYPE_ORDER.map(type => {
          const t = TYPE_INFO[type];
          const n = pool.filter(r => r.item.type === type).length;
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
          {tab === 'all' ? 'Nada por aqui ainda.' : BUCKETS[tab].empty}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {visible.map(row => (
            <ItemCard key={row.item.key} row={row} onSet={(next, message) => act(row, next, message)} />
          ))}
        </div>
      )}

      {toast && (
        <div role="status" className="inbox-toast" style={{
          background: '#2c3e50', color: '#fff', borderRadius: '12px', padding: '0.85rem 1.25rem', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex', gap: '1.25rem', alignItems: 'center', fontWeight: 600,
        }}>
          <span>{toast.text}</span>
          <button onClick={toast.undo} style={{ background: 'none', border: 'none', color: '#f4d675', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>Desfazer</button>
        </div>
      )}
    </div>
  );
}

/** The "what just arrived" panel on the Visão Geral page: newest unseen items, plus a count per kind. */
export function InboxSummary({ limit = 6 }: { limit?: number }) {
  const { items, statusMap, loading, setStatus } = useInbox();

  const rows = useMemo(() => items.map(i => describe(i, statusMap)), [items, statusMap]);
  const unread = useMemo(
    () => rows.filter(r => r.bucket === 'attention')
      .sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency) || (b.item.created_at || '').localeCompare(a.item.created_at || '')),
    [rows],
  );
  const shown = unread.slice(0, limit);

  return (
    <section className="inbox-summary">
      <InboxStyles />
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
          <div className="inbox-strip" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
            {TYPE_ORDER.map(type => {
              const n = unread.filter(r => r.item.type === type).length;
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
            {shown.map(row => (
              <ItemCard key={row.item.key} row={row} compact onSet={next => setStatus(row.item, next)} />
            ))}
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
