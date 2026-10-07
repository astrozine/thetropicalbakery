'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { formatBRL } from '@/lib/deliveryZones';
import BrunchChat from '@/components/brunch/BrunchChat';
import BrunchVote from '@/components/brunch/BrunchVote';
import { BRUNCH_CSS } from '@/components/brunch/brunchStyles';
import { eventPath, fmtWhen, normalizeEvent, roomPath, venueKind, type BrunchEvent, type EventStatus, type RoomData } from '@/lib/brunch';

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  reference: string | null;
  price: number;
  status: 'reservado' | 'pago' | 'espera' | 'cancelado';
  hold_until: string | null;
  paid_at: string | null;
  checked_in_at: string | null;
  credit_claimed_at: string | null;
  credit_applied_at: string | null;
  popup_request: string | null;
  admin_notes: string | null;
  created_at: string;
}

const STATUS: Record<Ticket['status'], { label: string; bg: string; color: string }> = {
  pago: { label: 'Pago', bg: '#e6f4ec', color: '#0b6b3a' },
  reservado: { label: 'Esperando Pix', bg: '#fff4e5', color: '#7a4a00' },
  espera: { label: 'Lista de espera', bg: '#eef2f7', color: '#3a4a63' },
  cancelado: { label: 'Cancelado', bg: '#f1f1f1', color: '#777' },
};

const EVENT_STATUS: { id: EventStatus; label: string }[] = [
  { id: 'publicado', label: 'No site, à venda' },
  { id: 'rascunho', label: 'Rascunho (fora do site)' },
  { id: 'encerrado', label: 'Encerrado (aconteceu)' },
  { id: 'cancelado', label: 'Cancelado' },
];

async function adminPost(body: Record<string, unknown>) {
  const { data } = await supabase.auth.getSession();
  const r = await fetch('/api/brunch/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não deu certo.');
  return j;
}

const wa = (n: string | null) => (n ? `https://wa.me/${n.replace(/\D/g, '').replace(/^(?!55)/, '55')}` : '');

