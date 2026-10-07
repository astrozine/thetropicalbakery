'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EBOOK } from '@/lib/ebook';
import { trackMeta } from '@/lib/metaPixel';

export type EbookPhase = 'checking' | 'paid' | 'waiting' | 'failed' | 'unknown';

/**
 * Follows one e-book order from a return page: confirms a card / PayPal / Stripe payment with the provider (never
 * trusting the URL), then asks the server until it is paid. Pix is confirmed by hand, so while waiting it checks
 * again every 20 s. Reads the provider's own return parameters from the address; `ref` and `k` identify the order.
 * Used by the book's thank-you page and the free-recipes one.
 */
export function useEbookPayment(ref: string, k: string) {
  const q = useSearchParams();
  const provider = q.get('provider') || '';
  const result = q.get('result') || '';
  const paypalToken = q.get('token') || '';
  const mpPaymentId = q.get('payment_id') || q.get('collection_id') || '';
  const stripeSession = q.get('session_id') || '';

  const [phase, setPhase] = useState<EbookPhase>(ref && k ? 'checking' : 'unknown');
  const [firstName, setFirstName] = useState('');
  const [method, setMethod] = useState('');
  const [book, setBook] = useState('');
  const ran = useRef(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (ran.current || !ref || !k) return;
    ran.current = true;
    let stop = false;

    const check = async (): Promise<EbookPhase> => {
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

  return { phase, firstName, method, book, provider };
}
