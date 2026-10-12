'use client';

import React from 'react';
import { AMAZON_FORMATS, amazonLink, type AmazonFormat } from '@/lib/ebook';
import { EBOOK_COPY, type EbookLang } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';

/**
 * "Also on Amazon": the Kindle, paperback and hardcover editions, as a quiet row under the order card. The PDF form
 * stays the offer; this only answers the reader who wants it on a Kindle or a shelf. Each format shows the cover
 * the way you'd hold it: in a Kindle, as a soft book, as a hardback with its spine.
 */
export default function AmazonEditions({ lang, cover }: { lang: EbookLang; cover: string }) {
  const a = EBOOK_COPY[lang].amazon;
  if (!a || !amazonLink(lang, 'kindle')) return null;
  const click = (format: AmazonFormat) => trackMeta('AmazonClick', { content_name: `sweet-escape-${format}`, content_type: 'product' });

  return (
    <div className="se-amz">
      <p className="se-amz__kicker"><span>{a.kicker}</span></p>
      <p className="se-amz__title">{a.title}</p>
      <ul className="se-amz__list">
        {AMAZON_FORMATS.map(f => (
          <li key={f}>
            <a href={amazonLink(lang, f)!} target="_blank" rel="noopener noreferrer" onClick={() => click(f)} className="se-amz__item">
              <span className={`se-amz__cover se-amz__cover--${f}`} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" loading="lazy" />
              </span>
              <span className="se-amz__text">
                <b>{a.formats[f].name}</b>
                <small>{a.formats[f].detail}</small>
              </span>
              <span className="se-amz__go">{a.cta} <span aria-hidden>↗</span></span>
            </a>
          </li>
        ))}
      </ul>
      <p className="se-amz__note">{a.note}</p>
    </div>
  );
}
