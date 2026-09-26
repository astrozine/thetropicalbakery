'use client';

import React, { useState } from 'react';
import { BoxItem, TreatRow, newBoxItem, treatToBoxItem } from '@/lib/allergens';
import { uploadPublicImage } from '@/lib/imageUpload';
import { supabase } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';
import { AllergenFields, EmojiField, IngredientsField, fieldStyle, labelStyle } from '@/components/TreatDetailsFields';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';

interface Props {
  items: BoxItem[];
  onChange: (items: BoxItem[]) => void;
}

/** The "Menu de Eventos" link for one treat: either already linked, or an opt-in to create it there on save. */
function MenuLink({ item, onChange }: { item: BoxItem; onChange: (i: BoxItem) => void }) {
  if (item.treat_id) {
    return (
      <div style={{ background: '#f0faf4', border: '1px solid #b7e1c6', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#1e6b3c', fontSize: '0.88rem', lineHeight: 1.5 }}>
          🔗 <strong>Este doce está no Menu de Eventos.</strong> Ao salvar a caixa, foto, descrição, ingredientes e alérgenos são atualizados nos dois lugares.
        </span>
        <button type="button" onClick={() => onChange({ ...item, treat_id: null })}
          style={{ border: '1px solid #b7e1c6', background: '#fff', color: '#1e6b3c', borderRadius: '6px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
          Desvincular
        </button>
      </div>
    );
  }
  return (
    <div style={{ border: '1px dashed #dfe4ea', borderRadius: '10px', padding: '0.85rem 1rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50', fontSize: '0.92rem' }}>
        <input type="checkbox" checked={!!item.add_to_menu} onChange={e => onChange({ ...item, add_to_menu: e.target.checked, menu_price: item.menu_price ?? 0, menu_min_batch: item.menu_min_batch ?? 10, menu_batch_multiplier: item.menu_batch_multiplier ?? 10 })}
          style={{ width: '18px', height: '18px' }} />
        Também adicionar este doce ao Menu de Eventos
      </label>
      {item.add_to_menu && !(item.menu_price && item.menu_price > 0) && (
        <p style={{ fontSize: '0.8rem', color: '#8a5a00', margin: '0.6rem 0 0', lineHeight: 1.5 }}>
          Sem preço, ele entra no Menu de Eventos <strong>escondido</strong> (&quot;Fora do menu&quot;). Coloque o preço aqui ou lá para ele aparecer.
        </p>
      )}
      {item.add_to_menu && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Preço unitário (R$)</label>
            <input type="number" step="0.01" min="0" value={item.menu_price || ''} onChange={e => onChange({ ...item, menu_price: parseFloat(e.target.value) || 0 })} style={fieldStyle} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Pedido mínimo (un.)</label>
            <input type="number" min="1" value={item.menu_min_batch || ''} onChange={e => onChange({ ...item, menu_min_batch: parseInt(e.target.value) || 1 })} style={fieldStyle} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Aumenta de quanto em quanto</label>
            <input type="number" min="1" value={item.menu_batch_multiplier || ''} onChange={e => onChange({ ...item, menu_batch_multiplier: parseInt(e.target.value) || 1 })} style={fieldStyle} />
          </div>
        </div>
      )}
    </div>
  );
}

function ItemEditor({ item, onChange }: { item: BoxItem; onChange: (i: BoxItem) => void }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange({ ...item, image_url: await uploadPublicImage(file, 'boxes/items') });
    } catch (err) {
      console.error(err);
      brandAlert('Não foi possível enviar a foto. Tente novamente.');
    }
    setUploading(false);
  };

  return (
    <div style={{ display: 'grid', gap: '1.1rem', padding: '1.25rem', borderTop: '1px solid #eef1f4' }}>
      <div>
        <label style={labelStyle}>Nome do doce ✨</label>
        <input type="text" value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} placeholder="Um apelido divertido. Ex: Sol de Abacaxi, Zebra Cítrica" style={fieldStyle} />
        <p style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '0.3rem' }}>Aparece numa caixinha dourada no site, em cima da descrição.</p>
      </div>
      <EmojiField emoji={item.emoji} onChange={emoji => onChange({ ...item, emoji })} />
      <div>
        <label style={labelStyle}>Do que ele é feito (a frase embaixo do nome)</label>
        <textarea value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} rows={3}
          placeholder="Conte como é: textura, sabor, o que ele tem de especial…" style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>
      <ImagePicker label="Foto deste doce" imageUrl={item.image_url} uploading={uploading} onChange={upload} />
      <IngredientsField ingredients={item.ingredients} onChange={ingredients => onChange({ ...item, ingredients })} />
      <AllergenFields contains={item.contains} mayContain={item.may_contain} onChange={a => onChange({ ...item, ...a })} />
      <MenuLink item={item} onChange={onChange} />
    </div>
  );
}

