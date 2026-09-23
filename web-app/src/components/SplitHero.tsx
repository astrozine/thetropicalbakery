import React from 'react';
import Image from 'next/image';

interface SplitHeroProps {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  regionNote?: string;
  itamambucaBadge?: boolean;
  ctaHref: string;
  ctaLabel: string;
  /** Optional second, smaller photo layered onto the main one. */
  accentImage?: string;
}

/**
 * Text panel beside a full-strength photo. On narrow screens the photo wraps
 * above the text (flex-wrap: wrap-reverse) so the image is still the first
 * thing seen. The photo is never overlaid or dimmed — that's the whole point.
 */
export default function SplitHero({
  eyebrow, title, intro, image, imageAlt, regionNote, itamambucaBadge, ctaHref, ctaLabel, accentImage,
}: SplitHeroProps) {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap-reverse', background: '#3c2a21', overflow: 'hidden' }}>
      {/* Text panel */}
      <div style={{
        flex: '1 1 460px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(3rem, 6vw, 5.5rem) clamp(1.5rem, 5vw, 4.5rem)',
        position: 'relative',
      }}>
        <span style={{ color: '#d4af37', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          {eyebrow}
        </span>
        <div style={{ width: '56px', height: '3px', background: '#d4af37', marginBottom: '1.75rem' }} />
        <h1 style={{ color: '#fdfaf3', fontSize: 'clamp(2rem, 3.9vw, 3.3rem)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
          {title}
        </h1>
        <p style={{ color: 'rgba(253,250,243,0.82)', fontSize: '1.08rem', lineHeight: 1.85, maxWidth: '540px', marginBottom: '1.75rem' }}>
          {intro}
        </p>
        {regionNote && (
          <p style={{ alignSelf: 'flex-start', background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.5)', color: '#fdfaf3', padding: '0.5rem 1.15rem', borderRadius: '30px', fontSize: '0.83rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            📍 {regionNote}
          </p>
        )}
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ alignSelf: 'flex-start', padding: '1rem 2.25rem', fontSize: '1rem', letterSpacing: '1px' }}
        >
          {ctaLabel}
        </a>
      </div>

      {/* Photo */}
      <div style={{ flex: '1 1 460px', position: 'relative', minHeight: 'clamp(340px, 46vw, 620px)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} role="img" aria-label={imageAlt} />
        {/* Thin gold inner frame */}
        <div style={{ position: 'absolute', inset: 'clamp(12px, 1.6vw, 22px)', border: '1px solid rgba(212,175,55,0.7)', pointerEvents: 'none' }} />
        {accentImage && (
          <div style={{
            position: 'absolute', left: 'clamp(24px, 4vw, 56px)', bottom: 'clamp(24px, 4vw, 56px)',
            width: 'clamp(110px, 16vw, 200px)', aspectRatio: '1', borderRadius: '14px',
            backgroundImage: `url("${accentImage}")`, backgroundSize: 'cover', backgroundPosition: 'center',
            border: '3px solid #fdfaf3', boxShadow: '0 18px 40px rgba(0,0,0,0.4)', transform: 'rotate(-5deg)',
          }} />
        )}
        {itamambucaBadge && (
          <div style={{ position: 'absolute', top: 'clamp(24px, 3vw, 40px)', right: 'clamp(24px, 3vw, 40px)', width: '84px', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))' }}>
            <Image src="/itamambuca-lockup.png" alt="The Tropical Bakery — Itamambuca" width={172} height={220} style={{ width: '100%', height: 'auto' }} />
          </div>
        )}
      </div>
    </section>
  );
}
