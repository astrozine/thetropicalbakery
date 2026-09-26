import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import WhatsAppGate from '@/components/WhatsAppGate';

export const metadata: Metadata = {
  title: 'Todas as Parcerias | The Tropical Bakery',
  description:
    'Hotéis, pousadas, Airbnbs, restaurantes, padarias, travel managers e afiliados — conheça todas as formas de crescer junto com a The Tropical Bakery em Itamambuca e Ubatuba.',
};

const PARTNERSHIPS = [
  {
    slug: '/b2b/hotels',
    eyebrow: 'Hospedagem · Premium',
    title: 'Hotéis',
    tagline:
      'Uma The Tropical Bakery dentro do seu hotel — mini-fridge de exposição, café da manhã artesanal e pedido por QR code em cada quarto. Receita extra sem esforço da sua equipe.',
    image: '/assets/realistic_hotel.jpg',
    treat: '/b2b-hero/treat-1.jpg',
    emoji: '🏨',
    tags: ['Mini Fridge', 'Café da Manhã', 'QR Code'],
  },
  {
    slug: '/b2b/pousadas',
    eyebrow: 'Hospedagem · Boutique',
    title: 'Pousadas',
    tagline:
      'Café da manhã inesquecível que vira avaliação 5 estrelas — ou uma mini-loja que se paga sozinha. Ideal para quem já oferece hospitalidade de verdade.',
    image: '/assets/glamorous_pousada_1789884603550.jpg',
    treat: '/b2b-hero/treat-9.jpg',
    emoji: '🌿',
    tags: ['Mini Fridge', 'Café da Manhã', 'QR Code'],
  },
  {
    slug: '/b2b/airbnbs',
    eyebrow: 'Temporada · Itamambuca',
    title: 'Airbnbs',
    tagline:
      'Uma casa em Itamambuca, Félix ou Prumirim já vende o paraíso — a gente entrega a parte gastronômica que faz o hóspede comentar na review.',
    image: '/assets/airbnb_breakfast_tray_1789884624300.jpg',
    treat: '/b2b-hero/treat-8.jpg',
    emoji: '🏡',
    tags: ['Café Artesanal', 'Entrega na Porta', 'QR Code'],
  },
  {
    slug: '/b2b/restaurants',
    eyebrow: 'Food Service · Atacado',
    title: 'Restaurantes',
    tagline:
      'Sobremesas com a cara do seu restaurante, 100% veganas e sem glúten. A Dolly cria, você recebe pronto — sua equipe só finaliza o prato.',
    image: '/assets/tropical_restaurant_vegan_1789884909542.jpg',
    treat: '/b2b-hero/treat-3.jpg',
    emoji: '🍽️',
    tags: ['Cardápio Personalizado', 'Entrega Sob Demanda', 'Sem Glúten'],
  },
  {
    slug: '/b2b/bakeries',
    eyebrow: 'Varejo · Vitrine Inclusiva',
    title: 'Padarias',
    tagline:
      'Expanda sua vitrine com opções SOS-Free sem sobrecarregar sua produção. Atenda quem hoje sai de mãos vazias.',
    image: '/assets/realistic_bakery.jpg',
    treat: '/b2b-hero/treat-4.jpg',
    emoji: '🥐',
    tags: ['Criação Personalizada', 'Pronto para Vender', 'Zero Contaminação'],
  },
  {
    slug: '/b2b/travel-managers',
    eyebrow: 'Pacotes de Retiro · Comissão',
    title: 'Travel Managers',
    tagline:
      'Monte um retiro completo em Itamambuca — hospedagem, cursos, assinatura e experiências — com comissão para você. Tudo em uma só parceria.',
    image: '/retreats/real-itamambuca-aerial.jpg',
    treat: '/retreats/Room with open ripada door.jpg',
    emoji: '✈️',
    tags: ['Pacote Sob Medida', 'Comissionamento', 'Yoga & Bem-Estar'],
  },
  {
    slug: '/b2b/affiliates',
    eyebrow: 'Digital · Indicação',
    title: 'Afiliados',
    tagline:
      'Você indica, a gente entrega, você ganha. Um código exclusivo, comissão por caixa vendida e descontos para quem você indica.',
    image: '/assets/brazilian_beach_bakery_1789884714986.jpg',
    treat: '/b2b-hero/treat-6.jpg',
    emoji: '🔗',
    tags: ['Código Exclusivo', 'Comissão por Venda', 'Desconto para Indicados'],
  },
];

