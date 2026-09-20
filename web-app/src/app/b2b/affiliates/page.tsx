import React from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';

export default function AffiliatesPage() {
  return (
    <main style={{ minHeight: '80vh' }}>
      <div className="container" style={{ padding: '6rem 2rem' }}>
        <div className="liquid-glass-card fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem', display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }}>
            <ZoomableImage src="/assets/iphone_passion_fruit_1789717184997.jpg" alt="Influencer Treat" style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }} />
          </div>
          
          <div style={{ flex: '1 1 400px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#3c2a21', fontFamily: 'var(--font-heading)' }}>Programa de Afiliados</h1>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#594a42', marginBottom: '2rem' }}>
              Você é um influenciador digital, criador de conteúdo ou amante da vida saudável? Junte-se ao nosso programa de afiliados e comece a lucrar compartilhando o estilo de vida da The Tropical Bakery!
            </p>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#d4af37' }}>Como Funciona?</h3>
            <ul style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#594a42', marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Ganhe uma Comissão:</strong> Receba uma porcentagem de cada venda realizada através do seu código exclusivo.</li>
              <li><strong>Descontos para Seguidores:</strong> Seu código oferece descontos especiais para seus seguidores e amigos.</li>
              <li><strong>Acesso VIP:</strong> Seja o primeiro a experimentar nossos novos sabores e lançamentos sazonais.</li>
            </ul>

            <div style={{ marginTop: '3rem' }}>
              <a href="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20quero%20ser%20um%20Afiliado%20da%20The%20Tropical%20Bakery!" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' }}>
                Quero Ser Afiliado
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Treat Gallery Strip */}
      <section style={{ padding: '3rem 0', background: '#3c2a21' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
          {['/assets/iphone_nano_banana_1789717175208.jpg', '/assets/iphone_cacao_pod_1789717194655.jpg', '/assets/iphone_hotel_1789718118077.jpg', '/assets/iphone_pousada_1789718128863.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>
    </main>
  );
}
