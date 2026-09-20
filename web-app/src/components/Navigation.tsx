'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

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

  const links = [
    { name: 'Início', path: '/' },
    { name: 'Menu de Eventos', path: '/menu' },
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRetreatsDropdownOpen, setIsRetreatsDropdownOpen] = useState(false);
  const [isCursosDropdownOpen, setIsCursosDropdownOpen] = useState(false);

  return (
    <>
      <nav className="mobile-header-nav" style={{
        position: 'fixed',
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
          <img src="/logo.svg" alt="The Tropical Bakery Logo" style={{ height: '60px', maxWidth: '100%', objectFit: 'contain' }} />
        </Link>
        
        {/* Desktop Menu & Cart */}
        <div className="desktop-menu" style={{ display: 'none', alignItems: 'center' }}>
          {links.map((link) => (
            <Link key={link.path} href={link.path} style={{
              marginLeft: '1.5rem',
              textDecoration: 'none',
              color: pathname === link.path ? '#d4af37' : '#3c2a21',
              fontWeight: pathname === link.path ? 'bold' : 'normal',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.9rem'
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

          {/* Retreats Language Dropdown */}
          <div 
            style={{ position: 'relative', marginLeft: '1.5rem', cursor: 'pointer' }}
            onMouseEnter={() => setIsRetreatsDropdownOpen(true)}
            onMouseLeave={() => setIsRetreatsDropdownOpen(false)}
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
              Retiros (Idioma) ▾
            </span>
            {isRetreatsDropdownOpen && (
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
                {retreatLangs.map((link) => (
                  <Link key={link.path} href={link.path} style={{ padding: '0.5rem 1.5rem', color: pathname === link.path ? '#d4af37' : '#594a42', textDecoration: 'none', fontWeight: pathname === link.path ? 'bold' : 'normal', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

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
        <div className="glass-pill actions-pill mobile-menu-toggle mobile-icons flex items-center gap-4">
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

      {/* Basic inline style to handle media query for desktop menu */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .mobile-icons { display: none !important; }
          .desktop-menu { display: flex !important; }
        }
        @media (max-width: 767px) {
          .nav-inner {
            flex-direction: row;
            justify-content: space-between !important;
          }
          .mobile-icons {
            display: flex;
            justify-content: flex-end;
          }
        }
      `}} />
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
              <img src="/logo.svg" alt="Logo" style={{ height: '50px' }} />
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
                  padding: '1rem 0',
                  textDecoration: 'none',
                  color: pathname === link.path ? '#d4af37' : '#3c2a21',
                  fontWeight: pathname === link.path ? 'bold' : '500',
                  fontSize: '1.2rem',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  letterSpacing: '0.5px',
                }}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Cursos Section Header */}
            <div style={{ 
              padding: '1.5rem 0 0.5rem 0', 
              fontWeight: 'bold', 
              color: '#3c2a21', 
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              opacity: 0.6,
            }}>
              CURSOS
            </div>
            {cursosLinks.map((link) => (
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
                }}
              >
                {link.name}
              </Link>
            ))}
            
            {/* B2B Section Header */}
            <div style={{ 
              padding: '1.5rem 0 0.5rem 0', 
              fontWeight: 'bold', 
              color: '#3c2a21', 
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              opacity: 0.6,
            }}>
              PARCEIROS B2B
            </div>
            {b2bLinks.map((link) => (
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
                }}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Language Section Header */}
            <div style={{ 
              padding: '1.5rem 0 0.5rem 0', 
              fontWeight: 'bold', 
              color: '#3c2a21', 
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              opacity: 0.6,
            }}>
              RETIROS (IDIOMA)
            </div>
            {retreatLangs.map((link) => (
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
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
