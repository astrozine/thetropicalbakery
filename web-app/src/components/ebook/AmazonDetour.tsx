'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DETOUR, DETOUR_COPY, type AmazonStep } from '@/lib/amazonDetour';
import type { EbookLang } from '@/lib/ebookCopy';
import type { AmazonFormat } from '@/lib/ebook';
import { readConsent, trackMeta } from '@/lib/metaPixel';
import { DOLLY_PHOTO } from './BonusCall';
import './bonusCall.css';

/** Count one departure to Amazon. sendBeacon survives the tab switching away; never blocks anything. */
export function countAmazonClick(format: AmazonFormat, step: AmazonStep, lang: EbookLang) {
  try {
    const body = JSON.stringify({ format, step, lang, page: window.location.pathname });
    if (!navigator.sendBeacon?.('/api/amazon-click', new Blob([body], { type: 'text/plain' }))) {
      fetch('/api/amazon-click', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch { /* counting must never break the link */ }
}

export function detourSeen(): boolean {
  try { return !!localStorage.getItem(DETOUR.seenKey); } catch { return false; }
}
const markSeen = () => { try { localStorage.setItem(DETOUR.seenKey, String(Date.now())); } catch { /* ignore */ } };

/**
 * "Heading to Amazon?": e-mail for the 2 free recipes (+ the free call), then Amazon. Both buttons open Amazon in a
 * new tab inside the tap itself, so pop-up blockers let it through and nobody waits on our server to get to Amazon.
 */
export default function AmazonDetour({ lang, target, callOn, onClose }: {
  lang: EbookLang;
  target: { format: AmazonFormat; url: string } | null;
  callOn: boolean;
  onClose: () => void;
}) {
  const c = DETOUR_COPY[lang];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!target) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [target, onClose]);

  if (!target) return null;

  const skip = () => {
    markSeen();
    countAmazonClick(target.format, 'skip', lang);
    onClose();
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (name.trim().length < 1) { setError(c.errName); nameRef.current?.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError(c.errEmail); return; }
    setError('');
    window.open(target.url, '_blank', 'noopener');
    markSeen();
    countAmazonClick(target.format, 'signup', lang);
    const eventId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    trackMeta('Lead', { content_name: 'free-recipes-amazon-detour' }, eventId);
    fetch('/api/free-recipes/lead', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), email: email.trim(), lang, segment: 'away',
        utm_source: DETOUR.utmSource, utm_campaign: DETOUR.utmCampaign, utm_content: target.format,
        referrer: document.referrer || '', event_id: eventId, consent: readConsent(), page: window.location.pathname,
      }),
    }).catch(() => {});
    setSent(true);
    window.setTimeout(onClose, 4000);
  };

  return (
    <div className="bc-pop" role="dialog" aria-modal="true" aria-labelledby="amz-detour-title" onClick={onClose}>
      <div className="bc-pop__card amz-detour" onClick={e => e.stopPropagation()}>
        <button type="button" className="bc-pop__x" aria-label={c.close} onClick={onClose}>×</button>
        <div className="bc-pop__body">
          <div className="amz-detour__head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DOLLY_PHOTO} alt="Dolly" />
            <h2 id="amz-detour-title">{c.title}</h2>
          </div>
          {sent ? (
            <p className="amz-detour__sent">{c.sent}</p>
          ) : (
            <>
              <p>{c.text}{callOn ? ` ${c.callText}` : ''}</p>
              <form onSubmit={submit} noValidate className="amz-detour__form">
                <label className="se-field">{c.name}
                  <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" />
                </label>
                <label className="se-field">{c.email}
                  <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </label>
                {error && <p className="amz-detour__err" role="alert">{error}</p>}
                <button type="submit" className="se-btn se-btn--primary se-btn--big">{c.cta}</button>
              </form>
              <a className="bc-pop__link" href={target.url} target="_blank" rel="noopener noreferrer" onClick={skip}>{c.skip} ↗</a>
              <p className="amz-detour__fine">{c.fine}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
