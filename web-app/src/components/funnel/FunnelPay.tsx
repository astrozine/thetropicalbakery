'use client';

import React, { useState } from 'react';
import { BOOK_OFFERS } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';
import { rich } from '@/components/ebook/EbookLang';

/**
 * The payment pieces the free-recipes pages share: the picker (from BookPay, the same as the book's own order form)
 * and the Pix QR shown in place when someone pays that way. Words come from the
 * book's copy (ebookCopy.ts form), so the funnel and the sales page say the same thing.
 */

// Which ways to pay are on, the R$ / US$ switch and the picker live with the book's own form (BookPay), so the funnel
// and the sales page always offer the same choices.
export { usePayMethods, PayPicker, priceFor as bookPrice, priceIn as shownPrice } from '@/components/ebook/BookPay';
export type { PayMethod, Wallet } from '@/components/ebook/BookPay';

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
