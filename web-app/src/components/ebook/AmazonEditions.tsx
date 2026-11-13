'use client';

import React from 'react';
import { AMAZON_EDITIONS, AMAZON_FORMATS, amazonLink, amazonPrice, type AmazonFormat } from '@/lib/ebook';
import { EBOOK_COPY, type EbookLang } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';

const jump = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Hero line: the book is published on Amazon (trust), and a tap jumps to the Amazon editions. */
export function AmazonBadge({ lang }: { lang: EbookLang }) {
  const a = EBOOK_COPY[lang].amazon;
  if (!a || !AMAZON_EDITIONS[lang]) return null;
  return (
    <a href="#editions" onClick={jump('editions')} className="se-amzbadge">
      <span className="se-amzbadge__logo notranslate" translate="no">amazon</span>
      <span>{a.badge}</span>
    </a>
  );
}

/** The PDF's own advantages (instant, sharper photos, the reader's gift, the promise), shown inside the order card. */
export function PdfPerks({ lang }: { lang: EbookLang }) {
  const a = EBOOK_COPY[lang].amazon;
  if (!a) return null;
  return <ul className="se-ed__perks se-card__perks">{a.pdf.perks.map(p => <li key={p}>{p}</li>)}</ul>;
}

/**
 * Kindle, paperback and hardcover on Amazon, as one quiet row under the order card. The PDF (the order card above
 * it) stays the main offer; the US$ 32.99 hardcover still sits close enough to work as the price anchor, and the
 * reader who wants a printed book finds it in one tap. Each card shows the cover the way you'd hold it.
 */
export default function AmazonEditions({ lang, img }: { lang: EbookLang; img: string }) {
  const a = EBOOK_COPY[lang].amazon;
  const edition = AMAZON_EDITIONS[lang]?.edition;
  if (!a || !edition) return null;
  const amzCover = `${img}/${edition}/cover.webp`;
  const click = (format: AmazonFormat) => trackMeta('AmazonClick', { content_name: `sweet-escape-${format}`, content_type: 'product' });

  return (
    <div className="se-amzrow" id="editions">
      <p className="se-amzrow__title">
        <span className="se-amzbadge__logo notranslate" translate="no">amazon</span> {a.badge}
      </p>
      <div className="se-amzrow__grid">
        {AMAZON_FORMATS.map(f => (
          <a key={f} href={amazonLink(lang, f)!} target="_blank" rel="noopener noreferrer" onClick={() => click(f)} className="se-amzrow__item">
            {f === 'hardcover' && <span className="se-ed__gift">{a.giftTag}</span>}
            <span className={`se-ed__cover se-amz__cover--${f}`} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={amzCover} alt="" loading="lazy" />
            </span>
            <b>{a.formats[f].name}</b>
            <span className="se-ed__amzprice">{amazonPrice(lang, f) ?? a.onAmazon}</span>
            <span className="se-amzrow__go">{a.cta} ↗</span>
          </a>
        ))}
      </div>
      {edition !== lang && a.edition && <p className="se-ed__edition">{a.edition}</p>}
    </div>
  );
}
