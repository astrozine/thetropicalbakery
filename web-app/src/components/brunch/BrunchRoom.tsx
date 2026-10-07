'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { supabase } from '@/lib/supabase';
import BrunchChat from './BrunchChat';
import BrunchVote from './BrunchVote';
import BrunchProfileEditor, { PersonCard } from './BrunchProfileEditor';
import { BRUNCH_CSS } from './brunchStyles';
import { HOST, calendarLink, eventPath, fmtWhen, normalizeEvent, venueKind, type BrunchProfile, type RoomData } from '@/lib/brunch';

type Tab = 'conversa' | 'votar' | 'pessoas' | 'cartao';

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return (
    <div className="bn-countdown" aria-label={`Faltam ${d} dias e ${h} horas`}>
      <div><b>{d}</b><span>{d === 1 ? 'dia' : 'dias'}</span></div>
      <div><b>{h}</b><span>horas</span></div>
      <div><b>{m}</b><span>min</span></div>
    </div>
  );
}

/**
 * /brunch/sala/<slug>: the private room of one brunch, for the people who paid and for the admins.
 * Everything comes from brunch_room() (migration 41), which returns NULL to anyone else.
 */
export default function BrunchRoom({ slug }: { slug: string }) {
  const { user, profile, loading } = useAuth();
  const [room, setRoom] = useState<RoomData | null | undefined>(undefined);
  const [mine, setMine] = useState<Partial<BrunchProfile> | null>(null);
  const [tab, setTab] = useState<Tab>('conversa');
  const [editing, setEditing] = useState(false);
  const lastReload = useRef(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: ev } = await supabase.from('brunch_events').select('id').eq('slug', slug).maybeSingle();
    if (!ev) { setRoom(null); return; }
    const [{ data }, { data: prof }] = await Promise.all([
      supabase.rpc('brunch_room', { p_event: ev.id }),
      supabase.from('brunch_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    if (!data) { setRoom(null); return; }
    const r = data as RoomData;
    setRoom({ ...r, event: { ...r.event, ...normalizeEvent(r.event as unknown as Record<string, unknown>) } });
    setMine(prof ?? null);
    // A first visit with an empty card: open the card first, it's what makes the room work.
    if (!prof && !r.is_admin) setEditing(true);
  }, [slug, user]);

  useEffect(() => { load(); }, [load]);

  const reloadSoon = useCallback(() => {
    if (Date.now() - lastReload.current < 30000) return;
    lastReload.current = Date.now();
    load();
  }, [load]);

  const css = <style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} />;

  if (loading || (user && room === undefined)) {
    return <main className="bn" style={{ minHeight: '70vh', padding: '6rem 16px' }}><p className="bn-muted bn-center">Abrindo a sala…</p>{css}</main>;
  }
  if (!user) {
    return (
      <main className="bn" style={{ minHeight: '70vh', padding: '3rem 16px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="bn-kicker">Sala do brunch</p>
          <h1 className="bn-h2">Entre para abrir a sua sala</h1>
          <p className="bn-lead">O grupo, o endereço e os cartões das outras convidadas ficam na sua conta. Use o mesmo e-mail da compra.</p>
          <LoginPanel message="Entrar na minha conta" subMessage="Com o Google é um toque." />
        </div>
        {css}
      </main>
    );
  }
  if (!room) {
    return (
      <main className="bn" style={{ minHeight: '70vh', padding: '4rem 16px' }}>
        <div className="bn-empty" style={{ maxWidth: 560, margin: '0 auto' }}>
          <p className="bn-empty__icon">🔒</p>
          <h1 className="bn-h3">Esta sala é de quem garantiu o lugar</h1>
          <p className="bn-muted">Se você já pagou, pode ser que o pagamento ainda não tenha confirmado (no Pix a Dolly confirma à mão), ou que você tenha entrado com outro e-mail.</p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link href={eventPath(slug)} className="bn-btn bn-btn--gold">Ver o brunch</Link>
            <Link href="/minha-conta" className="bn-btn bn-btn--ghost">Minha Conta</Link>
          </div>
        </div>
        {css}
      </main>
    );
  }

  const e = room.event;
  const v = venueKind(e.venue_kind);
  const past = new Date(e.starts_at).getTime() < Date.now();
  const me = room.members.find(m => m.is_me);
  const others = room.members.filter(m => !m.is_me);
  const fallbackName = (profile?.full_name || '').split(' ')[0];

  const cardBlock = editing ? (
    <BrunchProfileEditor
      userId={user.id}
      initial={mine}
      fallbackName={me?.first_name || fallbackName}
      onSaved={() => { load(); setEditing(false); }}
      onCancel={mine ? () => setEditing(false) : undefined}
    />
  ) : (
    <div style={{ display: 'grid', gap: '0.6rem' }}>
      {me ? <PersonCard p={{ ...me, ...(mine || {}), is_me: true }} />
        : <PersonCard p={{ ...(mine || {}), first_name: fallbackName, is_me: true }} host={room.is_admin} />}
      <button type="button" className="bn-btn bn-btn--ghost" onClick={() => setEditing(true)}>✏️ Editar meu cartão</button>
    </div>
  );

  return (
    <main className="bn" style={{ paddingBottom: '4rem' }}>
      <section className="bn-room-top">
        <div className="bn-wrap">
          <Link href="/minha-conta" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>← Minha Conta</Link>
          {room.is_admin && <span className="bn-chip bn-chip--gold" style={{ marginLeft: '0.6rem' }}>Você está como anfitriã</span>}
          <h1>{e.title}</h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>🗓️ {fmtWhen(e)}</p>
          <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.85)' }}>
            {v.emoji} {e.venue_name || v.label}{e.address ? ` · ${e.address}` : ''}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
            {e.maps_url && <a className="bn-btn bn-btn--light" style={{ minHeight: 44, padding: '0.5rem 1rem' }} href={e.maps_url} target="_blank" rel="noopener noreferrer">📍 Como chegar</a>}
            {!past && <a className="bn-btn bn-btn--light" style={{ minHeight: 44, padding: '0.5rem 1rem' }} href={calendarLink(e)} target="_blank" rel="noopener noreferrer">📅 Pôr na agenda</a>}
          </div>
          {e.arrival_notes && <p style={{ margin: '0.9rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.92rem', lineHeight: 1.6 }}>ℹ️ {e.arrival_notes}</p>}
          {!past && <Countdown to={e.starts_at} />}
        </div>
      </section>

      <div className="bn-wrap">
        <div className="bn-room-tabs" role="tablist">
          {([['conversa', '💬 Conversa'], ['votar', '🗳️ Votação'], ['pessoas', `👯 Quem vai (${room.members.length})`], ['cartao', '🪪 Meu cartão']] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={`bn-room-tab${tab === id ? ' is-on' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <div className="bn-room-grid" style={{ marginTop: '1rem' }}>
          <div hidden={tab !== 'conversa'}>
            <BrunchChat room={room} myId={user.id} onUnknownAuthor={reloadSoon} />
          </div>

          <div style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }} hidden={tab === 'conversa'}>
            {/* On a phone one tab at a time; from 980px all of these sit in the right column (tab stays 'conversa'). */}
            <div hidden={tab === 'pessoas' || tab === 'cartao'}><BrunchVote room={room} myId={user.id} /></div>
            <div hidden={tab === 'pessoas' || tab === 'votar'}>{cardBlock}</div>
            <div hidden={tab === 'cartao' || tab === 'votar'}>
              <p className="bn-kicker">Quem vai</p>
              <div className="bn-people">
                <PersonCard p={{ display_name: 'Dolly', photo_url: HOST.photo, headline: HOST.role, bio: 'Sua anfitriã. Chama aqui no grupo para qualquer coisa.' }} host />
                {others.map(m => <PersonCard key={m.ticket_id} p={m} />)}
              </div>
              {others.length === 0 && <p className="bn-muted" style={{ marginTop: '0.75rem' }}>Você é das primeiras! Os cartões das outras convidadas aparecem aqui conforme elas garantem o lugar.</p>}
            </div>
          </div>
        </div>
      </div>
      {css}
    </main>
  );
}
