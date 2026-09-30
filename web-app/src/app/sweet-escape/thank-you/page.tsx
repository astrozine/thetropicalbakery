import type { Metadata } from 'next';
import { Suspense } from 'react';
import EbookThanks from '@/components/ebook/EbookThanks';

export const metadata: Metadata = {
  title: 'Your Sweet Escape download | The Tropical Bakery',
  robots: { index: false, follow: false },
};

export default function SweetEscapeThanksPage() {
  return (
    <Suspense fallback={null}>
      <EbookThanks />
    </Suspense>
  );
}
