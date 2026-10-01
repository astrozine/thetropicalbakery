'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EBOOK } from '@/lib/ebook';
import { EBOOK_COPY, fill, LANG_PATH, type EbookLang } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';
import { rich } from './EbookLang';

type Method = 'card' | 'pix' | 'paypal';

interface PixResult { reference: string; key: string; payload: string; base64: string }

/**
 * The order form inside the price card. Name + e-mail (where the book goes), WhatsApp optional, and how to
 * pay. The server prices it; card and PayPal leave for their own page, Pix shows its QR right here.
 * Anyone reading the page in another language must tick that they know the book is in English.
 */
export default function EbookBuyBox({ lang = 'en', needsEnglishTick = false }: { lang?: EbookLang; needsEnglishTick?: boolean }) {
  const c = EBOOK_COPY[lang];
  const f = c.form;
  const price = `R$ ${EBOOK.priceBRL}`;

  const [methods, setMethods] = useState<{ card: boolean; paypal: boolean }>({ card: false, paypal: false });
  const [method, setMethod] = useState<Method>('pix');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [english, setEnglish] = useState(false);
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
    if (name.trim().length < 2) return setError(f.errName);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError(f.errEmail);
    if (needsEnglishTick && !english) return setError(c.english.tickError);
    setBusy(true);
    trackMeta('InitiateCheckout', { value: EBOOK.priceBRL, content_name: EBOOK.id, content_type: 'product', num_items: 1 });
    try {
      const r = await fetch('/api/ebook/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, email, whatsapp, payMethod: method, lang }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || f.errGeneric);
      if (j.url) { window.location.href = j.url; return; }
      if (j.pix) { setPix({ reference: j.reference, key: j.key, payload: j.pix.payload, base64: j.pix.base64 }); setBusy(false); return; }
      throw new Error(f.errGeneric);
    } catch (e) {
      setError(e instanceof Error ? e.message : f.errGeneric);
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* the code is visible to copy by hand */ }
  };

  if (pix) {
    const thanks = `${EBOOK.thanksPath}?ref=${pix.reference}&k=${pix.key}&provider=pix&lang=${lang}`;
    return (
      <div className="se-pix">
        <p className="se-pix__title">{fill(f.pixTitle, { price })}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="se-pix__qr" src={pix.base64} alt="Pix QR code" width={220} height={220} />
        <p className="se-pix__label">{f.pixLabel}</p>
        <div className="se-pix__code notranslate" translate="no">{pix.payload}</div>
        <button type="button" className="se-btn se-btn--ghost" onClick={copy}>{copied ? f.pixCopied : f.pixCopy}</button>
        <p className="se-pix__note">{rich(fill(f.pixNote, { email }))}</p>
        <a className="se-btn se-btn--primary" href={thanks}>{f.pixPaid}</a>
      </div>
    );
  }

  const options: { id: Method; label: string; note: string; show: boolean }[] = [
    { id: 'card', label: f.card, note: f.cardNote, show: methods.card },
    { id: 'pix', label: f.pix, note: f.pixMethodNote, show: true },
    { id: 'paypal', label: f.paypal, note: f.paypalNote, show: methods.paypal },
  ];

  return (
    <form className="se-form" onSubmit={submit} noValidate>
      <label className="se-field">
        <span>{f.name}</span>
        <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
      </label>
      <label className="se-field">
        <span>{f.email} <em>{f.emailNote}</em></span>
        <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label className="se-field">
        <span>{f.whatsapp} <em>{f.optional}</em></span>
        <input type="tel" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} autoComplete="tel" placeholder="+55 12 99999-9999" />
      </label>

      <fieldset className="se-methods">
        <legend>{f.payLegend}</legend>
        {options.filter(o => o.show).map(o => (
          <label key={o.id} className={`se-method${method === o.id ? ' is-on' : ''}`}>
            <input type="radio" name="se-method" value={o.id} checked={method === o.id} onChange={() => setMethod(o.id)} />
            <b>{o.label}</b>
            <small>{o.note}</small>
          </label>
        ))}
      </fieldset>

      {needsEnglishTick && (
        <label className={`se-tick${english ? ' is-on' : ''}`}>
          <input type="checkbox" checked={english} onChange={e => setEnglish(e.target.checked)} />
          <span><span aria-hidden>📖 </span>{c.english.tick}</span>
        </label>
      )}

      {error && <p className="se-error" role="alert">{error}</p>}

      <button type="submit" className="se-btn se-btn--primary se-btn--big" disabled={busy}>
        {busy ? f.busy : fill(f.submit, { price })}
      </button>
      <p className="se-form__fine">{f.fine}</p>
      {lang !== 'en' && <p className="se-form__fine"><a href={LANG_PATH.en} hrefLang="en">Read this page in English</a></p>}
    </form>
  );
}
