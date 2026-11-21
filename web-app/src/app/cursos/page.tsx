'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SunbakedLetters from '@/components/SunbakedLetters';
import CrmRegistrationModal from '@/components/CrmRegistrationModal';
import { optimizedSrc } from '@/lib/thumbs';
import { COURSE_CONTENT, MAGIC_TRICKS, PRICE_FAQ, PathId, courseBySlug } from '@/lib/courseContent';
import { WORKSHOP_PRICE_SHORT, WORKSHOP_START, WORKSHOP_WHEN_LONG } from '@/lib/workshopDates';
import {
  CompactCTA, CompactHero, CompactMagic, FaqFolds, PathsFold, PriceCard, PromiseStrip, RainFold, RetreatFold,
} from '@/components/courses/CourseCompact';

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
  { q: 'Que dia e a que horas são as aulas?', a: `${WORKSHOP_WHEN_LONG} Você escolhe a data no formulário e a gente confirma.` },
  { q: 'Qual curso é para mim?', a: 'Está de passagem e quer uma experiência? Turismo Gastronômico. Cozinha profissionalmente ou quer fazer disso uma profissão? Capacitação Profissional. Quer mudar a sua alimentação e a da sua casa? Saúde, Sabores e Bem-Estar. Na dúvida, fale com a gente.' },
  { q: 'Preciso ter experiência na cozinha?', a: 'Não. Cada curso começa pela base, e a Dolly acompanha de perto.' },
  { q: 'Os cursos atendem restrições alimentares?', a: 'Tudo é 100% plant-based e sem trigo, adoçado com tâmaras, frutas, açúcar de coco ou rapadura. Se alguma receita usar chocolate vegano industrializado (que vem com açúcar cristal), a gente avisa. Alergias sérias (como alergia a castanhas) devem ser avisadas no formulário, para a gente adaptar.' },
  { q: 'Dá para juntar curso e hospedagem?', a: 'Dá: é o formato Curso + Retiro, na casa de retiro em Itamambuca. Veja mais abaixo.' },
  { q: 'E se chover no dia?', a: 'Melhor ainda: a cozinha é coberta, quentinha e cheia de cheiro de cacau. Temos até uma versão pensada para a família inteira.' },
];

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [dbDown, setDbDown] = useState(false);
  const [enquiry, setEnquiry] = useState<{ interest: string; type: 'curso' | 'retiro' } | null>(null);
  const book = (interest: string, type: 'curso' | 'retiro' = 'curso') => setEnquiry({ interest, type });

  useEffect(() => {
    supabase.from('courses').select('*').eq('is_active', true).order('created_at', { ascending: true })
      .then(({ data, error }) => { setCourses(!error && data ? data : []); setDbDown(!!error || !data); });
  }, []);

  // Courses switched on in the admin, told with the richer copy; if the database can't be reached, show the three we know.
  // An empty list is NOT a reason to fall back: it means Dolly has hidden every course while she works on them.
  const list = courses === null
    ? []
    : !dbDown
      ? courses.map(c => ({ slug: c.slug, title: c.title, image: c.image_url, price: c.price as number | null, fallback: c.description }))
      : COURSE_CONTENT.map(c => ({ slug: c.slug, title: c.title, image: c.heroImage, price: null as number | null, fallback: c.tagline }));

  return (
    <main className="cx-page">
      <CompactHero
        eyebrow="Cursos com a Chef Dolly"
        title="Aprenda a fazer o doce que faz bem"
        tagline="Uma tarde na cozinha tropical da Dolly, a poucos passos do mar. Você põe a mão na massa e leva as receitas."
        image="/assets/surfers_retreat_treats_1789884582282.jpg"
        floating={['/menu-items/20250914_132214.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg']}
        cta="Agendar minha aula"
        onCta={() => book('Cursos')}
        secondary={{ label: 'Ver os cursos ↓', href: '#cursos-list' }}
      />

      <PromiseStrip items={['🌱 100% plant-based', '🌾 Sem trigo', '🍯 Adoçado com frutas', '🧂 Sem sal e sem óleo', '👩‍🍳 Mão na massa', '🇧🇪 Técnica belga, frutas do Brasil']} />

      {/* The courses */}
      <section id="cursos-list" className="cx-sec">
        <div className="cx-wrap">
          <span className="cx-eyebrow">Escolha o seu</span>
          <h2 className="cx-h2">Os cursos</h2>
          {courses === null ? (
            <p className="cx-p">Carregando cursos…</p>
          ) : list.length === 0 ? (
            <p className="cx-p">Novas turmas em preparo. Fale com a gente para saber das próximas datas.</p>
          ) : (
            <div className="cx-courses">
              {list.map(item => {
                const rich = courseBySlug(item.slug);
                return (
                  <article key={item.slug} className="cx-course">
                    <div className="cx-course-img" style={{ backgroundImage: `url("${optimizedSrc(rich?.heroImage ?? item.image, 750)}")` }} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{rich?.short ?? item.fallback}</p>
                      <span className="cx-course-price">{WORKSHOP_PRICE_SHORT}</span>
                    </div>
                    <div className="cx-course-actions">
                      <button type="button" className="cx-btn cx-btn-gold cx-btn-sm" onClick={() => book(rich?.enquiry ?? item.title)}>Agendar</button>
                      {rich
                        ? <Link href={`/cursos/${item.slug}`} className="cx-btn cx-btn-line cx-btn-sm">Ver detalhes</Link>
                        : <span />}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <PriceCard />
        </div>
      </section>

      <CompactMagic
        tricks={Object.values(MAGIC_TRICKS)}
        text="A boca sente caramelo, crocância e creme. O corpo recebe fruta, castanha e especiaria. É isso que você aprende a fazer."
      />

      <section className="cx-sec">
        <div className="cx-wrap">
          <h2 className="cx-h2">Bom saber</h2>
          <div className="cx-acc">
            <RetreatFold
              text={`Qualquer curso pode virar férias: hospedagem na casa de retiro em Itamambuca, a manhã livre para o mar, a cachoeira e as trilhas, e a cozinha a partir das ${WORKSHOP_START}.`}
              interest="Curso com hospedagem"
              onEnquire={book}
            />
            <RainFold
              text="Chuva na praia não precisa ser dia perdido. Traga a família para a cozinha: crianças, pais e avós fazendo doces juntos e levando para casa o que prepararam. Adoçado com frutas, então todo mundo pode repetir."
              onEnquire={book}
            />
            <PathsFold ids={ALL_PATHS} />
            <FaqFolds items={[FAQ[0], PRICE_FAQ, ...FAQ.slice(1)]} />
          </div>
        </div>
      </section>

      <div id="fale">
        <CompactCTA
          title="Ainda em dúvida?"
          text="Conte o que você procura. A Dolly responde e ajuda a escolher."
          cta="Falar com a Dolly"
          onCta={() => book('Consultoria Personalizada')}
        />
      </div>

      <section className="cx-news">
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
