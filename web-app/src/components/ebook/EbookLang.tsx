'use client';

import React, { useEffect, useState } from 'react';
import { EBOOK_COPY, GOOGLE_LANGS, LANG_LABEL, LANG_PATH, EBOOK_LANGS, type EbookLang } from '@/lib/ebookCopy';

/**
 * Language helpers for the Sweet Escape pages.
 *
 * English, Portuguese and Spanish are hand-written pages. Other languages use the site's Google Translate on the
 * English page. The site's translator stores its choice in the `googtrans` cookie for the whole site, so going to
 * a hand-written page must clear it first, or Google would translate our Portuguese into French.
 */

/** **bold** and *italic* inside a translated string. */
export function rich(s: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(m[1] != null ? <b key={k++}>{m[1]}</b> : <em key={k++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function clearGoogleTranslate() {
  const host = window.location.hostname;
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `googtrans=; ${expire}`;
  document.cookie = `googtrans=; ${expire} domain=${host};`;
  document.cookie = `googtrans=; ${expire} domain=.${host};`;
}

const isTranslated = () => /\btranslated-(ltr|rtl)\b/.test(document.documentElement.className);

/** True while Google Translate has rewritten the page into another language. */
export function useGoogleTranslated(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setOn(isTranslated());
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return on;
}

/** On the English page, `?tl=fr` asks the site's Google Translate for that language once its widget is ready. */
function useTranslateFromQuery(lang: EbookLang) {
  useEffect(() => {
    if (lang !== 'en') return;
    const tl = new URLSearchParams(window.location.search).get('tl');
    if (!tl || !GOOGLE_LANGS.some(g => g.code === tl)) return;
    let tries = 0;
    const t = setInterval(() => {
      const sel = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (sel && sel.options.length > 1) {
        sel.value = tl;
        sel.dispatchEvent(new Event('change'));
        clearInterval(t);
      } else if (++tries > 40) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [lang]);
}

function go(href: string) {
  clearGoogleTranslate();
  window.location.href = href;
}

/** The strip at the very top: our three languages, plus Google for four more. */
export function LangBar({ lang }: { lang: EbookLang }) {
  const c = EBOOK_COPY[lang];
  useTranslateFromQuery(lang);
  const translated = useGoogleTranslated();
  const [suggest, setSuggest] = useState<EbookLang | null>(null);

  // An English page opened by someone whose phone is in Portuguese or Spanish: offer their page.
  useEffect(() => {
    if (lang !== 'en') return;
    try { if (sessionStorage.getItem('se-lang-dismissed')) return; } catch { /* private mode */ }
    const nav = (navigator.language || '').slice(0, 2);
    if (nav === 'pt' || nav === 'es') setSuggest(nav);
  }, [lang]);

  const dismiss = () => {
    setSuggest(null);
    try { sessionStorage.setItem('se-lang-dismissed', '1'); } catch { /* private mode */ }
  };

  return (
    <div className="se-langbar">
      <div className="se-wrap se-langbar__row">
        <span className="se-langbar__label"><span aria-hidden>🌍</span> {c.langBar.label}</span>
        <nav className="se-langbar__langs notranslate" translate="no" aria-label={c.langBar.label}>
          {EBOOK_LANGS.map(l => (
            <a
              key={l}
              href={LANG_PATH[l]}
              hrefLang={l}
              lang={l}
              aria-current={l === lang && !translated ? 'page' : undefined}
              className={l === lang && !translated ? 'is-on' : ''}
              onClick={e => { e.preventDefault(); go(LANG_PATH[l]); }}
            >
              {LANG_LABEL[l]}
            </a>
          ))}
          {GOOGLE_LANGS.map(g => (
            <a
              key={g.code}
              href={`${LANG_PATH.en}?tl=${g.code}`}
              hrefLang={g.code}
              lang={g.code}
              className="is-auto"
              title={c.langBar.auto}
            >
              {g.label}
            </a>
          ))}
        </nav>
        <span className="se-langbar__auto">* {c.langBar.auto}</span>
      </div>
      {suggest && !translated && (
        <div className="se-langbar__suggest" lang={suggest}>
          <span>{EBOOK_COPY[suggest].langBar.suggest}</span>
          <button type="button" onClick={() => go(LANG_PATH[suggest])}>{EBOOK_COPY[suggest].langBar.suggestGo} {LANG_LABEL[suggest]} →</button>
          <button type="button" className="se-langbar__x" onClick={dismiss} aria-label="Close">×</button>
        </div>
      )}
    </div>
  );
}

/** The plain statement that the book is in English. Shown on translated pages, always in the reader's language. */
export function EnglishNotice({ lang, compact = false }: { lang: EbookLang; compact?: boolean }) {
  const c = EBOOK_COPY[lang].english;
  return (
    <div className={`se-english${compact ? ' se-english--compact' : ''}`} role="note">
      <span className="se-english__flag" aria-hidden>📖</span>
      <div>
        <b>{c.title}</b>
        {!compact && <p>{c.text}</p>}
      </div>
    </div>
  );
}
