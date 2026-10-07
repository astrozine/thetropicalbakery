import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { campaignById, type Campaign, type CampaignValues } from './campaigns';
import { FROM_ADDRESS, SITE_URL, greeting, plainTextFallback, renderEmail, type LayoutOptions } from './layout';
import { canReceive, topicById } from '@/lib/emailTopics';
import { dietLine, matchDiet } from '@/lib/dietary';

/**
 * The one place an e-mail actually leaves the building.
 *
 * Both doors lead here: the admin clicking "Enviar" (/api/email/send) and the
 * scheduler waking up on its own (/api/email/cron). A single engine is what
 * makes a scheduled send behave exactly like a hand-sent one — same audience
 * rules, same opt-outs, same "never twice" guarantee.
 *
 * The caller supplies the Supabase client, which decides what the send may
 * touch: the admin's own session (RLS applies) for a manual send, the
 * service-role client for the scheduler, which has no session to borrow.
 */

/** Sent per call, so a big list is delivered in chunks instead of timing out. */
export const BATCH_LIMIT = 150;

export interface Contact {
  email: string;
  full_name: string | null;
  token: string;
  tags: string[] | null;
  opted_out: string[] | null;
  unsubscribed_all: boolean;
  /** Migration 19. Missing on a database where it hasn't been run. */
  diet_tags?: string[] | null;
  allergens_avoid?: string[] | null;
}

/** How the audience was narrowed, and what the treats really contain. */
export interface DietTargeting {
  /** Only people who marked at least one of these diet tags. */
  tags?: string[];
  /** Only people who avoid at least one of these allergens. */
  avoiding?: string[];
  /** What the box/treat this message is about really contains. */
  contains?: string[];
  mayContain?: string[];
  /** Leave out anyone whose allergens clash with `contains`. */
  skipConflicts?: boolean;
}

export interface SendRequest {
  campaignId: string;
  values: CampaignValues;
  diet?: DietTargeting | null;
  /** Count who would get it and stop, without sending or logging anything. */
  dryRun?: boolean;
  /** Send only to this address, ignoring the audience. The admin's "test" button. */
  testEmail?: string;
  /**
   * Narrow the audience to these addresses (still subject to opt-outs). Used by
   * automations that target a known group, e.g. the waiting list.
   */
  onlyEmails?: string[];
  /** Leave these addresses out (e.g. people who already bought, on a "last seats" nudge). */
  exceptEmails?: string[];
  /** Override BATCH_LIMIT. The scheduler raises it because nobody is waiting on a click. */
  limit?: number;
}

export interface SendResult {
  sent: number;
  failed: number;
  /** Already had this exact message from an earlier run. */
  skipped: number;
  /** Eligible people still waiting, after this call. */
  remaining: number;
  audience: number;
  messageKey: string;
  subject: string;
}

export class SendError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const CONTACT_COLUMNS = 'email, full_name, token, tags, opted_out, unsubscribed_all, diet_tags, allergens_avoid';
const CONTACT_COLUMNS_LEGACY = 'email, full_name, token, tags, opted_out, unsubscribed_all';

/** The personal diet line, wrapped so it stands out in the message. */
const dietBlock = (line: string, warning: boolean) => line
  ? `<div style="margin:0 0 18px;padding:12px 14px;border-radius:10px;background:${warning ? '#fdf0e8' : '#eef6ef'};border:1px solid ${warning ? '#f0c9ae' : '#cde3d1'};color:#3c2a21;font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;">${line}</div>`
  : '';

/** Checks the campaign exists and every required field is filled. Throws SendError otherwise. */
export function prepare(campaignId: string, values: CampaignValues) {
  const campaign = campaignById(campaignId);
  if (!campaign) throw new SendError(400, 'Campanha desconhecida.');

  const topic = topicById(campaign.topic);
  if (!topic) throw new SendError(400, 'Tópico desconhecido.');

  const missing = campaign.fields.filter(f => f.required && !String(values?.[f.name] || '').trim());
  if (missing.length) throw new SendError(400, `Preencha: ${missing.map(f => f.label).join(', ')}`);

  return {
    campaign,
    topic,
    messageKey: campaign.messageKey(values),
    subject: campaign.subject(values),
    content: campaign.build(values),
  };
}

