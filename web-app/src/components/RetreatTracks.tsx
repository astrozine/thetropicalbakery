'use client';

import React from 'react';
import { EXPERIENCE_PHOTOS } from '@/lib/retreatRooms';
import { optimizedSrc } from '@/lib/thumbs';

interface Props {
  onInquire: (interest: string) => void;
  /** English on /en/retreats, Spanish on /es/retiros; Portuguese otherwise. */
  locale?: 'pt' | 'en' | 'es';
}

// EXPERIENCE_PHOTOS: 1 fruit, 2 green juice, 3 yoga mat, 4 fruit bowls, 5 beach, 6 surfboard
const TRACKS = [
  {
    title: 'Saúde & Nutrição',
    photo: EXPERIENCE_PHOTOS[3],
    intro: 'Para quem quer entender a lógica de comer bem e levar isso para casa.',
    items: [
      'Aulas práticas de preparo de refeições veganas, sem sal, óleo e açúcar refinado',
      'Como montar um prato com a lógica dos G-BOMBS',
      'Compras e despensa: o que procurar e o que evitar nos rótulos',
      'Sobremesas que combinam com essa rotina',
    ],
  },
  {
    title: 'Natureza & Movimento',
    photo: EXPERIENCE_PHOTOS[2],
    intro: 'Para quem quer desacelerar, se mexer e voltar para dentro da natureza.',
    items: [
      'Yoga ao amanhecer, perto da praia',
      'Trilhas e banhos de cachoeira na região',
      'Caiaque no rio de Itamambuca e aulas de surf com as escolas locais',
      'Tempo livre de verdade, com praia e silêncio',
    ],
  },
  {
    title: 'Cozinha & Confeitaria',
    photo: EXPERIENCE_PHOTOS[0],
    intro: 'Para quem quer aprender a fazer os doces que a gente faz.',
    items: [
      'Workshops práticos de confeitaria saudável com a Dolly',
      'Técnicas sem trigo e sem açúcar refinado',
      'Degustação e receitas para levar para casa',
    ],
  },
];

const TRACKS_EN: typeof TRACKS = [
  {
    title: 'Health & Nutrition',
    photo: EXPERIENCE_PHOTOS[3],
    intro: 'For anyone who wants to understand how to eat well, and take it home.',
    items: [
      'Hands-on classes making vegan meals without salt, oil or refined sugar',
      'How to build a plate around the G-BOMBS idea',
      'Shopping and pantry: what to look for and what to avoid on labels',
      'Desserts that fit this way of eating',
    ],
  },
  {
    title: 'Nature & Movement',
    photo: EXPERIENCE_PHOTOS[2],
    intro: 'For anyone who wants to slow down, move and get back into nature.',
    items: [
      'Yoga at sunrise, near the beach',
      'Hikes and waterfall swims in the area',
      'Kayaking on the Itamambuca river, and surf lessons with the local schools',
      'Real free time, with the beach and some quiet',
    ],
  },
  {
    title: 'Kitchen & Baking',
    photo: EXPERIENCE_PHOTOS[0],
    intro: 'For anyone who wants to learn to make the treats we make.',
    items: [
      'Hands-on healthy baking workshops with Dolly',
      'Wheat-free techniques, with no refined sugar',
      'Tastings, and recipes to take home',
    ],
  },
];

