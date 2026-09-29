import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PICKUP_EXTRA_DAYS, pickupWindowText } from '@/lib/pickupWindow';
import { SITE_URL, STORE_WHATSAPP, copyBox, greeting, kicker, orderTable, paragraphs, type LayoutOptions } from './layout';
import { deliver } from './send';
import { formatBRL } from '@/lib/deliveryZones';

/**
 * The two e-mails nobody has to ask for: "we got your order" and "your payment
 * came through".
 *
 * These are transactional (topic `pedido`), so they ignore marketing opt-outs
 * and carry no unsubscribe link — somebody who just paid is owed a receipt.
 * They are deliberately NOT in CAMPAIGNS: the admin never hand-sends a receipt,
 * so it has no business in the campaign dropdown.
 *
 * Every function here is safe to call twice. The (email, message_key) index in
 * `email_sends` means a second call changes nothing, which matters because a
 * payment webhook can legitimately fire more than once.
 */

export interface ReceiptOrder {
  reference: string;
  customerName: string;
  customerEmail: string | null;
  /** Priced lines, when we have them (we do at checkout). */
  lines?: { name: string; quantity: number; unit: number }[];
  /**
   * "2x Caixa de Degustação (6 doces)" — what the saved order remembers when the
   * per-line prices are gone, e.g. a webhook arriving hours later.
   */
  summary?: string | null;
  fee: number;
  total: number;
  /** 'pix' | 'mercadopago' | 'paypal' */
  method: string;
  /** ISO date the customer picked, when there is one. */
  date?: string | null;
  isPickup?: boolean;
  /** Pix "copia e cola" string, so they can pay from the e-mail if they closed the tab. */
  pixPayload?: string | null;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const prettyDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  return m ? `${Number(m[3])} de ${MONTHS[Number(m[2]) - 1]}` : (iso || '').trim();
};

const whatsappLink = `https://wa.me/${STORE_WHATSAPP}`;

/**
 * The money part, identical on both e-mails so the numbers never disagree.
 * With priced lines it itemises; with only the saved summary it still shows what
 * was ordered, just without a price beside each line.
 */
function amounts(order: ReceiptOrder) {
  const lines = order.lines?.length
    ? order.lines.map(l => ({
        label: l.quantity > 1 ? `${l.quantity}x ${l.name}` : l.name,
        amount: formatBRL(l.unit * l.quantity),
      }))
    : (order.summary || '').split(',').map(s => s.trim()).filter(Boolean).map(label => ({ label, amount: '' }));

  return orderTable([
    ...lines,
    ...(order.lines?.length && order.fee > 0 ? [{ label: 'Entrega', amount: formatBRL(order.fee) }] : []),
    { label: 'Total', amount: formatBRL(order.total), strong: true },
  ]);
}

/** "Entrega em 3 de outubro" / "Retirada no home bakery" — whichever applies. */
function fulfilment(order: ReceiptOrder): string {
  if (order.isPickup) {
    return order.date
      ? `Retirada no nosso home bakery em Itamambuca: ${pickupWindowText(order.date)}. Guardamos a caixa na geladeira por até ${PICKUP_EXTRA_DAYS} dias; o endereço aparece em Minha Conta assim que o pagamento for confirmado.`
      : 'Retirada no nosso home bakery em Itamambuca.';
  }
  if (order.date) return `Entrega prevista para ${prettyDate(order.date)}.`;
  return '';
}

/** One transactional e-mail to one address, or nothing when we have no address. */
async function send(db: SupabaseClient, order: ReceiptOrder, messageKey: string, subject: string, layout: Omit<LayoutOptions, 'theme'>) {
  const email = (order.customerEmail || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return;

  // A receipt must not be blocked by a missing token or an un-run migration, so
  // the topic goes in as transactional and the failure is logged, never thrown:
  // the order itself already succeeded and must not be rolled back over e-mail.
  try {
    await deliver(db, {
      email,
      token: '',
      messageKey,
      subject,
      topic: 'pedido',
      template: messageKey.split(':')[0],
      transactional: true,
      layout: { ...layout, theme: 'caixa' },
    });
  } catch (err) {
    console.error('receipt failed for', order.reference, err);
  }
}

/**
 * Right after the order is saved. For Pix this is the one that matters: it
 * carries the copy-and-paste code, so closing the checkout tab no longer loses
 * the payment.
 */
export async function sendOrderReceived(db: SupabaseClient, order: ReceiptOrder) {
  const firstName = (order.customerName || '').trim().split(' ')[0];
  const isPix = order.method === 'pix';
  const where = fulfilment(order);

  const body =
    (firstName ? greeting(firstName) : '') +
    paragraphs(
      isPix
        ? 'Recebemos o seu pedido e guardamos ele para você. Falta só o Pix cair — assim que cair, a gente confirma aqui e no WhatsApp.'
        : 'Recebemos o seu pedido! Estamos só esperando a confirmação do pagamento, que costuma levar alguns minutos.',
    ) +
    kicker('Seu pedido') +
    amounts(order) +
    (isPix && order.pixPayload ? copyBox('Pix copia e cola', order.pixPayload) : '') +
    (where ? paragraphs(where) : '');

  await send(db, order, `order-received:${order.reference}`, `Recebemos seu pedido — ${order.reference}`, {
    preheader: isPix ? `Falta o Pix de ${formatBRL(order.total)} para fechar o pedido.` : `Pedido de ${formatBRL(order.total)} recebido.`,
    heading: 'Recebemos seu pedido',
    body,
    cta: { label: 'Falar com a gente no WhatsApp', href: whatsappLink },
    note: `Guarde o número do pedido: ${order.reference}.`,
  });
}

/** When the money actually arrives (card, PayPal, or an admin confirming a Pix). */
export async function sendOrderPaid(db: SupabaseClient, order: ReceiptOrder) {
  const firstName = (order.customerName || '').trim().split(' ')[0];
  const where = fulfilment(order);

  const body =
    (firstName ? greeting(firstName) : '') +
    paragraphs(
      'Pagamento confirmado — seu pedido está na fila da cozinha. ' +
      (order.isPickup
        ? 'Quando estiver pronto a gente te avisa no WhatsApp para você vir buscar.'
        : 'A Dolly faz tudo à mão, fresco, o mais perto possível do dia da entrega.'),
    ) +
    kicker('O que você pediu') +
    amounts(order) +
    (where ? paragraphs(where) : '');

  await send(db, order, `order-paid:${order.reference}`, `Pagamento confirmado ✅ ${order.reference}`, {
    preheader: `Recebemos ${formatBRL(order.total)}. Seu pedido está confirmado.`,
    heading: 'Pagamento confirmado',
    body,
    cta: { label: 'Ver minha conta', href: `${SITE_URL}/minha-conta` },
    note: `Pedido ${order.reference}. Precisa mudar algo? Fale com a gente no WhatsApp.`,
  });
}
