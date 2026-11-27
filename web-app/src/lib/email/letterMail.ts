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

const inlinePhoto = (u: string, alt: string) =>
  `<img src="${esc(u)}" alt="${esc(alt)}" width="508" style="display:block;width:100%;max-width:508px;height:auto;border-radius:14px;margin:6px 0 22px;">`;

/** Split text into `n` runs of whole sentences of about the same length (for a letter written as one long paragraph). */
function sentenceRuns(text: string, n: number): string[] {
  const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  if (sentences.length <= n) return sentences;
  const target = text.length / n;
  const runs: string[] = [];
  let cur = '';
  for (const s of sentences) {
    cur = cur ? `${cur} ${s}` : s;
    if (cur.length >= target && runs.length < n - 1) { runs.push(cur); cur = ''; }
  }
  if (cur) runs.push(cur);
  return runs;
}

/**
 * Dolly's letter body (Andrew, 2026-11-27: "one hero and the rest scattered to break up the design"): the first photo
 * goes on top as the e-mail's hero (see `letterHero`), the others sit between the paragraphs, spread evenly. A letter
 * written as one long paragraph is cut into runs of whole sentences so the photos still have somewhere to go.
 */
export function letterStory(story: string, rawPhotos: string | string[] | null | undefined, alt = 'Dolly'): string {
  const rest = photoList(rawPhotos).slice(1);
  let paras = (story || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (rest.length && paras.length < rest.length + 1) {
    paras = paras.flatMap(p => sentenceRuns(p, Math.max(1, Math.ceil((rest.length + 1) * p.length / Math.max(1, story.length)))));
  }
  if (!rest.length) return paragraphs(paras.join('\n\n'));
  // Photo i goes after paragraph round((i + 1) * len / (rest + 1)); leftovers (a very short story) close the story.
  const after = new Map<number, string[]>();
  rest.forEach((u, i) => {
    const at = Math.min(paras.length, Math.max(1, Math.round(((i + 1) * paras.length) / (rest.length + 1))));
    after.set(at, [...(after.get(at) || []), u]);
  });
  return paras
    .map((p, i) => paragraphs(p) + (after.get(i + 1) || []).map(u => inlinePhoto(u, alt)).join(''))
    .join('') + (paras.length ? '' : rest.map(u => inlinePhoto(u, alt)).join(''));
}

/** The first photo, as the e-mail's top image. */
export const letterHero = (rawPhotos: string | string[] | null | undefined, alt = 'Dolly') => {
  const first = photoList(rawPhotos)[0];
  return first ? { src: first, alt } : undefined;
};

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
      heroPhoto: letterHero(s.photos),
      body:
        paragraphs(`For ${prettySunday(s.sunday)}, written in ${s.lang === 'pt' ? 'Portuguese' : 'English'}. It goes to the people on the list who read ${s.lang === 'pt' ? 'Portuguese' : 'English'}.`) +
        kicker(title) +
        letterStory(s.story, s.photos) +
        (s.tip ? kicker('Her tip') + paragraphs(s.tip) : ''),
      cta: { label: 'Open it ready to send', href: adminLetterLink(s.id) },
      note: 'Nothing is sent until you press Enviar in Admin › E-mails. You can change any word first.',
    },
  };
}
