'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import ZoomableImage from '@/components/ZoomableImage';
import { DELIVERY_ZONES, formatBRL } from '@/lib/deliveryZones';
import { BOX_SIZES, SINGLE_PIECE_FROM } from '@/lib/boxSizes';

const FOOTNOTES = [
  '* Algumas criações podem conter açúcar de coco ou pequenos toques de chocolate que contêm pequenas quantidades de açúcar refinado.',
  '** Não são livres de possíveis contaminações cruzadas com glúten.',
];

/** The bird's-eye strip: four things to know before opening anything. */
const GLANCE = [
  { emoji: '🌱', label: '100% plant-based' },
  { emoji: '🧂', label: 'SOS-free*' },
  { emoji: '🌾', label: 'Ingredientes integrais' },
  { emoji: '✨', label: 'Sem glúten**' },
];

const CHIPS = ['Festas', 'Eventos', 'Celebrações', 'Mesas de sobremesa', 'Catering', 'Presentes', 'Sob encomenda'];

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem',
  padding: '0.7rem 0', borderBottom: '1px dashed rgba(60,42,33,0.2)',
};

interface Panel {
  id: string;
  emoji: string;
  title: string;
  /** The one thing worth knowing without opening the card. */
  badge: string;
  glance: string;
  body: React.ReactNode;
}

function Footnotes({ tone }: { tone: 'dark' | 'light' }) {
  return (
    <div style={{ fontSize: '0.78rem', lineHeight: 1.65, color: tone === 'dark' ? 'rgba(253,250,243,0.62)' : '#7a6a61' }}>
      {FOOTNOTES.map(f => <p key={f} style={{ marginBottom: '0.25rem' }}>{f}</p>)}
    </div>
  );
}

