import { parseISODate, toISODate } from '@/lib/deliverySchedule';
import { TREAT_COUNTS, type BoxSizePrices } from '@/lib/boxSizes';

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
 *
 * PRE-SALE (migration 35, sale_mode = 'presale'): next week's box, sold before it is baked so Dolly only
 * makes what was ordered. It can be live NEXT TO the ready box (one of each). Two rules differ:
 *  - its delivery window never rolls over: it is delivered on the planned days or not at all;
 *  - orders_close_on DOES close it (the day Dolly needs the final count to bake).
 * When the batch is baked, the admin turns it into the ready box ('stock') with the extras as its stock.
 *
 * SPECIAL EDITIONS (migration 40, edition = 'special'): themed boxes (Dia das Crianças, Natal...) on sale
 * NEXT TO the weekly ones, any number of them. Like a pre-sale, a special box is delivered only inside
 * its own delivery days (it never rolls over) and orders_close_on, if set, closes it. It may be sold as
 * it is at its own price (fixed_price) instead of in the 2 / 4 / 6 sizes. Subscribers and the weekly
 * kitchen tally ignore it: splitActive() and nextBakeBox() only look at weekly boxes.
 */
export interface BoxWindowFields {
  total_quantity: number;
  sold_quantity: number;
  delivery_from?: string | null;
  delivery_until?: string | null;
  orders_open_from?: string | null;
  orders_close_on?: string | null;
  /** 'stock' (boxes already made) or 'presale' (next week's, made to order). Missing before migration 35 = stock. */
  sale_mode?: string | null;
  /** 'weekly' or 'special' (a themed box next to the weekly ones). Missing before migration 40 = weekly. */
  edition?: string | null;
}

export const isPresale = (b: { sale_mode?: string | null } | null | undefined) => b?.sale_mode === 'presale';
export const isSpecial = (b: { edition?: string | null } | null | undefined) => b?.edition === 'special';

/** Sold as it is at its own price (migration 40), or null = the usual 2 / 4 / 6 sizes. */
export const fixedPrice = (b: { fixed_price?: number | string | null } | null | undefined): number | null => {
  const n = Number(b?.fixed_price);
  return b?.fixed_price != null && n > 0 ? n : null;
};

/** "R$ 79" for a box sold as it is, "a partir de R$ 59" for the usual sizes. */
export function boxPriceText(box: { fixed_price?: number | string | null }, prices: BoxSizePrices): string {
  const own = fixedPrice(box);
  return own ? `R$ ${Math.round(own)}` : `a partir de R$ ${Math.round(Math.min(...TREAT_COUNTS.map(n => prices[n])))}`;
}

type EditionFields ={ sale_mode?: string | null; edition?: string | null };

/** The words on a box's badge: "Edição especial", "Pré-venda" or "Pronta entrega". */
export const editionLabel = (b: EditionFields) =>
  isSpecial(b) ? 'Edição especial' : isPresale(b) ? 'Pré-venda' : 'Pronta entrega';
export const editionIcon = (b: EditionFields) => (isSpecial(b) ? '🎁' : isPresale(b) ? '🗓️' : '🧁');

/** "Chegada da Primavera: Sensações Amarelas" -> "Chegada da Primavera" (for small cards and switches). */
export const shortTitle = (title: string) => {
  const i = title.indexOf(':');
  return (i > 0 ? title.slice(0, i) : title).trim();
};

/**
 * The order boxes are shown in when several are live: ones that can be ordered right now first; among
 * them the special editions (the newest announcement leads), then the ready box, then the pre-sale.
 * `open(b)` says whether a box can be ordered today (the caller knows the calendar, this file doesn't).
 */
export function sortLive<T extends EditionFields & { created_at?: string | null }>(rows: T[], open: (b: T) => boolean): T[] {
  const rank = (b: T) => (open(b) ? 0 : 3) + (isSpecial(b) ? 0 : isPresale(b) ? 2 : 1);
  return [...rows].sort((a, b) => rank(a) - rank(b) || String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

/**
 * The active WEEKLY boxes split into the ready one and the pre-sale one (at most one of each is live).
 * Special editions are left out: they are extra boxes, not the box of the week.
 * Works on a database without migration 35 too: every box is then the ready one.
 */
export function splitActive<T extends EditionFields>(rows: T[] | null | undefined): { stock: T | null; presale: T | null } {
  const list = (rows || []).filter(b => !isSpecial(b));
  return { stock: list.find(b => !isPresale(b)) ?? null, presale: list.find(b => isPresale(b)) ?? null };
}

/** The box the kitchen bakes next (and subscribers choose treats for): next week's pre-sale if there is one. */
export const nextBakeBox = <T extends EditionFields>(rows: T[] | null | undefined): T | null => {
  const { stock, presale } = splitActive(rows);
  return presale ?? stock;
};

export type SaleState = 'open' | 'soon' | 'closed' | 'soldout';

export const hasDeliveryWindow = (b: BoxWindowFields) => !!(b.delivery_from || b.delivery_until);

/** `presale` = the window never rolls over (a pre-sale, or a special edition: its own days or not at all). */
export interface DayRange { from?: string | null; until?: string | null; presale?: boolean }

/**
 * True when the planned window is over: there are deliverable days, but every one of them comes
 * after the window's last day. (`all` = every day a customer could pick at all, lead time applied.)
 */
export function isRolledOver(all: string[], w: DayRange): boolean {
  const until = w.until;
  if (w.presale) return false;   // a pre-sale is delivered on its planned days or not at all
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
  windowedDates(dates, boxRange(b), all);

export const boxRange = (b: BoxWindowFields): DayRange => ({ from: b.delivery_from, until: b.delivery_until, presale: isPresale(b) || isSpecial(b) });

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
  // A pre-sale stops taking orders on its deadline: after it Dolly is baking the count she has.
  // A special edition closes on its date too, when it has one.
  if ((isPresale(b) || isSpecial(b)) && b.orders_close_on && today > b.orders_close_on) return { state: 'closed', opensOn };
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

