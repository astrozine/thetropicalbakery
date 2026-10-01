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
 * Env (Vercel only, never NEXT_PUBLIC_): two optional accounts, so the money can go to either and we can switch
 * without re-pasting secrets:
 *   account A: STRIPE_SECRET_KEY,   STRIPE_WEBHOOK_SECRET     (sk_live_… / whsec_…)
 *   account B: STRIPE_SECRET_KEY_B, STRIPE_WEBHOOK_SECRET_B
 *   STRIPE_ACTIVE_ACCOUNT = A | B   which one takes NEW payments (default A).
 * Payments are always recognised on EITHER account (the session is looked up with each key in turn and the webhook
 * is accepted from either), so a buyer who started paying just before a switch is never left locked out.
 */

const API = 'https://api.stripe.com/v1';

interface StripeAccount { id: 'A' | 'B'; secret: string; webhook: string }

/** The accounts that have a secret key, the active one first. */
function accounts(): StripeAccount[] {
  const all = ([
    { id: 'A', secret: process.env.STRIPE_SECRET_KEY || '', webhook: process.env.STRIPE_WEBHOOK_SECRET || '' },
    { id: 'B', secret: process.env.STRIPE_SECRET_KEY_B || '', webhook: process.env.STRIPE_WEBHOOK_SECRET_B || '' },
  ] as StripeAccount[]).filter(a => a.secret);
  const active = (process.env.STRIPE_ACTIVE_ACCOUNT || 'A').trim().toUpperCase();
  return all.sort((x, y) => (x.id === active ? -1 : 0) - (y.id === active ? -1 : 0));
}

/** True only if the account chosen as active has its key (a typo in STRIPE_ACTIVE_ACCOUNT must not switch money elsewhere). */
export const stripeConfigured = () => {
  const active = (process.env.STRIPE_ACTIVE_ACCOUNT || 'A').trim().toUpperCase();
  return accounts().some(a => a.id === active);
};

const headers = (secret: string) => ({
  Authorization: `Bearer ${secret}`,
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
  const account = accounts()[0];
  if (!account || !stripeConfigured()) throw new Error('Stripe is not configured.');
  const res = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: { ...headers(account.secret), 'Idempotency-Key': `tb-${o.reference}` },
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

  // The session belongs to whichever account created it: try each configured account's key in turn.
  let session: Record<string, unknown> | null = null;
  for (const account of accounts()) {
    const res = await fetch(`${API}/checkout/sessions/${sessionId}`, { headers: headers(account.secret) });
    if (res.ok) { session = await res.json(); break; }
  }
  if (!session) return { ok: false, status: 'not_found' };

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
  // Either account's signing secret is accepted (they sign with their own).
  const secrets = accounts().map(a => a.webhook).filter(Boolean);
  if (secrets.length === 0 || !header) return false;
  const parts = header.split(',').map(p => p.trim().split('=') as [string, string]);
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  return secrets.some(secret => {
    const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
    return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  });
}
