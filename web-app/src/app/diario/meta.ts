import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/email/layout';
import { JOURNAL_COPY, JOURNAL_PATH, type JournalLang } from '@/lib/journal/journal';

export function journalMetadata(lang: JournalLang): Metadata {
  const c = JOURNAL_COPY[lang];
  return {
    title: `${c.name} | The Tropical Bakery`,
    description: c.metaDescription,
    alternates: { canonical: SITE_URL + JOURNAL_PATH[lang], languages: { 'pt-BR': SITE_URL + JOURNAL_PATH.pt, en: SITE_URL + JOURNAL_PATH.en } },
    openGraph: { title: `${c.name} · The Tropical Bakery`, description: c.metaDescription, images: [{ url: `${SITE_URL}/ebook/sweet-escape/red.webp` }], locale: lang === 'en' ? 'en_US' : 'pt_BR' },
  };
}
