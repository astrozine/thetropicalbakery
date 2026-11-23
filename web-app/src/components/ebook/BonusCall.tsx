'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BONUS_CALL_COPY, claimPath } from '@/lib/bonusCall';
import type { EbookLang } from '@/lib/ebookCopy';
import './bonusCall.css';

/** Dolly's photo for everything about the call. */
export const DOLLY_PHOTO = '/dolly/dolly-portrait.jpg';

let cached: Promise<boolean> | null = null;
/** Is the bonus on (Admin › Ligação grátis > 0)? Asked once per page; fails open. */
export function useBonusCallOn(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    cached ??= fetch('/api/bonus-call', { cache: 'no-store' }).then(r => r.json()).then(j => j.on !== false).catch(() => true);
    let live = true;
    cached.then(v => { if (live) setOn(v); });
    return () => { live = false; };
  }, []);
  return on;
}

/** One line with Dolly's face: on the order card and the one-time offer. */
export function BonusCallBadge({ lang, dark = false }: { lang: EbookLang; dark?: boolean }) {
  const on = useBonusCallOn();
  if (!on) return null;
  return (
    <p className={`bc-badge${dark ? ' bc-badge--dark' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DOLLY_PHOTO} alt="" />
      <span>{BONUS_CALL_COPY[lang].badge}</span>
    </p>
  );
}

const SEEN_KEY = 'bc_pop_seen';

/**
 * The pop-up that tells people the book comes with a free call. Shows once per visitor (remembered on this device),
 * after `delay` ms or once they have scrolled `scroll` of the page, whichever comes first. `onBuy` is the main button
 * (jump to the order form / the one-time offer).
 */
export function BonusCallPopup({ lang, onBuy, delay = 12000, scroll = 0.35, enabled = true }: {
  lang: EbookLang; onBuy: () => void; delay?: number; scroll?: number; enabled?: boolean;
}) {
  const on = useBonusCallOn();
  const [open, setOpen] = useState(false);
  const c = BONUS_CALL_COPY[lang];

  useEffect(() => {
    if (!on || !enabled) return;
    try { if (localStorage.getItem(SEEN_KEY)) return; } catch { /* private mode: still show once on this page */ }
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOpen(true);
      try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
    };
    const t = window.setTimeout(show, delay);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= scroll) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, [on, enabled, delay, scroll]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  if (!open) return null;
  return (
    <div className="bc-pop" role="dialog" aria-modal="true" aria-labelledby="bc-pop-title" onClick={() => setOpen(false)}>
      <div className="bc-pop__card" onClick={e => e.stopPropagation()}>
        <button type="button" className="bc-pop__x" aria-label={c.popClose} onClick={() => setOpen(false)}>×</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bc-pop__photo" src={DOLLY_PHOTO} alt="Dolly" />
        <div className="bc-pop__body">
          <h2 id="bc-pop-title">{c.popTitle}</h2>
          <p>{c.popText}</p>
          <ul>{c.popPoints.map(p => <li key={p}>{p}</li>)}</ul>
          <button type="button" className="se-btn se-btn--primary se-btn--big" onClick={() => { setOpen(false); onBuy(); }}>{c.popCta}</button>
          <Link className="bc-pop__link" href={claimPath(lang)}>{c.popAmazon} →</Link>
        </div>
      </div>
    </div>
  );
}

/** On the "your book is ready" pages: the call they got, and one button to book it. */
export function BonusCallCard({ lang, refCode, k }: { lang: EbookLang; refCode: string; k: string }) {
  const on = useBonusCallOn();
  if (!on) return null;
  const c = BONUS_CALL_COPY[lang];
  return (
    <div className="bc-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DOLLY_PHOTO} alt="Dolly" loading="lazy" />
      <div>
        <h3>{c.paidTitle}</h3>
        <p>{c.paidText}</p>
        <Link className="se-btn se-btn--primary" href={claimPath(lang, refCode, k)}>{c.paidCta}</Link>
      </div>
    </div>
  );
}