const panels: Panel[] = [
  {
    id: 'quem-somos',
    emoji: '🌴',
    title: 'Quem somos',
    badge: 'Mata Atlântica',
    glance: 'Boutique pâtisserie plant-based, em pequenos lotes',
    body: (
      <p>
        The Tropical Bakery é uma boutique pâtisserie plant-based de Itamambuca, no litoral da Mata Atlântica,
        que cria sobremesas tropicais em pequenos lotes, inspiradas nos ingredientes, na arte e na natureza brasileira.
      </p>
    ),
  },
  {
    id: 'caixas',
    emoji: '📦',
    title: 'Caixas de Degustação',
    badge: 'Toda semana',
    glance: 'Edições semanais e alternadas, curadas pela Chef Dolly',
    body: (
      <>
        <p>
          Somos especializados em edições semanais e alternadas de caixas de degustação de luxo, cuidadosamente
          curadas para revelar pequenas joias comestíveis e sabores inovadores, com foco em saúde e ingredientes premium.
        </p>
        <p className="phil-quote">
          Uma coleção boutique de joias comestíveis — saudáveis, luxuosas e feitas à mão pela Chef Dolly, da Bélgica.
        </p>
        <div className="phil-cta-row">
          <Link href="/caixas" className="phil-cta">Ver a caixa da semana</Link>
          <Link href="/assinatura" className="phil-cta phil-cta-ghost">Assinar toda semana</Link>
        </div>
      </>
    ),
  },
  {
    id: 'precos',
    emoji: '💛',
    title: 'Opções e preços',
    badge: `desde R$ ${SINGLE_PIECE_FROM}`,
    glance: 'Caixas de 2, 4 ou 6 peças, e peças avulsas',
    body: (
      <>
        <div>
          {BOX_SIZES.map(size => (
            <div key={size.pieces} style={rowStyle}>
              <span>Caixa com <strong>{size.pieces} peças</strong></span>
              <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>R$ {size.price}</strong>
            </div>
          ))}
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span>Peças avulsas</span>
            <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>a partir de R$ {SINGLE_PIECE_FROM}/un.</strong>
          </div>
        </div>
        <div className="phil-cta-row">
          <Link href="/caixas" className="phil-cta">Escolher minha caixa</Link>
        </div>
      </>
    ),
  },
  {
    id: 'ingredientes',
    emoji: '🌿',
    title: 'O que tem dentro',
    badge: '100% plant-based',
    glance: 'SOS-free, integral e sem glúten',
    body: (
      <>
        <div>
          {[
            ['🌱', '100% plant-based', 'Nenhum ingrediente de origem animal.'],
            ['🧂', 'SOS-free*', 'Sem sal, sem óleo e sem açúcar refinado.'],
            ['🌾', 'Ingredientes integrais', 'Ingredientes premium, escolhidos com foco em saúde.'],
            ['✨', 'Sem glúten**', 'Receitas sem ingredientes com glúten.'],
          ].map(([emoji, name, text]) => (
            <div key={name} style={{ display: 'flex', gap: '0.85rem', padding: '0.65rem 0', borderBottom: '1px dashed rgba(60,42,33,0.2)' }}>
              <span aria-hidden style={{ fontSize: '1.3rem', lineHeight: 1.4 }}>{emoji}</span>
              <span><strong>{name}</strong><br /><span style={{ color: '#594a42' }}>{text}</span></span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.9rem' }}><Footnotes tone="light" /></div>
      </>
    ),
  },
  {
    id: 'eventos',
    emoji: '🎉',
    title: 'Festas, eventos e encomendas',
    badge: 'Sob encomenda',
    glance: 'Mesas de sobremesa, catering e presentes',
    body: (
      <>
        <p>
          Além da coleção semanal, criamos também peças avulsas e experiências personalizadas — de mesas de
          sobremesa e catering a presentes especiais e criações sob encomenda.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', margin: '1rem 0 0.25rem' }}>
          {CHIPS.map(c => <span key={c} className="phil-chip">{c}</span>)}
        </div>
        <div className="phil-cta-row">
          <Link href="/menu" className="phil-cta">Ver o Menu de Eventos</Link>
        </div>
      </>
    ),
  },
  {
    id: 'entrega',
    emoji: '🚚',
    title: 'Entrega e retirada',
    badge: 'Grátis em Itamambuca',
    glance: 'Entregamos em Ubatuba ou você retira no home bakery',
    body: (
      <>
        <p style={{ marginBottom: '0.5rem' }}>Entrega gratuita em Itamambuca — ou retire direto no nosso home bakery.</p>
        <div>
          {DELIVERY_ZONES.map(zone => (
            <div key={zone.id} style={rowStyle}>
              <span>
                {zone.label}
                {zone.minBoxes > 1 && <span style={{ color: '#7a6a61', fontSize: '0.85rem' }}> · mín. {zone.minBoxes} caixas</span>}
              </span>
              <strong style={{ flexShrink: 0 }}>{zone.fee === 0 ? 'Grátis' : formatBRL(zone.fee)}</strong>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '1.1rem', color: '#594a42', lineHeight: 1.7 }}>
          <strong style={{ color: '#3c2a21' }}>Retirada no home bakery:</strong> escolha a retirada ao fazer o pedido e o
          endereço aparece na sua conta assim que o pagamento for confirmado.
        </p>
        <div className="phil-cta-row">
          <Link href="/minha-conta" className="phil-cta phil-cta-ghost">Ver minha conta</Link>
        </div>
      </>
    ),
  },
];

export default function PhilosophyShowcase({ featuredImage }: { featuredImage: string }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="phil-section" id="about">
      {/* Photos float over the background, like the /retreats hero. */}
      <div className="phil-collage">
        <ZoomableImage src="/menu-items/1000215018.jpg" alt="Doces tropicais The Tropical Bakery" className="phil-photo phil-photo-b" />
        <ZoomableImage src={featuredImage} alt="Filosofia Tropical" className="phil-photo phil-photo-a" />
        <ZoomableImage src="/menu-items/Screenshot_20260513_114809_Edits.jpg" alt="Doces tropicais The Tropical Bakery" className="phil-photo phil-photo-c" />
      </div>

      <div className="phil-inner">
        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{
              display: 'inline-block', color: '#d4af37', letterSpacing: '0.28em', textTransform: 'uppercase',
              fontSize: '0.78rem', fontWeight: 600, marginBottom: '1.4rem', paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(212,175,55,0.4)',
            }}>
              Itamambuca · Mata Atlântica
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.3rem, 6.5vw, 4.4rem)', lineHeight: 1.05, color: '#fdfaf3', marginBottom: '1.4rem' }}>
              Nossa Filosofia
            </h2>
            <p style={{ fontSize: 'clamp(1.05rem, 2.4vw, 1.3rem)', lineHeight: 1.7, color: 'rgba(253,250,243,0.9)' }}>
              Na The Tropical Bakery, acreditamos que a indulgência não precisa comprometer a saúde.
            </p>
          </div>

          <div className="phil-glance" role="list">
            {GLANCE.map(g => (
              <span key={g.label} role="listitem" className="phil-glance-chip">
                <span aria-hidden>{g.emoji}</span> {g.label}
              </span>
            ))}
          </div>
          <div style={{ maxWidth: '700px', margin: '1rem auto 0', textAlign: 'center' }}><Footnotes tone="dark" /></div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p style={{ textAlign: 'center', color: '#d4af37', fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, margin: 'clamp(2rem, 5vw, 3rem) 0 1.1rem' }}>
            Toque para saber mais
          </p>
          <div className="phil-grid">
            {panels.map(panel => {
              const isOpen = open === panel.id;
              return (
                <div key={panel.id} className="phil-card" data-open={isOpen}>
                  <button
                    type="button"
                    className="phil-head"
                    aria-expanded={isOpen}
                    aria-controls={`phil-${panel.id}`}
                    onClick={() => setOpen(isOpen ? null : panel.id)}
                  >
                    <span aria-hidden className="phil-icon">{panel.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="phil-badge">{panel.badge}</span>
                      <span className="phil-title">{panel.title}</span>
                      <span className="phil-glance-text">{panel.glance}</span>
                    </span>
                    <span aria-hidden className="phil-plus">+</span>
                  </button>
                  <div className="phil-body" id={`phil-${panel.id}`} role="region" aria-label={panel.title}>
                    <div className="phil-body-inner">
                      <div className="phil-body-pad">{panel.body}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
