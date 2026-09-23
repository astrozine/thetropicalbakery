'use client';

import React, { useState } from 'react';
import { ALLERGENS, ALLERGEN_GROUPS, BoxItem, TREAT_EMOJIS, newBoxItem } from '@/lib/allergens';
import { uploadPublicImage } from '@/lib/imageUpload';

interface Props {
  items: BoxItem[];
  onChange: (items: BoxItem[]) => void;
}

const field: React.CSSProperties = { width: '100%', padding: '0.7rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.95rem' };
const label: React.CSSProperties = { display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#2c3e50' };

/** Chip picker for one list of allergens ("contém" or "pode conter"). */
function AllergenPicker({ title, hint, tone, selected, onToggle }: {
  title: string; hint: string; tone: 'contains' | 'may'; selected: string[]; onToggle: (id: string) => void;
}) {
  const on = tone === 'contains'
    ? { bg: '#fdecea', border: '#e74c3c', color: '#c0392b' }
    : { bg: '#fff4e0', border: '#e6a23c', color: '#8a5a00' };
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <p style={{ ...label, marginBottom: '0.15rem' }}>{title}</p>
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

function ItemEditor({ item, onChange }: { item: BoxItem; onChange: (i: BoxItem) => void }) {
  const [ingredient, setIngredient] = useState('');
  const [uploading, setUploading] = useState(false);

  const addIngredient = () => {
    const v = ingredient.trim();
    if (!v) return;
    if (!item.ingredients.some(i => i.toLowerCase() === v.toLowerCase())) {
      onChange({ ...item, ingredients: [...item.ingredients, v] });
    }
    setIngredient('');
  };

  const toggle = (key: 'contains' | 'may_contain', id: string) => {
    const list = item[key];
    onChange({ ...item, [key]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] });
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPublicImage(file, 'boxes/items');
      onChange({ ...item, image_url: url });
    } catch (err) {
      console.error(err);
      alert('Não foi possível enviar a foto. Tente novamente.');
    }
    setUploading(false);
  };

  return (
    <div style={{ display: 'grid', gap: '1.1rem', padding: '1.25rem', borderTop: '1px solid #eef1f4' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 240px' }}>
          <label style={label}>Nome do doce</label>
          <input type="text" value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} placeholder="Ex: Tortinha de Maracujá com Cacau" style={field} />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={label}>Emoji</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {TREAT_EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => onChange({ ...item, emoji: e })}
                style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: '1.15rem', cursor: 'pointer', border: item.emoji === e ? '2px solid #d4af37' : '1px solid #dfe4ea', background: item.emoji === e ? '#fdf6dd' : '#fff' }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label style={label}>Descrição deste doce</label>
        <textarea value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} rows={3}
          placeholder="Conte como é: textura, sabor, o que ele tem de especial…" style={{ ...field, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={label}>Foto deste doce</label>
          <input type="file" accept="image/*" onChange={upload} disabled={uploading} />
          {uploading && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>Enviando…</span>}
        </div>
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '10px' }} />
        )}
      </div>

      <div>
        <label style={label}>Ingredientes</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text" value={ingredient} onChange={e => setIngredient(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
            placeholder="Digite um ingrediente e clique no +" style={field}
          />
          <button type="button" onClick={addIngredient} aria-label="Adicionar ingrediente"
            style={{ width: '48px', flexShrink: 0, borderRadius: '6px', border: 'none', background: '#d4af37', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>+</button>
        </div>
        {item.ingredients.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
            {item.ingredients.map(ing => (
              <span key={ing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f0faf4', border: '1px solid #b7e1c6', color: '#1e6b3c', padding: '0.25rem 0.4rem 0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                {ing}
                <button type="button" aria-label={`Remover ${ing}`} onClick={() => onChange({ ...item, ingredients: item.ingredients.filter(x => x !== ing) })}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer', lineHeight: 1, color: '#1e6b3c' }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fafbfc', border: '1px solid #eef1f4', borderRadius: '10px', padding: '1rem' }}>
        <AllergenPicker
          title="⚠️ Contém" tone="contains" selected={item.contains} onToggle={id => toggle('contains', id)}
          hint="Está na receita, como ingrediente."
        />
        <AllergenPicker
          title="🔸 Pode conter (contaminação cruzada)" tone="may" selected={item.may_contain} onToggle={id => toggle('may_contain', id)}
          hint="Não vai na receita, mas é manipulado na mesma cozinha ou nos mesmos utensílios (ex.: traços de glúten, castanhas, gergelim)."
        />
      </div>
    </div>
  );
}

/** Add the treats of a box one at a time; each is a collapsible row. */
export default function BoxItemsEditor({ items, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  const update = (id: string, next: BoxItem) => onChange(items.map(i => (i.id === id ? next : i)));
  const remove = (id: string, name: string) => {
    if (!confirm(`Remover "${name || 'este doce'}" da caixa?`)) return;
    onChange(items.filter(i => i.id !== id));
  };
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  const add = () => {
    const item = newBoxItem();
    onChange([...items, item]);
    setOpen(item.id);
  };

  return (
    <div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {items.map((item, idx) => {
          const isOpen = open === item.id;
          return (
            <div key={item.id} style={{ border: isOpen ? '1px solid #d4af37' : '1px solid #dfe4ea', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem' }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} aria-expanded={isOpen}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  {item.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.image_url} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} />
                    : <span style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#f5efe2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{item.emoji}</span>}
                  <span>
                    <strong style={{ color: '#2c3e50' }}>{idx + 1}. {item.name || 'Doce sem nome'}</strong>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#95a5a6' }}>
                      {item.ingredients.length} ingredientes · {item.contains.length} alérgenos
                    </span>
                  </span>
                  <span aria-hidden style={{ marginLeft: 'auto', color: '#d4af37', fontSize: '1.4rem', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Subir" style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #dfe4ea', background: '#fff', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                  <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Descer" style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #dfe4ea', background: '#fff', cursor: 'pointer', opacity: idx === items.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button type="button" onClick={() => remove(item.id, item.name)} aria-label="Remover doce" style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #f5b7b1', background: '#fdecea', color: '#c0392b', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              {isOpen && <ItemEditor item={item} onChange={next => update(item.id, next)} />}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={add}
        style={{ marginTop: '0.9rem', width: '100%', padding: '0.9rem', border: '2px dashed #d4af37', background: 'rgba(212,175,55,0.08)', color: '#8a6d1f', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
        + Adicionar doce à caixa
      </button>
    </div>
  );
}
