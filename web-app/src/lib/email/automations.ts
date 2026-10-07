import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openDatesBetween, type DateOverride, type ScheduleRule } from '@/lib/deliverySchedule';
import { summarizeAllergens, type BoxItem } from '@/lib/allergens';
import type { AutomationDef, AutomationRow } from './automationDefs';
import type { DietTargeting, SendRequest } from './send';
import { HOST, creditDeadline, fmtWhen, normalizeEvent, venueKind, type BrunchEvent } from '@/lib/brunch';

/**
 * What each always-on rule does when the scheduler looks at it.
 *
 * A rule never sends anything itself: it reports the sends it *wants*, and the
 * cron route puts them through the same engine the admin button uses. That is
 * what keeps opt-outs, tag filters and "never twice" true for automatic mail,
 * and it means a rule can be reasoned about (and dry-run) without sending.
 *
 * The campaigns' own `messageKey` is the real safety net: `box-live:<title>`
 * means an edition can only ever be announced once per person, however many
 * times a minute the cron ticks.
 */

export interface Plan {
  /** The sends this rule wants, in order. Empty = nothing to do. */
  requests: SendRequest[];
  /** One line for the admin and the run log, in Portuguese. */
  note: string;
  /**
   * Bookkeeping to run only after the sends succeeded, e.g. marking delivery
   * dates as announced. Skipped entirely on a dry run.
   */
  after?: () => Promise<void>;
}

const nothing = (note: string): Plan => ({ requests: [], note });

/** Brazil's calendar day and hour right now (the server runs in UTC, customers live at UTC-3). */
export function brasiliaNow(now = new Date()) {
  const shifted = new Date(now.getTime() - 3 * 3600 * 1000);
  return { today: shifted.toISOString().slice(0, 10), hour: shifted.getUTCHours() };
}

const addDaysISO = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

interface BoxRow {
  id: string;
  title: string;
  description?: string | null;
  items?: BoxItem[] | null;
  total_quantity: number;
  sold_quantity: number;
  is_active: boolean;
  orders_open_from?: string | null;
  orders_close_on?: string | null;
  sale_mode?: string | null;
}

/**
 * Boxes a customer could order today. Mirrors saleState() in boxWindow.ts, minus
 * the delivery-calendar half: a rule about the box itself must not go quiet just
 * because the calendar has run out of days (that is its own, separate problem).
 *
 * `select('*')` on purpose — migrations 13 and 21 added `items` and
 * `orders_open_from`, and this must still work on a database without them.
 */
async function boxesOnSale(db: SupabaseClient, today: string): Promise<BoxRow[]> {
  const { data } = await db.from('tasting_boxes').select('*').eq('is_active', true);
  return ((data || []) as BoxRow[]).filter(b => {
    const opensOn = b.orders_open_from || null;
    if (opensOn && today < opensOn) return false;
    // A pre-sale past its deadline is being baked, not sold (migration 35).
    if (b.sale_mode === 'presale' && b.orders_close_on && today > b.orders_close_on) return false;
    return !(b.total_quantity > 0 && b.sold_quantity >= b.total_quantity);
  });
}

/** What the treats in a box really contain, so each copy can carry a personal allergen line. */
function boxDiet(box: BoxRow): DietTargeting | undefined {
  const items = (Array.isArray(box.items) ? box.items : []) as BoxItem[];
  if (!items.length) return undefined;
  const { contains, mayContain } = summarizeAllergens(items);
  if (!contains.length && !mayContain.length) return undefined;
  // Describe, never exclude: someone whose allergens clash gets the warning line
  // rather than silence. Excluding stays an explicit choice in the admin.
  return { contains: contains.map(a => a.id), mayContain: mayContain.map(a => a.id) };
}

const treatLines = (box: BoxRow) =>
  ((Array.isArray(box.items) ? box.items : []) as BoxItem[])
    .map(i => (i.name || '').trim())
    .filter(Boolean)
    .join('\n');

