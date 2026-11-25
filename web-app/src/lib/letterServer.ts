import 'server-only';
import crypto from 'node:crypto';
import { LETTER_PATH } from './letter';

/**
 * The link in Dolly's Thursday e-mail: `?t=<sunday>.<signature>`. It works until the Monday after that Sunday, so a
 * forwarded or old e-mail can't be used to write next month's letter. Signed with the server's e-mail secret.
 */
const secret = () => process.env.EMAIL_CRON_SECRET || process.env.EBOOK_LINK_SECRET || '';

const sign = (sunday: string) =>
  crypto.createHmac('sha256', secret()).update(`carta:${sunday}`).digest('base64url').slice(0, 22);

export function letterToken(sunday: string): string {
  return `${sunday}.${sign(sunday)}`;
}

export function letterLink(site: string, sunday: string): string {
  return `${site}${LETTER_PATH}?t=${encodeURIComponent(letterToken(sunday))}`;
}

/** The Sunday this token is for, or null when it is forged or out of date. */
export function verifyLetterToken(token: string | null | undefined, now = new Date()): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})\.([A-Za-z0-9_-]{22})$/.exec(String(token || ''));
  if (!m || !secret()) return null;
  const want = Buffer.from(sign(m[1]));
  const got = Buffer.from(m[2]);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  const until = new Date(m[1] + 'T23:59:59-03:00').getTime() + 86400_000;
  return now.getTime() <= until ? m[1] : null;
}
