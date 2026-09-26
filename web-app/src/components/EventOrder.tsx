'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { STORE_WHATSAPP } from '@/lib/siteContact';
import { formatBRL } from '@/lib/deliveryZones';
import type { PickableTreat } from '@/components/TreatPicker';

/**
 * The two ways to order for an event, offered side by side and never both at once:
 *   1. "Pedir agora"           -> the treats go into the cart, quantities and Pix in the usual checkout.
 *   2. "Montar junto com a Dolly" -> a short form; the lead is saved (it shows up in the admin Inbox)
 *                                 and WhatsApp opens with everything already written.
 * Both are reached from one button, so nobody has to decide before they have picked something.
 */

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.8rem 0.9rem', borderRadius: '12px', border: '1px solid rgba(60,42,33,0.18)',
  background: '#fff', fontSize: '1rem', color: '#3c2a21', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 700, color: '#3c2a21' };

const btnStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'center', minHeight: '48px', padding: '0.8rem 1.2rem', borderRadius: '999px', border: 'none',
  fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
};

const dmy = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

/** Saves the request as a lead in `orders` (that's where the Inbox reads it). Falls back to fewer columns if the database is older. */
async function saveLead(v: { name: string; whatsapp: string; date: string; guests: string; note: string; picks: string[] }): Promise<boolean> {
  const digits = v.whatsapp.replace(/\D/g, '');
  const guests = v.guests ? Number(v.guests) : null;
  const items = { kind: 'orcamento_evento', picks: v.picks, guests, note: v.note || null };
  const summary = `Orçamento de evento${v.picks.length ? `: ${v.picks.join(', ')}` : ''}${guests ? ` · ${guests} convidados` : ''}${v.note ? ` · ${v.note}` : ''}`;
  // This is a LEAD, not an order. Migration 22 only lets the public insert a row with no status and no
  // price (real orders are priced and saved by the server), so sending status/total_price made every
  // attempt bounce off row-level security and the quote fell through to a stripped-down row that lost
  // the requested date and the summary. Leave both unset and the date and summary survive.
  const base = {
    customer_name: v.name.trim(), customer_whatsapp: digits, order_type: 'EVENTO', items,
    requested_date: v.date || null,
  };
  let res = await supabase.from('orders').insert([{ ...base, order_kind: 'quote', items_summary: summary }]);
  if (res.error) res = await supabase.from('orders').insert([base]);
  if (res.error) res = await supabase.from('orders').insert([{ customer_name: base.customer_name, customer_whatsapp: digits, order_type: 'EVENTO', items }]);
  if (res.error) console.error('Could not save the quote request:', res.error);
  return !res.error;
}

function whatsappText(v: { name: string; date: string; guests: string; note: string; picks: string[] }) {
  const lines = [`Olá Tropical Bakery! 🌴 Sou ${v.name.trim()}.`];
  lines.push(`Estou montando um evento${v.guests ? ` para ${v.guests} convidados` : ''}${v.date ? ` em ${dmy(v.date)}` : ''}.`);
  if (v.picks.length) lines.push('', v.picks.length === 1 ? 'Escolhi este doce no site:' : 'Escolhi estes doces no site:', ...v.picks.map(p => `• ${p}`));
  if (v.note) lines.push('', v.note);
  lines.push('', 'Podemos montar o orçamento juntos?');
  return lines.join('\n');
}

