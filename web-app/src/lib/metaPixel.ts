// Meta pixel standard events (AddToCart, InitiateCheckout, Purchase, Lead, Subscribe, Contact).
// The pixel itself is loaded by src/components/MetaPixel.tsx, and only after the visitor taps "Aceitar",
// so `window.fbq` exists only with consent: without it every call here is a silent no-op. Never load
// the pixel from here, and never send names, e-mails or phone numbers in the params.

type Params = Record<string, unknown>;

/** Cart prices are strings like "R$ 45,00" (same parse as CartContext's totalPrice). */
export function priceNumber(price: string): number {
  const n = parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function trackMeta(event: string, params?: Params, eventId?: string) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;
    const p = params ? { currency: 'BRL', ...params } : undefined;
    if (eventId) window.fbq('track', event, p ?? {}, { eventID: eventId });
    else if (p) window.fbq('track', event, p);
    else window.fbq('track', event);
  } catch {
    /* tracking must never break the page */
  }
}
