import type { Metadata } from 'next';
import { EBOOK_COPY, LANG_PATH, type EbookLang } from '@/lib/ebookCopy';

/** Title, share card and hreflang links for one language of the Sweet Escape page. */
export function ebookMetadata(lang: EbookLang): Metadata {
  const c = EBOOK_COPY[lang].meta;
  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: LANG_PATH[lang],
      languages: { en: LANG_PATH.en, pt: LANG_PATH.pt, es: LANG_PATH.es, nl: LANG_PATH.nl, 'x-default': LANG_PATH.en },
    },
    openGraph: {
      title: c.ogTitle,
      description: c.description,
      url: LANG_PATH[lang],
      type: 'website',
      locale: c.ogLocale,
      images: [{ url: `/ebook/sweet-escape/${lang}/cover.webp`, width: 1000, height: 1595, alt: 'Sweet Escape' }],
    },
  };
}
