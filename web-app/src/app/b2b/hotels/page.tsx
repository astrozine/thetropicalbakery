import React from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';

export default function HotelsPage() {
  return (
    <main style={{ minHeight: '80vh' }}>
      <div className="container" style={{ padding: '6rem 2rem' }}>
        <div className="liquid-glass-card fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem', display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }}>
            <ZoomableImage src="/assets/realistic_hotel.jpg" alt="Hotel" style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }} />
          </div>
          
          <div style={{ flex: '1 1 400px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#3c2a21', fontFamily: 'var(--font-heading)' }}>Seja um Parceiro: Hotéis</h1>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#594a42', marginBottom: '2rem' }}>
              Eleve a experiência dos seus hóspedes com uma oferta de café da manhã de luxo. A The Tropical Bakery
              oferece pedidos em grande escala das nossas criações Veganas e Sem Glúten para os mais finos hotéis de Ubatuba.
            </p>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#d4af37' }}>Por Que Nos Escolher?</h3>
            <ul style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#594a42', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li>Atenda com facilidade às crescentes demandas por dietas especiais.</li>
              <li>Fornecimento premium, vibrante e confiável.</li>
              <li>Destaque-se com delícias artesanais exclusivas no seu buffet ou serviço de quarto.</li>
            </ul>

            <div style={{ marginTop: '3rem' }}>
              <a href="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20para%20Hotel!" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' }}>
                Fale Conosco no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Treat Gallery Strip */}
      <section style={{ padding: '3rem 0', background: '#3c2a21' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
          {['/menu-items/20260724_154636.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/20251201_133121.jpg', '/menu-items/Screenshot_20260810_135948_Photos.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>
    </main>
  );
}
