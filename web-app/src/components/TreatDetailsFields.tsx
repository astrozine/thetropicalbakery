'use client';

import React, { useState } from 'react';
import { ALLERGENS, TREAT_EMOJIS, normalizeAllergens } from '@/lib/allergens';
import { RAW, TREAT_TYPES, normalizeTreatType } from '@/lib/treatTypes';
import { CAFFEINE_LEVELS, SUGARS, WHOLE_FOOD, caffeineById, sugarById, sugarsOf, suggestCaffeine, suggestSugars } from '@/lib/sugarCaffeine';

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
 * Sugar and caffeine (see sugarCaffeine.ts for why these aren't allergens).
 *
 * Sugar is "tick everything it has": one treat can have dates AND a chocolate with crystal sugar.
 * Whether it's integral follows from that list and is shown live, so Dolly sees exactly what the
 * customer will see. The ingredients are read for a suggestion she confirms with one tap; a chocolate
 * that doesn't say what's in it ("chocolate amargo") gets a question, because only the label knows.
 */
export function SugarCaffeineFields({ sugars, caffeine, ingredients, onChange }: {
  sugars?: string[] | null; caffeine?: string | null; ingredients: string[];
  onChange: (next: { sugars: string[] | null; caffeine: string | null }) => void;
}) {
  const list = sugarsOf({ sugars }) || [];
  const c = caffeineById(caffeine)?.id ?? null;
  const [chocolateAnswered, setChocolateAnswered] = useState(false);
  const setSugars = (next: string[]) => onChange({ sugars: next.length ? next : null, caffeine: c });
  // "Sem açúcar adicionado" and any sugar exclude each other.
  const toggleSugar = (id: string) => {
    if (list.includes(id)) return setSugars(list.filter(x => x !== id));
    setSugars(id === 'nenhum' ? ['nenhum'] : [...list.filter(x => x !== 'nenhum'), id]);
  };
  const addSugars = (ids: string[]) => setSugars([...list.filter(x => x !== 'nenhum'), ...ids.filter(id => !list.includes(id))]);

  const tip = suggestSugars(ingredients);
  const missing = tip.found.filter(f => !list.includes(f.id));
  const askChocolate = tip.askChocolate && !chocolateAnswered && !list.includes('cristal') && !list.includes('coco') ? tip.askChocolate : null;
  const whole = list.length ? !list.some(id => sugarById(id)?.refined) : null;
  const caffeineTip = suggestCaffeine(ingredients);
  const caffeineSuggested = caffeineTip && caffeineTip.id !== c ? caffeineById(caffeineTip.id) : undefined;

  const pill = (on: boolean, refined = false): React.CSSProperties => ({
    textAlign: 'left', padding: '0.55rem 0.7rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', minHeight: '44px',
    border: `1px solid ${on ? (refined ? '#d9894a' : '#d4af37') : '#dfe4ea'}`, background: on ? (refined ? '#fbeee2' : '#fdf6dd') : '#fff',
    color: on ? (refined ? '#8a4a17' : '#6b5214') : '#566573', fontWeight: on ? 700 : 500, fontSize: '0.85rem', lineHeight: 1.3,
  });
  const linkBtn: React.CSSProperties = { border: 'none', background: 'none', padding: 0, color: '#8a6d1f', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' };
  const smallBtn: React.CSSProperties = { padding: '0.4rem 0.7rem', minHeight: '36px', borderRadius: '8px', border: '1px solid #e0c9a4', background: '#fff', color: '#6e3a10', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };
  const note: React.CSSProperties = { fontSize: '0.8rem', margin: 0, lineHeight: 1.5 };

  return (
    <div style={{ background: '#fafbfc', border: '1px solid #eef1f4', borderRadius: '10px', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
      <div>
        <p style={{ ...labelStyle, marginBottom: '0.15rem' }}>🍬 Açúcar</p>
        <p style={{ ...note, color: '#7f8c8d', marginBottom: '0.5rem' }}>Marque tudo o que o doce leva para adoçar.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
          {SUGARS.map(sg => {
            const on = list.includes(sg.id);
            return (
              <button key={sg.id} type="button" onClick={() => toggleSugar(sg.id)} aria-pressed={on} title={sg.hint} style={pill(on, sg.refined)}>
                {on ? '✓ ' : ''}{sg.emoji} {sg.label}{sg.refined ? ' (refinado)' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {missing.length > 0 && (
        <p style={{ ...note, color: '#566573' }}>
          💡 Pelos ingredientes: {missing.map(f => `${sugarById(f.id)!.label} (“${f.because}”)`).join(', ')}.{' '}
          <button type="button" style={linkBtn} onClick={() => addSugars(missing.map(f => f.id))}>{missing.length === 1 ? 'Marcar' : 'Marcar estes'}</button>
        </p>
      )}

      {askChocolate && (
        <div style={{ background: '#fff4e0', borderRadius: '8px', padding: '0.6rem 0.75rem', display: 'grid', gap: '0.45rem' }}>
          <p style={{ ...note, color: '#8a5a00' }}>🍫 Leva “{askChocolate}”. O que diz o rótulo da barra?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button type="button" style={smallBtn} onClick={() => addSugars(['cristal'])}>Açúcar (cristal, orgânico…)</button>
            <button type="button" style={smallBtn} onClick={() => addSugars(['coco'])}>Açúcar de coco</button>
            <button type="button" style={smallBtn} onClick={() => setChocolateAnswered(true)}>Sem açúcar (100% cacau)</button>
          </div>
        </div>
      )}

      {whole === null ? (
        <p style={{ ...note, color: '#e67e22' }}>Ainda não informado: quem filtra por açúcar ou por 🌾 Integral não vai ver este doce.</p>
      ) : whole ? (
        <p style={{ ...note, color: '#4b5d24', background: '#eef3e2', borderRadius: '8px', padding: '0.5rem 0.7rem' }}>
          {WHOLE_FOOD.yes.emoji} No site: <strong>{WHOLE_FOOD.yes.label}</strong> (nada refinado).
        </p>
      ) : (
        <p style={{ ...note, color: '#6e3a10', background: '#fbeee2', borderRadius: '8px', padding: '0.5rem 0.7rem' }}>
          {WHOLE_FOOD.no.emoji} No site: <strong>{WHOLE_FOOD.no.label}</strong>, com a explicação de que leva chocolate vegano industrializado com açúcar cristal.
        </p>
      )}

      <div style={{ borderTop: '1px dashed #e3e7ec', paddingTop: '0.75rem' }}>
        <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>☕ Cafeína</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
          {CAFFEINE_LEVELS.map(l => {
            const on = c === l.id;
            return (
              <button key={l.id} type="button" onClick={() => onChange({ sugars: list.length ? list : null, caffeine: on ? null : l.id })} aria-pressed={on} title={l.hint} style={pill(on)}>
                {on ? '✓ ' : ''}{l.emoji} {l.label}
              </button>
            );
          })}
        </div>
        {caffeineSuggested && (
          <p style={{ ...note, color: '#566573', marginTop: '0.45rem' }}>
            💡 Pelos ingredientes parece <strong>{caffeineSuggested.emoji} {caffeineSuggested.label}</strong>
            {caffeineTip!.because ? <> (“{caffeineTip!.because}”)</> : null}.{' '}
            <button type="button" style={linkBtn} onClick={() => onChange({ sugars: list.length ? list : null, caffeine: caffeineSuggested.id })}>Usar</button>
          </p>
        )}
        <p style={{ ...note, color: '#7f8c8d', marginTop: '0.45rem' }}>Cacau conta como pouca cafeína; manteiga de cacau e chocolate branco, não.</p>
      </div>
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
