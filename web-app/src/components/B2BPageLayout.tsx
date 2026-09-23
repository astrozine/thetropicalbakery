import React from 'react';
import Image from 'next/image';
import ZoomableImage from '@/components/ZoomableImage';
import StripedBackground from '@/components/StripedBackground';

export interface PartnershipOption {
  icon: string;
  title: string;
  description: string;
}

interface B2BPageLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  optionsHeading?: string;
  options: PartnershipOption[];
  whyChooseUs: string[];
  whatsappHref: string;
  whatsappLabel?: string;
  galleryImages: string[];
  regionNote?: string;
  itamambucaBadge?: boolean;
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
  heroImage,
  optionsHeading = 'Formas de Parceria',
  options,
  whyChooseUs,
  whatsappHref,
  whatsappLabel = 'Falar com o Comercial no WhatsApp',
  galleryImages,
  regionNote,
  itamambucaBadge,
  children,
}: B2BPageLayoutProps) {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '56vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${heroImage}), linear-gradient(rgba(60, 42, 33, 0.72), rgba(60, 42, 33, 0.72))`,
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-primary)',
          }}
        />
        {itamambucaBadge && (
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 2, width: '86px', opacity: 0.95 }}>
            <Image src="/itamambuca-lockup.png" alt="The Tropical Bakery — Itamambuca" width={172} height={220} style={{ width: '100%', height: 'auto' }} />
          </div>
        )}
        <div className="container relative z-10 text-center fade-in px-4 py-16">
          <span className="text-secondary tracking-[4px] uppercase text-sm md:text-base mb-4 block font-semibold">
            {eyebrow}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-heading)', lineHeight: '1.15' }}>
            {title}
          </h1>
          <p style={{ color: '#f5efe2', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.8 }}>
            {intro}
          </p>
          {regionNote && (
            <p style={{ marginTop: '1.25rem', display: 'inline-block', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.5)', color: '#fdfaf3', padding: '0.5rem 1.25rem', borderRadius: '30px', fontSize: '0.85rem', letterSpacing: '0.03em' }}>
              📍 {regionNote}
            </p>
          )}
        </div>
      </section>

      {/* Partnership options */}
      <section className="container pt-20 pb-4 px-4 max-w-6xl mx-auto">
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#3c2a21', marginBottom: '3rem' }}>
          {optionsHeading}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '4rem' }}>
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
      <section className="container pb-20 px-4 max-w-4xl mx-auto text-center">
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
