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
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const links = [
    { name: 'Início', path: '/' },
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
    { name: 'Airbnbs', path: '/b2b/airbnbs' },
    { name: 'Hotéis', path: '/b2b/hotels' },
    { name: 'Pousadas', path: '/b2b/pousadas' },
    { name: 'Restaurantes', path: '/b2b/restaurants' },
    { name: 'Padarias', path: '/b2b/bakeries' },
    { name: 'Gestores de Turismo', path: '/b2b/travel-managers' },
    { name: 'Afiliados', path: '/b2b/affiliates' },
  ];

  const [isDesktopCursosOpen, setIsDesktopCursosOpen] = useState(false);
  const [isDesktopB2BOpen, setIsDesktopB2BOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1000,
        background: 'rgba(253, 250, 243, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        padding: '1rem 0'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <Link href="/" onClick={closeMenu} style={{ textDecoration: 'none' }}>
              <h1 style={{
                fontSize: '1.5rem',
                color: '#d4af37',
                margin: 0,
                fontFamily: 'var(--font-heading)'
              }}>The Tropical Bakery</h1>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="desktop-menu" style={{
            display: 'none',
            gap: '2.5rem',
            alignItems: 'center',
            flex: 2,
            justifyContent: 'center'
          }}>
            {links.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                style={{
                  textDecoration: 'none',
                  color: pathname === link.path ? '#d4af37' : '#594a42',
                  fontWeight: pathname === link.path ? 600 : 500,
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#d4af37'}
                onMouseLeave={(e) => e.currentTarget.style.color = pathname === link.path ? '#d4af37' : '#594a42'}
              >
                {link.name}
              </Link>
            ))}

            {/* Cursos Dropdown */}
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onMouseEnter={() => setIsDesktopCursosOpen(true)}
              onMouseLeave={() => setIsDesktopCursosOpen(false)}
            >
              <span style={{
                textDecoration: 'none',
                color: pathname?.includes('/cursos') ? '#d4af37' : '#594a42',
                fontWeight: pathname?.includes('/cursos') ? 600 : 500,
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'color 0.3s ease'
              }}>
                Cursos ▾
              </span>
              {isDesktopCursosOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  minWidth: '220px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '0.5rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '1rem',
                  zIndex: 1000,
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '12px',
                    height: '12px',
                    background: '#fff',
                    borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
                    borderTop: '1px solid rgba(212, 175, 55, 0.2)'
                  }} />
                  {cursosLinks.map((link) => (
                    <Link 
                      key={link.path}
                      href={link.path}
                      style={{
                        padding: '0.8rem 1.5rem',
                        color: pathname === link.path ? '#d4af37' : '#594a42',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                        e.currentTarget.style.color = '#d4af37';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = pathname === link.path ? '#d4af37' : '#594a42';
                      }}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Parceiros B2B Dropdown */}
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onMouseEnter={() => setIsDesktopB2BOpen(true)}
              onMouseLeave={() => setIsDesktopB2BOpen(false)}
            >
              <span style={{
                textDecoration: 'none',
                color: pathname?.includes('/b2b') ? '#d4af37' : '#594a42',
                fontWeight: pathname?.includes('/b2b') ? 600 : 500,
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'color 0.3s ease'
              }}>
                Parceiros B2B ▾
              </span>
              {isDesktopB2BOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  minWidth: '220px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '0.5rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '1rem',
                  zIndex: 1000,
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '12px',
                    height: '12px',
                    background: '#fff',
                    borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
                    borderTop: '1px solid rgba(212, 175, 55, 0.2)'
                  }} />
                  {b2bLinks.map((link) => (
                    <Link 
                      key={link.path}
                      href={link.path}
                      style={{
                        padding: '0.8rem 1.5rem',
                        color: pathname === link.path ? '#d4af37' : '#594a42',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                        e.currentTarget.style.color = '#d4af37';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = pathname === link.path ? '#d4af37' : '#594a42';
                      }}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Google Translate Widget */}
            <div id="google_translate_element" style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}></div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Desktop Cart */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              className="desktop-menu"
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
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#3c2a21', position: 'relative' }}
            >
              🛒
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#d4af37', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', flexShrink: 0 }}>
            <Link href="/" onClick={closeMenu} style={{ textDecoration: 'none' }}>
              <img src="/logo.svg" alt="Logo" style={{ height: '50px' }} />
            </Link>
            <button onClick={closeMenu} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#3c2a21', padding: '0.5rem', lineHeight: 1 }}>✕</button>
          </div>

          {/* Scrollable menu body */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '1rem 1.5rem 6rem 1.5rem' }}>
            
            {/* Google Translate Widget in Mobile Menu */}
            <div style={{ padding: '1rem 0' }}>
               <div id="google_translate_element_mobile"></div>
            </div>

            {/* Main Links */}
            {links.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={closeMenu}
                style={{ display: 'block', padding: '1rem 0', textDecoration: 'none', color: pathname === link.path ? '#d4af37' : '#3c2a21', fontWeight: pathname === link.path ? 'bold' : '500', fontSize: '1.2rem', borderBottom: '1px solid rgba(0,0,0,0.06)', letterSpacing: '0.5px' }}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Cursos Section Header */}
            <div style={{ padding: '1.5rem 0 0.5rem 0', fontWeight: 'bold', color: '#3c2a21', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6 }}>CURSOS</div>
            {cursosLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={closeMenu}
                style={{ display: 'block', padding: '0.8rem 0 0.8rem 1rem', textDecoration: 'none', color: pathname === link.path ? '#d4af37' : '#594a42', fontWeight: pathname === link.path ? 'bold' : '400', fontSize: '1.1rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              >
                {link.name}
              </Link>
            ))}
            
            {/* B2B Section Header */}
            <div style={{ padding: '1.5rem 0 0.5rem 0', fontWeight: 'bold', color: '#3c2a21', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6 }}>PARCEIROS B2B</div>
            {b2bLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={closeMenu}
                style={{ display: 'block', padding: '0.8rem 0 0.8rem 1rem', textDecoration: 'none', color: pathname === link.path ? '#d4af37' : '#594a42', fontWeight: pathname === link.path ? 'bold' : '400', fontSize: '1.1rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
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
