import { parseISODate, toISODate } from '@/lib/deliverySchedule';

/**
 * How a Degustation Box edition is offered (migration 21 added the dates):
 *  - delivery window: the days this batch was planned to go out; each customer picks one of them.
 *  - orders_open_from: a box set up ahead of time stays "soon" until that day.
 *
 * A box is on sale until it SELLS OUT or is switched off in the admin, never because a date passed.
 * When the planned delivery window is over and stock is left, the box ROLLS OVER: every deliverable day
 * from now on (calendar days, minimum notice already applied) is offered, so the next delivery is
 * simply the first day that can still be picked. orders_close_on is kept in the database but no longer
 * closes anything.
 */
export interface BoxWindowFields {
  total_quantity: number;
  sold_quantity: number;
  delivery_from?: string | null;
  delivery_until?: string | null;
  orders_open_from?: string | null;
  orders_close_on?: string | null;
}

export type SaleState = 'open' | 'soon' | 'closed' | 'soldout';

export const hasDeliveryWindow = (b: BoxWindowFields) => !!(b.delivery_from || b.delivery_until);

export interface DayRange { from?: string | null; until?: string | null }

/**
 * True when the planned window is over: there are deliverable days, but every one of them comes
 * after the window's last day. (`all` = every day a customer could pick at all, lead time applied.)
 */
export function isRolledOver(all: string[], w: DayRange): boolean {
  const until = w.until;
  return !!until && all.length > 0 && all.every(d => d > until);
}

/**
 * The days a customer may pick for a box: inside its delivery window, or, once that window is over
 * and the box is still on sale, every deliverable day. `all` defaults to `dates`; pass the full list
 * when checking a single day.
 */
export function windowedDates(dates: string[], w: DayRange, all: string[] = dates): string[] {
  if (isRolledOver(all, w)) return dates;
  return dates.filter(d => (!w.from || d >= w.from) && (!w.until || d <= w.until));
}

export const inDeliveryWindow = (dates: string[], b: BoxWindowFields, all: string[] = dates) =>
  windowedDates(dates, { from: b.delivery_from, until: b.delivery_until }, all);

/**
 * Whether this box can be ordered today: on sale until it sells out (or is switched off, which
 * removes it from the site altogether). `choosable` = the delivery days a customer could pick
 * (already rolled over); pass null when the calendar hasn't loaded yet.
 */
export function saleState(b: BoxWindowFields, choosable: string[] | null, today = toISODate(new Date())): {
  state: SaleState; opensOn: string | null;
} {
  const opensOn = b.orders_open_from || null;
  if (b.total_quantity > 0 && b.sold_quantity >= b.total_quantity) return { state: 'soldout', opensOn };
  if (opensOn && today < opensOn) return { state: 'soon', opensOn };
  // Nothing at all to pick (the delivery calendar has no open day): can't take an order.
  if (choosable && choosable.length === 0) return { state: 'closed', opensOn };
  return { state: 'open', opensOn };
}

/**
 * True when there is nothing a customer could order: the ordering window is over, or no delivery
 * day is left to pick. (Sold out and "opens soon" are different situations with their own message.)
 * `choosable` is null while the calendar is still loading.
 */
export const noUpcomingEdition = (state: SaleState, choosable: string[] | null) =>
  choosable !== null && state !== 'soldout' && state !== 'soon' && (state === 'closed' || choosable.length === 0);

/** "sábado, 26 de setembro" */
export const longDay = (iso: string) =>
  parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

/** "26 set" */
export const shortDay = (iso: string) =>
  parseISODate(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

/** "de 24 a 27 set", "a partir de 24 set", "até 27 set" */
export function deliveryWindowLabel(b: BoxWindowFields): string {
  if (b.delivery_from && b.delivery_until) {
    if (b.delivery_from === b.delivery_until) return shortDay(b.delivery_from);
    const sameMonth = b.delivery_from.slice(0, 7) === b.delivery_until.slice(0, 7);
    return sameMonth
      ? `de ${parseISODate(b.delivery_from).getDate()} a ${shortDay(b.delivery_until)}`
      : `de ${shortDay(b.delivery_from)} a ${shortDay(b.delivery_until)}`;
  }
  if (b.delivery_from) return `a partir de ${shortDay(b.delivery_from)}`;
  if (b.delivery_until) return `até ${shortDay(b.delivery_until)}`;
  return '';
}

/**
 * The last day someone may place an order. If orders_close_on is set explicitly, use that.
 * Otherwise derive it from delivery_until minus leadDays (the automatic cutoff).
 * Returns null when there is no close date to show.
 */
export function lastOrderDay(b: BoxWindowFields, leadDays: number): string | null {
  if (b.orders_close_on) return b.orders_close_on;
  if (b.delivery_until && leadDays > 0) {
    const d = parseISODate(b.delivery_until);
    d.setDate(d.getDate() - leadDays);
    return toISODate(d);
  }
  return null;
}

