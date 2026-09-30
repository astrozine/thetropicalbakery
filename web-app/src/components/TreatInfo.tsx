'use client';

import React from 'react';
import { ALLERGEN_LIST_NEM, KITCHEN_FACTS, allergenById, normalizeAllergens } from '@/lib/allergens';
import { caffeineById, caffeineOf, sugarById, sugarOf } from '@/lib/sugarCaffeine';

export const allergenChipStyle = (tone: 'contains' | 'may'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.28rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
  ...(tone === 'contains'
    ? { background: '#fdecea', color: '#b03a2e', border: '1px solid #f5b7b1' }
    : { background: '#fff4e0', color: '#8a5a00', border: '1px solid #f0d09a' }),
});

export function AllergenChips({ ids, tone }: { ids: string[]; tone: 'contains' | 'may' }) {
  return (
    <>
      {normalizeAllergens(ids).map(id => {
        const a = allergenById(id);
        return a ? <span key={id} style={allergenChipStyle(tone)}>{a.emoji} {a.label}</span> : null;
      })}
    </>
  );
}

/**
 * Sugar and caffeine as two quiet chips, with the "where from" as a line under them. Only what is
 * known: caffeine found in the ingredients (cacao…) shows even before it's declared; sugar only once declared.
 */
export function SugarCaffeineChips({ ingredients, sugar, caffeine, compact = false }: {
  ingredients?: string[] | null; sugar?: string | null; caffeine?: string | null; compact?: boolean;
}) {
  const s = sugarById(sugarOf({ sugar }));
  const c = caffeineById(caffeineOf({ ingredients, caffeine }));
  if (!s && !c) return null;
  const chip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: compact ? '0.1rem 0.5rem' : '0.28rem 0.7rem', borderRadius: '20px',
    fontSize: compact ? '0.75rem' : '0.8rem', fontWeight: 600, background: '#f4f0fa', color: '#5b4a7a', border: '1px solid #ddd3ec',
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.4rem' }} aria-label="Açúcar e cafeína">
      {s && <span style={chip} title={s.hint}>{s.emoji} {s.label}</span>}
      {c && <span style={chip} title={c.hint}>{c.emoji} {c.label}</span>}
      {!compact && (
        <p style={{ flexBasis: '100%', margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#7a6a61', lineHeight: 1.55 }}>
          {[s && `${s.label}: ${s.hint}.`, c && `${c.label}: ${c.hint}.`].filter(Boolean).join(' ')}
        </p>
      )}
    </div>
  );
}

/** What is true of every treat (vegan, made without gluten), said once instead of ticked per treat. */
export function KitchenFacts({ tone = 'light', style }: { tone?: 'light' | 'dark'; style?: React.CSSProperties }) {
  const color = tone === 'dark' ? 'rgba(255,255,255,0.82)' : '#594a42';
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.45rem', ...style }}>
      {KITCHEN_FACTS.map(f => (
        <li key={f.text} style={{ display: 'flex', gap: '0.55rem', alignItems: 'baseline', color, fontSize: '0.85rem', lineHeight: 1.6 }}>
          <span aria-hidden style={{ flexShrink: 0 }}>{f.emoji}</span>
          <span>{f.text}</span>
        </li>
      ))}
    </ul>
  );
}

interface TreatInfoProps {
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
  sugar?: string | null;
  caffeine?: string | null;
  /** Show the "no allergens declared" line when nothing is set. */
  showEmptyNote?: boolean;
}

/** Ingredients + allergens for one treat. Used by the box accordion and the Menu de Eventos cards. */
export default function TreatInfo({ ingredients, contains, may_contain, sugar, caffeine, showEmptyNote = true }: TreatInfoProps) {
  const ing = ingredients || [];
  const con = normalizeAllergens(contains);
  const may = normalizeAllergens(may_contain);

  return (
    <div>
      {ing.length > 0 && (
        <div style={{ marginBottom: '1.1rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a6832b', fontWeight: 700, marginBottom: '0.6rem' }}>🌿 Ingredientes</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.5rem' }}>
            {ing.map(i => (
              <li key={i} style={{ background: '#f5efe2', color: '#594a42', fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                <span style={{ color: '#d4af37', marginRight: '0.3rem' }}>✦</span>{i}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(con.length > 0 || may.length > 0) ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {con.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b03a2e', fontWeight: 700, marginBottom: '0.5rem' }}>⚠️ Contém</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}><AllergenChips ids={con} tone="contains" /></div>
            </div>
          )}
          {may.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a5a00', fontWeight: 700, marginBottom: '0.5rem' }}>🔸 Pode conter (contaminação cruzada)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}><AllergenChips ids={may} tone="may" /></div>
            </div>
          )}
        </div>
      ) : (
        showEmptyNote && <p style={{ color: '#7a6a61', fontSize: '0.85rem' }}>🌱 Não leva {ALLERGEN_LIST_NEM}.</p>
      )}

      {(sugarOf({ sugar }) || caffeineOf({ ingredients, caffeine })) && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5b4a7a', fontWeight: 700, marginBottom: '0.5rem' }}>🍬 Açúcar e cafeína</p>
          <SugarCaffeineChips ingredients={ingredients} sugar={sugar} caffeine={caffeine} />
        </div>
      )}
    </div>
  );
}

/** True when there's anything to show, so cards can skip the disclosure entirely for treats without data. */
export const hasTreatInfo = (t: { ingredients?: string[] | null; contains?: string[] | null; may_contain?: string[] | null; sugar?: string | null }) =>
  (t.ingredients?.length || 0) + (t.contains?.length || 0) + (t.may_contain?.length || 0) > 0 || !!sugarOf(t);
