'use client';

import React from 'react';
import { allergenById } from '@/lib/allergens';

export const allergenChipStyle = (tone: 'contains' | 'may'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.28rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
  ...(tone === 'contains'
    ? { background: '#fdecea', color: '#b03a2e', border: '1px solid #f5b7b1' }
    : { background: '#fff4e0', color: '#8a5a00', border: '1px solid #f0d09a' }),
});

export function AllergenChips({ ids, tone }: { ids: string[]; tone: 'contains' | 'may' }) {
  return (
    <>
      {ids.map(id => {
        const a = allergenById(id);
        return a ? <span key={id} style={allergenChipStyle(tone)}>{a.emoji} {a.label}</span> : null;
      })}
    </>
  );
}

interface TreatInfoProps {
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
  /** Show the "no allergens declared" line when nothing is set. */
  showEmptyNote?: boolean;
}

/** Ingredients + allergens for one treat. Used by the box accordion and the Menu de Eventos cards. */
export default function TreatInfo({ ingredients, contains, may_contain, showEmptyNote = true }: TreatInfoProps) {
  const ing = ingredients || [];
  const con = contains || [];
  const may = may_contain || [];

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
        showEmptyNote && <p style={{ color: '#7a6a61', fontSize: '0.85rem' }}>🌱 Nenhum dos principais alérgenos declarados neste doce.</p>
      )}
    </div>
  );
}

/** True when there's anything to show, so cards can skip the disclosure entirely for treats without data. */
export const hasTreatInfo = (t: { ingredients?: string[] | null; contains?: string[] | null; may_contain?: string[] | null }) =>
  (t.ingredients?.length || 0) + (t.contains?.length || 0) + (t.may_contain?.length || 0) > 0;
