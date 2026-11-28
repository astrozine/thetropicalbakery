/**
 * The site shell (header menu, bottom bar, footer, events strip) in the languages we wrote pages in by hand.
 *
 * The site is Portuguese and other languages normally go through Google Translate. A few pages are written by hand in
 * English, Spanish, Dutch or German (Sweet Escape, free recipes, coaching, /en/...), and on those the translator is
 * switched off (components/HandWrittenLang.tsx), so the shell around them has to speak the page's language itself.
 * Dolly found English pages with a Portuguese menu and footer (2026-11-16).
 *
 * Keys are the Portuguese text as it appears in the shell; `shellText(pt, lang)` returns the hand-written version, or
 * the Portuguese when a line has none yet.
 */
import { noEmoji } from '@/lib/noEmoji';
import { LANG_PATH } from '@/lib/ebookCopy';
import { FUNNEL } from '@/lib/funnel';
import { COACHING_PATH } from '@/lib/coachingCopy';

export type ShellLang = 'pt' | 'en' | 'es' | 'nl' | 'de';

type Row = { en: string; es: string; nl: string; de: string };

const T: Record<string, Row> = {
  // Bottom bar
  'Início': { en: 'Home', es: 'Inicio', nl: 'Home', de: 'Start' },
  'Cardápio': { en: 'Menu', es: 'Menú', nl: 'Menu', de: 'Menü' },
  'Cursos': { en: 'Classes', es: 'Cursos', nl: 'Cursussen', de: 'Kurse' },
  'Retiros': { en: 'Retreats', es: 'Retiros', nl: 'Retreats', de: 'Retreats' },
  'Clube': { en: 'Club', es: 'Club', nl: 'Club', de: 'Club' },
  'Conta': { en: 'Account', es: 'Cuenta', nl: 'Account', de: 'Konto' },

  // Menu groups and links
  'Entrar': { en: 'Log in', es: 'Entrar', nl: 'Inloggen', de: 'Anmelden' },
  'Entrar ou criar conta': { en: 'Log in or sign up', es: 'Entrar o crear cuenta', nl: 'Inloggen of account maken', de: 'Anmelden oder registrieren' },
  'Receitas': { en: 'Recipes', es: 'Recetas', nl: 'Recepten', de: 'Rezepte' },
  'Retiro': { en: 'Retreat', es: 'Retiro', nl: 'Retreat', de: 'Retreat' },
  'Coaching': { en: 'Coaching', es: 'Coaching', nl: 'Coaching', de: 'Coaching' },
  '🎁 Receitas grátis': { en: '🎁 Free recipes', es: '🎁 Recetas gratis', nl: '🎁 Gratis recepten', de: '🎁 Gratis Rezepte' },
  'Cursos e Retiro': { en: 'Classes & Retreat', es: 'Cursos y Retiro', nl: 'Cursussen & Retreat', de: 'Kurse & Retreat' },
  'Eventos e Catering': { en: 'Events & Catering', es: 'Eventos y Catering', nl: 'Events & Catering', de: 'Events & Catering' },
  'O Retiro': { en: 'The Retreat', es: 'El Retiro', nl: 'De Retreat', de: 'Das Retreat' },
  'fique com a nossa família em Itamambuca': { en: 'stay with our family in Itamambuca', es: 'quédate con nuestra familia en Itamambuca', nl: 'logeer bij ons gezin in Itamambuca', de: 'wohne bei unserer Familie in Itamambuca' },
  'Sessão avulsa': { en: 'Single session', es: 'Sesión suelta', nl: 'Losse sessie', de: 'Einzelsitzung' },
  'peça um orçamento': { en: 'get a quote', es: 'pide un presupuesto', nl: 'vraag een offerte', de: 'Angebot anfragen' },
  'E-book Sweet Escape': { en: 'Sweet Escape e-book', es: 'E-book Sweet Escape', nl: 'E-book Sweet Escape', de: 'E-Book Sweet Escape' },
  'hotéis, pousadas, restaurantes': { en: 'hotels, guesthouses, restaurants', es: 'hoteles, posadas, restaurantes', nl: 'hotels, pensions, restaurants', de: 'Hotels, Pensionen, Restaurants' },
  'Caixa de Degustação': { en: 'Tasting Box', es: 'Caja de Degustación', nl: 'Proefbox', de: 'Probierbox' },
  'Caixa da Semana': { en: 'This Week’s Box', es: 'Caja de la Semana', nl: 'Box van de Week', de: 'Box der Woche' },
  'Assinatura de Caixa': { en: 'Box Subscription', es: 'Suscripción de Caja', nl: 'Box-abonnement', de: 'Box-Abo' },
  'caixa toda semana': { en: 'a box every week', es: 'una caja cada semana', nl: 'elke week een box', de: 'jede Woche eine Box' },
  'Eventos': { en: 'Events', es: 'Eventos', nl: 'Evenementen', de: 'Events' },
  'Brunch Social': { en: 'Social Brunch', es: 'Brunch Social', nl: 'Sociale Brunch', de: 'Brunch' },
  'Menu de Eventos': { en: 'Events Menu', es: 'Menú de Eventos', nl: 'Evenementenmenu', de: 'Event-Menü' },
  'Cursos e Retiros': { en: 'Classes and Retreats', es: 'Cursos y Retiros', nl: 'Cursussen en Retreats', de: 'Kurse und Retreats' },
  'Planejar meu Retiro': { en: 'Plan my Retreat', es: 'Planear mi Retiro', nl: 'Mijn retreat plannen', de: 'Mein Retreat planen' },
  'hospedagem + cursos, num só pacote': { en: 'stay + classes, in one package', es: 'estadía + cursos, en un solo paquete', nl: 'verblijf + cursussen in één pakket', de: 'Unterkunft + Kurse in einem Paket' },
  'Todos os Cursos': { en: 'All Classes', es: 'Todos los Cursos', nl: 'Alle Cursussen', de: 'Alle Kurse' },
  'Turismo Gastronômico': { en: 'Food Tourism', es: 'Turismo Gastronómico', nl: 'Culinair Toerisme', de: 'Kulinarischer Tourismus' },
  'Capacitação Profissional': { en: 'Professional Training', es: 'Capacitación Profesional', nl: 'Vakopleiding', de: 'Berufliche Weiterbildung' },
  'Saúde e Bem-Estar': { en: 'Health and Wellbeing', es: 'Salud y Bienestar', nl: 'Gezondheid en Welzijn', de: 'Gesundheit und Wohlbefinden' },
  'sua alimentação inteira, com a Dolly': { en: 'your whole way of eating, with Dolly', es: 'toda tu alimentación, con Dolly', nl: 'je hele eetpatroon, met Dolly', de: 'deine ganze Ernährung, mit Dolly' },
  'Reset do Paladar · 14 dias': { en: 'Taste Reset · 14 days', es: 'Reset del Paladar · 14 días', nl: 'Smaakreset · 14 dagen', de: 'Geschmacks-Reset · 14 Tage' },
  'sem sal e sem óleo': { en: 'no salt, no oil', es: 'sin sal y sin aceite', nl: 'zonder zout en olie', de: 'ohne Salz und Öl' },
  'Conversa grátis de 30 min': { en: 'Free 30-min call', es: 'Charla gratis de 30 min', nl: 'Gratis gesprek van 30 min', de: 'Kostenloses 30-Min-Gespräch' },
  'Diário de Receitas': { en: 'Recipe Journal', es: 'Diario de Recetas', nl: 'Receptendagboek', de: 'Rezept-Tagebuch' },
  'receitas grátis e premium': { en: 'free and premium recipes', es: 'recetas gratis y premium', nl: 'gratis en premium recepten', de: 'gratis und Premium-Rezepte' },
  '2 Receitas Grátis': { en: '2 Free Recipes', es: '2 Recetas Gratis', nl: '2 Gratis Recepten', de: '2 Gratis-Rezepte' },
  'Livro Completo': { en: 'The Full Book', es: 'El Libro Completo', nl: 'Het Volledige Boek', de: 'Das ganze Buch' },
  '7 dias, 7 doces': { en: '7 days, 7 treats', es: '7 días, 7 dulces', nl: '7 dagen, 7 lekkernijen', de: '7 Tage, 7 Leckereien' },
  'Conheça a Dolly': { en: 'Meet Dolly', es: 'Conoce a Dolly', nl: 'Maak kennis met Dolly', de: 'Lerne Dolly kennen' },
  'Instagram da Dolly': { en: 'Dolly’s Instagram', es: 'Instagram de Dolly', nl: 'Instagram van Dolly', de: 'Dollys Instagram' },
  'PARCERIAS': { en: 'PARTNERS', es: 'ALIANZAS', nl: 'PARTNERS', de: 'PARTNER' },
  'Todas as Parcerias': { en: 'All Partnerships', es: 'Todas las Alianzas', nl: 'Alle Samenwerkingen', de: 'Alle Partnerschaften' },
  'Afiliados': { en: 'Affiliates', es: 'Afiliados', nl: 'Affiliates', de: 'Affiliates' },
  'Parcerias': { en: 'Partners', es: 'Alianzas', nl: 'Partners', de: 'Partner' },
  '🌴 Entregamos em Itamambuca, Ubatuba e região. Paraty: pedidos a partir de R$ 600.': {
    en: '🌴 We deliver in Itamambuca, Ubatuba and nearby. Paraty: orders from R$ 600.',
    es: '🌴 Entregamos en Itamambuca, Ubatuba y alrededores. Paraty: pedidos desde R$ 600.',
    nl: '🌴 We bezorgen in Itamambuca, Ubatuba en omgeving. Paraty: bestellingen vanaf R$ 600.',
    de: '🌴 Wir liefern in Itamambuca, Ubatuba und Umgebung. Paraty: Bestellungen ab R$ 600.',
  },
  '🌴 Entregas exclusivas: Itamambuca, Ubatuba e Região. Paraty: pedidos a partir de R$ 600! 🌴': {
    en: '🌴 We deliver in Itamambuca, Ubatuba and nearby. Paraty: orders from R$ 600! 🌴',
    es: '🌴 Entregamos en Itamambuca, Ubatuba y alrededores. Paraty: pedidos desde R$ 600! 🌴',
    nl: '🌴 We bezorgen in Itamambuca, Ubatuba en omgeving. Paraty: bestellingen vanaf R$ 600! 🌴',
    de: '🌴 Wir liefern in Itamambuca, Ubatuba und Umgebung. Paraty: Bestellungen ab R$ 600! 🌴',
  },

  // Footer
  'Confeitaria saudável de luxo em Ubatuba, pelas mãos da chef belga Elisabeth “Dolly” Van Dam.': {
    en: 'A healthy luxury bakery in Ubatuba, Brazil, run by Belgian chef Elisabeth “Dolly” Van Dam.',
    es: 'Pastelería saludable de lujo en Ubatuba, Brasil, en manos de la chef belga Elisabeth “Dolly” Van Dam.',
    nl: 'Een gezonde luxebakkerij in Ubatuba, Brazilië, van de Belgische chef Elisabeth “Dolly” Van Dam.',
    de: 'Eine gesunde Luxus-Konditorei in Ubatuba, Brasilien, von der belgischen Köchin Elisabeth „Dolly“ Van Dam.',
  },
  'Menu': { en: 'Menu', es: 'Menú', nl: 'Menu', de: 'Menü' },
  'Assinatura Semanal': { en: 'Weekly Subscription', es: 'Suscripción Semanal', nl: 'Wekelijks Abonnement', de: 'Wöchentliches Abo' },
  'Fazer Pedido': { en: 'Order', es: 'Hacer un Pedido', nl: 'Bestellen', de: 'Bestellen' },
  'Doces para Eventos': { en: 'Treats for Events', es: 'Dulces para Eventos', nl: 'Lekkers voor Evenementen', de: 'Leckereien für Events' },
  'Cursos com Dolly': { en: 'Classes with Dolly', es: 'Cursos con Dolly', nl: 'Cursussen met Dolly', de: 'Kurse mit Dolly' },
  'Sobre a Dolly': { en: 'About Dolly', es: 'Sobre Dolly', nl: 'Over Dolly', de: 'Über Dolly' },
  'Trabalhe Conosco': { en: 'Work with Us', es: 'Trabaja con Nosotros', nl: 'Werken bij ons', de: 'Arbeite mit uns' },
  'Hotéis': { en: 'Hotels', es: 'Hoteles', nl: 'Hotels', de: 'Hotels' },
  'Pousadas': { en: 'Guesthouses', es: 'Posadas', nl: 'Pensions', de: 'Pensionen' },
  'Restaurantes': { en: 'Restaurants', es: 'Restaurantes', nl: 'Restaurants', de: 'Restaurants' },
  'Padarias': { en: 'Bakeries', es: 'Panaderías', nl: 'Bakkerijen', de: 'Bäckereien' },
  'Barcos e Marinas': { en: 'Boats and Marinas', es: 'Barcos y Marinas', nl: 'Boten en Jachthavens', de: 'Boote und Marinas' },
  'Yoga, Academias e Spas': { en: 'Yoga, Gyms and Spas', es: 'Yoga, Gimnasios y Spas', nl: 'Yoga, Sportscholen en Spa’s', de: 'Yoga, Fitnessstudios und Spas' },
  'Contato': { en: 'Contact', es: 'Contacto', nl: 'Contact', de: 'Kontakt' },
  'Minha conta e retiradas': { en: 'My account and pickups', es: 'Mi cuenta y retiros', nl: 'Mijn account en ophalen', de: 'Mein Konto und Abholungen' },
  'Sunbaked Letters, a newsletter ↗': { en: 'Sunbaked Letters, the newsletter ↗', es: 'Sunbaked Letters, el boletín ↗', nl: 'Sunbaked Letters, de nieuwsbrief ↗', de: 'Sunbaked Letters, der Newsletter ↗' },
  'Política de Privacidade': { en: 'Privacy Policy', es: 'Política de Privacidad', nl: 'Privacybeleid', de: 'Datenschutz' },
  'Cuidados com os doces': { en: 'Caring for your treats', es: 'Cuidado de los dulces', nl: 'Bewaartips', de: 'Aufbewahrung' },
  'Preferências de e-mail': { en: 'E-mail preferences', es: 'Preferencias de e-mail', nl: 'E-mailvoorkeuren', de: 'E-Mail-Einstellungen' },
  'Todos os direitos reservados.': { en: 'All rights reserved.', es: 'Todos los derechos reservados.', nl: 'Alle rechten voorbehouden.', de: 'Alle Rechte vorbehalten.' },

  // Events strip
  'Descubra Nossas Criações': { en: 'Discover Our Creations', es: 'Descubre Nuestras Creaciones', nl: 'Ontdek onze creaties', de: 'Entdecke unsere Kreationen' },
  'Para Eventos e Momentos Especiais': { en: 'For Events and Special Moments', es: 'Para Eventos y Momentos Especiales', nl: 'Voor evenementen en speciale momenten', de: 'Für Events und besondere Momente' },
  'Veja o que já servimos em nossas Caixas Surpresa e planeje seu próximo evento.': {
    en: 'See what we have served in our tasting boxes and plan your next event.',
    es: 'Mira lo que ya hemos servido en nuestras Cajas Sorpresa y planea tu próximo evento.',
    nl: 'Bekijk wat we al serveerden in onze proefboxen en plan je volgende evenement.',
    de: 'Sieh dir an, was wir schon in unseren Probierboxen serviert haben, und plane dein nächstes Event.',
  },
  'Ver Menu Completo': { en: 'See the Full Menu', es: 'Ver Menú Completo', nl: 'Bekijk het hele menu', de: 'Ganzes Menü ansehen' },
};

