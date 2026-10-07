'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BOOK_OFFERS, EBOOK, RECIPES } from '@/lib/ebook';
import { EBOOK_COPY, LANG_PATH, fill, isEbookLang } from '@/lib/ebookCopy';
import { FUNNEL, FUNNEL_COPY, INTERESTS, freeCover, freePdf, isNearby, isSegment, type Interest, type Segment } from '@/lib/funnel';
import { trackMeta } from '@/lib/metaPixel';
import { rich } from '@/components/ebook/EbookLang';
import { useEbookPayment } from '@/components/ebook/useEbookPayment';
import { PERK_COPY } from '@/lib/bookPerk';
import { PayPicker, PixBox, bookPrice, toPath, usePayMethods } from './FunnelPay';
import '@/components/ebook/sweetEscape.css';
import './funnel.css';

interface Lead { found: boolean; firstName?: string; email?: string; interest?: Interest | null; book?: { ref: string; k: string } | null }

/**
 * /free-recipes/obrigado: everyone lands here after signing up (and back from paying for the book). In order:
 *  1. the recipes, downloadable right away;
 *  2. the book: its payment status if they bought it (bump or here), otherwise the one-time offer, one tap, nothing
 *     to retype;
 *  3. around Ubatuba / Paraty: "what would you love most?" and ONE matching next step (box → subscription, brunch,
 *     course, events menu); everyone else, a line about the kitchen;
 *  4. a WhatsApp button to pass the free recipes on.
 * Works without its lead row (migration 43 not run): language and segment also travel in the address.
 */
