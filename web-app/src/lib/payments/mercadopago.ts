import 'server-only';
import crypto from 'node:crypto';
import { findOrder, markOrderPaid, sameAmount, siteUrl, PayableOrder } from './server';

const API = 'https://api.mercadopago.com';

export const mercadoPagoConfigured = () => !!process.env.MERCADOPAGO_ACCESS_TOKEN;

const auth = () => ({ Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, 'Content-Type': 'application/json' });

/**
 * Creates a Mercado Pago "Checkout Pro" payment page for an order and returns
 * the address to send the customer to. Cards only: Pix is handled by our own
 * free Pix flow, and boleto is switched off.
 */
export async function createMercadoPagoCheckout(order: PayableOrder): Promise<string> {
  const site = siteUrl();
  const back = (result: string) => `${site}/checkout/retorno?provider=mercadopago&ref=${order.reference}&result=${result}`;

  const res = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({
      items: [{
        id: order.reference,
        title: `Pedido The Tropical Bakery${order.itemsSummary ? ` — ${order.itemsSummary}` : ''}`.slice(0, 250),
        quantity: 1,
        unit_price: Math.round(order.total * 100) / 100,
        currency_id: 'BRL',
      }],
      payer: order.customerEmail ? { email: order.customerEmail, name: order.customerName } : undefined,
      external_reference: order.reference,
      back_urls: { success: back('success'), pending: back('pending'), failure: back('failure') },
      auto_return: 'approved',
      notification_url: `${site}/api/webhooks/mercadopago`,
      statement_descriptor: 'TROPICALBAKERY',
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'bank_transfer' }],
        installments: 6,
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.init_point) {
    console.error('Mercado Pago preference error:', res.status, json);
    throw new Error('O Mercado Pago não aceitou o pedido. Tente de novo ou use o Pix.');
  }
  // Test credentials use the sandbox address.
  const testMode = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').startsWith('TEST-');
  return testMode && json.sandbox_init_point ? json.sandbox_init_point : json.init_point;
}

/**
 * Asks Mercado Pago (not the caller) what happened to a payment, and if it is
 * approved for the right order and the right amount, marks the order paid.
 * Used by both the webhook and the page the customer lands on afterwards.
 */
export async function confirmMercadoPagoPayment(paymentId: string): Promise<{ ok: boolean; status: string; reference?: string }> {
  if (!/^\d{3,20}$/.test(paymentId)) return { ok: false, status: 'invalid' };

  const res = await fetch(`${API}/v1/payments/${paymentId}`, { headers: auth() });
  if (!res.ok) return { ok: false, status: 'not_found' };
  const payment = await res.json();

  const reference = String(payment.external_reference || '');
  const status = String(payment.status || '');
  if (!reference) return { ok: false, status };

  const order = await findOrder(reference);
  if (!order) return { ok: false, status, reference };

  if (status === 'approved') {
    if (!sameAmount(Number(payment.transaction_amount), order.total)) {
      console.error(`Mercado Pago amount mismatch on ${reference}: paid ${payment.transaction_amount}, order ${order.total}`);
      return { ok: false, status: 'amount_mismatch', reference };
    }
    await markOrderPaid(order, 'mercadopago', String(payment.id));
    return { ok: true, status, reference };
  }
  return { ok: false, status, reference };
}

/**
 * Mercado Pago signs every webhook. If a secret is configured, refuse anything
 * that doesn't match. (Even without it, we never trust the body: we re-fetch the
 * payment from Mercado Pago before doing anything.)
 */
export function verifyMercadoPagoSignature(headers: Headers, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = headers.get('x-signature') || '';
  const requestId = headers.get('x-request-id') || '';
  const parts = Object.fromEntries(signature.split(',').map(p => p.trim().split('=') as [string, string]));
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
