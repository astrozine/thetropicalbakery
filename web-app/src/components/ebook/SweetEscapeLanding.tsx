'use client';

import React, { useEffect } from 'react';
import ZoomableImage from '@/components/ZoomableImage';
import MobileBuyBar from '@/components/MobileBuyBar';
import RainbowJourney from './RainbowJourney';
import EbookBuyBox from './EbookBuyBox';
import { EnglishNotice, LangBar, rich, useGoogleTranslated } from './EbookLang';
import { BAKERY_TREAT_PRICE_BRL, BRL_PER_USD, EBOOK, RECIPES, TOTAL_TREATS } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';
import './sweetEscape.css';

const IMG = '/ebook/sweet-escape';
const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;

const BLOCK_ICONS = ['🥥', '🌴', '🌾', '✨', '🍓', '🌈'];
const PAGES = ['contents', 'page-rule', 'page-opener', 'page-recipe', 'page-why', 'page-benefits', 'page-purple', 'page-story'];
const PAIN_ICONS = ['🛒', '🥦', '🍪'];

/** "Sweet Escape" is a title: never let Google Translate turn it into "Doux Évasion". */
const Brand = ({ children = 'Sweet Escape' }: { children?: React.ReactNode }) => <span className="notranslate" translate="no">{children}</span>;

function BuyButton({ children }: { children: React.ReactNode }) {
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return <a href="#buy" onClick={go} className="se-btn se-btn--primary se-btn--big">{children}</a>;
}

