'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { CREDIT_DAYS, creditDeadline, eventPath, fmtWhen, roomPath, venueKind, type MyBrunches as Data, type MyTicket } from '@/lib/brunch';
import { DEFAULT_COVER } from './BrunchEventCard';
import { BRUNCH_CSS } from './brunchStyles';

const dayMonth = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' });

function Credit({ t, onDone }: { t: MyTicket; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (t.status !== 'pago' || t.price <= 0) return null;
  const until = creditDeadline(t.starts_at);
  if (t.credit_applied_at) return <p className="bn-help">💌 Crédito de {formatBRL(t.price)} já usado na sua assinatura.</p>;
  if (t.credit_claimed_at) {
    return (
      <p className="bn-help">
        💌 Crédito pedido. Assine o plano <strong>Anual</strong> até {dayMonth(until)} e a Dolly desconta {formatBRL(t.price)} da primeira mensalidade.{' '}
        <Link href="/assinatura" style={{ color: '#a6832b', fontWeight: 700 }}>Ver a assinatura</Link>
      </p>
    );
  }
  if (Date.now() > until.getTime()) return null;
  const claim = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('brunch_claim_credit', { p_ticket: t.id });
    setBusy(false);
    if (error || data !== 'ok') { setMsg(data === 'expired' ? 'O prazo do crédito já passou.' : 'Não deu certo agora. Tente de novo.'); return; }
    onDone();
  };
  return (
    <div style={{ display: 'grid', gap: '0.3rem' }}>
      <button type="button" className="bn-btn bn-btn--ghost" onClick={claim} disabled={busy}>
        💌 Usar {formatBRL(t.price)} na assinatura anual
      </button>
      <span className="bn-help">Vale até {dayMonth(until)} ({CREDIT_DAYS} dias depois do brunch).</span>
      {msg && <span className="bn-error">{msg}</span>}
    </div>
  );
}

function Popup({ t, onDone }: { t: MyTicket; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(t.popup_request || '');
  const [busy, setBusy] = useState(false);
  if (t.status !== 'pago' || new Date(t.starts_at).getTime() < Date.now()) return null;
  if (!open) {
    return t.popup_request
      ? <p className="bn-help">🛍️ Pedido de pop-up enviado: “{t.popup_request}”. A Dolly te responde no grupo. <button type="button" className="bn-bubble__del" style={{ color: '#a6832b' }} onClick={() => setOpen(true)}>mudar</button></p>
      : <button type="button" className="bn-bubble__del" style={{ color: '#a6832b', padding: 0, textAlign: 'left', fontSize: '0.85rem' }} onClick={() => setOpen(true)}>🛍️ Tenho uma marca: quero levar meu pop-up</button>;
  }
  const save = async () => {
    setBusy(true);
    await supabase.rpc('brunch_request_popup', { p_ticket: t.id, p_text: text });
    setBusy(false);
    setOpen(false);
    onDone();
  };
  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <textarea className="bn-input" value={text} onChange={e => setText(e.target.value)} maxLength={600} placeholder="O que você vende, quanto espaço precisa, seu Instagram." />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="bn-btn bn-btn--dark" onClick={save} disabled={busy}>Enviar para a Dolly</button>
        <button type="button" className="bn-btn bn-btn--ghost" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </div>
  );
}

/**
 * The brunch tickets in Minha Conta, at the top of Início with the other live things. Renders nothing for someone
 * who has never bought one (the trail below offers it instead). Data from my_brunches() (migration 41).
 */
export default function MyBrunches({ data, reload }: { data: Data | null; reload: () => void }) {
  const tickets = (data?.tickets || []).filter(t => t.status !== 'cancelado');
  if (!tickets.length) return null;
  const now = Date.now();
  const sorted = [...tickets].sort((a, b) => {
    const fa = new Date(a.starts_at).getTime() >= now, fb = new Date(b.starts_at).getTime() >= now;
    if (fa !== fb) return fa ? -1 : 1;
    return fa ? a.starts_at.localeCompare(b.starts_at) : b.starts_at.localeCompare(a.starts_at);
  }).slice(0, 4);

  return (
    <section className="bn bn-mine" style={{ background: 'transparent' }} aria-label="Meus brunches">
      {sorted.map(t => {
        const v = venueKind(t.venue_kind);
        const past = new Date(t.starts_at).getTime() < now;
        return (
          <article key={t.id} className="bn-ticket">
            <div className="bn-ticket__photo"><img src={t.cover_url || DEFAULT_COVER} alt="" /></div>
            <div className="bn-ticket__body">
              <div className="bn-ticket__row">
                {t.status === 'pago' && <span className="bn-chip bn-chip--green">{past ? '💛 Você esteve lá' : '🥂 Lugar garantido'}</span>}
                {t.status === 'reservado' && <span className="bn-chip bn-chip--gold">⏳ Aguardando pagamento</span>}
                {t.status === 'espera' && <span className="bn-chip">📝 Lista de espera</span>}
              </div>
              <h3 className="bn-ticket__title">{t.title}</h3>
              <p className="bn-muted">🗓️ {fmtWhen(t)}<br />{v.emoji} {t.venue_name || v.label}{t.status === 'pago' && t.address && !past ? ` · ${t.address}` : ''}</p>
              {t.status === 'pago' && !past && t.guests > 1 && <p className="bn-help">👯 {t.guests} pessoas confirmadas</p>}
              {t.status === 'reservado' && t.hold_until && (
                <p className="bn-help">Seu lugar fica guardado até {new Date(t.hold_until).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. O código do Pix está no seu e-mail.</p>
              )}
              <div className="bn-ticket__row">
                {t.status === 'pago' && <Link href={roomPath(t.slug)} className="bn-btn bn-btn--gold">{past ? 'Voltar ao grupo' : 'Entrar no grupo'}</Link>}
                {t.status !== 'pago' && <Link href={eventPath(t.slug)} className="bn-btn bn-btn--ghost">Ver o brunch</Link>}
              </div>
              <Credit t={t} onDone={reload} />
              <Popup t={t} onDone={reload} />
            </div>
          </article>
        );
      })}
      <style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} />
    </section>
  );
}
