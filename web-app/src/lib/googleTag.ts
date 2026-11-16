// The Google tag (gtag.js): Google Analytics 4 and Google Ads, side by side with the Meta pixel.
// LGPD: this file never decides anything about consent. loadGoogleTag() is called from exactly two places,
// both right after the same check the pixel uses (visitor tapped "Aceitar" + not a staff area):
// the banner (src/components/MetaPixel.tsx) and trackMeta() in metaPixel.ts. Until then nothing is
// loaded and trackGoogle() does nothing. Never send names, e-mails or phone numbers in the params.

// Both ids are public by design and are set in Vercel: NEXT_PUBLIC_GA_ID (G-…) and
// NEXT_PUBLIC_GOOGLE_ADS_ID (AW-…). With neither set, everything here is a no-op.
const IDS = [process.env.NEXT_PUBLIC_GA_ID, process.env.NEXT_PUBLIC_GOOGLE_ADS_ID]
  .map(id => (id || '').trim())
  .filter(Boolean);

type Params = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Only call after consent (see the note at the top). Safe to call again: it loads once. */
export function loadGoogleTag() {
  if (!IDS.length || window.gtag) return;
  const dataLayer = (window.dataLayer = window.dataLayer || []);
  // gtag.js only understands the `arguments` object itself in the queue, not a copy in an array.
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  const gtag = window.gtag;
  // We only get here after "Aceitar", so say so: Google asks for these signals before it uses
  // a visit for ads or analytics (required for visitors from Europe).
  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });
  gtag('js', new Date());
  // Page views are sent by hand on every route change (MetaPixel.tsx), so not here.
  for (const id of IDS) gtag('config', id, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(IDS[0])}`;
  document.head.appendChild(s);
}

/** Sends one event to every Google id that is set. Does nothing until loadGoogleTag() has run. */
export function trackGoogle(event: string, params?: Params) {
  try {
    if (typeof window === 'undefined' || !IDS.length || !window.gtag) return;
    if (params) window.gtag('event', event, params);
    else window.gtag('event', event);
  } catch {
    /* tracking must never break the page */
  }
}
