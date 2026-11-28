import 'server-only';
import { CLAIM_TOPIC } from '@/lib/bonusCall';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/payments/server';
import { SITE_URL, esc, type BuiltEmail, type LayoutOptions } from './layout';
import { deliver } from './send';

/**
 * "Someone just booked": an e-mail to Andrew and Dolly for every new thing a visitor leaves on the site
 * (course or retreat request, catering quote, order, WhatsApp contact, waiting list, job application,
 * free-recipes sign-up). Their phones' Gmail app turns each one into a notification.
 *
 * How it works: after a form saves, the page pings POST /api/alerts (and a few server routes call
 * `sendNewArrivalAlerts` directly). The sweep looks at rows created in the last few minutes and mails each
 * one once. "Once" is the same guarantee every other e-mail here has: `deliver()` claims
 * (address, `alerta:<table>:<id>`) in `email_sends` first, so a second ping, or two pings at the same
 * moment, never sends a copy. A ping carries nothing: it can only ever announce rows that really exist,
 * so the open endpoint can't be used to send anybody anything.
 *
 * Recipients: ALERT_EMAILS on Vercel (comma separated), or the bakery inbox when it isn't set.
 */

/** Wide enough to survive a slow form; narrow enough that turning this on never mails old rows. */
const WINDOW_MINUTES = 15;
/** Per table per sweep. A burst bigger than this is caught by the next ping. */
const PER_TABLE = 10;
const FALLBACK_TO = 'thetropbakery@gmail.com';

export const alertRecipients = () =>
  (process.env.ALERT_EMAILS || FALLBACK_TO).split(',').map(s => s.trim()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));

interface Alert {
  subject: string;
  /** The headline facts, label → value. Empty values are dropped. */
  facts: [string, string | null | undefined][];
  whatsapp?: string | null;
  email?: string | null;
  /** The e-mail the site should have sent this person for this row, so the alert can say whether it went out. */
  expects?: { label: string; previewUrl?: string };
}

type Row = Record<string, any>;

/** Dates as Andrew and Dolly read them: 12 Dec 2026. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : (iso || '');
};
const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `R$ ${n.toFixed(2).replace('.', ',')}` : null;
};
const first = (s?: string | null) => (s || '').trim() || 'No name';

const LANG_NAME: Row = { en: 'English', pt: 'Portuguese', es: 'Spanish', nl: 'Dutch', de: 'German' };

/**
 * Where a visitor came from, in words instead of the raw utm tags. Unknown tags fall through as they are, so a new ad
 * still shows something. Add a line here when a new ad or link gets its own utm_campaign.
 */
