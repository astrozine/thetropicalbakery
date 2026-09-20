import React from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import ZoomableImage from '@/components/ZoomableImage';
import CourseAccordionWrapper from '@/components/CourseAccordionWrapper';

export default function CursosPage() {
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
    <main className="min-h-screen">
      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/dolly-hero.jpg), linear-gradient(rgba(60, 42, 33, 0.7), rgba(60, 42, 33, 0.7))',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-primary)'
          }}
        />

        <div className="container relative z-10 text-center fade-in px-4">
          <span className="text-secondary tracking-[4px] uppercase text-sm md:text-base mb-4 block font-semibold">
            Aprenda com a Especialista
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-heading)', lineHeight: '1.15' }}>
            Cursos com Elisabeth Van Dam
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', maxWidth: '800px', margin: '0 auto 2.5rem', fontSize: '1.25rem', color: '#fdfaf3', lineHeight: '1.9', fontWeight: 300 }}>
            Descubra a lógica por trás dos sabores. Aprenda a criar experiências gastronômicas incríveis que são 100% veganas, sem glúten e focadas na saúde integral.
          </p>
          <a href="#turismo" className="btn btn-secondary shadow-lg">
            Ver Cursos
          </a>
        </div>
      </section>

      {/* Course 1: Turismo Gastronômico */}
      <section id="turismo" className="course-section" style={{ background: 'var(--color-background)', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <CourseAccordionWrapper title="Turismo Gastronômico" tag="Para Iniciantes & Entusiastas">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
                <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    backgroundImage: 'url(/assets/surfers_retreat_treats_1789884582282.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--color-secondary)'
                  }}
                />
              </div>
              <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <span className="tag" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>Para Iniciantes &amp; Entusiastas</span>
                <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1.5rem', lineHeight: '1.15' }}>
                  Turismo Gastronômico
                </h2>
                <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#594a42', marginBottom: '2rem' }}>
                  Uma experiência imersiva de 1 dia na The Tropical Bakery. Aprenda os segredos da confeitaria vegana tropical em um ambiente prático e descontraído, perfeito para quem está de férias em Ubatuba.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', color: 'var(--color-primary)' }}>
                  <BulletItem>Imersão rápida e prática</BulletItem>
                  <BulletItem>Degustação exclusiva incluída</BulletItem>
                  <BulletItem>Leve para casa as receitas criadas</BulletItem>
                </ul>
                <a href={getWhatsAppLink('Turismo Gastronômico (1 Dia)')} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Agendar Minha Experiência
                </a>
              </div>
                <div className="mobile-only mt-8" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0' }}>
                  {['/menu-items/Screenshot_20260412_123155_Edits.jpg', '/menu-items/20260724_154636.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/Screenshot_20260810_135948_Photos.jpg'].map((src, i) => (
                    <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ minWidth: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
                  ))}
                </div>
              </div>
            </div>
            </CourseAccordionWrapper>
          </ScrollReveal>
        </div>
      </section>

      {/* Treat Highlight Strip 1 (Desktop) */}
      <section className="desktop-only" style={{ padding: '3rem 0', background: '#3c2a21', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
          {['/menu-items/Screenshot_20260412_123155_Edits.jpg', '/menu-items/20260724_154636.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/Screenshot_20260810_135948_Photos.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>

      {/* Course 2: Capacitação Profissional */}
      <section className="course-section" style={{ color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundImage: 'url(/dolly-course2.jpg), linear-gradient(rgba(46, 68, 50, 0.9), rgba(46, 68, 50, 0.9))',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-accent)'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <CourseAccordionWrapper title="Capacitação Profissional" tag="Para Cozinheiros Particulares">
              <div style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: '4rem' }}>
                <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <span style={{ display: 'inline-block', padding: '0.25rem 1rem', background: 'rgba(212,175,55,0.2)', color: '#d4af37', border: '1px solid #d4af37', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Para Cozinheiros Particulares
                </span>
                <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'white', marginBottom: '1.5rem', lineHeight: '1.15' }}>
                  Capacitação Profissional
                </h2>
                <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#e8e1d7', marginBottom: '2rem' }}>
                  Cursos contínuos e semanais focados em treinar cozinheiros particulares locais (patrocinados por seus empregadores) para elevarem o nível da alimentação no dia a dia.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', color: 'white' }}>
                  <BulletItem>Técnicas avançadas de culinária funcional</BulletItem>
                  <BulletItem>Planejamento de cardápios semanais SOS-Free</BulletItem>
                  <BulletItem>Substituições inteligentes e saborosas</BulletItem>
                </ul>
                <a href={getWhatsAppLink('Capacitação Profissional para Cozinheiros')} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Matricular Funcionário
                </a>
              </div>
              <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    backgroundImage: 'url(/assets/chef_training_1789884593538.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(212,175,55,0.4)'
                  }}
                />
              </div>
            </div>
            </CourseAccordionWrapper>
          </ScrollReveal>
        </div>
      </section>

      {/* Course 3: Saúde e Bem-Estar */}
      <section className="course-section" style={{ background: 'var(--color-background)', overflow: 'hidden' }}>
        <div className="container">
          <ScrollReveal>
            <CourseAccordionWrapper title="Saúde, Sabores e Bem-Estar" tag="Para Donas de Casa & Foco em Saúde">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
                <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    backgroundImage: 'url(/dolly-course3.jpg), linear-gradient(135deg, #d4af37 0%, #fdfaf3 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--color-secondary)'
                  }}
                />
              </div>
              <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                <span className="tag" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>Para Donas de Casa &amp; Foco em Saúde</span>
                <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1.5rem', lineHeight: '1.15' }}>
                  Saúde, Sabores e Bem-Estar
                </h2>
                <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: '#594a42', marginBottom: '2rem' }}>
                  Entenda a lógica por trás de cada ingrediente. Este curso é ideal para donas de casa ou pessoas com questões específicas de saúde que buscam uma transição suave e deliciosa para o veganismo e a alimentação curativa.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', color: 'var(--color-primary)' }}>
                  <BulletItem>A ciência da nutrição integral</BulletItem>
                  <BulletItem>Receitas curativas e regenerativas</BulletItem>
                  <BulletItem>Como criar pratos que a família toda vai amar</BulletItem>
                </ul>
                <a href={getWhatsAppLink('Curso de Saúde e Bem-Estar')} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Começar Minha Jornada
                </a>
              </div>
                <div className="mobile-only mt-8" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0' }}>
                  {['/menu-items/20260620_163438.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/menu-items/20250907_143728.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg'].map((src, i) => (
                    <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ minWidth: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
                  ))}
                </div>
              </div>
            </div>
            </CourseAccordionWrapper>
          </ScrollReveal>
        </div>
      </section>

      {/* Treat Highlight Strip 2 (Desktop) */}
      <section className="desktop-only" style={{ padding: '3rem 0', background: '#2e4432', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem' }}>
          {['/menu-items/20260620_163438.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/menu-items/20250907_143728.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg'].map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'repeating-linear-gradient(-45deg, #fdfaf3, #fdfaf3 10px, #ebd9b4 10px, #ebd9b4 14px, #c9a67a 14px, #c9a67a 16px)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{
              background: 'var(--color-background)',
              border: '1px solid var(--color-secondary)',
              padding: 'clamp(2rem, 6vw, 4rem) clamp(1.5rem, 6vw, 4rem)',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: 'clamp(1.6rem, 5vw, 3rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1.5rem', lineHeight: '1.2' }}>
                Tem dúvidas sobre qual curso é ideal para você?
              </h2>
              <p style={{ fontSize: 'clamp(1rem, 3vw, 1.15rem)', color: 'var(--color-text)', lineHeight: '1.9', marginBottom: '2.5rem' }}>
                Fale diretamente conosco. Nossa equipe está pronta para ajudar a montar a experiência perfeita.
              </p>
              <a
                href={getWhatsAppLink('Dúvida sobre os cursos')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap', display: 'inline-flex' }}
              >
                Falar com a Equipe
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
