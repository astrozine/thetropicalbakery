/**
 * The box's date label is stored exactly as typed in the admin's date box
 * ("2026-09-23"), and a two-digit year typed there becomes year 26 ("0026-09-23").
 * Show it the way a person would say it, and heal that year typo on the way.
 * Anything that isn't a date (an older free-text label) is shown untouched.
 */
export function formatBatchDate(label: string | null | undefined): string {
  if (!label) return '';
  const m = /^(\d{4,6})-(\d{2})-(\d{2})$/.exec(label.trim());
  if (!m) return label;
  let year = Number(m[1]);
  if (year < 100) year += 2000;
  const date = new Date(year, Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return label;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}
