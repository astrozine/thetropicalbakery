import React from 'react';
import Image from 'next/image';
import ZoomableImage from '@/components/ZoomableImage';

export default function AffiliatesPage() {
  return (
    <main className="container" style={{ padding: '4rem 2rem', minHeight: '80vh' }}>
      
      <div className="text-center fade-in" style={{ marginBottom: '4rem' }}>
        <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem', color: '#3c2a21', fontFamily: 'var(--font-heading)' }}>
          Organizadores e Travel Managers
        </h1>
        <p style={{ fontSize: '1.3rem', maxWidth: '800px', margin: '0 auto', color: '#594a42' }}>
          Você tem um grupo interessado em saúde, yoga e natureza? Organize um retiro na <strong>Salt n' Paradise</strong> com The Tropical Bakery e ganhe excelentes comissões.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
        
        <div style={{ flex: '1 1 400px', position: 'relative' }} className="fade-in">
          <div style={{ position: 'absolute', top: '-25px', left: '-25px', zIndex: 10 }}>
            <img
              src="/hero-logo-transparent.png"
              alt="The Tropical Bakery Logo"
              style={{ width: '140px', animation: 'tilt-playful 6s ease-in-out infinite' }}
            />
          </div>
          <div className="liquid-glass-card" style={{ padding: '3rem', position: 'relative' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#3c2a21', fontFamily: 'var(--font-heading)', paddingLeft: '3rem' }}>Como Funciona a Parceria?</h2>
            
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#594a42', lineHeight: '1.8' }}>
              Se você é instrutora de yoga, guia turística, ou simplesmente a pessoa que organiza as viagens do seu grupo (especialmente da Argentina!), temos uma oportunidade incrível.
            </p>

            <ul style={{ paddingLeft: '1.5rem', color: '#594a42', lineHeight: '1.8', marginBottom: '2rem' }}>
              <li><strong>Reserve a casa inteira:</strong> Salt n' Paradise possui 3 suítes que acomodam confortavelmente até 11 pessoas.</li>
              <li><strong>Pacotes Completos:</strong> Workshops de confeitaria saudável, yoga na praia, e alimentação completa inclusa.</li>
              <li><strong>Comissionamento:</strong> Receba uma porcentagem atrativa sobre o valor total do grupo que você organizar.</li>
              <li><strong>Fácil de Vender:</strong> Uma experiência transformadora em Itamambuca (Ubatuba), muito procurada por grupos.</li>
            </ul>

            <a 
              href="https://wa.me/5511932119196?text=Ol%C3%A1%21%20Tenho%20interesse%20em%20organizar%20um%20grupo%20para%20os%20Retiros%20da%20Tropical%20Bakery." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '1.1rem', letterSpacing: '1px' }}
            >
              Falar com o Comercial
            </a>
          </div>
        </div>

        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
          <ZoomableImage src="/retreats/Room with open ripada door.jpg" alt="Acomodações" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 30px rgba(60,42,33,0.15)' }} />
          <ZoomableImage src="/retreats/Beach shot Itamambuca.webp" alt="Itamambuca Beach" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 30px rgba(60,42,33,0.15)' }} />
        </div>

      </div>

      {/* Treat Gallery Strip */}
      <section style={{ padding: '3rem 0', background: '#3c2a21', marginTop: '4rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
          {['/menu-items/Screenshot_20260810_135948_Photos.jpg', '/menu-items/20260620_163438.jpg', '/menu-items/1000231026_3b42196b4ea44c55b3834d9f1bf36302-2_17_2026, 8_48_32 AM.png', '/menu-items/Screenshot_20260708_144013_Gallery.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>
    </main>
  );
}
