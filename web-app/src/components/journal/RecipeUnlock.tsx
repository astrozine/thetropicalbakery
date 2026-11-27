'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginPanel from '@/components/LoginPanel';
import RecipeBodyView from './RecipeBodyView';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { trackMeta } from '@/lib/metaPixel';
import { JOURNAL_COPY, fmtBRL, type JournalLang, type RecipeBody } from '@/lib/journal/journal';

type Method = 'mp' | 'stripe' | 'pix';
type Phase = 'idle' | 'checking' | 'waiting' | 'cancelled';

interface Props {
  kind?: 'recipe' | 'collection';
  /** journal_recipes.id (only when migration 55 has run). */
  recipeId: string | null;
  /** The Portuguese slug: what the server looks the recipe up by. */
  slug: string;
  lang: JournalLang;
  price: number;
  /** The full price when a promo price is on. */
  was?: number | null;
  preview: string[];
  /** How many ingredient lines the recipe has in all, for "+ 9 more". */
  ingredientCount: number;
  yieldText?: string;
  /** false = migration 55 not run yet: show the paywall without a working button. */
  live: boolean;
  /** A collection: journal_collections.id. Owning it is read from journal_my_purchases(), not from a body. */
  collectionId?: string | null;
  /** Words for a collection's panel (a recipe uses the default "Love this recipe?"). */
  title?: string;
  text?: string;
  ownedText?: string;
}

/**
 * A premium recipe's lower half. Signed-in buyers (and admins) see the full recipe, read straight from
 * journal_recipe_bodies with their own session: the database decides (journal_has_access), never this component.
 * Everyone else sees the first ingredients fading out and an inviting paywall with the price, a discount code and the
 * ways to pay. Coming back from the payment page it asks the provider, waits for the confirmation and opens the recipe.
 */
