import React from 'react';
import ZoomableImage from '@/components/ZoomableImage';

// "Como fica no seu espaço": the studio photos, below the partnership options, so a studio owner can picture it.
// One wide photo and two portraits; on phones the wide one goes on top and the portraits share the row under it.

const SCENES = [
  { src: '/assets/wellness_street_table.jpg', alt: 'Duas alunas rindo numa mesinha na frente de um estúdio de yoga e pilates, com uma caixa kraft de doces aberta', wide: true },
  { src: '/assets/wellness_studio_reception.jpg', alt: 'Duas amigas com bolsas de tapete provando doces na recepção de um estúdio de pilates', wide: false },
  { src: '/assets/wellness_studio_box.jpg', alt: 'Duas amigas provando doces da caixa kraft na porta de um estúdio de pilates e yoga', wide: false },
];

export default function WellnessScenes() {
  return (
    <section className="container px-4 max-w-6xl mx-auto" style={{ paddingTop: '1rem', paddingBottom: 'clamp(3rem, 6vw, 4.5rem)' }}>
      <style>{`
        .ws-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ws-grid .ws-wide { grid-column: 1 / -1; aspect-ratio: 16 / 9; }
        .ws-grid .ws-tall { aspect-ratio: 3 / 4; }
        .ws-grid img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; box-shadow: 0 18px 40px rgba(60,42,33,0.22); display: block; }
        @media (min-width: 900px) {
          .ws-grid { grid-template-columns: 1.9fr 1fr 1fr; gap: 18px; align-items: stretch; }
          .ws-grid .ws-wide { grid-column: auto; aspect-ratio: auto; }
          .ws-grid .ws-tall { aspect-ratio: 3 / 4; }
        }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#3c2a21', marginBottom: '0.75rem' }}>
          Como fica no seu espaço
        </h2>
        <p style={{ color: '#594a42', lineHeight: 1.7, fontSize: '1.02rem', maxWidth: '620px', margin: '0 auto' }}>
          A aula termina, a caixa abre na recepção e todo mundo fica mais um pouco. É esse momento que a gente leva para o seu estúdio.
        </p>
      </div>
      <div className="ws-grid">
        {SCENES.map((s) => (
          <div key={s.src} className={s.wide ? 'ws-wide' : 'ws-tall'}>
            <ZoomableImage src={s.src} alt={s.alt} thumbWidth={s.wide ? 1200 : 640} />
          </div>
        ))}
      </div>
    </section>
  );
}
