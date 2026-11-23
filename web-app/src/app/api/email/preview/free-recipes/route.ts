import { NextRequest } from 'next/server';
import { freeRecipesLayout } from '@/lib/email/funnelMail';
import { renderEmail } from '@/lib/email/layout';
import { isEbookLang } from '@/lib/ebookCopy';

/**
 * The free-recipes e-mail exactly as a sign-up receives it, opened from the team alert's "See the e-mail they got"
 * link. It holds nothing private (the recipes PDF and the book are public), and the name is trimmed to letters so the
 * page can't be made to say anything else.
 */
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const lang = isEbookLang(q.get('lang')) ? (q.get('lang') as Parameters<typeof freeRecipesLayout>[0]['lang']) : 'en';
  const firstName = (q.get('name') || '').replace(/[^\p{L}' -]/gu, '').trim().slice(0, 30);
  return new Response(renderEmail(freeRecipesLayout({ firstName, lang })), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'public, max-age=300' },
  });
}
