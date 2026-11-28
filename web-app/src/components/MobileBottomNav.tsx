'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ClubeModal, PersonIcon } from '@/components/ClubeInvite';
import { usePageLang } from '@/lib/usePageLang';
import { shellHref, shellText } from '@/lib/shellCopy';

export default function MobileBottomNav() {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const lang = usePageLang();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [clubeOpen, setClubeOpen] = useState(false);
  const closeClube = useCallback(() => setClubeOpen(false), []);

  // The bar tucks away while the page is moving and slides back once scrolling stops.
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      // Ignore sub-pixel jitter and layout shifts that don't come from a finger.
      if (Math.abs(y - lastY) < 3) return;
      lastY = y;
      setScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, []);

  if (!isMobile) return null;

  const navItems = ([
    // What people pay for, in the order of the top menu (Andrew, 2026-11-27); the logo up top is the way home.
    { name: 'Receitas', path: '/diario', icon: '🍰' },
    { name: 'Cursos', path: '/cursos', icon: '🎓' },
    { name: 'Coaching', path: '/coaching', icon: '🌱' },
    { name: 'Retiro', path: '/retreats', icon: '🌴' },
  ]).map(i => ({ ...i, name: shellText(i.name, lang), path: shellHref(i.path, lang) }));

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: 'rgba(253,250,243,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -10px 40px rgba(42,26,18,0.1)',
      borderTop: '1px solid rgba(212, 175, 55, 0.2)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0.75rem 0.5rem',
      paddingBottom: 'env(safe-area-inset-bottom, 1rem)',
      zIndex: 1000,
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      transform: scrolling ? 'translateY(110%)' : 'translateY(0)',
      transition: 'transform 0.25s ease-out',
      pointerEvents: scrolling ? 'none' : 'auto'
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link href={item.path} key={item.path} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? '#c9a257' : '#887d77',
            gap: '4px',
            position: 'relative',
            width: '20%'
          }}>
            <span style={{ 
              fontSize: '1.5rem',
              filter: isActive ? 'drop-shadow(0 2px 4px rgba(212,175,55,0.4))' : 'none',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease-out'
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: isActive ? 600 : 400,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Signed out: the Clube Tropical invitation. Signed in: their account. */}
      {user ? (
        <Link href="/minha-conta" style={{ ...tabStyle, color: pathname === '/minha-conta' ? '#c9a257' : '#887d77' }}>
          <span style={{ height: '1.5rem', display: 'flex', alignItems: 'center' }}><PersonIcon size={24} /></span>
          <span style={tabLabel}>{shellText('Conta', lang)}</span>
        </Link>
      ) : (
        <button type="button" onClick={() => setClubeOpen(true)} style={{ ...tabStyle, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#2a1a12' }}>
          <span style={{ height: '1.5rem', display: 'flex', alignItems: 'center' }}><PersonIcon size={24} /></span>
          <span style={{ ...tabLabel, fontWeight: 700 }}>{shellText('Entrar', lang)}</span>
        </button>
      )}
      <ClubeModal open={clubeOpen} onClose={closeClube} />
    </div>
  );
}

const tabStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', gap: '4px', position: 'relative', width: '20%',
};
const tabLabel: React.CSSProperties = { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
