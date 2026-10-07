'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import BrunchBuy from './BrunchBuy';
import { DEFAULT_COVER } from './BrunchEventCard';
import { BRUNCH_CSS } from './brunchStyles';
import {
  CIRCLE_PERKS, DEFAULT_INCLUDES, HOST, SPONSOR_KINDS, fmtWhen, normalizeEvent, seatsLeft, venueKind,
  type Availability, type BrunchEvent,
} from '@/lib/brunch';

export default function BrunchEventView({ slug }: { slug: string }) {
  const [event, setEvent] = useState<BrunchEvent | null | undefined>(undefined);
  const [avail, setAvail] = useState<Availability | null>(null);

  const load = useCallback(async () => {
    const [{ data }, { data: av }] = await Promise.all([
      supabase.from('brunch_events').select('*').eq('slug', slug).maybeSingle(),
      supabase.rpc('brunch_availability'),
    ]);
    const e = data ? normalizeEvent(data) : null;
    setEvent(e);
    if (e) setAvail(((av || []) as Availability[]).find(a => a.event_id === e.id) ?? null);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (event === undefined) {
    return <main className="bn" style={{ minHeight: '70vh', padding: '6rem 16px' }}><p className="bn-muted bn-center">Carregando…</p><style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} /></main>;
  }
  if (!event) {
    return (
      <main className="bn" style={{ minHeight: '70vh', padding: '6rem 16px' }}>
        <div className="bn-empty" style={{ maxWidth: 520, margin: '0 auto' }}>
          <p className="bn-empty__icon">🥂</p>
          <h1 className="bn-h3">Não achamos este brunch</h1>
          <p className="bn-muted">Ele pode ter mudado de nome. Veja a agenda.</p>
          <Link href="/brunch" className="bn-btn bn-btn--gold" style={{ marginTop: '1rem' }}>Ver a agenda</Link>
        </div>
        <style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} />
      </main>
    );
  }

  const v = venueKind(event.venue_kind);
  const includes = event.includes.length ? event.includes : DEFAULT_INCLUDES;
  const left = seatsLeft(event, avail);
  const past = new Date(event.starts_at).getTime() < Date.now();
  const taken = event.capacity - left;
  const hosts = event.sponsors.filter(s => s.kind === 'anfitriao');
  const others = event.sponsors.filter(s => s.kind !== 'anfitriao');

  return (
    <main className="bn">
      <section className="bn-ev-hero">
        <div className="bn-hero__bg" style={{ backgroundImage: `url(${event.cover_url || DEFAULT_COVER})` }} />
        <div className="bn-hero__shade" />
        <div className="bn-wrap bn-ev-hero__grid">
          <div>
            <Link href="/brunch" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>← Todos os brunches</Link>
            <p className="bn-hero__eyebrow" style={{ marginTop: '1rem', marginBottom: 0 }}>Brunch Tropical</p>
            <h1 className="bn-ev-hero__title">{event.title}</h1>
            {(event.subtitle || event.theme) && <p className="bn-ev-hero__sub">{event.subtitle || event.theme}</p>}
            <div className="bn-ev-facts">
              <span className="bn-chip">🗓️ {fmtWhen(event)}</span>
              <span className="bn-chip">{v.emoji} {event.venue_name || v.label}</span>
              {event.city && <span className="bn-chip">📍 {event.city}</span>}
              {!past && <span className="bn-chip">🎟️ {left > 0 ? `${left} de ${event.capacity} lugares` : 'Lotado'}</span>}
            </div>
            {!past && left > 0 && <a href="#garantir" className="bn-btn bn-btn--gold" style={{ marginTop: '1.25rem' }}>Garantir meu lugar</a>}
          </div>
          <div className="bn-ev-cover"><img src={event.cover_url || DEFAULT_COVER} alt="" /></div>
        </div>
      </section>

      <div className="bn-wrap bn-section">
        <div className="bn-ev-layout">
          <div>
            {(event.theme || event.description) && (
              <section className="bn-block">
                <p className="bn-kicker">A conversa</p>
                {event.theme && <h2 className="bn-h2">{event.theme}</h2>}
                {event.description && event.description.split(/\n\s*\n/).map((p, i) => <p key={i} className="bn-lead" style={{ marginBottom: '1rem' }}>{p}</p>)}
              </section>
            )}

            <section className="bn-block">
              <p className="bn-kicker">No seu ingresso</p>
              <h2 className="bn-h2">Tudo o que vem junto</h2>
              <ul className="bn-stack">
                {includes.map(i => <li key={i}>{i}</li>)}
                <li><strong>Você ajuda a montar o brunch:</strong> vota nos doces da mesa e nos temas da conversa, e vê a votação andar ao vivo.</li>
                <li><strong>A entrada no Círculo Tropical</strong>, com as vantagens lá embaixo.</li>
              </ul>
            </section>

            {event.extras.length > 0 && (
              <section className="bn-block">
                <p className="bn-kicker">E mais</p>
                <div className="bn-who">{event.extras.map(x => <span key={x} className="bn-chip bn-chip--gold">{x}</span>)}</div>
              </section>
            )}

            <section className="bn-block">
              <p className="bn-kicker">Onde</p>
              <div className="bn-card bn-venue-card">
                {event.venue_photo && <img src={event.venue_photo} alt={event.venue_name || v.label} />}
                <div>
                  <h3 className="bn-h3">{v.emoji} {event.venue_name || v.label}</h3>
                  <p className="bn-muted" style={{ marginBottom: '0.5rem' }}>{event.venue_blurb || v.blurb}</p>
                  {event.venue_url && <p><a href={event.venue_url} target="_blank" rel="noopener noreferrer" style={{ color: '#a6832b', fontWeight: 700 }}>Conhecer o lugar ↗</a></p>}
                  <p className="bn-help">🔒 O endereço exato e como chegar aparecem na sua sala assim que o pagamento é confirmado.</p>
                </div>
              </div>
            </section>

            {(hosts.length > 0 || others.length > 0) && (
              <section className="bn-block">
                <p className="bn-kicker">Quem faz junto</p>
                <div className="bn-sponsors">
                  {[...hosts, ...others].map(s => {
                    const Tag = s.url ? 'a' : 'div';
                    return (
                      <Tag key={s.name} className="bn-sponsor" {...(s.url ? { href: s.url, target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {s.logo_url ? <img src={s.logo_url} alt="" /> : <span className="bn-ava" style={{ width: 46, height: 46, borderRadius: 10 }}>✨</span>}
                        <span><b>{s.name}</b><small>{SPONSOR_KINDS.find(k => k.id === s.kind)?.label}{s.blurb ? ` · ${s.blurb}` : ''}</small></span>
                      </Tag>
                    );
                  })}
                </div>
              </section>
            )}

            {event.gallery.length > 0 && (
              <section className="bn-block">
                <p className="bn-kicker">Fotos</p>
                <div className="bn-gallery">{event.gallery.map(src => <img key={src} src={src} alt="" loading="lazy" />)}</div>
              </section>
            )}

            <section className="bn-block">
              <p className="bn-kicker">Quem recebe</p>
              <div className="bn-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span className="bn-ava" style={{ width: 72, height: 72 }}><img src={HOST.photo} alt="Dolly" /></span>
                <div>
                  <h3 className="bn-h3">Dolly Van Dam</h3>
                  <p className="bn-muted">Chef e fundadora da The Tropical Bakery. Ela apresenta cada pessoa, puxa a conversa e fica com vocês no grupo depois.</p>
                </div>
              </div>
              {taken > 0 && !past && <p className="bn-muted" style={{ marginTop: '0.75rem' }}>✨ {taken === 1 ? '1 pessoa já garantiu o lugar.' : `${taken} pessoas já garantiram o lugar.`}</p>}
            </section>

            <section className="bn-block">
              <p className="bn-kicker">Círculo Tropical</p>
              <h2 className="bn-h2">Quem vem a um brunch, ganha</h2>
              <div className="bn-perks">
                {CIRCLE_PERKS.map(p => (
                  <div key={p.title} className="bn-perk">
                    <div className="bn-perk__icon" aria-hidden>{p.emoji}</div>
                    <div><b>{p.title}</b><p>{p.text}</p></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <BrunchBuy event={event} avail={avail} onChange={load} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} />
    </main>
  );
}
