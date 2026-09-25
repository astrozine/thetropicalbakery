'use client';

import React from 'react';
import { EXPERIENCE_PHOTOS } from '@/lib/retreatRooms';
import { optimizedSrc } from '@/lib/thumbs';

interface Props {
  onInquire: (interest: string) => void;
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
      'Técnicas sem glúten e sem açúcar refinado',
      'Degustação e receitas para levar para casa',
    ],
  },
];

export default function RetreatTracks({ onInquire }: Props) {
  return (
    <section style={{ background: '#f5efe2', padding: 'clamp(2.25rem, 8vw, 7rem) clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: '#a6832b', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
            Pacotes de retiro
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#3c2a21', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Escolha o foco da sua estadia
          </h2>
          <p style={{ color: '#594a42', fontSize: '1.08rem', lineHeight: 1.85, maxWidth: '700px', margin: '0 auto' }}>
            Cada retiro é montado com você, de 2 a 7 noites, em qualquer uma das acomodações acima. Escolha um foco ou combine os três.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
          {TRACKS.map(t => (
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
                <button type="button" onClick={() => onInquire(`Retiro — ${t.title}`)} className="btn btn-primary" style={{ padding: '0.85rem 1.4rem', fontSize: '0.95rem' }}>
                  Quero este foco
                </button>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#a89a90', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          O que está incluído varia conforme a época e o tamanho do grupo; confirmamos tudo com você antes da reserva.
        </p>
      </div>
    </section>
  );
}
