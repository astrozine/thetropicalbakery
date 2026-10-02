import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openDatesBetween, type DateOverride, type ScheduleRule } from '@/lib/deliverySchedule';
import { summarizeAllergens, type BoxItem } from '@/lib/allergens';
import type { AutomationDef, AutomationRow } from './automationDefs';
import type { DietTargeting, SendRequest } from './send';

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
