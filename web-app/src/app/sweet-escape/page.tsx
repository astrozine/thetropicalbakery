import type { Metadata } from 'next';
import SweetEscapeLanding from '@/components/ebook/SweetEscapeLanding';

const title = 'Sweet Escape · 7 plant-based treats your family will love | The Tropical Bakery';
const description = 'Dolly’s e-book: 7 colors, 7 plant-based desserts made from fruit, nuts and whole plants. Silky creams, caramel, chocolate mousse, cheesecake. Instant PDF.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/sweet-escape' },
  openGraph: {
    title: 'Sweet Escape · the plant-based treat book from Dolly’s jungle kitchen',
    description,
    url: '/sweet-escape',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/ebook/sweet-escape/cover.webp', width: 1000, height: 1595, alt: 'Sweet Escape e-book cover' }],
  },
};

export default function SweetEscapePage() {
  return <SweetEscapeLanding />;
}
