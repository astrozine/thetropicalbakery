'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroBoxCard, { HeroBoxStrip } from '@/components/HeroBoxCard';
import MobileBuyBar from '@/components/MobileBuyBar';
import { OFFER_COPY, OFFER_HERO, OFFER_PHOTOS, brl, offerDay, type PublicOffer } from '@/lib/offers';
import './proposta.css';

type Method = 'pix' | 'card' | 'stripe' | 'paypal';
type Phase = 'idle' | 'checking' | 'paid' | 'waiting' | 'cancelled';

interface Props {
  offer: PublicOffer;
  /** Which ways to pay are switched on (Pix always is). */
  methods: { card: boolean; paypal: boolean; stripe: boolean };
}

/**
 * The page a client opens from Dolly's message. One idea, told in the order that sells it:
 * it is for YOU (their name), the dream (photos, the promise), Dolly herself (her note), everything that is in it,
 * the offer stack with what it is worth, the deadline, and the payment right there. Colours from the Sweet Escape
 * e-book; the floating photo cards from /retreats.
 */
export default function OfferLanding({ offer, methods }: Props) {
  const c = OFFER_COPY[offer.lang];
  const q = useSearchParams();
  const [phase, setPhase] = useState<Phase>(offer.paid ? 'paid' : 'idle');
  const [method, setMethod] = useState<Method>(offer.lang === 'en' && methods.stripe ? 'stripe' : 'pix');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<{ payload: string; qr: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const ran = useRef(false);

  const price = brl(offer.price);
  const deadline = offer.expires_on ? offerDay(offer.expires_on, offer.lang) : '';
  const hero = offer.image_url || OFFER_HERO[offer.kind];
  const photos = OFFER_PHOTOS[offer.kind];
  const anchor = offer.anchor_price && offer.anchor_price > offer.price ? offer.anchor_price : null;
  const colon = offer.title.indexOf(':');

  const isPaid = useCallback(async (ref: string) => {
    try {
      const j = await (await fetch(`/api/pay/status?ref=${encodeURIComponent(ref)}`, { cache: 'no-store' })).json();
      return !!j.paid;
    } catch { return false; }
  }, []);

  // Back from the card / PayPal / Stripe page: ask the provider (never the browser) and show the result.
  useEffect(() => {
    if (ran.current || offer.paid) return;
    const provider = q.get('provider');
    const ref = q.get('ref') || offer.reference || '';
    if (!provider || !ref) return;
    ran.current = true;
    if (q.get('result') === 'cancel' || q.get('result') === 'failure') { setPhase('cancelled'); return; }
    setPhase('checking');
    (async () => {
      const post = (url: string, body: object) =>
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
      if (provider === 'paypal' && q.get('token')) await post('/api/pay/paypal/capture', { token: q.get('token'), reference: ref });
      if (provider === 'stripe' && q.get('session_id')) await post('/api/pay/stripe/confirm', { session_id: q.get('session_id') });
      const mp = q.get('payment_id') || q.get('collection_id');
      if (provider === 'mercadopago' && mp) await post('/api/pay/mercadopago/confirm', { payment_id: mp });
      for (let i = 0; i < 8; i++) {
        if (await isPaid(ref)) { setPhase('paid'); return; }
        await new Promise(r => setTimeout(r, 2500));
      }
      setPhase('waiting');
    })();
  }, [q, offer.paid, offer.reference, isPaid]);

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/proposta/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: offer.id, method }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || c.cancelledPay);
      if (j.pix) { setPix(j.pix); setBusy(false); return; }
      if (j.url) { window.location.href = j.url; return; }
      throw new Error(c.cancelledPay);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const copyPix = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* old browser */ }
  };

  const toPay = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('pagar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const options: [Method, string, string][] = ([
    ['pix', '⚡', ...c.methods.pix],
    ['card', '💳', ...c.methods.card],
    ['stripe', '🌍', ...c.methods.stripe],
    ['paypal', '🅿️', ...c.methods.paypal],
  ] as [Method, string, string, string][])
    .filter(([m]) => m === 'pix' || methods[m])
    .map(([m, icon, title, hint]) => [m, `${icon} ${title}`, hint]);

  const closed = offer.status !== 'open';
  const canPay = !closed && !offer.expired && phase !== 'paid';

  return (
    <div className="pp" lang={offer.lang === 'en' ? 'en' : 'pt-BR'}>
      {/* ══ HERO ══ */}
      <section className="pp-hero">
        <div className="pp-hero__bg" style={{ backgroundImage: `url("${hero}")` }} />
        <HeroBoxCard side="left" photos={photos.filter((_, i) => i % 2 === 0).map(src => ({ src }))} tag={offer.kind === 'retiro' ? 'Itamambuca' : 'Chef Dolly'} />
        <HeroBoxCard side="right" photos={photos.filter((_, i) => i % 2 === 1).map(src => ({ src }))} delayMs={2750} tag={offer.kind === 'retiro' ? 'Itamambuca' : 'Chef Dolly'} />
        <div className="pp-wrap pp-hero__inner">
          <HeroBoxStrip photos={photos.slice(0, 2).map(src => ({ src }))} tag={offer.kind === 'retiro' ? 'Itamambuca' : 'Chef Dolly'} />
          <p className="pp-eyebrow">{c.eyebrow(offer.firstName)}</p>
          <h1 className="pp-title">
            {colon === -1 ? offer.title : <>{offer.title.slice(0, colon + 1)} <em>{offer.title.slice(colon + 1).trim()}</em></>}
          </h1>
          <p className="pp-lead">{c.promise[offer.kind]}</p>
          <div className="pp-chips">
            {offer.dates_label && <span className="pp-chip">📅 {offer.dates_label}</span>}
            {deadline && canPay && <span className="pp-chip pp-chip--gold">⏳ {c.validUntil(deadline)}</span>}
          </div>
          {canPay && <a href="#pagar" onClick={toPay} className="pp-btn pp-btn--big">{c.heroCta} ↓</a>}
        </div>
      </section>

      {phase === 'paid' && (
        <section className="pp-sec">
          <div className="pp-wrap pp-narrow">
            <div className="pp-done">
              <p className="pp-done__icon">🌴</p>
              <h2 className="pp-h2">{c.paidTitle}</h2>
              <p className="pp-text">{c.paidLead}</p>
            </div>
          </div>
        </section>
      )}

      {/* ══ DOLLY'S NOTE ══ */}
      {offer.note && (
        <section className="pp-sec pp-sec--paper">
          <div className="pp-wrap pp-narrow">
            <figure className="pp-note">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dolly/dolly-face.jpg" alt="Chef Dolly" className="pp-note__face" />
              <div>
                <p className="pp-script">{c.fromDolly}</p>
                <blockquote className="pp-note__text">{offer.note}</blockquote>
                <figcaption className="pp-note__sig">— Dolly</figcaption>
              </div>
            </figure>
          </div>
        </section>
      )}

      {/* ══ WHAT YOU WILL LIVE ══ */}
      {offer.included.length > 0 && (
        <section className="pp-sec">
          <div className="pp-wrap">
            <p className="pp-kicker">{c.whatYouGet}</p>
            <h2 className="pp-h2">{c.includedTitle}</h2>
            <div className="pp-live">
              <ul className="pp-list">
                {offer.included.map((t, i) => <li key={i}><span className="pp-tick" aria-hidden>✓</span>{t}</li>)}
              </ul>
              <div className="pp-mosaic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photos.slice(0, 3).map((src, i) => <img key={src} src={src} alt="" className={`pp-mosaic__img pp-mosaic__img--${i}`} loading="lazy" />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ THE OFFER + PAYMENT ══ */}
      <section className="pp-sec pp-sec--jungle" id="pagar">
        <div className="pp-wrap pp-narrow">
          <div className="pp-offer">
            <p className="pp-kicker pp-kicker--light">{c.stackTitle}</p>
            <h2 className="pp-offer__title">{offer.title}</h2>
            {offer.dates_label && <p className="pp-offer__dates">📅 {offer.dates_label}</p>}

            <ul className="pp-stack">
              {offer.included.map((t, i) => <li key={`i${i}`}><span aria-hidden>✓</span>{t}</li>)}
              {offer.bonuses.length > 0 && <li className="pp-stack__head">{c.bonusTitle}</li>}
              {offer.bonuses.map((t, i) => <li key={`b${i}`} className="pp-stack__bonus"><span aria-hidden>🎁</span>{t}</li>)}
            </ul>

            <div className="pp-price">
              {anchor && <p className="pp-price__was">{c.valueLabel}: <s>{brl(anchor)}</s></p>}
              <p className="pp-price__label">{c.todayLabel}</p>
              <p className="pp-price__now">{price}</p>
            </div>

            {closed && <p className="pp-alert">{c.closedTitle}</p>}
            {!closed && offer.expired && phase !== 'paid' && (
              <div className="pp-alert"><strong>{c.expiredTitle}</strong><br />{c.expiredLead}</div>
            )}
            {phase === 'paid' && <div className="pp-alert pp-alert--ok"><strong>{c.paidTitle}</strong></div>}
            {phase === 'checking' && <div className="pp-alert">⏳ {c.checking}</div>}
            {phase === 'waiting' && <div className="pp-alert"><strong>{c.waitingTitle}</strong><br />{c.waitingLead}</div>}
            {phase === 'cancelled' && <div className="pp-alert">{c.cancelledPay}</div>}

            {canPay && phase !== 'checking' && !pix && (
              <div className="pp-pay">
                <p className="pp-pay__title">{c.payTitle}</p>
                <p className="pp-pay__lead">{c.payLead}</p>
                <div className="pp-methods" role="radiogroup">
                  {options.map(([m, title, hint]) => (
                    <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                      className={`pp-method${method === m ? ' is-on' : ''}`}>
                      <strong>{title}</strong>
                      <span>{hint}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="pp-btn pp-btn--big pp-btn--full" onClick={pay} disabled={busy}>
                  {busy ? c.opening : c.payButton(price)}
                </button>
                {error && <p className="pp-error">{error}</p>}
                <p className="pp-fine">{c.safe}</p>
              </div>
            )}

            {pix && phase !== 'paid' && (
              <div className="pp-pix">
                <p className="pp-pay__title">{c.pixTitle}</p>
                <p className="pp-pay__lead">{c.pixLead}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pix.qr} alt="QR code Pix" className="pp-pix__qr" />
                <button type="button" className="pp-btn pp-btn--full" onClick={copyPix}>{copied ? c.copied : c.copy}</button>
                <p className="pp-fine">{c.pixAfter}</p>
              </div>
            )}

            {canPay && deadline && <p className="pp-fine pp-fine--gold">⏳ {c.reserved(deadline)}</p>}
            <p className="pp-fine">{c.questions}</p>
          </div>
        </div>
      </section>

      {canPay && !pix && (
        <MobileBuyBar kicker={c.barKicker} price={price} note={offer.dates_label || undefined} label={c.barLabel} targetId="#pagar" />
      )}
    </div>
  );
}
