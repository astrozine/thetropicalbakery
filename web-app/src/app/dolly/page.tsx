import type { Metadata } from 'next';
import ChefDolly from '@/components/ChefDolly';

export const metadata: Metadata = {
  title: 'Sobre a Dolly · The Tropical Bakery',
  description:
    'Elisabeth “Dolly” Van Dam — artista belga, bailarina, performer e escultora, hoje chef em Itamambuca. Uma vida moldada pela arte, pela natureza, pela perda — e pela busca por se sentir bem.',
  alternates: { canonical: '/dolly' },
  openGraph: {
    title: 'Sobre a Dolly · The Tropical Bakery',
    description:
      'Raízes belgas, natureza brasileira, pâtisserie francesa. A história da chef por trás da The Tropical Bakery.',
    url: '/dolly',
    type: 'profile',
    images: [{ url: '/dolly/dolly-spatula.jpg', width: 1200, height: 1600, alt: 'Dolly Van Dam' }],
  },
};

export default function DollyPage() {
  return <ChefDolly />;
}
