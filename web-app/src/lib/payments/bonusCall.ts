import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './server';
import { ebookAccess, validKey } from './ebook';
import { AMAZON_ORDER, BONUS_CALL, CLAIM_TOPIC, normalizeAmazonOrder, weekStart, type AmazonEdition } from '@/lib/bonusCall';
import { isEbookLang, type EbookLang } from '@/lib/ebookCopy';

/**
 * The free call with Dolly that comes with the book (words and numbers in lib/bonusCall.ts).
 * Claims are contact_leads rows written with the service key, so the inbox and the team alert pick them up.
 */

export interface BonusCallStatus {
  /** False only when the admin set the weekly number to 0. */
  on: boolean;
  /** Calls Dolly takes per week. */
  weekly: number;
  /** Claims since Monday. */
  taken: number;
}

export async function bonusCallStatus(db: SupabaseClient = supabaseAdmin()): Promise<BonusCallStatus> {
  let weekly: number = BONUS_CALL.defaultWeekly;
  try {
    const { data } = await db.from('site_settings').select('value').eq('key', BONUS_CALL.settingKey).maybeSingle();
    if (data && Number.isFinite(Number(data.value))) weekly = Math.max(0, Math.round(Number(data.value)));
  } catch { /* migration 51 not run: the default */ }
  let taken = 0;
  try {
    const { count } = await db.from('contact_leads').select('id', { count: 'exact', head: true })
      .like('topic', `${CLAIM_TOPIC}%`).gte('created_at', weekStart().toISOString());
    taken = count ?? 0;
  } catch { /* count stays 0 */ }
  return { on: weekly > 0, weekly, taken };
}

/** Is the bonus on? Used by the e-mails; never throws (an e-mail must not fail over it). */
export async function bonusCallOn(db?: SupabaseClient): Promise<boolean> {
  try { return (await bonusCallStatus(db)).on; } catch { return true; }
}

export type ClaimError = 'off' | 'order' | 'used' | 'notPaid' | 'old' | 'generic';

export interface ClaimInput {
  lang?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  goal?: string;
  when?: string;
  /** Site buyer: the order reference and its key (from the download link). */
  ref?: string;
  k?: string;
  /** Amazon buyer. */
  amazonOrder?: string;
  edition?: string;
  /** Someone who downloaded the free recipes (no order): the sampler PDF links here with from=recipes. */
  reader?: boolean;
}

const text = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const EDITIONS: AmazonEdition[] = ['kindle', 'paperback', 'hardcover'];

/** What a site buyer's claim page can prefill: only for a valid ref + key. */
export async function siteBuyer(ref: string, k: string): Promise<{ ok: boolean; paid?: boolean; firstName?: string; email?: string; whatsapp?: string }> {
  if (!validKey(ref, k)) return { ok: false };
  const { data } = await supabaseAdmin().from('orders').select('customer_name, customer_email, customer_whatsapp')
    .eq('pix_transaction_id', ref).maybeSingle();
  const access = await ebookAccess(ref);
  if (!data || !access.found) return { ok: false };
  return { ok: true, paid: access.paid, firstName: String(data.customer_name ?? '').trim(), email: data.customer_email ?? '', whatsapp: data.customer_whatsapp ?? '' };
}

export async function claimBonusCall(input: ClaimInput): Promise<{ ok: true; later: boolean } | { ok: false; error: ClaimError }> {
  const db = supabaseAdmin();
  const lang: EbookLang = isEbookLang(input.lang) ? input.lang : 'en';
  const name = text(input.name, 120);
  const whatsapp = text(input.whatsapp, 40);
  const email = text(input.email, 254).toLowerCase();
  if (!name || whatsapp.replace(/\D/g, '').length < 6 || (email && !email.includes('@'))) return { ok: false, error: 'generic' };

  let source: string;
  const ref = text(input.ref, 40);
  if (ref) {
    if (!validKey(ref, String(input.k || ''))) return { ok: false, error: 'generic' };
    const access = await ebookAccess(ref);
    if (!access.found) return { ok: false, error: 'generic' };
    if (!access.paid) return { ok: false, error: 'notPaid' };
    const { data } = await db.from('orders').select('created_at').eq('pix_transaction_id', ref).maybeSingle();
    if (data?.created_at && Date.now() - new Date(data.created_at).getTime() > BONUS_CALL.claimDays * 86400_000) return { ok: false, error: 'old' };
    source = `site ${ref}`;
  } else if (input.reader) {
    source = 'free recipes reader';
  } else {
    const order = normalizeAmazonOrder(String(input.amazonOrder || ''));
    if (!AMAZON_ORDER.test(order)) return { ok: false, error: 'order' };
    const edition = EDITIONS.includes(input.edition as AmazonEdition) ? input.edition : 'kindle';
    source = `Amazon ${order} ${edition}`;
  }

  const status = await bonusCallStatus(db);
  // Switched off: site buyers who were promised it still get it; Amazon and free-recipes claims are turned away politely.
  if (!status.on && !ref) return { ok: false, error: 'off' };

  // One call per order (a free-recipes reader: one per WhatsApp number).
  const q = db.from('contact_leads').select('id', { count: 'exact', head: true }).like('topic', `${CLAIM_TOPIC}%`);
  const { count } = await (input.reader && !ref
    ? q.eq('whatsapp', whatsapp)
    : q.like('topic', `%${source.split(' ').slice(0, 2).join(' ')}%`));
  if ((count ?? 0) > 0) return { ok: false, error: 'used' };

  const extra = [text(input.goal, 90) && `wants help with: ${text(input.goal, 90)}`, text(input.when, 60) && `best times: ${text(input.when, 60)}`, `lang ${lang}`]
    .filter(Boolean).join(' · ');
  const topic = `${CLAIM_TOPIC} · ${source} · ${extra}`.slice(0, 300);
  const { error } = await db.from('contact_leads').insert({ name, whatsapp, email: email || null, topic, source_page: `${BONUS_CALL.path}?lang=${lang}` });
  if (error) {
    console.error('bonus call claim:', error.message);
    return { ok: false, error: 'generic' };
  }
  return { ok: true, later: status.taken >= status.weekly };
}
