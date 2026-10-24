import type { Metadata, Viewport } from 'next';
import { Bungee, Nunito } from 'next/font/google';
import VontadeApp from '@/components/vontade/VontadeApp';

const TITLE = 'Bateu Vontade? · The Tropical Bakery';
const DESCRIPTION = 'Bateu vontade de doce, de sal, de fritura, de queijo ou de refri? Em 3 toques, a mesma sensação feita só de planta inteira, pronta em minutos. Sem sal, sem óleo, sem açúcar. Grátis.';

/** The app's own rounded, heavy type (the game-like habit-app feel); the rest of the site keeps its fonts. */
const rounded = Nunito({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--va-rounded', display: 'swap' });
/** Arcade lettering for the desktop fight screen (title, HUD, game menu). */
const arcade = Bungee({ subsets: ['latin'], weight: '400', variable: '--va-arcade', display: 'swap' });

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  manifest: '/vontade/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Bateu Vontade?', statusBarStyle: 'default' },
  icons: { apple: '/vontade/icon-192.png' },
  openGraph: {
    title: 'Bateu Vontade? O app que troca toda vontade por comida de verdade',
    description: DESCRIPTION,
    url: '/vontade',
    images: [{ url: '/vontade/og.png', width: 1200, height: 630, alt: 'Bateu Vontade? by The Tropical Bakery' }],
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffaf0' },
    { media: '(prefers-color-scheme: dark)', color: '#17120f' },
  ],
  viewportFit: 'cover',
};

/** The craving app (lib/vontade.ts). Its own manifest, so it can live on the phone's home screen. */
export default function VontadePage() {
  return <div className={`${rounded.variable} ${arcade.variable}`}><VontadeApp /></div>;
}
