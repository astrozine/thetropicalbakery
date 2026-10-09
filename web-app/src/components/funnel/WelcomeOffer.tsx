'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { BOOK_OFFERS, EBOOK } from '@/lib/ebook';
import { LANG_PATH, fill, type EbookLang } from '@/lib/ebookCopy';
import { FUNNEL_COPY } from '@/lib/funnel';
import { trackMeta } from '@/lib/metaPixel';
import { rich } from '@/components/ebook/EbookLang';
import EbookBuyBox from '@/components/ebook/EbookBuyBox';
import { priceIn, useBookWallet } from '@/components/ebook/BookPay';
import '@/components/ebook/sweetEscape.css';
import './funnel.css';

/**
 * /free-recipes/oferta?t=…: the downsell from the day-5 and day-7 e-mails. The page only shows the welcome price when
 * the server found the link valid (`expiresAt`); the order form sends the same link along and the server checks it
 * again before pricing. An expired or made-up link gets a friendly "it ended" and the normal sales page.
 */
export default function WelcomeOffer({ lang, token, expiresAt }: { lang: EbookLang; token: string; expiresAt: string | null }) {
  const c = FUNNEL_COPY[lang].offer;
  const pt = lang === 'pt';
  const { wallet } = useBookWallet(lang);
  const welcome = priceIn(wallet, BOOK_OFFERS.welcome);
  const full = priceIn(wallet, BOOK_OFFERS.full);

  useEffect(() => {
    if (expiresAt) trackMeta('ViewContent', { value: BOOK_OFFERS.welcome.brl, content_name: `${EBOOK.id}-welcome`, content_type: 'product' });
  }, [expiresAt]);

  if (!expiresAt) {
    return (
      <div className="se se-thanks fr-thanks" lang={lang}>
        <div className="se-wrap"><div className="se-thanks__card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="se-thanks__cover" src={`/ebook/sweet-escape/${lang}/cover.webp`} alt="Sweet Escape" />
          <h1>{c.expiredTitle}</h1>
          <p>{c.expiredText}</p>
          <Link className="se-btn se-btn--primary se-btn--big" href={LANG_PATH[lang]}>{c.expiredCta}</Link>
        </div></div>
      </div>
    );
  }

  const date = new Date(expiresAt).toLocaleDateString(pt ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'nl' ? 'nl-NL' : 'en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="se se-thanks fr-thanks" lang={lang}>
      <div className="se-wrap">
        <div className="se-thanks__card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="se-thanks__cover" src={`/ebook/sweet-escape/${lang}/cover.webp`} alt="Sweet Escape" />
          <p className="se-kicker">{c.kicker}</p>
          <h1>{fill(c.title, { price: welcome })}</h1>
          <p>{rich(fill(c.text, { price: welcome, full }))}</p>
          <p className="fr-offer__price">{welcome}</p>
          <p className="fr-offer__was">{fill(c.was, { full })}</p>
          <span className="fr-offer__until">⏳ {fill(c.until, { date })}</span>
        </div>
        <div className="fr-block">
          <EbookBuyBox lang={lang} offer={token} />
        </div>
      </div>
    </div>
  );
}
