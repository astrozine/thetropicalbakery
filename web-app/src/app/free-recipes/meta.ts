import type { Metadata } from 'next';
import type { EbookLang } from '@/lib/ebookCopy';
import { FUNNEL, FUNNEL_COPY, freeCover } from '@/lib/funnel';

/** Title, share card and hreflang links for one language of the free-recipes page (where the ads land). */
export function funnelMetadata(lang: EbookLang): Metadata {
  const c = FUNNEL_COPY[lang].meta;
  const p = FUNNEL.pagePath;
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: p[lang], languages: { en: p.en, pt: p.pt, es: p.es, nl: p.nl, 'x-default': p.en } },
    openGraph: {
      title: c.title,
      description: c.description,
      url: p[lang],
      type: 'website',
      locale: c.ogLocale,
      images: [{ url: freeCover(lang), width: 640, height: 1021, alt: c.title }],
    },
  };
}