export default function RecipeUnlock(p: Props) {
  const c = JOURNAL_COPY[p.lang];
  const { user } = useAuth();
  const q = useSearchParams();
  const [body, setBody] = useState<Record<string, RecipeBody> | null>(null);
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [methods, setMethods] = useState<Method[]>(['mp']);
  const [total, setTotal] = useState(p.price);
  const [codeInput, setCodeInput] = useState('');
  const [code, setCode] = useState<{ code: string; percent: number } | null>(null);
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState<Method | ''>('');
  const [error, setError] = useState('');
  const [wantLogin, setWantLogin] = useState(false);
  const [pix, setPix] = useState<{ reference: string; payload: string; base64: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const ran = useRef(false);

  /** Try to read the full recipe. Returns true when it opened. */
  const [ownsCollection, setOwnsCollection] = useState(false);
  const load = useCallback(async (): Promise<boolean> => {
    if (p.collectionId) {
      const { data } = await supabase.rpc('journal_my_purchases');
      const ok = ((data || []) as { collection_id: string | null; paid: boolean }[]).some(x => x.collection_id === p.collectionId && x.paid);
      if (ok) setOwnsCollection(true);
      return ok;
    }
    if (!p.recipeId) return false;
    const { data } = await supabase.from('journal_recipe_bodies').select('body').eq('recipe_id', p.recipeId).maybeSingle();
    if (data?.body) { setBody(data.body as Record<string, RecipeBody>); return true; }
    return false;
  }, [p.recipeId, p.collectionId]);

  useEffect(() => {
    let alive = true;
    (async () => { if (user) await load(); if (alive) setChecked(true); })();
    return () => { alive = false; };
  }, [user, load]);

  // Price and ways to pay, from the server (never decided here).
  useEffect(() => {
    if (!p.live) return;
    fetch('/api/journal/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: p.kind ?? 'recipe', slug: p.slug, lang: p.lang }) })
      .then(r => r.json()).then(j => { if (j.methods?.length) setMethods(j.methods); if (typeof j.total === 'number') setTotal(j.total); })
      .catch(() => {});
  }, [p.live, p.kind, p.slug, p.lang]);

  // Back from Mercado Pago / Stripe: ask the provider (never the browser), then wait for the recipe to open.
  useEffect(() => {
    if (ran.current) return;
    const ref = q.get('ref') || q.get('pago') || '';
    const provider = q.get('provider');
    if (!ref || !provider) return;
    ran.current = true;
    if (q.get('result') === 'cancel' || q.get('result') === 'failure') { setPhase('cancelled'); return; }
    setPhase('checking');
    (async () => {
      const post = (url: string, b: object) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).catch(() => null);
      if (provider === 'stripe' && q.get('session_id')) await post('/api/pay/stripe/confirm', { session_id: q.get('session_id') });
      const mp = q.get('payment_id') || q.get('collection_id');
      if (provider === 'mercadopago' && mp) await post('/api/pay/mercadopago/confirm', { payment_id: mp });
      for (let i = 0; i < 10; i++) {
        try {
          const j = await (await fetch(`/api/pay/status?ref=${encodeURIComponent(ref)}`, { cache: 'no-store' })).json();
          if (j.paid) {
            trackMeta('Purchase', { value: total, currency: 'BRL', content_name: p.slug, content_type: 'product' });
            if (await load()) { setPhase('idle'); return; }
          }
        } catch { /* try again */ }
        await new Promise(r => setTimeout(r, 2500));
      }
      setPhase('waiting');
    })();
  }, [q, load, p.slug, total]);

  // A direct Pix: check every 6 seconds until Dolly confirms it.
  useEffect(() => {
    if (!pix || body) return;
    const t = setInterval(() => { load(); }, 6000);
    return () => clearInterval(t);
  }, [pix, body, load]);

  const applyCode = async () => {
    setCodeError('');
    const res = await fetch('/api/journal/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: p.kind ?? 'recipe', slug: p.slug, lang: p.lang, code: codeInput }) });
    const j = await res.json().catch(() => ({}));
    if (j.error || !j.code) { setCode(null); setTotal(j.price ?? p.price); setCodeError(j.error || (p.lang === 'en' ? 'Code not found.' : 'Cupom não encontrado.')); return; }
    setCode({ code: j.code, percent: j.percent });
    setTotal(j.total);
  };

  const buy = async (payMethod: Method) => {
    setError('');
    if (!user) { setWantLogin(true); return; }
    setBusy(payMethod);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/journal/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
        body: JSON.stringify({ kind: p.kind ?? 'recipe', slug: p.slug, lang: p.lang, payMethod, code: code?.code }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) { setWantLogin(true); setBusy(''); return; }
      if (!res.ok) throw new Error(j.error || 'Erro');
      if (j.owned) { await load(); setBusy(''); return; }
      trackMeta('InitiateCheckout', { value: j.total, currency: 'BRL', content_name: p.slug });
      if (j.pix) { setPix({ reference: j.reference, payload: j.pix.payload, base64: j.pix.base64 }); setBusy(''); return; }
      if (j.url) { window.location.href = j.url; return; }
      throw new Error('Erro');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy('');
    }
  };

  if (ownsCollection) {
    return (
      <section className="rj-lock">
        <div className="rj-lock__panel" style={{ marginTop: 0 }}>
          <h2>{c.paid}</h2>
          <p>{p.ownedText}</p>
        </div>
      </section>
    );
  }
  if (body) {
    const b = (body[p.lang] || body.pt) as RecipeBody | undefined;
    if (b) return <RecipeBodyView body={b} lang={p.lang} yieldText={p.yieldText} />;
  }

  const more = Math.max(0, p.ingredientCount - p.preview.length);
  const primary: Method = methods[0] || 'mp';
  const label = (m: Method) => (m === 'pix' && primary !== 'pix' ? `${c.payPix} (${fmtBRL(total)})` : c.unlock(fmtBRL(total)));

  return (
    <section className="rj-lock rj-locked" aria-label={c.lockTitle}>
      {p.preview.length > 0 && (
        <div className="rj-lock__peek">
          <h3>{c.lockPreview}</h3>
          <ul className="rj-ing">{p.preview.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
      {more > 0 && <p className="rj-lock__more">{c.lockMore(more)}</p>}
      <div className="rj-lock__panel" style={p.preview.length ? undefined : { marginTop: 0 }}>
        <h2>{p.title || c.lockTitle}</h2>
        <p>{p.text || c.lockBody}</p>

        {phase === 'checking' && <p className="rj-okline">{c.checking}</p>}
        {phase === 'waiting' && <p className="rj-fine">{c.waiting}</p>}
        {phase === 'cancelled' && <p className="rj-fine">{c.cancelled}</p>}

        {pix ? (
          <div className="rj-pix">
            <strong>{c.pixTitle}</strong>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pix.base64} alt="Pix QR code" width={210} height={210} />
            <button type="button" className="rj-btn rj-btn--gold" onClick={async () => { try { await navigator.clipboard.writeText(pix.payload); setCopied(true); } catch { /* the code is in the e-mail too */ } }}>
              {copied ? c.copied : c.copy}
            </button>
            <p className="rj-fine">{c.pixBody} {p.lang === 'en' ? 'Order' : 'Pedido'} {pix.reference}.</p>
          </div>
        ) : (
          <>
            <div className="rj-price">
              {(p.was && p.was > total) || code ? <s>{fmtBRL(p.was && p.was > p.price ? p.was : p.price)}</s> : null}
              {fmtBRL(total)}
            </div>
            {wantLogin && !user ? (
              <div className="rj-login">
                <LoginPanel message={c.signIn} subMessage={c.signInSub} locale={p.lang} />
              </div>
            ) : (
              <>
                <button type="button" className="rj-btn rj-btn--gold" disabled={!p.live || !!busy || !checked} onClick={() => buy(primary)}>
                  {busy === primary ? '…' : label(primary)}
                </button>
                {methods.slice(1).map(m => (
                  <button key={m} type="button" className="rj-btn rj-btn--ghost" disabled={!p.live || !!busy} onClick={() => buy(m)}>
                    {busy === m ? '…' : m === 'pix' ? `${c.payPix} · ${fmtBRL(total)}` : m === 'mp' ? `${c.payCard} · ${fmtBRL(total)}` : c.payIntl}
                  </button>
                ))}
              </>
            )}
            <p className="rj-fine">{primary === 'mp' && p.lang === 'pt' ? c.payHintMp : c.payHint}</p>
            {code ? <p className="rj-okline">{c.codeOk(`${code.code} −${code.percent}%`)}</p> : (
              <details>
                <summary className="rj-fine" style={{ cursor: 'pointer' }}>{c.code}</summary>
                <div className="rj-code" style={{ marginTop: '0.5rem' }}>
                  <input value={codeInput} onChange={e => setCodeInput(e.target.value)} aria-label={c.code} autoCapitalize="characters" />
                  <button type="button" onClick={applyCode} disabled={!codeInput.trim() || !p.live}>{c.codeApply}</button>
                </div>
              </details>
            )}
            {codeError && <p className="rj-err">{codeError}</p>}
            {error && <p className="rj-err">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}
