'use client';

import React, { useState, useEffect } from 'react';
import { BOX_SALE_ON } from '@/lib/boxSale';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import AccountMenu from '@/components/AccountMenu';
import { INSTAGRAM_HANDLE, InstagramIcon } from '@/components/InstagramLink';
import { DOLLY_INSTAGRAM_HANDLE, DOLLY_INSTAGRAM_URL, FAMILY_INSTAGRAM_HANDLE, FAMILY_INSTAGRAM_URL, STORE_INSTAGRAM_URL } from '@/lib/siteContact';
import { SUB_STYLE, ClubeModal, PersonIcon } from '@/components/ClubeInvite';
import { useAuth } from '@/context/AuthContext';
import { courseIsShown, useShownCourses } from '@/lib/useShownCourses';
import { isEbookLang, LANG_PATH } from '@/lib/ebookCopy';
import { clearGoogleTranslate } from '@/lib/googleTranslate';
import { usePageLang } from '@/lib/usePageLang';
import { useTranslateLang } from '@/lib/useTranslateLang';
import { shellHref, shellText, type ShellLang } from '@/lib/shellCopy';
import { FUNNEL } from '@/lib/funnel';
import { COACHING_PATH, COACHING_PRICES, isCoachingLang } from '@/lib/coachingCopy';
import IconTile from '@/components/IconTile';

// Desktop menu (xl and up): one line at 1280px, roomier on bigger screens.
const GAP = 'clamp(0.7rem, 1.1vw, 1.5rem)';
const TOP_SIZE = 'clamp(0.74rem, 0.78vw, 0.9rem)';

/** Portuguese page -> its hand-written English version (the language menu sends people between them). */
const HAND_TRANSLATED_EN: Record<string, string> = {
  '/b2b/barcos': '/en/b2b/boats',
};

type NavLink = {
  name: string; path: string; icon?: string; highlight?: boolean; feature?: boolean; sub?: string; external?: boolean;
  /** Hand-written subtitle per language (pt, en, es, it, fr, de, nl), shown instead of Google's translation of `sub`. */
  subByLang?: Record<string, string>;
  /** A brand name (an app): never translated. */
  brand?: boolean;
};

/**
 * The Apps menu says what the apps are for in each of the site's languages, written by hand: Google Translate turns a
 * tagline like this into something stiff. The idea in every language: fun, helpful tools that get you into the rhythm
 * of healthy, real-food eating, and keep you there. The apps themselves are in Portuguese for now.
 */
const APPS_COPY = {
  intro: {
    pt: 'Ferramentas divertidas para você engrenar na comida de verdade e não largar mais.',
    en: 'Fun little tools that get you into healthy eating, and keep you there.',
    es: 'Herramientas divertidas para engancharte a comer sano, y no soltarlo.',
    it: 'Strumenti divertenti per prendere il ritmo del mangiare sano, e non perderlo.',
    fr: 'Des outils ludiques pour prendre le pli du manger sain, et le garder.',
    de: 'Spielerische Helfer, mit denen gesundes Essen zur Gewohnheit wird.',
    nl: 'Speelse hulpjes om gezond eten vol te houden, en er plezier in te hebben.',
  } as Record<string, string>,
  vontade: {
    pt: 'toda vontade tem uma troca · grátis',
    en: 'a healthy swap for every craving · free',
    es: 'un cambio sano para cada antojo · gratis',
    it: 'uno scambio sano per ogni voglia · gratis',
    fr: 'une parade saine à chaque envie · gratuit',
    de: 'ein gesunder Tausch für jeden Heißhunger · gratis',
    nl: 'een gezonde ruil voor elke trek · gratis',
  } as Record<string, string>,
};
/** "4 weeks · R$ 497" in each menu language (numbers from COACHING_PRICES). */
const RESET_SUB: Record<string, string> = Object.fromEntries(Object.entries({
  pt: 'semanas', en: 'weeks', es: 'semanas', it: 'settimane', fr: 'semaines', de: 'Wochen', nl: 'weken',
}).map(([l, w]) => [l, `${COACHING_PRICES.resetWeeks} ${w} · R$ ${COACHING_PRICES.reset}`]));
const MENU_LANGS = ['pt', 'en', 'es', 'it', 'fr', 'de', 'nl'];

