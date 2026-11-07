import type { Metadata } from 'next';
import CoachingLanding from '@/components/coaching/CoachingLanding';

export const metadata: Metadata = {
  title: 'The Daily Tropical Reset · Food Coach Dolly | The Tropical Bakery',
  description:
    'Um Marie Kondo dos seus hábitos alimentares e da sua despensa, com a Food Coach Dolly. Plant-based nutritariano sem sal, óleo e açúcar, plano semanal, meal-prep e a família junto. Conversa grátis de 30 minutos.',
  alternates: { canonical: '/coaching' },
  openGraph: {
    title: 'The Daily Tropical Reset · Food Coach Dolly',
    description: 'Comer bem começa pelo que entra em casa. Conversa grátis de 30 minutos e o e-book Sweet Escape de presente.',
    url: '/coaching',
    images: [{ url: '/coaching/treat-raspberry.webp', width: 900, height: 1200, alt: 'Bliss balls de frutas vermelhas da Dolly' }],
  },
};

/** /coaching: Dolly's food coaching (her "Food Healing Studio"), from her Paradise Pantry guide and the Sweet Escape e-book. */
export default function CoachingPage() {
  return <CoachingLanding />;
}
