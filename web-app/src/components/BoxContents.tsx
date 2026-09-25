'use client';

import React, { useState } from 'react';
import { BoxItem, summarizeAllergens } from '@/lib/allergens';
import TreatInfo, { AllergenChips } from '@/components/TreatInfo';
import { optimizedSrc } from '@/lib/thumbs';

const chip = (tone: 'contains' | 'may'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.28rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
  ...(tone === 'contains'
    ? { background: '#fdecea', color: '#b03a2e', border: '1px solid #f5b7b1' }
    : { background: '#fff4e0', color: '#8a5a00', border: '1px solid #f0d09a' }),
});

/**
 * "O que vem na caixa": one big title per treat that opens into a photo, a
 * description, the ingredients and the allergens. The box-wide allergen summary
 * sits on top, because that's what someone with an allergy looks for first.
 */
export default function BoxContents({ items }: { items: BoxItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const visible = items.filter(i => i.name?.trim());
  if (visible.length === 0) return null;

  const summary = summarizeAllergens(visible);

  return (
    <section style={{ padding: 'clamp(2rem, 7vw, 5rem) 1rem 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ color: '#a6832b', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.9rem' }}>
            Nesta edição
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', color: '#3c2a21', lineHeight: 1.15, marginBottom: '0.9rem' }}>
            O que vem na caixa
          </h2>
          <p style={{ color: '#594a42', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto' }}>
            {visible.length} {visible.length === 1 ? 'doce feito' : 'doces feitos'} à mão pela Dolly. Toque em cada um para ver a foto, os ingredientes e os alérgenos.
          </p>
        </div>

        {/* Accordion */}
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {visible.map((item, idx) => {
            const isOpen = open === item.id;
            return (
              <div key={item.id} style={{ background: '#fff', border: isOpen ? '1px solid #d4af37' : '1px solid #e8e1d7', borderRadius: '22px', overflow: 'hidden', boxShadow: isOpen ? '0 16px 40px rgba(60,42,33,0.12)' : '0 4px 14px rgba(60,42,33,0.05)', transition: 'box-shadow 0.3s, border-color 0.3s' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span aria-hidden style={{ width: '52px', height: '52px', flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg, #fdf1d6, #fbe3a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                    {item.emoji || '🍫'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a6832b', fontWeight: 700 }}>Doce {idx + 1}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.05rem, 2.8vw, 1.5rem)', color: '#3c2a21', lineHeight: 1.2 }}>{item.name}</span>
                  </span>
                  {item.contains?.length > 0 && !isOpen && (
                    <span style={{ ...chip('contains'), flexShrink: 0 }} className="box-allergen-badge">⚠️ {item.contains.length}</span>
                  )}
                  <span aria-hidden style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: isOpen ? '#d4af37' : '#f5efe2', color: isOpen ? '#fff' : '#3c2a21', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }}>+</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0.25rem 1.25rem 1.6rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', alignItems: 'start' }}>
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={optimizedSrc(item.image_url, 750)} alt={item.name} loading="lazy" decoding="async" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '16px', display: 'block' }} />
                    )}
                    <div style={{ gridColumn: item.image_url ? undefined : '1 / -1' }}>
                      {item.description && (
                        <p style={{ color: '#594a42', lineHeight: 1.85, marginBottom: '1.25rem' }}>{item.description}</p>
                      )}

                      <TreatInfo ingredients={item.ingredients} contains={item.contains} may_contain={item.may_contain} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Box-wide summary */}
        <div style={{ marginTop: '2rem', background: '#fdf7ee', border: '1px solid #e8e1d7', borderRadius: '20px', padding: '1.4rem 1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#3c2a21', marginBottom: '1rem' }}>Alérgenos da caixa inteira</p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b03a2e', fontWeight: 700, marginBottom: '0.5rem' }}>⚠️ Contém</p>
              {summary.contains.length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}><AllergenChips ids={summary.contains.map(a => a.id)} tone="contains" /></div>
                : <p style={{ color: '#7a6a61', fontSize: '0.9rem' }}>Nenhum dos principais alérgenos declarados.</p>}
            </div>
            {summary.mayContain.length > 0 && (
              <div>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a5a00', fontWeight: 700, marginBottom: '0.5rem' }}>🔸 Pode conter (contaminação cruzada)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}><AllergenChips ids={summary.mayContain.map(a => a.id)} tone="may" /></div>
              </div>
            )}
          </div>
          <p style={{ color: '#7a6a61', fontSize: '0.8rem', lineHeight: 1.7, marginTop: '1.1rem' }}>
            Tudo é feito na mesma cozinha, então traços de outros ingredientes podem existir mesmo quando não estão na receita.
            Se você tem alergia grave, fale com a gente no WhatsApp antes de pedir.
          </p>
        </div>
      </div>
    </section>
  );
}