/** Name + WhatsApp are required; date and guests help but never block. */
export function EventQuoteForm({ picks, withNote = false, submitLabel = 'Enviar e falar no WhatsApp' }: { picks: string[]; withNote?: boolean; submitLabel?: string }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [note, setNote] = useState('');
  const uid = useId();   // two of these forms can be on the page at once (sheet + bottom card)
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ url: string; saved: boolean } | null>(null);

  // Whatever they already told us at checkout, so this never asks twice.
  useEffect(() => {
    try {
      setName(n => n || localStorage.getItem('checkout_fullName') || '');
      setWhatsapp(w => w || localStorage.getItem('checkout_phone') || '');
    } catch { /* private mode */ }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    // Open the tab now, inside the tap, so the phone doesn't block it; point it at WhatsApp once the request is saved.
    const tab = window.open('', '_blank');
    const values = { name, whatsapp, date, guests, note, picks };
    const saved = await saveLead(values);
    try { localStorage.setItem('checkout_fullName', name); localStorage.setItem('checkout_phone', whatsapp); } catch { /* private mode */ }
    const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(whatsappText(values))}`;
    if (tab) tab.location.href = url;
    setDone({ url, saved });
    setSending(false);
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '0.5rem 0.25rem' }}>
        <p style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }} aria-hidden>🧡</p>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#3c2a21', marginBottom: '0.4rem' }}>
          {done.saved ? 'Recebemos o seu pedido de orçamento!' : 'Quase lá!'}
        </p>
        <p style={{ color: '#594a42', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.95rem' }}>
          {done.saved ? 'A Dolly te responde pelo WhatsApp para montarmos tudo junto.' : 'Não conseguimos guardar aqui, mas o WhatsApp leva tudo o que você escolheu.'}
        </p>
        <a href={done.url} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, background: '#d4af37', color: '#3c2a21' }}>Abrir o WhatsApp</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '0.8rem' }}>
      <div>
        <label htmlFor={`${uid}-name`} style={labelStyle}>Seu nome</label>
        <input id={`${uid}-name`} required value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Ex: Maria Silva" style={inputStyle} />
      </div>
      <div>
        <label htmlFor={`${uid}-wa`} style={labelStyle}>WhatsApp</label>
        <input id={`${uid}-wa`} required type="tel" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} autoComplete="tel" placeholder="(11) 99999-9999" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label htmlFor={`${uid}-date`} style={labelStyle}>Data <span style={{ fontWeight: 400, color: '#95877c' }}>(se já souber)</span></label>
          <input id={`${uid}-date`} type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor={`${uid}-guests`} style={labelStyle}>Convidados</label>
          <input id={`${uid}-guests`} type="number" inputMode="numeric" min={1} value={guests} onChange={e => setGuests(e.target.value)} placeholder="Ex: 50" style={inputStyle} />
        </div>
      </div>
      {withNote && (
        <div>
          <label htmlFor={`${uid}-note`} style={labelStyle}>Algo que devemos saber? <span style={{ fontWeight: 400, color: '#95877c' }}>(opcional)</span></label>
          <textarea id={`${uid}-note`} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Tipo de evento, alergias dos convidados…" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}
      <button type="submit" disabled={sending} style={{ ...btnStyle, background: '#3c2a21', color: '#fdfaf3', opacity: sending ? 0.7 : 1, cursor: sending ? 'wait' : 'pointer' }}>{sending ? 'Enviando…' : submitLabel}</button>
    </form>
  );
}

/** Sheet opened by the treat picker's button. */
export default function EventOrderSheet({ picks, onClose }: { picks: PickableTreat[]; onClose: () => void }) {
  const { items, addToCart, setIsCartOpen } = useCart();
  const [openForm, setOpenForm] = useState(false);

  // Escape closes; the page behind stops scrolling while the sheet is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // What "pedir agora" would cost with each treat's minimum batch.
  const minTotal = useMemo(() => picks.reduce((sum, t) => sum + (t.price ?? 0) * (t.min_batch_size || 1), 0), [picks]);

  const orderNow = () => {
    for (const t of picks) {
      if (items.some(i => i.id === t.id)) continue; // keep the quantity they already chose
      addToCart({
        id: t.id, name: t.name, price: (t.price ?? 0).toFixed(2).replace('.', ','), image: t.image_url || '',
        min_batch_size: t.min_batch_size, batch_multiplier: t.batch_multiplier, kind: 'events',
      }, { open: false });
    }
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="eo-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`
        .eo-overlay { position: fixed; inset: 0; z-index: 100000; background: rgba(60,42,33,0.55); backdrop-filter: blur(3px);
          display: flex; align-items: flex-end; justify-content: center; animation: eo-fade .2s ease-out; }
        .eo-sheet { width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; background: linear-gradient(170deg, #fffdf6 0%, #fdf1d6 100%);
          border-radius: 26px 26px 0 0; padding: 1.1rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px)); color: #3c2a21;
          box-shadow: 0 -20px 50px rgba(0,0,0,0.3); animation: eo-up .28s cubic-bezier(.16,1,.3,1); }
        @media (min-width: 640px) { .eo-overlay { align-items: center; } .eo-sheet { border-radius: 26px; } }
        .eo-grab { width: 44px; height: 5px; border-radius: 3px; background: rgba(60,42,33,0.2); margin: 0 auto 0.9rem; }
        .eo-chips { display: flex; gap: 0.4rem; overflow-x: auto; padding: 0.15rem 0 0.6rem; margin: 0 -0.25rem 0.5rem; scrollbar-width: none; }
        .eo-chips::-webkit-scrollbar { display: none; }
        .eo-chip { flex: 0 0 auto; background: #fff; border: 1px solid rgba(212,175,55,0.5); border-radius: 999px; padding: 0.3rem 0.75rem; font-size: 0.82rem; font-weight: 600; white-space: nowrap; }
        .eo-path { width: 100%; text-align: left; border: 2px solid #e8e1d7; background: #fff; border-radius: 18px; padding: 0.95rem 1.05rem; cursor: pointer; font-family: inherit; color: #3c2a21;
          display: flex; gap: 0.85rem; align-items: center; transition: border-color .18s, box-shadow .18s, transform .12s; }
        .eo-path:hover { border-color: #d4af37; box-shadow: 0 8px 22px rgba(212,175,55,0.25); }
        .eo-path:active { transform: scale(0.985); }
        .eo-path[aria-expanded="true"] { border-color: #d4af37; box-shadow: 0 8px 22px rgba(212,175,55,0.3); }
        .eo-ico { flex: 0 0 auto; width: 2.6rem; height: 2.6rem; border-radius: 50%; background: #fdf1d6; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
        .eo-path b { display: block; font-size: 1.05rem; font-family: var(--font-heading); margin-bottom: 0.15rem; }
        .eo-path span.eo-sub { display: block; font-size: 0.85rem; line-height: 1.45; color: #594a42; }
        .eo-go { margin-left: auto; font-size: 1.3rem; color: #a6832b; }
        .eo-form { background: #fff; border: 1px solid #e8e1d7; border-radius: 18px; padding: 1rem; margin-top: 0.6rem; animation: eo-fade .2s ease-out; }
        .eo-or { text-align: center; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; color: #a6832b; font-weight: 700; margin: 0.55rem 0; }
        @keyframes eo-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes eo-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .eo-overlay, .eo-sheet, .eo-form { animation: none; } }
      `}</style>
      <div className="eo-sheet" role="dialog" aria-modal="true" aria-labelledby="eo-title">
        <div className="eo-grab" aria-hidden />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <h2 id="eo-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', lineHeight: 1.15, margin: 0 }}>
            Ótima escolha! <span style={{ color: '#a6832b' }}>{picks.length} {picks.length === 1 ? 'doce' : 'doces'}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', fontSize: '1.6rem', lineHeight: 1, cursor: 'pointer', color: '#7a6a61', padding: '0 0.25rem' }}>×</button>
        </div>
        <p style={{ color: '#594a42', fontSize: '0.95rem', margin: '0.35rem 0 0.7rem' }}>Como você prefere seguir?</p>

        <div className="eo-chips" aria-label="Doces escolhidos">
          {picks.map(t => <span key={t.id} className="eo-chip">{t.name}</span>)}
        </div>

        <button type="button" className="eo-path" onClick={orderNow}>
          <span className="eo-ico" aria-hidden>⚡</span>
          <span>
            <b>Pedir agora</b>
            <span className="eo-sub">Ajuste as quantidades e pague por Pix.{minTotal > 0 ? ` Com o mínimo de cada doce: ${formatBRL(minTotal)}.` : ''}</span>
          </span>
          <span className="eo-go" aria-hidden>→</span>
        </button>

        <p className="eo-or">ou</p>

        <button type="button" className="eo-path" aria-expanded={openForm} onClick={() => setOpenForm(o => !o)}>
          <span className="eo-ico" aria-hidden>🤝</span>
          <span>
            <b>Montar junto com a Dolly</b>
            <span className="eo-sub">Conte o evento e a gente ajusta o cardápio e o orçamento com você. Sem compromisso.</span>
          </span>
          <span className="eo-go" aria-hidden>{openForm ? '−' : '+'}</span>
        </button>
        {openForm && (
          <div className="eo-form">
            <EventQuoteForm picks={picks.map(p => p.name)} />
          </div>
        )}
      </div>
    </div>
  );
}
