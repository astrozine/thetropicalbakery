'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollReveal from '@/components/ScrollReveal';
import ZoomableImage from '@/components/ZoomableImage';
import CourseAccordionWrapper from '@/components/CourseAccordionWrapper';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setCourses(data);
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

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
            Cursos em Itamambuca
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', maxWidth: '800px', margin: '0 auto 2.5rem', fontSize: '1.25rem', color: '#fdfaf3', lineHeight: '1.9', fontWeight: 300 }}>
            Descubra a lógica por trás dos sabores. Aprenda a criar experiências gastronômicas incríveis que são 100% veganas, sem glúten, sem açúcar refinado e focadas na saúde integral.
          </p>
          <a href="#cursos-list" className="btn btn-secondary shadow-lg">
            Ver Cursos
          </a>
        </div>
      </section>

      {/* Dynamic Courses List */}
      <div id="cursos-list">
        {loading ? (
          <div style={{ padding: '5rem 0', textAlign: 'center', color: '#7f8c8d' }}>Carregando cursos...</div>
        ) : (
          courses.map((course, index) => {
            // Alternate background colors for visual interest
            const isDark = index % 2 !== 0;
            const bgColor = isDark ? '#2e4432' : 'var(--color-background)';
            const textColor = isDark ? 'white' : '#594a42';
            const headingColor = isDark ? 'white' : 'var(--color-primary)';

            return (
              <section key={course.id} className="course-section" style={{ background: bgColor, color: textColor, position: 'relative', overflow: 'hidden' }}>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                  <ScrollReveal>
                    <CourseAccordionWrapper title={course.title} tag={`R$ ${course.price.toFixed(2).replace('.', ',')}`}>
                      <div style={{ display: 'flex', flexWrap: index % 2 === 0 ? 'wrap' : 'wrap-reverse', alignItems: 'center', gap: '4rem' }}>
                        
                        {index % 2 === 0 && (
                          <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                            <div
                              style={{
                                width: '100%',
                                aspectRatio: '4/5',
                                backgroundImage: `url(${course.image_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '1px solid var(--color-secondary)',
                                borderRadius: '8px'
                              }}
                            />
                          </div>
                        )}

                        <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                          <span style={{ display: 'inline-block', padding: '0.25rem 1rem', background: 'rgba(212,175,55,0.2)', color: '#d4af37', border: '1px solid #d4af37', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Presencial em Itamambuca
                          </span>
                          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: headingColor, marginBottom: '1.5rem', lineHeight: '1.15' }}>
                            {course.title}
                          </h2>
                          <p style={{ fontSize: '1.15rem', lineHeight: '1.9', color: textColor, marginBottom: '2rem', whiteSpace: 'pre-line' }}>
                            {course.description}
                          </p>
                          <a href={getWhatsAppLink(course.title)} target="_blank" rel="noopener noreferrer" className={isDark ? "btn btn-secondary" : "btn btn-primary"}>
                            Agendar Minha Experiência
                          </a>
                        </div>

                        {index % 2 !== 0 && (
                          <div style={{ flex: '1 1 380px', minWidth: '280px' }}>
                            <div
                              style={{
                                width: '100%',
                                aspectRatio: '4/5',
                                backgroundImage: `url(${course.image_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '1px solid rgba(212,175,55,0.4)',
                                borderRadius: '8px'
                              }}
                            />
                          </div>
                        )}

                      </div>
                    </CourseAccordionWrapper>
                  </ScrollReveal>
                </div>
              </section>
            );
          })
        )}
      </div>

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
                Fale diretamente conosco. Nossa equipe em Itamambuca está pronta para ajudar a montar a experiência perfeita.
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
