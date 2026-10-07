import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin, isPaid } from './server';
import { OrderError } from './order';
import { createEbookOrder, ebookCheckoutUrl, ebookKey, type CreatedEbookOrder } from './ebook';
import { FUNNEL, INTERESTS, isInterest, isSegment, type Interest, type Segment } from '@/lib/funnel';
import { isEbookLang, type EbookLang } from '@/lib/ebookCopy';
import { sendFreeRecipes } from '@/lib/email/funnelMail';

/**
 * The free-recipes funnel on the server. Same rules as every sale on the site: the visitor says who they are and
 * what they want, the server saves it with the service key and decides every price (the book goes through
 * createEbookOrder, lib/payments/ebook.ts). The lead row (migration 43) is reached by its unguessable id only.
 *
 * Nothing here may lose a sign-up: if migration 43 has not been run, the person still gets the recipes (e-mail and
 * thank-you page), we just cannot count them.
 */

export interface LeadInput {
  name?: string;
  email?: string;
  lang?: string;
  segment?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  /** Ticked the order bump: how they want to pay for the book. */
  bump?: { payMethod?: string } | null;
}

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const firstName = (name: string) => name.split(/\s+/)[0] || '';

export function funnelThanksUrl(site: string, o: { id: string | null; lang: EbookLang; segment: Segment; book?: CreatedEbookOrder }) {
  const q = new URLSearchParams({ lang: o.lang, s: o.segment });
  if (o.id) q.set('l', o.id);
  if (o.book) { q.set('ref', o.book.reference); q.set('k', o.book.key); }
  return `${site}${FUNNEL.thanksPath}?${q.toString()}`;
}

export interface CreatedLead {
  id: string | null;
  lang: EbookLang;
  segment: Segment;
  book?: CreatedEbookOrder;
}