/** Pick treats from the Menu de Eventos (including past, hidden ones) to reuse in this box. */
function MenuPicker({ inBox, onPick, onClose }: { inBox: Set<string>; onPick: (t: TreatRow) => void; onClose: () => void }) {
  const [treats, setTreats] = useState<TreatRow[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    supabase.from('treats').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Não foi possível carregar o Menu de Eventos.');
      else setTreats((data as TreatRow[]) || []);
    });
  }, []);

  const shown = (treats || []).filter(t => t.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div style={{ border: '1px solid #d4af37', borderRadius: '12px', background: '#fffdf6', padding: '1rem', marginTop: '0.9rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
        <strong style={{ color: '#2c3e50' }}>Menu de Eventos — escolha para repetir nesta caixa</strong>
        <button type="button" onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: '#ecf0f1', borderRadius: '6px', padding: '0.35rem 0.9rem', cursor: 'pointer' }}>Fechar</button>
      </div>
      <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar pelo nome…" style={{ ...fieldStyle, marginBottom: '0.8rem' }} />
      {error && <p style={{ color: '#c0392b', fontSize: '0.9rem' }}>{error}</p>}
      {!treats && !error && <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Carregando…</p>}
      {treats && shown.length === 0 && <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Nenhum doce encontrado.</p>}
      <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
        {shown.map(t => {
          const added = inBox.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={added}
              onClick={() => onPick(t)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0.7rem', border: '1px solid #e8e1d7', borderRadius: '10px', background: '#fff', cursor: added ? 'default' : 'pointer', textAlign: 'left', opacity: added ? 0.55 : 1 }}
            >
              {t.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={t.image_url} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                : <span style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f5efe2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{t.emoji || '🍫'}</span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: '#2c3e50', display: 'block' }}>{t.name}</strong>
                <span style={{ fontSize: '0.78rem', color: '#95a5a6' }}>
                  {t.is_available ? 'No menu agora' : 'Fora do menu (anterior)'} · {(t.ingredients || []).length} ingredientes · {(t.contains || []).length} alérgenos
                </span>
              </span>
              <span style={{ color: added ? '#27ae60' : '#d4af37', fontWeight: 'bold', fontSize: '0.85rem' }}>{added ? 'Na caixa ✓' : '+ Adicionar'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Add the treats of a box one at a time; each is a collapsible row. */
export default function BoxItemsEditor({ items, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const update = (id: string, next: BoxItem) => onChange(items.map(i => (i.id === id ? next : i)));
  const remove = async (id: string, name: string) => {
    if (!(await brandConfirm(`Remover "${name || 'este doce'}" da caixa?`, { danger: true, confirmLabel: 'Sim, remover' }))) return;
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
    // New treats also go to the Menu de Eventos by default (hidden there until they have a price).
    const item: BoxItem = { ...newBoxItem(), add_to_menu: true, menu_price: 0, menu_min_batch: 10, menu_batch_multiplier: 10 };
    onChange([...items, item]);
    setOpen(item.id);
  };
  const pick = (t: TreatRow) => {
    const item = treatToBoxItem(t);
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
                  style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  {item.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.image_url} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    : <span style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#f5efe2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{item.emoji}</span>}
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ color: '#2c3e50' }}>{idx + 1}. {item.name || 'Doce sem nome'}{item.treat_id ? ' 🔗' : ''}</strong>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#95a5a6' }}>
                      {item.ingredients.length} ingredientes · {item.contains.length} alérgenos{item.treat_id ? ' · no Menu de Eventos' : ''}
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

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
        <button type="button" onClick={add}
          style={{ flex: '1 1 220px', padding: '0.9rem', border: '2px dashed #d4af37', background: 'rgba(212,175,55,0.08)', color: '#8a6d1f', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          + Novo doce
        </button>
        <button type="button" onClick={() => setPickerOpen(o => !o)}
          style={{ flex: '1 1 220px', padding: '0.9rem', border: '2px solid #2c3e50', background: pickerOpen ? '#2c3e50' : '#fff', color: pickerOpen ? '#fff' : '#2c3e50', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          📋 Repetir do Menu de Eventos
        </button>
      </div>

      {pickerOpen && (
        <MenuPicker
          inBox={new Set(items.map(i => i.treat_id).filter(Boolean) as string[])}
          onPick={pick}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
