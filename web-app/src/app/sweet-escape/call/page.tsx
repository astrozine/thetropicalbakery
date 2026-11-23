import type { Metadata } from 'next';
import { Suspense } from 'react';
import BonusCallClaim from '@/components/ebook/BonusCallClaim';

export const metadata: Metadata = {
  title: 'Your free call with Dolly | Sweet Escape',
  description: 'Bought Sweet Escape? Book the free 30-minute call with Dolly that comes with the book.',
  robots: { index: false, follow: false },
};

export default function BonusCallPage() {
  return (
    <Suspense fallback={null}>
      <BonusCallClaim />
    </Suspense>
  );
}
