import type { Metadata } from 'next';
import WelcomeOffer from '@/components/funnel/WelcomeOffer';
import { offerExpiry } from '@/lib/payments/ebook';
import { isEbookLang } from '@/lib/ebookCopy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sweet Escape · welcome price | The Tropical Bakery',
  robots: { index: false, follow: false },
};

/** /free-recipes/oferta?t=…&lang=…: the welcome price from the e-mails, shown only while its signed link is valid. */
export default async function WelcomeOfferPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.t === 'string' ? sp.t : '';
  const lang = isEbookLang(sp.lang) ? sp.lang : 'en';
  let expiresAt: string | null = null;
  try { expiresAt = offerExpiry(token)?.toISOString() ?? null; } catch { expiresAt = null; }
  return <WelcomeOffer lang={lang} token={expiresAt ? token : ''} expiresAt={expiresAt} />;
}
