/**
 * A pickup box is made for a box day and then waits in the kitchen freezer (never the fridge). The customer can come
 * that day or any of the next PICKUP_EXTRA_DAYS days, never later (freshness).
 *
 * The order still stores only the box day (`requested_date`): the last pickup day is always
 * worked out from it here, so the kitchen, the stock and the server checks don't change.
 * Pure, so the calendar, Minha Conta, the admin inbox and the e-mails all say the same thing.
 */
export const PICKUP_EXTRA_DAYS = 3;

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Every day the box can be collected, ready day first. */
export function pickupDays(readyIso: string): string[] {
  const start = parse(readyIso);
  return Array.from({ length: PICKUP_EXTRA_DAYS + 1 }, (_, i) => iso(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
}

/** The last day they can come (YYYY-MM-DD). */
export const pickupLastDay = (readyIso: string) => pickupDays(readyIso)[PICKUP_EXTRA_DAYS];

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "segunda, 28 de setembro" (no Intl, so the server e-mail and the browser agree). */
export const shortDay = (dayIso: string) => {
  const d = parse(dayIso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate() === 1 ? '1º' : d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

/** "Pronta segunda, 28 de setembro · retire até quinta, 1º de outubro". */
export const pickupWindowText = (readyIso: string) =>
  `Pronta ${shortDay(readyIso)} · retire até ${shortDay(pickupLastDay(readyIso))}`;
