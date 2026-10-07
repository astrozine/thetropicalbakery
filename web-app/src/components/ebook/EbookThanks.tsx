'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EBOOK_COPY, fill, isEbookLang, LANG_LABEL, LANG_PATH } from '@/lib/ebookCopy';
import { rich } from './EbookLang';
import { useEbookPayment } from './useEbookPayment';
import './sweetEscape.css';

const NEXT = [
  { href: '/caixas', img: '/box1.jpg' },
  { href: '/cursos', img: '/dolly-course1.jpg' },
  { href: '/retreats', img: '/retreats/real-itamambuca-coast.jpg' },
];

/**
 * Where every buyer lands: back from Mercado Pago / PayPal, after "I've paid" on Pix, and from the link in
 * the e-mails. useEbookPayment confirms the payment and waits for it; this shows the download button.
 * Speaks the language the buyer read the sales page in (?lang=).
 */
export default function EbookThanks() {
  const q = useSearchParams();
  const ref = q.get('ref') || '';
  const k = q.get('k') || '';
  const langParam = q.get('lang');
  const lang = isEbookLang(langParam) ? langParam : 'en';
  const c = EBOOK_COPY[lang].thanks;
  const fileError = q.get('erro') === '1';
  const { phase, firstName, method, book, provider } = useEbookPayment(ref, k);

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
