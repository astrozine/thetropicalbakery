import React from 'react';
import SplitHero from '@/components/SplitHero';
import ZoomableImage from '@/components/ZoomableImage';
import StripedBackground from '@/components/StripedBackground';
import PartnerApply from '@/components/PartnerApply';
import { PartnerKind } from '@/lib/portals';

export interface PartnershipOption {
  icon: string;
  title: string;
  description: string;
}

interface B2BPageLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** Scene photo (people at a hotel, restaurant...) shown large in the hero. */
  heroScene: string;
  /** Portrait treat photos layered over the scene. */
  heroTreats: string[];
  optionsHeading?: string;
  options: PartnershipOption[];
  whyChooseUs: string[];
  whatsappHref: string;
  whatsappLabel?: string;
  galleryImages: string[];
  regionNote?: string;
  itamambucaBadge?: boolean;
  /** Which kind of partner this page is for, pre-picked in the application form. */
  partnerKind?: PartnerKind;
  children?: React.ReactNode;
}

/**
 * Full-bleed hero + "formas de parceria" card grid, shared across every B2B
 * partner page so a hotel and a restaurant feel like they're looking at the
 * same premium program, not a form letter with the noun swapped out.
 */
export default function B2BPageLayout({
  eyebrow,
  title,
  intro,
  heroScene,
  heroTreats,
  optionsHeading = 'Formas de Parceria',
  options,
  whyChooseUs,
  whatsappHref,
  whatsappLabel = 'Falar com o Comercial no WhatsApp',
  galleryImages,
  regionNote,
  itamambucaBadge,
  partnerKind = 'outro',
  children,
}: B2BPageLayoutProps) {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <SplitHero
        eyebrow={eyebrow}
        title={title}
        intro={intro}
        image={heroScene}
        treats={heroTreats}
        imageAlt={title}
        regionNote={regionNote}
        itamambucaBadge={itamambucaBadge}
        ctaHref={whatsappHref}
        ctaLabel={whatsappLabel}
      />

      {/* Partnership options */}
      <section className="container px-4 max-w-6xl mx-auto" style={{ position: 'relative', paddingTop: 'clamp(3.5rem, 7vw, 5.5rem)', paddingBottom: '1rem' }}>
        <h2 style={{ position: 'relative', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#3c2a21', marginBottom: '3rem' }}>
          {optionsHeading}
        </h2>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '4rem' }}>
          {options.map((opt, i) => (
            <div key={i} className="liquid-glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>{opt.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#3c2a21', marginBottom: '0.75rem' }}>{opt.title}</h3>
              <p style={{ color: '#594a42', lineHeight: 1.7, fontSize: '0.98rem' }}>{opt.description}</p>
            </div>
          ))}
        </div>
      </section>

      {children}

      {/* Why choose us + CTA */}
      <section className="container px-4 max-w-4xl mx-auto text-center" style={{ paddingTop: '1rem', paddingBottom: 'clamp(5rem, 10vw, 7.5rem)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#d4af37', fontFamily: 'var(--font-heading)' }}>Por Que Nos Escolher?</h3>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', color: '#594a42', lineHeight: 2, fontSize: '1.05rem' }}>
          {whyChooseUs.map((line, i) => (
            <li key={i}>✦ {line}</li>
          ))}
        </ul>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ padding: '1.1rem 2.5rem', fontSize: '1.15rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' }}
        >
          {whatsappLabel}
        </a>
      </section>

      <PartnerApply defaultKind={partnerKind} whatsappHref={whatsappHref} />

      {/* Treat Gallery Strip */}
      <StripedBackground tone="dark" bandHeight={64}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', padding: '3rem 2rem' }}>
          {galleryImages.map((src, i) => (
            <ZoomableImage key={i} src={src} alt="Criação Tropical" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)' }} />
          ))}
        </div>
      </StripedBackground>
    </main>
  );
}
