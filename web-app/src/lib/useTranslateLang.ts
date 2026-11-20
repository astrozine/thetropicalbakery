'use client';

import { useEffect, useState } from 'react';

/**
 * The language Google Translate is turning this Portuguese page into ('pt' when it isn't translating).
 * Read from Google's `googtrans` cookie, and re-read when Google flips <html lang> or adds its
 * `translated-ltr` class, because picking a language in the menu translates the page without a reload.
 */
export function readTranslateLang(): string {
  if (typeof document === 'undefined') return 'pt';
  const m = /(?:^|;\s*)googtrans=\/[^/;]*\/([a-z]{2})/.exec(document.cookie);
  if (m) return m[1];
  const html = document.documentElement;
  if (/\btranslated-(ltr|rtl)\b/.test(html.className)) return (html.lang || 'pt').slice(0, 2).toLowerCase();
  return 'pt';
}

export function useTranslateLang(): string {
  const [lang, setLang] = useState('pt');
  useEffect(() => {
    const read = () => setLang(readTranslateLang());
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    return () => mo.disconnect();
  }, []);
  return lang;
}
