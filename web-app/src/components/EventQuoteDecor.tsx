import type { CSSProperties } from 'react';

// Cute things flanking the "Quer ajuda para montar o seu evento?" box. Wide screens only: on a phone
// there is no side gutter, so nothing here renders there. Sits outside the SquiggleArrows (which
// touch the box edge) and never takes clicks.
export default function EventQuoteDecor() {
  const sticker = (bg: string): CSSProperties => ({
    width: 58, height: 58, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '1.9rem', border: '3px solid #fff', boxShadow: '0 6px 16px rgba(60,42,33,0.18)',
  });

  return (
    <>
      <style>{`
        .quote-decor { display: none; position: absolute; pointer-events: none; z-index: 5; width: 180px; }
        .quote-decor-left { right: calc(100% + 105px); top: 10px; }
        .quote-decor-right { left: calc(100% + 105px); top: 0; }
        @media (min-width: 1200px) { .quote-decor { display: block; } }
        @keyframes decorBob { 0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); } 50% { transform: translateY(-6px) rotate(var(--r, 0deg)); } }
        .decor-bob { animation: decorBob 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .decor-bob { animation: none; transform: rotate(var(--r, 0deg)); } }
      `}</style>

      {/* Left: the events hero as a small polaroid, with a gold seal tucked over its corner */}
      <div className="quote-decor quote-decor-left" aria-hidden="true">
        <div className="decor-bob" style={{ ['--r' as string]: '-5deg', background: '#fff', padding: '10px 10px 12px', borderRadius: 6, boxShadow: '0 14px 28px rgba(60,42,33,0.2)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/event_hero.jpg" alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 3, display: 'block' }} />
          <div style={{ fontFamily: 'var(--font-heading)', color: '#3c2a21', textAlign: 'center', fontSize: '0.95rem', marginTop: 8 }}>
            Seu evento, do nosso jeito
          </div>
        </div>
        <div className="decor-bob" style={{ ['--r' as string]: '10deg', position: 'absolute', top: -22, right: -24, ...sticker('#f6e3a1') }}>🌺</div>
        <div className="decor-bob" style={{ ['--r' as string]: '-8deg', marginTop: 26, marginLeft: 14, ...sticker('#fbe3d3'), animationDelay: '1s' }}>🍍</div>
      </div>

      {/* Right: a kraft tag, a few little stickers */}
      <div className="quote-decor quote-decor-right" aria-hidden="true">
        <div className="decor-bob" style={{ ['--r' as string]: '4deg', background: '#d9b98a', color: '#3c2a21', borderRadius: 10, padding: '1.1rem 1rem 1rem', textAlign: 'center', boxShadow: '0 12px 24px rgba(60,42,33,0.2)', position: 'relative', animationDelay: '0.6s' }}>
          <div style={{ position: 'absolute', top: 9, left: '50%', width: 12, height: 12, marginLeft: -6, borderRadius: '50%', background: '#fdfaf3', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }} />
          <div style={{ marginTop: 14, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', lineHeight: 1.2 }}>Casamentos, festas &amp; restaurantes</div>
          <div style={{ fontSize: '0.78rem', marginTop: 8, lineHeight: 1.45 }}>100% vegetal e sem trigo</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, marginLeft: 10 }}>
          <div className="decor-bob" style={{ ['--r' as string]: '-8deg', ...sticker('#e4efd9') }}>🥥</div>
          <div className="decor-bob" style={{ ['--r' as string]: '9deg', ...sticker('#f6e3a1'), animationDelay: '1.4s' }}>🎂</div>
          <div className="decor-bob" style={{ ['--r' as string]: '-4deg', ...sticker('#fbe3d3'), animationDelay: '2.2s' }}>✨</div>
        </div>
      </div>
    </>
  );
}