export default function FreeRecipesThanks() {
  const q = useSearchParams();
  const id = q.get('l') || '';
  const langParam = q.get('lang');
  const lang = isEbookLang(langParam) ? langParam : 'en';
  const segParam = q.get('s');
  const segment: Segment = isSegment(segParam) ? segParam : 'away';
  const c = FUNNEL_COPY[lang];
  const t = c.thanks;

  const [lead, setLead] = useState<Lead | null>(id ? null : { found: false });
  const [ref, setRef] = useState(q.get('ref') || '');
  const [k, setK] = useState(q.get('k') || '');
  const pay = useEbookPayment(ref, k);
  const { methods, method, setMethod } = usePayMethods(lang);
  const [declined, setDeclined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<{ payload: string; base64: string; next: string } | null>(null);
  const [interest, setInterest] = useState<Interest | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/free-recipes/lead?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then((j: Lead) => {
        setLead(j);
        if (j.interest) setInterest(j.interest);
        // Came back from an e-mail link without the order in the address: follow the book they already ordered.
        if (j.book && !q.get('ref')) { setRef(j.book.ref); setK(j.book.k); }
      })
      .catch(() => setLead({ found: false }));
  }, [id, q]);

  const buy = async () => {
    setError('');
    setBusy(true);
    trackMeta('InitiateCheckout', { value: BOOK_OFFERS.full.brl, content_name: EBOOK.id, content_type: 'product', num_items: 1 });
    try {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const token = data.session?.access_token;
      const r = await fetch('/api/free-recipes/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id, payMethod: method }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || c.form.errGeneric);
      if (j.url) { window.location.assign(j.url); return; }
      if (j.pix) {
        setPix({ payload: j.pix.payload, base64: j.pix.base64, next: `${toPath(j.thanks)}&provider=pix` });
        setBusy(false);
        return;
      }
      throw new Error(c.form.errGeneric);
    } catch (e) {
      setError(e instanceof Error ? e.message : c.form.errGeneric);
      setBusy(false);
    }
  };

  const pick = (i: Interest) => {
    setInterest(i);
    if (id) fetch('/api/free-recipes/lead', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, interest: i }) }).catch(() => {});
  };

  if (id && !lead) {
    return (
      <div className="se se-thanks fr-thanks" lang={lang}>
        <div className="se-wrap"><div className="se-thanks__card"><div className="se-spinner" aria-hidden /><h1>{t.checking}</h1></div></div>
      </div>
    );
  }
  if (id && lead && !lead.found && !langParam) {
    return (
      <div className="se se-thanks fr-thanks" lang={lang}>
        <div className="se-wrap"><div className="se-thanks__card">
          <h1>{t.unknownTitle}</h1><p>{t.unknownText}</p>
          <Link className="se-btn se-btn--primary" href={FUNNEL.pagePath[lang]}>{t.back}</Link>
        </div></div>
      </div>
    );
  }

  const name = lead?.firstName ? `, ${lead.firstName}` : '';
  const email = lead?.email || '';
  const hasBook = !!(ref && k);
  const missing = EBOOK_COPY[lang].recipes.map((r, i) => ({ ...r, hex: RECIPES[i].hex })).filter((_, i) => i !== 2 && i !== 5);
  const chosen = INTERESTS.find(i => i.id === interest);
  // Always the live address: a friend opening it from WhatsApp is never on this machine.
  const site = 'https://thetropicalbakery.com';
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(fill(t.shareMessage, { url: `${site}${FUNNEL.pagePath[lang]}?utm_source=whatsapp&utm_medium=share` }))}`;

  return (
    <div className="se se-thanks fr-thanks" lang={lang}>
      <div className="se-wrap">
        {/* 1 · the recipes */}
        <div className="se-thanks__card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="se-thanks__cover" src={freeCover(lang)} alt="" />
          <h1>{fill(t.title, { name })}</h1>
          {email && <p>{rich(fill(t.text, { email }))}</p>}
          <a className="se-btn se-btn--primary se-btn--big" href={freePdf(lang)} target="_blank" rel="noopener" download>{t.download}</a>
          <p className="fr-thanks__spam">{t.spam}</p>
        </div>

        {/* 2 · the book: bought (status) or the one-time offer */}
        {hasBook && pay.phase !== 'failed' && pay.phase !== 'unknown' ? (
          <div className="fr-block se-center">
            <h2>{t.bookTitle}</h2>
            {pay.phase === 'paid' ? (
              <>
                <p>{t.bookPaid}</p>
                <a className="se-btn se-btn--primary se-btn--big" href={`/api/ebook/download?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}&lang=${lang}`}>{t.bookDownload}</a>
                <div className="se-thanks__tips">
                  <b>🎁 {PERK_COPY[lang].title}</b>
                  <p style={{ margin: 0 }}>{PERK_COPY[lang].text}</p>
                </div>
              </>
            ) : (
              <><div className="se-spinner" aria-hidden /><p>{t.bookWait}</p></>
            )}
          </div>
        ) : !declined && (
          <div className="fr-block fr-oto">
            <p className="se-kicker">{t.otoKicker}</p>
            <h2>{t.otoTitle}</h2>
            {pix ? (
              <PixBox lang={lang} payload={pix.payload} base64={pix.base64} email={email} next={pix.next} />
            ) : (
              <>
                <div className="fr-oto__row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/ebook/sweet-escape/${lang}/cover.webp`} alt="Sweet Escape" />
                  <p>{t.otoText}</p>
                </div>
                <p><b>{t.otoMissing}</b></p>
                <ul className="fr-oto__missing">
                  {missing.map(r => <li key={r.name}><i style={{ background: r.hex }} />{r.name}</li>)}
                </ul>
                {id && lead?.found ? (
                  <div className="se-form">
                    <PayPicker lang={lang} methods={methods} method={method} setMethod={setMethod} legend={c.bump.pay} />
                    {error && <p className="se-error" role="alert">{error}</p>}
                    <button type="button" className="se-btn se-btn--primary se-btn--big" disabled={busy} onClick={buy}>
                      {busy ? c.form.busy : fill(t.otoCta, { price: bookPrice(method) })}
                    </button>
                  </div>
                ) : (
                  <Link className="se-btn se-btn--primary se-btn--big" href={`${LANG_PATH[lang]}#buy`}>{fill(t.otoCta, { price: lang === 'pt' ? `R$ ${BOOK_OFFERS.full.brl}` : `US$ ${BOOK_OFFERS.full.usd}` })}</Link>
                )}
                <p className="fr-oto__promise">{t.otoPromise}</p>
                {isNearby(segment) && <p className="fr-oto__promise">{t.otoPerk}</p>}
                <button type="button" className="fr-oto__no" onClick={() => setDeclined(true)}>{t.otoNo}</button>
              </>
            )}
          </div>
        )}
        {declined && <p className="se-center se-small">{t.otoDeclined}</p>}

        {/* 3 · around Ubatuba / Paraty: one next step, chosen by them */}
        {isNearby(segment) ? (
          <div className="fr-block">
            <p className="se-kicker">{t.nearKicker}</p>
            <h2>{t.nearTitle[segment as 'local' | 'visiting']}</h2>
            <p><b>{t.nearQuestion}</b></p>
            <div className="fr-chips">
              {INTERESTS.map(i => (
                <button key={i.id} type="button" className={interest === i.id ? 'is-on' : ''} onClick={() => pick(i.id)} aria-pressed={interest === i.id}>
                  <span aria-hidden>{i.emoji}</span>{t.interests[i.id].label}
                </button>
              ))}
            </div>
            {chosen && (
              <div className="fr-pick">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={chosen.img} alt="" loading="lazy" />
                <div>
                  <h3>{t.interests[chosen.id].title}</h3>
                  <p>{t.interests[chosen.id].text}</p>
                  <Link className="se-btn se-btn--primary" href={`${chosen.path}?utm_source=funil&utm_medium=obrigado&utm_campaign=receitas`}>{t.interests[chosen.id].cta}</Link>
                  {chosen.second && t.interests[chosen.id].second && (
                    <Link className="fr-pick__second" href={`${chosen.second.path}?utm_source=funil&utm_medium=obrigado&utm_campaign=receitas`}>{t.interests[chosen.id].second} →</Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="fr-block">
            <p className="se-kicker">{t.awayKicker}</p>
            <h2>{t.awayTitle}</h2>
            <p>{t.awayText}</p>
            <Link className="fr-pick__second" href="/retreats">Itamambuca →</Link>
          </div>
        )}

        {/* 4 · pass it on */}
        <div className="fr-block fr-share">
          <h2>{t.shareTitle}</h2>
          <p>{t.shareText}</p>
          <a className="se-btn" href={shareUrl} target="_blank" rel="noopener">{t.shareButton}</a>
        </div>
      </div>
    </div>
  );
}