// The "plan your trip" button: forest green with a gold edge, so it reads as the way in for travellers
// without competing with the gold "highlight" link beside it.
const FEATURE_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1e5d54 0%, #3d5a40 100%)', color: '#faf5ec', border: '1px solid #c9a257',
  boxShadow: '0 6px 16px rgba(46,68,50,0.25)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', lineHeight: 1.2,
};

// The one call-to-action in the bar: a dark pill with gold letters (the account button beside it is the gold one).
const CTA_STYLE: React.CSSProperties = {
  background: '#2a1a12', color: '#f3d77a', border: '1px solid #c9a257', borderRadius: '999px', fontWeight: 'bold', textDecoration: 'none',
  textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(42,26,18,0.25)',
};

/** Line icons in place of the old emoji (2026-11-28 redesign). */
// The number of items in the shopping bag: a small gold dot that sits on the bag's corner without covering it (2026-11-28;
// was a red bubble that hid the icon).
const BAG_BADGE: React.CSSProperties = {
  position: 'absolute', top: '2px', right: '-6px', minWidth: '17px', height: '17px', padding: '0 4px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
  background: '#c9a257', color: '#2a1a12', border: '1.5px solid #faf5ec', borderRadius: '999px',
  fontSize: '0.62rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', pointerEvents: 'none',
};

function BagIcon({ size = 22 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>);
}
function GlobeIcon({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>);
}

