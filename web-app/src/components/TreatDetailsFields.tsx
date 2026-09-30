'use client';

import React, { useState } from 'react';
import { ALLERGENS, TREAT_EMOJIS, normalizeAllergens } from '@/lib/allergens';
import { RAW, TREAT_TYPES, normalizeTreatType } from '@/lib/treatTypes';
import { CAFFEINE_LEVELS, SUGAR_LEVELS, caffeineById, sugarById, suggestFromIngredients, type Level } from '@/lib/sugarCaffeine';

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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#2c3e50', lineHeight: 1.5 }}>{title}</span>
            {summary && <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{summary}</span>}
          </span>
          {chips && <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>{chips}</span>}
        </span>
      </button>
      {open && <div style={{ padding: '0.55rem 0.8rem 0.8rem' }}>{children}</div>}
    </div>
  );
}

/** Chip picker for one list of allergens ("contém" or "pode conter"). The list is short enough to show in full. */
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {ALLERGENS.map(a => {
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
              {active ? '✓ ' : ''}{a.emoji} {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Both allergen lists together, with the exact wording used everywhere. */
export function AllergenFields({ contains: storedContains, mayContain: storedMay, onChange }: {
  contains: string[]; mayContain: string[]; onChange: (next: { contains: string[]; may_contain: string[] }) => void;
}) {
  // A treat saved with the old long list shows (and saves) in today's ids.
  const contains = normalizeAllergens(storedContains);
  const mayContain = normalizeAllergens(storedMay);
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
        hint="Não vai na receita, mas é manipulado na mesma cozinha ou nos mesmos utensílios (ex.: traços de castanhas ou gergelim)."
      />
      <p style={{ gridColumn: '1 / -1', fontSize: '0.78rem', color: '#7f8c8d', lineHeight: 1.6, margin: 0 }}>
        Vegano e sem glúten na receita (com possíveis traços) já vale para todos os doces e aparece para o cliente
        automaticamente. Aqui só o que muda de um doce para outro. Qual castanha é, fica nos ingredientes. Açúcar e cafeína ficam logo abaixo.
      </p>
    </div>
  );
}

/**
 * Sugar and caffeine, one tap each (see sugarCaffeine.ts for why these are scales, not allergens).
 * The ingredient list is read for a suggestion Dolly confirms with one tap; nothing is saved on a guess,
 * and "chocolate" always asks, because only the bar's label knows which sugar is in it.
 */
export function SugarCaffeineFields({ sugar, caffeine, ingredients, onChange }: {
  sugar?: string | null; caffeine?: string | null; ingredients: string[];
  onChange: (next: { sugar: string | null; caffeine: string | null }) => void;
}) {
  const s = sugarById(sugar)?.id ?? null;
  const c = caffeineById(caffeine)?.id ?? null;
  const tip = suggestFromIngredients(ingredients);

  const row = <Id extends string>(title: string, levels: Level<Id>[], current: Id | null, pick: (id: Id | null) => void,
    suggestion?: { id: Id; because: string }) => {
    const suggested = suggestion && suggestion.id !== current ? levels.find(l => l.id === suggestion.id) : undefined;
    return (
      <div>
        <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>{title}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
          {levels.map(l => {
            const on = current === l.id;
            return (
              <button key={l.id} type="button" onClick={() => pick(on ? null : l.id)} aria-pressed={on} title={l.hint}
                style={{
                  textAlign: 'left', padding: '0.55rem 0.7rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', minHeight: '44px',
                  border: `1px solid ${on ? '#d4af37' : '#dfe4ea'}`, background: on ? '#fdf6dd' : '#fff',
                  color: on ? '#6b5214' : '#566573', fontWeight: on ? 700 : 500, fontSize: '0.85rem', lineHeight: 1.3,
                }}>
                {on ? '✓ ' : ''}{l.emoji} {l.label}
              </button>
            );
          })}
        </div>
        {current === null && (
          <p style={{ fontSize: '0.78rem', color: '#e67e22', margin: '0.4rem 0 0' }}>Ainda não informado: quem filtra por isso não vai ver este doce.</p>
        )}
        {suggested && (
          <p style={{ fontSize: '0.8rem', color: '#566573', margin: '0.45rem 0 0', lineHeight: 1.5 }}>
            💡 Pelos ingredientes parece <strong>{suggested.emoji} {suggested.label}</strong>
            {suggestion!.because ? <> (por causa de “{suggestion!.because}”)</> : null}.{' '}
            <button type="button" onClick={() => pick(suggested.id)}
              style={{ border: 'none', background: 'none', padding: 0, color: '#8a6d1f', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
              Usar
            </button>
          </p>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: '#fafbfc', border: '1px solid #eef1f4', borderRadius: '10px', padding: '1rem', display: 'grid', gap: '1.1rem' }}>
      {row('🍬 Açúcar', SUGAR_LEVELS, s, id => onChange({ sugar: id, caffeine: c }), tip.sugar)}
      {tip.chocolate && s !== 'cana' && (
        <p style={{ fontSize: '0.8rem', color: '#8a5a00', background: '#fff4e0', borderRadius: '8px', padding: '0.5rem 0.7rem', margin: '-0.4rem 0 0', lineHeight: 1.5 }}>
          🍫 Leva “{tip.chocolate}”: confira no rótulo da barra se tem açúcar e qual. Açúcar de cana → “Contém açúcar de cana”; açúcar de coco → “Açúcar não refinado”.
        </p>
      )}
      {row('☕ Cafeína', CAFFEINE_LEVELS, c, id => onChange({ sugar: s, caffeine: id }), tip.caffeine)}
      <p style={{ fontSize: '0.78rem', color: '#7f8c8d', lineHeight: 1.6, margin: 0 }}>
        Aparece no doce para o cliente e nos filtros “Sem açúcar de cana”, “Sem açúcar adicionado” e “Sem cafeína” do Menu de Eventos.
        Cacau conta como pouca cafeína; manteiga de cacau e chocolate branco, não.
      </p>
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

/** Single-select: is it a cookie, a cake, a chocolate… Optional — tap the active one again to clear it. */
export function TreatTypeField({ value, onChange }: { value: string | null | undefined; onChange: (id: string | null) => void }) {
  return (
    <div>
      <label style={labelStyle}>Tipo de doce</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {TREAT_TYPES.map(t => {
          const active = normalizeTreatType(value) === t.id;
          return (
            <button
              key={t.id}
              type="button"
              title={t.hint}
              onClick={() => onChange(active ? null : t.id)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
                border: `1px solid ${active ? '#d4af37' : '#dfe4ea'}`, background: active ? '#fdf6dd' : '#fff',
                color: active ? '#8a6d1f' : '#7f8c8d', fontWeight: active ? 700 : 500,
              }}
            >
              {t.emoji} {t.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: '0.78rem', color: '#7f8c8d', marginTop: '0.5rem', lineHeight: 1.5 }}>
        Agrupa os doces em seções no Menu de Eventos e mostra uma etiqueta pequena no card. Opcional — deixe em branco se não tiver certeza.
      </p>
    </div>
  );
}

/**
 * Raw is a yes/no on any treat, not one of the types above: a raw cheesecake is still a Bolo.
 * A real checkbox, so it reads as "this one too" rather than as a choice between kinds.
 */
export function RawField({ checked, onChange }: { checked: boolean; onChange: (raw: boolean) => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '0.8rem 0.9rem', borderRadius: '10px',
      border: `1px solid ${checked ? RAW.accent : '#dfe4ea'}`, background: checked ? '#eef5e8' : '#fff',
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: '22px', height: '22px', marginTop: '2px', accentColor: RAW.accent, flex: 'none', cursor: 'pointer' }} />
      <span>
        <strong style={{ color: checked ? '#3f5e2c' : '#2c3e50' }}>{RAW.emoji} Este doce é Raw</strong>
        <span style={{ display: 'block', fontSize: '0.8rem', color: '#7f8c8d', lineHeight: 1.5, marginTop: '0.2rem' }}>
          Não vai ao forno: nada passa de 42 °C. Vale para qualquer tipo de doce (um cheesecake raw continua em Bolos):
          ganha a etiqueta verde e aparece no botão <strong>Raw</strong> do Menu de Eventos.
        </span>
      </span>
    </label>
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