const SOURCE_NAME: Row = {
  meta: 'Meta ad', facebook: 'Facebook', fb: 'Facebook', instagram: 'Instagram', ig: 'Instagram', whatsapp: 'WhatsApp share',
  email: 'one of our e-mails', funil: 'the thank-you page', 'app-vontade': 'the Vontade app', google: 'Google',
};
const CAMPAIGN_NAME: Row = {
  free_recipes_en_video: 'English video ad', 'receitas-pt': 'Portuguese recipes ad', 'recipes-en': 'English recipes ad',
  'rezepte-de': 'German recipes ad', receitas: 'recipes link', 'receitas-d0': 'free-recipes e-mail', bio: 'Instagram bio link', post: 'Instagram post',
};
const CONTENT_NAME: Row = { moms_snack_fight: 'moms, "snack-time fights" version' };
export function cameFrom(r: Row): string {
  const src = (r.utm_source || '').toLowerCase(), camp = (r.utm_campaign || ''), content = (r.utm_content || '');
  if (!src && !camp && !content) {
    const ref = (r.referrer || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    return ref ? `Link on ${ref}` : 'Typed the address or no tracking tag';
  }
  const parts = [CAMPAIGN_NAME[camp] || camp, CONTENT_NAME[content] || content].filter(Boolean);
  const head = SOURCE_NAME[src] || src || 'Unknown source';
  return parts.length ? `${head}: ${parts.join(', ')}` : head;
}

/** One entry per table: what to read and how to say it. Tables that don't exist yet are skipped quietly. */
const SOURCES: { table: string; build: (r: Row) => Alert }[] = [
  {
    table: 'course_registrations',
    build: r => {
      const retreat = /retiro/i.test(r.interest_type || '');
      return {
        subject: `${retreat ? 'Retreat request' : 'New class booking'}: ${first(r.customer_name)}${r.requested_date ? `, ${day(r.requested_date)}` : ''}${r.group_size ? `, ${r.group_size} ${Number(r.group_size) === 1 ? 'person' : 'people'}` : ''}`,
        facts: [
          ['Name', r.customer_name], ['What', r.specific_interest || r.interest_type], ['Date', day(r.requested_date)],
          ['People', r.group_size ? String(r.group_size) : null],
          ['Interests', Array.isArray(r.focus_areas) ? r.focus_areas.join(', ') : null], ['Message', r.message],
        ],
        whatsapp: r.customer_whatsapp, email: r.email,
      };
    },
  },
  {
    table: 'orders',
    build: r => {
      const quote = r.items?.kind === 'orcamento_evento' || r.status === 'ORCAMENTO';
      const total = money(r.total_price);
      return {
        subject: quote
          ? `Event quote request: ${first(r.customer_name)}${r.items?.guests ? `, ${r.items.guests} guests` : ''}${r.requested_date ? `, ${day(r.requested_date)}` : ''}`
          : `New order: ${first(r.customer_name)}${total ? `, ${total}` : ''} (waiting for payment)`,
        facts: [
          ['Name', r.customer_name],
          ['What', r.items_summary || (Array.isArray(r.items?.picks) ? r.items.picks.join(', ') : null)],
          ['Date', day(r.requested_date)], ['Guests', r.items?.guests ? String(r.items.guests) : null],
          ['Total', quote ? null : total], ['Reference', r.pix_transaction_id], ['Note', r.items?.note],
        ],
        whatsapp: r.customer_whatsapp, email: r.customer_email,
        expects: quote ? undefined : { label: 'the order receipt with the Pix code ("Recebemos seu pedido")' },
      };
    },
  },
  {
    table: 'contact_leads',
    build: r => ({
      subject: String(r.topic || '').startsWith(CLAIM_TOPIC)
        // The free call that comes with Sweet Escape (lib/bonusCall.ts): Dolly messages them on WhatsApp to pick a time.
        ? `Free Dolly call claimed: ${first(r.name)}, ${/· Amazon /.test(r.topic) ? 'Amazon book buyer' : /free recipes reader/.test(r.topic) ? 'free recipes reader' : 'site book buyer'}`
        : `${/coaching/i.test(r.topic || '') ? 'Coaching request' : 'New contact'}: ${first(r.name)}${r.topic ? ` (${r.topic})` : ''}`,
      facts: [['Name', r.name], ['About', r.topic], ['Page', r.source_page]],
      whatsapp: r.whatsapp, email: r.email,
    }),
  },
  {
    table: 'funnel_leads',
    build: r => {
      const lang = LANG_NAME[r.lang] ? r.lang : 'en';
      return {
        subject: `Free recipes sign-up: ${first(r.first_name)} (${CAMPAIGN_NAME[r.utm_campaign] || SOURCE_NAME[(r.utm_source || '').toLowerCase()] || LANG_NAME[lang]})`,
        facts: [
          ['Name', r.first_name], ['Language', LANG_NAME[lang]],
          ['Lives', ({ local: 'Close by (Ubatuba/Paraty)', visiting: 'Coming to visit', away: 'Far away' } as Row)[r.segment] || r.segment],
          ['Came from', cameFrom(r)],
          ['Bought the book', r.book_ref ? `Yes (${r.book_ref})` : 'Not yet'],
        ],
        email: r.email,
        expects: {
          label: `the 2 free recipes e-mail, in ${LANG_NAME[lang]}`,
          previewUrl: `${SITE_URL}/api/email/preview/free-recipes?lang=${lang}&name=${encodeURIComponent((r.first_name || '').trim().split(' ')[0].slice(0, 30))}`,
        },
      };
    },
  },
  {
    table: 'waitlist',
    build: r => ({ subject: `Waiting list: ${first(r.name)}`, facts: [['Name', r.name]], whatsapp: r.whatsapp, email: r.email }),
  },
  {
    table: 'job_applications',
    build: r => ({ subject: `Job application: ${first(r.full_name)} (${r.role || 'open role'})`, facts: [['Name', r.full_name], ['Role', r.role], ['City', r.city]], whatsapp: r.whatsapp, email: r.email }),
  },
];

const waLink = (v: string) => {
  const d = v.replace(/\D/g, '');
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`;
};

interface SentMail { subject: string | null; status: string | null; provider_id: string | null; sent_at: string }

/** What the site e-mailed this person since they arrived (the alert's own sends left out). */
async function mailsTo(db: SupabaseClient, email: string | null | undefined, since: string): Promise<SentMail[] | null> {
  const to = (email || '').trim().toLowerCase();
  if (!to.includes('@')) return null;
  const from = new Date(new Date(since).getTime() - 2 * 60_000).toISOString();
  const { data, error } = await db.from('email_sends').select('subject,status,provider_id,sent_at')
    .ilike('email', to).gte('sent_at', from).not('message_key', 'like', 'alerta:%').order('sent_at').limit(5);
  return error ? null : (data as SentMail[]);
}

const FONT = `'Outfit',Helvetica,Arial,sans-serif`;
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

/** "What they got": every e-mail that went to them, or a clear warning when the one they should have got is missing. */
function receivedBlock(a: Alert, mails: SentMail[] | null): string {
  if (!a.email || (!a.expects && !mails?.length)) return '';
  const ok = (m: SentMail) => m.status !== 'failed';
  const good = (mails || []).filter(ok);
  const box = (bg: string, line: string, inner: string) =>
    `<div style="margin:6px 0 18px;padding:14px 16px;border-radius:12px;background:${bg};border:1px solid ${line};font-family:${FONT};font-size:15px;line-height:1.55;color:#2a1a12;">${inner}</div>`;
  const title = (t: string) => `<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:#2a1a12;">${t}</p>`;
  const preview = a.expects?.previewUrl
    ? `<p style="margin:8px 0 0;"><a href="${a.expects.previewUrl}" style="color:#a8843f;font-weight:bold;">See the e-mail they got &rarr;</a></p>`
    : '';
  if (good.length) {
    return box('#eefbf1', '#bfe8cb',
      title('&#10003; What they got') +
      good.map(m => `<p style="margin:0 0 4px;"><b>${esc(m.subject || 'E-mail')}</b><br><span style="color:#5b463a;">Sent to ${esc(a.email!)} at ${time(m.sent_at)} (Brasília)${m.provider_id ? ', accepted by the mail service' : ''}</span></p>`).join('') +
      (a.expects ? `<p style="margin:6px 0 0;color:#5b463a;">That is ${esc(a.expects.label)}.</p>` : '') + preview);
  }
  if (mails === null) {
    return box('#fdf7ec', '#eadfca', title('What they got') + `<p style="margin:0;">Couldn't check the send log. ${a.expects ? `They should have got ${esc(a.expects.label)}.` : ''}</p>` + preview);
  }
  return box('#fff1ec', '#ffc9b5',
    title('&#9888; Nothing went out to them') +
    `<p style="margin:0;">${a.expects ? `They should have got ${esc(a.expects.label)}, but the site has no record of it being sent.` : 'The site sent them no e-mail.'} Reply to them by hand, and tell Claude so we can look at why.</p>` + preview);
}

function body(a: Alert, mails: SentMail[] | null) {
  const rows = a.facts.filter(([, v]) => v && String(v).trim());
  const contact: string[] = [];
  if (a.whatsapp) contact.push(`WhatsApp: <a href="${waLink(a.whatsapp)}">${esc(a.whatsapp)}</a>`);
  if (a.email) contact.push(`E-mail: <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>`);
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.5;color:#2a1a12;">` +
    rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:700;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:4px 0;">${esc(String(v))}</td></tr>`).join('') +
    `</table>` +
    (contact.length ? `<p style="margin:0 0 12px;font-family:${FONT};font-size:16px;">${contact.join('<br>')}</p>` : '') +
    receivedBlock(a, mails)
  );
}

