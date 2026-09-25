'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { optimizedSrc } from '@/lib/thumbs';

interface Highlight {
  id: string;
  image_url: string;
  title: string;
  description: string;
}

// Same fallback the homepage's "Destaques Anteriores" uses when nothing is set up in the admin.
const FALLBACK: Highlight[] = [
  { id: 'f1', image_url: '/box1.jpg', title: 'O Clássico Tropical', description: 'Doces refinados com o toque inconfundível da nossa padaria.' },
  { id: 'f2', image_url: '/box2.jpg', title: 'Seleção Premium', description: 'Texturas marcantes e ingredientes frescos.' },
  { id: 'f3', image_url: '/box3.jpg', title: 'Edição Tropical', description: 'Uma criação nova, feita à mão a cada semana.' },
  { id: 'f4', image_url: '/box4.jpg', title: 'Surpresa da Dolly', description: 'O que está no melhor momento, na sua caixa.' },
];

function Card({ h, tilt, delay }: { h: Highlight; tilt: number; delay: number }) {
  return (
    <figure
      className="hh-card"
      style={{ ['--tilt' as string]: `${tilt}deg`, animationDelay: `${delay}s` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedSrc(h.image_url, 384)} alt={h.title} loading="lazy" decoding="async" />
      <figcaption>
        <span className="hh-tag">Destaque anterior</span>
        <strong>{h.title}</strong>
        <span className="hh-desc">{h.description}</span>
      </figcaption>
    </figure>
  );
}

/**
 * A hero with cute floating "highlight" cards on either side of the centered
 * copy (the same items as the homepage's Destaques Anteriores). On narrow
 * screens there's no room beside the text, so the cards become a swipeable row
 * underneath it instead.
 */
export default function HighlightsHero({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Highlight[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from('highlights')
      .select('id, image_url, title, description')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Top up with the fallbacks so there's always something on both sides.
          const extra = FALLBACK.filter(f => !data.some(d => d.image_url === f.image_url));
          setItems([...data, ...extra].slice(0, 4));
        }
      });
  }, []);

  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <div className="hh-grid">
      <div className="hh-side hh-side-left">
        {left.map((h, i) => <Card key={h.id} h={h} tilt={i % 2 === 0 ? -5 : 3} delay={i * 0.7} />)}
      </div>
      <div className="hh-center">{children}</div>
      <div className="hh-side hh-side-right">
        {right.map((h, i) => <Card key={h.id} h={h} tilt={i % 2 === 0 ? 5 : -3} delay={0.35 + i * 0.7} />)}
      </div>
      <div className="hh-row hide-scrollbar">
        {items.map((h, i) => <Card key={h.id} h={h} tilt={i % 2 === 0 ? -3 : 3} delay={0} />)}
      </div>
    </div>
  );
}
