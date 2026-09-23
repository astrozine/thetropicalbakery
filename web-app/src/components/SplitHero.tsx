import React from 'react';
import Image from 'next/image';

interface SplitHeroProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** A single wide photo. Use `images` instead for portrait photos. */
  image?: string;
  /** Portrait (3:4) photos shown side by side, uncropped. */
  images?: string[];
  imageAlt: string;
  regionNote?: string;
  itamambucaBadge?: boolean;
  ctaHref: string;
  ctaLabel: string;
  /** Optional second, smaller photo layered onto the main one. */
  accentImage?: string;
  /** Portrait treat photos layered as tilted prints over the main photo. */
  treats?: string[];
}

/**
 * Text panel beside a full-strength photo. On narrow screens the photo wraps
 * above the text (flex-wrap: wrap-reverse) so the image is still the first
 * thing seen. The photo is never overlaid or dimmed — that's the whole point.
 */
export default function SplitHero({
  eyebrow, title, intro, image, images, imageAlt, regionNote, itamambucaBadge, ctaHref, ctaLabel, accentImage, treats,
}: SplitHeroProps) {
  // "Parcerias para Hotéis" -> small kicker + a huge "HOTÉIS", so a visitor knows at a glance which program this is.
  const m = eyebrow.match(/^(Parcerias para)\s+(.+)$/i);
  const kicker = m ? m[1] : null;
  const category = m ? m[2] : eyebrow;
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap-reverse', background: '#3c2a21', overflow: 'hidden' }}>
      {/* Text panel */}
      <div style={{
        flex: '1 1 460px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(3rem, 6vw, 5.5rem) clamp(1.5rem, 5vw, 4.5rem)',
        position: 'relative',
      }}>
        {kicker && (
          <span style={{ color: 'rgba(253,250,243,0.75)', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: 'clamp(0.85rem, 1.3vw, 1.05rem)', fontWeight: 600, marginBottom: '0.5rem' }}>
            {kicker}
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-heading)', color: '#d4af37', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.05, fontSize: 'clamp(2.4rem, 6.2vw, 5rem)', marginBottom: '1.25rem', overflowWrap: 'anywhere' }}>
          {category}
        </span>
        <div style={{ width: '56px', height: '3px', background: '#d4af37', marginBottom: '1.75rem' }} />
        <h1 style={{ color: '#fdfaf3', fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)', lineHeight: 1.25, marginBottom: '1.5rem' }}>
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
      <div style={{ flex: '1 1 460px', position: 'relative', minHeight: images?.length ? undefined : 'clamp(360px, 46vw, 760px)', display: images?.length ? 'grid' : 'block', gridTemplateColumns: images?.length ? `repeat(${images.length}, 1fr)` : undefined, gap: '4px' }}>
        {images?.length ? images.map((src, i) => (
          <div key={i} role="img" aria-label={`${imageAlt} ${i + 1}`} style={{ aspectRatio: '3 / 4', backgroundImage: `url("${src}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )) : (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} role="img" aria-label={imageAlt} />
        )}
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
        {treats && treats.length > 0 && (
          <div style={{ position: 'absolute', left: 'clamp(20px, 3.5vw, 56px)', bottom: 'clamp(20px, 3.5vw, 56px)', display: 'flex' }}>
            {treats.map((src, i) => (
              <div
                key={src}
                role="img"
                aria-label={`${imageAlt} — doces ${i + 1}`}
                style={{
                  width: 'clamp(96px, 13vw, 210px)', aspectRatio: '3 / 4', borderRadius: '12px',
                  backgroundImage: `url("${src}")`, backgroundSize: 'cover', backgroundPosition: 'center',
                  border: '3px solid #fdfaf3', boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
                  transform: `rotate(${i % 2 === 0 ? -5 : 4}deg) translateY(${i % 2 === 0 ? 0 : -18}px)`,
                  marginLeft: i === 0 ? 0 : 'clamp(-34px, -2.5vw, -18px)',
                }}
              />
            ))}
          </div>
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
