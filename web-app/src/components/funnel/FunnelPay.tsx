'use client';

import React, { useEffect, useState } from 'react';
import { BOOK_OFFERS } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';
import { rich } from '@/components/ebook/EbookLang';

/**
 * The two payment pieces the free-recipes pages share: which ways to pay are switched on (the same rules as the book's
 * own order form, EbookBuyBox), and the Pix QR shown in place when someone pays that way. Words come from the
 * book's copy (ebookCopy.ts form), so the funnel and the sales page say the same thing.
 */

export type PayMethod = 'card' | 'pix' | 'paypal' | 'stripe';

export function usePayMethods(lang: EbookLang) {
  const [methods, setMethods] = useState({ card: false, paypal: false, stripe: false });
  const [method, setMethod] = useState<PayMethod>('pix');
  useEffect(() => {
    fetch('/api/pay/methods', { cache: 'no-store' })
      .then(r => r.json())
      .then(m => {
        setMethods({ card: !!m.card, paypal: !!m.paypal, stripe: !!m.stripe });
        // Outside Brazil a card goes through Stripe (in dollars); in Portuguese through Mercado Pago.
        if (m.stripe && lang !== 'pt') setMethod('stripe');
        else if (m.card) setMethod('card');
      })
      .catch(() => {});
  }, [lang]);
  return { methods, method, setMethod };
}

/** What the chosen way charges for the book at full price: dollars through Stripe, reais otherwise. */
export const bookPrice = (method: PayMethod) => (method === 'stripe' ? `US$ ${BOOK_OFFERS.full.usd}` : `R$ ${BOOK_OFFERS.full.brl}`);
/** The price to show before a way is chosen: dollars for everyone but Portuguese readers. */
export const shownPrice = (lang: EbookLang) => (lang === 'pt' ? `R$ ${BOOK_OFFERS.full.brl}` : `US$ ${BOOK_OFFERS.full.usd}`);

export function PayPicker({ lang, methods, method, setMethod, legend }: {
  lang: EbookLang;
  methods: { card: boolean; paypal: boolean; stripe: boolean };
  method: PayMethod;
  setMethod: (m: PayMethod) => void;
  legend: string;
}) {
  const f = EBOOK_COPY[lang].form;
  const options: { id: PayMethod; label: string; note: string; show: boolean }[] = [
    { id: 'stripe', label: f.card, note: 'Visa · Mastercard · Apple Pay', show: methods.stripe && lang !== 'pt' },
    { id: 'card', label: f.card, note: f.cardNote, show: methods.card && (lang === 'pt' || !methods.stripe) },
    { id: 'pix', label: f.pix, note: f.pixMethodNote, show: true },
    { id: 'paypal', label: f.paypal, note: f.paypalNote, show: methods.paypal },
  ];
  return (
    <>
      <fieldset className="se-methods">
        <legend>{legend}</legend>
        {options.filter(o => o.show).map(o => (
          <label key={o.id} className={`se-method${method === o.id ? ' is-on' : ''}`}>
            <input type="radio" name="fr-method" value={o.id} checked={method === o.id} onChange={() => setMethod(o.id)} />
            <b>{o.label}</b>
            <small>{o.note}</small>
          </label>
        ))}
      </fieldset>
      {f.currencyNote && method !== 'stripe' && lang !== 'pt' && (
        <p className="se-currency">{fill(f.currencyNote, { reais: `R$ ${BOOK_OFFERS.full.brl}`, usd: BOOK_OFFERS.full.usd })}</p>
      )}
    </>
  );
}

export function PixBox({ lang, payload, base64, email, next, nextLabel }: {
  lang: EbookLang; payload: string; base64: string; email: string; next: string; nextLabel?: string;
}) {
  const f = EBOOK_COPY[lang].form;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(payload); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* visible to copy by hand */ }
  };
  return (
    <div className="se-pix">
      <p className="se-pix__title">{fill(f.pixTitle, { price: `R$ ${BOOK_OFFERS.full.brl}` })}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="se-pix__qr" src={base64} alt="Pix QR code" width={220} height={220} />
      <p className="se-pix__label">{f.pixLabel}</p>
      <div className="se-pix__code notranslate" translate="no">{payload}</div>
      <button type="button" className="se-btn se-btn--ghost" onClick={copy}>{copied ? f.pixCopied : f.pixCopy}</button>
      <p className="se-pix__note">{rich(fill(f.pixNote, { email }))}</p>
      <a className="se-btn se-btn--primary" href={next}>{nextLabel || f.pixPaid}</a>
    </div>
  );
}

/** The server answers with full addresses on the live domain; on the same site we only need the path. */
export const toPath = (url: string) => {
  try { const u = new URL(url); return u.pathname + u.search; } catch { return url; }
};
