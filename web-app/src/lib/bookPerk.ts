/**
 * The reader's gift: whoever has PAID for Sweet Escape gets 15% off their first paid purchase after it (a box or the
 * Events Menu at /checkout, a brunch ticket, a course or retreat proposal; the subscription's first payment by hand).
 * Decided by the e-mail on the order, on the server (hasBookPerk below). Change the number here and nowhere else.
 *
 * No server-only imports: the pages, the e-mails, the admin and the server all read it.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EbookLang } from './ebookCopy';

export const BOOK_PERK = {
  percent: 15,
  /** The order line, the receipt and the inbox. No commas (items_summary is split on them). */
  line: 'Presente de leitor Sweet Escape (-15%)',
  /** What the inbox / admin searches for to recognise a discounted order. */
  marker: 'Presente de leitor Sweet Escape',
} as const;

const round2 = (n: number) => Math.round(n * 100) / 100;
/** How much comes off an amount (products only, never the delivery fee). */
export const perkDiscount = (amount: number) => round2((amount * BOOK_PERK.percent) / 100);

/** How we tell a buyer about it: the "your book is ready" e-mail and the download pages. */
export const PERK_COPY: Record<EbookLang, { title: string; text: string }> = {
  en: {
    title: 'Your reader’s gift: 15% off',
    text: 'Because you bought Sweet Escape, your first order of anything else from my kitchen is 15% off: a Tasting Box, a brunch, a course, a retreat or treats for your event. Nothing to type: just use this same e-mail and the discount appears in your total.',
  },
  pt: {
    title: 'Seu presente de leitor: 15% de desconto',
    text: 'Como você comprou o Sweet Escape, a sua primeira compra de qualquer outra coisa da minha cozinha sai com 15% de desconto: Caixa de Degustação, brunch, curso, retiro ou doces para o seu evento. Não precisa de código: use este mesmo e-mail e o desconto aparece no total.',
  },
  es: {
    title: 'Tu regalo de lector: 15% de descuento',
    text: 'Como compraste Sweet Escape, tu primera compra de cualquier otra cosa de mi cocina tiene 15% de descuento: Caja de Degustación, brunch, curso, retiro o postres para tu evento. Sin código: usa este mismo e-mail y el descuento aparece en el total.',
  },
  nl: {
    title: 'Je lezerscadeau: 15% korting',
    text: 'Omdat je Sweet Escape kocht, krijg je 15% korting op je eerste bestelling van iets anders uit mijn keuken: een Proefdoos, een brunch, een cursus, een retraite of lekkernijen voor je event. Geen code nodig: gebruik hetzelfde e-mailadres en de korting staat in je totaal.',
  },
};

const paidStatus = (status: string | null) => String(status ?? '').toUpperCase() === 'PAID';

/**
 * Does this e-mail still have the reader's gift? Yes when it has a PAID Sweet Escape order (EBK…)
 * and no paid order for anything else placed after that book. "Paid" is the site's usual rule: status PAID, or a
 * Pix moved past "new" in the inbox. An unpaid (abandoned) order does not use it up, so a customer who switches
 * from Pix to card still gets it.
 *
 * `db` must be allowed to read orders and inbox_status: the server's service client (pricing an order at checkout,
 * brunch and proposals; /api/perk for the signed-in visitor's OWN address) or an admin's session (Admin › Assinaturas).
 * Never answer it to the public for an address someone typed: that would tell anyone who bought the book.
 */
export async function hasBookPerk(db: SupabaseClient, email: string | null | undefined): Promise<boolean> {
  const mail = String(email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return false;
  try {
    // ilike: older checkout orders kept the e-mail as typed. Escape its wildcards so "a_b@x" matches only itself.
    const pattern = mail.replace(/[\\%_]/g, c => `\\${c}`);
    const { data, error } = await db.from('orders').select('id, pix_transaction_id, status, created_at').ilike('customer_email', pattern);
    if (error || !data?.length) return false;
    const rows = data as { id: string; pix_transaction_id: string | null; status: string | null; created_at: string }[];

    const unpaid = rows.filter(r => !paidStatus(r.status)).map(r => r.id);
    const confirmed = new Set<string>();
    if (unpaid.length) {
      const { data: inbox } = await db.from('inbox_status').select('source_id, status').eq('source_table', 'orders').in('source_id', unpaid);
      for (const i of (inbox || []) as { source_id: string; status: string }[]) {
        if (i.status !== 'new' && i.status !== 'cancelled') confirmed.add(String(i.source_id));
      }
    }
    const paid = rows.filter(r => paidStatus(r.status) || confirmed.has(r.id));

    const books = paid.filter(r => /^EBK/.test(String(r.pix_transaction_id ?? ''))).map(r => r.created_at).sort();
    if (!books.length) return false;
    const firstBook = books[0];
    return !paid.some(r => !/^EBK/.test(String(r.pix_transaction_id ?? '')) && r.created_at > firstBook);
  } catch (e) {
    console.error('hasBookPerk:', e);
    return false; // a lookup failure costs the customer a discount, never the order
  }
}
