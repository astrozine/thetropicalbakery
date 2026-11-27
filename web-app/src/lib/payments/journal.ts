import 'server-only';
import { findOrder, siteUrl, supabaseAdmin } from './server';
import { OrderError } from './order';
import { createMercadoPagoCheckout, mercadoPagoConfigured } from './mercadopago';
import { createStripeOrderCheckout, stripeConfigured } from './stripe';
import { generatePixData } from '@/utils/pix';
import { sendJournalPix, sendJournalUnlocked } from '@/lib/email/journalMail';
import {
  collectionHref, collectionTextOf, isLive, priceOf, recipeHref, textOf,
  type JournalCollection, type JournalLang, type JournalRecipe,
} from '@/lib/journal/journal';

/**
 * Buying a Recipe Journal recipe or collection (migration 55). Same rules as every other order on the site: the browser
 * says WHAT and HOW to pay, the SERVER reads the price from the database (promo price, then the discount code), saves
 * the order with the service key and writes the journal_access row that unlocks it once the order is paid.
 *
 * The buyer must be signed in: what they buy is access on their account (like the app's Tropical+).
 *
 * Ways to pay:
 *  - 'mp'     Mercado Pago Checkout Pro with Pix AND cards: confirmed by Mercado Pago itself, so the recipe opens on its own.
 *  - 'stripe' Stripe (cards from abroad, charged in reais), for the English pages when Stripe is switched on.
 *  - 'pix'    our own Pix code: Dolly confirms it in the inbox, which unlocks it (fallback when Mercado Pago is off).
 */

export type JournalPayMethod = 'mp' | 'stripe' | 'pix';
export const isJournalReference = (ref: unknown) => /^RJ/.test(String(ref ?? ''));

export interface JournalItemInput { kind?: string; slug?: string; code?: string; lang?: string }

interface Item {
  kind: 'recipe' | 'collection';
  id: string;
  slug: string;
  title: string;
  href: string;
  price: number;
}

const langOf = (l: unknown): JournalLang => (l === 'en' ? 'en' : 'pt');

/** The recipe or collection being bought, with its price today. Free recipes and unpublished things cannot be bought. */
async function findItem(input: JournalItemInput): Promise<Item> {
  const db = supabaseAdmin();
  const lang = langOf(input.lang);
  const slug = String(input.slug || '').slice(0, 120);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new OrderError(400, 'Receita não encontrada.');
  if (input.kind === 'collection') {
    const { data } = await db.from('journal_collections').select('*').eq('slug', slug).eq('published', true).maybeSingle();
    if (!data) throw new OrderError(404, lang === 'en' ? 'Collection not found.' : 'Coleção não encontrada.');
    const c = data as JournalCollection;
    return { kind: 'collection', id: c.id, slug: c.slug, title: collectionTextOf({ ...c, recipe_ids: [] }, lang).title, href: siteUrl() + collectionHref(lang, c.slug), price: priceOf(c) };
  }
  const { data } = await db.from('journal_recipes').select('*').or(`slug.eq.${slug},slug_en.eq.${slug}`).maybeSingle();
  const r = data as JournalRecipe | null;
  if (!r || !isLive(r)) throw new OrderError(404, lang === 'en' ? 'Recipe not found.' : 'Receita não encontrada.');
  if (r.is_free) throw new OrderError(400, lang === 'en' ? 'This recipe is free: no need to buy it.' : 'Esta receita é grátis: não precisa comprar.');
  return { kind: 'recipe', id: r.id, slug: r.slug, title: textOf(r, lang).title, href: siteUrl() + recipeHref(lang, r), price: priceOf(r) };
}

const paidStatus = (s: unknown) => String(s ?? '').toUpperCase() === 'PAID';

/** How many paid orders already used this code. */
async function codeUses(code: string): Promise<number> {
  const db = supabaseAdmin();
  const { data: rows } = await db.from('journal_access').select('order_id').eq('code', code).not('order_id', 'is', null);
  const ids = [...new Set((rows || []).map(r => String(r.order_id)))];
  if (!ids.length) return 0;
  const { data: orders } = await db.from('orders').select('id, status').in('id', ids);
  const { data: inbox } = await db.from('inbox_status').select('source_id, status').eq('source_table', 'orders').in('source_id', ids);
  const confirmed = new Set((inbox || []).filter(i => i.status !== 'new' && i.status !== 'cancelled').map(i => String(i.source_id)));
  return (orders || []).filter(o => paidStatus(o.status) || confirmed.has(String(o.id))).length;
}

