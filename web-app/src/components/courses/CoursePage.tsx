'use client';

import React, { useEffect, useState } from 'react';
import OtherCourses from '@/components/OtherCourses';
import SunbakedLetters from '@/components/SunbakedLetters';
import CrmRegistrationModal from '@/components/CrmRegistrationModal';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { courseBySlug } from '@/lib/courseContent';
import {
  BeachRetreat, CourseCTA, CourseFAQ, CourseGallery, CourseHero, CourseJourney, CoursePaths, MagicFlavors, RainyDay, WhoAndWhat,
} from '@/components/courses/CourseSections';

/**
 * One course page: hero, the story, Dolly's magic flavour combinations, how it goes, where it can lead,
 * the beach-retreat and rainy-day versions (when the course has them), questions, and a last call to book.
 * The price comes from Admin > Cursos; everything else from src/lib/courseContent.ts.
 */
export default function CoursePage({ slug }: { slug: string }) {
  const c = courseBySlug(slug)!;
  const [price, setPrice] = useState<number | null>(null);
  const [enquiry, setEnquiry] = useState<{ interest: string; type: 'curso' | 'retiro' } | null>(null);

  useEffect(() => {
    supabase.from('courses').select('price').eq('slug', slug).maybeSingle().then(({ data }) => {
      if (data?.price) setPrice(Number(data.price));
    });
  }, [slug]);

  const book = (interest = c.enquiry, type: 'curso' | 'retiro' = 'curso') => setEnquiry({ interest, type });

  return (
    <main style={{ background: 'var(--color-background)' }}>
      <CourseHero
        eyebrow={c.eyebrow}
        title={c.title}
        tagline={c.tagline}
        image={c.heroImage}
        floating={c.floating}
        price={price ? `Investimento: ${formatBRL(price)}` : undefined}
        cta={c.cta}
        onCta={() => book()}
        secondary={{ label: 'Descobrir a mágica ↓', href: '#magia' }}
      />

      <WhoAndWhat story={c.story} whoFor={c.whoFor} youLeaveWith={c.youLeaveWith} />

      <div id="magia">
        <MagicFlavors intro={c.magicIntro} tricks={c.magic} />
      </div>

      <CourseJourney steps={c.journey} />

      <CourseGallery images={c.gallery} />

      <CoursePaths ids={c.paths} />

      {c.retreatText && <BeachRetreat text={c.retreatText} interest={c.title} onEnquire={book} />}

      {c.familyText && <RainyDay text={c.familyText} onEnquire={book} />}

      <CourseFAQ items={c.faq} />

      <CourseCTA
        title="O próximo passo é seu"
        text="Conte um pouco sobre você no formulário. A Dolly responde pelo WhatsApp para combinar a data e os detalhes."
        cta={c.cta}
        onCta={() => book()}
      />

      <OtherCourses currentSlug={slug} />

      {/* For people who are already this deep in: Dolly's newsletter */}
      <section style={{ padding: '0 1.5rem 4rem', background: '#fdfaf3' }}>
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
