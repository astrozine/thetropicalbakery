// The Meta pixel: loader, consent, and standard events (AddToCart, InitiateCheckout, Purchase, Lead,
// Subscribe, Contact). The banner is src/components/MetaPixel.tsx. LGPD: nothing is loaded or sent until
// the visitor taps "Aceitar" (stored in localStorage), and staff areas are never tracked. Never send
// names, e-mails or phone numbers in the params.
// Every event sent here is also sent to Google (GA4 / Google Ads) under the same consent: see toGoogle().

import { loadGoogleTag, trackGoogle } from './googleTag';

// Meta dataset (pixel) "The Tropical Bakery Website". The ID is public by design.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1953002309021163';
export const CONSENT_KEY = 'tb-cookie-consent';

export type Consent = 'accepted' | 'declined' | null;

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: unknown;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

/** Admin, partner and team areas are staff-only: never track them. */
export function isTrackedPath(pathname: string | null): boolean {
  return !!pathname && !/^\/(admin|parceiro|equipe)(\/|$)/.test(pathname);
}

export function loadPixel() {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  fbq('init', PIXEL_ID);
}

/** Cart prices are strings like "R$ 45,00" (same parse as CartContext's totalPrice). */
export function priceNumber(price: string): number {
  const n = parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function trackMeta(event: string, params?: Params, eventId?: string) {
  toGoogle(event, params, eventId);
  try {
    if (typeof window === 'undefined') return;
    // A page's effects can run before the banner's, so load here too, but only with consent.
    if (!window.fbq) {
      if (readConsent() !== 'accepted' || !isTrackedPath(window.location.pathname)) return;
      loadPixel();
    }
    const fbq = window.fbq!;
    const p = params ? { currency: 'BRL', ...params } : undefined;
    if (eventId) fbq('track', event, p ?? {}, { eventID: eventId });
    else if (p) fbq('track', event, p);
    else fbq('track', event);
  } catch {
    /* tracking must never break the page */
  }
}

// Meta's event names -> Google's (GA4 recommended names where one exists). Anything not listed
// goes out as its own name in snake_case: AddToCart -> add_to_cart, Subscribe -> subscribe.
const GOOGLE_EVENTS: Record<string, string> = {
  Lead: 'generate_lead',
  Schedule: 'schedule',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
  ViewContent: 'view_item',
};

/**
 * The one place a Meta event becomes a Google event, so no page has to call both.
 * It makes its own consent check (it must not depend on the pixel being loaded) and passes on only
 * the amount, the currency, what it was about and the order reference: never anything about the person.
 */
function toGoogle(event: string, params?: Params, eventId?: string) {
  try {
    if (typeof window === 'undefined') return;
    if (readConsent() !== 'accepted' || !isTrackedPath(window.location.pathname)) return;
    loadGoogleTag();
    const name =
      GOOGLE_EVENTS[event] ??
      event.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').toLowerCase();
    const p: Params = {};
    if (typeof params?.value === 'number') {
      p.value = params.value;
      p.currency = typeof params.currency === 'string' ? params.currency : 'BRL';
    }
    if (params?.content_name != null) p.content_name = params.content_name;
    // Same reference the pixel uses as eventID, so Google counts a repeated purchase once.
    if (eventId) p.transaction_id = eventId;
    trackGoogle(name, p);
  } catch {
    /* tracking must never break the page */
  }
}

type Params = Record<string, unknown>;