export default function BrunchDetail({ event: initial, onBack, onEdit }: { event: BrunchEvent; onBack: () => void; onEdit: () => void }) {
  const [event, setEvent] = useState(initial);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [me, setMe] = useState<string>('');
  const [busy, setBusy] = useState('');
  const [guest, setGuest] = useState({ name: '', email: '', whatsapp: '' });
  const [note, setNote] = useState({ subject: '', body: '' });
  const [tab, setTab] = useState<'convidadas' | 'grupo' | 'emails'>('convidadas');

  const load = useCallback(async () => {
    const [{ data: t }, { data: r }, { data: ev }, { data: u }] = await Promise.all([
      supabase.from('brunch_tickets').select('*').eq('event_id', event.id).order('created_at'),
      supabase.rpc('brunch_room', { p_event: event.id }),
      supabase.from('brunch_events').select('*').eq('id', event.id).maybeSingle(),
      supabase.auth.getUser(),
    ]);
    setTickets((t || []) as Ticket[]);
    if (r) setRoom(r as RoomData);
    if (ev) setEvent(normalizeEvent(ev));
    setMe(u.user?.id ?? '');
  }, [event.id]);

  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try { await fn(); if (ok) await brandAlert(ok); } catch (e) { await brandAlert(e instanceof Error ? e.message : 'Não deu certo.'); }
    setBusy('');
    load();
  };

  const update = (t: Ticket, patch: Partial<Ticket>) => run(t.id, async () => {
    const { error } = await supabase.from('brunch_tickets').update(patch).eq('id', t.id);
    if (error) throw new Error(error.message);
  });

  const now = Date.now();
  const paid = tickets.filter(t => t.status === 'pago');
  const holding = tickets.filter(t => t.status === 'reservado' && t.hold_until && new Date(t.hold_until).getTime() > now);
  const expired = tickets.filter(t => t.status === 'reservado' && (!t.hold_until || new Date(t.hold_until).getTime() <= now));
  const waiting = tickets.filter(t => t.status === 'espera');
  const left = Math.max(0, event.capacity - paid.length - holding.length);
  const revenue = paid.reduce((n, t) => n + Number(t.price || 0), 0);
  const v = venueKind(event.venue_kind);

  const sendEmail = async (action: 'announce' | 'note' | 'waitlist') => {
    const extra = action === 'note' ? note : {};
    if (action === 'note' && (!note.subject.trim() || !note.body.trim())) { await brandAlert('Escreva o assunto e o recado.'); return; }
    setBusy(action);
    try {
      const dry = await adminPost({ action, eventId: event.id, dryRun: true, ...extra });
      const n = Math.max(0, (dry.audience ?? 0) - (dry.skipped ?? 0));
      if (n === 0) { await brandAlert(dry.skipped ? 'Todo mundo já recebeu este e-mail.' : 'Ninguém para receber (ou todo mundo pediu para não receber este tipo de e-mail).'); setBusy(''); return; }
      const who = action === 'announce' ? 'pessoas da lista' : action === 'waitlist' ? 'pessoas da lista de espera' : 'convidadas';
      if (!(await brandConfirm(`Mandar "${dry.subject}" para ${n} ${who}?`, { confirmLabel: 'Mandar' }))) { setBusy(''); return; }
      const r = await adminPost({ action, eventId: event.id, ...extra });
      await brandAlert(`✉️ Enviado para ${r.sent}${r.failed ? ` (${r.failed} falharam)` : ''}${r.remaining ? `. Faltam ${r.remaining}: aperte de novo para continuar.` : '.'}`);
      if (action === 'note') setNote({ subject: '', body: '' });
    } catch (e) {
      await brandAlert(e instanceof Error ? e.message : 'Não deu certo.');
    }
    setBusy('');
  };

  const setStatus = (s: EventStatus) => run('status', async () => {
    const { error } = await supabase.from('brunch_events').update({ status: s }).eq('id', event.id);
    if (error) throw new Error(error.message);
  });

  const row = (t: Ticket) => {
    const st = STATUS[t.status];
    return (
      <div key={t.id} className="bx-card" style={{ display: 'grid', gap: '0.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <strong style={{ overflowWrap: 'anywhere' }}>{t.full_name || t.email}</strong>
          <span className="bx-chip" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <div style={{ color: '#6a6a6a', fontSize: '0.9rem', display: 'flex', gap: '0.3rem 1rem', flexWrap: 'wrap', overflowWrap: 'anywhere' }}>
          <span>{t.email}</span>
          {t.whatsapp && <a href={wa(t.whatsapp)} target="_blank" rel="noopener noreferrer" style={{ color: '#1e8a4c', fontWeight: 700 }}>WhatsApp</a>}
          {t.reference && <span>{t.reference}</span>}
          {t.price > 0 && <span>{formatBRL(t.price)}</span>}
          {t.status === 'reservado' && t.hold_until && <span>{new Date(t.hold_until).getTime() > now ? `guardado até ${new Date(t.hold_until).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '⚠️ reserva venceu (lugar livre)'}</span>}
        </div>
        {t.popup_request && <div style={{ background: '#fdf6e3', borderRadius: 10, padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>🛍️ <strong>Quer levar pop-up:</strong> {t.popup_request}</div>}
        {t.credit_claimed_at && (
          <div style={{ background: '#eef6ff', borderRadius: 10, padding: '0.5rem 0.75rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            💌 {t.credit_applied_at ? `Crédito de ${formatBRL(t.price)} já descontado na assinatura.` : `Pediu o crédito de ${formatBRL(t.price)} na assinatura anual. Desconte na 1ª mensalidade.`}
            {!t.credit_applied_at && <button type="button" className="bx-link" onClick={() => update(t, { credit_applied_at: new Date().toISOString() })}>Marcar como descontado</button>}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {t.status === 'reservado' && (
            <button type="button" className="bx-btn bx-btn--gold" style={{ minHeight: 44, padding: '0.5rem 1rem' }} disabled={busy === t.id}
              onClick={async () => { if (await brandConfirm(`O Pix de ${t.full_name || t.email} caiu? Ela recebe o e-mail de boas-vindas com o grupo.`, { confirmLabel: 'Sim, caiu' })) run(t.id, () => adminPost({ action: 'confirm', ticketId: t.id }), '✅ Confirmado. Ela já recebeu o e-mail com o grupo.'); }}>
              ✅ Pix caiu
            </button>
          )}
          {t.status === 'espera' && left > 0 && (
            <button type="button" className="bx-btn bx-btn--ghost" style={{ minHeight: 44, padding: '0.5rem 1rem' }}
              onClick={async () => { if (await brandConfirm('Dar o lugar para esta pessoa sem cobrar pelo site (pagou por fora, ou é convidada)?', { confirmLabel: 'Dar o lugar' })) run(t.id, () => adminPost({ action: 'confirm', ticketId: t.id }), 'Lugar dado. Ela recebeu o e-mail com o grupo.'); }}>
              Dar o lugar
            </button>
          )}
          {t.status === 'pago' && (
            <button type="button" className="bx-btn bx-btn--ghost" style={{ minHeight: 44, padding: '0.5rem 1rem' }} onClick={() => update(t, { checked_in_at: t.checked_in_at ? null : new Date().toISOString() })}>
              {t.checked_in_at ? '✓ Chegou' : 'Marcar que chegou'}
            </button>
          )}
          {t.status !== 'cancelado' && (
            <button type="button" className="bx-link bx-link--danger" onClick={async () => {
              if (await brandConfirm(t.status === 'pago' ? 'Cancelar este ingresso pago? O lugar volta a ficar livre. Devolver o dinheiro é por fora.' : 'Cancelar e liberar este lugar?', { confirmLabel: 'Cancelar ingresso' })) update(t, { status: 'cancelado' });
            }}>Cancelar</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bx">
      <button type="button" className="bx-link" onClick={onBack}>← Todos os brunches</button>
      <div className="bx-listing" style={{ marginTop: '1rem' }}>
        <div className="bx-listing__photo"><img src={event.cover_url || '/brunch/brunch-jardim.webp'} alt="" /></div>
        <div className="bx-listing__body">
          <h1 className="bx-listing__title">{event.title}</h1>
          <div className="bx-listing__meta"><span>🗓️ {fmtWhen(event)}</span><span>{v.emoji} {event.venue_name || v.label}</span><span>{event.price > 0 ? formatBRL(event.price) : 'Gratuito'}</span></div>
          <div className="bx-meter"><span style={{ width: `${Math.min(100, (paid.length / Math.max(1, event.capacity)) * 100)}%` }} /></div>
          <div className="bx-listing__meta">
            <span><strong>{paid.length}</strong> de {event.capacity} pagos</span>
            {holding.length > 0 && <span>⏳ {holding.length} esperando Pix</span>}
            {waiting.length > 0 && <span>📝 {waiting.length} na espera</span>}
            <span>💰 {formatBRL(revenue)}</span>
            {paid.some(t => t.checked_in_at) && <span>✓ {paid.filter(t => t.checked_in_at).length} chegaram</span>}
          </div>
          <label className="bx-field"><span>Situação</span>
            <select className="bx-input" value={event.status} onChange={e => setStatus(e.target.value as EventStatus)} disabled={busy === 'status'}>
              {EVENT_STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <div className="bx-listing__actions">
            <button type="button" className="bx-btn bx-btn--dark" onClick={onEdit}>✏️ Editar</button>
            <Link href={roomPath(event.slug)} className="bx-btn bx-btn--ghost" target="_blank">💬 Abrir a sala</Link>
            <Link href={eventPath(event.slug)} className="bx-btn bx-btn--ghost" target="_blank">👀 Ver a página</Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0 1rem', flexWrap: 'wrap' }}>
        {([['convidadas', `👯 Convidadas (${paid.length})`], ['grupo', '💬 Grupo e votação'], ['emails', '✉️ E-mails']] as const).map(([id, label]) => (
          <button key={id} type="button" className={`bx-btn ${tab === id ? 'bx-btn--dark' : 'bx-btn--ghost'}`} style={{ minHeight: 44 }} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'convidadas' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {holding.length + expired.length > 0 && (
            <section>
              <h2 className="bx-h2" style={{ marginTop: 0 }}>Esperando o Pix</h2>
              <p className="bx-sub" style={{ marginBottom: '0.75rem' }}>Viu o Pix cair? Aperte “Pix caiu”: ela recebe o e-mail com o grupo e o endereço. Reserva vencida já não segura o lugar.</p>
              <div style={{ display: 'grid', gap: '0.75rem' }}>{[...holding, ...expired].map(row)}</div>
            </section>
          )}
          <section>
            <h2 className="bx-h2" style={{ marginTop: 0 }}>Lugares garantidos</h2>
            {paid.length ? <div style={{ display: 'grid', gap: '0.75rem' }}>{paid.map(row)}</div> : <p className="bx-sub">Ninguém ainda. Anuncie na aba E-mails.</p>}
          </section>
          {waiting.length > 0 && (
            <section>
              <h2 className="bx-h2" style={{ marginTop: 0 }}>Lista de espera</h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>{waiting.map(row)}</div>
              <button type="button" className="bx-btn bx-btn--gold" style={{ marginTop: '0.75rem' }} disabled={busy === 'waitlist' || left === 0} onClick={() => sendEmail('waitlist')}>
                🎟️ {left === 0 ? 'Sem lugar livre ainda' : `Avisar a lista: abriu ${left === 1 ? '1 lugar' : `${left} lugares`}`}
              </button>
            </section>
          )}
          <section className="bx-card" style={{ display: 'grid', gap: '0.75rem' }}>
            <strong>➕ Pôr alguém na lista à mão</strong>
            <span className="bx-sub" style={{ margin: 0 }}>Pagou por fora, é parceira, convidada especial. Entra como paga e recebe o e-mail com o grupo.</span>
            <input className="bx-input" placeholder="Nome" value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} />
            <input className="bx-input" type="email" placeholder="E-mail" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} />
            <input className="bx-input" type="tel" placeholder="WhatsApp (opcional)" value={guest.whatsapp} onChange={e => setGuest({ ...guest, whatsapp: e.target.value })} />
            <button type="button" className="bx-btn bx-btn--dark" disabled={busy === 'guest'} onClick={() => run('guest', async () => { await adminPost({ action: 'addGuest', eventId: event.id, ...guest }); setGuest({ name: '', email: '', whatsapp: '' }); }, 'Pronto! Ela recebeu o e-mail com o grupo.')}>
              Pôr na lista
            </button>
          </section>
        </div>
      )}

      {tab === 'grupo' && (
        <div className="bn" style={{ background: 'transparent' }}>
          {room && me ? (
            <div className="bn-room-grid" style={{ marginTop: 0 }}>
              <div><BrunchChat room={room} myId={me} /></div>
              <div><BrunchVote room={room} myId={me} /></div>
            </div>
          ) : <p className="bx-sub">Carregando o grupo… (precisa da migration 41)</p>}
          <p className="bx-sub" style={{ marginTop: '0.75rem' }}>O que você escreve aqui aparece como Dolly, com a sua foto. Na votação, “✨ escolher” mostra para todo mundo o que você decidiu fazer.</p>
          <style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} />
        </div>
      )}

      {tab === 'emails' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <section className="bx-card" style={{ display: 'grid', gap: '0.6rem' }}>
            <strong>🥂 Anunciar este brunch para a lista</strong>
            <span className="bx-sub" style={{ margin: 0 }}>Vai para todo mundo da lista que não pediu para parar de receber os brunches. Cada pessoa recebe uma vez só, mesmo se você apertar de novo.</span>
            <button type="button" className="bx-btn bx-btn--gold" disabled={busy === 'announce' || event.status !== 'publicado'} onClick={() => sendEmail('announce')}>
              {event.status !== 'publicado' ? 'Publique o brunch primeiro' : 'Ver quantas pessoas e mandar'}
            </button>
          </section>
          <section className="bx-card" style={{ display: 'grid', gap: '0.6rem' }}>
            <strong>✍️ Recado para as convidadas ({paid.length})</strong>
            <span className="bx-sub" style={{ margin: 0 }}>Mudança de horário, o que levar, as fotos depois. Também dá para escrever no grupo.</span>
            <input className="bx-input" placeholder="Assunto" value={note.subject} onChange={e => setNote({ ...note, subject: e.target.value })} />
            <textarea className="bx-input" rows={5} placeholder="Seu recado" value={note.body} onChange={e => setNote({ ...note, body: e.target.value })} />
            <button type="button" className="bx-btn bx-btn--dark" disabled={busy === 'note' || paid.length === 0} onClick={() => sendEmail('note')}>Mandar o recado</button>
          </section>
          <p className="bx-sub">Lembrete antes do brunch, resumo diário do grupo, “obrigada + crédito” no dia seguinte e “últimos lugares” saem sozinhos quando estiverem ligados em Admin › E-mails › Automáticos.</p>
        </div>
      )}
    </div>
  );
}
