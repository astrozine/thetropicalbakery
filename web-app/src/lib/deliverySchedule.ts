import { supabase } from '@/lib/supabase';

/**
 * Delivery days for the Degustation Boxes (single orders and subscriptions).
 * Menu de Eventos items are NOT tied to this — see the checkout.
 *
 * A day is open when:
 *   - a delivery_dates override says is_open = true, or
 *   - no override exists and an active rule produces it.
 * A day is blocked when an override says is_open = false.
 */

export interface ScheduleRule {
  id: string;
  frequency: 'weekly' | 'monthly';
  weekday: number; // 0 = Sunday
  interval_weeks: number;
  month_nth: number | null; // 1..4, or -1 for "last"
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface DateOverride {
  delivery_date: string;
  is_open: boolean;
  notes: string | null;
  notified_at?: string | null;
}

export const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Local-time YYYY-MM-DD (toISOString would shift the day for anyone east/west of UTC). */
export const toISODate = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const parseISODate = (iso: string) => new Date(iso + 'T00:00:00');

const utcDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Does this rule produce a delivery on this day? */
export function ruleMatches(rule: ScheduleRule, iso: string): boolean {
  if (!rule.is_active) return false;
  if (iso < rule.start_date) return false;
  if (rule.end_date && iso > rule.end_date) return false;

  const [y, m, d] = iso.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (weekday !== rule.weekday) return false;

  if (rule.frequency === 'monthly') {
    if (rule.month_nth === -1) {
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      return d + 7 > daysInMonth;
    }
    return Math.ceil(d / 7) === (rule.month_nth ?? 1);
  }

  // weekly: count from the first matching weekday on/after the start date
  const startWeekday = new Date(utcDay(rule.start_date)).getUTCDay();
  const offset = (rule.weekday - startWeekday + 7) % 7;
  const anchor = utcDay(rule.start_date) + offset * 86400000;
  const diffDays = Math.round((utcDay(iso) - anchor) / 86400000);
  return diffDays >= 0 && diffDays % (7 * Math.max(1, rule.interval_weeks)) === 0;
}

export type DayState = 'open' | 'blocked' | 'closed';

export function dayState(iso: string, rules: ScheduleRule[], overrides: Map<string, DateOverride>): {
  state: DayState;
  fromRule: boolean;
  override?: DateOverride;
} {
  const fromRule = rules.some(r => ruleMatches(r, iso));
  const override = overrides.get(iso);
  if (override) return { state: override.is_open ? 'open' : 'blocked', fromRule, override };
  return { state: fromRule ? 'open' : 'closed', fromRule };
}

export const overrideMap = (list: DateOverride[]) => new Map(list.map(o => [o.delivery_date, o]));

/** Every open day in [fromISO, toISO], in order. */
export function openDatesBetween(rules: ScheduleRule[], overrides: DateOverride[], fromISO: string, toISO: string): string[] {
  const map = overrideMap(overrides);
  const out: string[] = [];
  const cursor = parseISODate(fromISO);
  const end = parseISODate(toISO);
  while (cursor <= end) {
    const iso = toISODate(cursor);
    if (dayState(iso, rules, map).state === 'open') out.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export interface DeliverySchedule {
  rules: ScheduleRule[];
  overrides: DateOverride[];
  leadDays: number;
}

/** Loads the schedule; tolerant of the rules table not existing yet (migration 12 not run). */
export async function fetchSchedule(): Promise<DeliverySchedule> {
  const [rulesRes, overridesRes, leadRes] = await Promise.all([
    supabase.from('delivery_schedule_rules').select('*').eq('is_active', true),
    supabase.from('delivery_dates').select('delivery_date, is_open, notes, notified_at'),
    supabase.from('site_settings').select('value').eq('key', 'delivery_lead_days').maybeSingle(),
  ]);
  return {
    rules: (rulesRes.data as ScheduleRule[]) || [],
    overrides: (overridesRes.data as DateOverride[]) || [],
    leadDays: leadRes.data ? Number(leadRes.data.value) : 2,
  };
}

/** The days a customer may actually pick: open, and at least `leadDays` from today. */
export function selectableDates(schedule: DeliverySchedule, weeksAhead = 14): string[] {
  const today = new Date();
  const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate() + schedule.leadDays);
  const latest = new Date(today.getFullYear(), today.getMonth(), today.getDate() + weeksAhead * 7);
  return openDatesBetween(schedule.rules, schedule.overrides, toISODate(earliest), toISODate(latest));
}

/** "Toda sexta", "Quinta sim, quinta não", "1º sábado do mês"… for humans. */
export function describeRule(r: ScheduleRule): string {
  const day = WEEKDAY_NAMES[r.weekday];
  const feminine = r.weekday === 0 || r.weekday === 6 ? false : true; // "toda terça", "todo sábado"
  if (r.frequency === 'monthly') {
    const nth = r.month_nth === -1 ? 'último' : `${r.month_nth}º`;
    return `${nth} ${day} do mês`;
  }
  const every = feminine ? 'Toda' : 'Todo';
  if (r.interval_weeks === 1) return `${every} ${day}`;
  if (r.interval_weeks === 2) return `${day[0].toUpperCase() + day.slice(1)} sim, ${day} não (a cada 2 semanas)`;
  return `A cada ${r.interval_weeks} semanas, na ${day}`;
}
