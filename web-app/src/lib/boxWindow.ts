import { parseISODate, toISODate } from '@/lib/deliverySchedule';

/**
 * The two windows of a Degustation Box edition (migration 21):
 *  - delivery window: the days this edition goes out; each customer picks one of them.
 *  - ordering window: the days orders are accepted.
 * Ordering is also closed once the box is sold out. A box with none of these dates set behaves as
 * before (any open calendar day, orders always open while there is stock).
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

const addDays = (iso: string, n: number) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

export const hasDeliveryWindow = (b: BoxWindowFields) => !!(b.delivery_from || b.delivery_until);

/** Keeps only the calendar days inside the box's delivery window. */
export const inDeliveryWindow = (dates: string[], b: BoxWindowFields) =>
  dates.filter(d => (!b.delivery_from || d >= b.delivery_from) && (!b.delivery_until || d <= b.delivery_until));

/** Last day orders are taken: the explicit deadline, or the last delivery day minus the notice. */
export function lastOrderDay(b: BoxWindowFields, leadDays: number): string | null {
  if (b.orders_close_on) return b.orders_close_on;
  if (b.delivery_until) return addDays(b.delivery_until, -leadDays);
  return null;
}

/**
 * Whether this box can be ordered today.
 * `choosable` = the delivery days a customer could still pick (already inside the window);
 * pass null when the calendar hasn't loaded yet.
 */
export function saleState(b: BoxWindowFields, leadDays: number, choosable: string[] | null, today = toISODate(new Date())): {
  state: SaleState; opensOn: string | null; closesOn: string | null;
} {
  const closesOn = lastOrderDay(b, leadDays);
  const opensOn = b.orders_open_from || null;
  if (b.total_quantity > 0 && b.sold_quantity >= b.total_quantity) return { state: 'soldout', opensOn, closesOn };
  if (opensOn && today < opensOn) return { state: 'soon', opensOn, closesOn };
  if (closesOn && today > closesOn) return { state: 'closed', opensOn, closesOn };
  if (hasDeliveryWindow(b) && choosable && choosable.length === 0) return { state: 'closed', opensOn, closesOn };
  return { state: 'open', opensOn, closesOn };
}

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
