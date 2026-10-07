'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { fmtWhen, normalizeEvent, venueKind, type BrunchEvent, type BrunchProfile } from '@/lib/brunch';
import BrunchEditor, { type PrivateInfo } from './BrunchEditor';
import BrunchDetail, { type Ticket } from './BrunchDetail';
import '../caixas/caixas.css';

type View = { kind: 'home' } | { kind: 'edit'; event: BrunchEvent | null; priv: PrivateInfo | null } | { kind: 'detail'; id: string };

/**
 * /admin/brunch: Dolly's brunches. Photo cards for what's coming, a step-by-step flow to create one, a page per
 * brunch to manage the guests, the group and the e-mails, and "O Círculo": everyone who has ever come, as a list
 * she can work from. Schema: migration_41_brunch.sql.
 */
export default function AdminBrunchPage() {
  const [events, setEvents] = useState<BrunchEvent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<BrunchProfile[]>([]);
  const [missing, setMissing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>({ kind: 'home' });
  const [tab, setTab] = useState<'agenda' | 'circulo'>('agenda');

  const load = useCallback(async () => {
    const [{ data: ev, error }, { data: t }, { data: p }] = await Promise.all([
      supabase.from('brunch_events').select('*').order('starts_at', { ascending: true }),
      supabase.from('brunch_tickets').select('*'),
      supabase.from('brunch_profiles').select('*'),
    ]);
    setMissing(!!error);
    setEvents(((ev || []) as Record<string, unknown>[]).map(normalizeEvent));
    setTickets((t || []) as Ticket[]);
    setProfiles((p || []) as BrunchProfile[]);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const edit = async (e: BrunchEvent | null) => {
    let priv: PrivateInfo | null = null;
    if (e) {
      const { data } = await supabase.from('brunch_event_private').select('*').eq('event_id', e.id).maybeSingle();
      if (data) priv = { address: data.address ?? '', maps_url: data.maps_url ?? '', arrival_notes: data.arrival_notes ?? '' };
    }
    setView({ kind: 'edit', event: e, priv });
  };

  // Everyone who has paid for a brunch, as one person each.
  const circle = useMemo(() => {
    const byEmail = new Map<string, { name: string; email: string; whatsapp: string | null; user_id: string | null; count: number; spent: number; last: string; creditOpen: number; popups: number }>();
    const eventOf = new Map(events.map(e => [e.id, e]));
    for (const t of tickets.filter(x => x.status === 'pago')) {
      const k = t.email.toLowerCase();
      const ev = eventOf.get(t.event_id);
      const cur = byEmail.get(k) ?? { name: t.full_name || k, email: k, whatsapp: t.whatsapp, user_id: t.user_id, count: 0, spent: 0, last: '', creditOpen: 0, popups: 0 };
      cur.count += 1;
      cur.spent += Number(t.price || 0);
      if (ev && ev.starts_at > cur.last) cur.last = ev.starts_at;
      if (t.credit_claimed_at && !t.credit_applied_at) cur.creditOpen += Number(t.price || 0);
      if (t.popup_request) cur.popups += 1;
      cur.user_id = cur.user_id || t.user_id;
      cur.whatsapp = cur.whatsapp || t.whatsapp;
      byEmail.set(k, cur);
    }
    return [...byEmail.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last));
  }, [tickets, events]);

  if (view.kind === 'edit') {
    return <BrunchEditor initial={view.event} privateInfo={view.priv} onDone={id => { load(); setView(id ? { kind: 'detail', id } : { kind: 'home' }); }} />;
  }
  if (view.kind === 'detail') {
    const e = events.find(x => x.id === view.id);
    if (e) return <BrunchDetail key={e.id} event={e} onBack={() => { load(); setView({ kind: 'home' }); }} onEdit={() => edit(e)} />;
  }

  const now = Date.now();
  const upcoming = events.filter(e => new Date(e.starts_at).getTime() >= now && e.status !== 'cancelado');
  const pastOrOther = events.filter(e => !upcoming.includes(e)).reverse();
  const stats = (id: string) => {
    const t = tickets.filter(x => x.event_id === id);
    return {
      paid: t.filter(x => x.status === 'pago').length,
      waitingPix: t.filter(x => x.status === 'reservado' && x.hold_until && new Date(x.hold_until).getTime() > now).length,
      waitlist: t.filter(x => x.status === 'espera').length,
    };
  };
  const profileOf = (uid: string | null) => profiles.find(p => p.user_id === uid);
  const openCredits = tickets.filter(t => t.credit_claimed_at && !t.credit_applied_at);

  return (
    <div className="bx">
      <div className="bx-head">
        <div>
          <h1 className="bx-h1">🥂 Brunch Tropical</h1>
          <p className="bx-sub">Os brunches da Dolly e o Círculo: quem veio, quem vem, o grupo de cada um.</p>
        </div>
        <button type="button" className="bx-btn bx-btn--gold" onClick={() => edit(null)} disabled={missing}>+ Novo brunch</button>
      </div>

      {missing && (
        <div className="bx-banner" style={{ background: '#fff4e5', border: '1px solid #f0c98a', color: '#7a4a00' }}>
          <span>Falta rodar a <strong>migration_41_brunch.sql</strong> no Supabase. Depois disso esta página liga sozinha.</span>
        </div>
      )}
      {openCredits.length > 0 && (
        <div className="bx-banner" style={{ background: '#eef6ff', border: '1px solid #c5dcf5', color: '#1a4a7a' }}>
          <span>💌 {openCredits.length === 1 ? '1 pessoa pediu' : `${openCredits.length} pessoas pediram`} o crédito do brunch na assinatura anual. Veja em cada brunch, em Convidadas.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button type="button" className={`bx-btn ${tab === 'agenda' ? 'bx-btn--dark' : 'bx-btn--ghost'}`} onClick={() => setTab('agenda')}>🗓️ Agenda</button>
        <button type="button" className={`bx-btn ${tab === 'circulo' ? 'bx-btn--dark' : 'bx-btn--ghost'}`} onClick={() => setTab('circulo')}>👯 O Círculo ({circle.length})</button>
      </div>

      {tab === 'agenda' && (
        <>
          {!loaded ? <p className="bx-sub">Carregando…</p> : upcoming.length === 0 ? (
            <div className="bx-empty">
              <p className="bx-empty__icon">🥂</p>
              <h2 style={{ margin: '0 0 0.4rem' }}>Nenhum brunch marcado</h2>
              <p className="bx-sub" style={{ marginBottom: '1rem' }}>Crie o primeiro: tema, lugar, data e quantos lugares. Leva uns 3 minutos.</p>
              <button type="button" className="bx-btn bx-btn--gold" onClick={() => edit(null)} disabled={missing}>+ Criar um brunch</button>
            </div>
          ) : (
            <div className="bx-live">
              {upcoming.map(e => {
                const s = stats(e.id);
                const v = venueKind(e.venue_kind);
                return (
                  <article key={e.id} className="bx-listing">
                    <div className="bx-listing__photo">
                      <img src={e.cover_url || '/brunch/brunch-jardim.webp'} alt="" />
                      <span className="bx-listing__badge">{e.status === 'publicado' ? '🟢 No site' : e.status === 'rascunho' ? '📝 Rascunho' : e.status}</span>
                    </div>
                    <div className="bx-listing__body">
                      <h2 className="bx-listing__title">{e.title}</h2>
                      <div className="bx-listing__meta"><span>🗓️ {fmtWhen(e)}</span><span>{v.emoji} {e.venue_name || v.label}</span><span>{e.price > 0 ? formatBRL(e.price) : 'Gratuito'}</span></div>
                      <div className="bx-meter"><span style={{ width: `${Math.min(100, (s.paid / Math.max(1, e.capacity)) * 100)}%` }} /></div>
                      <div className="bx-listing__meta">
                        <span><strong>{s.paid}</strong> de {e.capacity} lugares pagos</span>
                        {s.waitingPix > 0 && <span>⏳ {s.waitingPix} esperando Pix</span>}
                        {s.waitlist > 0 && <span>📝 {s.waitlist} na espera</span>}
                      </div>
                      <div className="bx-listing__actions">
                        <button type="button" className="bx-btn bx-btn--dark" onClick={() => setView({ kind: 'detail', id: e.id })}>👯 Convidadas e grupo</button>
                        <button type="button" className="bx-btn bx-btn--ghost" onClick={() => edit(e)}>✏️ Editar</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pastOrOther.length > 0 && (
            <>
              <h2 className="bx-h2">Anteriores e cancelados</h2>
              <div className="bx-grid">
                {pastOrOther.map(e => {
                  const s = stats(e.id);
                  return (
                    <div key={e.id} className="bx-tile">
                      <button type="button" className="bx-tile__photo" style={{ border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setView({ kind: 'detail', id: e.id })}>
                        <img src={e.cover_url || '/brunch/brunch-jardim.webp'} alt="" />
                      </button>
                      <p className="bx-tile__title">{e.title}</p>
                      <p className="bx-tile__meta">{new Date(e.starts_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' })} · {s.paid} convidadas · {e.status}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'circulo' && (
        circle.length === 0 ? (
          <div className="bx-empty"><p className="bx-empty__icon">👯</p><p className="bx-sub">Quem pagar um brunch aparece aqui, com quantas vezes veio e o cartão que montou.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
            {circle.map(c => {
              const p = profileOf(c.user_id);
              return (
                <div key={c.email} className="bx-card" style={{ display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr)', gap: '0.8rem', alignItems: 'start' }}>
                  <span style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: '#fdf1d6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                    {p?.photo_url ? <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p?.emoji || '🌺')}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ overflowWrap: 'anywhere' }}>{p?.display_name || c.name} {p?.emoji && p.photo_url ? p.emoji : ''}</strong>
                    {p?.headline && <div style={{ color: '#a6832b', fontWeight: 700, fontSize: '0.88rem' }}>{p.headline}</div>}
                    <div className="bx-sub" style={{ margin: '0.25rem 0', fontSize: '0.88rem' }}>
                      {c.count === 1 ? '1 brunch' : `${c.count} brunches`} · {formatBRL(c.spent)}{c.last ? ` · último ${new Date(c.last).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' })}` : ''}
                    </div>
                    {p?.offers && <div style={{ fontSize: '0.85rem' }}>🤲 {p.offers}</div>}
                    {p?.seeks && <div style={{ fontSize: '0.85rem' }}>🔎 {p.seeks}</div>}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {c.count >= 3 && <span className="bx-chip" style={{ background: '#fdf1d6', color: '#7a5a10' }}>⭐ Fiel</span>}
                      {c.creditOpen > 0 && <span className="bx-chip" style={{ background: '#eef6ff', color: '#1a4a7a' }}>💌 crédito {formatBRL(c.creditOpen)}</span>}
                      {c.popups > 0 && <span className="bx-chip" style={{ background: '#fdecf1', color: '#9b2c4e' }}>🛍️ pop-up</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.88rem' }}>
                      <a href={`mailto:${c.email}`} style={{ color: '#222' }}>{c.email}</a>
                      {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1e8a4c', fontWeight: 700 }}>WhatsApp</a>}
                      {p?.instagram && <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer" style={{ color: '#a6832b' }}>@{p.instagram}</a>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
