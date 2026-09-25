import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Each card uses the same photo as that course's own page (or, where that page's photo isn't a
// real one, a real treat from its gallery), so the card previews what you'll find inside.
const coursesData = [
  {
    slug: 'turismo-gastronomico',
    title: 'Turismo Gastronômico',
    description: 'Imersão de 1 dia em Ubatuba.',
    image: '/assets/surfers_retreat_treats_1789884582282.jpg'
  },
  {
    slug: 'capacitacao-profissional',
    title: 'Capacitação Profissional',
    description: 'Para cozinheiros particulares locais.',
    image: '/assets/chef_training_1789884593538.jpg'
  },
  {
    slug: 'saude-bem-estar',
    title: 'Saúde e Bem-Estar',
    description: 'Transição suave para o veganismo.',
    image: '/menu-items/20260620_163438.jpg'
  }
];

export default function OtherCourses({ currentSlug }: { currentSlug: string }) {
  const otherCourses = coursesData.filter(c => c.slug !== currentSlug);

  return (
    <section style={{ padding: '4rem 1.5rem', background: '#fdfaf3' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ 
          fontSize: '2rem', 
          fontFamily: 'var(--font-heading)', 
          color: 'var(--color-primary)', 
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Outros Cursos
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {otherCourses.map(course => (
            <Link 
              key={course.slug} 
              href={`/cursos/${course.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              >
                <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    sizes="(max-width: 700px) 100vw, 450px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                    {course.title}
                  </h4>
                  <p style={{ color: '#594a42', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1 }}>
                    {course.description}
                  </p>
                  <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Ver Curso →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
