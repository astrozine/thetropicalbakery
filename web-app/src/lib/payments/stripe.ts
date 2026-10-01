import 'server-only';
import crypto from 'node:crypto';
import { findOrder, markOrderPaid } from './server';
import { EBOOK } from '@/lib/ebook';

/**
 * Stripe Checkout, for card payments from anywhere in the world (the e-book, in US dollars).
 *
 * No SDK: two plain REST calls. Same rules as Mercado Pago and PayPal in this folder:
 *  - the PRICE is decided here (EBOOK.priceUSD), never taken from the browser;
 *  - a payment only counts after we ask STRIPE (not the visitor) about the session: right reference, paid,
 *    right amount, right currency;
 *  - the webhook is signed, and even then we re-read the session from Stripe before marking anything paid.
 *
 * Env (Vercel only, never NEXT_PUBLIC_): STRIPE_SECRET_KEY (sk_live_… / sk_test_…), STRIPE_WEBHOOK_SECRET (whsec_…).
 */

const API = 'https://api.stripe.com/v1';

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

const headers = () => ({
  Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
});

/** Stripe's API takes form-encoded nested keys: line_items[0][price_data][currency]=usd */
const form = (o: Record<string, string>) => new URLSearchParams(o).toString();

/** The languages Stripe's payment page speaks that we also write. */
const STRIPE_LOCALE: Record<string, string> = { en: 'en', pt: 'pt-BR', es: 'es', nl: 'nl' };

export interface StripeCheckoutInput {
  reference: string;
  email: string;
  lang: string;
  /** The thank-you page, already carrying ?ref=…&k=…&lang=… */
  returnUrl: string;
}

/** Creates the Stripe payment page for an e-book order and returns the address to send the buyer to. */
export async function createStripeCheckout(o: StripeCheckoutInput): Promise<string> {
  const res = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: { ...headers(), 'Idempotency-Key': `tb-${o.reference}` },
    body: form({
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(EBOOK.priceUSD * 100),
      'line_items[0][price_data][product_data][name]': `${EBOOK.title} e-book (PDF)`,
      'line_items[0][price_data][product_data][description]': 'The Tropical Bakery · instant download',
      client_reference_id: o.reference,
      'metadata[reference]': o.reference,
      customer_email: o.email,
      locale: STRIPE_LOCALE[o.lang] ?? 'auto',
      // {CHECKOUT_SESSION_ID} is Stripe's own placeholder: it must reach Stripe un-encoded.
      success_url: `${o.returnUrl}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${o.returnUrl}&provider=stripe&result=cancel`,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    console.error('Stripe session error:', res.status, JSON.stringify(json?.error ?? json));
    throw new Error('The card page did not open. Please try again, or pay with Pix.');
  }
  return json.url as string;
}

/**
 * Asks Stripe what happened to a Checkout session and, only if it is PAID for one of our e-book orders at exactly
 * the right amount and currency, marks that order paid. Used by the thank-you page and by the webhook.
 */
export async function confirmStripeSession(sessionId: string): Promise<{ ok: boolean; status: string; reference?: string }> {
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return { ok: false, status: 'invalid' };

  const res = await fetch(`${API}/checkout/sessions/${sessionId}`, { headers: headers() });
  if (!res.ok) return { ok: false, status: 'not_found' };
  const session = await res.json();

  const reference = String(session.client_reference_id || '');
  const status = String(session.payment_status || '');
  if (!/^EBK[A-Za-z0-9]+$/.test(reference)) return { ok: false, status: 'not_ours' };

  const order = await findOrder(reference);
  if (!order) return { ok: false, status, reference };

  if (status === 'paid') {
    if (session.currency !== 'usd' || session.amount_total !== EBOOK.priceUSD * 100) {
      console.error(`Stripe amount mismatch on ${reference}: ${session.amount_total} ${session.currency}`);
      return { ok: false, status: 'amount_mismatch', reference };
    }
    await markOrderPaid(order, 'stripe', String(session.payment_intent || session.id));
    return { ok: true, status, reference };
  }
  return { ok: false, status, reference };
}

/**
 * Stripe signs every webhook: `Stripe-Signature: t=…,v1=…` where v1 = HMAC-SHA256(secret, `${t}.${rawBody}`).
 * Refuses anything unsigned, wrongly signed, or older than five minutes. Without a secret configured it refuses
 * everything (unlike Mercado Pago's, this one has no safe "unsigned" mode: the return page works without it).
 */
export function verifyStripeSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = header.split(',').map(p => p.trim().split('=') as [string, string]);
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