export default function SweetEscapeLanding({ lang = 'en' }: { lang?: EbookLang }) {
  const c = EBOOK_COPY[lang];
  const translated = useGoogleTranslated();
  // Anyone not reading our English original is told, in their language, that the book is English.
  const foreign = lang !== 'en' || translated;
  // English readers see dollars (we still charge R$ 47; the form says so). Everyone else sees reais.
  const dollars = lang === 'en';
  const reais = `R$ ${EBOOK.priceBRL}`;
  const price = dollars ? `US$ ${EBOOK.priceUSD}` : reais;
  const eachUsd = Math.round(BAKERY_TREAT_PRICE_BRL / BRL_PER_USD);
  const each = dollars ? `US$ ${eachUsd}` : brl(BAKERY_TREAT_PRICE_BRL);
  const bakeryValue = dollars ? `US$ ${(TOTAL_TREATS * eachUsd).toLocaleString('en-US')}` : brl(TOTAL_TREATS * BAKERY_TREAT_PRICE_BRL);
  const v = { price, reais, pages: EBOOK.pages, n: TOTAL_TREATS, each, usd: EBOOK.priceUSD };

  useEffect(() => {
    trackMeta('ViewContent', { value: EBOOK.priceBRL, content_name: EBOOK.id, content_type: 'product' });
  }, []);

  const cta = fill(c.hero.cta, v);

  return (
    <div className="se" lang={lang}>
      <LangBar lang={lang} />

      {/* ══ HERO: the floating-photo style from /retreats, with the book itself in the middle ══ */}
      <section className="se-hero">
        <div className="se-hero__bg" />
        <div className="se-hero__grid se-wrap">
          <div className="se-hero__head">
            <p className="se-hero__eyebrow">{c.hero.eyebrow}</p>
            <h1 className="se-hero__title">
              <span className="se-script notranslate" translate="no">{c.hero.script}</span> {c.hero.title} <em>{c.hero.em}</em>
            </h1>
          </div>
          <div className="se-hero__body">
            <p className="se-hero__lead">{rich(c.hero.lead)}</p>
            {foreign && <EnglishNotice lang={lang} compact />}
            <div className="se-hero__cta">
              <BuyButton>{cta}</BuyButton>
              <ul className="se-hero__ticks">
                {c.hero.ticks.map(t => <li key={t}>{fill(t, v)}</li>)}
                <li className="se-hero__en">📖 {c.english.badge}</li>
              </ul>
            </div>
          </div>

          <div className="se-hero__stage" aria-hidden>
            <div className="se-book">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/cover.webp`} alt="" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--a" src={`${IMG}/red.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--b" src={`${IMG}/purple.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--c" src={`${IMG}/green.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--d" src={`${IMG}/chocolate.webp`} alt="" />
            <div className="se-hero__card">
              <b>7</b><span>{c.hero.card}<br />{c.hero.card2}</span>
            </div>
          </div>
        </div>
        <div className="se-rainbow" aria-hidden>{RECIPES.map(r => <i key={r.day} style={{ background: r.hex }} />)}</div>
      </section>

      {/* ══ THE PROBLEM ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap se-narrow">
          <p className="se-kicker">{c.problem.kicker}</p>
          <h2 className="se-h2">{c.problem.title1} <br className="se-br" />{c.problem.title2}</h2>
          <div className="se-pains">
            {c.problem.pains.map((p, n) => <p key={n}><span>{PAIN_ICONS[n]}</span>{p}</p>)}
          </div>
          <p className="se-bigidea">{rich(c.problem.bigIdea)}</p>
        </div>
      </section>

      {/* ══ THE SEVEN DAYS ══ */}
      <RainbowJourney lang={lang} />

      {/* ══ WHAT IT TEACHES ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap">
          <div className="se-narrow se-center">
            <p className="se-kicker">{c.learn.kicker}</p>
            <h2 className="se-h2">{c.learn.title}</h2>
            <p className="se-lead">{rich(c.learn.lead)}</p>
          </div>
          <div className="se-blocks">
            {c.learn.blocks.map((b, n) => (
              <div key={b.title} className="se-block" style={{ '--c': RECIPES[n].hex } as React.CSSProperties}>
                <span className="se-block__icon" aria-hidden>{BLOCK_ICONS[n]}</span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PEEK INSIDE ══ */}
      <section className="se-sec se-sec--peek">
        <div className="se-wrap">
          <div className="se-narrow se-center">
            <p className="se-kicker se-kicker--light">{c.peek.kicker}</p>
            <h2 className="se-h2 se-h2--light">{fill(c.peek.title, v)}</h2>
            <p className="se-lead se-lead--light">{c.peek.lead}</p>
          </div>
          <div className="se-pages">
            {PAGES.map((p, n) => (
              <div key={p} className="se-page" style={{ '--r': `${(n % 2 ? 1 : -1) * (1.5 + (n % 3))}deg` } as React.CSSProperties}>
                <ZoomableImage src={`${IMG}/${p}.webp`} alt={c.peek.alts[n]} thumbWidth={640} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR FAMILIES ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap se-family">
          <div className="se-family__photos" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-family__a" src={`${IMG}/red-scatter.webp`} alt="" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-family__b" src={`${IMG}/chocolate-cut.webp`} alt="" loading="lazy" />
          </div>
          <div>
            <p className="se-kicker">{c.family.kicker}</p>
            <h2 className="se-h2">{c.family.title}</h2>
            <p className="se-lead">{rich(c.family.lead)}</p>
            <ul className="se-checks">
              {c.family.checks.map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ THE MATH ══ */}
      <section className="se-sec se-sec--math">
        <div className="se-wrap se-narrow se-center">
          <p className="se-kicker">{c.math.kicker}</p>
          <h2 className="se-h2">{fill(c.math.title, v)}</h2>
          <div className="se-math">
            <div><b>{TOTAL_TREATS}</b><span>{c.math.treats}</span></div>
            <div><b>{bakeryValue}</b><span>{fill(c.math.bakery, v)}</span></div>
            <div className="is-hot"><b>{price}</b><span>{c.math.book}</span></div>
          </div>
          <p className="se-small">{c.math.small}</p>
        </div>
      </section>

      {/* ══ DOLLY ══ */}
      <section className="se-sec se-sec--story">
        <div className="se-wrap se-story">
          <div className="se-story__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dolly/dolly-portrait.jpg" alt={c.story.photoAlt} loading="lazy" />
            <span className="se-story__tag">Dolly · The Tropical Bakery</span>
          </div>
          <div className="se-story__text">
            <p className="se-kicker">{c.story.kicker}</p>
            <h2 className="se-h2">{c.story.title}</h2>
            {c.story.paragraphs.map((p, n) => <p key={n}>{rich(p)}</p>)}
            <p className="se-sign">{c.story.sign} <span className="se-script notranslate" translate="no">Dolly</span></p>
          </div>
        </div>
      </section>

      {/* ══ THE OFFER ══ */}
      <section className="se-sec se-sec--offer" id="buy">
        <div className="se-wrap se-offer">
          <div className="se-offer__stack">
            <p className="se-kicker se-kicker--light">{c.offer.kicker}</p>
            <h2 className="se-h2 se-h2--light">{c.offer.title}</h2>
            <ul className="se-stack">
              {c.offer.stack.map(s => (
                <li key={s.what} className={s.bonus ? 'is-bonus' : ''}>
                  <b>{s.what}</b>
                  <span>{fill(s.detail, v)}</span>
                </li>
              ))}
            </ul>
            <div className="se-guarantee">
              <span className="se-guarantee__seal" aria-hidden>7<small>{c.offer.promiseDays}</small></span>
              <div>
                <b>{c.offer.promiseTitle}</b>
                <p>{c.offer.promiseText}</p>
              </div>
            </div>
          </div>

          <div className="se-card">
            <div className="se-card__head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/cover.webp`} alt={c.offer.coverAlt} />
              <div>
                <p className="se-card__title"><Brand /></p>
                <p className="se-card__price">{price}</p>
                <p className="se-card__usd">{fill(c.offer.usd, v)}</p>
                <p className="se-card__en">📖 {c.english.badge}</p>
              </div>
            </div>
            {foreign && <EnglishNotice lang={lang} />}
            <EbookBuyBox lang={lang} needsEnglishTick={foreign} />
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap se-narrow">
          <p className="se-kicker se-center">{c.faq.kicker}</p>
          <h2 className="se-h2 se-center">{c.faq.title}</h2>
          <div className="se-faq">
            {c.faq.items.map((f, n) => (
              <details key={f.q} open={n === 0 && foreign}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CALL ══ */}
      <section className="se-final">
        <div className="se-final__photos" aria-hidden>
          {RECIPES.map(r => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={r.day} src={r.img} alt="" loading="lazy" style={{ borderColor: r.hex }} />
          ))}
        </div>
        <div className="se-wrap se-narrow se-center">
          <p className="se-final__line">{c.final.line}</p>
          <h2 className="se-final__title">{c.final.title1} <span className="se-script notranslate" translate="no">{c.final.script}</span> {c.final.title2}</h2>
          <BuyButton>{cta}</BuyButton>
          <p className="se-ps">{rich(fill(c.final.ps, v))}</p>
        </div>
      </section>

      <MobileBuyBar kicker={c.buyBar.kicker} price={price} note={c.buyBar.note} label={c.buyBar.label} targetId="#buy" />
    </div>
  );
}