const TRACKS_ES: typeof TRACKS = [
  {
    title: 'Salud y Nutrición',
    photo: EXPERIENCE_PHOTOS[3],
    intro: 'Para quien quiere entender cómo comer bien y llevárselo a casa.',
    items: [
      'Clases prácticas de comidas veganas, sin sal, aceite ni azúcar refinado',
      'Cómo armar un plato con la lógica de los G-BOMBS',
      'Compras y despensa: qué buscar y qué evitar en las etiquetas',
      'Postres que encajan con esta forma de comer',
    ],
  },
  {
    title: 'Naturaleza y Movimiento',
    photo: EXPERIENCE_PHOTOS[2],
    intro: 'Para quien quiere bajar el ritmo, moverse y volver a la naturaleza.',
    items: [
      'Yoga al amanecer, cerca de la playa',
      'Senderos y baños de cascada en la zona',
      'Kayak en el río de Itamambuca y clases de surf con las escuelas locales',
      'Tiempo libre de verdad, con playa y silencio',
    ],
  },
  {
    title: 'Cocina y Pastelería',
    photo: EXPERIENCE_PHOTOS[0],
    intro: 'Para quien quiere aprender a hacer los dulces que hacemos.',
    items: [
      'Talleres prácticos de pastelería saludable con Dolly',
      'Técnicas sin trigo y sin azúcar refinado',
      'Degustación y recetas para llevar a casa',
    ],
  },
];

const COPY = {
  pt: {
    eyebrow: 'Pacotes de retiro',
    title: 'Escolha o foco da sua estadia',
    intro: 'Cada retiro é montado com você, de 2 a 7 noites, em qualquer uma das acomodações acima. Escolha um foco ou combine os três.',
    cta: 'Quero este foco',
    interest: (title: string) => `Retiro — ${title}`,
    note: 'O que está incluído varia conforme a época e o tamanho do grupo; confirmamos tudo com você antes da reserva.',
    tracks: TRACKS,
  },
  en: {
    eyebrow: 'Retreat packages',
    title: 'Choose the focus of your stay',
    intro: 'Every retreat is planned with you, from 2 to 7 nights, in any of the rooms above. Pick one focus or combine all three.',
    cta: 'Choose this focus',
    interest: (title: string) => `Retreat — ${title}`,
    note: 'What’s included depends on the season and the size of your group; we confirm everything with you before you book.',
    tracks: TRACKS_EN,
  },
  es: {
    eyebrow: 'Paquetes de retiro',
    title: 'Elige el enfoque de tu estadía',
    intro: 'Cada retiro se arma contigo, de 2 a 7 noches, en cualquiera de los alojamientos de arriba. Elige un enfoque o combina los tres.',
    cta: 'Quiero este enfoque',
    interest: (title: string) => `Retiro — ${title}`,
    note: 'Lo que está incluido varía según la temporada y el tamaño del grupo; confirmamos todo contigo antes de reservar.',
    tracks: TRACKS_ES,
  },
};

export default function RetreatTracks({ onInquire, locale = 'pt' }: Props) {
  const c = COPY[locale] ?? COPY.pt;
  return (
    <section style={{ background: '#f5efe2', padding: 'clamp(2.25rem, 8vw, 7rem) clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: '#a6832b', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
            {c.eyebrow}
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#3c2a21', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            {c.title}
          </h2>
          <p style={{ color: '#594a42', fontSize: '1.08rem', lineHeight: 1.85, maxWidth: '700px', margin: '0 auto' }}>
            {c.intro}
          </p>
        </div>

        <div className="tb-rail" style={{ display: 'grid', gap: '1.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
          {c.tracks.map(t => (
            <div key={t.title} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(60,42,33,0.08)', display: 'flex', flexDirection: 'column' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(t.photo, 750)} alt="" loading="lazy" decoding="async" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '1.6rem 1.5rem 1.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', color: '#3c2a21', marginBottom: '0.5rem' }}>{t.title}</h3>
                <p style={{ color: '#7a6a61', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.1rem' }}>{t.intro}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                  {t.items.map(item => (
                    <li key={item} style={{ display: 'flex', gap: '0.6rem', color: '#594a42', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.55rem' }}>
                      <span style={{ color: '#d4af37', flexShrink: 0 }}>✦</span>{item}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => onInquire(c.interest(t.title))} className="btn btn-primary" style={{ padding: '0.85rem 1.4rem', fontSize: '0.95rem' }}>
                  {c.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#a89a90', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          {c.note}
        </p>
      </div>
    </section>
  );
}