/** A menu entry: a page on the site, or (external) somewhere else, opened in a new tab so the shop stays open. */
function NavItem({ link, style, onClick, tile = 30, children }: { link: NavLink; style: React.CSSProperties; onClick?: () => void; tile?: number; children: React.ReactNode }) {
  const row = (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* No emoji tiles since the 2026-11-28 redesign: only Instagram keeps its (drawn) icon. */}
      {link.external && <IconTile size={tile}><InstagramIcon size={tile * 0.55} /></IconTile>}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>{children}</span>
    </span>
  );
  if (!link.external) return <Link href={link.path} onClick={onClick} style={style}>{row}</Link>;
  return <a href={link.path} target="_blank" rel="noopener noreferrer" onClick={onClick} className="notranslate" translate="no" style={style}>{row}</a>;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // Pages written by hand in another language get the menu in that language too (lib/shellCopy.ts).
  const pageL = usePageLang();
  const tl = (pt: string) => shellText(pt, pageL);
  // Labels Google Translate gets wrong ("Entrar" became "To enter"): when it is translating into a language we wrote the
  // shell in, show our own words and keep Google off them (Andrew, 2026-11-28).
  const trL = useTranslateLang();
  const ownL: ShellLang = pageL !== 'pt' ? pageL : ((['en', 'es', 'nl', 'de'] as string[]).includes(trL) ? trL as ShellLang : 'pt');
  const ownProps = ownL !== 'pt' || trL === 'pt' ? { className: 'notranslate', translate: 'no' as const } : {};
  const [phoneLangOpen, setPhoneLangOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const closeLogin = React.useCallback(() => setLoginOpen(false), []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const closeMenu = () => setIsOpen(false);

  const changeLanguage = (langCode: string) => {
    // The e-book page is written in English with hand-made Portuguese and Spanish versions; Google Translate
    // can't produce Portuguese from it (it thinks every page already is). Send people to the real version.
    if (pathname?.startsWith('/sweet-escape') && !pathname.includes('/thank-you')) {
      clearGoogleTranslate();
      window.location.href = isEbookLang(langCode) ? LANG_PATH[langCode] : `${LANG_PATH.en}?tl=${langCode}`;
      return;
    }
    // The free-recipes pages too: each language is its own hand-written page (and its own price, see BookPay). Other
    // languages translate the English page, starting from Google's cookie so it opens already translated.
    const funnelPages = Object.values(FUNNEL.pagePath);
    if (pathname && funnelPages.includes(pathname)) {
      clearGoogleTranslate();
      if (!isEbookLang(langCode)) document.cookie = `googtrans=/en/${langCode}; path=/;`;
      const target = FUNNEL.pagePath[isEbookLang(langCode) ? langCode : 'en'];
      if (target === pathname && isEbookLang(langCode)) window.location.reload();
      else window.location.href = target;
      return;
    }
    // The coaching page is hand-written in Portuguese, English, Spanish and Dutch; other languages translate the
    // English one, starting from Google's cookie so it opens already translated.
    const coachingPages = Object.values(COACHING_PATH);
    if (pathname && coachingPages.includes(pathname)) {
      clearGoogleTranslate();
      if (!isCoachingLang(langCode)) document.cookie = `googtrans=/en/${langCode}; path=/;`;
      const target = COACHING_PATH[isCoachingLang(langCode) ? langCode : 'en'];
      if (target === pathname) window.location.reload();
      else window.location.href = target;
      return;
    }
    // Pages with a hand-written English twin: English goes to the twin, and from the twin every
    // other language goes back to the Portuguese page (where Google Translate can work from the original).
    const twinEn = HAND_TRANSLATED_EN[pathname ?? ''];
    const twinPt = Object.keys(HAND_TRANSLATED_EN).find(pt => HAND_TRANSLATED_EN[pt] === pathname);
    if ((twinEn && langCode === 'en') || (twinPt && langCode !== 'en')) {
      clearGoogleTranslate();
      if (langCode !== 'en' && langCode !== 'pt') document.cookie = `googtrans=/pt/${langCode}; path=/;`;
      window.location.href = twinEn && langCode === 'en' ? twinEn : (twinPt as string);
      return;
    }
    if (langCode === 'pt') {
      // The site's own language: asking Google Translate to translate
      // Portuguese into Portuguese doesn't no-op, it actually runs the
      // translation pass and mangles words. Clearing its cookie and
      // reloading restores the real, original text instead. (It must clear the
      // parent-domain copy too, or www.thetropicalbakery.com stays in English.)
      clearGoogleTranslate();
      window.location.reload();
      return;
    }
    const selectNode = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectNode) {
      selectNode.value = langCode;
      selectNode.dispatchEvent(new Event('change'));
    }
  };

  // A course Dolly has hidden in the admin ("em preparo") leaves this menu too.
  const shownCourses = useShownCourses();
  const cursosLinks = [
    { name: 'Todos os Cursos', path: '/cursos', icon: '🎓', highlight: true },
    { name: 'Turismo Gastronômico', path: '/cursos/turismo-gastronomico', icon: '🗺️' },
    { name: 'Capacitação Profissional', path: '/cursos/capacitacao-profissional', icon: '🥇' },
    { name: 'Saúde e Bem-Estar', path: '/cursos/saude-bem-estar', icon: '🧘' },
  ].filter(l => l.path === '/cursos' || courseIsShown(shownCourses, l.path.slice('/cursos/'.length)));

  // The logo is the way home, so there is no "Início" link. The boxes, the events and the
  // courses + retreats each fold into one menu so the bar stays on one line with the logo beside it.
  const allGroups: { id: string; name: string; intro?: Record<string, string>; links: NavLink[] }[] = [
    { id: 'caixa', name: 'Caixa de Degustação', links: [
      { name: 'Caixa da Semana', path: '/caixas', icon: '🎁' },
      // The weekly subscription is the core of the business, so it keeps the foil treatment.
      { name: 'Assinatura de Caixa', path: '/assinatura', icon: '🗓️', highlight: true, sub: 'caixa toda semana' },
    ] },
    // Reorganized 2026-11-27 (Andrew: "prioritize things people would spend money on"): the paid offers come first, each
    // menu opens on the thing people pay for (gold), and the free doors sit below it. Apps live with the recipes now and
    // Partners moved into Chef Dolly (the footer still lists every partner page), so the bar has five short words.
    { id: 'receitas', name: 'Receitas', links: [
      { name: 'Diário de Receitas', path: '/diario', icon: '🍰', highlight: true, sub: 'receitas grátis e premium' },
      { name: 'E-book Sweet Escape', path: '/sweet-escape/pt', icon: '📖', sub: '7 dias, 7 doces' },
      { name: '2 Receitas Grátis', path: '/receitas', icon: '📝' },
      { name: 'Bateu Vontade?', path: '/vontade', icon: '🥊', brand: true, sub: APPS_COPY.vontade.pt, subByLang: APPS_COPY.vontade },
    ] },
    { id: 'cursos', name: 'Cursos e Retiro', links: [
      // The retreat is the top rung: a stay at the family's house in Itamambuca.
      { name: 'O Retiro', path: '/retreats', icon: '🌴', feature: true, sub: 'fique com a nossa família em Itamambuca' },
      ...cursosLinks,
    ] },
    // Dolly's food coaching: the two prices are in the menu, the free call one tap away.
    { id: 'coaching', name: 'Coaching', links: [
      { name: 'The Daily Tropical Reset', path: '/coaching', icon: '🌱', highlight: true, brand: true, sub: RESET_SUB.pt, subByLang: RESET_SUB },
      { name: 'Sessão avulsa', path: '/coaching#valores', icon: '🗓️', sub: `R$ ${COACHING_PRICES.session}` },
      { name: 'Reset do Paladar · 14 dias', path: '/coaching#sos', icon: '💧', sub: 'sem sal e sem óleo' },
      { name: 'Conversa grátis de 30 min', path: '/coaching#conversa', icon: '☎️' },
    ] },
    { id: 'eventos', name: 'Eventos e Catering', links: [
      { name: 'Menu de Eventos', path: '/menu', icon: '🍰', highlight: true, sub: 'peça um orçamento' },
      { name: 'Brunch Social', path: '/brunch', icon: '🥞' },
    ] },
    // Dolly's page first, her Instagram second and inside the menu: the feed is one deliberate tap away (new tab),
    // not a bare icon in the bar that takes people off the site before they have seen it.
    { id: 'dolly', name: 'Chef Dolly', links: [
      { name: 'Conheça a Dolly', path: '/dolly', icon: '👩‍🍳' },
      { name: 'Instagram', path: STORE_INSTAGRAM_URL, sub: INSTAGRAM_HANDLE, external: true },
      { name: 'Instagram da Dolly', path: DOLLY_INSTAGRAM_URL, sub: DOLLY_INSTAGRAM_HANDLE, external: true },
      { name: 'The Family of the Future', path: FAMILY_INSTAGRAM_URL, sub: FAMILY_INSTAGRAM_HANDLE, external: true },
      { name: 'Parcerias', path: '/b2b', icon: '🤝', sub: 'hotéis, pousadas, restaurantes' },
      { name: 'Trabalhe Conosco', path: '/trabalhe-conosco', icon: '💼' },
    ] },
  ];
  // The box menu stays in the code but is hidden while the weekly box is not on sale (lib/boxSale.ts).
  const localize = (l: NavLink): NavLink => pageL === 'pt' ? l : {
    ...l,
    name: l.brand || l.external ? l.name : tl(l.name),
    sub: l.sub && !l.subByLang && !l.external ? tl(l.sub) : l.sub,
    path: l.external ? l.path : shellHref(l.path, pageL),
  };
  const groups = allGroups.filter(g => BOX_SALE_ON || g.id !== 'caixa')
    .map(g => ({ ...g, name: tl(g.name), links: g.links.map(localize) }));
  const cta = { name: tl('🎁 Receitas grátis'), path: shellHref('/receitas', pageL) };
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileGroupsOpen, setMobileGroupsOpen] = useState<Record<string, boolean>>({ caixa: true, receitas: true, cursos: true, coaching: true, eventos: true });

  // Which language the page is showing (Google Translate's cookie, or a hand-written English page), so the
  // hand-written menu lines match it. Google flips <html lang> when it translates, so watch that to re-read.
  const [menuLang, setMenuLang] = useState('pt');
  useEffect(() => {
    const read = () => {
      const m = /googtrans=\/[^/;]*\/([a-z]{2})/.exec(document.cookie);
      // No Google Translate cookie = the page as written: Portuguese, or a hand-written English page under /en.
      const l = m?.[1] || (pageL !== 'pt' ? pageL : pathname.startsWith('/en') ? 'en' : 'pt');
      setMenuLang(MENU_LANGS.includes(l) ? l : 'en');
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => obs.disconnect();
  }, [pathname, pageL]);
  const groupIntro = (intro: Record<string, string> | undefined, style: React.CSSProperties) =>
    intro ? <span className="notranslate" translate="no" style={style}>{intro[menuLang] ?? intro.pt}</span> : null;
  const linkText = (link: NavLink, subStyle: React.CSSProperties) => (
    <>
      {link.brand ? <span className="notranslate" translate="no">{link.name}</span> : link.name}
      {link.sub && (
        <span className={link.subByLang ? 'notranslate' : undefined} translate={link.subByLang ? 'no' : undefined} style={subStyle}>
          {link.subByLang?.[menuLang] ?? link.sub}
        </span>
      )}
    </>
  );

  const retreatLangs = [
    { name: '🇧🇷 Português', path: '/retreats' },
    { name: '🇦🇷 Español', path: '/es/retiros' },
    { name: 'English', path: '/en/retreats' },
  ];

  /**
   * The word "Idioma" is marked notranslate, so Google Translate leaves it
   * alone — which is right for the language names, but means a Dutch or German
   * visitor sees a Portuguese word they can't read. So we label it in the
   * language of their own device instead, and fall back to "Language", which is
   * the most widely recognised of the options.
   */
  const [langLabel, setLangLabel] = useState('Idioma');

  useEffect(() => {
    const LABELS: Record<string, string> = {
      pt: 'Idioma', en: 'Language', es: 'Idioma', it: 'Lingua',
      fr: 'Langue', de: 'Sprache', nl: 'Taal',
    };
    const deviceLang = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    setLangLabel(LABELS[deviceLang] || 'Language');
  }, []);

  const [isRetreatsDropdownOpen, setIsRetreatsDropdownOpen] = useState(false);

  // Mobile Accordion States

  // The floating pills sit ON TOP of the page, so while you read they cover the
  // text underneath. Every app solves this the same way: tuck the bar away when
  // the reader scrolls down, bring it straight back when they scroll up.
  const [tucked, setTucked] = useState(false);
  // Past the top, the phone header turns into one slim solid bar instead of two big pills floating over the text.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        // Slim bar on/off with a wide gap: switching changes the header's height, which moves the page, which used
        // to flip it straight back (the flicker Andrew saw on 2026-11-28).
        setScrolled(prev => (prev ? y > 20 : y > 140));
        if (Math.abs(y - last) > 6) {
          // Hide while scrolling down; float back in as soon as the scrolling stops (Andrew, 2026-11-28).
          setTucked(y > last && y > 160);
          clearTimeout(settle);
          settle = setTimeout(() => setTucked(false), 350);
          last = y;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); clearTimeout(settle); window.removeEventListener('scroll', onScroll); };
  }, []);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  return (
    <>
      {/* Announcement Banner */}
      <div className="announce-bar" style={{ 
        background: '#2a1a12', 
        color: '#c9a257', 
        textAlign: 'center', 
        fontWeight: 600, 
        letterSpacing: '1px', 
        textTransform: 'uppercase', 
        position: 'relative', 
        width: '100%', 
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: 'clamp(0.78rem, 2vw, 0.9rem)',
        padding: 'clamp(0.5rem, 1.5vw, 0.8rem)'
      }}>
        <span>{tl('🌴 Entregas exclusivas: Itamambuca, Ubatuba e Região. Paraty: pedidos a partir de R$ 600! 🌴')}</span>
      </div>

      <nav className="mobile-header-nav" data-tucked={tucked && !isOpen && !phoneLangOpen ? 'true' : 'false'} data-scrolled={scrolled ? 'true' : 'false'} style={{
        position: 'sticky',
        top: 0,
        width: '100%',
      zIndex: 1000,
      background: 'rgba(253,250,243,0.9)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      <div className="container nav-inner mobile-header-inner" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem'
      }}>
        {/* flexShrink 0: next to the long one-line desktop menu the logo used to be squeezed to nothing. */}
        <Link href="/" aria-label="Início" title="Início" className="glass-pill logo-pill" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', maxWidth: '70vw', flexShrink: 0 }}>
          <img className="logo-full" src="/logo-pineapple-sm.webp" alt="The Tropical Bakery Logo" width={121} height={180} style={{ height: '68px', width: 'auto', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(42,26,18,0.18))' }} />
          {/* Phones, once scrolled: the smaller text-only badge instead of the pineapple (Andrew, 2026-11-28). */}
          <img className="logo-text-sm" src="/logo-gold-sm.webp" alt="" aria-hidden width={240} height={215} />
        </Link>

        {/* Desktop: logo | the menu, centred on the page | account and cart. */}
        <style>{`
          @media (min-width: 1280px) {
            .nav-inner { display: grid !important; grid-template-columns: 1fr auto 1fr; column-gap: 1rem; }
            .nav-inner > .logo-pill { justify-self: start; }
            .nav-desk { display: contents !important; }
            .nav-desk > .nav-links > :first-child { margin-left: 0 !important; }
          }
        `}</style>
        <div className="hidden xl:flex items-center nav-desk" style={{ alignItems: 'center' }}>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
          {/* Caixa de Degustação / Eventos: open on hover, or on a click (tablets have no hover). */}
          {groups.map((group) => {
            const active = group.links.some(l => l.path.split('#')[0] === pathname);
            const open = openGroup === group.id;
            return (
              <div
                key={group.id}
                style={{ position: 'relative', marginLeft: GAP }}
                onMouseEnter={() => setOpenGroup(group.id)}
                onMouseLeave={() => setOpenGroup(null)}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenGroup(group.id)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: active ? '#c9a257' : '#2a1a12',
                    fontWeight: active ? 'bold' : 'normal',
                    textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: TOP_SIZE, whiteSpace: 'nowrap',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                >
                  {group.name} ▾
                </button>
                {open && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, background: 'rgba(253,250,243,0.95)', backdropFilter: 'blur(10px)',
                    minWidth: '230px', padding: '1rem 0', borderRadius: '8px', boxShadow: '0 10px 30px rgba(42,26,18,0.1)',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  }}>
                    {groupIntro(group.intro, { padding: '0 1.5rem 0.4rem', maxWidth: '260px', fontSize: '0.8rem', lineHeight: 1.4, color: '#8a7a6d', whiteSpace: 'normal' })}
                    {group.links.map((link) => (
                      <NavItem key={link.path} link={link} onClick={() => setOpenGroup(null)} style={{
                        padding: '0.5rem 1.5rem',
                        color: link.highlight ? '#2a1a12' : pathname === link.path ? '#c9a257' : '#594a42',
                        textDecoration: 'none',
                        fontWeight: link.highlight || pathname === link.path ? 'bold' : 'normal',
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        ...(link.highlight ? {
                          background: '#c9a257', borderRadius: '6px', margin: '0 0.75rem', padding: '0.5rem 0.75rem',
                          display: 'flex', flexDirection: 'column', lineHeight: 1.2,
                        } : {}),
                        ...(link.feature ? { ...FEATURE_STYLE, borderRadius: '8px', margin: '0 0.75rem 0.25rem', padding: '0.7rem 0.9rem' } : {}),
                      }}>
                        {linkText(link, { ...SUB_STYLE, textAlign: 'left' })}
                      </NavItem>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom Language Switcher — each language name must stay in its own
              language regardless of the page's current translation, otherwise a
              French-speaking visitor can't recognize "Português" once the whole
              menu has been auto-translated into French. */}
          <div
            className="notranslate"
            translate="no"
            style={{ position: 'relative', marginLeft: GAP, cursor: 'pointer' }}
            onMouseEnter={() => setIsRetreatsDropdownOpen(true)}
            onMouseLeave={() => setIsRetreatsDropdownOpen(false)}
          >
            <span title={langLabel} aria-label={langLabel} style={{ color: '#2a1a12', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: TOP_SIZE, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <GlobeIcon /> ▾
            </span>
            {isRetreatsDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'rgba(253,250,243,0.95)', backdropFilter: 'blur(10px)', minWidth: '200px', padding: '1rem 0', borderRadius: '8px', boxShadow: '0 10px 30px rgba(42,26,18,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { code: 'pt', name: 'Português' },
                  { code: 'en', name: 'English' },
                  { code: 'es', name: 'Español' },
                  { code: 'it', name: 'Italiano' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' },
                  { code: 'nl', name: 'Nederlands' }
                ].map((lang) => (
                  <button 
                    key={lang.code} 
                    onClick={() => { changeLanguage(lang.code); setIsRetreatsDropdownOpen(false); }}
                    style={{ padding: '0.5rem 1.5rem', color: '#594a42', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Hidden Google Translate Widget for Desktop */}
          <div id="google_translate_element" style={{ display: 'none' }}></div>

          </div>

          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', justifySelf: 'end' }}>
          {/* The one button in the bar: the free recipes, the first "yes" that leads to the book, the journal and Dolly. */}
          <Link href={cta.path} style={{ ...CTA_STYLE, marginRight: GAP, fontSize: TOP_SIZE, padding: '0.55rem 1rem' }}>{cta.name}</Link>
          <AccountMenu />

          <button
            onClick={() => setIsCartOpen(true)}
            style={{ marginLeft: GAP, background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ display: 'flex', color: '#2a1a12' }}><BagIcon size={24} /></span>
            {totalItems > 0 && (
              <span aria-label={`${totalItems} na sacola`} style={BAG_BADGE}>
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
          </div>
        </div>

        {/* Mobile Menu Toggle & Cart */}
        <div className="xl:hidden glass-pill actions-pill flex items-center gap-4">
          {/* Log in / my account, always in sight on phones (Andrew, 2026-11-27). */}
          {user ? (
            <Link href="/minha-conta" aria-label={tl('Conta')} style={{ color: '#2a1a12', minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonIcon size={24} />
            </Link>
          ) : (
            <button type="button" onClick={() => setLoginOpen(true)} aria-label={tl('Entrar')} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#2a1a12', minHeight: '44px', padding: 0,
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
            }}>
              <PersonIcon size={22} />
              <span className="nav-login-label" {...ownProps} style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{shellText('Entrar', ownL)}</span>
            </button>
          )}
          <ClubeModal open={loginOpen} onClose={closeLogin} />
          {/* The language switch, in sight on phones instead of at the bottom of the menu (Andrew, 2026-11-28). */}
          <div className="notranslate" translate="no" style={{ position: 'relative' }}>
            <button type="button" onClick={() => setPhoneLangOpen(o => !o)} aria-label={langLabel} aria-expanded={phoneLangOpen}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a1a12', minWidth: '44px', minHeight: '44px', padding: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
              <GlobeIcon size={20} />
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.5px' }}>{(pageL !== 'pt' ? pageL : trL).toUpperCase()}</span>
            </button>
            {phoneLangOpen && (
              <>
                <div onClick={() => setPhoneLangOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
                <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: '-60px', zIndex: 2, background: '#fdfaf3', borderRadius: '16px', boxShadow: '0 14px 40px rgba(42,26,18,0.22)', border: '1px solid rgba(201,162,87,0.35)', padding: '0.4rem', minWidth: '176px', display: 'grid' }}>
                  {[
                    { code: 'pt', name: 'Português' }, { code: 'en', name: 'English' }, { code: 'es', name: 'Español' },
                    { code: 'nl', name: 'Nederlands' }, { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' }, { code: 'it', name: 'Italiano' },
                  ].map(l => {
                    const on = (pageL !== 'pt' ? pageL : trL) === l.code;
                    return (
                      <button key={l.code} role="menuitem" type="button" onClick={() => { setPhoneLangOpen(false); changeLanguage(l.code); }}
                        style={{ textAlign: 'left', background: on ? 'rgba(201,162,87,0.16)' : 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', padding: '0.7rem 0.9rem', fontSize: '1rem', color: '#2a1a12', fontWeight: on ? 700 : 400 }}>
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {/* 44x44 is the smallest a thumb hits reliably (Apple HIG); the glyph stays 1.5rem. */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Abrir o carrinho"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#2a1a12',
              position: 'relative',
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BagIcon size={22} />
            {totalItems > 0 && (
              <span aria-label={`${totalItems} na sacola`} style={BAG_BADGE}>
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar o menu' : 'Abrir o menu'}
            aria-expanded={isOpen}
            style={{
              background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#2a1a12',
              minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
      {/* ============ MOBILE FULL-SCREEN MENU ============ */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: '#faf5ec',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Menu Header with close button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(212,175,55,0.2)',
            flexShrink: 0,
          }}>
            <Link href="/" onClick={closeMenu} style={{ textDecoration: 'none' }}>
              <img src="/logo-pineapple-sm.webp" alt="Logo" style={{ height: '58px', width: 'auto' }} />
            </Link>
            <button 
              onClick={closeMenu}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#2a1a12',
                padding: '0.5rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable menu body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '1rem 1.5rem 6rem 1.5rem',
          }}>
            <AccountMenu variant="mobile" />
            <Link href={cta.path} onClick={closeMenu} style={{ ...CTA_STYLE, display: 'block', textAlign: 'center', margin: '0.5rem 0 0.75rem', padding: '0.9rem 1rem', fontSize: '1rem' }}>{cta.name}</Link>
            {/* The delivery area: off the phone header (it got in the way), shown here instead. */}
            <p style={{
              margin: '0.5rem 0 0.25rem', padding: '0.7rem 0.9rem', borderRadius: '12px',
              background: '#2a1a12', color: '#c9a257', fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 600, textAlign: 'center',
            }}>
              {tl('🌴 Entregamos em Itamambuca, Ubatuba e região. Paraty: pedidos a partir de R$ 600.')}
            </p>
            {/* The paid offers, open by default so each is one tap away; Chef Dolly (and partners) folded. */}
            {groups.map((group) => (
              <div key={group.id}>
                <button
                  onClick={() => setMobileGroupsOpen(s => ({ ...s, [group.id]: !s[group.id] }))}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0 0.5rem 0',
                    fontWeight: 'bold', color: '#2a1a12', fontSize: '0.85rem', textTransform: 'uppercase',
                    letterSpacing: '2px', opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                  {group.name} <span>{mobileGroupsOpen[group.id] ? '▲' : '▼'}</span>
                </button>
                {mobileGroupsOpen[group.id] && groupIntro(group.intro, { display: 'block', padding: '0.2rem 0 0.4rem', fontSize: '0.9rem', lineHeight: 1.4, color: '#8a7a6d' })}
                {mobileGroupsOpen[group.id] && group.links.map((link) => (
                  <NavItem
                    key={link.path}
                    link={link}
                    onClick={closeMenu}
                    tile={34}
                    style={{
                      display: 'block',
                      padding: '0.8rem 0 0.8rem 1rem',
                      textDecoration: 'none',
                      color: link.highlight ? '#2a1a12' : pathname === link.path ? '#c9a257' : '#594a42',
                      fontWeight: link.highlight || pathname === link.path ? 'bold' : '400',
                      fontSize: '1.1rem',
                      borderBottom: link.highlight || link.feature ? 'none' : '1px solid rgba(0,0,0,0.04)',
                      animation: 'fadeIn 0.2s ease-out',
                      ...(link.highlight ? { background: '#c9a257', borderRadius: '8px', margin: '0.3rem 0', padding: '0.8rem 1rem' } : {}),
                      ...(link.feature ? { ...FEATURE_STYLE, borderRadius: '8px', margin: '0.3rem 0', padding: '0.9rem 1rem' } : {}),
                    }}
                  >
                    {linkText(link, { display: 'block', fontSize: '0.8rem', fontWeight: 500, opacity: 0.85 })}
                  </NavItem>
                ))}
              </div>
            ))}


            {/* Language Section Header — kept untranslated, same reason as desktop */}
            <button
              className="notranslate"
              translate="no"
              onClick={() => setMobileLangOpen(!mobileLangOpen)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1.5rem 0 0.5rem 0', 
                fontWeight: 'bold', 
                color: '#2a1a12', 
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                opacity: 0.8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
              <GlobeIcon /> {langLabel.toUpperCase()} <span>{mobileLangOpen ? '▲' : '▼'}</span>
            </button>
            {mobileLangOpen && [
              { code: 'pt', name: 'Português' },
              { code: 'en', name: 'English' },
              { code: 'es', name: 'Español' },
              { code: 'it', name: 'Italiano' },
              { code: 'fr', name: 'Français' },
              { code: 'de', name: 'Deutsch' },
              { code: 'nl', name: 'Nederlands' }
            ].map((lang) => (
              <button
                key={lang.code}
                className="notranslate"
                translate="no"
                onClick={() => { changeLanguage(lang.code); closeMenu(); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0.8rem 0 0.8rem 1rem', color: '#594a42', fontSize: '1.1rem', borderBottom: '1px solid rgba(0,0,0,0.04)', animation: 'fadeIn 0.2s ease-out' }}>
                {lang.name}
              </button>
            ))}

          </div>
        </div>
      )}
    </>
  );
}
