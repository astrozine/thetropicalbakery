import type { Metadata } from 'next';
import OpenClassPage from '@/components/courses/OpenClassPage';
import { OPEN_CLASS, WORKSHOP_START } from '@/lib/workshopDates';

export const metadata: Metadata = {
  title: `Aula de doces com a Chef Dolly · ${OPEN_CLASS.short}, ${WORKSHOP_START} · The Tropical Bakery`,
  description: `${OPEN_CLASS.long}, às ${WORKSHOP_START}, em Itamambuca: uma tarde fazendo doces veganos e sem trigo com a Chef Dolly. Restam ${OPEN_CLASS.spotsLeft} vagas.`,
  alternates: { canonical: '/aula' },
  openGraph: {
    title: `Aula de doces com a Chef Dolly · ${OPEN_CLASS.short}`,
    description: `Uma tarde na cozinha da Dolly em Itamambuca. ${OPEN_CLASS.long}, às ${WORKSHOP_START}.`,
    url: '/aula',
    locale: 'pt_BR',
    images: [{ url: '/assets/surfers_retreat_treats_1789884582282.jpg', alt: 'Doces da Chef Dolly na mesa' }],
  },
};

export default function Page() {
  return <OpenClassPage />;
}
