'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EBOOK, BOOK_OFFERS, RECIPES } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';
import { FUNNEL, FUNNEL_COPY, SEGMENTS, freeCover, type Segment } from '@/lib/funnel';
import { trackMeta } from '@/lib/metaPixel';
import { rich } from '@/components/ebook/EbookLang';
import { PayPicker, PixBox, bookPrice, shownPrice, toPath, usePayMethods } from './FunnelPay';
import '@/components/ebook/sweetEscape.css';
import './funnel.css';

const IMG = '/ebook/sweet-escape';
const SEG_ICON: Record<Segment, string> = { local: '🌴', visiting: '🧳', away: '🌍' };
const isFree = (day: number) => (FUNNEL.recipeDays as readonly number[]).includes(day);

const Lock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" /></svg>
);

/**
 * /free-recipes (and /receitas, /free-recipes/es, /nl): where the ads land. One job: get the e-mail. The form sits in
 * the hero; under it, the order bump (the full book, ticked = it is bought with the same form). "Where are you?"
 * splits people for the thank-you page and the e-mails: around Ubatuba / Paraty they also see the local offers.
 */
export default function FreeRecipesLanding({ lang = 'en' }: { lang?: EbookLang }) {
  const c = FUNNEL_COPY[lang];
  const f = c.form;
  const book = EBOOK_COPY[lang].recipes;
  const { methods, method, setMethod } = usePayMethods(lang);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState<Segment | null>(null);
  const [bump, setBump] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<{ payload: string; base64: string; thanks: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const utm = useRef<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackMeta('ViewContent', { content_name: 'free-recipes', content_type: 'product', value: 0 });
    const q = new URLSearchParams(window.location.search);
    utm.current = {
      utm_source: q.get('utm_source') || '',
      utm_campaign: q.get('utm_campaign') || '',
      utm_content: q.get('utm_content') || '',
      referrer: document.referrer || '',
    };
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (!s) return;
      setToken(s.access_token);
      const meta = s.user.user_metadata || {};
      setName(n => n || String(meta.full_name || meta.name || '').split(' ')[0]);
      setEmail(e => e || s.user.email || '');
    }).catch(() => {});
  }, []);

  const toForm = (e: React.MouseEvent) => {
    e.preventDefault();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => formRef.current?.querySelector('input')?.focus({ preventScroll: true }), 500);
  };

  // "Yes, I want all 7": tick the order bump and take them to the form.
  const wantAll = (e: React.MouseEvent) => { setBump(true); toForm(e); };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');
    if (name.trim().length < 1) return setError(f.errName);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError(f.errEmail);
    if (!segment) return setError(f.errWhere);
    setBusy(true);
    try {
      const r = await fetch('/api/free-recipes/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, email, lang, segment, ...utm.current, bump: bump ? { payMethod: method } : null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || f.errGeneric);
      trackMeta('Lead', { content_name: 'free-recipes', value: 0 });
      if (bump) trackMeta('InitiateCheckout', { value: BOOK_OFFERS.full.brl, content_name: EBOOK.id, content_type: 'product', num_items: 1 });
      if (j.url) { window.location.href = j.url; return; }
      if (j.book?.pix) {
        setPix({ payload: j.book.pix.payload, base64: j.book.pix.base64, thanks: `${toPath(j.thanks)}&provider=pix` });
        setBusy(false);
        return;
      }
      window.location.href = toPath(j.thanks);
    } catch (e) {
      setError(e instanceof Error ? e.message : f.errGeneric);
      setBusy(false);
    }
  };

  const price = bump ? bookPrice(method) : shownPrice(lang);
  const full = shownPrice(lang);

  return (
    <div className="se fr" lang={lang}>
      {/* ══ HERO: the floating-photo style, the free mini-book in the middle, the form right there ══ */}
      <section className="se-hero fr-hero">
        <div className="se-hero__bg" />
        <div className="se-hero__grid se-wrap">
          <div className="se-hero__head">
            <p className="se-hero__eyebrow">{c.hero.eyebrow}</p>
            <h1 className="se-hero__title">{c.hero.title} <em>{c.hero.em}</em></h1>
          </div>

          {/* The paid book behind, the free mini-book pulled out of it in front: "these two come from that one". */}
          <div className="se-hero__stage fr-stage" aria-hidden>
            <div className="fr-paid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/${lang}/cover.webp`} alt="" />
              <span className="fr-paid__tag">{fill(c.hero.paidTag, { price: full })}</span>
            </div>
            <div className="se-book">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={freeCover(lang)} alt="" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--b" src={`${IMG}/red.webp`} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="se-float se-float--d" src={`${IMG}/caramel.webp`} alt="" />
            <div className="se-hero__card fr-badge"><b>2</b><span><strong>{c.hero.badge}</strong>{c.hero.badgeOf}</span></div>
          </div>

          <div className="se-hero__body">
            <p className="se-hero__lead">{rich(c.hero.lead)}</p>
            <ul className="se-hero__ticks fr-ticks">{c.hero.ticks.map(t => <li key={t}>{t}</li>)}</ul>
          </div>

          {/* ══ 2 OF 7: the whole book, the two free recipes lit up. On wide screens it sits beside the form. ══ */}
          <div className="fr-seven">
            <ol className="fr-seven__row">
              {RECIPES.map((r, i) => (
                <li key={r.day} className={isFree(r.day) ? 'is-free' : ''} style={{ '--c': r.hex } as React.CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.img} alt={book[i].name} />
                  {isFree(r.day) ? <span className="fr-seven__free">{c.strip.free}</span> : <span className="fr-seven__lock"><Lock /></span>}
                </li>
              ))}
            </ol>
            <p className="fr-seven__label">{rich(c.strip.label)}</p>
            <p className="fr-seven__worth">{rich(fill(c.strip.worth, { price: full }))}</p>
          </div>

          <div className="fr-card" ref={formRef} id="get">
            {pix ? (
              <PixBox lang={lang} payload={pix.payload} base64={pix.base64} email={email} next={pix.thanks} />
            ) : (
              <form className="se-form" onSubmit={submit} noValidate>
                <p className="fr-card__title">{f.title}</p>
                <label className="se-field">
                  <span>{f.name}</span>
                  <input value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" required />
                </label>
                <label className="se-field">
                  <span>{f.email}</span>
                  <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </label>

                <fieldset className="fr-where">
                  <legend>{f.where}</legend>
                  {SEGMENTS.map(s => (
                    <label key={s} className={segment === s ? 'is-on' : ''}>
                      <input type="radio" name="fr-where" value={s} checked={segment === s} onChange={() => setSegment(s)} />
                      <span aria-hidden>{SEG_ICON[s]}</span> {f.segments[s]}
                    </label>
                  ))}
                </fieldset>

                {/* ══ ORDER BUMP ══ */}
                <div className={`fr-bump${bump ? ' is-on' : ''}`}>
                  <label className="fr-bump__head">
                    <input type="checkbox" checked={bump} onChange={e => setBump(e.target.checked)} />
                    <span className="fr-bump__arrow" aria-hidden>➜</span>
                    <span><small>{c.bump.tag}</small><b>{c.bump.title}</b></span>
                  </label>
                  <div className="fr-bump__body">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${IMG}/${lang}/cover.webp`} alt="Sweet Escape" loading="lazy" />
                    <p>{rich(fill(c.bump.text, { pages: EBOOK.pages, price: shownPrice(lang) }))}</p>
                  </div>
                  {bump && <PayPicker lang={lang} methods={methods} method={method} setMethod={setMethod} legend={c.bump.pay} />}
                </div>

                {error && <p className="se-error" role="alert">{error}</p>}
                <button type="submit" className="se-btn se-btn--primary se-btn--big" disabled={busy}>
                  {busy ? f.busy : bump ? fill(f.submitBump, { price }) : f.submit}
                </button>
                <p className="se-form__fine">{f.fine}</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══ THE TWO RECIPES ══ */}
      <section className="se-sec se-sec--cream">
        <div className="se-wrap">
          <div className="se-narrow se-center">
            <p className="se-kicker">{c.recipes.kicker}</p>
            <h2 className="se-h2">{c.recipes.title}</h2>
          </div>
          <div className="fr-recipes">
            {c.recipes.items.map((r, i) => (
              <article key={r.name} className="fr-recipe" style={{ '--c': i === 0 ? '#e8364f' : '#c9853c' } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/${i === 0 ? 'red-scatter' : 'caramel-close'}.webp`} alt={r.name} loading="lazy" />
                <span className="fr-recipe__free">{c.strip.free}</span>
                <div>
                  <small>{r.note}</small>
                  <h3>{r.name}</h3>
                  <p>{r.line}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ THE OTHER FIVE: still in the book ══ */}
      <section className="se-sec fr-rest">
        <div className="se-wrap">
          <div className="se-narrow se-center">
            <p className="se-kicker">{c.rest.kicker}</p>
            <h2 className="se-h2">{c.rest.title}</h2>
          </div>
          <ul className="fr-rest__grid">
            {RECIPES.map((r, i) => isFree(r.day) ? null : (
              <li key={r.day} style={{ '--c': r.hex, '--ink': r.ink } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.img} alt={book[i].alt} loading="lazy" />
                <span className="fr-rest__lock"><Lock /></span>
                <div><small>{book[i].color}</small><b>{book[i].name}</b></div>
              </li>
            ))}
          </ul>
          <div className="se-narrow se-center">
            <p className="fr-rest__text">{rich(fill(c.rest.text, { price: full }))}</p>
            <a href="#get" onClick={wantAll} className="se-btn se-btn--primary se-btn--big">{c.rest.cta}</a>
          </div>
        </div>
      </section>

      {/* ══ DOLLY ══ */}
      <section className="se-sec se-sec--story">
        <div className="se-wrap se-story">
          <div className="se-story__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dolly/dolly-portrait.jpg" alt="Dolly" loading="lazy" />
            <span className="se-story__tag">Dolly · The Tropical Bakery</span>
          </div>
          <div className="se-story__text">
            <p className="se-kicker">{c.dolly.kicker}</p>
            <h2 className="se-h2">{c.dolly.title}</h2>
            <p>{c.dolly.text}</p>
            <p className="se-sign">{c.dolly.sign} <span className="se-script notranslate" translate="no">Dolly</span></p>
          </div>
        </div>
      </section>

      {/* ══ FINAL CALL ══ */}
      <section className="se-final">
        <div className="se-final__photos" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {RECIPES.map(r => <img key={r.day} src={r.img} alt="" loading="lazy" style={{ borderColor: r.hex }} />)}
        </div>
        <div className="se-wrap se-narrow se-center">
          <h2 className="se-final__title">{c.final.title}</h2>
          <a href="#get" onClick={toForm} className="se-btn se-btn--primary se-btn--big">{c.final.cta}</a>
        </div>
      </section>
    </div>
  );
}
