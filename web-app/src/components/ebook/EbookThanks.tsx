'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EBOOK } from '@/lib/ebook';
import { trackMeta } from '@/lib/metaPixel';
import './sweetEscape.css';

type Phase = 'checking' | 'paid' | 'waiting' | 'failed' | 'unknown';

/**
 * Where every buyer lands: back from Mercado Pago / PayPal, after "I've paid" on Pix, and from the link in
 * the e-mails. Confirms card / PayPal with the provider (never trusting the URL), then waits for the payment
 * and shows the download button. Pix is confirmed by hand, so while waiting it checks again every 20 s.
 */
export default function EbookThanks() {
  const q = useSearchParams();
  const ref = q.get('ref') || '';
  const k = q.get('k') || '';
  const provider = q.get('provider') || '';
  const result = q.get('result') || '';
  const paypalToken = q.get('token') || '';
  const mpPaymentId = q.get('payment_id') || q.get('collection_id') || '';
  const fileError = q.get('erro') === '1';

  const [phase, setPhase] = useState<Phase>('checking');
  const [firstName, setFirstName] = useState('');
  const [method, setMethod] = useState('');
  const ran = useRef(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!ref || !k) { setPhase('unknown'); return; }
    let stop = false;

    const check = async (): Promise<Phase> => {
      try {
        const r = await fetch(`/api/ebook/access?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}`, { cache: 'no-store' });
        const j = await r.json();
        if (!j.found) return 'unknown';
        setFirstName(j.firstName || '');
        setMethod(j.method || '');
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
  }, [ref, k, provider, result, paypalToken, mpPaymentId]);

  const download = `/api/ebook/download?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}`;
  const hi = firstName ? `, ${firstName}` : '';

  return (
    <div className="se se-thanks">
      <div className="se-wrap">
        <div className="se-thanks__card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="se-thanks__cover" src="/ebook/sweet-escape/cover.webp" alt="Sweet Escape e-book cover" />

          {phase === 'checking' && (<><div className="se-spinner" aria-hidden /><h1>Checking your order…</h1><p>This takes a few seconds.</p></>)}

          {phase === 'paid' && (
            <>
              <h1>Welcome to the jungle kitchen{hi}! 🌈</h1>
              <p>Your copy of <b>Sweet Escape</b> is ready. Save it to your phone or tablet and cook straight from it. This page and the link in your e-mail work whenever you need them.</p>
              {fileError && <p className="se-error" role="alert">The download didn’t start. Please try once more; if it still fails, message us on WhatsApp and we’ll send it straight away.</p>}
              <a className="se-btn se-btn--primary se-btn--big" href={download}>Download Sweet Escape (PDF)</a>
              <div className="se-thanks__tips">
                <b>Where to start</b>
                <ul>
                  <li>Read the six rules first: they make every recipe easier.</li>
                  <li>Day 3, the Red Berry Bliss Balls, needs no oven: perfect with kids.</li>
                  <li>Soak cashews the night before Days 1, 2 and 6.</li>
                </ul>
              </div>
            </>
          )}

          {phase === 'waiting' && (
            <>
              <div className="se-spinner" aria-hidden />
              <h1>Thank you{hi}! Almost there</h1>
              {method === 'pix' || provider === 'pix' ? (
                <p>Dolly confirms Pix payments by hand, usually within a few hours. Keep this page open or come back from the link in your e-mail: your download unlocks here by itself.</p>
              ) : (
                <p>We’re waiting for the payment confirmation. Some banks take a minute or two; this page updates by itself.</p>
              )}
            </>
          )}

          {phase === 'failed' && (
            <>
              <h1>The payment didn’t go through</h1>
              <p>Nothing was charged. You can try again with another card, or pay with Pix.</p>
              <Link className="se-btn se-btn--primary se-btn--big" href={`${EBOOK.pagePath}#buy`}>Try again</Link>
            </>
          )}

          {phase === 'unknown' && (
            <>
              <h1>We couldn’t find this order</h1>
              <p>Please open the link from your e-mail again. If you paid and it still doesn’t work, message us on WhatsApp with your e-mail address and we’ll sort it out.</p>
              <Link className="se-btn se-btn--primary" href={EBOOK.pagePath}>Back to Sweet Escape</Link>
            </>
          )}
        </div>

        {phase === 'paid' && (
          <div className="se-next">
            <h2>Want someone else to do the baking?</h2>
            <div className="se-next__grid">
              <Link href="/caixas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/box1.jpg" alt="" loading="lazy" />
                <div><b>The Tasting Box</b><span>Dolly’s treats, fresh from our kitchen in Itamambuca.</span></div>
              </Link>
              <Link href="/cursos">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dolly-course1.jpg" alt="" loading="lazy" />
                <div><b>Cook with Dolly</b><span>Hands-on courses to go further than the book.</span></div>
              </Link>
              <Link href="/retreats">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/retreats/real-itamambuca-coast.jpg" alt="" loading="lazy" />
                <div><b>The retreat</b><span>Cook in the jungle kitchen itself, steps from the beach.</span></div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
