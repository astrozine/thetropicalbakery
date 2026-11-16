'use client';

import { useEffect } from 'react';
import { clearGoogleTranslate } from '@/lib/googleTranslate';

/**
 * Keeps machine translation off pages we wrote by hand in several languages (Sweet Escape, free recipes, coaching).
 *
 * The site's Google Translate keeps the visitor's choice in a `googtrans` cookie for the whole site, and phones can
 * translate a page on their own too. On a hand-written page that produced half-translated nonsense: Dolly opened the
 * Portuguese Sweet Escape page with English on and read "Your sweet escape He's waiting" and "a kitchen in the woods",
 * with the recipe cards still in Portuguese (2026-11-16). When the page is being translated into a language we wrote
 * ourselves, send the visitor to that page instead; when it is being "translated" into its own language, stop it.
 * Languages we don't have (French, Italian) are left to Google.
 */
export default function HandWrittenLang({ lang, paths }: { lang: string; paths: Partial<Record<string, string>> }) {
  useEffect(() => {
    let done = false;
    const target = (): string | null => {
      const m = /(?:^|;\s*)googtrans=\/[^/;]*\/([a-z]{2})/.exec(document.cookie);
      if (m) return m[1];
      const html = document.documentElement;
      if (/\btranslated-(ltr|rtl)\b/.test(html.className)) return (html.lang || '').slice(0, 2).toLowerCase() || null;
      return null;
    };
    const check = () => {
      if (done) return;
      const t = target();
      if (!t || !paths[t]) return;
      done = true;
      const translating = /\btranslated-(ltr|rtl)\b/.test(document.documentElement.className);
      clearGoogleTranslate();
      if (t === lang) {
        if (translating) window.location.reload();
        else done = false;
        return;
      }
      window.location.replace(`${paths[t]}${window.location.search}`);
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    return () => mo.disconnect();
  }, [lang, paths]);
  return null;
}
