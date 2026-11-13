'use client';

import React, { useEffect } from 'react';
import ZoomableImage from '@/components/ZoomableImage';
import MobileBuyBar from '@/components/MobileBuyBar';
import RainbowJourney from './RainbowJourney';
import EbookBuyBox from './EbookBuyBox';
import AmazonEditions, { AmazonBadge, PdfPerks } from './AmazonEditions';
import { EditionNotice, EnglishNotice, LangBar, rich, useGoogleTranslated } from './EbookLang';
import { EBOOK, RECIPES, TOTAL_TREATS, stripeMoney } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';
import { trackMeta } from '@/lib/metaPixel';
import { useBookWallet } from './BookPay';
import './sweetEscape.css';

const IMG = '/ebook/sweet-escape';

const BLOCK_ICONS = ['🥥', '🌴', '🌾', '✨', '🍓', '🌈'];
/** The FAQ shows its first few questions; the rest wait behind one quiet fold. */
const FAQ_SHOWN = 3;
const MORE_QUESTIONS: Record<EbookLang, string> = { en: 'More questions', pt: 'Mais perguntas', es: 'Más preguntas', nl: 'Meer vragen', de: 'Weitere Fragen' };
const PAGES = ['contents', 'page-rule', 'page-opener', 'page-recipe', 'page-why', 'page-benefits', 'page-purple', 'page-story'];

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
  // On the English page, a visitor whose browser translated it (French, German, Italian...) gets the English edition:
  // tell them so in their language. Everyone else is told which editions exist.
  const foreign = translated;
  // Prices follow the buyer's wallet, not the page's language (BookPay): the R$ / US$ / € switch in the form moves them all.
  const { wallet } = useBookWallet(lang);
  const abroad = wallet !== 'brl';
  const reais = `R$ ${EBOOK.priceBRL}`;
  const price = wallet === 'eur' ? stripeMoney(EBOOK.priceEUR, 'eur') : abroad ? stripeMoney(EBOOK.priceUSD, 'usd') : reais;
  const v = { price, reais, pages: EBOOK.pages, n: TOTAL_TREATS, usd: EBOOK.priceUSD };

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
            {foreign ? <EnglishNotice lang={lang} compact /> : <EditionNotice lang={lang} compact />}
            <div className="se-hero__cta">
              <BuyButton>{cta}</BuyButton>
              <ul className="se-hero__ticks">
                {c.hero.ticks.map(t => <li key={t}>{fill(t, v)}</li>)}
                <li className="se-hero__en">📖 {foreign ? c.english.badge : c.edition.badge}</li>
              </ul>
              <AmazonBadge lang={lang} />
            </div>
          </div>

          <div className="se-hero__stage" aria-hidden>
            <div className="se-book">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/${lang}/cover.webp`} alt="" />
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

      {/* ══ THE BIG IDEA + THE SEVEN DAYS + A PEEK INSIDE: one colorful section. The parents list and the six
          building blocks wait behind "read more" taps. ══ */}
      <RainbowJourney
        lang={lang}
        intro={
          <div className="se-narrow se-center se-journey__intro">
            <p className="se-kicker se-kicker--ink" data-sign="🤔">{c.problem.kicker}</p>
            <h2 className="se-h2 se-journey__h2">{c.problem.title1} <br className="se-br" />{c.problem.title2}</h2>
            <p className="se-bigline">{rich(c.problem.bigIdea)}</p>
            <details className="se-more se-more--ink">
              <summary>{c.family.kicker}</summary>
              <ul className="se-checks se-checks--soft">
                {c.family.checks.map(t => <li key={t}>{t}</li>)}
              </ul>
            </details>
            <h3 className="se-journey__sub">{c.journey.title}</h3>
          </div>
        }
      >
        <div className="se-peek">
          <h3 className="se-journey__sub">{fill(c.peek.title, v)}</h3>
          <div className="se-pages se-pages--mini">
            {PAGES.map((p, n) => (
              <div key={p} className="se-page" style={{ '--r': `${(n % 2 ? 1 : -1) * (1 + (n % 2))}deg` } as React.CSSProperties}>
                <ZoomableImage src={`${IMG}/${lang}/${p}.webp`} alt={c.peek.alts[n]} thumbWidth={640} loading="lazy" />
              </div>
            ))}
          </div>
          <details className="se-more se-more--ink">
            <summary>{c.learn.title}</summary>
            <p>{rich(c.learn.lead)}</p>
            <dl>
              {c.learn.blocks.map((b, n) => <React.Fragment key={b.title}><dt><span aria-hidden>{BLOCK_ICONS[n]}</span> {b.title}</dt><dd>{b.text}</dd></React.Fragment>)}
            </dl>
          </details>
        </div>
      </RainbowJourney>

      {/* ══ DOLLY: a face and a few lines; the rest of her story one tap away ══ */}
      <section className="se-sec se-sec--story se-sec--calm">
        <div className="se-wrap se-narrow">
          <div className="se-dolly__head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-dolly" src="/dolly/dolly-portrait.jpg" alt={c.story.photoAlt} loading="lazy" />
            <div>
              <p className="se-kicker" data-sign="📖">{c.story.kicker}</p>
              <h2 className="se-h2 se-dolly__title">{c.story.title}</h2>
            </div>
          </div>
          <p className="se-dolly__line">{rich(c.story.paragraphs[c.story.paragraphs.length - 1])}</p>
          <details className="se-more">
            <summary>{c.story.kicker}</summary>
            {c.story.paragraphs.slice(0, -1).map((p, n) => <p key={n}>{rich(p)}</p>)}
          </details>
          <p className="se-sign">{c.story.sign} <span className="se-script notranslate" translate="no">Dolly</span></p>
        </div>
      </section>

      {/* ══ THE OFFER ══ */}
      <section className="se-sec se-sec--offer se-sec--calm" id="buy">
        <div className="se-wrap se-offer">
          <div className="se-offer__stack">
            <h2 className="se-h2 se-h2--light">{c.offer.title}</h2>
            <details className="se-more se-more--light se-stackfold">
              <summary>{c.offer.kicker} ({c.offer.stack.length})</summary>
              <ul className="se-stack se-stack--lite">
                {c.offer.stack.map(s => (
                  <li key={s.what} className={s.bonus ? 'is-bonus' : ''}>
                    <b>{s.what}</b>
                    <span>{fill(s.detail, v)}</span>
                  </li>
                ))}
              </ul>
            </details>
            <div className="se-guarantee">
              <span className="se-guarantee__seal" aria-hidden>7<small>{c.offer.promiseDays}</small></span>
              <div>
                <b>{c.offer.promiseTitle}</b>
                <p>{c.offer.promiseText}</p>
              </div>
            </div>
          </div>

          <div className="se-offer__buy">
            <div className="se-card" id="order">
              <div className="se-card__head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/${lang}/cover.webp`} alt={c.offer.coverAlt} />
                <div>
                  <p className="se-card__title"><Brand /></p>
                  <p className="se-card__price">{price}</p>
                  <p className="se-card__usd">{fill(c.offer.usd, v)}</p>
                  <p className="se-card__en">📖 {foreign ? c.english.badge : c.edition.badge}</p>
                </div>
              </div>
              <PdfPerks lang={lang} />
              <EbookBuyBox lang={lang} translated={translated} />
            </div>
            <AmazonEditions lang={lang} img={IMG} />
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="se-sec se-sec--cream se-sec--calm">
        <div className="se-wrap se-narrow">
          <h2 className="se-h2 se-center">{c.faq.title}</h2>
          <div className="se-faq">
            {c.faq.items.slice(0, FAQ_SHOWN).map((f, n) => (
              <details key={f.q} open={n === 0 && foreign}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          {c.faq.items.length > FAQ_SHOWN && (
            <details className="se-more se-faq__more">
              <summary>{MORE_QUESTIONS[lang]}</summary>
              <div className="se-faq">
                {c.faq.items.slice(FAQ_SHOWN).map(f => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </details>
          )}
          <div className="se-center se-closing">
            <h2 className="se-final__title">{c.final.title1} <span className="se-script notranslate" translate="no">{c.final.script}</span> {c.final.title2}</h2>
            <BuyButton>{cta}</BuyButton>
          </div>
        </div>
      </section>

      <MobileBuyBar kicker={c.buyBar.kicker} price={price} note={c.buyBar.note} label={c.buyBar.label} targetId="#buy" />
    </div>
  );
}
