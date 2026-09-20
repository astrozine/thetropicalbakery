import React from 'react';
import OtherCourses from '@/components/OtherCourses';

export default function CapacitacaoProfissionalPage() {
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
            backgroundImage: 'url(/assets/chef_training_1789884593538.jpg), linear-gradient(rgba(46, 68, 50, 0.8), rgba(46, 68, 50, 0.8))',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-accent)'
          }}
        />
        <div className="container relative z-10 text-center fade-in px-4 py-12">
          <span className="text-secondary tracking-[4px] uppercase text-sm md:text-base mb-4 block font-semibold">
            Para Cozinheiros Particulares
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-heading)', lineHeight: '1.15' }}>
            Capacitação Profissional
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="container pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <p style={{ marginTop: '1.5rem', fontSize: '1.25rem', lineHeight: '1.9', color: '#594a42', marginBottom: '2.5rem' }}>
          Cursos contínuos e semanais focados em treinar cozinheiros particulares locais (patrocinados por seus empregadores) para elevarem o nível da alimentação no dia a dia.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem', color: 'var(--color-primary)' }}>
          <BulletItem>Técnicas avançadas de culinária funcional</BulletItem>
          <BulletItem>Planejamento de cardápios semanais SOS-Free</BulletItem>
          <BulletItem>Substituições inteligentes e saborosas</BulletItem>
        </ul>
        <div className="text-center mb-24">
          <a href={getWhatsAppLink('Capacitação Profissional para Cozinheiros')} target="_blank" rel="noopener noreferrer" className="btn btn-primary px-8 py-4 text-lg">
            Matricular Funcionário
          </a>
        </div>
      </section>

      {/* Cross Navigation */}
      <OtherCourses currentSlug="capacitacao-profissional" />
    </main>
  );
}
