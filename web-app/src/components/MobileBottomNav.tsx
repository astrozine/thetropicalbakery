'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

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

  const navItems = [
    { name: 'Início', path: '/', icon: '🏠' },
    { name: 'Cardápio', path: '/menu', icon: '🍰' },
    { name: 'Cursos', path: '/cursos', icon: '🎓' },
    { name: 'Retiros', path: '/retreats', icon: '🌴' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: 'rgba(253,250,243,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -10px 40px rgba(60,42,33,0.1)',
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
            color: isActive ? '#d4af37' : '#887d77',
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

    </div>
  );
}
