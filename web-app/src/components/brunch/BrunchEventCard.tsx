'use client';

import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import {
  eventPath, fmtShort, fmtTime, membersOnlyNow, normalizeEvent, seatsLeft, venueKind,
  type Availability, type BrunchEvent,
} from '@/lib/brunch';

export const DEFAULT_COVER = '/brunch/brunch-jardim.webp';

/**
 * Published brunches and their seat counts. `missing` = migration 41 has not run, so the pages show
 * "em breve" instead of an error.
 */
export async function loadBrunches(): Promise<{ events: BrunchEvent[]; avail: Record<string, Availability>; missing: boolean }> {
  const [{ data, error }, { data: av }] = await Promise.all([
    supabase.from('brunch_events').select('*').in('status', ['publicado', 'encerrado']).order('starts_at', { ascending: true }),
    supabase.rpc('brunch_availability'),
  ]);
  const avail: Record<string, Availability> = {};
  for (const a of (av || []) as Availability[]) avail[a.event_id] = a;
  return {
    events: ((data || []) as Record<string, unknown>[]).map(normalizeEvent),
    avail,
    missing: !!error && /brunch_events|does not exist|schema cache/i.test(error.message),
  };
}

/** "Restam 4 de 12" with a bar, or a dot per seat for small brunches (scarcity you can see). */
export function SeatMeter({ event, avail, dark }: { event: BrunchEvent; avail?: Availability | null; dark?: boolean }) {
  const left = seatsLeft(event, avail);
  const taken = event.capacity - left;
  const hot = left > 0 && left <= Math.max(2, Math.round(event.capacity * 0.25));
  const label = left === 0 ? 'Lotado · entre na lista de espera' : left === 1 ? 'Último lugar!' : `Restam ${left} de ${event.capacity} lugares`;
  return (
    <div className="bn-seats" aria-label={label}>
      {event.capacity <= 20 ? (
        <div className="bn-seat-dots" aria-hidden>
          {Array.from({ length: event.capacity }, (_, i) => <i key={i} className={i < taken ? 'on' : ''} />)}
        </div>
      ) : (
        <div className="bn-seats__bar" aria-hidden><span style={{ width: `${Math.min(100, (taken / Math.max(1, event.capacity)) * 100)}%` }} /></div>
      )}
      <span className={`bn-seats__txt${hot || left === 0 ? ' bn-seats__txt--hot' : ''}`} style={dark ? { color: hot ? '#ffb4bf' : '#fff' } : undefined}>
        {hot && left > 0 ? '🔥 ' : ''}{label}
      </span>
    </div>
  );
}

export default function BrunchEventCard({ event, avail }: { event: BrunchEvent; avail?: Availability | null }) {
  const d = fmtShort(event.starts_at);
  const v = venueKind(event.venue_kind);
  const past = new Date(event.starts_at).getTime() < Date.now();
  return (
    <Link href={eventPath(event.slug)} className="bn-event">
      <div className="bn-event__photo">
        <img src={event.cover_url || DEFAULT_COVER} alt="" loading="lazy" />
        <div className="bn-date"><b>{d.day}</b><span>{d.month}</span></div>
        <div className="bn-event__tag">
          {past ? <span className="bn-chip">Aconteceu</span>
            : membersOnlyNow(event) ? <span className="bn-chip bn-chip--gold">⏰ Pré-venda do Círculo</span>
            : <span className="bn-chip">{v.emoji} {v.label}</span>}
        </div>
      </div>
      <div className="bn-event__body">
        <h3 className="bn-event__title">{event.title}</h3>
        <div className="bn-event__meta">
          <span>🗓️ {d.weekday}, {fmtTime(event.starts_at)}</span>
          <span>📍 {event.venue_name || v.label}</span>
        </div>
        {event.theme && <p className="bn-muted">{event.theme}</p>}
        {!past && <SeatMeter event={event} avail={avail} />}
        <div className="bn-event__foot">
          <span className="bn-price">{event.price > 0 ? formatBRL(event.price) : 'Gratuito'}</span>
          <span className="bn-btn bn-btn--dark" style={{ minHeight: 44, padding: '0.55rem 1.1rem' }}>{past ? 'Ver como foi' : 'Ver e garantir'}</span>
        </div>
      </div>
    </Link>
  );
}
