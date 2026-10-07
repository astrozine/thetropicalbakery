'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { HOLD_HOURS, fmtWhen, membersOnlyNow, roomPath, seatsLeft, type Availability, type BrunchEvent } from '@/lib/brunch';
import { SeatMeter } from './BrunchEventCard';

type Method = 'pix' | 'card' | 'paypal';
type Done =
  | { kind: 'pix'; reference: string; payload: string; base64: string }
  | { kind: 'espera' }
  | { kind: 'pago' };

/**
 * Buying a seat. Signing in comes first on purpose: the seat comes with a place in the group and a networking
 * card, which live on the account. The server decides the price and whether there is a seat (POST /api/brunch/order).
 */
export default function BrunchBuy({ event, avail, onChange }: { event: BrunchEvent; avail?: Availability | null; onChange?: () => void }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<Method>('pix');
  const [methods, setMethods] = useState({ card: false, paypal: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  const [copied, setCopied] = useState(false);
  const [mine, setMine] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pay/methods', { cache: 'no-store' }).then(r => r.json())
      .then(j => setMethods({ card: !!j.card, paypal: !!j.paypal })).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setName(n => n || profile.full_name || '');
      setWhatsapp(w => w || profile.phone || '');
    }
  }, [profile]);

  // Already has a seat (or a hold / waiting-list place) for this brunch?
  useEffect(() => {
    if (!user) return;
    supabase.rpc('my_brunches').then(({ data }) => {
      const t = (data?.tickets || []).find((x: { event_id: string }) => x.event_id === event.id);
      setMine(t?.status ?? null);
    });
  }, [user, event.id, done]);

  const past = new Date(event.starts_at).getTime() < Date.now();
  const left = seatsLeft(event, avail);
  const closed = past || event.status !== 'publicado';

  const buy = async () => {
    setError('');
    if (name.trim().length < 2) { setError('Conte pra gente o seu nome.'); return; }
    if (whatsapp.replace(/\D/g, '').length < 10) { setError('Precisamos do seu WhatsApp com DDD.'); return; }
    if (!user?.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Precisamos do seu e-mail: é por ele que chegam o endereço e o grupo.'); return; }
    setBusy(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const r = await fetch('/api/brunch/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(s.session ? { Authorization: `Bearer ${s.session.access_token}` } : {}) },
        body: JSON.stringify({ eventId: event.id, name, whatsapp, email, payMethod: method }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || 'Não deu certo. Tente de novo.'); setBusy(false); return; }
      if (j.url) { window.location.href = j.url; return; }
      if (j.result === 'espera') setDone({ kind: 'espera' });
      else if (j.result === 'pago') setDone({ kind: 'pago' });
      else if (j.pix) setDone({ kind: 'pix', reference: j.reference, payload: j.pix.payload, base64: j.pix.base64 });
      onChange?.();
    } catch {
      setError('Sem conexão. Tente de novo.');
    }
    setBusy(false);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* select manually */ }
  };

  const head = (
    <>
      <div className="bn-buy__price">
        <b>{event.price > 0 ? formatBRL(event.price) : 'Gratuito'}</b>
        <span className="bn-muted">por pessoa</span>
      </div>
      <p className="bn-muted" style={{ marginBottom: '0.8rem' }}>🗓️ {fmtWhen(event)}</p>
      {!past && <SeatMeter event={event} avail={avail} />}
    </>
  );

  if (closed) {
    return (
      <aside className="bn-buy" id="garantir">
        {head}
        <p className="bn-ok" style={{ marginTop: '1rem' }}>{past ? 'Este brunch já aconteceu. Veja os próximos na agenda.' : 'As vendas deste brunch estão fechadas.'}</p>
        <Link href="/brunch#agenda" className="bn-btn bn-btn--dark bn-btn--block">Ver a agenda</Link>
      </aside>
    );
  }

  if (done?.kind === 'pix') {
    return (
      <aside className="bn-buy bn-pix" id="garantir">
        <p className="bn-kicker">Seu lugar está guardado</p>
        <h3 className="bn-h3">Falta só o Pix de {formatBRL(event.price)}</h3>
        <p className="bn-muted">Guardamos o seu lugar por {HOLD_HOURS.pix} horas. Quando o Pix cair, a Dolly confirma e você entra no grupo.</p>
        <img src={done.base64} alt="QR code do Pix" width={220} height={220} />
        <div className="bn-copy">
          <input className="bn-input" readOnly value={done.payload} onFocus={e => e.currentTarget.select()} aria-label="Pix copia e cola" />
          <button type="button" className="bn-btn bn-btn--gold" onClick={() => copy(done.payload)}>{copied ? 'Copiado ✓' : 'Copiar'}</button>
        </div>
        <p className="bn-help">Pedido {done.reference}. Mandamos o código para o seu e-mail também.</p>
        <Link href="/minha-conta" className="bn-btn bn-btn--ghost bn-btn--block" style={{ marginTop: '0.9rem' }}>Ver em Minha Conta</Link>
      </aside>
    );
  }

  if (done?.kind === 'pago' || mine === 'pago') {
    return (
      <aside className="bn-buy" id="garantir">
        {head}
        <p className="bn-ok" style={{ marginTop: '1rem' }}>🥂 Você está dentro! O grupo, o endereço e o seu cartão estão na sua sala.</p>
        <Link href={roomPath(event.slug)} className="bn-btn bn-btn--gold bn-btn--block">Entrar na sala do brunch</Link>
      </aside>
    );
  }

  if (done?.kind === 'espera' || mine === 'espera') {
    return (
      <aside className="bn-buy" id="garantir">
        {head}
        <p className="bn-ok" style={{ marginTop: '1rem' }}>📝 Você está na lista de espera. Se abrir um lugar, avisamos todo mundo da lista por e-mail ao mesmo tempo, e quem pagar primeiro fica com ele.</p>
      </aside>
    );
  }

  return (
    <aside className="bn-buy" id="garantir">
      {head}
      {membersOnlyNow(event) && (
        <p className="bn-ok" style={{ background: '#fdf6e3', color: '#7a5a10' }}>
          ⏰ Pré-venda do Círculo: até {new Date(event.members_first_until!).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' })} só quem já veio a um brunch ou assina a caixa pode comprar.
        </p>
      )}
      {mine === 'reservado' && <p className="bn-ok" style={{ background: '#fff4e5', color: '#7a4a00' }}>⏳ Você já tem um lugar guardado esperando o pagamento. Comprar de novo troca pela nova forma de pagamento.</p>}

      {!user ? (
        <div style={{ marginTop: '1rem' }}>
          <LoginPanel message="Entre para garantir o seu lugar" subMessage="Seu ingresso, o endereço e o grupo do brunch ficam na sua conta. Leva um toque com o Google." />
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <label className="bn-field"><span className="bn-label">Seu nome</span>
            <input className="bn-input" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="bn-field"><span className="bn-label">WhatsApp (com DDD)</span>
            <input className="bn-input" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(12) 99123-4567" autoComplete="tel" />
          </label>
          {!user.email && (
            <label className="bn-field"><span className="bn-label">E-mail</span>
              <input className="bn-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              <span className="bn-help">É por ele que chegam o endereço e o grupo.</span>
            </label>
          )}
          {event.price > 0 && left > 0 && (
            <>
              <span className="bn-label">Como você quer pagar</span>
              <div className="bn-methods" role="radiogroup">
                {([['pix', '⚡ Pix', true], ['card', '💳 Cartão (até 6x)', methods.card], ['paypal', '🅿️ PayPal', methods.paypal]] as const)
                  .filter(([, , on]) => on)
                  .map(([id, label]) => (
                    <button key={id} type="button" role="radio" aria-checked={method === id} className={`bn-method${method === id ? ' is-on' : ''}`} onClick={() => setMethod(id)}>
                      {label}
                    </button>
                  ))}
              </div>
            </>
          )}
          {error && <p className="bn-error">{error}</p>}
          <button type="button" className="bn-btn bn-btn--gold bn-btn--block" onClick={buy} disabled={busy}>
            {busy ? 'Reservando…' : left === 0 ? 'Entrar na lista de espera' : event.price > 0 ? `Garantir meu lugar · ${formatBRL(event.price)}` : 'Garantir meu lugar'}
          </button>
        </div>
      )}
      <div className="bn-guarantee">
        <span aria-hidden>🔒</span>
        <span>Os lugares vão por ordem de pagamento. O endereço exato e o grupo aparecem assim que o pagamento é confirmado.</span>
      </div>
    </aside>
  );
}
