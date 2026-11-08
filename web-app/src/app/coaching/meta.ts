import type { Metadata } from 'next';
import { COACHING_COPY, COACHING_LANGS, COACHING_PATH, type CoachingLang } from '@/lib/coachingCopy';

const OG_LOCALE: Record<CoachingLang, string> = { pt: 'pt_BR', en: 'en_US', es: 'es_ES', nl: 'nl_NL' };

/** Each language of /coaching points search engines at the other three. */
export function coachingMetadata(lang: CoachingLang): Metadata {
  const t = COACHING_COPY[lang].meta;
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: COACHING_PATH[lang],
      languages: Object.fromEntries(COACHING_LANGS.map(l => [l, COACHING_PATH[l]])),
    },
    openGraph: {
      title: 'The Daily Tropical Reset · Food Coach Dolly',
      description: t.ogDescription,
      url: COACHING_PATH[lang],
      locale: OG_LOCALE[lang],
      images: [{ url: '/coaching/dolly-hero.webp', width: 1000, height: 1333, alt: t.ogAlt }],
    },
  };
}
