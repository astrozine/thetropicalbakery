import React from 'react';
import Link from 'next/link';

/**
 * A full-bleed, full-colour photo band: the branded wrapping paper, the monstera and the
 * bird-of-paradise on the counter. It is the one place the site lets a photo run edge to edge with
 * no tint, so the colour does the work. On phones the caption sits under the photo instead of on it.
 */
export default function PhotoShowcase() {
  return (
    <section className="photo-showcase" aria-label="Doces embrulhados no papel da Tropical Bakery">
      <img
        className="photo-showcase__img"
        src="/textures/birds-of-paradise.webp"
        alt="Doces artesanais sobre o papel dourado da Tropical Bakery, com monstera e ave-do-paraíso"
        loading="lazy"
      />
      <div aria-hidden className="photo-showcase__shade" />
      <div className="photo-showcase__card">
        <span className="photo-showcase__eyebrow">Feito à mão em Itamambuca</span>
        <h2 className="photo-showcase__title">Cada caixa chega embrulhada como um presente</h2>
        <p className="photo-showcase__text">
          Doces veganos, sem glúten e sem açúcar refinado, no nosso papel dourado. Uma criação nova a cada semana.
        </p>
        <Link href="/caixas" className="photo-showcase__cta">Ver a caixa da semana</Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .photo-showcase { position: relative; background: #3c2a21; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37; }
        .photo-showcase__img { display: block; width: 100%; height: clamp(300px, 92vw, 460px); object-fit: cover; object-position: 68% 68%; }
        .photo-showcase__shade { display: none; }
        .photo-showcase__card { padding: 1.75rem 1.5rem 2.25rem; color: #fdfaf3; }
        .photo-showcase__eyebrow { display: block; color: #d4af37; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; margin-bottom: 0.75rem; }
        .photo-showcase__title { font-family: var(--font-heading); font-size: clamp(1.5rem, 5vw, 2.2rem); line-height: 1.15; margin: 0 0 0.9rem; color: #fdfaf3; }
        .photo-showcase__text { color: rgba(253,250,243,0.85); line-height: 1.75; margin: 0 0 1.4rem; font-size: 0.98rem; }
        .photo-showcase__cta { display: inline-block; background: #d4af37; color: #3c2a21; padding: 0.9rem 1.8rem; border-radius: 8px; text-decoration: none; font-weight: 700; letter-spacing: 0.02em; }
        @media (min-width: 768px) {
          .photo-showcase__img { height: clamp(460px, 80vh, 900px); }
          .photo-showcase__shade { display: block; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(90deg, rgba(40,27,20,0.62) 0%, rgba(40,27,20,0.28) 34%, rgba(40,27,20,0) 55%); }
          .photo-showcase__card { position: absolute; left: clamp(1.5rem, 6vw, 5rem); bottom: clamp(1.5rem, 8vh, 4rem); max-width: 440px; padding: 0; }
        }
      ` }} />
    </section>
  );
}
