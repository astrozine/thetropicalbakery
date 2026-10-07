import type { Metadata } from 'next';
import BrunchRoom from '@/components/brunch/BrunchRoom';

/** Private: never in search results. */
export const metadata: Metadata = {
  title: 'Sala do brunch | The Tropical Bakery',
  robots: { index: false, follow: false },
};

export default async function BrunchRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BrunchRoom slug={slug} />;
}
