import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import WhatsAppGate from '@/components/WhatsAppGate';

export const metadata: Metadata = {
  title: 'Todas as Parcerias | The Tropical Bakery',
  description:
    'Hotéis, pousadas, Airbnbs, restaurantes, padarias, barcos, estúdios de yoga, academias, spas, travel managers e afiliados — conheça todas as formas de crescer junto com a The Tropical Bakery em Itamambuca e Ubatuba.',
};

const PARTNERSHIPS = [
  {
    slug: '/b2b/hotels',
    eyebrow: 'Hospedagem · Premium',
    title: 'Hotéis',
    tagline:
      'Uma The Tropical Bakery dentro do seu hotel — welcome box esperando no quarto, mini-fridge de exposição, café da manhã artesanal e pedido por QR code. Receita extra sem esforço da sua equipe.',
    image: '/assets/realistic_hotel.jpg',
    treat: '/b2b-hero/treat-1.jpg',
    emoji: '🏨',
    tags: ['Welcome Box', 'Mini Fridge', 'Café da Manhã', 'QR Code'],
  },
  {
    slug: '/b2b/pousadas',
    eyebrow: 'Hospedagem · Boutique',
    title: 'Pousadas',
    tagline:
      'Uma welcome box na suíte, um café da manhã inesquecível que vira avaliação 5 estrelas, ou uma mini-loja que se paga sozinha. Ideal para quem já oferece hospitalidade de verdade.',
    image: '/assets/glamorous_pousada_1789884603550.jpg',
    treat: '/b2b-hero/treat-9.jpg',
    emoji: '🌿',
    tags: ['Welcome Box', 'Mini Fridge', 'Café da Manhã', 'QR Code'],
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
      'Sobremesas com a cara do seu restaurante, 100% veganas e sem trigo. A Dolly cria, você recebe pronto — sua equipe só finaliza o prato.',
    image: '/assets/tropical_restaurant_vegan_1789884909542.jpg',
    treat: '/b2b-hero/treat-3.jpg',
    emoji: '🍽️',
    tags: ['Cardápio Personalizado', 'Entrega Sob Demanda', 'Sem Trigo'],
  },
  {
    slug: '/b2b/bakeries',
    eyebrow: 'Varejo · Vitrine Inclusiva',
    title: 'Padarias',
    tagline:
      'Expanda sua vitrine com opções veganas e sem trigo sem sobrecarregar sua produção. Atenda quem hoje sai de mãos vazias.',
    image: '/assets/realistic_bakery.jpg',
    treat: '/b2b-hero/treat-4.jpg',
    emoji: '🥐',
    tags: ['Criação Personalizada', 'Pronto para Vender', 'Nada Entra na Sua Cozinha'],
  },
  {
    slug: '/b2b/barcos',
    eyebrow: 'Náutica · Ubatuba e Paraty',
    title: 'Barcos e Marinas',
    tagline:
      'Um presente a bordo que o cliente lembra: caixas de doces finos entregues no píer antes do passeio, para charters, marinas e agências.',
    image: '/assets/boat_deck_box.jpg',
    treat: '/box1.jpg',
    emoji: '⛵',
    tags: ['Kit a Bordo', 'Entrega no Píer', 'Comissão'],
  },
  {
    slug: '/b2b/bem-estar',
    eyebrow: 'Bem-Estar · Yoga, Pilates, Academias e Spas',
    title: 'Yoga, Academias e Spas',
    tagline:
      'Um doce que combina com quem se cuida: 100% vegetal, sem trigo e adoçado com frutas, entregue para depois da aula, em welcome boxes de retiros e spa days.',
    image: '/assets/wellness_street_table.jpg',
    treat: '/b2b-hero/treat-5.jpg',
    emoji: '🧘',
    tags: ['Depois da Aula', 'Welcome Box', 'Retiros e Spa Day'],
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

      {/* ── Intro banner: espresso with gold, the house style since 2026-11-28 (was a yellow gradient) ── */}
      <section style={{
        background: '#2a1a12',
        padding: 'clamp(3.5rem, 8vw, 6rem) 1.5rem clamp(3rem, 7vw, 5rem)',
        textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.75rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 800,
          color: '#c9a257',
          marginBottom: '0.75rem',
        }}>
          Programa de Parceria B2B
        </span>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          color: '#faf5ec',
          lineHeight: 1.1,
          marginBottom: '1.25rem',
          fontWeight: 500,
        }}>
          Todas as Parcerias
        </h1>
        <p style={{
          maxWidth: '640px',
          margin: '0 auto 2rem',
          fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
          color: 'rgba(250,245,236,0.82)',
          lineHeight: 1.75,
          fontWeight: 400,
        }}>
          Do hotel de beira-mar ao afiliado digital — crescer junto com a The Tropical Bakery
          cabe em muitos formatos. Conheça cada um e descubra qual é o seu.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
          {/* Each chip jumps to its card further down (Andrew, 2026-11-28). The ids are the cards' own slugs. */}
          {([['Hotéis', 'hotels'], ['Pousadas', 'pousadas'], ['Airbnbs', 'airbnbs'], ['Restaurantes', 'restaurants'], ['Padarias', 'bakeries'],
            ['Barcos', 'barcos'], ['Yoga e Spas', 'bem-estar'], ['Travel Managers', 'travel-managers'], ['Afiliados', 'affiliates']] as const).map(([t, id]) => (
            <a key={t} href={`#${id}`} className="b2b-chip" style={{
              textDecoration: 'none',
              background: 'transparent',
              color: '#e8c77e',
              border: '1px solid rgba(201,162,87,0.55)',
              borderRadius: '2px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.7rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>{t}</a>
          ))}
        </div>
      </section>

      {/* ── Alternating partnership cards ── (compact on phones, 2026-11-13: shorter site) */}
      <style>{`
        @media (max-width: 699px) {
          .b2b-card { gap: 0.9rem !important; padding: 0.9rem !important; border-radius: 4px !important; }
          .b2b-card__photo { aspect-ratio: 16 / 9 !important; }
          .b2b-card__inset, .b2b-card__tags { display: none !important; }
          .b2b-card h2 { font-size: 1.45rem !important; margin-bottom: 0.5rem !important; }
          .b2b-card p { line-height: 1.6 !important; margin-bottom: 0.9rem !important; font-size: 0.95rem !important; }
          .b2b-card .b2b-index-cta { padding: 0.75rem 1.4rem !important; }
        }
        html:has(.b2b-card) { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) { html:has(.b2b-card) { scroll-behavior: auto; } }
        .b2b-card { scroll-margin-top: 120px; }
        .b2b-chip { transition: background 0.2s, color 0.2s; }
        .b2b-chip:hover, .b2b-chip:focus-visible { background: #c9a257 !important; color: #2a1a12 !important; }
      `}</style>
      <section style={{ padding: 'clamp(3rem, 7vw, 5rem) 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(1.75rem, 4vw, 2.75rem)' }}>
          {PARTNERSHIPS.map((p, i) => {
            const reversed = i % 2 !== 0;
            return (
              <article
                key={p.slug}
                id={p.slug.split('/').pop()}
                className="b2b-card"
                style={{
                  background: '#fff',
                  border: '1px solid #efe4c8',
                  borderRadius: '4px',
                  boxShadow: '0 10px 30px rgba(42,26,18,0.07)',
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
                  <div className="b2b-card__photo" style={{
                    aspectRatio: '4/3',
                    // Burle Marx beds: hard-edged curves that alternate side to side, with the gold double contour.
                    borderRadius: reversed ? '6px 999px 6px 6px / 6px 70% 6px 6px' : '999px 6px 6px 6px / 70% 6px 6px 6px',
                    overflow: 'hidden',
                    boxShadow: '0 0 0 4px #fff, 0 0 0 6px #c9a257',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  {/* Floating treat photo */}
                  <div className="b2b-card__inset" style={{
                    position: 'absolute',
                    bottom: '-16px',
                    [reversed ? 'left' : 'right']: '-12px',
                    width: '130px',
                    aspectRatio: '1',
                    borderRadius: '999px 999px 6px 6px',
                    overflow: 'hidden',
                    border: '4px solid #fff',
                    boxShadow: '0 10px 30px rgba(42,26,18,0.22)',
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
                    fontSize: '0.75rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    color: '#a8843f',
                    marginBottom: '0.6rem',
                  }}>
                    {p.eyebrow}
                  </span>
                  <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    color: '#2a1a12',
                    lineHeight: 1.1,
                    marginBottom: '1rem',
                    fontWeight: 500,
                  }}>
                    {p.title}
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
                  <div className="b2b-card__tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.75rem' }}>
                    {p.tags.map(t => (
                      <span key={t} style={{
                        background: 'transparent',
                        border: '1px solid rgba(168,132,63,0.45)',
                        color: '#7a5a14',
                        borderRadius: '2px',
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
                      background: '#2a1a12',
                      color: '#e8c77e',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      padding: '0.95rem 1.8rem',
                      borderRadius: '2px',
                      textDecoration: 'none',
                      transition: 'background 0.2s, transform 0.2s',
                    }}
                    className="b2b-index-cta"
                  >
                    Conhecer a parceria
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA: a teal bed with a rounded Burle Marx corner ── */}
      <section style={{
        background: '#1e5d54',
        margin: 'clamp(2rem, 5vw, 4rem) 1.5rem',
        borderRadius: '6px 120px 6px 6px',
        boxShadow: '0 0 0 4px var(--color-background), 0 0 0 6px #c9a257',
        padding: 'clamp(3rem, 7vw, 5rem) clamp(1.5rem, 5vw, 4rem)',
        textAlign: 'center',
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 'clamp(3rem, 7vw, 5rem)',
      }}>
        <span style={{
          fontSize: '0.75rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight: 800,
          color: '#e8c77e',
          display: 'block',
          marginBottom: '0.75rem',
        }}>
          Não encontrou o seu perfil?
        </span>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          color: '#faf5ec',
          marginBottom: '1rem',
          fontWeight: 500,
        }}>
          Fale com a Gente
        </h2>
        <p style={{
          color: 'rgba(250,245,236,0.85)',
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
            background: '#c9a257',
            color: '#2a1a12',
            fontWeight: 600,
            fontSize: '0.8rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '1rem 2rem',
            borderRadius: '2px',
            textDecoration: 'none',
          }}
        >
          Falar com o Comercial no WhatsApp
        </WhatsAppGate>
      </section>

    </main>
  );
}
