import type { Metadata } from 'next';
import LinksPage from './LinksPage';

export const metadata: Metadata = {
  title: 'Dolly · The Tropical Bakery',
  description: 'Receitas grátis, aula de doces, coaching de alimentação, o livro Sweet Escape e o retiro com a Chef Dolly em Itamambuca.',
  alternates: { canonical: '/links' },
  openGraph: {
    title: 'Dolly · The Tropical Bakery',
    description: 'Comece pelas 2 receitas grátis do Sweet Escape.',
    url: '/links',
    images: [{ url: '/dolly/dolly-portrait.jpg', alt: 'Dolly' }],
  },
};

export default function Page() {
  return <LinksPage />;
}
