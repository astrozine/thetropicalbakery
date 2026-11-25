/**
 * The e-mails around Dolly's weekly letter (lib/letter.ts):
 * - `letterPhotos()`: her photos as full-width images, used by the Sunday letter itself and by the preview below.
 * - `letterReceivedEmail()`: to Andrew (ALERT_EMAILS) the moment she sends it: what she wrote, her photos, and one
 *   button that opens Admin › E-mails with the Sunday letter filled in.
 *
 * Pure string building, so Admin › Todos os e-mails can preview it.
 */

import { SITE_URL, esc, kicker, paragraphs, type BuiltEmail } from './layout';
import { prettySunday, titleFrom, type LetterSubmission } from '@/lib/letter';

/** Photo URLs, one per line (or comma separated) → full-width images. Only http(s) links are kept. */
export const photoList = (raw: string | string[] | null | undefined): string[] =>
  (Array.isArray(raw) ? raw : String(raw || '').split(/[\n,]/))
    .map(s => s.trim())
    .filter(s => /^https:\/\/[^\s"'<>]+$/.test(s))
    .slice(0, 6);

export const letterPhotos = (raw: string | string[] | null | undefined, alt = 'Dolly') =>
  photoList(raw)
    .map(u => `<img src="${esc(u)}" alt="${esc(alt)}" width="520" style="display:block;width:100%;max-width:520px;height:auto;border-radius:14px;margin:0 0 14px;">`)
    .join('');

export const adminLetterLink = (id: string) => `${SITE_URL}/admin/emails?campaign=carta-domingo&carta=${encodeURIComponent(id)}`;

export function letterReceivedEmail(s: LetterSubmission): BuiltEmail {
  const title = s.title || titleFrom(s.story);
  return {
    messageKey: `carta-recebida:${s.id}`,
    subject: `Dolly sent this week's letter: ${title}`,
    layout: {
      preheader: `For ${prettySunday(s.sunday)}, in ${s.lang === 'pt' ? 'Portuguese' : 'English'}. Read it and press Send.`,
      heading: 'Dolly sent this week’s letter',
      lang: 'en',
      body:
        paragraphs(`For ${prettySunday(s.sunday)}, written in ${s.lang === 'pt' ? 'Portuguese' : 'English'}. It goes to the people on the list who read ${s.lang === 'pt' ? 'Portuguese' : 'English'}.`) +
        kicker(title) +
        letterPhotos(s.photos) +
        paragraphs(s.story) +
        (s.tip ? kicker('Her tip') + paragraphs(s.tip) : ''),
      cta: { label: 'Open it ready to send', href: adminLetterLink(s.id) },
      note: 'Nothing is sent until you press Enviar in Admin › E-mails. You can change any word first.',
    },
  };
}