/** The delivery days a customer could still pick, and which of them nobody has been told about. */
async function deliveryDays(db: SupabaseClient, today: string, weeks = 8) {
  const [rulesRes, overridesRes, leadRes, notifiedRes] = await Promise.all([
    db.from('delivery_schedule_rules').select('*').eq('is_active', true),
    db.from('delivery_dates').select('delivery_date, is_open, notes, notified_at'),
    db.from('site_settings').select('value').eq('key', 'delivery_lead_days').maybeSingle(),
    db.from('delivery_notifications').select('delivery_date'),
  ]);

  const leadDays = leadRes.data ? Number(leadRes.data.value) : 2;
  const open = openDatesBetween(
    (rulesRes.data as ScheduleRule[]) || [],
    (overridesRes.data as DateOverride[]) || [],
    addDaysISO(today, leadDays),
    addDaysISO(today, weeks * 7),
  );
  const announced = new Set(((notifiedRes.data || []) as { delivery_date: string }[]).map(r => r.delivery_date));
  return { open, unannounced: open.filter(d => !announced.has(d)) };
}

// ------------------------------------------------------------------ brunch

/** The Brasília calendar day of a moment. */
const brasiliaDay = (iso: string) => brasiliaNow(new Date(iso)).today;
const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / 86400000);

const brunchWhere = (e: BrunchEvent) => {
  const v = venueKind(e.venue_kind);
  return `${e.venue_name || v.label}${e.city ? `, ${e.city}` : ''}`;
};

/** Published brunches (and finished ones, when asked: the follow-up and the chat go on after the day). */
async function brunchEvents(db: SupabaseClient, includeFinished = false): Promise<BrunchEvent[]> {
  const { data, error } = await db.from('brunch_events').select('*')
    .in('status', includeFinished ? ['publicado', 'encerrado'] : ['publicado']);
  if (error) return []; // migration 41 not run: the brunch rules simply have nothing to do
  return ((data || []) as Record<string, unknown>[]).map(normalizeEvent);
}

/** The e-mails of everyone who paid for this brunch. */
async function brunchGuests(db: SupabaseClient, eventId: string): Promise<string[]> {
  const { data } = await db.from('brunch_tickets').select('email').eq('event_id', eventId).eq('status', 'pago');
  return [...new Set((data || []).map(t => String(t.email).toLowerCase()))];
}

/**
 * Works out what one rule wants to do right now. Never sends, never writes.
 * `send_hour` has already been checked by the caller.
 */
