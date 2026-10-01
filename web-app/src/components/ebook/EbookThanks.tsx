'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EBOOK } from '@/lib/ebook';
import { EBOOK_COPY, fill, isEbookLang, LANG_LABEL, LANG_PATH } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';
import { rich } from './EbookLang';
import './sweetEscape.css';

type Phase = 'checking' | 'paid' | 'waiting' | 'failed' | 'unknown';

const NEXT = [
  { href: '/caixas', img: '/box1.jpg' },
  { href: '/cursos', img: '/dolly-course1.jpg' },
  { href: '/retreats', img: '/retreats/real-itamambuca-coast.jpg' },
];

/**
 * Where every buyer lands: back from Mercado Pago / PayPal, after "I've paid" on Pix, and from the link in
 * the e-mails. Confirms card / PayPal with the provider (never trusting the URL), then waits for the payment
 * and shows the download button. Pix is confirmed by hand, so while waiting it checks again every 20 s.
 * Speaks the language the buyer read the sales page in (?lang=).
 */
export default function EbookThanks() {
  const q = useSearchParams();
  const ref = q.get('ref') || '';
  const k = q.get('k') || '';
  const langParam = q.get('lang');
  const lang = isEbookLang(langParam) ? langParam : 'en';
  const c = EBOOK_COPY[lang].thanks;
  const provider = q.get('provider') || '';
  const result = q.get('result') || '';
  const paypalToken = q.get('token') || '';
  const mpPaymentId = q.get('payment_id') || q.get('collection_id') || '';
  const stripeSession = q.get('session_id') || '';
  const fileError = q.get('erro') === '1';

  const [phase, setPhase] = useState<Phase>(ref && k ? 'checking' : 'unknown');
  const [firstName, setFirstName] = useState('');
  const [method, setMethod] = useState('');
  const [book, setBook] = useState<string>('');
  const ran = useRef(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (ran.current || !ref || !k) return;
    ran.current = true;
    let stop = false;

    const check = async (): Promise<Phase> => {
      try {
        const r = await fetch(`/api/ebook/access?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}`, { cache: 'no-store' });
        const j = await r.json();
        if (!j.found) return 'unknown';
        setFirstName(j.firstName || '');
        setMethod(j.method || '');
        setBook(j.book || '');
        if (j.paid && !tracked.current) {
          tracked.current = true;
          trackMeta('Purchase', { value: Number(j.total) || EBOOK.priceBRL, content_name: EBOOK.id, content_type: 'product', num_items: 1 }, ref);
        }
        return j.paid ? 'paid' : 'waiting';
      } catch { return 'waiting'; }
    };

    (async () => {
      if (provider === 'paypal' && result !== 'cancel' && paypalToken) {
        await fetch('/api/pay/paypal/capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: paypalToken, reference: ref }) }).catch(() => null);
      } else if (provider === 'stripe' && result !== 'cancel' && stripeSession) {
        await fetch('/api/pay/stripe/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: stripeSession }) }).catch(() => null);
      } else if (provider === 'mercadopago' && mpPaymentId) {
        await fetch('/api/pay/mercadopago/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_id: mpPaymentId }) }).catch(() => null);
      }
      // Cards can take a few seconds; Pix can take hours (Dolly confirms by hand).
      for (let i = 0; !stop; i++) {
        const s = await check();
        if (s === 'paid' || s === 'unknown') { setPhase(s); return; }
        if (i === 0 && (result === 'failure' || result === 'cancel')) { setPhase('failed'); return; }
        setPhase('waiting');
        await new Promise(res => setTimeout(res, i < 8 ? 3000 : 20000));
      }
    })();
    return () => { stop = true; };
  }, [ref, k, provider, result, paypalToken, mpPaymentId, stripeSession]);

  const download = `/api/ebook/download?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}&lang=${lang}`;
  const name = firstName ? `, ${firstName}` : '';
  const page = LANG_PATH[lang];

  return (
    <div className="se se-thanks" lang={lang}>
      <div className="se-wrap">
        <div className="se-thanks__card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="se-thanks__cover" src={`/ebook/sweet-escape/${isEbookLang(book) ? book : lang}/cover.webp`} alt="Sweet Escape" />

          {phase === 'checking' && (<><div className="se-spinner" aria-hidden /><h1>{c.checking}</h1><p>{c.checkingSub}</p></>)}

          {phase === 'paid' && (
            <>
              <h1>{fill(c.paidTitle, { name })}</h1>
              {isEbookLang(book) && <p className="se-thanks__edition">📖 {LANG_LABEL[book]}</p>}
              <p>{rich(c.paidText)}</p>
              {fileError && <p className="se-error" role="alert">{c.fileError}</p>}
              <a className="se-btn se-btn--primary se-btn--big" href={download}>{c.download}</a>
              <div className="se-thanks__tips">
                <b>{c.startTitle}</b>
                <ul>{c.start.map(t => <li key={t}>{t}</li>)}</ul>
              </div>
            </>
          )}

          {phase === 'waiting' && (
            <>
              <div className="se-spinner" aria-hidden />
              <h1>{fill(c.waitTitle, { name })}</h1>
              <p>{method === 'pix' || provider === 'pix' ? c.waitPix : c.waitCard}</p>
            </>
          )}

          {phase === 'failed' && (
            <>
              <h1>{c.failedTitle}</h1>
              <p>{c.failedText}</p>
              <Link className="se-btn se-btn--primary se-btn--big" href={`${page}#buy`}>{c.retry}</Link>
            </>
          )}

          {phase === 'unknown' && (
            <>
              <h1>{c.unknownTitle}</h1>
              <p>{c.unknownText}</p>
              <Link className="se-btn se-btn--primary" href={page}>{c.back}</Link>
            </>
          )}
        </div>

        {phase === 'paid' && (
          <div className="se-next">
            <h2>{c.nextTitle}</h2>
            <div className="se-next__grid">
              {NEXT.map((n, i) => (
                <Link key={n.href} href={n.href}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.img} alt="" loading="lazy" />
                  <div><b>{c.next[i].title}</b><span>{c.next[i].text}</span></div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
