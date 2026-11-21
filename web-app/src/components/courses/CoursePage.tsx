'use client';

import React, { useState } from 'react';
import SunbakedLetters from '@/components/SunbakedLetters';
import CrmRegistrationModal from '@/components/CrmRegistrationModal';
import { PRICE_FAQ, courseBySlug } from '@/lib/courseContent';
import {
  CompactCTA, CompactHero, CompactMagic, FaqFolds, Fold, OtherCourseRows, PathsFold, PhotoRow, PriceCard, RainFold, RetreatFold,
} from '@/components/courses/CourseCompact';

/**
 * One course page, compact (2026-11-15): the hero says what, when and how long; then the short story with what
 * you leave with, how the afternoon goes, Dolly's flavour tricks, and everything else behind one tap.
 * The price and the hours come from src/lib/workshopDates.ts; everything else from src/lib/courseContent.ts.
 */
export default function CoursePage({ slug }: { slug: string }) {
  const c = courseBySlug(slug)!;
  const [enquiry, setEnquiry] = useState<{ interest: string; type: 'curso' | 'retiro' } | null>(null);

  const book = (interest = c.enquiry, type: 'curso' | 'retiro' = 'curso') => setEnquiry({ interest, type });

  return (
    <main className="cx-page">
      <CompactHero
        eyebrow="Curso com a Chef Dolly"
        title={c.title}
        tagline={c.tagline}
        image={c.heroImage}
        floating={c.floating}
        cta={c.cta}
        onCta={() => book()}
      />

      <section className="cx-sec">
        <div className="cx-wrap cx-two">
          <div>
            <span className="cx-eyebrow">O curso</span>
            <p className="cx-p">{c.story[0]}</p>
            {c.story.length > 1 && (
              <details className="cx-more">
                <summary>Ler mais</summary>
                {c.story.slice(1).map(p => <p key={p.slice(0, 20)} className="cx-p">{p}</p>)}
              </details>
            )}
          </div>
          <div>
            <span className="cx-eyebrow">Você sai com</span>
            <ul className="cx-leave">{c.youLeaveWith.map(x => <li key={x}>{x}</li>)}</ul>
            <PriceCard />
          </div>
        </div>
      </section>

      <section className="cx-sec cx-sec-soft">
        <div className="cx-wrap">
          <span className="cx-eyebrow">Passo a passo</span>
          <h2 className="cx-h2">Como é a aula</h2>
          <ol className="cx-steps">
            {c.journey.map(s => <li key={s.title}><strong>{s.title}</strong>{s.text}</li>)}
          </ol>
          <PhotoRow images={c.gallery} />
        </div>
      </section>

      <CompactMagic tricks={c.magic} text={c.magicIntro} />

      <section className="cx-sec">
        <div className="cx-wrap">
          <h2 className="cx-h2">Bom saber</h2>
          <div className="cx-acc">
            <Fold emoji="🙋" title="Para quem é">
              <ul>{c.whoFor.map(x => <li key={x}>{x}</li>)}</ul>
            </Fold>
            {c.retreatText && <RetreatFold text={c.retreatText} interest={c.title} onEnquire={book} />}
            {c.familyText && <RainFold text={c.familyText} onEnquire={book} />}
            <PathsFold ids={c.paths} />
            <FaqFolds items={[PRICE_FAQ, ...c.faq]} />
          </div>
        </div>
      </section>

      <CompactCTA
        title="O próximo passo é seu"
        text="Escolha a data no formulário. A Dolly responde pelo WhatsApp para confirmar."
        cta={c.cta}
        onCta={() => book()}
      />

      <OtherCourseRows currentSlug={slug} />

      {/* For people who are already this deep in: Dolly's newsletter */}
      <section className="cx-news">
        <SunbakedLetters tone="dark" />
      </section>

      <CrmRegistrationModal
        isOpen={!!enquiry}
        onClose={() => setEnquiry(null)}
        interestType={enquiry?.type ?? 'curso'}
        specificInterest={enquiry?.interest ?? c.enquiry}
      />
    </main>
  );
}
