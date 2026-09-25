'use client';

import React, { useState } from 'react';
import { ALLERGENS, ALLERGEN_GROUPS, TREAT_EMOJIS } from '@/lib/allergens';

/** Shared admin styles for the treat-detail editors (box treats and Menu de Eventos treats). */
export const fieldStyle: React.CSSProperties = { width: '100%', padding: '0.7rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.95rem' };
export const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#2c3e50' };

/** One accordion row: a title, a short note on the right, optional chips underneath (both visible while closed), and a body that opens on tap. */
export function Fold({ title, summary, chips, defaultOpen = false, children }: {
  title: string; summary?: React.ReactNode; chips?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #eef1f4', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.55rem 0.8rem', background: open ? '#fdf7ee' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span aria-hidden style={{ display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', color: '#a6832b', flexShrink: 0, lineHeight: 1.5 }}>▸</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#2c3e50', lineHeight: 1.5 }}>{title}</span>
            {summary && <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{summary}</span>}
          </span>
          {chips && <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>{chips}</span>}
        </span>
      </button>
      {open && <div style={{ padding: '0.55rem 0.8rem 0.8rem' }}>{children}</div>}
    </div>
  );
}

/** Chip picker for one list of allergens ("contém" or "pode conter"). Each group folds shut and shows what is picked. */
export function AllergenPicker({ title, hint, tone, selected, onToggle }: {
  title: string; hint: string; tone: 'contains' | 'may'; selected: string[]; onToggle: (id: string) => void;
}) {
  const on = tone === 'contains'
    ? { bg: '#fdecea', border: '#e74c3c', color: '#c0392b' }
    : { bg: '#fff4e0', border: '#e6a23c', color: '#8a5a00' };
  return (
    <div>
      <p style={{ ...labelStyle, marginBottom: '0.15rem' }}>{title}</p>
      <p style={{ fontSize: '0.78rem', color: '#7f8c8d', marginBottom: '0.6rem', lineHeight: 1.5 }}>{hint}</p>
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {ALLERGEN_GROUPS.map(g => {
          const inGroup = ALLERGENS.filter(a => a.group === g.id);
          const picked = inGroup.filter(a => selected.includes(a.id));
          return (
            <Fold
              key={g.id}
              title={g.label}
              summary={picked.length === 0 ? <span style={{ fontSize: '0.74rem', color: '#b2bec3' }}>nenhum</span> : undefined}
              chips={picked.length > 0
                ? picked.map(a => (
                    <span key={a.id} style={{ padding: '0.1rem 0.55rem', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700, background: on.bg, border: `1px solid ${on.border}`, color: on.color, whiteSpace: 'nowrap' }}>
                      {a.emoji} {a.label}
                    </span>
                  ))
                : undefined}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {inGroup.map(a => {
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
            </Fold>
          );
        })}
      </div>
    </div>
  );
}

/** Both allergen lists together, with the exact wording used everywhere. */
export function AllergenFields({ contains, mayContain, onChange }: {
  contains: string[]; mayContain: string[]; onChange: (next: { contains: string[]; may_contain: string[] }) => void;
}) {
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  return (
    <div style={{ background: '#fafbfc', border: '1px solid #eef1f4', borderRadius: '10px', padding: '1rem', display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', alignItems: 'start' }}>
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
    <Fold title="Emoji do doce" summary={<span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{emoji}</span>}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {TREAT_EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => onChange(e)}
            style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: '1.15rem', cursor: 'pointer', border: emoji === e ? '2px solid #d4af37' : '1px solid #dfe4ea', background: emoji === e ? '#fdf6dd' : '#fff' }}>
            {e}
          </button>
        ))}
      </div>
    </Fold>
  );
}
