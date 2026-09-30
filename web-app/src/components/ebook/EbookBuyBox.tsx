'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EBOOK } from '@/lib/ebook';
import { trackMeta } from '@/lib/metaPixel';

type Method = 'card' | 'pix' | 'paypal';

interface PixResult { reference: string; key: string; payload: string; base64: string }

/**
 * The order form inside the price card. Name + e-mail (where the book goes), WhatsApp optional, and how to
 * pay. The server prices it; card and PayPal leave for their own page, Pix shows its QR right here.
 */
export default function EbookBuyBox() {
  const [methods, setMethods] = useState<{ card: boolean; paypal: boolean }>({ card: false, paypal: false });
  const [method, setMethod] = useState<Method>('pix');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<PixResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/pay/methods', { cache: 'no-store' })
      .then(r => r.json())
      .then(m => {
        setMethods({ card: !!m.card, paypal: !!m.paypal });
        if (m.card) setMethod('card');
      })
      .catch(() => {});
    // Signed in? Fill in what we know and link the order to their account.
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (!s) return;
      setToken(s.access_token);
      const meta = s.user.user_metadata || {};
      setName(n => n || meta.full_name || meta.name || '');
      setEmail(e => e || s.user.email || '');
    }).catch(() => {});
  }, []);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Please tell us your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Please check your e-mail: that is where your book goes.');
    setBusy(true);
    trackMeta('InitiateCheckout', { value: EBOOK.priceBRL, content_name: EBOOK.id, content_type: 'product', num_items: 1 });
    try {
      const r = await fetch('/api/ebook/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, email, whatsapp, payMethod: method }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
      if (j.url) { window.location.href = j.url; return; }
      if (j.pix) { setPix({ reference: j.reference, key: j.key, payload: j.pix.payload, base64: j.pix.base64 }); setBusy(false); return; }
      throw new Error('Something went wrong. Please try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* the code is visible to copy by hand */ }
  };

  if (pix) {
    const thanks = `${EBOOK.thanksPath}?ref=${pix.reference}&k=${pix.key}&provider=pix`;
    return (
      <div className="se-pix">
        <p className="se-pix__title">Almost yours! Pay R$ {EBOOK.priceBRL} with Pix</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="se-pix__qr" src={pix.base64} alt="Pix QR code" width={220} height={220} />
        <p className="se-pix__label">Or Pix copia e cola:</p>
        <div className="se-pix__code">{pix.payload}</div>
        <button type="button" className="se-btn se-btn--ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy the Pix code'}</button>
        <p className="se-pix__note">
          We also e-mailed this code and your personal download link to <b>{email}</b>. Dolly confirms Pix payments by
          hand, usually within a few hours, and your link unlocks itself.
        </p>
        <a className="se-btn se-btn--primary" href={thanks}>I’ve paid · go to my download page</a>
      </div>
    );
  }

  const options: { id: Method; label: string; note: string; show: boolean }[] = [
    { id: 'card', label: 'Card', note: 'instant download', show: methods.card },
    { id: 'pix', label: 'Pix', note: 'Brazil · confirmed by hand', show: true },
    { id: 'paypal', label: 'PayPal', note: 'from anywhere', show: methods.paypal },
  ];

  return (
    <form className="se-form" onSubmit={submit} noValidate>
      <label className="se-field">
        <span>Your name</span>
        <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
      </label>
      <label className="se-field">
        <span>E-mail <em>(your book goes here)</em></span>
        <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label className="se-field">
        <span>WhatsApp <em>(optional)</em></span>
        <input type="tel" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} autoComplete="tel" placeholder="+55 12 99999-9999" />
      </label>

      <fieldset className="se-methods">
        <legend>How would you like to pay?</legend>
        {options.filter(o => o.show).map(o => (
          <label key={o.id} className={`se-method${method === o.id ? ' is-on' : ''}`}>
            <input type="radio" name="se-method" value={o.id} checked={method === o.id} onChange={() => setMethod(o.id)} />
            <b>{o.label}</b>
            <small>{o.note}</small>
          </label>
        ))}
      </fieldset>

      {error && <p className="se-error" role="alert">{error}</p>}

      <button type="submit" className="se-btn se-btn--primary se-btn--big" disabled={busy}>
        {busy ? 'One moment…' : `Yes! Send me Sweet Escape · R$ ${EBOOK.priceBRL}`}
      </button>
      <p className="se-form__fine">🔒 Secure payment · PDF by e-mail · 7-day money-back promise</p>
    </form>
  );
}
