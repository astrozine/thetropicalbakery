import React from 'react';
import ZoomableImage from '@/components/ZoomableImage';
import OtherCourses from '@/components/OtherCourses';

export default function SaudeBemEstarPage() {
  const WHATSAPP_NUMBER = "5511932119196";
  const getWhatsAppLink = (courseName: string) => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre o curso: ${courseName}`)}`;
  };

  const BulletItem = ({ children }: { children: React.ReactNode }) => (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1.2rem', lineHeight: '1.7', fontSize: '1.1rem' }}>
      <span style={{ color: '#d4af37', fontSize: '1.4rem', lineHeight: '1.4', flexShrink: 0 }}>✦</span>
      <span>{children}</span>
    </li>
  );

  return (
    <main className="min-h-screen pt-20" style={{ background: 'var(--color-background)' }}>
      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/dolly-course3.jpg), linear-gradient(rgba(60, 42, 33, 0.7), rgba(60, 42, 33, 0.7))',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-primary)'
          }}
        />
        <div className="container relative z-10 text-center fade-in px-4 py-12">
          <span className="text-secondary tracking-[4px] uppercase text-sm md:text-base mb-4 block font-semibold">
            Para Donas de Casa & Foco em Saúde
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-heading)', lineHeight: '1.15' }}>
            Saúde, Sabores e Bem-Estar
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="container pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <p style={{ marginTop: '1.5rem', fontSize: '1.25rem', lineHeight: '1.9', color: '#594a42', marginBottom: '2.5rem' }}>
          Entenda a lógica por trás de cada ingrediente. Este curso é ideal para donas de casa ou pessoas com questões específicas de saúde que buscam uma transição suave e deliciosa para o veganismo e a alimentação curativa.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem', color: 'var(--color-primary)' }}>
          <BulletItem>A ciência da nutrição integral</BulletItem>
          <BulletItem>Receitas curativas e regenerativas</BulletItem>
          <BulletItem>Como criar pratos que a família toda vai amar</BulletItem>
        </ul>
        <div className="text-center" style={{ marginBottom: '4rem' }}>
          <a href={getWhatsAppLink('Curso de Saúde e Bem-Estar')} target="_blank" rel="noopener noreferrer" className="btn btn-primary px-8 py-4 text-lg">
            Começar Minha Jornada
          </a>
        </div>
        
        {/* Images Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {['/menu-items/20260620_163438.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/menu-items/20250907_143728.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>

      {/* Cross Navigation */}
      <OtherCourses currentSlug="saude-bem-estar" />
    </main>
  );
}