function alertLayout(a: Alert, mails: SentMail[] | null): LayoutOptions {
  return {
    preheader: a.facts.filter(([, v]) => v).map(([, v]) => v).join(' · ').slice(0, 140),
    heading: a.subject,
    body: body(a, mails),
    cta: { label: 'Open the inbox', href: `${SITE_URL}/admin` },
    note: 'Automatic note from the site to the team.',
    lang: 'en',
  };
}

/**
 * For Admin › E-mails › "Todos os e-mails": the team alert as it looks for one made-up row of `table`
 * (the newest free-recipes sign-up by default), with the "What they got" box filled in.
 */
export function sampleAlert(table: string, row: Row): BuiltEmail | null {
  const source = SOURCES.find(s => s.table === table);
  if (!source) return null;
  const a = source.build(row);
  const mails: SentMail[] | null = a.expects
    ? [{ subject: a.expects.label, status: 'sent', provider_id: 'exemplo', sent_at: new Date().toISOString() }]
    : null;
  return { messageKey: `alerta:${table}:exemplo`, subject: a.subject, layout: alertLayout(a, mails) };
}

export interface AlertResult { sent: number; failed: number; checked: number }

/** Mails every row created in the last few minutes that hasn't been announced yet. Never throws. */
export async function sendNewArrivalAlerts(db: SupabaseClient, windowMinutes = WINDOW_MINUTES): Promise<AlertResult> {
  const to = alertRecipients();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const result: AlertResult = { sent: 0, failed: 0, checked: 0 };
  if (!to.length || !process.env.RESEND_API_KEY) return result;

  for (const source of SOURCES) {
    try {
      const { data, error } = await db.from(source.table).select('*')
        .gte('created_at', since).order('created_at', { ascending: true }).limit(PER_TABLE);
      if (error || !data) continue;
      for (const row of data as Row[]) {
        result.checked += 1;
        const a = source.build(row);
        const mails = await mailsTo(db, a.email, row.created_at || since).catch(() => null);
        for (const email of to) {
          const outcome = await deliver(db, {
            email, token: '', messageKey: `alerta:${source.table}:${row.id}`, subject: a.subject,
            topic: 'pedido', template: 'alerta-interno', transactional: true,
            layout: alertLayout(a, mails),
          }).catch(err => { console.error('alert deliver failed', err); return 'failed' as const; });
          if (outcome === 'sent') result.sent += 1;
          else if (outcome === 'failed') result.failed += 1;
        }
      }
    } catch (err) {
      console.error(`alerts: ${source.table}`, err);
    }
  }
  return result;
}

/** For server routes that just saved something: run the sweep once the visitor already has their answer. */
export function alertAfterResponse() {
  after(async () => {
    try { await sendNewArrivalAlerts(supabaseAdmin()); } catch (err) { console.error('alerts after response', err); }
  });
}