export function shellText(pt: string, lang: ShellLang): string {
  return noEmoji(lang === 'pt' ? pt : (T[pt]?.[lang] ?? pt));
}

const SE_PATHS = Object.entries(LANG_PATH) as [ShellLang, string][];
const FR_PATHS = Object.entries(FUNNEL.pagePath) as [ShellLang, string][];
const CO_PATHS = Object.entries(COACHING_PATH) as [ShellLang, string][];

/**
 * The language a page is written in, from its address. Only the hand-written pages are not Portuguese; the free-recipes
 * thank-you and offer pages carry theirs in `?lang=` (pass the query string to read it).
 */
export function pageLang(pathname: string, search = ''): ShellLang {
  const p = pathname.replace(/\/$/, '') || '/';
  for (const list of [SE_PATHS, FR_PATHS, CO_PATHS]) {
    const hit = list.find(([, path]) => path === p);
    if (hit) return hit[0];
  }
  if (p === '/free-recipes/obrigado' || p === '/free-recipes/oferta' || p === '/sweet-escape/thank-you') {
    const l = new URLSearchParams(search).get('lang');
    return (['pt', 'en', 'es', 'nl', 'de'] as string[]).includes(l || '') ? (l as ShellLang) : 'en';
  }
  if (p === '/en' || p.startsWith('/en/')) return 'en';
  if (p === '/es' || p.startsWith('/es/')) return 'es';
  return 'pt';
}

/** Where the shell's links should go on a page in this language, when we have that page written by hand. */
export function shellHref(ptPath: string, lang: ShellLang): string {
  if (lang === 'pt') return ptPath;
  if (ptPath === '/sweet-escape/pt') return LANG_PATH[lang];
  if (ptPath === '/receitas') return FUNNEL.pagePath[lang];
  if (ptPath === '/diario' || ptPath.startsWith('/diario/')) return lang === 'en' ? '/en/journal' + ptPath.slice('/diario'.length).replace('/minhas-receitas', '/my-recipes') : ptPath;
  if (ptPath.startsWith('/coaching')) {
    const base = (COACHING_PATH as Record<string, string>)[lang] ?? COACHING_PATH.en;
    return base + ptPath.slice('/coaching'.length);
  }
  if (lang === 'en') {
    if (ptPath === '/retreats' || ptPath.startsWith('/retreats#')) return '/en' + ptPath;
    if (ptPath === '/b2b/barcos') return '/en/b2b/boats';
    if (ptPath === '/cuidados') return '/en/care';
  }
  if (lang === 'es' && (ptPath === '/retreats' || ptPath.startsWith('/retreats#'))) return '/es/retiros' + ptPath.slice('/retreats'.length);
  return ptPath;
}
