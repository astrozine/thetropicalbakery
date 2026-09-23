import React from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';

export default function AirbnbsPage() {
  return (
    <main style={{ minHeight: '80vh' }}>
      <div className="container" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', zIndex: 10 }}>
            <img
              src="/hero-logo-transparent.png"
              alt="The Tropical Bakery Logo"
              style={{ width: '140px', animation: 'tilt-playful 6s ease-in-out infinite' }}
            />
          </div>

          <div className="liquid-glass-card fade-in" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>

          <div style={{ textAlign: 'center', borderBottom: '2px solid rgba(212,175,55,0.3)', paddingBottom: '1.5rem', width: '100%', marginBottom: '1rem', paddingLeft: '7rem' }}>
            <h1 style={{ fontSize: '3rem', color: '#3c2a21', letterSpacing: '1px', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Parcerias para Airbnbs</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }}>
            <ZoomableImage src="/assets/airbnb_breakfast_tray_1789884624300.jpg" alt="Airbnb" style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }} />
          </div>
          
          <div style={{ flex: '1 1 400px' }}>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#594a42', marginBottom: '2rem' }}>
              Aumente sua avaliação oferecendo um café da manhã artesanal exclusivo que os hóspedes nunca vão esquecer.
              A The Tropical Bakery entrega diretamente na sua propriedade para uma experiência sem esforço.
            </p>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#d4af37' }}>Por Que Nos Escolher?</h3>
            <ul style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#594a42', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li>Surpreenda hóspedes com uma experiência gastronômica única.</li>
              <li>Fornecimento sem logística: entregamos pronto para servir.</li>
              <li>Conteúdo foto-perfeito que valoriza seus reviews.</li>
            </ul>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Airbnb!" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' }}>
                Fale Conosco no WhatsApp
              </a>
              <Link href="/trabalhe-conosco" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' }}>
                Trabalhe Conosco
              </Link>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* Treat Gallery Strip */}
      <section style={{ padding: '3rem 0', background: '#3c2a21' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
          {['/menu-items/Screenshot_20260401_193246_Edits.jpg', '/menu-items/20260209_172647.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg', '/menu-items/20250823_122444.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>
    </main>
  );
}
