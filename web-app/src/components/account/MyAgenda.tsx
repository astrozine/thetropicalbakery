'use client';

import React from 'react';
import Link from 'next/link';
import { formatBRL } from '@/lib/deliveryZones';
import {
  Agenda, DOLLY_OFFERS, EVENT_STAGE, PARTNER_STATUS, REQUEST_STAGE, RESTOCK_STATUS, TONE, Tone,
} from '@/lib/agenda';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** Today in Brasília as YYYY-MM-DD, so "upcoming" doesn't flip at 21h. */
export function todayBR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

const parseDay = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`);
const dayMonth = (d: string) => parseDay(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
const longDay = (d: string) => parseDay(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

export interface AgendaItem {
  key: string;
  /** YYYY-MM-DD when it happens, if known. */
  date: string | null;
  created: string;
  emoji: string;
  kind: string;
  title: string;
  sub?: string;
  pill: { label: string; tone: Tone };
  action?: { label: string; href: string };
  /** Something the customer has to do (pay a proposal or an order). */
  needsYou?: boolean;
}

/** Turns my_agenda() into one list: what needs them first, then by date, then the undated. */
export function agendaItems(a: Agenda | null): AgendaItem[] {
  if (!a) return [];
  const today = todayBR();
  const items: AgendaItem[] = [];
  const proposals = a.proposals ?? [];

  for (const p of proposals) {
    const expired = !p.paid && !!p.expires_on && p.expires_on < today;
    items.push({
      key: `p-${p.id}`,
      date: null,
      created: p.created_at,
      emoji: p.kind === 'retiro' ? '🌿' : '👩‍🍳',
      kind: p.kind === 'retiro' ? 'Retiro · proposta' : 'Aula · proposta',
      title: p.title,
      sub: [p.dates_label, formatBRL(Number(p.price))].filter(Boolean).join(' · '),
      pill: p.paid ? { label: 'Pago', tone: 'ok' } : expired ? { label: 'Expirou', tone: 'quiet' } : { label: 'Aguardando pagamento', tone: 'wait' },
      action: { label: p.paid || expired ? 'Ver detalhes' : 'Ver e pagar', href: `/proposta/${p.id}` },
      needsYou: !p.paid && !expired,
    });
  }

  for (const r of a.retreats ?? []) {
    if (r.check_out < today) continue;
    const nights = Math.round((parseDay(r.check_out).getTime() - parseDay(r.check_in).getTime()) / 86400000);
    items.push({
      key: `b-${r.id}`,
      date: r.check_in,
      created: r.check_in,
      emoji: '🌿',
      kind: 'Retiro',
      title: r.room ? `Retiro · ${r.room}` : 'Retiro em Itamambuca',
      sub: `${dayMonth(r.check_in)} a ${dayMonth(r.check_out)} · ${nights} ${nights === 1 ? 'noite' : 'noites'} · ${r.guests} ${r.guests === 1 ? 'pessoa' : 'pessoas'}`,
      pill: r.status === 'confirmado' ? { label: 'Confirmado', tone: 'ok' } : { label: 'Datas reservadas', tone: 'wait' },
    });
  }

  for (const r of a.requests ?? []) {
    if (r.stage === 'resolved') continue;
    // Once Dolly has sent a proposal for it, the proposal is what counts.
    if (proposals.some(p => p.kind === r.kind && p.created_at >= r.created_at)) continue;
    if (r.date && r.date < today) continue;
    const course = r.kind !== 'retiro';
    const stage = REQUEST_STAGE[r.stage] ?? REQUEST_STAGE.new;
    items.push({
      key: `r-${r.id}`,
      date: r.date,
      created: r.created_at,
      emoji: course ? '👩‍🍳' : '🌿',
      kind: course ? 'Aula' : 'Retiro',
      title: r.interest || (course ? 'Aula com a Dolly' : 'Retiro em Itamambuca'),
      sub: [
        r.date ? longDay(r.date) : course ? 'Data a combinar' : '',
        course ? '14h às 17h' : '',
        r.group_size ? `${r.group_size} ${r.group_size === 1 ? 'pessoa' : 'pessoas'}` : '',
      ].filter(Boolean).join(' · '),
      pill: stage,
    });
  }

  for (const e of a.events ?? []) {
    if (e.stage === 'done' || e.stage === 'cancelled') continue;
    if (e.requested_date && e.requested_date < today) continue;
    const stage = EVENT_STAGE[e.stage] ?? EVENT_STAGE.awaiting_payment;
    items.push({
      key: `e-${e.id}`,
      date: e.kind === 'quote' ? null : e.requested_date,
      created: e.created_at,
      emoji: '🎉',
      kind: e.kind === 'quote' ? 'Orçamento de evento' : 'Menu de eventos',
      title: e.items_summary || (e.kind === 'quote' ? 'Pedido de orçamento' : 'Pedido do menu de eventos'),
      sub: [e.requested_date ? longDay(e.requested_date) : '', e.total_price ? formatBRL(Number(e.total_price)) : ''].filter(Boolean).join(' · '),
      pill: stage,
      needsYou: e.stage === 'awaiting_payment',
    });
  }

  return items.sort((x, y) => {
    if (!!x.needsYou !== !!y.needsYou) return x.needsYou ? -1 : 1;
    if (x.date && y.date) return x.date.localeCompare(y.date);
    if (x.date || y.date) return x.date ? -1 : 1;
    return y.created.localeCompare(x.created);
  });
}

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return <span className="acct-pill" style={{ background: TONE[tone].bg, color: TONE[tone].color }}>{label}</span>;
}

function Row({ it }: { it: AgendaItem }) {
  const d = it.date ? parseDay(it.date) : null;
  return (
    <li className={`ag-row${it.needsYou ? ' is-you' : ''}`}>
      <div className="ag-when" aria-hidden>
        {d ? (<><span>{MONTHS[d.getMonth()]}</span><strong>{d.getDate()}</strong></>) : <em>{it.emoji}</em>}
      </div>
      <div className="ag-body">
        <p className="ag-kind">{it.kind}</p>
        <p className="ag-title">{it.title}</p>
        {it.sub && <p className="ag-sub">{it.sub}</p>}
        <div className="ag-meta">
          <Pill {...it.pill} />
          {it.action && <Link href={it.action.href} className="ag-link">{it.action.label} →</Link>}
        </div>
      </div>
    </li>
  );
}

/** The partnership, for a business Dolly delivers to. */
function PartnerCard({ p }: { p: NonNullable<Agenda['partner']> }) {
  const st = PARTNER_STATUS[p.status] ?? PARTNER_STATUS.pendente;
  const last = p.restocks[0];
  return (
    <section className="ag-partner" aria-label="Sua parceria">
      <div className="ag-partner-head">
        <div>
          <p className="ag-kind">🤝 Sua parceria</p>
          <h3 className="acct-h3">{p.business_name}</h3>
        </div>
        <Pill {...st} />
      </div>
      {p.portal_message && <p className="ag-note">“{p.portal_message}” <span>— Dolly</span></p>}
      {last && (
        <p className="ag-sub">
          Último pedido: {last.items}
          {last.wanted_date ? ` · para ${dayMonth(last.wanted_date)}` : ''}
          {RESTOCK_STATUS[last.status] ? ` · ${RESTOCK_STATUS[last.status]}` : ''}
        </p>
      )}
      <Link href="/parceiro" className="acct-btn acct-btn-dark ag-partner-btn">
        {p.status === 'ativo' ? 'Pedir reposição no portal' : 'Abrir o portal do parceiro'}
      </Link>
    </section>
  );
}

interface Props {
  agenda: Agenda | null;
  items: AgendaItem[];
  /** Live things rendered by their own components (brunch tickets, box pickups, subscription). */
  live?: React.ReactNode;
  hasLive?: boolean;
}

/** Início: everything the customer has with Dolly, then the rest of what she offers. */
export default function MyAgenda({ agenda, items, live, hasLive }: Props) {
  const partner = agenda?.partner ?? null;
  const empty = items.length === 0 && !partner && !hasLive;
  const have = new Set<string>();
  items.forEach(i => {
    if (i.kind.startsWith('Aula')) have.add('curso');
    if (i.kind.startsWith('Retiro')) have.add('retiro');
    if (i.emoji === '🎉') have.add('eventos');
  });
  if (partner) have.add('parceria');
  const offers = DOLLY_OFFERS.filter(o => !have.has(o.id));

  return (
    <div className="ag">
      <section id="acct-live" aria-label="Sua agenda com a Dolly">
        <h2 className="acct-h2 ag-h">Sua agenda</h2>
        {partner && <PartnerCard p={partner} />}
        {live}
        {items.length > 0 && <ul className="ag-list">{items.map(it => <Row key={it.key} it={it} />)}</ul>}
        {empty && (
          <div className="ag-empty">
            <p>Nada marcado ainda. Quando você agendar uma aula, um retiro ou fizer um pedido, ele aparece aqui.</p>
          </div>
        )}
      </section>

      {offers.length > 0 && (
        <section aria-label="O que a Dolly oferece" className="ag-offers">
          <h2 className="acct-h2 ag-h">{empty ? 'Por onde começar' : 'Mais com a Dolly'}</h2>
          <ul>
            {offers.map(o => (
              <li key={o.id}>
                <Link href={o.href} className="ag-offer">
                  <span className="ag-offer-emoji" aria-hidden>{o.emoji}</span>
                  <span className="ag-offer-text"><strong>{o.title}</strong><span>{o.line}</span></span>
                  <span className="ag-offer-go" aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
