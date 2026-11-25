import type { Metadata } from 'next';
import { verifyLetterToken } from '@/lib/letterServer';
import LetterForm from './LetterForm';

export const metadata: Metadata = {
  title: 'Your Sunday letter · The Tropical Bakery',
  robots: { index: false, follow: false },
};

/** Dolly's weekly letter page (lib/letter.ts). The link in her Thursday e-mail carries ?t=; a signed-in admin can use it without. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.t === 'string' ? sp.t : '';
  const sunday = verifyLetterToken(token);
  return <LetterForm token={sunday ? token : ''} sunday={sunday} />;
}
