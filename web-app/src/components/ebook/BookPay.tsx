'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BOOK_OFFERS } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';
import { useGoogleTranslated } from './EbookLang';

/**
 * How someone pays for the book follows their WALLET, not the language they read in. A Brazilian reading the English
 * page still wants Pix, and an American who taps "English" on /receitas (Google translates it in place) wants dollars.
 *
 * - The guess: the page is Portuguese (and not translated by Google), or the device is set to Portuguese inside a
 *   Brazilian time zone -> reais. Everyone else -> dollars. Google Translate switching the page flips the guess live.
 * - A tap on the R$ / US$ switch wins over the guess, is remembered in this browser, and every price on the page
 *   (hero, the math, the price card, the sticky bar) moves with it at once.
 * - Display only. The SERVER prices the order from the method (Stripe charges BOOK_OFFERS.usd, everything else .brl).
 */

export type Wallet = 'brl' | 'usd';
export type PayMethod = 'card' | 'pix' | 'paypal' | 'stripe';
export type Methods = { card: boolean; paypal: boolean; stripe: boolean };
type Prices = { brl: number; usd: number };

const KEY = 'tb-wallet';
const EVT = 'tb-wallet-change';
const BR_ZONE = /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Maceio|Araguaina|Santarem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Eirunepe|Noronha)$/;

function deviceInBrazil(): boolean {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
    return BR_ZONE.test(zone) && langs.some(l => l.toLowerCase().startsWith('pt'));
  } catch { return false; }
}

export function useBookWallet(lang: EbookLang) {
  const translated = useGoogleTranslated();
  const [chosen, setChosen] = useState<Wallet | null>(null);
  const [brazil, setBrazil] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s === 'brl' || s === 'usd') setChosen(s); } catch { /* private mode */ }
    setBrazil(deviceInBrazil());
    const on = (e: Event) => setChosen((e as CustomEvent<Wallet>).detail);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);

  const wallet: Wallet = chosen ?? ((lang === 'pt' && !translated) || brazil ? 'brl' : 'usd');
  const choose = useCallback((w: Wallet) => {
    try { localStorage.setItem(KEY, w); } catch { /* private mode: still switches for this page */ }
    window.dispatchEvent(new CustomEvent<Wallet>(EVT, { detail: w }));
  }, []);
  return { wallet, choose };
}

/** The price to show in a wallet. */
export const priceIn = (wallet: Wallet, p: Prices = BOOK_OFFERS.full) => (wallet === 'usd' ? `US$ ${p.usd}` : `R$ ${p.brl}`);
/** What a way of paying really charges: dollars through Stripe, reais otherwise. */
export const priceFor = (method: PayMethod, p: Prices = BOOK_OFFERS.full) => (method === 'stripe' ? `US$ ${p.usd}` : `R$ ${p.brl}`);

/** The best way to pay in this wallet, among those switched on. */
const defaultMethod = (wallet: Wallet, m: Methods): PayMethod =>
  wallet === 'usd' && m.stripe ? 'stripe' : m.card ? 'card' : wallet === 'brl' ? 'pix' : m.stripe ? 'stripe' : 'pix';

/** Which ways to pay are switched on, the wallet, and the chosen way (which follows the wallet until picked). */
export function usePayMethods(lang: EbookLang) {
  const { wallet, choose } = useBookWallet(lang);
  const [methods, setMethods] = useState<Methods>({ card: false, paypal: false, stripe: false });
  const [method, setMethod] = useState<PayMethod>('pix');
  useEffect(() => {
    fetch('/api/pay/methods', { cache: 'no-store' })
      .then(r => r.json())
      .then(m => setMethods({ card: !!m.card, paypal: !!m.paypal, stripe: !!m.stripe }))
      .catch(() => {});
  }, []);
  useEffect(() => { setMethod(defaultMethod(wallet, methods)); }, [wallet, methods]);
  return { methods, method, setMethod, wallet, setWallet: choose };
}

const WALLET_COPY: Record<EbookLang, { legend: string; brl: string; brlNote: string; usd: string; usdNote: string }> = {
  en: { legend: 'Pay in', brl: 'Reais', brlNote: 'Pix · Brazilian cards', usd: 'Dollars', usdNote: 'Any card · Apple Pay' },
  pt: { legend: 'Pagar em', brl: 'Reais', brlNote: 'Pix · cartão brasileiro', usd: 'Dólares', usdNote: 'Cartão internacional' },
  es: { legend: 'Pagar en', brl: 'Reales', brlNote: 'Pix · tarjeta brasileña', usd: 'Dólares', usdNote: 'Cualquier tarjeta · Apple Pay' },
  nl: { legend: 'Betalen in', brl: 'Real', brlNote: 'Pix · Braziliaanse kaart', usd: 'Dollars', usdNote: 'Elke kaart · Apple Pay' },
};

/**
 * R$ / US$ first, then the ways to pay in it. The switch only appears when Stripe is on (without it every way charges
 * reais, and the currency note says so). Reais: Mercado Pago card, Pix, PayPal. Dollars: Stripe, PayPal, Pix.
 */
export function PayPicker({ lang, methods, method, setMethod, wallet, setWallet, legend, prices = BOOK_OFFERS.full, name = 'se-method' }: {
  lang: EbookLang;
  methods: Methods;
  method: PayMethod;
  setMethod: (m: PayMethod) => void;
  wallet: Wallet;
  setWallet: (w: Wallet) => void;
  legend: string;
  prices?: Prices;
  name?: string;
}) {
  const f = EBOOK_COPY[lang].form;
  const w = WALLET_COPY[lang];
  const usd = wallet === 'usd' && methods.stripe;
  const options: { id: PayMethod; label: string; note: string; show: boolean }[] = [
    { id: 'stripe', label: f.card, note: 'Visa · Mastercard · Apple Pay · Google Pay', show: methods.stripe && (usd || !methods.card) },
    { id: 'card', label: f.card, note: f.cardNote, show: methods.card && !usd },
    { id: 'paypal', label: f.paypal, note: f.paypalNote, show: methods.paypal && usd },
    { id: 'pix', label: f.pix, note: f.pixMethodNote, show: true },
    { id: 'paypal', label: f.paypal, note: f.paypalNote, show: methods.paypal && !usd },
  ];
  return (
    <>
      {methods.stripe && (
        <fieldset className="se-methods se-wallet notranslate" translate="no">
          <legend>{w.legend}</legend>
          {(['brl', 'usd'] as Wallet[]).map(id => (
            <label key={id} className={`se-method${wallet === id ? ' is-on' : ''}`}>
              <input type="radio" name={`${name}-wallet`} value={id} checked={wallet === id} onChange={() => setWallet(id)} />
              <b><span aria-hidden>{id === 'brl' ? '🇧🇷 ' : '🌎 '}</span>{priceIn(id, prices)}</b>
              <small>{id === 'brl' ? w.brlNote : w.usdNote}</small>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="se-methods">
        <legend>{legend}</legend>
        {options.filter(o => o.show).map(o => (
          <label key={o.id} className={`se-method${method === o.id ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={o.id} checked={method === o.id} onChange={() => setMethod(o.id)} />
            <b>{o.label}</b>
            <small>{o.note}</small>
          </label>
        ))}
      </fieldset>
      {f.currencyNote && method !== 'stripe' && wallet === 'usd' && (
        <p className="se-currency">{fill(f.currencyNote, { reais: `R$ ${prices.brl}`, usd: prices.usd })}</p>
      )}
    </>
  );
}