export async function planFor(db: SupabaseClient, def: AutomationDef, row: AutomationRow): Promise<Plan> {
  const { today } = brasiliaNow();

  switch (def.id) {
    // -------------------------------------------------------------- box-live
    case 'box-live': {
      const boxes = await boxesOnSale(db, today);
      if (!boxes.length) return nothing('Nenhuma caixa à venda agora.');

      return {
        requests: boxes.map(box => ({
          campaignId: 'box-live',
          values: {
            title: box.title,
            intro: (box.description || '').trim(),
            treats: treatLines(box),
            quantity: box.total_quantity > 0 ? String(box.total_quantity) : '',
          },
          diet: boxDiet(box),
        })),
        note: boxes.length === 1
          ? `Caixa à venda: "${boxes[0].title}".`
          : `${boxes.length} caixas à venda: ${boxes.map(b => `"${b.title}"`).join(', ')}.`,
      };
    }

    // ------------------------------------------------------- box-last-chance
    case 'box-last-chance': {
      const threshold = row.threshold ?? 5;
      const boxes = await boxesOnSale(db, today);
      // A box with no total set has no "how many are left" to talk about.
      const low = boxes
        .map(b => ({ box: b, left: b.total_quantity - b.sold_quantity }))
        .filter(x => x.box.total_quantity > 0 && x.left > 0 && x.left <= threshold);

      if (!low.length) return nothing(`Nenhuma caixa com ${threshold} ou menos unidades.`);

      return {
        requests: low.map(({ box, left }) => ({
          campaignId: 'box-last-chance',
          values: { title: box.title, remaining: String(left) },
          diet: boxDiet(box),
        })),
        note: low.map(({ box, left }) => `"${box.title}": ${left} restante(s)`).join('; ') + '.',
      };
    }

    // -------------------------------------------------------- delivery-dates
    case 'delivery-dates': {
      const { unannounced } = await deliveryDays(db, today);
      if (!unannounced.length) return nothing('Nenhuma data nova de entrega para avisar.');

      return {
        requests: [{ campaignId: 'delivery-dates', values: { dates: unannounced.join(',') } }],
        note: `${unannounced.length} data(s) nova(s): ${unannounced.join(', ')}.`,
        // Only after the e-mail really went out, or a failed send would silently
        // burn the dates and nobody would ever hear about them.
        after: async () => {
          await db.from('delivery_notifications').upsert(
            unannounced.map(d => ({ delivery_date: d, notified_at: new Date().toISOString() })),
            { onConflict: 'delivery_date' },
          );
        },
      };
    }

    // --------------------------------------------------- subscriber-delivery
    case 'subscriber-delivery': {
      const offset = row.offset_days ?? 2;
      const target = addDaysISO(today, offset);
      const { open } = await deliveryDays(db, today, 4);
      if (!open.includes(target)) return nothing(`${target} não é dia de entrega (faltando ${offset} dia(s)).`);

      return {
        requests: [{ campaignId: 'subscriber-delivery', values: { date: target } }],
        note: `Entrega em ${target}, avisando ${offset} dia(s) antes.`,
      };
    }

    // -------------------------------------------------------- brunch-reminder
    case 'brunch-reminder': {
      const offset = row.offset_days ?? 2;
      const days = [...new Set([offset, 1])];
      const events = await brunchEvents(db);
      const requests: SendRequest[] = [];
      const notes: string[] = [];
      for (const e of events) {
        const d = daysBetween(today, brasiliaDay(e.starts_at));
        if (!days.includes(d)) continue;
        const guests = await brunchGuests(db, e.id);
        if (!guests.length) continue;
        requests.push({
          campaignId: 'brunch-reminder',
          values: { slug: e.slug, title: e.title, when: fmtWhen(e), where: brunchWhere(e), days: String(d), guests: String(guests.length) },
          onlyEmails: guests,
        });
        notes.push(`"${e.title}" em ${d} dia(s), ${guests.length} convidada(s)`);
      }
      return requests.length ? { requests, note: notes.join('; ') + '.' } : nothing('Nenhum brunch na data de lembrete.');
    }

    // ----------------------------------------------------- brunch-chat-digest
    case 'brunch-chat-digest': {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: msgs } = await db.from('brunch_messages').select('event_id, user_id, body, is_host, created_at')
        .gte('created_at', since).order('created_at', { ascending: true });
      const byEvent = new Map<string, { user_id: string; body: string; is_host: boolean }[]>();
      for (const m of (msgs || []) as { event_id: string; user_id: string; body: string; is_host: boolean }[]) {
        byEvent.set(m.event_id, [...(byEvent.get(m.event_id) || []), m]);
      }
      if (!byEvent.size) return nothing('Nenhuma mensagem nova nos grupos de brunch.');

      const events = (await brunchEvents(db, true)).filter(e => byEvent.has(e.id));
      const requests: SendRequest[] = [];
      for (const e of events) {
        const list = byEvent.get(e.id)!;
        const { data: tickets } = await db.from('brunch_tickets').select('user_id, email, full_name, paid_at').eq('event_id', e.id).eq('status', 'pago');
        const rows = (tickets || []) as { user_id: string | null; email: string; full_name: string | null; paid_at: string | null }[];
        const guests = rows.map(t => t.email.toLowerCase());
        if (!guests.length) continue;
        const ids = [...new Set(list.map(m => m.user_id))];
        const { data: profs } = await db.from('brunch_profiles').select('user_id, display_name').in('user_id', ids);
        const nameOf = (m: { user_id: string; is_host: boolean }) =>
          (profs || []).find(p => p.user_id === m.user_id)?.display_name
          || (m.is_host ? HOST.name : (rows.find(t => t.user_id === m.user_id)?.full_name || '').split(' ')[0] || 'Alguém');
        const preview = list.slice(-5).map(m => `${nameOf(m)}: ${m.body.replace(/\s+/g, ' ').slice(0, 140)}`).join('\n');
        const newcomers = rows.filter(t => t.paid_at && t.paid_at >= since).map(t => (t.full_name || '').split(' ')[0]).filter(Boolean).join(', ');
        requests.push({
          campaignId: 'brunch-chat-digest',
          values: { slug: e.slug, title: e.title, date: today, count: String(list.length), preview, newcomers },
          onlyEmails: guests,
        });
      }
      return requests.length
        ? { requests, note: `Resumo de ${requests.length} grupo(s) de brunch.` }
        : nothing('Mensagens novas, mas nenhum grupo com convidadas.');
    }

    // -------------------------------------------------------- brunch-followup
    case 'brunch-followup': {
      const offset = row.offset_days ?? 1;
      const events = (await brunchEvents(db, true)).filter(e => daysBetween(brasiliaDay(e.starts_at), today) === offset);
      const requests: SendRequest[] = [];
      for (const e of events) {
        const guests = await brunchGuests(db, e.id);
        if (!guests.length) continue;
        const until = creditDeadline(e.starts_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' });
        requests.push({
          campaignId: 'brunch-followup',
          values: { slug: e.slug, title: e.title, credit: e.price > 0 ? String(e.price) : '', creditUntil: e.price > 0 ? until : '' },
          onlyEmails: guests,
        });
      }
      return requests.length
        ? { requests, note: `Obrigada de ${requests.length} brunch(es).` }
        : nothing(`Nenhum brunch aconteceu há ${offset} dia(s).`);
    }

    // ------------------------------------------------------ brunch-last-seats
    case 'brunch-last-seats': {
      const threshold = row.threshold ?? 3;
      const events = (await brunchEvents(db)).filter(e => e.status === 'publicado');
      const { data: avail } = await db.rpc('brunch_availability');
      const requests: SendRequest[] = [];
      const notes: string[] = [];
      for (const e of events) {
        const a = ((avail || []) as { event_id: string; taken: number }[]).find(x => x.event_id === e.id);
        const left = e.capacity - (a?.taken ?? 0);
        if (left <= 0 || left > threshold) continue;
        const { data: buyers } = await db.from('brunch_tickets').select('email').eq('event_id', e.id).neq('status', 'cancelado');
        requests.push({
          campaignId: 'brunch-last-seats',
          values: { slug: e.slug, title: e.title, when: fmtWhen(e), remaining: String(left) },
          exceptEmails: (buyers || []).map(b => String(b.email)),
        });
        notes.push(`"${e.title}": ${left} lugar(es)`);
      }
      return requests.length ? { requests, note: notes.join('; ') + '.' } : nothing(`Nenhum brunch com ${threshold} ou menos lugares.`);
    }

    default:
      return nothing('Regra desconhecida.');
  }
}

/**
 * Is this rule allowed to act at this moment? A rule may only send inside its
 * own Brasília hour, and only once per Brasília day — so the cron can tick every
 * few minutes without a rule getting several bites at the same day.
 */
export function isDue(row: AutomationRow, now = new Date()): { due: boolean; why: string } {
  if (!row.enabled) return { due: false, why: 'desligada' };

  const { today, hour } = brasiliaNow(now);
  if (hour !== row.send_hour) return { due: false, why: `fora da hora (envia às ${row.send_hour}h)` };

  if (row.last_run_at) {
    const last = brasiliaNow(new Date(row.last_run_at)).today;
    if (last === today) return { due: false, why: 'já verificada hoje' };
  }
  return { due: true, why: '' };
}