/** Everyone on the list, falling back gracefully when migration 19 hasn't been run. */
async function loadContacts(db: SupabaseClient): Promise<Contact[]> {
  let { data, error } = await db.from('email_contacts').select(CONTACT_COLUMNS);

  if (error && /diet_tags|allergens_avoid/.test(error.message)) {
    ({ data, error } = await db.from('email_contacts').select(CONTACT_COLUMNS_LEGACY));
  }
  if (error) {
    throw new SendError(500, /email_contacts/.test(error.message)
      ? 'Rode a migration_15_email_preferences.sql no Supabase primeiro.'
      : error.message);
  }
  return (data || []) as Contact[];
}

/** Who is allowed to get this campaign, after opt-outs, tags and diet targeting. */
export function audienceFor(campaign: Campaign, contacts: Contact[], diet?: DietTargeting | null): Contact[] {
  let eligible = contacts.filter(c => canReceive(campaign.topic, c));

  if (campaign.tags?.length) {
    eligible = eligible.filter(c => campaign.tags!.some(t => (c.tags || []).includes(t)));
  }

  const contains = diet?.contains || [];
  const mayContain = diet?.mayContain || [];
  if (diet?.tags?.length) {
    eligible = eligible.filter(c => diet.tags!.some(t => (c.diet_tags || []).includes(t)));
  }
  if (diet?.avoiding?.length) {
    eligible = eligible.filter(c => diet.avoiding!.some(a => (c.allergens_avoid || []).includes(a)));
  }
  if (diet?.skipConflicts && contains.length) {
    eligible = eligible.filter(c => !matchDiet(c.allergens_avoid, contains, mayContain).conflicts.length);
  }
  return eligible;
}

/**
 * Sends one campaign to everyone who is allowed to receive it, and logs every
 * delivery. The log has a unique key per (address, message), so re-sending the
 * same campaign never reaches anyone twice — the second attempt simply skips
 * the people who already have it.
 */
