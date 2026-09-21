import React from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';

export default function AirbnbsPage() {
  return (
    <main style={{ minHeight: '80vh' }}>
      <div className="container" style={{ padding: '6rem 2rem' }}>
        {/* Dynamic Header inserted by fix script */}
        <div className="w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#4a3b32] mb-6">
            Anfitriões do Airbnb
          </h1>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto mb-8"></div>
        </div>
        <div className="liquid-glass-card fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          


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

            <div style={{ marginTop: '3rem' }}>
              <a href="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Airbnb!" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' }}>
                Fale Conosco no WhatsApp
              </a>
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
