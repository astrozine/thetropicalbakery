'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  const toggleMenu = () => setIsOpen(!isOpen);

  const links = [
    { name: 'Início', path: '/' },
    { name: 'Cursos', path: '/cursos' },
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRetreatsDropdownOpen, setIsRetreatsDropdownOpen] = useState(false);

  return (
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

          <Link href="/menu" className="btn btn-secondary" style={{
            marginLeft: '1.5rem',
            padding: '0.4rem 1.2rem',
            fontSize: '0.85rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Menu de Eventos
          </Link>

          {/* Retreats Dropdown */}
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
              Retiros ▾
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
                <Link href="/retreats" style={{ padding: '0.5rem 1.5rem', color: pathname === '/retreats' ? '#d4af37' : '#594a42', textDecoration: 'none', fontWeight: pathname === '/retreats' ? 'bold' : 'normal', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  🇧🇷 Português
                </Link>
                <Link href="/es/retiros" style={{ padding: '0.5rem 1.5rem', color: pathname === '/es/retiros' ? '#d4af37' : '#594a42', textDecoration: 'none', fontWeight: pathname === '/es/retiros' ? 'bold' : 'normal', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  🇦🇷 Español
                </Link>
                <Link href="/en/retreats" style={{ padding: '0.5rem 1.5rem', color: pathname === '/en/retreats' ? '#d4af37' : '#594a42', textDecoration: 'none', fontWeight: pathname === '/en/retreats' ? 'bold' : 'normal', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  🌐 English
                </Link>
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
        <div className="glass-pill actions-pill mobile-menu-toggle flex md:hidden items-center gap-4">
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
          
          <button onClick={toggleMenu} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#3c2a21' }}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div style={{
          background: 'white',
          padding: '1rem 2rem',
          borderTop: '1px solid #eee'
        }}>
          {links.map((link) => (
            <Link key={link.path} href={link.path} onClick={() => setIsOpen(false)} style={{
              display: 'block',
              padding: '0.8rem 0',
              textDecoration: 'none',
              color: pathname === link.path ? '#10ac84' : '#636e72',
              fontWeight: pathname === link.path ? 'bold' : 'normal',
              borderBottom: '1px solid #f1f2f6'
            }}>
              {link.name}
            </Link>
          ))}
          
          <Link href="/retreats" onClick={() => setIsOpen(false)} style={{
            display: 'block',
            padding: '0.8rem 0',
            textDecoration: 'none',
            color: pathname === '/retreats' ? '#10ac84' : '#636e72',
            fontWeight: pathname === '/retreats' ? 'bold' : 'normal',
            borderBottom: '1px solid #f1f2f6'
          }}>
            Retiros
          </Link>

          <Link href="/menu" onClick={() => setIsOpen(false)} style={{
            display: 'block',
            padding: '0.8rem 0',
            textDecoration: 'none',
            color: '#d4af37',
            fontWeight: 'bold',
            borderBottom: '1px solid #f1f2f6'
          }}>
            Menu de Eventos
          </Link>
          
          <div style={{ padding: '0.8rem 0', fontWeight: 'bold', color: '#3c2a21', borderBottom: '1px solid #f1f2f6', marginTop: '1rem' }}>
            PARCEIROS B2B
          </div>
          {b2bLinks.map((link) => (
            <Link key={link.path} href={link.path} onClick={() => setIsOpen(false)} style={{
              display: 'block',
              padding: '0.8rem 0 0.8rem 1.5rem',
              textDecoration: 'none',
              color: pathname === link.path ? '#10ac84' : '#636e72',
              borderBottom: '1px solid #f1f2f6'
            }}>
              {link.name}
            </Link>
          ))}
          
          <div style={{ padding: '0.8rem 0', fontWeight: 'bold', color: '#3c2a21', borderBottom: '1px solid #f1f2f6', marginTop: '1rem' }}>
            IDIOMA (RETIROS)
          </div>
          <Link href="/retreats" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '0.8rem 0', textDecoration: 'none', color: '#636e72', borderBottom: '1px solid #f1f2f6' }}>
            🇧🇷 Português
          </Link>
          <Link href="/es/retiros" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '0.8rem 0', textDecoration: 'none', color: '#636e72', borderBottom: '1px solid #f1f2f6' }}>
            🇦🇷 Español
          </Link>
          <Link href="/en/retreats" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '0.8rem 0', textDecoration: 'none', color: '#636e72', borderBottom: '1px solid #f1f2f6' }}>
            🌐 English
          </Link>
        </div>
      )}
      
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
  );
}
