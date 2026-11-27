'use client';

import { supabase } from '@/lib/supabase';
import { SEQUENCE, isNearby, type Segment } from '@/lib/funnel';

/**
 * The people who asked for the free recipes (funnel_leads), with where they are in the e-mail sequence and whether
 * they bought the book. Read by the Overview ("Novas pessoas") and the Inbox, so Andrew sees his most important
 * people without opening the CRM. Our own team's addresses (the admins list) are left out: those are tests.
 * Every query fails on its own: a missing table just means fewer details, never a blank page.
 */

export interface RecipeLead {
  id: string;
  /** Their place in line: #1 is the first person who ever asked for the recipes (team tests not counted). */
  number: number;
  /** How many people in total have ever asked (our owned list), the same on every card. */
  total: number;
  createdAt: string;
  email: string;
  name: string;
  lang: string;
  segment: Segment | null;
  interest: string | null;
  /** 'Amazon' for the Amazon detour, the ad's utm tags, or null for a direct visit. */
  from: string | null;
  /** The recipes PDF e-mail: true sent, false failed, null no record. */
  pdf: boolean | null;
  /** Sequence steps already sent, in order ('dia 1', 'dia 3'...). */
  sent: number[];
  /** All the steps this person gets (day 9 depends on where they live). */
  steps: number[];
  /** The next step and the day it is due ('YYYY-MM-DD', Brasília), or null when the sequence is done. */
  next: { day: number; date: string } | null;
  /** Whether the follow-up e-mails are switched on in Admin › E-mails › Automações. */
  sequenceOn: boolean;
  book: 'paid' | 'waiting' | 'none';
}

export const LANG_FLAG: Record<string, string> = { en: '🇬🇧', pt: '🇧🇷', es: '🇪🇸', nl: '🇳🇱', de: '🇩🇪' };

const key = (v: string | null | undefined) => (v || '').trim().toLowerCase();
const brasiliaDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

interface LeadRow {
  id: string; created_at: string; email: string; first_name: string | null; lang: string | null;
  segment?: string | null; interest?: string | null; book_ref?: string | null;
  utm_source: string | null; utm_campaign: string | null; utm_content: string | null;
}

