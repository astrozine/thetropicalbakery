"use client";

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer fade-in relative" style={{
      backgroundImage: 'linear-gradient(rgba(60, 42, 33, 0.9), rgba(60, 42, 33, 0.9)), url(/iphone_cacao_pod.jpg)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#fdfaf3',
      padding: '6rem 2rem 3rem'
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <img src="/logo.svg" alt="The Tropical Bakery" style={{ height: '60px', marginBottom: '1rem', filter: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(5deg)' }} />
          <p style={{ marginBottom: '2rem', color: '#e8e1d7' }}>A melhor experiência de confeitaria saudável em Ubatuba.</p>
          <a href="https://www.instagram.com/_thetropicalbakery_/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{
            display: 'inline-block',
            padding: '0.8rem 1.5rem',
            background: '#d4af37',
            color: '#3c2a21',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            Siga-nos no Instagram
          </a>
        </div>
        
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Menu</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
            <li><Link href="/" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Fazer Pedido</Link></li>
            <li><Link href="/cursos" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Cursos com Dolly</Link></li>
            <li><Link href="/#about" style={{ color: '#e8e1d7', textDecoration: 'none' }}>Nossa História</Link></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Seja um Parceiro</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
            <li><Link href="/b2b/hotels" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Hotéis</Link></li>
            <li><Link href="/b2b/pousadas" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Pousadas</Link></li>
            <li><Link href="/b2b/airbnbs" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Airbnbs</Link></li>
            <li><Link href="/b2b/restaurants" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Restaurantes</Link></li>
            <li><Link href="/b2b/bakeries" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Padarias</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container" style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', color: '#b2bec3' }}>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          &copy; {new Date().getFullYear()} The Tropical Bakery. All rights reserved.
        </p>
        <p style={{ fontSize: '0.8rem' }}>
          <Link href="/privacidade" style={{ color: '#b2bec3', textDecoration: 'underline' }}>Política de Privacidade</Link>
        </p>
      </div>
    </footer>
  );
}
