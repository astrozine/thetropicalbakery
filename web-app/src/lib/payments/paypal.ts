import 'server-only';
import { findOrder, markOrderPaid, sameAmount, siteUrl, PayableOrder } from './server';

export const paypalConfigured = () => !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;

const base = () => (process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function accessToken(): Promise<string> {
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    console.error('PayPal auth error:', res.status, json);
    throw new Error('Não foi possível falar com o PayPal agora.');
  }
  return json.access_token;
}

/** Creates a PayPal order (in reais) and returns the address to send the customer to. */
export async function createPayPalCheckout(order: PayableOrder): Promise<string> {
  const site = siteUrl();
  const token = await accessToken();
  const back = (result: string) => `${site}/checkout/retorno?provider=paypal&ref=${order.reference}&result=${result}`;

  const res = await fetch(`${base()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `tb-${order.reference}` },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.reference,
        custom_id: order.reference,
        invoice_id: order.reference,
        description: `The Tropical Bakery — pedido ${order.reference}`.slice(0, 127),
        amount: { currency_code: 'BRL', value: order.total.toFixed(2) },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'The Tropical Bakery',
            locale: 'pt-BR',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            landing_page: 'GUEST_CHECKOUT',
            return_url: back('return'),
            cancel_url: back('cancel'),
          },
        },
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  const link = (json.links || []).find((l: { rel: string }) => l.rel === 'payer-action' || l.rel === 'approve');
  if (!res.ok || !link) {
    console.error('PayPal create error:', res.status, JSON.stringify(json));
    throw new Error('O PayPal não aceitou o pedido. Tente de novo ou use o Pix.');
  }
  return link.href;
}

/**
 * The customer approved in PayPal and came back. Take the money (capture) and,
 * only if PayPal says COMPLETED for the right order and amount, mark it paid.
 */
export async function capturePayPalOrder(paypalOrderId: string, reference: string): Promise<{ ok: boolean; status: string }> {
  if (!/^[A-Za-z0-9-]{8,40}$/.test(paypalOrderId)) return { ok: false, status: 'invalid' };
  const order = await findOrder(reference);
  if (!order) return { ok: false, status: 'not_found' };

  const token = await accessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  let res = await fetch(`${base()}/v2/checkout/orders/${paypalOrderId}/capture`, { method: 'POST', headers: { ...headers, 'PayPal-Request-Id': `cap-${paypalOrderId}` }, body: '{}' });
  let json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Already captured (a page refresh, say)? Read it back instead of failing.
    res = await fetch(`${base()}/v2/checkout/orders/${paypalOrderId}`, { headers });
    json = await res.json().catch(() => ({}));
  }

  const unit = json?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const status = String(json?.status || 'unknown');

  if (status === 'COMPLETED' && capture?.status === 'COMPLETED') {
    const paidRef = String(unit?.custom_id || unit?.reference_id || '');
    const paid = Number(capture?.amount?.value);
    if (paidRef !== reference || capture?.amount?.currency_code !== 'BRL' || !sameAmount(paid, order.total)) {
      console.error(`PayPal mismatch on ${reference}: ref ${paidRef}, paid ${paid} ${capture?.amount?.currency_code}, order ${order.total}`);
      return { ok: false, status: 'amount_mismatch' };
    }
    await markOrderPaid(order, 'paypal', String(capture.id));
    return { ok: true, status: 'COMPLETED' };
  }
  return { ok: false, status };
}