export async function sendCampaign(db: SupabaseClient, req: SendRequest): Promise<SendResult> {
  const { campaign, topic, messageKey, subject, content } = prepare(req.campaignId, req.values);
  // A group e-mail (one brunch's guests) must never fall through to the whole list.
  if (campaign.groupOnly && !req.onlyEmails && !req.testEmail) {
    throw new SendError(400, 'Este e-mail vai só para um grupo; envie pela página do grupo.');
  }
  const contacts = await loadContacts(db);

  let eligible = audienceFor(campaign, contacts, req.diet);

  // A named group (e.g. the waiting list): keep only those addresses.
  if (req.onlyEmails) {
    const wanted = new Set(req.onlyEmails.map(e => e.trim().toLowerCase()).filter(Boolean));
    eligible = eligible.filter(c => wanted.has(c.email.toLowerCase()));
  }

  if (req.exceptEmails?.length) {
    const skip = new Set(req.exceptEmails.map(e => e.trim().toLowerCase()));
    eligible = eligible.filter(c => !skip.has(c.email.toLowerCase()));
  }

  // A test goes only to the address given, ignoring the audience entirely.
  if (req.testEmail) {
    const wanted = req.testEmail.toLowerCase();
    const match = contacts.find(c => c.email.toLowerCase() === wanted);
    eligible = match ? [match] : [{
      email: wanted, full_name: null, token: '',
      tags: [], opted_out: [], unsubscribed_all: false,
    }];
  }

  const { data: alreadySent } = await db.from('email_sends').select('email').eq('message_key', messageKey);
  const done = new Set((alreadySent || []).map(r => (r.email as string).toLowerCase()));
  const pending = req.testEmail ? eligible : eligible.filter(c => !done.has(c.email.toLowerCase()));

  const limit = Math.max(1, req.limit ?? BATCH_LIMIT);

  if (req.dryRun) {
    return {
      sent: 0, failed: 0,
      skipped: eligible.length - pending.length,
      remaining: Math.max(0, pending.length - limit),
      audience: eligible.length,
      messageKey, subject,
    };
  }

  const boxContains = req.diet?.contains || [];
  const boxMayContain = req.diet?.mayContain || [];
  const batch = pending.slice(0, limit);
  let sent = 0;
  let failed = 0;

  for (const person of batch) {
    const prefsUrl = person.token ? `${SITE_URL}/preferencias?token=${person.token}` : `${SITE_URL}/preferencias`;
    const unsubscribeUrl = person.token ? `${SITE_URL}/preferencias?token=${person.token}&sair=1` : prefsUrl;
    const firstName = (person.full_name || '').trim().split(' ')[0];

    // What this person told us they avoid, checked against what this really
    // contains. Everyone else sees exactly the message as previewed.
    const match = matchDiet(person.allergens_avoid, boxContains, boxMayContain);
    const personal = (boxContains.length || boxMayContain.length)
      ? dietBlock(dietLine(match, (person.allergens_avoid || []).length), match.status !== 'safe')
      : '';

    const layout: LayoutOptions = {
      ...content,
      theme: campaign.theme,
      body: (firstName ? greeting(firstName) : '') + personal + content.body,
      ...(topic.transactional ? {} : { prefsUrl, unsubscribeUrl, reason: campaign.reason }),
    };

    const outcome = await deliver(db, {
      email: person.email, token: person.token, messageKey, subject,
      topic: campaign.topic, template: campaign.id, transactional: !!topic.transactional, layout,
    });
    if (outcome === 'sent') sent += 1;
    else if (outcome === 'failed') failed += 1;
  }

  return {
    sent, failed,
    skipped: eligible.length - pending.length,
    remaining: Math.max(0, pending.length - batch.length),
    audience: eligible.length,
    messageKey, subject,
  };
}

export interface Delivery {
  email: string;
  token: string;
  messageKey: string;
  subject: string;
  topic: string;
  template: string;
  transactional: boolean;
  layout: LayoutOptions;
}

/**
 * One address, one message. Claims the row in `email_sends` FIRST: the unique
 * index on (email, message_key) is what guarantees nobody gets a second copy,
 * even if two runs overlap. A send that fails releases its claim so the next
 * run can retry it.
 *
 * Returns 'claimed' when an earlier run already had this address (nothing sent).
 */
export async function deliver(db: SupabaseClient, d: Delivery): Promise<'sent' | 'failed' | 'claimed'> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new SendError(500, 'RESEND_API_KEY não configurada no servidor.');

  const { error: claimError } = await db.from('email_sends').insert([{
    email: d.email, message_key: d.messageKey, topic: d.topic, subject: d.subject, template: d.template,
  }]);
  if (claimError) return 'claimed';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: d.email,
        subject: d.subject,
        html: renderEmail(d.layout),
        text: plainTextFallback(d.layout),
        // Lets Gmail/Apple Mail show their own one-click "Unsubscribe" button.
        ...(d.transactional || !d.token ? {} : {
          headers: {
            'List-Unsubscribe': `<${SITE_URL}/api/email/unsubscribe?token=${d.token}>, <mailto:nao-responda@thetropicalbakery.com?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const json = await res.json().catch(() => ({}));
    if (json?.id) {
      await db.from('email_sends').update({ provider_id: json.id })
        .eq('message_key', d.messageKey).eq('email', d.email);
    }
    return 'sent';
  } catch (err) {
    // Release the claim so this address can be retried on the next run.
    await db.from('email_sends').delete().eq('message_key', d.messageKey).eq('email', d.email);
    console.error('Email send failed for', d.email, err);
    return 'failed';
  }
}
