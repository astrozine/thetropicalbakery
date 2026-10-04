import React from 'react';
import SplitHero from '@/components/SplitHero';
import ZoomableImage from '@/components/ZoomableImage';
import StripedBackground from '@/components/StripedBackground';
import PartnerApply from '@/components/PartnerApply';
import WhatsAppGate from '@/components/WhatsAppGate';
import Link from 'next/link';
import { PartnerKind } from '@/lib/portals';

export interface PartnershipOption {
  icon: string;
  title: string;
  description: string;
  /** A small gold line under the description, e.g. a suggested price. */
  note?: string;
  link?: { href: string; label: string };
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
  /** When set, the hero and closing buttons jump to the partner form (with this label) instead of opening WhatsApp. */
  applyCta?: string;
  whyHeading?: string;
  /** 'en' for the hand-written English pages: the form and the WhatsApp gate follow. */
  locale?: 'pt' | 'en';
  /** Sections shown between the hero and the option cards. */
  beforeOptions?: React.ReactNode;
  /** Sections shown after the option cards. Pass whyChooseUs={[]} to place your own "why" in here. */
  children?: React.ReactNode;
}

const ctaStyle: React.CSSProperties = { padding: '1.1rem 2.5rem', fontSize: '1.15rem', borderRadius: '4px', letterSpacing: '1px', display: 'inline-block' };

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
  optionsHeading,
  options,
  whyChooseUs,
  whatsappHref,
  whatsappLabel,
  galleryImages,
  regionNote,
  itamambucaBadge,
  partnerKind = 'outro',
  applyCta,
  whyHeading,
  locale = 'pt',
  beforeOptions,
  children,
}: B2BPageLayoutProps) {
  const en = locale === 'en';
  optionsHeading ??= en ? 'Ways to Partner' : 'Formas de Parceria';
  whatsappLabel ??= en ? 'Message our team on WhatsApp' : 'Falar com o Comercial no WhatsApp';
  whyHeading ??= en ? 'Why Partner With Us?' : 'Por Que Nos Escolher?';
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
        ctaHref={applyCta ? '#ser-parceiro' : whatsappHref}
        ctaLabel={applyCta ?? whatsappLabel}
        ctaLocale={locale}
      />

      {beforeOptions}

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
              {opt.note && <p style={{ marginTop: '1rem', color: '#8a6d1f', fontWeight: 700, fontSize: '0.95rem' }}>{opt.note}</p>}
              {opt.link && (
                <Link href={opt.link.href} style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.5rem 0.25rem', color: '#8a6d1f', fontWeight: 700, textDecoration: 'underline' }}>
                  {opt.link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {children}

      {/* Why choose us + CTA */}
      <section className="container px-4 max-w-4xl mx-auto text-center" style={{ paddingTop: '1rem', paddingBottom: 'clamp(5rem, 10vw, 7.5rem)' }}>
        {whyChooseUs.length > 0 && (
          <>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#d4af37', fontFamily: 'var(--font-heading)' }}>{whyHeading}</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', color: '#594a42', lineHeight: 2, fontSize: '1.05rem' }}>
              {whyChooseUs.map((line, i) => (
                <li key={i}>✦ {line}</li>
              ))}
            </ul>
          </>
        )}
        {applyCta ? (
          <a href="#ser-parceiro" className="btn btn-primary" style={ctaStyle}>{applyCta}</a>
        ) : (
          <WhatsAppGate
            href={whatsappHref}
            topic={eyebrow}
            tags={['parceiro']}
            locale={locale}
            className="btn btn-primary"
            style={ctaStyle}
          >
            {whatsappLabel}
          </WhatsAppGate>
        )}
      </section>

      <PartnerApply defaultKind={partnerKind} whatsappHref={whatsappHref} locale={locale} />

      {/* Treat Gallery Strip */}
      <StripedBackground tone="dark" bandHeight={64}>
        <div className="tb-gallery-rail" style={{ padding: '2.5rem 1.5rem' }}>
          {galleryImages.map((src, i) => (
            <ZoomableImage
              key={i}
              src={src}
              alt={en ? 'A Tropical Bakery creation' : 'Criação Tropical'}
              className="tb-gallery-rail-img"
              style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(212,175,55,0.3)', flexShrink: 0, scrollSnapAlign: 'start' }}
            />
          ))}
        </div>
      </StripedBackground>

    </main>
  );
}