export async function createLead(input: LeadInput, userToken: string | null): Promise<CreatedLead> {
  const name = text(input.name, 120);
  const email = text(input.email, 160).toLowerCase();
  if (name.length < 1) throw new OrderError(400, 'Please tell us your first name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new OrderError(400, 'We need a valid e-mail: that is where your recipes go.');
  const lang: EbookLang = isEbookLang(input.lang) ? input.lang : 'en';
  const segment: Segment = isSegment(input.segment) ? input.segment : 'away';

  const db = supabaseAdmin();
  const { data, error } = await db.from('funnel_leads').insert([{
    email, first_name: firstName(name), lang, segment,
    utm_source: text(input.utm_source, 120) || null,
    utm_campaign: text(input.utm_campaign, 120) || null,
    utm_content: text(input.utm_content, 120) || null,
    referrer: text(input.referrer, 300) || null,
  }]).select('id').single();
  if (error) console.error('createLead: funnel_leads insert failed (run migration 43?):', error.message);
  const id = (data?.id as string | undefined) ?? null;

  try {
    await db.rpc('email_contact_upsert', { p_email: email, p_full_name: name, p_tags: [FUNNEL.tag], p_source: FUNNEL.source, p_locale: lang });
  } catch { /* the recipes matter more */ }

  await sendFreeRecipes(db, { email, firstName: firstName(name), lang });

  // The order bump: the full book, at its normal price, bought with the same name and e-mail.
  let book: CreatedEbookOrder | undefined;
  if (input.bump) {
    book = await createEbookOrder({ name: name.length >= 2 ? name : email.split('@')[0], email, payMethod: input.bump.payMethod, lang, book: lang }, userToken);
    if (id) await db.from('funnel_leads').update({ book_ref: book.reference, book_offer: 'bump' }).eq('id', id);
  }
  return { id, lang, segment, book };
}

export interface PublicLead {
  found: boolean;
  firstName?: string;
  email?: string;
  lang?: EbookLang;
  segment?: Segment;
  interest?: Interest | null;
  book?: { ref: string; k: string } | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function leadRow(id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await supabaseAdmin().from('funnel_leads').select('*').eq('id', id).maybeSingle();
  return data as Record<string, unknown> | null;
}

/** What the thank-you page may show about its own sign-up. */
export async function publicLead(id: string): Promise<PublicLead> {
  const row = await leadRow(id);
  if (!row) return { found: false };
  const ref = row.book_ref ? String(row.book_ref) : '';
  return {
    found: true,
    firstName: String(row.first_name ?? ''),
    email: String(row.email ?? ''),
    lang: isEbookLang(row.lang) ? row.lang : 'en',
    segment: isSegment(row.segment) ? row.segment : 'away',
    interest: isInterest(row.interest) ? row.interest : null,
    book: ref ? { ref, k: ebookKey(ref) } : null,
  };
}

/** The answer to "what would you love most?": kept on the lead, and the matching list tag on their contact. */
export async function setInterest(id: string, interest: unknown) {
  if (!isInterest(interest)) throw new OrderError(400, 'Unknown choice.');
  const row = await leadRow(id);
  if (!row) throw new OrderError(404, 'Sign-up not found.');
  const db = supabaseAdmin();
  await db.from('funnel_leads').update({ interest }).eq('id', id);
  const tags = INTERESTS.find(i => i.id === interest)?.tags ?? [];
  if (tags.length) {
    try { await db.rpc('email_contact_upsert', { p_email: String(row.email), p_full_name: null, p_tags: tags, p_source: FUNNEL.source }); } catch { /* not worth failing */ }
  }
}

/** The one-time offer on the thank-you page: the full book for the person who just signed up, nothing to retype. */
export async function buyBookFromLead(id: string, payMethod: unknown, userToken: string | null, site: string) {
  const row = await leadRow(id);
  if (!row) throw new OrderError(404, 'Sign-up not found.');
  const lang: EbookLang = isEbookLang(row.lang) ? row.lang : 'en';
  const segment: Segment = isSegment(row.segment) ? row.segment : 'away';
  const email = String(row.email);
  const name = String(row.first_name || '').length >= 2 ? String(row.first_name) : email.split('@')[0];
  const book = await createEbookOrder({ name, email, payMethod: String(payMethod ?? ''), lang, book: lang }, userToken);
  await supabaseAdmin().from('funnel_leads').update({ book_ref: book.reference, book_offer: 'oto' }).eq('id', id);
  const thanks = funnelThanksUrl(site, { id, lang, segment, book });
  const url = book.method === 'pix' ? undefined : await ebookCheckoutUrl(book, email, thanks);
  return { book, thanks, url };
}

/**
 * Of these addresses, the ones that have paid for the book (any offer, any way in): the sequence stops selling it to
 * them. Paid = status PAID, or a Pix moved past "new" in the inbox, the rule ebookAccess() uses.
 */
export async function paidBookEmails(db: SupabaseClient, emails: string[]): Promise<string[]> {
  const list = [...new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean))];
  if (!list.length) return [];
  const { data } = await db.from('orders').select('id, customer_email, status').like('pix_transaction_id', 'EBK%').in('customer_email', list);
  const rows = (data || []) as { id: string; customer_email: string; status: string | null }[];
  const paid = new Set(rows.filter(r => isPaid(String(r.status ?? ''))).map(r => r.customer_email.toLowerCase()));
  const open = rows.filter(r => !paid.has(r.customer_email.toLowerCase()));
  if (open.length) {
    const { data: inbox } = await db.from('inbox_status').select('source_id, status').eq('source_table', 'orders').in('source_id', open.map(r => r.id));
    for (const i of (inbox || []) as { source_id: string; status: string }[]) {
      if (i.status === 'new' || i.status === 'cancelled') continue;
      const r = open.find(o => o.id === i.source_id);
      if (r) paid.add(r.customer_email.toLowerCase());
    }
  }
  return [...paid];
}
