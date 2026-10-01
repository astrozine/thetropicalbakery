import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, copyBox, esc, kicker, orderTable, paragraphs, bulletList } from './layout';
import { deliver } from './send';
import { formatBRL } from '@/lib/deliveryZones';
import { EBOOK } from '@/lib/ebook';
import { EBOOK_COPY, fill, type EbookLang } from '@/lib/ebookCopy';

/**
 * The e-book's two e-mails, in the language the buyer read the page in (the book itself is English, and the
 * Portuguese and Spanish versions say so): "we got your order" (with the Pix code and the personal download
 * link, which unlocks itself once the payment is confirmed) and "your book is ready". Words in ebookCopy.ts.
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
  lang?: EbookLang;
}

const hello = (template: string, name: string) => {
  const first = (name || '').trim().split(' ')[0];
  return first
    ? `<p style="color:#3c2a21;font-family:Georgia,serif;font-size:17px;font-weight:bold;margin:0 0 12px;">${esc(fill(template, { name: first }))}</p>`
    : '';
};

const link = (o: EbookReceipt) => `${SITE_URL}${EBOOK.thanksPath}?ref=${o.reference}&k=${o.key}&lang=${o.lang ?? 'en'}`;

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
  const m = EBOOK_COPY[o.lang ?? 'en'].mail;
  const v = { price: formatBRL(o.total), ref: o.reference };
  const isPix = o.method === 'pix';
  const body =
    hello(m.hi, o.customerName) +
    paragraphs(fill(isPix ? m.receivedPix : m.receivedCard, v)) +
    kicker(m.yourOrder) +
    orderTable([{ label: EBOOK.lineName, amount: formatBRL(o.total) }, { label: 'Total', amount: formatBRL(o.total), strong: true }]) +
    (isPix && o.pixPayload ? copyBox('Pix copia e cola', o.pixPayload) : '');

  await send(db, o, `ebook-received:${o.reference}`, fill(m.receivedSubject, v), {
    preheader: fill(isPix ? m.receivedPreheaderPix : m.receivedPreheaderCard, v),
    heading: m.receivedHeading,
    body,
    cta: { label: m.myPage, href: link(o) },
    note: fill(m.receivedNote, v),
    theme: 'novidades',
  });
}

export async function sendEbookPaid(db: SupabaseClient, o: EbookReceipt) {
  const m = EBOOK_COPY[o.lang ?? 'en'].mail;
  const v = { price: formatBRL(o.total), ref: o.reference };
  const body =
    hello(m.hi, o.customerName) +
    paragraphs(m.paidText) +
    kicker(m.whereToStart) +
    bulletList(m.tips) +
    paragraphs(m.paidLink);

  await send(db, o, `ebook-paid:${o.reference}`, m.paidSubject, {
    preheader: m.paidPreheader,
    heading: m.paidHeading,
    body,
    cta: { label: m.paidCta, href: link(o) },
    note: fill(m.paidNote, v),
    theme: 'novidades',
  });
}
