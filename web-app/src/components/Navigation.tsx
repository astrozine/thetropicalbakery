'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import AccountMenu from '@/components/AccountMenu';

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
    const selectNode = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectNode) {
      selectNode.value = langCode;
      selectNode.dispatchEvent(new Event('change'));
    }
  };

  const links: { name: string; path: string; highlight?: boolean }[] = [
    { name: 'Início', path: '/' },
    // The weekly subscription is the core of the business, so it leads and is
    // the only item given the foil treatment.
    { name: 'Assinatura', path: '/assinatura', highlight: true },
    { name: 'Caixa de Degustação', path: '/caixas' },
    { name: 'Menu de Eventos', path: '/menu' },
    { name: 'Retiros', path: '/retreats' },
  ];

  const cursosLinks = [
    { name: 'Todos os Cursos', path: '/cursos' },
    { name: 'Turismo Gastronômico', path: '/cursos/turismo-gastronomico' },
    { name: 'Capacitação Profissional', path: '/cursos/capacitacao-profissional' },
    { name: 'Saúde e Bem-Estar', path: '/cursos/saude-bem-estar' },
  ];

  const b2bLinks = [
    { name: 'Hotéis', path: '/b2b/hotels' },
    { name: 'Pousadas', path: '/b2b/pousadas' },
    { name: 'Airbnbs', path: '/b2b/airbnbs' },
    { name: 'Restaurantes', path: '/b2b/restaurants' },
    { name: 'Padarias', path: '/b2b/bakeries' },
    { name: 'Travel Managers', path: '/b2b/travel-managers' },
    { name: 'Afiliados', path: '/b2b/affiliates' },
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
  const [isCursosDropdownOpen, setIsCursosDropdownOpen] = useState(false);

  // Mobile Accordion States
  const [mobileCursosOpen, setMobileCursosOpen] = useState(false);
  const [mobileB2bOpen, setMobileB2bOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  return (
    <>
      {/* Announcement Banner */}
      <div style={{ 
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
        fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
        padding: 'clamp(0.5rem, 1.5vw, 0.8rem)'
      }}>
        <span>🌴 Entregas exclusivas: Itamambuca, Ubatuba e Região. Eventos em Paraty! 🌴</span>
      </div>

      <nav className="mobile-header-nav" style={{
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
        <Link href="/" className="glass-pill logo-pill" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', maxWidth: '70vw' }}>
          <img src="/logo-gold.webp" alt="The Tropical Bakery Logo" style={{ height: '62px', maxWidth: '100%', objectFit: 'contain' }} />
        </Link>
        
        {/* Desktop Menu & Cart */}
        <div className="hidden md:flex items-center" style={{ alignItems: 'center' }}>
          {links.map((link) => (
            <Link key={link.path} href={link.path} style={{
              marginLeft: '1.5rem',
              textDecoration: 'none',
              color: link.highlight ? '#3c2a21' : pathname === link.path ? '#d4af37' : '#3c2a21',
              fontWeight: link.highlight || pathname === link.path ? 'bold' : 'normal',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem',
              ...(link.highlight ? {
                background: '#d4af37',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
              } : {}),
            }}>
              {link.name}
            </Link>
          ))}

          {/* Cursos Dropdown */}
          <div 
            style={{ position: 'relative', marginLeft: '1.5rem', cursor: 'pointer' }}
            onMouseEnter={() => setIsCursosDropdownOpen(true)}
            onMouseLeave={() => setIsCursosDropdownOpen(false)}
          >
            <span style={{
              color: '#3c2a21',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Cursos ▾
            </span>
            {isCursosDropdownOpen && (
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
                {cursosLinks.map((link) => (
                  <Link key={link.path} href={link.path} style={{ padding: '0.5rem 1.5rem', color: pathname === link.path ? '#d4af37' : '#594a42', textDecoration: 'none', fontWeight: pathname === link.path ? 'bold' : 'normal', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Custom Language Switcher — each language name must stay in its own
              language regardless of the page's current translation, otherwise a
              French-speaking visitor can't recognize "Português" once the whole
              menu has been auto-translated into French. */}
          <div
            className="notranslate"
            translate="no"
            style={{ position: 'relative', marginLeft: '1.5rem', cursor: 'pointer' }}
            onMouseEnter={() => setIsRetreatsDropdownOpen(true)}
            onMouseLeave={() => setIsRetreatsDropdownOpen(false)}
          >
            <span style={{ color: '#3c2a21', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🌐 {langLabel} ▾
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
            style={{ position: 'relative', marginLeft: '1.5rem', cursor: 'pointer' }}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <span style={{
              color: '#3c2a21',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Parceiros B2B ▾
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
                    color: pathname === link.path ? '#d4af37' : '#594a42',
                    textDecoration: 'none',
                    fontWeight: pathname === link.path ? 'bold' : 'normal',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase'
                  }}>
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <AccountMenu />

          <button
            onClick={() => setIsCartOpen(true)}
            style={{ marginLeft: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ fontSize: '1.5rem' }}>🛒</span>
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#e74c3c', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '50%' }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu Toggle & Cart */}
        <div className="md:hidden glass-pill actions-pill flex items-center gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              color: '#3c2a21',
              position: 'relative'
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
          
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#3c2a21' }}>
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
              </Link>
            ))}
            
            {/* Cursos Section Header */}
            <button 
              onClick={() => setMobileCursosOpen(!mobileCursosOpen)}
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
              CURSOS <span>{mobileCursosOpen ? '▲' : '▼'}</span>
            </button>
            {mobileCursosOpen && cursosLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={closeMenu}
                style={{
                  display: 'block',
                  padding: '0.8rem 0 0.8rem 1rem',
                  textDecoration: 'none',
                  color: pathname === link.path ? '#d4af37' : '#594a42',
                  fontWeight: pathname === link.path ? 'bold' : '400',
                  fontSize: '1.1rem',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                {link.name}
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
              PARCEIROS B2B <span>{mobileB2bOpen ? '▲' : '▼'}</span>
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
                  color: pathname === link.path ? '#d4af37' : '#594a42',
                  fontWeight: pathname === link.path ? 'bold' : '400',
                  fontSize: '1.1rem',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  animation: 'fadeIn 0.2s ease-out'
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
          </div>
        </div>
      )}
    </>
  );
}
