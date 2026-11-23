'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BONUS_CALL_COPY, type AmazonEdition } from '@/lib/bonusCall';
import { isEbookLang } from '@/lib/ebookCopy';
import { DOLLY_PHOTO } from './BonusCall';
import './sweetEscape.css';
import './bonusCall.css';

interface Buyer { ok: boolean; paid?: boolean; firstName?: string; email?: string; whatsapp?: string }

/**
 * /sweet-escape/call: book the free call that comes with the book. Site buyers arrive with ?ref=&k= (from the
 * download page or the e-mail) and only add how to reach them; Amazon buyers type their order number.
 */
export default function BonusCallClaim() {
  const q = useSearchParams();
  const langParam = q.get('lang');
  const lang = isEbookLang(langParam) ? langParam : 'en';
  const ref = q.get('ref') || '';
  const k = q.get('k') || '';
  // From the free-recipes PDF: no order to show, the call is a gift to the reader.
  const reader = q.get('from') === 'recipes';
  const c = BONUS_CALL_COPY[lang].claim;

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [order, setOrder] = useState('');
  const [edition, setEdition] = useState<AmazonEdition>('kindle');
  const [goal, setGoal] = useState('');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { later: boolean }>(null);

  useEffect(() => {
    if (!ref || !k) return;
    fetch(`/api/bonus-call?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        const b: Buyer | null = j.buyer;
        setBuyer(b);
        if (b?.ok) { setName(b.firstName || ''); setEmail(b.email || ''); setWhatsapp(b.whatsapp || ''); }
      })
      .catch(() => setBuyer({ ok: false }));
  }, [ref, k]);

  const site = !!buyer?.ok;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || whatsapp.replace(/\D/g, '').length < 6) { setError(c.errGeneric); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/bonus-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, name, email, whatsapp, goal, when, ...(site ? { ref, k } : reader ? { reader: true } : { amazonOrder: order, edition }) }),
      });
      const j = await r.json();
      if (!r.ok) {
        const map: Record<string, string> = { off: c.off, order: c.errOrder, used: c.errUsed, notPaid: c.errNotPaid, old: c.errOld };
        throw new Error(map[j.error] || c.errGeneric);
      }
      setDone({ later: !!j.later });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : c.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="se bc-claim" lang={lang}>
      <div className="se-wrap">
        <div className="bc-claim__card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DOLLY_PHOTO} alt="Dolly" />
          <div className="bc-claim__body">
            {done ? (
              <>
                <h1>{c.doneTitle}</h1>
                <p>{done.later ? c.doneLater : c.doneText}</p>
              </>
            ) : (
              <>
                <h1>{c.title}</h1>
                <p>{c.intro}</p>
                {site && buyer?.paid === false && <p className="se-error" role="alert">{c.errNotPaid}</p>}
                <form className="se-form" onSubmit={submit} noValidate>
                  {site ? <p className="bc-claim__found">{c.siteBuyer}</p> : <p style={{ margin: 0 }}>{reader ? c.readerIntro : c.amazonIntro}</p>}
                  {!site && !reader && (
                    <>
                      <fieldset className="bc-editions">
                        <legend>{c.edition}</legend>
                        {(['kindle', 'paperback', 'hardcover'] as AmazonEdition[]).map(ed => (
                          <label key={ed} className={edition === ed ? 'is-on' : ''}>
                            <input type="radio" name="bc-edition" value={ed} checked={edition === ed} onChange={() => setEdition(ed)} />
                            {c.editions[ed]}
                          </label>
                        ))}
                      </fieldset>
                      <label className="se-field">
                        {c.order} <em>{c.orderHint}</em>
                        <input value={order} onChange={e => setOrder(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="113-1234567-1234567" required />
                      </label>
                    </>
                  )}
                  <label className="se-field">
                    {c.name}
                    <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
                  </label>
                  <label className="se-field">
                    {c.whatsapp} <em>{c.whatsappHint}</em>
                    <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} type="tel" autoComplete="tel" inputMode="tel" placeholder="+1 555 123 4567" required />
                  </label>
                  <label className="se-field">
                    {c.email}
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" />
                  </label>
                  <label className="se-field">
                    {c.goal} <em>{c.goalHint}</em>
                    <textarea value={goal} onChange={e => setGoal(e.target.value)} maxLength={90} rows={2} />
                  </label>
                  <label className="se-field">
                    {c.when} <em>{c.whenHint}</em>
                    <input value={when} onChange={e => setWhen(e.target.value)} maxLength={60} />
                  </label>
                  {error && <p className="se-error" role="alert">{error}</p>}
                  <button type="submit" className="se-btn se-btn--primary se-btn--big" disabled={busy}>{busy ? c.busy : c.submit}</button>
                  <p className="bc-claim__fine">{c.privacy}</p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
