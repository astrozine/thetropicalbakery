import 'server-only';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/payments/server';
import { SITE_URL, esc } from './layout';
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
}

type Row = Record<string, any>;

const br = (iso?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || '');
};
const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `R$ ${n.toFixed(2).replace('.', ',')}` : null;
};
const first = (s?: string | null) => (s || '').trim() || 'Sem nome';

/** One entry per table: what to read and how to say it. Tables that don't exist yet are skipped quietly. */
const SOURCES: { table: string; build: (r: Row) => Alert }[] = [
  {
    table: 'course_registrations',
    build: r => {
      const retreat = /retiro/i.test(r.interest_type || '');
      return {
        subject: `${retreat ? '🏝️ Pedido de retiro' : '👩‍🍳 Nova reserva de aula'}: ${first(r.customer_name)}${r.requested_date ? `, ${br(r.requested_date)}` : ''}${r.group_size ? `, ${r.group_size} pessoa(s)` : ''}`,
        facts: [
          ['Nome', r.customer_name], ['O quê', r.specific_interest || r.interest_type], ['Data', br(r.requested_date)],
          ['Pessoas', r.group_size ? String(r.group_size) : null],
          ['Interesses', Array.isArray(r.focus_areas) ? r.focus_areas.join(', ') : null], ['Mensagem', r.message],
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
          ? `🎉 Pedido de orçamento (evento): ${first(r.customer_name)}${r.items?.guests ? `, ${r.items.guests} convidados` : ''}${r.requested_date ? `, ${br(r.requested_date)}` : ''}`
          : `🛒 Novo pedido: ${first(r.customer_name)}${total ? `, ${total}` : ''} (aguardando pagamento)`,
        facts: [
          ['Nome', r.customer_name],
          ['O quê', r.items_summary || (Array.isArray(r.items?.picks) ? r.items.picks.join(', ') : null)],
          ['Data', br(r.requested_date)], ['Convidados', r.items?.guests ? String(r.items.guests) : null],
          ['Total', quote ? null : total], ['Referência', r.pix_transaction_id], ['Observação', r.items?.note],
        ],
        whatsapp: r.customer_whatsapp, email: r.customer_email,
      };
    },
  },
  {
    table: 'contact_leads',
    build: r => ({
      subject: `💬 ${/coaching/i.test(r.topic || '') ? 'Pedido de coaching' : 'Novo contato'}: ${first(r.name)}${r.topic ? ` (${r.topic})` : ''}`,
      facts: [['Nome', r.name], ['Assunto', r.topic], ['Página', r.source_page]],
      whatsapp: r.whatsapp, email: r.email,
    }),
  },
  {
    table: 'funnel_leads',
    build: r => ({
      subject: `📗 Receitas grátis: ${first(r.first_name)} (${r.email})`,
      facts: [
        ['Nome', r.first_name], ['Onde mora', ({ local: 'Perto (Ubatuba/Paraty)', visiting: 'Vem visitar', away: 'Longe' } as Row)[r.segment] || r.segment],
        ['Idioma', r.lang], ['Veio de', [r.utm_source, r.utm_campaign, r.utm_content].filter(Boolean).join(' / ') || null],
        ['Comprou o livro', r.book_ref ? `sim (${r.book_ref})` : null],
      ],
      email: r.email,
    }),
  },
  {
    table: 'waitlist',
    build: r => ({ subject: `⏳ Fila de espera: ${first(r.name)}`, facts: [['Nome', r.name]], whatsapp: r.whatsapp, email: r.email }),
  },
  {
    table: 'job_applications',
    build: r => ({ subject: `🧑‍🍳 Candidatura: ${first(r.full_name)} (${r.role || 'vaga'})`, facts: [['Nome', r.full_name], ['Vaga', r.role], ['Cidade', r.city]], whatsapp: r.whatsapp, email: r.email }),
  },
];

const waLink = (v: string) => {
  const d = v.replace(/\D/g, '');
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`;
};

function body(a: Alert) {
  const rows = a.facts.filter(([, v]) => v && String(v).trim());
  const contact: string[] = [];
  if (a.whatsapp) contact.push(`WhatsApp: <a href="${waLink(a.whatsapp)}">${esc(a.whatsapp)}</a>`);
  if (a.email) contact.push(`E-mail: <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>`);
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 16px;font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#3c2a21;">` +
    rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:700;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:4px 0;">${esc(String(v))}</td></tr>`).join('') +
    `</table>` +
    (contact.length ? `<p style="margin:0 0 12px;font-size:16px;">${contact.join('<br>')}</p>` : '')
  );
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
        for (const email of to) {
          const outcome = await deliver(db, {
            email, token: '', messageKey: `alerta:${source.table}:${row.id}`, subject: a.subject,
            topic: 'pedido', template: 'alerta-interno', transactional: true,
            layout: {
              preheader: a.facts.filter(([, v]) => v).map(([, v]) => v).join(' · ').slice(0, 140),
              heading: a.subject,
              body: body(a),
              cta: { label: 'Abrir a Caixa de Entrada', href: `${SITE_URL}/admin` },
              note: 'Aviso automático do site para a equipe.',
              icon: '🔔',
            },
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
