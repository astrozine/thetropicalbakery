'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import AccountMenu from '@/components/AccountMenu';
import InstagramLink from '@/components/InstagramLink';
import { SUB_STYLE } from '@/components/ClubeInvite';
import { courseIsShown, useShownCourses } from '@/lib/useShownCourses';
import { isEbookLang, LANG_PATH } from '@/lib/ebookCopy';
import { clearGoogleTranslate } from '@/lib/googleTranslate';

// Desktop menu (xl and up): one line at 1280px, roomier on bigger screens.
const GAP = 'clamp(0.7rem, 1.1vw, 1.5rem)';
const TOP_SIZE = 'clamp(0.74rem, 0.78vw, 0.9rem)';

/** Portuguese page -> its hand-written English version (the language menu sends people between them). */
const HAND_TRANSLATED_EN: Record<string, string> = {
  '/b2b/barcos': '/en/b2b/boats',
};

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

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

  const links: { name: string; path: string; highlight?: boolean; sub?: string }[] = [
    { name: 'Chef Dolly', path: '/dolly' },
  ];

  // A course Dolly has hidden in the admin ("em preparo") leaves this menu too.
  const shownCourses = useShownCourses();
  const cursosLinks = [
    { name: 'Todos os Cursos', path: '/cursos', highlight: true },
    { name: 'Turismo Gastronômico', path: '/cursos/turismo-gastronomico' },
    { name: 'Capacitação Profissional', path: '/cursos/capacitacao-profissional' },
    { name: 'Saúde e Bem-Estar', path: '/cursos/saude-bem-estar' },
  ].filter(l => l.path === '/cursos' || courseIsShown(shownCourses, l.path.slice('/cursos/'.length)));

  // The logo is the way home, so there is no "Início" link. The boxes, the events and the
  // courses + retreats each fold into one menu so the bar stays on one line with the logo beside it.
  const groups: { id: string; name: string; links: { name: string; path: string; highlight?: boolean; sub?: string }[] }[] = [
    { id: 'caixa', name: 'Caixa de Degustação', links: [
      { name: 'Caixa da Semana', path: '/caixas' },
      // The weekly subscription is the core of the business, so it keeps the foil treatment.
      { name: 'Assinatura de Caixa', path: '/assinatura', highlight: true, sub: 'caixa toda semana' },
    ] },
    { id: 'eventos', name: 'Eventos', links: [
      { name: 'Brunch Social', path: '/brunch' },
      { name: 'Menu de Eventos', path: '/menu' },
    ] },
    { id: 'cursos', name: 'Cursos e Retiros', links: [
      { name: 'Retiros', path: '/retreats' },
      ...cursosLinks,
    ] },
    // The free 2-recipe sampler (/receitas) is the door into Sweet Escape, the full 7-day book.
    { id: 'ebook', name: 'E-book', links: [
      { name: '2 Receitas Grátis', path: '/receitas' },
      { name: 'Livro Completo', path: '/sweet-escape/pt', highlight: true, sub: '7 dias, 7 doces' },
    ] },
  ];
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileGroupsOpen, setMobileGroupsOpen] = useState<Record<string, boolean>>({ caixa: true, eventos: true, ebook: true });

  const b2bLinks = [
    { name: 'Todas as Parcerias', path: '/b2b', highlight: true },
    { name: 'Hotéis', path: '/b2b/hotels' },
    { name: 'Pousadas', path: '/b2b/pousadas' },
    { name: 'Airbnbs', path: '/b2b/airbnbs' },
    { name: 'Restaurantes', path: '/b2b/restaurants' },
    { name: 'Padarias', path: '/b2b/bakeries' },
    { name: 'Barcos e Marinas', path: '/b2b/barcos' },
    { name: 'Yoga, Academias e Spas', path: '/b2b/bem-estar' },
    { name: 'Travel Managers', path: '/b2b/travel-managers' },
    { name: 'Afiliados', path: '/b2b/affiliates' },
    // Not a B2B account, but it belongs in the same "ways to partner with us"
    // menu — and this is where a job seeker would naturally look first.
    { name: 'Trabalhe Conosco', path: '/trabalhe-conosco' },
  ];

  const retreatLangs = [
    { name: '🇧🇷 Português', path: '/retreats' },
    { name: '🇦🇷 Español', path: '/es/retiros' },
    { name: '✈️ English', path: '/en/retreats' },
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRetreatsDropdownOpen, setIsRetreatsDropdownOpen] = useState(false);

  // Mobile Accordion States
  const [mobileB2bOpen, setMobileB2bOpen] = useState(false);

  // The floating pills sit ON TOP of the page, so while you read they cover the
  // text underneath. Every app solves this the same way: tuck the bar away when
  // the reader scrolls down, bring it straight back when they scroll up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const down = y > last;
        // Never hide near the top, and ignore tiny jitters.
        if (Math.abs(y - last) > 6) setTucked(down && y > 160);
        last = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, []);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  return (
    <>
      {/* Announcement Banner */}
      <div className="announce-bar" style={{ 
        background: '#3c2a21', 
        color: '#d4af37', 
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
        <span>🌴 Entregas exclusivas: Itamambuca, Ubatuba e Região. Paraty: pedidos a partir de R$ 600! 🌴</span>
      </div>

      <nav className="mobile-header-nav" data-tucked={tucked && !isOpen ? 'true' : 'false'} style={{
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
          <img src="/logo-gold.webp" alt="The Tropical Bakery Logo" style={{ height: '62px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
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
            const active = group.links.some(l => l.path === pathname);
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
                    color: active ? '#d4af37' : '#3c2a21',
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
                    minWidth: '230px', padding: '1rem 0', borderRadius: '8px', boxShadow: '0 10px 30px rgba(60,42,33,0.1)',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  }}>
                    {group.links.map((link) => (
                      <Link key={link.path} href={link.path} onClick={() => setOpenGroup(null)} style={{
                        padding: '0.5rem 1.5rem',
                        color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#594a42',
                        textDecoration: 'none',
                        fontWeight: link.highlight || pathname === link.path ? 'bold' : 'normal',
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        ...(link.highlight ? {
                          background: '#d4af37', borderRadius: '6px', margin: '0 0.75rem', padding: '0.5rem 0.75rem',
                          display: 'flex', flexDirection: 'column', lineHeight: 1.2,
                        } : {}),
                      }}>
                        {link.name}
                        {link.sub && <span style={{ ...SUB_STYLE, textAlign: 'left' }}>{link.sub}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {links.map((link) => (
            <Link key={link.path} href={link.path} style={{
              marginLeft: GAP,
              textDecoration: 'none',
              color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#3c2a21',
              fontWeight: link.highlight || pathname === link.path ? 'bold' : 'normal',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: TOP_SIZE,
              whiteSpace: 'nowrap',
              ...(link.highlight ? {
                background: '#d4af37',
                padding: '0.35rem 0.9rem',
                borderRadius: '6px',
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15,
              } : {}),
            }}>
              {link.name}
              {link.sub && <span style={SUB_STYLE}>{link.sub}</span>}
            </Link>
          ))}

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
            <span title={langLabel} aria-label={langLabel} style={{ color: '#3c2a21', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: TOP_SIZE, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              🌐 ▾
            </span>
            {isRetreatsDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'rgba(253,250,243,0.95)', backdropFilter: 'blur(10px)', minWidth: '200px', padding: '1rem 0', borderRadius: '8px', boxShadow: '0 10px 30px rgba(60,42,33,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

          {/* B2B Dropdown */}
          <div 
            style={{ position: 'relative', marginLeft: GAP, cursor: 'pointer' }}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <span style={{
              color: '#3c2a21',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: TOP_SIZE,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Parcerias ▾
            </span>
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'rgba(253,250,243,0.95)',
                backdropFilter: 'blur(10px)',
                minWidth: '200px',
                padding: '1rem 0',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(60,42,33,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {b2bLinks.map((link) => (
                  <Link key={link.path} href={link.path} style={{
                    padding: '0.5rem 1.5rem',
                    color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#594a42',
                    textDecoration: 'none',
                    fontWeight: link.highlight || pathname === link.path ? 'bold' : 'normal',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    ...(link.highlight ? {
                      background: '#d4af37',
                      borderRadius: '6px',
                      margin: '0 0.75rem',
                      padding: '0.5rem 0.75rem',
                    } : {}),
                  }}>
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          </div>

          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', justifySelf: 'end' }}>
          <InstagramLink size={20} style={{ marginLeft: GAP, color: '#594a42', minWidth: 32, minHeight: 32 }} />

          <AccountMenu />

          <button
            onClick={() => setIsCartOpen(true)}
            style={{ marginLeft: GAP, background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🛒</span>
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#e74c3c', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '50%' }}>
                {totalItems}
              </span>
            )}
          </button>
          </div>
        </div>

        {/* Mobile Menu Toggle & Cart */}
        <div className="xl:hidden glass-pill actions-pill flex items-center gap-4">
          {/* 44x44 is the smallest a thumb hits reliably (Apple HIG); the glyph stays 1.5rem. */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Abrir o carrinho"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#3c2a21',
              position: 'relative',
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🛒
            {totalItems > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-10px',
                background: '#d4af37',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {totalItems}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar o menu' : 'Abrir o menu'}
            aria-expanded={isOpen}
            style={{
              background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#3c2a21',
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
          background: '#fdfaf3',
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
              <img src="/logo-gold.webp" alt="Logo" style={{ height: '52px' }} />
            </Link>
            <button 
              onClick={closeMenu}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#3c2a21',
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
            {/* Caixa de Degustação / Eventos — open by default so the subscription is one tap away. */}
            {groups.map((group) => (
              <div key={group.id}>
                <button
                  onClick={() => setMobileGroupsOpen(s => ({ ...s, [group.id]: !s[group.id] }))}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0 0.5rem 0',
                    fontWeight: 'bold', color: '#3c2a21', fontSize: '0.85rem', textTransform: 'uppercase',
                    letterSpacing: '2px', opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                  {group.name} <span>{mobileGroupsOpen[group.id] ? '▲' : '▼'}</span>
                </button>
                {mobileGroupsOpen[group.id] && group.links.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '0.8rem 0 0.8rem 1rem',
                      textDecoration: 'none',
                      color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#594a42',
                      fontWeight: link.highlight || pathname === link.path ? 'bold' : '400',
                      fontSize: '1.1rem',
                      borderBottom: link.highlight ? 'none' : '1px solid rgba(0,0,0,0.04)',
                      animation: 'fadeIn 0.2s ease-out',
                      ...(link.highlight ? { background: '#d4af37', borderRadius: '8px', margin: '0.3rem 0', padding: '0.8rem 1rem' } : {}),
                    }}
                  >
                    {link.name}
                    {link.sub && <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, opacity: 0.85 }}>{link.sub}</span>}
                  </Link>
                ))}
              </div>
            ))}

            {/* Main Links */}
            {links.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={closeMenu}
                style={{
                  display: 'block',
                  padding: link.highlight ? '0.9rem 1rem' : '1rem 0',
                  textDecoration: 'none',
                  color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#3c2a21',
                  fontWeight: link.highlight || pathname === link.path ? 'bold' : '500',
                  fontSize: '1.2rem',
                  borderBottom: link.highlight ? 'none' : '1px solid rgba(0,0,0,0.06)',
                  letterSpacing: '0.5px',
                  ...(link.highlight ? {
                    background: '#d4af37',
                    borderRadius: '8px',
                    margin: '0.5rem 0',
                    textAlign: 'center' as const,
                  } : {}),
                }}
              >
                {link.name}
                {link.sub && <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, opacity: 0.85 }}>{link.sub}</span>}
              </Link>
            ))}

            {/* B2B Section Header */}
            <button 
              onClick={() => setMobileB2bOpen(!mobileB2bOpen)}
              style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1.5rem 0 0.5rem 0', 
                fontWeight: 'bold', 
                color: '#3c2a21', 
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                opacity: 0.8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
              PARCERIAS <span>{mobileB2bOpen ? '▲' : '▼'}</span>
            </button>
            {mobileB2bOpen && b2bLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={closeMenu}
                style={{
                  display: 'block',
                  padding: '0.8rem 0 0.8rem 1rem',
                  textDecoration: 'none',
                  color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#594a42',
                  fontWeight: link.highlight || pathname === link.path ? 'bold' : '400',
                  fontSize: '1.1rem',
                  borderBottom: link.highlight ? 'none' : '1px solid rgba(0,0,0,0.04)',
                  animation: 'fadeIn 0.2s ease-out',
                  ...(link.highlight ? {
                    background: '#d4af37',
                    borderRadius: '8px',
                    margin: '0.3rem 0',
                    padding: '0.8rem 1rem',
                  } : {}),
                }}
              >
                {link.name}
              </Link>
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
                color: '#3c2a21', 
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                opacity: 0.8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
              🌐 {langLabel.toUpperCase()} <span>{mobileLangOpen ? '▲' : '▼'}</span>
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

            <AccountMenu variant="mobile" />

            <InstagramLink size={22} showHandle style={{ marginTop: '1.5rem', color: '#594a42', fontSize: '1rem' }} />
          </div>
        </div>
      )}
    </>
  );
}
