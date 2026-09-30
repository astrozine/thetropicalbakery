import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, copyBox, esc, kicker, orderTable, paragraphs, bulletList } from './layout';
import { deliver } from './send';
import { formatBRL } from '@/lib/deliveryZones';
import { EBOOK } from '@/lib/ebook';

/**
 * The e-book's two e-mails, in English like the book: "we got your order" (with the Pix code and the
 * personal download link, which unlocks itself once the payment is confirmed) and "your book is ready".
 * Transactional (topic `pedido`), one per order each, like the box receipts in ./receipts.ts.
 */

export interface EbookReceipt {
  reference: string;
  customerName: string;
  customerEmail: string | null;
  total: number;
  method: string;
  pixPayload?: string | null;
  /** The download key for this order (lib/payments/ebook.ts). */
  key: string;
}

const hello = (name: string) => {
  const first = (name || '').trim().split(' ')[0];
  return first
    ? `<p style="color:#3c2a21;font-family:Georgia,serif;font-size:17px;font-weight:bold;margin:0 0 12px;">Hi ${esc(first)}!</p>`
    : '';
};

const link = (o: EbookReceipt) => `${SITE_URL}${EBOOK.thanksPath}?ref=${o.reference}&k=${o.key}`;

async function send(db: SupabaseClient, o: EbookReceipt, messageKey: string, subject: string, layout: Parameters<typeof deliver>[1]['layout']) {
  const email = (o.customerEmail || '').trim().toLowerCase();
  if (!email.includes('@')) return;
  try {
    await deliver(db, { email, token: '', messageKey, subject, topic: 'pedido', template: messageKey.split(':')[0], transactional: true, layout });
  } catch (err) {
    console.error('e-book receipt failed for', o.reference, err);
  }
}

export async function sendEbookOrderReceived(db: SupabaseClient, o: EbookReceipt) {
  const isPix = o.method === 'pix';
  const body =
    hello(o.customerName) +
    paragraphs(
      isPix
        ? `Thank you for ordering Sweet Escape! Your book is reserved. As soon as your Pix of ${formatBRL(o.total)} arrives and Dolly confirms it, the button below unlocks your download. Keep this e-mail: the link is yours for good.`
        : 'Thank you for ordering Sweet Escape! We are just waiting for the payment confirmation, which usually takes a minute. The button below is your personal download link, and it is yours for good.',
    ) +
    kicker('Your order') +
    orderTable([{ label: EBOOK.lineName, amount: formatBRL(o.total) }, { label: 'Total', amount: formatBRL(o.total), strong: true }]) +
    (isPix && o.pixPayload ? copyBox('Pix copia e cola', o.pixPayload) : '');

  await send(db, o, `ebook-received:${o.reference}`, `Your Sweet Escape order (${o.reference})`, {
    preheader: isPix ? `One Pix of ${formatBRL(o.total)} and the book is yours.` : 'Your plant-based treat book is on its way.',
    heading: 'Your sweet escape is waiting',
    body,
    cta: { label: 'My download page', href: link(o) },
    note: `Order ${o.reference}. Questions? Just reply on WhatsApp: +55 11 93211-9196.`,
    theme: 'novidades',
  });
}

export async function sendEbookPaid(db: SupabaseClient, o: EbookReceipt) {
  const body =
    hello(o.customerName) +
    paragraphs('Payment confirmed. Welcome to the jungle kitchen! Your copy of Sweet Escape is ready to download: 72 pages, seven colors, seven treats.') +
    kicker('Where to start') +
    bulletList([
      'Read the six rules first (pages 4–11). They are the “why” that makes every recipe easier.',
      'Day 3, the Red Berry Bliss Balls, needs no oven and is perfect to make with kids.',
      'Soak your cashews the night before Day 1, 2 or 6 and everything goes faster.',
    ]) +
    paragraphs('The link below works whenever you need it, on any device. Save the PDF to your phone or tablet and cook straight from it.');

  await send(db, o, `ebook-paid:${o.reference}`, 'Your Sweet Escape e-book is ready 🌈', {
    preheader: 'Your download link is inside. Enjoy your sweet escape!',
    heading: 'Your book is ready',
    body,
    cta: { label: 'Download Sweet Escape', href: link(o) },
    note: `Order ${o.reference}. Show us what you make: @thetropicalbakery on Instagram.`,
    theme: 'novidades',
  });
}
