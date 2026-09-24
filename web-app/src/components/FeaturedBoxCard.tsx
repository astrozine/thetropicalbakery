'use client';

import React from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';
import SquiggleCta from '@/components/SquiggleCta';

interface FeaturedBoxCardProps {
  title: string;
  description: string;
  imageUrl: string;
  /** Already formatted for reading, e.g. "23 de setembro". */
  dateLabel: string;
}

/**
 * The descriptions are typed as one run of text: "1. Tartelete… 2. Blissball… 3. …".
 * When they really are a 1-2-3… sequence, show them as a list; otherwise leave the text alone.
 */
function parseNumbered(text: string): { intro: string; items: string[] } | null {
  const parts = text.split(/\s+(?=\d+\.\s)/).map(p => p.trim()).filter(Boolean);
  const firstIsItem = /^1\.\s/.test(parts[0] ?? '');
  const intro = firstIsItem ? '' : (parts.shift() ?? '');
  if (parts.length < 2) return null;
  const items: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const m = /^(\d+)\.\s+([\s\S]*)$/.exec(parts[i]);
    if (!m || Number(m[1]) !== i + 1) return null;
    items.push(m[2]);
  }
  return { intro, items };
}

/**
 * Homepage "this week's box". The photo is shown at its own proportions, never
 * cropped to a strip: side by side with the text on a wide screen, stacked on a
 * phone. Tap the photo to see it full size.
 */
export default function FeaturedBoxCard({ title, description, imageUrl, dateLabel }: FeaturedBoxCardProps) {
  const numbered = parseNumbered(description);
  // "Chegada da Primavera: Sensações Amarelas" -> the part after the colon is the theme; give it its own colour and size.
  const colon = title.indexOf(':');
  const lead = colon > 0 ? title.slice(0, colon + 1) : title;
  const theme = colon > 0 ? title.slice(colon + 1).trim() : '';

  return (
    <div className="fbc">
      <style>{`
        .fbc { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(60,42,33,0.1); text-align: left; }
        .fbc-grid { display: grid; grid-template-columns: 1fr; }
        .fbc-photo { display: flex; align-items: center; justify-content: center; background: #f5efe2; }
        .fbc-photo img { display: block; width: 100%; height: auto; max-height: 640px; object-fit: contain; }
        .fbc-theme { display: block; margin-top: 0.1em; font-size: 1.22em; line-height: 1.05; color: #e39a14; }
        .fbc-cta .btn.fbc-btn, .fbc-cta .btn.fbc-btn:hover { color: #3c2a21; font-weight: 800; letter-spacing: 0.14em; }
        .fbc-text { padding: clamp(1.75rem, 4vw, 3rem); display: flex; flex-direction: column; justify-content: center; }
        .fbc-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.7rem; }
        .fbc-list li { display: flex; gap: 0.8rem; align-items: baseline; color: #594a42; line-height: 1.55; font-size: 1.02rem; }
        .fbc-num { flex-shrink: 0; width: 1.7rem; height: 1.7rem; border-radius: 50%; background: #fdf1d6; color: #8a6d1f;
          font-weight: 800; font-size: 0.85rem; display: inline-flex; align-items: center; justify-content: center; transform: translateY(0.1rem); }
        .fbc-cta { padding: 3.75rem clamp(1.25rem, 4vw, 2rem) 2.25rem; background: linear-gradient(180deg, #fff 0%, #fdf7ee 100%); }
        @media (min-width: 860px) {
          .fbc-grid { grid-template-columns: 1.15fr 1fr; }
        }
      `}</style>

      <div className="fbc-grid">
        <div className="fbc-photo">
          <ZoomableImage src={imageUrl} alt={title} />
        </div>

        <div className="fbc-text">
          <span style={{ alignSelf: 'flex-start', display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
            Apenas esta semana!{dateLabel ? ` • ${dateLabel}` : ''}
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.7rem)', color: '#3c2a21', fontFamily: 'var(--font-heading)', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            {lead}
            {theme && <span className="fbc-theme">{theme}</span>}
          </h2>
          {numbered ? (
            <>
              {numbered.intro && <p style={{ fontSize: '1.05rem', color: '#594a42', marginBottom: '1rem', lineHeight: 1.6 }}>{numbered.intro}</p>}
              <ol className="fbc-list">
                {numbered.items.map((item, i) => (
                  <li key={i}><span className="fbc-num" aria-hidden>{i + 1}</span><span>{item}</span></li>
                ))}
              </ol>
            </>
          ) : (
            <p style={{ fontSize: '1.1rem', color: '#594a42', lineHeight: 1.6 }}>{description}</p>
          )}
        </div>
      </div>

      <div className="fbc-cta">
        <SquiggleCta>
          <Link
            href="/caixas"
            className="btn btn-primary fbc-btn"
            style={{ padding: '1.1rem 2rem', display: 'block', width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #d4af37, #c19b2e)', border: 'none', borderRadius: '40px' }}
          >
            Reservar Minha Caixa
          </Link>
        </SquiggleCta>
      </div>
    </div>
  );
}
