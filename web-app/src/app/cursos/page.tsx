'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SunbakedLetters from '@/components/SunbakedLetters';
import CrmRegistrationModal from '@/components/CrmRegistrationModal';
import { optimizedSrc } from '@/lib/thumbs';
import { formatBRL } from '@/lib/deliveryZones';
import { COURSE_CONTENT, MAGIC_TRICKS, PathId, courseBySlug } from '@/lib/courseContent';
import {
  BeachRetreat, CourseCTA, CourseFAQ, CourseHero, CoursePaths, MagicFlavors, RainyDay,
} from '@/components/courses/CourseSections';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
}

const ALL_PATHS: PathId[] = ['saude', 'negocio', 'consciencia', 'equipe'];

const FAQ = [
  { q: 'Qual curso é para mim?', a: 'Está de passagem e quer uma experiência? Turismo Gastronômico. Cozinha profissionalmente ou quer fazer disso uma profissão? Capacitação Profissional. Quer mudar a sua alimentação e a da sua casa? Saúde, Sabores e Bem-Estar. Na dúvida, fale com a gente.' },
  { q: 'Preciso ter experiência na cozinha?', a: 'Não. Cada curso começa pela base, e a Dolly acompanha de perto.' },
  { q: 'Os cursos atendem restrições alimentares?', a: 'Tudo é 100% plant-based, sem glúten e sem açúcar refinado. Alergias sérias (como alergia a castanhas) devem ser avisadas no formulário, para a gente adaptar.' },
  { q: 'Dá para juntar curso e hospedagem?', a: 'Dá: é o formato Curso + Retiro, na casa de retiro em Itamambuca. Veja mais abaixo.' },
  { q: 'E se chover no dia?', a: 'Melhor ainda: a cozinha é coberta, quentinha e cheia de cheiro de cacau. Temos até uma versão pensada para a família inteira.' },
];

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [enquiry, setEnquiry] = useState<{ interest: string; type: 'curso' | 'retiro' } | null>(null);
  const book = (interest: string, type: 'curso' | 'retiro' = 'curso') => setEnquiry({ interest, type });

  useEffect(() => {
    supabase.from('courses').select('*').eq('is_active', true).order('created_at', { ascending: true })
      .then(({ data, error }) => setCourses(!error && data ? data : []));
  }, []);

  // Courses switched on in the admin, told with the richer copy; if the database can't be reached, show the three we know.
  const list = courses === null
    ? []
    : courses.length > 0
      ? courses.map(c => ({ slug: c.slug, title: c.title, image: c.image_url, price: c.price as number | null, fallback: c.description }))
      : COURSE_CONTENT.map(c => ({ slug: c.slug, title: c.title, image: c.heroImage, price: null as number | null, fallback: c.tagline }));

  return (
    <main style={{ background: 'var(--color-background)' }}>
      <CourseHero
        eyebrow="Cursos com a Chef Dolly ✦ Itamambuca"
        title="Aprenda a fazer o doce que faz bem"
        tagline="Sobremesas plant-based que enganam o paladar, uma cozinha tropical a poucos passos do mar, e um conhecimento que pode mudar a sua saúde, a sua casa e até a sua carreira."
        image="/assets/surfers_retreat_treats_1789884582282.jpg"
        floating={['/menu-items/20250914_132214.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/retreats/Beach shot Itamambuca.webp']}
        cta="Ver os cursos"
        onCta={() => document.getElementById('cursos-list')?.scrollIntoView({ behavior: 'smooth' })}
        secondary={{ label: 'Falar com a Dolly', href: '#fale' }}
      />

      {/* Why it's different */}
      <section className="crs-section">
        <div className="crs-wrap" style={{ textAlign: 'center' }}>
          <span className="crs-eyebrow">Mais do que uma aula de confeitaria</span>
          <h2 className="crs-h2">Você aprende a mágica, não só a receita</h2>
          <p className="crs-lead" style={{ margin: '0 auto 2.5rem' }}>
            A Dolly veio da Bélgica, a terra do chocolate, para a Mata Atlântica. Ela criou um jeito próprio de fazer
            doces 100% plant-based, sem glúten e sem açúcar refinado que ninguém consegue acreditar que são saudáveis.
            Nos cursos, você aprende o porquê de cada ingrediente, para criar as suas próprias receitas pelo resto da vida.
          </p>
          <div className="crs-rain-points" style={{ maxWidth: '860px' }}>
            {['🌱 100% plant-based', '🌾 Sem glúten', '🍯 Sem açúcar refinado', '🧂 Sem sal e sem óleo', '🌴 Frutas da Mata Atlântica', '👩‍🍳 Mão na massa'].map(t => (
              <span key={t} style={{ background: '#fff', color: '#3c2a21', border: '1px solid #eadfcb' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <MagicFlavors
        intro="É isso que os alunos levam para casa: o poder de satisfazer qualquer vontade de doce com comida de verdade."
        tricks={Object.values(MAGIC_TRICKS)}
      />

      {/* The courses */}
      <section id="cursos-list" className="crs-section crs-section-soft">
        <div className="crs-wrap">
          <span className="crs-eyebrow">Escolha a sua porta de entrada</span>
          <h2 className="crs-h2">Os cursos</h2>
          {courses === null ? (
            <p style={{ color: '#7a6a61' }}>Carregando cursos…</p>
          ) : (
            <div className="crs-courses">
              {list.map(item => {
                const rich = courseBySlug(item.slug);
                return (
                  <article key={item.slug} className="crs-course">
                    <div className="crs-course-img" style={{ backgroundImage: `url("${optimizedSrc(rich?.heroImage ?? item.image, 750)}")` }}>
                      {item.price ? <span className="crs-course-price">{formatBRL(item.price)}</span> : null}
                    </div>
                    <div className="crs-course-body">
                      {rich && <span className="crs-course-eyebrow">{rich.eyebrow}</span>}
                      <h3>{item.title}</h3>
                      <p>{rich?.tagline ?? item.fallback}</p>
                      {rich && (
                        <div className="crs-course-tags">
                          {rich.magic.slice(0, 3).map(t => <span key={t.craving}>{t.emoji} {t.craving}</span>)}
                        </div>
                      )}
                      <div className="crs-course-actions">
                        {rich && <Link href={`/cursos/${item.slug}`} className="crs-btn crs-btn-outline">Conhecer o curso</Link>}
                        <button type="button" className="crs-btn crs-btn-gold" onClick={() => book(rich?.enquiry ?? item.title)}>Agendar</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <CoursePaths ids={ALL_PATHS} title="Onde um curso com a Dolly pode te levar" />

      <BeachRetreat
        text="Qualquer curso pode virar férias: hospedagem na casa de retiro em Itamambuca, cozinha de manhã, e o resto do dia para o mar, a cachoeira, as trilhas e o pôr do sol. Aprender descansado é aprender melhor."
        interest="Curso com hospedagem"
        onEnquire={book}
      />

      <RainyDay
        text="Chuva na praia não precisa ser dia perdido. Traga a família para a cozinha: crianças, pais e avós fazendo doces juntos, rindo, sujando as mãos de cacau e levando para casa o que prepararam. Sem açúcar refinado, então todo mundo pode repetir."
        onEnquire={book}
      />

      <CourseFAQ items={FAQ} />

      <div id="fale">
        <CourseCTA
          title="Ainda em dúvida?"
          text="Conte o que você procura: saúde, profissão, férias diferentes ou um programa para a família. A Dolly responde e ajuda a escolher."
          cta="Falar com a Dolly"
          onCta={() => book('Consultoria Personalizada')}
        />
      </div>

      <section style={{ padding: '4rem 1.5rem' }}>
        <SunbakedLetters />
      </section>

      <CrmRegistrationModal
        isOpen={!!enquiry}
        onClose={() => setEnquiry(null)}
        interestType={enquiry?.type ?? 'curso'}
        specificInterest={enquiry?.interest ?? 'Cursos'}
      />
    </main>
  );
}
