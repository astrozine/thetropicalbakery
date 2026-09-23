'use client';

import { useEffect, useState } from 'react';

/**
 * Display-only currency conversion for foreign visitors browsing in English
 * or Spanish. This never changes how anyone actually pays — orders are still
 * placed and settled in reais over WhatsApp/checkout — it just shows an
 * approximate "≈ $42 USD" next to the real BRL price so someone outside
 * Brazil has a sense of scale without doing math.
 *
 * Rates come from a free, keyless API and are cached in localStorage for a
 * day — exchange rates for this purpose don't need to be fresher than that,
 * and it keeps the site working even if the API is briefly down.
 */

export interface ExchangeRates {
  usd: number | null;
  eur: number | null;
}

const CACHE_KEY = 'ttb_fx_rates_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchRates(): Promise<ExchangeRates> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/BRL');
    const data = await res.json();
    if (data?.result !== 'success' || !data?.rates) throw new Error('bad response');
    return { usd: data.rates.USD ?? null, eur: data.rates.EUR ?? null };
  } catch {
    return { usd: null, eur: null };
  }
}

export function useExchangeRates(): { rates: ExchangeRates; loading: boolean } {
  const [rates, setRates] = useState<ExchangeRates>({ usd: null, eur: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { rates: cachedRates, at } = JSON.parse(cached);
          if (Date.now() - at < CACHE_TTL_MS) {
            if (!cancelled) { setRates(cachedRates); setLoading(false); }
            return;
          }
        }
      } catch {
        // Corrupt cache or no localStorage access — just fetch fresh.
      }

      const fresh = await fetchRates();
      if (!cancelled) {
        setRates(fresh);
        setLoading(false);
      }
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: fresh, at: Date.now() }));
      } catch {
        // Private browsing / storage blocked — fine, just skip caching.
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { rates, loading };
}

/** BRL amount -> "≈ $42 USD" / "≈ €38 EUR", or '' if the rate isn't loaded. */
export function formatForeign(brlAmount: number, rate: number | null, currency: 'USD' | 'EUR'): string {
  if (!rate) return '';
  const symbol = currency === 'USD' ? '$' : '€';
  const converted = brlAmount * rate;
  return `≈ ${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}
