'use client';

import React from 'react';
import { AMAZON_EDITIONS, AMAZON_FORMATS, amazonLink, amazonPrice, type AmazonFormat } from '@/lib/ebook';
import { EBOOK_COPY, type EbookLang } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';

const jump = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Hero line: the book is published on Amazon (trust), and a tap jumps to the edition picker. */
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

/**
 * "Choose your edition": the PDF from the site next to the Kindle, paperback and hardcover on Amazon, at the top of
 * the offer. The PDF comes first and carries what only it has (instant, full-size photos, the reader's gift, the
 * promise); the US$ 32.99 hardcover beside it is the price anchor that makes the PDF the obvious deal, and the reader
 * who wants a printed book still finds it in one tap. Each Amazon card shows the cover the way you'd hold it.
 */
export default function AmazonEditions({ lang, img, price }: { lang: EbookLang; img: string; price: string }) {
  const a = EBOOK_COPY[lang].amazon;
  const edition = AMAZON_EDITIONS[lang]?.edition;
  if (!a || !edition) return null;
  const amzCover = `${img}/${edition}/cover.webp`;
  const click = (format: AmazonFormat) => trackMeta('AmazonClick', { content_name: `sweet-escape-${format}`, content_type: 'product' });

  return (
    <div className="se-ed" id="editions">
      <p className="se-kicker se-kicker--light">{a.kicker}</p>
      <h2 className="se-h2 se-h2--light">{a.title}</h2>
      <div className="se-ed__grid">
        <a href="#order" onClick={jump('order')} className="se-ed__pdf">
          <span className="se-ed__tag">★ {a.pdf.tag}</span>
          <span className="se-ed__pdfhead">
            <span className="se-ed__cover se-ed__cover--pdf" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${img}/${lang}/cover.webp`} alt="" loading="lazy" />
            </span>
            <span>
              <b className="se-ed__name">{a.pdf.name}</b>
              <span className="se-ed__price">{price}</span>
            </span>
          </span>
          <ul className="se-ed__perks">{a.pdf.perks.map(p => <li key={p}>{p}</li>)}</ul>
          <span className="se-btn se-btn--primary se-ed__go">{a.pdf.cta} ↓</span>
        </a>

        <div className="se-ed__amz">
          {AMAZON_FORMATS.map(f => (
            <a key={f} href={amazonLink(lang, f)!} target="_blank" rel="noopener noreferrer" onClick={() => click(f)} className="se-ed__item">
              {f === 'hardcover' && <span className="se-ed__gift">{a.giftTag}</span>}
              <span className={`se-ed__cover se-amz__cover--${f}`} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={amzCover} alt="" loading="lazy" />
              </span>
              <span className="se-ed__text">
                <b>{a.formats[f].name}</b>
                <span className="se-ed__amzprice">{amazonPrice(lang, f) ?? a.onAmazon}</span>
                <small>{a.formats[f].detail}</small>
              </span>
              <span className="se-ed__amzgo">{a.cta} ↗</span>
            </a>
          ))}
          {edition !== lang && a.edition && <p className="se-ed__edition">{a.edition}</p>}
        </div>
      </div>
    </div>
  );
}