export async function loadRecipeLeads(opts: { days?: number; limit?: number } = {}): Promise<RecipeLead[]> {
  const since = new Date(Date.now() - (opts.days ?? 60) * 86400000).toISOString();
  const [leadsRes, adminsRes, ruleRes, everyoneRes] = await Promise.all([
    supabase.from('funnel_leads').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(opts.limit ?? 500),
    supabase.from('admins').select('email'),
    supabase.from('email_automations').select('enabled').eq('id', 'receitas-sequencia').maybeSingle(),
    // Everyone who ever signed up (just e-mail + date), oldest first: gives each person their number.
    supabase.from('funnel_leads').select('email, created_at').order('created_at', { ascending: true }).limit(20000),
  ]);
  if (leadsRes.error || !leadsRes.data?.length) return [];

  const team = new Set(((adminsRes.data || []) as { email: string }[]).map(a => key(a.email)));
  const numberOf = new Map<string, number>();
  for (const r of (everyoneRes.data || []) as { email: string }[]) {
    const k = key(r.email);
    if (k && !team.has(k) && !numberOf.has(k)) numberOf.set(k, numberOf.size + 1);
  }
  const total = numberOf.size;
  // One card per person: the first sign-up wins (the list is newest first, so walk it backwards).
  const seen = new Set<string>();
  const rows: LeadRow[] = [];
  for (const l of [...(leadsRes.data as LeadRow[])].reverse()) {
    const k = key(l.email);
    if (!k || team.has(k) || seen.has(k)) continue;
    seen.add(k);
    rows.unshift(l);
  }
  if (!rows.length) return [];
  const emails = rows.map(r => key(r.email));

  const [sendsRes, booksRes] = await Promise.all([
    supabase.from('email_sends').select('email, message_key, status').in('email', [...new Set([...emails, ...rows.map(r => r.email)])]).like('message_key', 'receitas-%').limit(5000),
    supabase.from('orders').select('id, customer_email, status').like('pix_transaction_id', 'EBK%').in('customer_email', [...new Set([...emails, ...rows.map(r => r.email)])]),
  ]);

  // E-mails each person already got.
  const pdf = new Map<string, boolean>();
  const got = new Map<string, Set<string>>();
  for (const s of (sendsRes.data || []) as { email: string; message_key: string; status: string }[]) {
    const k = key(s.email);
    if (s.message_key === 'receitas-gratis:pdf') { pdf.set(k, pdf.get(k) || s.status !== 'failed'); continue; }
    if (s.status === 'failed') continue;
    if (!got.has(k)) got.set(k, new Set());
    got.get(k)!.add(s.message_key);
  }

  // The book: paid (status PAID, or a Pix confirmed by hand in the inbox) or an order still waiting for payment.
  const books = (booksRes.data || []) as { id: string; customer_email: string; status: string | null }[];
  const paid = new Set(books.filter(b => String(b.status || '').toUpperCase() === 'PAID').map(b => key(b.customer_email)));
  const open = books.filter(b => !paid.has(key(b.customer_email)));
  if (open.length) {
    const { data } = await supabase.from('inbox_status').select('source_id, status').eq('source_table', 'orders').in('source_id', open.map(b => String(b.id)));
    for (const s of (data || []) as { source_id: string; status: string }[]) {
      if (s.status === 'new' || s.status === 'cancelled') continue;
      const b = open.find(o => String(o.id) === String(s.source_id));
      if (b) paid.add(key(b.customer_email));
    }
  }
  const ordered = new Set(books.map(b => key(b.customer_email)));
  const sequenceOn = Boolean((ruleRes.data as { enabled?: boolean } | null)?.enabled);

  return rows.map(r => {
    const k = key(r.email);
    const segment = (r.segment as Segment) || null;
    const bought = paid.has(k);
    // The steps this person is due: selling steps are skipped once they own the book, day 9 depends on where they are.
    const plan = SEQUENCE.filter(st =>
      (!st.nearbyOnly || isNearby(segment)) && (!st.farOnly || !isNearby(segment)) && !(st.sells && bought));
    const mine = got.get(k) || new Set<string>();
    const sent = plan.filter(st => mine.has(st.campaignId)).map(st => st.day);
    const start = brasiliaDay(r.created_at);
    const today = brasiliaDay(new Date().toISOString());
    // The next step not yet sent whose last chance (day + 1, the cron's slack) has not passed.
    const nextStep = plan.find(st => !mine.has(st.campaignId) && addDays(start, st.day + 1) >= today);
    const from = r.utm_campaign === 'amazon-detour'
      ? 'Amazon'
      : [r.utm_source, r.utm_campaign, r.utm_content].filter(Boolean).join(' · ') || null;
    return {
      id: r.id,
      number: numberOf.get(k) || 0,
      total,
      createdAt: r.created_at,
      email: r.email,
      name: (r.first_name || '').trim() || r.email.split('@')[0],
      lang: r.lang || 'en',
      segment,
      interest: r.interest || null,
      from,
      pdf: pdf.has(k) ? pdf.get(k)! : null,
      sent,
      steps: plan.map(st => st.day),
      next: nextStep ? { day: nextStep.day, date: addDays(start, nextStep.day) } : null,
      sequenceOn,
      book: bought ? 'paid' : ordered.has(k) || r.book_ref ? 'waiting' : 'none',
    } satisfies RecipeLead;
  });
}

/** "dia 3 de 5 enviado · próximo: dia 5 (sex., 28/11)", in plain words for a card. */
export function sequenceLine(l: RecipeLead): string {
  const total = l.steps.length;
  const done = l.sent.length;
  const head = done ? `${done} de ${total} e-mails enviados` : `0 de ${total} e-mails enviados`;
  if (!l.next) return done >= total ? `✅ Sequência completa (${total} e-mails)` : head;
  if (!l.sequenceOn) return `${head} · sequência DESLIGADA`;
  const when = new Date(`${l.next.date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  return `${head} · próximo: dia ${l.next.day} (${when})`;
}

export const BOOK_LABEL: Record<RecipeLead['book'], { text: string; color: string; bg: string }> = {
  paid: { text: '📖 Comprou o e-book', color: '#0b6b3a', bg: '#e6f4ec' },
  waiting: { text: '⏳ Pedido do e-book sem pagar', color: '#8a6d1f', bg: '#fdf3d9' },
  none: { text: '📕 Ainda não comprou o e-book', color: '#a03027', bg: '#fdecea' },
};
