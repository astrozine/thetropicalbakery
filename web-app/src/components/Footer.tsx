"use client";

import React from 'react';
import Link from 'next/link';
import { STORE_WHATSAPP, STORE_WHATSAPP_DISPLAY, SUBSTACK_URL } from '@/lib/siteContact';
import { OriginSeal } from '@/components/BelgiumBrazil';

export default function Footer() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer fade-in relative" style={{
      backgroundColor: '#3c2a21',
      overflow: 'hidden',
      color: '#fdfaf3',
      padding: '6rem 2rem 3rem'
    }}>
      {/* The bakery photo, desaturated and tinted cocoa so it gives texture without hurting the links. */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'url(/textures/copacabana-baker.webp)', backgroundSize: 'cover', backgroundPosition: 'center 65%',
        filter: 'grayscale(1) sepia(0.45) contrast(1.1)',
      }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(60,42,33,0.82) 0%, rgba(60,42,33,0.72) 100%)' }} />
      <div className="container" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <img src="/logo.svg" alt="The Tropical Bakery" style={{ height: '60px', marginBottom: '1rem', filter: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(5deg)' }} />
          <p style={{ marginBottom: '1rem', color: '#e8e1d7' }}>Confeitaria saudável de luxo em Ubatuba, pelas mãos da chef belga Elisabeth “Dolly” Van Dam.</p>
          <OriginSeal tone="dark" style={{ marginBottom: '1.75rem' }} />
          <br />
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
            <li><Link href="/assinatura" onClick={handleScrollToTop} style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600 }}>Assinatura Semanal</Link></li>
            <li><Link href="/" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Fazer Pedido</Link></li>
            <li><Link href="/cursos" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Cursos com Dolly</Link></li>
            <li><Link href="/#about" style={{ color: '#e8e1d7', textDecoration: 'none' }}>Nossa História</Link></li>
            <li><Link href="/trabalhe-conosco" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Trabalhe Conosco</Link></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Parcerias</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
            <li><Link href="/b2b/hotels" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Hotéis</Link></li>
            <li><Link href="/b2b/pousadas" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Pousadas</Link></li>
            <li><Link href="/b2b/airbnbs" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Airbnbs</Link></li>
            <li><Link href="/b2b/restaurants" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Restaurantes</Link></li>
            <li><Link href="/b2b/bakeries" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Padarias</Link></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Contato</h3>
          <p style={{ lineHeight: 1.7, color: '#e8e1d7', fontSize: '0.92rem' }}>
            Home bakery em Itamambuca, Ubatuba · SP.<br />
            Quem escolhe <strong>retirada</strong> recebe o endereço na sua conta assim que o pedido é confirmado.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', lineHeight: '2' }}>
            <li><a href={`https://wa.me/${STORE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600 }}>WhatsApp {STORE_WHATSAPP_DISPLAY}</a></li>
            <li><Link href="/minha-conta" onClick={handleScrollToTop} style={{ color: '#e8e1d7', textDecoration: 'none' }}>Minha conta e retiradas</Link></li>
            <li><a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#e8e1d7', textDecoration: 'none' }}>Sunbaked Letters, a newsletter ↗</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', color: '#b2bec3' }}>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          &copy; {new Date().getFullYear()} The Tropical Bakery. All rights reserved.
        </p>
        <p className="footer-legal" style={{ fontSize: '0.8rem' }}>
          <Link href="/privacidade" style={{ color: '#b2bec3', textDecoration: 'underline', display: 'inline-block', padding: '0.7rem 0.25rem' }}>Política de Privacidade</Link>
          {' · '}
          <Link href="/preferencias" style={{ color: '#b2bec3', textDecoration: 'underline', display: 'inline-block', padding: '0.7rem 0.25rem' }}>Preferências de e-mail</Link>
        </p>
      </div>
    </footer>
  );
}