/** The price after a discount code, or why the code does not work. Never below R$ 1 (Pix and cards need something). */
export async function applyCode(price: number, rawCode: unknown, lang: JournalLang): Promise<{ total: number; code: string | null; percent: number; error?: string }> {
  const code = String(rawCode ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!code) return { total: price, code: null, percent: 0 };
  const bad = (pt: string, en: string) => ({ total: price, code: null, percent: 0, error: lang === 'en' ? en : pt });
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) return bad('Cupom não encontrado.', 'Code not found.');
  const { data: c } = await supabaseAdmin().from('journal_codes').select('*').eq('code', code).maybeSingle();
  if (!c || !c.active) return bad('Cupom não encontrado.', 'Code not found.');
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return bad('Este cupom já expirou.', 'This code has expired.');
  if (c.max_uses && (await codeUses(code)) >= c.max_uses) return bad('Este cupom já foi todo usado.', 'This code has been used up.');
  const total = Math.max(1, Math.round(price * (100 - Number(c.percent_off))) / 100);
  return { total, code, percent: Number(c.percent_off) };
}

/** What the paywall shows: the price, and the price with a code. No sign-in needed (it reveals nothing private). */
export async function quoteJournal(input: JournalItemInput) {
  const lang = langOf(input.lang);
  const item = await findItem(input);
  const q = await applyCode(item.price, input.code, lang);
  return { price: item.price, total: q.total, code: q.code, percent: q.percent, error: q.error };
}

/** Which ways to pay this page may offer. */
export function journalPayMethods(lang: JournalLang): JournalPayMethod[] {
  const out: JournalPayMethod[] = [];
  if (lang === 'en' && stripeConfigured()) out.push('stripe');
  if (mercadoPagoConfigured()) out.push('mp');
  if (lang === 'pt' || !out.length) out.push('pix');
  return out;
}

async function userFrom(token: string | null, lang: JournalLang) {
  const msg = lang === 'en' ? 'Sign in so the recipe stays in your account.' : 'Entre na sua conta para a receita ficar com você.';
  if (!token) throw new OrderError(401, msg);
  const { data } = await supabaseAdmin().auth.getUser(token);
  if (!data.user) throw new OrderError(401, msg);
  return data.user;
}

/** Does this person already have it, paid (so we never charge twice)? */
async function alreadyOwns(userId: string, item: Item): Promise<boolean> {
  const db = supabaseAdmin();
  let q = db.from('journal_access').select('order_id').eq('user_id', userId);
  q = item.kind === 'recipe' ? q.eq('recipe_id', item.id) : q.eq('collection_id', item.id);
  const { data } = await q;
  for (const row of data || []) {
    if (!row.order_id) return true;
    const { data: paid } = await db.rpc('journal_order_paid', { p_order: row.order_id });
    if (paid) return true;
  }
  return false;
}

export interface CreatedJournalOrder {
  owned?: boolean;
  reference?: string;
  total?: number;
  method?: JournalPayMethod;
  pix?: { payload: string; base64: string };
  url?: string;
}

