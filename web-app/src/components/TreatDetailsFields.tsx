'use client';

import React, { useState } from 'react';
import { ALLERGENS, ALLERGEN_GROUPS, TREAT_EMOJIS } from '@/lib/allergens';

/** Shared admin styles for the treat-detail editors (box treats and Menu de Eventos treats). */
export const fieldStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.95rem' };
export const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#2c3e50' };

/** Chip picker for one list of allergens ("contém" or "pode conter"). */
export function AllergenPicker({ title, hint, tone, selected, onToggle }: {
  title: string; hint: string; tone: 'contains' | 'may'; selected: string[]; onToggle: (id: string) => void;
}) {
  const on = tone === 'contains'
    ? { bg: '#fdecea', border: '#e74c3c', color: '#c0392b' }
    : { bg: '#fff4e0', border: '#e6a23c', color: '#8a5a00' };
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <p style={{ ...labelStyle, marginBottom: '0.15rem' }}>{title}</p>
      <p style={{ fontSize: '0.78rem', color: '#7f8c8d', marginBottom: '0.6rem' }}>{hint}</p>
      {ALLERGEN_GROUPS.map(g => (
        <div key={g.id} style={{ marginBottom: '0.55rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#95a5a6', marginBottom: '0.3rem' }}>{g.label}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {ALLERGENS.filter(a => a.group === g.id).map(a => {
              const active = selected.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  title={a.hint}
                  onClick={() => onToggle(a.id)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
                    border: `1px solid ${active ? on.border : '#dfe4ea'}`, background: active ? on.bg : '#fff',
                    color: active ? on.color : '#7f8c8d', fontWeight: active ? 700 : 500,
                  }}
                >
                  {a.emoji} {a.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Both allergen lists together, with the exact wording used everywhere. */
export function AllergenFields({ contains, mayContain, onChange }: {
  contains: string[]; mayContain: string[]; onChange: (next: { contains: string[]; may_contain: string[] }) => void;
}) {
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  return (
    <div style={{ background: '#fafbfc', border: '1px solid #eef1f4', borderRadius: '10px', padding: '1rem' }}>
      <AllergenPicker
        title="⚠️ Contém" tone="contains" selected={contains}
        onToggle={id => onChange({ contains: toggle(contains, id), may_contain: mayContain })}
        hint="Está na receita, como ingrediente."
      />
      <AllergenPicker
        title="🔸 Pode conter (contaminação cruzada)" tone="may" selected={mayContain}
        onToggle={id => onChange({ contains, may_contain: toggle(mayContain, id) })}
        hint="Não vai na receita, mas é manipulado na mesma cozinha ou nos mesmos utensílios (ex.: traços de glúten, castanhas, gergelim)."
      />
    </div>
  );
}

/** Ingredients one at a time: type, press + (or Enter), it becomes a removable chip. */
export function IngredientsField({ ingredients, onChange }: { ingredients: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!ingredients.some(i => i.toLowerCase() === v.toLowerCase())) onChange([...ingredients, v]);
    setDraft('');
  };
  return (
    <div>
      <label style={labelStyle}>Ingredientes</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Digite um ingrediente e clique no +" style={fieldStyle}
        />
        <button type="button" onClick={add} aria-label="Adicionar ingrediente"
          style={{ width: '48px', flexShrink: 0, borderRadius: '6px', border: 'none', background: '#d4af37', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>+</button>
      </div>
      {ingredients.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
          {ingredients.map(ing => (
            <span key={ing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f0faf4', border: '1px solid #b7e1c6', color: '#1e6b3c', padding: '0.25rem 0.4rem 0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
              {ing}
              <button type="button" aria-label={`Remover ${ing}`} onClick={() => onChange(ingredients.filter(x => x !== ing))}
                style={{ width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer', lineHeight: 1, color: '#1e6b3c' }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmojiField({ emoji, onChange }: { emoji: string; onChange: (e: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>Emoji</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {TREAT_EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => onChange(e)}
            style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: '1.15rem', cursor: 'pointer', border: emoji === e ? '2px solid #d4af37' : '1px solid #dfe4ea', background: emoji === e ? '#fdf6dd' : '#fff' }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
