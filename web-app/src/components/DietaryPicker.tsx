'use client';

import React, { useState } from 'react';
import { ALLERGENS, ALLERGEN_GROUPS } from '@/lib/allergens';
import { DIET_GROUPS, DIET_TAGS, QUICK_TAGS } from '@/lib/dietary';

export interface DietaryValue {
  tags: string[];
  allergens: string[];
  notes: string;
}

interface Props {
  value: DietaryValue;
  onChange: (value: DietaryValue) => void;
  /** Checkout: everything past the quick row starts folded away. */
  compact?: boolean;
  /** The free-text field. Off in the tightest places. */
  showNotes?: boolean;
  /** 'business': a hotel, restaurant... saying what its guests or clients need, instead of what "I" eat. */
  audience?: 'me' | 'business';
}

const chip = (on: boolean): React.CSSProperties => ({
  padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid',
  borderColor: on ? '#d4af37' : '#e8e1d7',
  background: on ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.7)',
  color: on ? '#3c2a21' : '#7a6a61',
  fontWeight: on ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
  fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.3,
});

const groupTitle: React.CSSProperties = {
  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#a6832b', fontWeight: 800, marginBottom: '0.5rem',
};

const expander = (open: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
  padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer',
  border: `1px dashed ${open ? '#d4af37' : '#e0d6c8'}`,
  background: open ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.55)',
  color: '#594a42', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
});

const countPill = (n: number): React.CSSProperties => ({
  marginLeft: 'auto', background: n ? '#d4af37' : '#eee7db', color: n ? '#fff' : '#a89a90',
  borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.78rem', fontWeight: 800,
});

/**
 * How someone eats, in as much detail as they want to give.
 *
 * The five familiar chips stay on top and always visible; everything else is
 * behind two folds, so the checkout doesn't grow a wall of boxes. What's chosen
 * here is what lets us tell that person "esta caixa é segura para você" later —
 * the allergy ids are the same ones each treat declares.
 */
export default function DietaryPicker({ value, onChange, compact = true, showNotes = true, audience = 'me' }: Props) {
  const { tags, allergens, notes } = value;
  const biz = audience === 'business';
  const groupLabel = (id: string, fallback: string) =>
    biz ? (id === 'jeito' ? 'Estilo de alimentação dos clientes' : id === 'saude' ? 'Restrições de saúde dos clientes' : fallback) : fallback;
  const [openMore, setOpenMore] = useState(!compact);
  const [openAllergens, setOpenAllergens] = useState(!compact);

  const set = (patch: Partial<DietaryValue>) => onChange({ ...value, ...patch });
  const toggleTag = (id: string) => set({ tags: tags.includes(id) ? tags.filter(t => t !== id) : [...tags, id] });
  const toggleAllergen = (id: string) => set({ allergens: allergens.includes(id) ? allergens.filter(a => a !== id) : [...allergens, id] });

  const moreCount = tags.filter(t => !QUICK_TAGS.some(q => q.id === t)).length;

  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      {/* The five everyone recognises */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {QUICK_TAGS.map(t => {
          const on = tags.includes(t.id);
          return (
            <button key={t.id} type="button" aria-pressed={on} onClick={() => toggleTag(t.id)} style={chip(on)}>
              {on ? '✓ ' : ''}{t.emoji} {t.label}
            </button>
          );
        })}
      </div>

      {/* Everything else about how they eat */}
      <div>
        <button type="button" aria-expanded={openMore} onClick={() => setOpenMore(o => !o)} style={expander(openMore)}>
          <span aria-hidden>{openMore ? '▾' : '▸'}</span>
          {biz ? 'Mais estilos de alimentação e restrições de saúde' : 'Mais sobre como você come'}
          <span style={countPill(moreCount)}>{moreCount || '+'}</span>
        </button>
        {openMore && (
          <div style={{ display: 'grid', gap: '1rem', padding: '1rem 0.25rem 0' }}>
            {DIET_GROUPS.map(group => {
              const items = DIET_TAGS.filter(t => t.group === group.id && !t.quick);
              if (!items.length) return null;
              return (
                <div key={group.id}>
                  <p style={groupTitle}>{groupLabel(group.id, group.label)}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {items.map(t => {
                      const on = tags.includes(t.id);
                      return (
                        <button key={t.id} type="button" aria-pressed={on} onClick={() => toggleTag(t.id)} title={t.hint} style={chip(on)}>
                          {on ? '✓ ' : ''}{t.emoji} {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Allergies — the same vocabulary the treats use */}
      <div>
        <button type="button" aria-expanded={openAllergens} onClick={() => setOpenAllergens(o => !o)} style={expander(openAllergens)}>
          <span aria-hidden>{openAllergens ? '▾' : '▸'}</span>
          Alergias e intolerâncias
          <span style={countPill(allergens.length)}>{allergens.length || '+'}</span>
        </button>
        {openAllergens && (
          <div style={{ display: 'grid', gap: '1rem', padding: '1rem 0.25rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: '#7a6a61', lineHeight: 1.65, margin: 0 }}>
              {biz ? (
                <>Marque o que o seu negócio precisa evitar. A gente confere <strong>cada doce</strong> contra a lista e avisa com honestidade, inclusive quando é só risco de contato na mesma cozinha. 💛</>
              ) : (
                <>Marque o que você precisa evitar. A gente confere <strong>cada doce</strong> da caixa contra a sua lista
                e te avisa antes — inclusive quando é só risco de contato na mesma cozinha. 💛</>
              )}
            </p>
            {ALLERGEN_GROUPS.map(group => {
              const items = ALLERGENS.filter(a => a.group === group.id);
              if (!items.length) return null;
              return (
                <div key={group.id}>
                  <p style={groupTitle}>{group.label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {items.map(a => {
                      const on = allergens.includes(a.id);
                      return (
                        <button key={a.id} type="button" aria-pressed={on} onClick={() => toggleAllergen(a.id)} title={a.hint} style={chip(on)}>
                          {on ? '✓ ' : ''}{a.emoji} {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNotes && (
        <div>
          <textarea
            rows={2}
            value={notes}
            onChange={e => set({ notes: e.target.value })}
            placeholder="Mais alguma coisa que a gente deva saber? (ex: evito frutas muito doces, meu filho é alérgico a…)"
            style={{
              width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px',
              background: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}
