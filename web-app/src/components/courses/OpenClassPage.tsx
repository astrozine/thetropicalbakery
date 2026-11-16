'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { optimizedSrc } from '@/lib/thumbs';
import { courseBySlug } from '@/lib/courseContent';
import { trackMeta } from '@/lib/metaPixel';
import { STORE_WHATSAPP } from '@/lib/siteContact';
import { OPEN_CLASS, WORKSHOP_HOURS, WORKSHOP_PRICE_SHORT, WORKSHOP_START } from '@/lib/workshopDates';
import './courseCompact.css';

/**
 * /aula: one page for one dated, open class (OPEN_CLASS in workshopDates.ts), made to land ad clicks on.
 * Andrew, 2026-11-16: the Nov 18 class had no page of its own. Booking goes straight to WhatsApp, so Dolly sees it
 * the moment someone taps (the site's booking form only lands in Admin, with no alert).
 */
const course = courseBySlug('turismo-gastronomico');
const endHour = `${parseInt(WORKSHOP_START, 10) + WORKSHOP_HOURS}h`;

const waText = `Oi Dolly! Quero reservar vaga na aula de ${OPEN_CLASS.long.toLowerCase()}, às ${WORKSHOP_START}. Somos __ pessoa(s).`;
const waHref = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(waText)}`;

/** Today in São Paulo, as YYYY-MM-DD. */
function todaySP() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function Book({ className = 'cx-btn cx-btn-gold' }: { className?: string }) {
  return (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackMeta('Lead', { content_name: `curso: turma ${OPEN_CLASS.short}` })}
    >
      Reservar minha vaga
    </a>
  );
}

export default function OpenClassPage() {
  // Decided after the page is on screen, so the visitor's clock decides it and the server render matches.
  const [over, setOver] = useState(false);
  useEffect(() => { setOver(todaySP() > OPEN_CLASS.date); }, []);
  const past = over || OPEN_CLASS.spotsLeft <= 0;

  return (
    <main className="cx-page">
      <section className="cx-hero">
        <div className="cx-hero-bg" style={{ backgroundImage: `url("${optimizedSrc(course?.heroImage ?? '/assets/surfers_retreat_treats_1789884582282.jpg', 1080)}")` }} aria-hidden />
        <div className="cx-hero-in">
          <span className="cx-eyebrow">Turma aberta · {OPEN_CLASS.long}</span>
          <h1>Uma tarde fazendo doces com a Chef Dolly</h1>
          <p className="cx-hero-tag">
            Na cozinha da Dolly em Itamambuca, a poucos passos do mar. Você põe a mão na massa, prova tudo e leva as receitas.
            100% vegano e sem trigo.
          </p>
          <ul className="cx-facts">
            <li className="cx-fact-main">📅 {OPEN_CLASS.short} · {WORKSHOP_START} às {endHour}</li>
            <li>📍 Itamambuca</li>
            <li>🗣️ Em {OPEN_CLASS.languages}</li>
            <li>💛 {WORKSHOP_PRICE_SHORT}</li>
            <li>👥 {OPEN_CLASS.spotsLeft > 0 ? `Restam ${OPEN_CLASS.spotsLeft} vagas` : 'Turma lotada'}</li>
          </ul>
          {past ? (
            <div className="cx-hero-actions">
              <Link href="/cursos" className="cx-btn cx-btn-gold">Ver as próximas aulas</Link>
            </div>
          ) : (
            <div className="cx-hero-actions"><Book /></div>
          )}
          <p className="cx-hero-note">
            {past
              ? (over ? 'Essa turma já aconteceu.' : 'Essa turma lotou.') + ' Você pode marcar uma aula no dia que preferir.'
              : 'Você reserva pelo WhatsApp e a Dolly confirma a sua vaga.'}
          </p>
        </div>
      </section>

      {course && (
        <section className="cx-sec">
          <div className="cx-wrap">
            <span className="cx-eyebrow">Como é a tarde</span>
            <ol className="cx-steps">
              {course.journey.map(s => (
                <li key={s.title}><strong>{s.title}</strong>{s.text}</li>
              ))}
            </ol>
            <h2 className="cx-sub">Você leva para casa</h2>
            <ul className="cx-leave">
              {course.youLeaveWith.map(t => <li key={t}>{t}</li>)}
            </ul>
            <h2 className="cx-sub">Preciso saber cozinhar?</h2>
            <p className="cx-p">Não. A aula é para iniciantes, e a Dolly acompanha cada passo.</p>
          </div>
        </section>
      )}

      <section className="cx-cta">
        <div className="cx-wrap">
          <h2 className="cx-h2">{past ? 'Quer uma aula só sua?' : `${OPEN_CLASS.long}, às ${WORKSHOP_START}`}</h2>
          <div className="cx-hero-actions" style={{ marginTop: '1rem' }}>
            {past ? <Link href="/cursos" className="cx-btn cx-btn-gold">Ver as aulas</Link> : <Book />}
          </div>
          {!past && (
            <p className="cx-hero-note" lang="en">
              Visiting? This class is taught in English and Portuguese. Tap the button to book on WhatsApp.
            </p>
          )}
          {!past && (
            <p className="cx-hero-note">
              Prefere outro dia? <Link href="/cursos" style={{ color: '#f0cf6a', fontWeight: 700 }}>Marque uma aula particular</Link>.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
