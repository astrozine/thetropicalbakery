import type { Metadata } from 'next';
import { Suspense } from 'react';
import FreeRecipesThanks from '@/components/funnel/FreeRecipesThanks';

export const metadata: Metadata = {
  title: 'Your free recipes | The Tropical Bakery',
  robots: { index: false, follow: false },
};

export default function FreeRecipesThanksPage() {
  return (
    <Suspense fallback={null}>
      <FreeRecipesThanks />
    </Suspense>
  );
}
