import type { Metadata, Viewport } from 'next';
import VontadeApp from '@/components/vontade/VontadeApp';

const TITLE = 'Bateu Vontade? · The Tropical Bakery';
const DESCRIPTION = 'Bateu vontade de doce? Em 3 toques, um docinho de verdade em 2 a 5 minutos, com o que você tem em casa. Vegano, sem glúten, sem açúcar refinado. Grátis.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  manifest: '/vontade/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Bateu Vontade?', statusBarStyle: 'default' },
  icons: { apple: '/vontade/icon-192.png' },
  openGraph: {
    title: 'Bateu Vontade? O app anti-vontade de doce',
    description: DESCRIPTION,
    url: '/vontade',
    images: [{ url: '/vontade/og.png', width: 1200, height: 630, alt: 'Bateu Vontade? by The Tropical Bakery' }],
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#fdfaf3', viewportFit: 'cover' };

/** The craving-rescue app (lib/vontade.ts). Its own manifest, so it can live on the phone's home screen. */
export default function VontadePage() {
  return <VontadeApp />;
}
