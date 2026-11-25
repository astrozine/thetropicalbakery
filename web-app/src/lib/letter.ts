/**
 * Dolly's weekly letter inbox (Andrew, 2026-11-25).
 *
 * Every Thursday the automation 'carta-pedido' e-mails Dolly one link (no login) to /carta/escrever. On that page she
 * adds a few photos and a few lines about her week and taps Send. The site saves it in `letter_submissions`
 * (migration_54_letter_inbox.sql), puts the photos in the public `uploads` bucket, and e-mails Andrew (ALERT_EMAILS)
 * a preview with one button: Admin › E-mails opened on "Carta de domingo da Dolly" with everything filled in. Andrew
 * reads it and presses Send. Nothing goes to the list by itself.
 *
 * Pure data, shared by the page, the API route and the e-mails.
 */

/** Who writes the letter. */
export const LETTER_WRITER = { name: 'Dolly', email: 'elisabeth.vandam@gmail.com' } as const;

/** The day the prompt goes out, in Brasília: 0 = Sunday … 4 = Thursday. */
export const PROMPT_WEEKDAY = 4;

export const LETTER_MAX_PHOTOS = 4;
export const LETTER_PATH = '/carta/escrever';

/** The Sunday a letter written today is for: the next Sunday (today, if it is Sunday before the letter goes out). */
export function sundayFor(todayIso: string): string {
  const d = new Date(todayIso + 'T12:00:00Z');
  const add = (7 - d.getUTCDay()) % 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

/** "Sunday 30 November" */
export function prettySunday(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/** A first title from the story when Dolly leaves the title empty: its first sentence, kept short. */
export function titleFrom(story: string): string {
  const first = (story || '').trim().split(/(?<=[.!?])\s|\n/)[0] || '';
  return first.length > 70 ? first.slice(0, 67).replace(/\s+\S*$/, '') + '…' : first;
}

export interface LetterSubmission {
  id: string;
  created_at: string;
  sunday: string;
  lang: 'en' | 'pt';
  title: string | null;
  story: string;
  tip: string | null;
  photos: string[];
}