export default function TodasAsParcerias() {
  return (
    <main style={{ background: 'var(--color-background)', minHeight: '100vh' }}>

      {/* ── Yellow intro banner (same spirit as the yellow boxes on other pages) ── */}
      <section style={{
        background: 'linear-gradient(135deg, #f4d675 0%, #e8c23a 100%)',
        padding: 'clamp(3.5rem, 8vw, 6rem) 1.5rem clamp(3rem, 7vw, 5rem)',
        textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 800,
          color: '#7a5a14',
          marginBottom: '0.75rem',
        }}>
          Programa de Parceria B2B
        </span>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          color: '#3c2a21',
          lineHeight: 1.1,
          marginBottom: '1.25rem',
          fontWeight: 900,
        }}>
          Todas as Parcerias
        </h1>
        <p style={{
          maxWidth: '640px',
          margin: '0 auto 2rem',
          fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
          color: '#5a3d10',
          lineHeight: 1.75,
          fontWeight: 500,
        }}>
          Do hotel de beira-mar ao afiliado digital — crescer junto com a The Tropical Bakery
          cabe em muitos formatos. Conheça cada um e descubra qual é o seu.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
          {['🏨 Hotéis', '🌿 Pousadas', '🏡 Airbnbs', '🍽️ Restaurantes', '🥐 Padarias', '✈️ Travel Managers', '🔗 Afiliados'].map(t => (
            <span key={t} style={{
              background: 'rgba(60,42,33,0.1)',
              color: '#3c2a21',
              border: '1px solid rgba(60,42,33,0.18)',
              borderRadius: '999px',
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── Alternating partnership cards ── */}
      <section style={{ padding: 'clamp(3rem, 7vw, 5rem) 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(1.75rem, 4vw, 2.75rem)' }}>
          {PARTNERSHIPS.map((p, i) => {
            const reversed = i % 2 !== 0;
            return (
              <article
                key={p.slug}
                style={{
                  background: '#fff',
                  border: '1px solid #efe4c8',
                  borderRadius: '28px',
                  boxShadow: '0 10px 30px rgba(60,42,33,0.09)',
                  padding: 'clamp(1.25rem, 3.5vw, 2.5rem)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
                  gap: 'clamp(2rem, 5vw, 4rem)',
                  alignItems: 'center',
                  direction: reversed ? 'rtl' : 'ltr',
                }}
              >
                {/* Image side */}
                <div style={{ position: 'relative', direction: 'ltr' }}>
                  <div style={{
                    aspectRatio: '4/3',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(60,42,33,0.14)',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  {/* Floating treat photo */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-16px',
                    [reversed ? 'left' : 'right']: '-12px',
                    width: '130px',
                    aspectRatio: '1',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '4px solid #fff',
                    boxShadow: '0 10px 30px rgba(60,42,33,0.22)',
                    transform: reversed ? 'rotate(-4deg)' : 'rotate(4deg)',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.treat} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

                {/* Text side */}
                <div style={{ direction: 'ltr' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.68rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    color: '#a6832b',
                    marginBottom: '0.6rem',
                  }}>
                    {p.eyebrow}
                  </span>
                  <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    color: '#3c2a21',
                    lineHeight: 1.1,
                    marginBottom: '1rem',
                    fontWeight: 900,
                  }}>
                    {p.emoji} {p.title}
                  </h2>
                  <p style={{
                    color: '#594a42',
                    lineHeight: 1.8,
                    fontSize: 'clamp(0.97rem, 1.8vw, 1.08rem)',
                    marginBottom: '1.25rem',
                  }}>
                    {p.tagline}
                  </p>
                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.75rem' }}>
                    {p.tags.map(t => (
                      <span key={t} style={{
                        background: '#fdf1d6',
                        color: '#7a5a14',
                        borderRadius: '999px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}>{t}</span>
                    ))}
                  </div>
                  {/* CTA */}
                  <Link
                    href={p.slug}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#3c2a21',
                      color: '#f4d675',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      letterSpacing: '0.05em',
                      padding: '0.9rem 2rem',
                      borderRadius: '999px',
                      textDecoration: 'none',
                      transition: 'background 0.2s, transform 0.2s',
                    }}
                    className="b2b-index-cta"
                  >
                    Conhecer a parceria →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Yellow bottom CTA box ── */}
      <section style={{
        background: 'linear-gradient(135deg, #f4d675 0%, #e8c23a 100%)',
        margin: 'clamp(2rem, 5vw, 4rem) 1.5rem',
        borderRadius: '32px',
        padding: 'clamp(3rem, 7vw, 5rem) clamp(1.5rem, 5vw, 4rem)',
        textAlign: 'center',
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 'clamp(3rem, 7vw, 5rem)',
      }}>
        <span style={{
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight: 800,
          color: '#7a5a14',
          display: 'block',
          marginBottom: '0.75rem',
        }}>
          Não encontrou o seu perfil?
        </span>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          color: '#3c2a21',
          marginBottom: '1rem',
          fontWeight: 900,
        }}>
          Fale com a Gente
        </h2>
        <p style={{
          color: '#5a3d10',
          lineHeight: 1.75,
          maxWidth: '540px',
          margin: '0 auto 2rem',
          fontSize: 'clamp(0.97rem, 1.8vw, 1.1rem)',
          fontWeight: 500,
        }}>
          Se você tem uma ideia de parceria que não está aqui — um hotel boutique fora da região,
          uma marca de lifestyle, um espaço de bem-estar — a Dolly adoraria ouvir.
        </p>
        <WhatsAppGate
          href="https://wa.me/5511932119196?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20uma%20parceria%20com%20a%20The%20Tropical%20Bakery!"
          topic="Parceria: fale com a gente"
          tags={['parceiro']}
          style={{
            display: 'inline-block',
            background: '#3c2a21',
            color: '#f4d675',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '0.06em',
            padding: '1rem 2.5rem',
            borderRadius: '999px',
            textDecoration: 'none',
          }}
        >
          Falar com o Comercial no WhatsApp
        </WhatsAppGate>
      </section>

    </main>
  );
}
