'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { TREAT_TYPES, normalizeTreatType, type TreatType } from '@/lib/treatTypes';
import { loadTreatTypes, treatTypesTableReady } from '@/lib/useTreatTypes';

interface Props {
  treats: { id: string; treat_type?: string | null }[];
  /** Treats were moved: the page re-reads them. */
  onTreatsChanged: () => void;
  onClose: () => void;
}

const PALETTE = ['#c2504a', '#e8a33d', '#b8743a', '#d77a9a', '#b0579a', '#c98a4b', '#8a5a3b', '#4a332a', '#5f8a45', '#3d7cc9', '#2a9d8f', '#7d3c98'];

/** "Bolos de Festa" -> "bolos-de-festa": the id stored on each treat. Never changes after it is created. */
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'categoria';

/**
 * The categories of the Menu de Eventos, all in one panel: rename, emoji, colour, order, add, remove. Each change
 * is saved on its own the moment it is made (no big save button to forget). Removing a category never deletes a
 * treat: its treats go to the category Dolly picks, or to "Outros".
 */
export default function CategoryManager({ treats, onTreatsChanged, onClose }: Props) {
  const [busy, setBusy] = useState('');
  const [saved, setSaved] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍰');
  const [drafts, setDrafts] = useState<Record<string, Partial<TreatType>>>({});
  const ready = treatTypesTableReady();
  const count = (id: string) => treats.filter(t => normalizeTreatType(t.treat_type) === id).length;
  const outros = treats.filter(t => !TREAT_TYPES.some(c => c.id === normalizeTreatType(t.treat_type))).length;

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(''), 1800); };
  const problem = (e: { message: string } | null) => {
    if (!e) return false;
    brandAlert(/treat_types/.test(e.message) ? 'Rode a migration_37_treat_categories.sql no Supabase primeiro.' : `Não foi possível salvar: ${e.message}`);
    return true;
  };

  const update = async (id: string, patch: Partial<TreatType>) => {
    if (!ready) { problem({ message: 'treat_types' }); return; }
    const clean = { ...patch };
    if (clean.label !== undefined && !clean.label.trim()) return;
    setBusy(id);
    const { error } = await supabase.from('treat_types').update(clean).eq('id', id);
    setBusy('');
    if (problem(error)) return;
    setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
    await loadTreatTypes(true);
    flash('Salvo ✓');
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= TREAT_TYPES.length) return;
    const order = [...TREAT_TYPES];
    [order[index], order[j]] = [order[j], order[index]];
    setBusy('order');
    for (let i = 0; i < order.length; i++) {
      const { error } = await supabase.from('treat_types').update({ sort_order: i + 1 }).eq('id', order[i].id);
      if (problem(error)) { setBusy(''); return; }
    }
    setBusy('');
    await loadTreatTypes(true);
  };

  const add = async () => {
    const label = newLabel.trim();
    if (!label) return;
    if (!ready) { problem({ message: 'treat_types' }); return; }
    let id = slug(label);
    if (TREAT_TYPES.some(t => t.id === id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
    setBusy('new');
    const { error } = await supabase.from('treat_types').insert([{
      id, label, emoji: newEmoji.trim() || '🍰', accent: PALETTE[TREAT_TYPES.length % PALETTE.length], sort_order: TREAT_TYPES.length + 1,
    }]);
    setBusy('');
    if (problem(error)) return;
    setNewLabel('');
    await loadTreatTypes(true);
    flash(`“${label}” criada ✓`);
  };

  const remove = async (cat: TreatType) => {
    const n = count(cat.id);
    let target: string | null = null;
    if (n > 0) {
      const others = TREAT_TYPES.filter(t => t.id !== cat.id);
      const choice = await pickTarget(cat, n, others);
      if (choice === undefined) return;
      target = choice;
    } else if (!(await brandConfirm(`Remover a categoria “${cat.label}”?`, { danger: true, confirmLabel: 'Sim, remover' }))) {
      return;
    }
    setBusy(cat.id);
    if (n > 0) {
      const { error } = await supabase.from('treats').update({ treat_type: target }).in('treat_type', [cat.id, ...(cat.id === 'bolos' ? ['bolos-tarteletes'] : [])]);
      if (error) { setBusy(''); brandAlert(`Não foi possível mover os doces: ${error.message}`); return; }
    }
    const { error } = await supabase.from('treat_types').delete().eq('id', cat.id);
    setBusy('');
    if (problem(error)) return;
    await loadTreatTypes(true);
    onTreatsChanged();
    flash('Categoria removida ✓');
  };

  // Where the treats of a removed category go: a small choice in the page's own dialog style.
  const [picking, setPicking] = useState<{ cat: TreatType; n: number; others: TreatType[]; resolve: (v: string | null | undefined) => void } | null>(null);
  const pickTarget = (cat: TreatType, n: number, others: TreatType[]) =>
    new Promise<string | null | undefined>(resolve => setPicking({ cat, n, others, resolve }));
  const answer = (v: string | null | undefined) => { picking?.resolve(v); setPicking(null); };

  const small: React.CSSProperties = { width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #e6e2dc', background: '#fff', cursor: 'pointer', fontSize: '0.95rem' };

  return (
    <div className="bx-card" style={{ marginBottom: '1.5rem', borderColor: '#d9cfc0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem' }}>🗂️ Categorias do menu</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#6a6a6a', lineHeight: 1.5 }}>
            Mude o nome, o emoji ou a cor, e a ordem em que aparecem no menu. Tudo salva sozinho.
            Para trocar um doce de categoria, use a escolha de categoria no próprio cartão do doce.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#1e6b3c', fontWeight: 700 }}>{saved}</span>}
          <button type="button" className="bx-btn bx-btn--ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>

      {!ready && (
        <p style={{ background: '#fff8e6', border: '1px solid #f0d09a', color: '#8a5a00', borderRadius: '12px', padding: '0.8rem 1rem' }}>
          Para editar as categorias, rode a <strong>migration_37_treat_categories.sql</strong> no Supabase. Até lá o site usa as categorias de sempre.
        </p>
      )}

      <div>
        {TREAT_TYPES.map((cat, i) => {
          const d = drafts[cat.id] || {};
          return (
            <div key={cat.id} className="tr-catrow" style={{ opacity: busy === cat.id ? 0.5 : 1 }}>
              <label title="Cor" style={{ position: 'relative', width: '34px', height: '34px', borderRadius: '50%', background: d.accent ?? cat.accent, cursor: 'pointer', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.08)' }}>
                <input type="color" value={d.accent ?? cat.accent} onChange={e => setDrafts(x => ({ ...x, [cat.id]: { ...x[cat.id], accent: e.target.value } }))}
                  onBlur={e => e.target.value !== cat.accent && update(cat.id, { accent: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </label>
              <input aria-label="Emoji" className="bx-input" style={{ padding: '0.5rem', textAlign: 'center', fontSize: '1.3rem' }} maxLength={4}
                value={d.emoji ?? cat.emoji} onChange={e => setDrafts(x => ({ ...x, [cat.id]: { ...x[cat.id], emoji: e.target.value } }))}
                onBlur={e => e.target.value.trim() && e.target.value !== cat.emoji && update(cat.id, { emoji: e.target.value.trim() })} />
              <div style={{ minWidth: 0 }}>
                <input aria-label="Nome da categoria" className="bx-input" style={{ padding: '0.55rem 0.75rem', fontWeight: 700 }}
                  value={d.label ?? cat.label} onChange={e => setDrafts(x => ({ ...x, [cat.id]: { ...x[cat.id], label: e.target.value } }))}
                  onBlur={e => e.target.value.trim() && e.target.value !== cat.label && update(cat.id, { label: e.target.value.trim() })}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                <span style={{ fontSize: '0.8rem', color: '#6a6a6a', paddingLeft: '0.2rem' }}>{count(cat.id)} {count(cat.id) === 1 ? 'doce' : 'doces'}</span>
              </div>
              <div className="tr-catrow__act">
                <button type="button" style={{ ...small, opacity: i === 0 ? 0.3 : 1 }} disabled={i === 0 || !!busy} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
                <button type="button" style={{ ...small, opacity: i === TREAT_TYPES.length - 1 ? 0.3 : 1 }} disabled={i === TREAT_TYPES.length - 1 || !!busy} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
                <button type="button" style={{ ...small, color: '#c0392b', borderColor: '#f5c6c0' }} disabled={!!busy} onClick={() => remove(cat)} aria-label={`Remover ${cat.label}`}>🗑</button>
              </div>
            </div>
          );
        })}
        {outros > 0 && (
          <p style={{ margin: '0.6rem 0.4rem 0', color: '#6a6a6a', fontSize: '0.9rem' }}>✨ Outros (sem categoria): {outros} {outros === 1 ? 'doce' : 'doces'}</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) auto', gap: '0.6rem', alignItems: 'center', marginTop: '1rem' }}>
        <input aria-label="Emoji da nova categoria" className="bx-input" style={{ padding: '0.5rem', textAlign: 'center', fontSize: '1.3rem' }} maxLength={4} value={newEmoji} onChange={e => setNewEmoji(e.target.value)} />
        <input className="bx-input" placeholder="Nova categoria (ex: Bolos de Festa)" value={newLabel} onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="bx-btn bx-btn--dark" onClick={add} disabled={!newLabel.trim() || busy === 'new'}>＋ Criar</button>
      </div>

      {picking && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div className="bx-card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.4rem', fontWeight: 800 }}>Remover “{picking.cat.label}”</h3>
            <p style={{ margin: '0 0 1rem', color: '#6a6a6a', lineHeight: 1.5 }}>
              {picking.n} {picking.n === 1 ? 'doce está' : 'doces estão'} nesta categoria. Nenhum doce é apagado: para onde {picking.n === 1 ? 'ele vai' : 'eles vão'}?
            </p>
            <div style={{ display: 'grid', gap: '0.4rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {picking.others.map(o => (
                <button key={o.id} type="button" className="bx-btn bx-btn--ghost" style={{ justifyContent: 'flex-start' }} onClick={() => answer(o.id)}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: o.accent }} /> {o.emoji} {o.label}
                </button>
              ))}
              <button type="button" className="bx-btn bx-btn--ghost" style={{ justifyContent: 'flex-start' }} onClick={() => answer(null)}>✨ Deixar sem categoria (Outros)</button>
            </div>
            <button type="button" className="bx-link" style={{ marginTop: '1rem' }} onClick={() => answer(undefined)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
