import type { Metadata } from 'next';
import BrunchLanding from '@/components/brunch/BrunchLanding';

export const metadata: Metadata = {
  title: 'Brunch Tropical com a Dolly | The Tropical Bakery',
  description: 'Chá, doces saudáveis e conversa com mulheres que vivem de saúde e bem-estar, num lugar lindo de Ubatuba. Lugares limitados, por ordem de pagamento.',
  openGraph: {
    title: 'Brunch Tropical com a Dolly',
    description: 'Chá, doces saudáveis e as mulheres que fazem o bem-estar acontecer. Lugares limitados.',
    images: [{ url: '/brunch/brunch-jardim.webp', width: 1600, height: 1600, alt: 'Mulheres num brunch tropical com doces e chá' }],
  },
};

/** /brunch: Dolly's ticketed brunches and the Círculo Tropical (src/lib/brunch.ts, migration_41_brunch.sql). */
export default function BrunchPage() {
  return <BrunchLanding />;
}