export async function createJournalOrder(input: JournalItemInput & { payMethod?: string }, token: string | null): Promise<CreatedJournalOrder> {
  const db = supabaseAdmin();
  const lang = langOf(input.lang);
  const user = await userFrom(token, lang);
  const item = await findItem(input);
  if (await alreadyOwns(user.id, item)) return { owned: true };

  const allowed = journalPayMethods(lang);
  const method: JournalPayMethod = allowed.includes(input.payMethod as JournalPayMethod) ? (input.payMethod as JournalPayMethod) : allowed[0];

  const q = await applyCode(item.price, input.code, lang);
  if (q.error) throw new OrderError(400, q.error);
  const total = q.total;

  const email = String(user.email ?? '').toLowerCase();
  const name = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').trim() || email.split('@')[0] || 'Cliente';
  const reference = `RJ${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.substring(0, 25);
  const today = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  const what = `${item.kind === 'collection' ? 'Coleção' : 'Receita'}: ${item.title}`;
  const summary = `1x ${what}${q.code ? ` (cupom ${q.code}, -${q.percent}%)` : ''}`;

  const base = {
    customer_name: name,
    customer_email: email || null,
    customer_whatsapp: String(user.phone ?? '').replace(/\D/g, '').slice(0, 20),
    delivery_address: `DIÁRIO · ${what} (digital)`,
    requested_date: today,
    total_price: total,
    pix_transaction_id: reference,
    status: 'PENDING',
    order_type: 'EVENTO',
  };
  const rich = {
    ...base, payment_provider: method === 'mp' ? 'mercadopago' : method, order_kind: 'journal', fulfillment: 'digital',
    user_id: user.id, delivery_fee: 0, items_summary: summary,
  };
  let orderId: string | null = null;
  for (const row of [rich, { ...base, user_id: user.id, items_summary: summary }]) {
    const { data, error } = await db.from('orders').insert([row]).select('id').single();
    if (!error && data) { orderId = String(data.id); break; }
    console.error('createJournalOrder insert failed:', error?.message);
  }
  if (!orderId) throw new OrderError(500, lang === 'en' ? 'We could not save the order. Please try again.' : 'Não conseguimos salvar o pedido agora. Tente de novo em um instante.');

  const { error: accessError } = await db.from('journal_access').insert([{
    user_id: user.id,
    recipe_id: item.kind === 'recipe' ? item.id : null,
    collection_id: item.kind === 'collection' ? item.id : null,
    order_id: orderId, reference, price_brl: total, code: q.code, source: 'compra',
  }]);
  if (accessError) {
    console.error('createJournalOrder access row failed:', accessError.message);
    throw new OrderError(500, lang === 'en' ? 'We could not save the order. Please try again.' : 'Não conseguimos salvar o pedido agora. Tente de novo em um instante.');
  }

  try {
    await db.rpc('email_contact_upsert', { p_email: email, p_full_name: name, p_tags: ['cliente', 'diario'], p_source: 'diario' });
  } catch { /* the sale matters more */ }

  const back = `${item.href}?pago=${reference}&ref=${reference}`;
  if (method === 'pix') {
    const pix = await generatePixData({ value: total, transactionId: reference });
    try { await sendJournalPix(db, { name, email, reference, total, title: item.title, href: item.href, lang, pixPayload: pix.payload }); } catch (e) { console.error('journal pix mail:', e); }
    return { reference, total, method, pix: { payload: pix.payload, base64: pix.base64 } };
  }

  const order = await findOrder(reference);
  if (!order) throw new OrderError(500, lang === 'en' ? 'The payment page did not open. Please try again.' : 'Não conseguimos abrir o pagamento agora. Tente de novo.');
  const url = method === 'stripe'
    ? await createStripeOrderCheckout(order, { returnUrl: back })
    : await createMercadoPagoCheckout(order, { returnUrl: back, title: `${what} · The Tropical Bakery`, allowPix: true });
  return { reference, total, method, url };
}

/** Paid (card/Stripe via markOrderPaid, or a Pix Dolly confirmed): the "your recipe is open" e-mail, once per order. */
export async function onJournalPaid(order: Record<string, unknown>) {
  const db = supabaseAdmin();
  const reference = String(order.pix_transaction_id ?? '');
  const { data: a } = await db.from('journal_access').select('recipe_id, collection_id').eq('reference', reference).maybeSingle();
  let title = String(order.items_summary ?? '').replace(/^1x (Receita|Coleção): /, '').replace(/ \(cupom.*$/, '');
  let href = `${siteUrl()}/diario/minhas-receitas`;
  // The language of the purchase: the Stripe pages are English, and an English title means an English buyer.
  let lang: JournalLang = order.payment_provider === 'stripe' ? 'en' : 'pt';
  if (a?.recipe_id) {
    const { data: r } = await db.from('journal_recipes').select('*').eq('id', a.recipe_id).maybeSingle();
    if (r) {
      const rec = r as JournalRecipe;
      if (textOf(rec, 'en').title === title && rec.text.en?.title !== rec.text.pt?.title) lang = 'en';
      title = textOf(rec, lang).title;
      href = siteUrl() + recipeHref(lang, rec);
    }
  } else if (a?.collection_id) {
    const { data: c } = await db.from('journal_collections').select('*').eq('id', a.collection_id).maybeSingle();
    if (c) {
      const col = { ...(c as JournalCollection), recipe_ids: [] };
      if (collectionTextOf(col, 'en').title === title && col.text.en?.title !== col.text.pt?.title) lang = 'en';
      title = collectionTextOf(col, lang).title;
      href = siteUrl() + collectionHref(lang, col.slug);
    }
  }
  await sendJournalUnlocked(db, {
    name: String(order.customer_name ?? ''), email: String(order.customer_email ?? ''), reference,
    total: Number(order.total_price ?? 0), title, href, lang,
  });
}
