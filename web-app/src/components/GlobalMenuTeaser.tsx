'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import menuItems from '@/data/menu.json';
import { thumb } from '@/lib/thumbs';

export default function GlobalMenuTeaser() {
  const pathname = usePathname() || '';
  const isSpanish = pathname.startsWith('/es');

  // Take the first 10 items for the teaser
  const teaserItems = menuItems.slice(0, 10);

  const texts = {
    subtitle: isSpanish ? "Descubre Nuestras Creaciones" : "Descubra Nossas Criações",
    title: isSpanish ? "Para Eventos y Momentos Especiales" : "Para Eventos e Momentos Especiais",
    description: isSpanish 
      ? "Mira lo que ya hemos servido en nuestras Cajas Sorpresa y planea tu próximo evento." 
      : "Veja o que já servimos em nossas Caixas Surpresa e planeje seu próximo evento.",
    btn: isSpanish ? "Ver Menú Completo" : "Ver Menu Completo",
  };

  return (
    <section style={{ 
      padding: '4rem 0', 
      background: 'var(--color-background)',
      borderTop: '1px solid rgba(212,175,55,0.2)',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      <span style={{ color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '1rem' }}>
        {texts.subtitle}
      </span>
      <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
        {texts.title}
      </h2>
      <p style={{ fontSize: '1.1rem', color: '#594a42', marginBottom: '3rem', padding: '0 1rem' }}>
        {texts.description}
      </p>

      {/* Scrolling Gallery */}
      <div style={{
        display: 'flex',
        width: 'max-content',
        animation: 'scrollGallery 40s linear infinite',
      }}>
        {/* Double the array for seamless infinite scrolling */}
        {[...teaserItems, ...teaserItems].map((item, idx) => (
          <Link href={isSpanish ? "/es/menu" : "/menu"} key={idx} style={{ 
            width: 'clamp(200px, 20vw, 280px)', 
            height: 'clamp(200px, 20vw, 280px)', 
            margin: '0 1rem',
            flexShrink: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            display: 'block'
          }}>
            <img 
              src={thumb(item.image)} 
              alt={item.name} 
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </Link>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollGallery {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      <div style={{ marginTop: '3rem' }}>
        <Link href="/menu" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
          {texts.btn}
        </Link>
      </div>
    </section>
  );
}
