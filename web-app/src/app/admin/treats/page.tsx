'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { AllergenFields, EmojiField, IngredientsField, RawField, SugarCaffeineFields, TreatTypeField } from '@/components/TreatDetailsFields';
import TreatRefineMenu, { emptyRefine, matchesRefine, type RefineState } from '@/components/TreatRefineMenu';
import TreatTypeBar from '@/components/TreatTypeBar';
import { uploadPublicImage } from '@/lib/imageUpload';
import { syncTreatIntoBoxes, withoutMissingColumn } from '@/lib/treatSync';
import { WHOLE_FOOD, caffeineOf, isWholeFood, sugarsOf } from '@/lib/sugarCaffeine';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { RAW, TREAT_TYPES, anyTyped, groupByType, isRaw, treatTypeById } from '@/lib/treatTypes';
import { useTreatTypes } from '@/lib/useTreatTypes';
import CategoryManager from './CategoryManager';
import { styleToggles } from '@/components/TreatTypeBar';
import '../caixas/caixas.css';
import './treats.css';

interface Treat {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  min_batch_size: number;
  batch_multiplier: number;
  emoji?: string | null;
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
  treat_type?: string | null;
  is_raw?: boolean | null;
  sugars?: string[] | null;
  caffeine?: string | null;
}


export default function TreatsAdmin() {
  const [treats, setTreats] = useState<Treat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Treat>>({});
  const [uploading, setUploading] = useState(false);
  const [refine, setRefine] = useState<RefineState>(emptyRefine);
  /** 'home' = every treat at a glance; 'edit' = one treat, all of it on one page. */
  const [view, setView] = useState<'home' | 'edit'>('home');
  /** The quick status filter above the grid. */
  const [status, setStatus] = useState<'all' | 'on' | 'off' | 'todo'>('all');
  /** The price being typed straight on a card. */
  const [priceEdit, setPriceEdit] = useState<{ id: string; value: string } | null>(null);
  /** The categories panel (create, rename, colour, order, remove). */
  const [showCats, setShowCats] = useState(false);
  // The categories come from the database (migration 37); re-render when they load or change.
  useTreatTypes();

  useEffect(() => {
    fetchTreats();
  }, []);

  const fetchTreats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('treats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching treats:', error);
    else setTreats(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      const publicUrl = await uploadPublicImage(file, 'treats');
      setFormData(f => ({ ...f, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      brandAlert('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const hint = (msg: string) =>
    /ingredients|contains|emoji/.test(msg) ? ' — Rode a migration_14_treat_details.sql no Supabase primeiro.' : '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const details = {
      name: formData.name || '',
      description: formData.description || '',
      image_url: formData.image_url || '',
      emoji: formData.emoji || '🍫',
      ingredients: formData.ingredients || [],
      contains: formData.contains || [],
      may_contain: formData.may_contain || [],
      sugars: formData.sugars?.length ? formData.sugars : null,
      caffeine: formData.caffeine ?? null,
    };

    // Raw is its own column now; a row still typed 'raw' (the old way) drops that type as it's saved.
    const raw = isRaw(formData);
    const kind = formData.treat_type === 'raw' ? null : formData.treat_type ?? null;
    let row: Record<string, unknown> = { ...formData, ...details, treat_type: kind, is_raw: raw };

    // Until migration_31 runs there is no is_raw column: keep raw in the old place when the treat has no
    // other type, and say so when it has one (the two can't both be stored yet).
    const withoutRawColumn = () => {
      const rest = { ...row };
      delete rest.is_raw;
      row = { ...rest, treat_type: raw && !kind ? 'raw' : kind };
      if (raw && kind) brandAlert(`Salvei o tipo, mas a marca ${RAW.emoji} Raw só fica guardada junto com ele depois de rodar a migration_31_raw_flag.sql no Supabase.`);
    };
    const missingRawColumn = (msg: string) => /is_raw/.test(msg);
    // Supabase names one missing column per try, in any order, so drop whichever it names and try again.
    // Sugars need migration_33: save everything else, and say so.
    const saveWithFallbacks = async (write: () => PromiseLike<{ error: { message: string } | null }>) => {
      let { error } = await write();
      for (let tries = 0; error && tries < 3; tries++) {
        const without = withoutMissingColumn(row, error.message, ['sugars', 'caffeine']);
        if (missingRawColumn(error.message) && 'is_raw' in row) withoutRawColumn();
        else if (without) {
          row = without;
          brandAlert('Salvei o doce, mas os açúcares só ficam guardados depois de rodar a migration_33_sugar_sources.sql no Supabase.');
        } else break;
        ({ error } = await write());
      }
      return error;
    };

    if (editingId) {
      const error = await saveWithFallbacks(() => supabase.from('treats').update(row).eq('id', editingId));
      if (error) {
        brandAlert('Erro ao atualizar doce: ' + error.message + hint(error.message));
        setSaving(false);
        return;
      }
      // An ingredient/allergen fix must reach every box that includes this treat.
      await syncTreatIntoBoxes(editingId, details);
    } else {
      const insert = () => supabase.from('treats').insert([{
        ...row,
        is_available: formData.is_available ?? true,
        min_batch_size: formData.min_batch_size ?? 1,
        batch_multiplier: formData.batch_multiplier || 1,
      }]);
      const error = await saveWithFallbacks(insert);
      if (error) {
        brandAlert('Erro ao criar doce: ' + error.message + hint(error.message));
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setEditingId(null);
    setFormData({});
    setView('home');
    window.scrollTo({ top: 0 });
    fetchTreats();
  };

  const handleEdit = (treat: Treat) => {
    setEditingId(treat.id);
    setFormData(treat);
    setView('edit');
    window.scrollTo({ top: 0 });
  };

  const startNew = () => {
    setEditingId(null);
    setFormData({ is_available: true, min_batch_size: 1, batch_multiplier: 1, emoji: '🍫' });
    setView('edit');
    window.scrollTo({ top: 0 });
  };

  /** Move a treat to another category (or none) straight from its card. */
  const setCategory = async (treat: Treat, id: string | null) => {
    // A row from before migration 31 that still says 'raw' keeps being raw once it gets a real category.
    const patch: Record<string, unknown> = { treat_type: id, ...(treat.treat_type === 'raw' ? { is_raw: true } : {}) };
    let { error } = await supabase.from('treats').update(patch).eq('id', treat.id);
    if (error && /is_raw/.test(error.message)) ({ error } = await supabase.from('treats').update({ treat_type: id }).eq('id', treat.id));
    if (error) { brandAlert('Não foi possível mudar a categoria: ' + error.message); return; }
    setTreats(ts => ts.map(t => (t.id === treat.id ? { ...t, treat_type: id, ...(treat.treat_type === 'raw' ? { is_raw: true } : {}) } : t)));
  };

  /** The price typed on a card: only that one column, nothing else on the row. */
  const savePrice = async (treat: Treat) => {
    const value = priceEdit ? Number(priceEdit.value.replace(',', '.')) : NaN;
    setPriceEdit(null);
    if (!(value >= 0) || value === Number(treat.price)) return;
    const { error } = await supabase.from('treats').update({ price: value }).eq('id', treat.id);
    if (error) { brandAlert('Não foi possível mudar o preço: ' + error.message); return; }
    setTreats(ts => ts.map(t => (t.id === treat.id ? { ...t, price: value } : t)));
  };

  const handleDelete = async (id: string) => {
    if (!(await brandConfirm('Tem certeza que deseja excluir este item?', { danger: true, confirmLabel: 'Sim, remover' }))) return;

    const { error } = await supabase.from('treats').delete().eq('id', id);
    if (error) brandAlert('Erro ao deletar: ' + error.message);
    else { if (editingId === id) { setEditingId(null); setFormData({}); setView('home'); } fetchTreats(); }
  };

  // The card's one-tap switch: only the visibility flag, nothing else on the row.
  const setShown = async (treat: Treat, shown: boolean) => {
    const { error } = await supabase.from('treats').update({ is_available: shown }).eq('id', treat.id);
    if (error) { brandAlert('Não foi possível mudar: ' + error.message); return; }
    setTreats(ts => ts.map(t => (t.id === treat.id ? { ...t, is_available: shown } : t)));
    if (editingId === treat.id) setFormData(f => ({ ...f, is_available: shown }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
    setView('home');
    window.scrollTo({ top: 0 });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando doces...</div>;

  // ═══════════════════════════════ THE EDITOR: one page, six coloured sections ═══════════════════════════════
  if (view === 'edit') {
    const f = formData;
    const raw = isRaw(f);
    const kind = treatTypeById(f.treat_type === 'raw' ? null : f.treat_type);
    const done = [
      !!(f.name?.trim() && f.image_url),
      !!(kind || raw),
      !!((f.price ?? 0) > 0 && (f.min_batch_size ?? 0) > 0),
      (f.ingredients || []).length > 0,
      (f.contains || []).length + (f.may_contain || []).length > 0,
      !!(sugarsOf(f) && caffeineOf(f)),
    ];
    const SECTIONS = [
      { id: 'tr-s1', c: 'var(--s1)', t: 'A cara do doce', h: 'Foto, nome e a frase que dá vontade.', todo: 'falta foto ou nome' },
      { id: 'tr-s2', c: 'var(--s2)', t: 'Onde ele aparece', h: 'O tipo agrupa os doces no menu.', todo: 'opcional' },
      { id: 'tr-s3', c: 'var(--s3)', t: 'Preço e pedido', h: 'Quanto custa e quantos dá para pedir.', todo: 'falta o preço' },
      { id: 'tr-s4', c: 'var(--s4)', t: 'Ingredientes', h: 'Tudo o que vai na receita.', todo: 'nenhum ainda' },
      { id: 'tr-s5', c: 'var(--s5)', t: 'Alérgenos', h: 'O que ele contém e o que pode conter.', todo: 'confira' },
      { id: 'tr-s6', c: 'var(--s6)', t: 'Açúcar e cafeína', h: 'Para quem filtra por açúcar ou cafeína.', todo: 'falta marcar' },
    ];
    const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const head = (i: number) => (
      <div className="tr-sec__head">
        <span className="tr-sec__num">{done[i] ? '✓' : i + 1}</span>
        <div><h2 className="tr-sec__title">{SECTIONS[i].t}</h2><p className="tr-sec__hint">{SECTIONS[i].h}</p></div>
      </div>
    );
    const count = done.filter(Boolean).length;
    const save = (
      <button type="submit" className="bx-btn bx-btn--gold" disabled={saving} style={{ width: '100%' }}>
        {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Adicionar ao menu'}
      </button>
    );

    return (
      <div className="bx">
        <div className="bx-flow__top" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h1 className="bx-h1">{editingId ? f.name || 'Editar doce' : 'Novo doce'}</h1>
            <p className="bx-sub">{count} de 6 partes completas. Tudo numa página: role ou toque numa parte.</p>
          </div>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={cancelEdit}>✕ Fechar</button>
        </div>

        <form onSubmit={handleSave} className="tr-edit tr-sections">
          <div style={{ minWidth: 0 }}>
            <nav className="tr-jump" aria-label="Partes do doce">
              {SECTIONS.map((s, i) => (
                <button key={s.id} type="button" onClick={() => jump(s.id)} style={{ '--c': s.c } as React.CSSProperties}>
                  <i className={done[i] ? '' : 'is-todo'} />{i + 1}. {s.t}
                </button>
              ))}
            </nav>

            <section id="tr-s1" className="tr-sec" style={{ '--c': 'var(--s1)' } as React.CSSProperties}>
              {head(0)}
              <div className="tr-photo-row">
                <label className="bx-drop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.image_url && <img src={f.image_url} alt="" />}
                  {!f.image_url && <span style={{ fontSize: '2.4rem' }}>📷</span>}
                  <span className="bx-drop__label">{uploading ? 'Enviando…' : f.image_url ? 'Trocar foto' : 'Escolher foto'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
                <div style={{ display: 'grid', gap: '1rem', minWidth: 0 }}>
                  <label className="bx-field"><span>Nome do doce</span>
                    <input className="bx-input bx-input--big" required value={f.name || ''} onChange={e => setFormData({ ...f, name: e.target.value })} placeholder="Ex: Tartarugas Trufadas de Cacau Noir" />
                  </label>
                  <label className="bx-field"><span>Descrição</span>
                    <textarea className="bx-input" rows={4} value={f.description || ''} onChange={e => setFormData({ ...f, description: e.target.value })} placeholder="Textura, sabor, o que ele tem de especial…" />
                  </label>
                </div>
              </div>
              <EmojiField emoji={f.emoji || '🍫'} onChange={emoji => setFormData({ ...f, emoji })} />
            </section>

            <section id="tr-s2" className="tr-sec" style={{ '--c': 'var(--s2)' } as React.CSSProperties}>
              {head(1)}
              <TreatTypeField value={f.treat_type} onChange={treat_type => setFormData({ ...f, treat_type })} />
              <RawField checked={raw} onChange={is_raw => setFormData({ ...f, is_raw, treat_type: f.treat_type === 'raw' ? null : f.treat_type })} />
            </section>

            <section id="tr-s3" className="tr-sec" style={{ '--c': 'var(--s3)' } as React.CSSProperties}>
              {head(2)}
              <div className="tr-two">
                <label className="bx-field"><span>Preço por unidade (R$)</span>
                  <input className="bx-input" type="number" step="0.01" min="0" required value={f.price ?? ''} onChange={e => setFormData({ ...f, price: parseFloat(e.target.value) })} />
                </label>
                <label className="bx-field"><span>Pedido mínimo (un.)</span>
                  <input className="bx-input" type="number" min="1" required value={f.min_batch_size || ''} onChange={e => setFormData({ ...f, min_batch_size: parseInt(e.target.value) })} />
                  <small>Menos que isso o cliente não consegue pedir.</small>
                </label>
                <label className="bx-field"><span>De quanto em quanto</span>
                  <input className="bx-input" type="number" min="1" placeholder="1" value={f.batch_multiplier || ''} onChange={e => setFormData({ ...f, batch_multiplier: parseInt(e.target.value) })} />
                  <small>1 = qualquer quantidade.</small>
                </label>
              </div>
              {(f.min_batch_size || 0) > 0 && (
                <p className="bx-say" style={{ marginTop: 0 }}>
                  👀 O cliente poderá pedir <strong>{[0, 1, 2, 3].map(i => (f.min_batch_size || 1) + i * (f.batch_multiplier || 1)).join(', ')}…</strong> unidades.
                </p>
              )}
              <button type="button" className={`bx-switch${(f.is_available ?? true) ? ' is-on' : ''}`} onClick={() => setFormData({ ...f, is_available: !(f.is_available ?? true) })} aria-pressed={f.is_available ?? true}>
                <span>
                  <strong style={{ display: 'block' }}>{(f.is_available ?? true) ? 'Aparecendo no Menu de Eventos' : 'Escondido do menu'}</strong>
                  <span style={{ color: '#6a6a6a', fontSize: '0.9rem' }}>{(f.is_available ?? true) ? 'Os clientes podem pedir.' : 'Fica guardado aqui e ainda pode ir nas caixas.'}</span>
                </span>
                <span className="bx-switch__knob" />
              </button>
            </section>

            <section id="tr-s4" className="tr-sec" style={{ '--c': 'var(--s4)' } as React.CSSProperties}>
              {head(3)}
              <IngredientsField ingredients={f.ingredients || []} onChange={ingredients => setFormData({ ...f, ingredients })} />
            </section>

            <section id="tr-s5" className="tr-sec" style={{ '--c': 'var(--s5)' } as React.CSSProperties}>
              {head(4)}
              <AllergenFields contains={f.contains || []} mayContain={f.may_contain || []} onChange={a => setFormData({ ...f, ...a })} />
            </section>

            <section id="tr-s6" className="tr-sec" style={{ '--c': 'var(--s6)' } as React.CSSProperties}>
              {head(5)}
              <SugarCaffeineFields sugars={f.sugars} caffeine={f.caffeine} ingredients={f.ingredients || []} onChange={v => setFormData({ ...f, ...v })} />
            </section>

            <div className="bx-footer">
              <button type="button" className="bx-link" onClick={cancelEdit}>Cancelar</button>
              <div style={{ minWidth: '200px' }}>{save}</div>
            </div>
          </div>

          <aside className="tr-side">
            <div className="tr-preview" aria-label="Como aparece no menu">
              <div className="tr-preview__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {f.image_url ? <img src={f.image_url} alt="" /> : (f.emoji || '🍫')}
              </div>
              <div className="tr-preview__body">
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6a6a6a' }}>
                  {[kind && `${kind.emoji} ${kind.label}`, raw && `${RAW.emoji} ${RAW.label}`].filter(Boolean).join(' · ') || 'No menu'}
                </p>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{f.emoji || '🍫'} {f.name || 'Nome do doce'}</p>
                <p style={{ margin: '0.25rem 0 0', fontWeight: 800 }}>{(f.price ?? 0) > 0 ? `R$ ${Number(f.price).toFixed(2).replace('.', ',')}` : 'R$ —'} <span style={{ fontWeight: 400, color: '#6a6a6a' }}>/ un.</span></p>
              </div>
            </div>
            <ul className="tr-check">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => jump(s.id)} style={{ '--c': s.c } as React.CSSProperties}>
                    <span className={`tr-check__dot${done[i] ? '' : ' is-todo'}`}>{done[i] ? '✓' : i + 1}</span>
                    {s.t}
                    {!done[i] && <small>{s.todo}</small>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="tr-save" style={{ display: 'grid', gap: '0.6rem' }}>
              {save}
              {editingId && <button type="button" className="bx-link bx-link--danger" onClick={() => handleDelete(editingId)} style={{ justifySelf: 'center' }}>Excluir este doce</button>}
            </div>
          </aside>
        </form>
      </div>
    );
  }

  // ═══════════════════════════════ HOME: every treat at a glance ═══════════════════════════════
  const missing = (t: Treat) => [
    !t.image_url && 'foto',
    !(t.ingredients || []).length && 'ingredientes',
    !sugarsOf(t) && 'açúcar',
    !caffeineOf(t) && 'cafeína',
  ].filter(Boolean) as string[];
  const counts = {
    all: treats.length,
    on: treats.filter(t => t.is_available).length,
    off: treats.filter(t => !t.is_available).length,
    todo: treats.filter(t => missing(t).length > 0).length,
  };
  const visibleTreats = treats.filter(t => matchesRefine(t, refine)).filter(t =>
    status === 'on' ? t.is_available : status === 'off' ? !t.is_available : status === 'todo' ? missing(t).length > 0 : true);
  const typeGroups = anyTyped(visibleTreats) ? groupByType(visibleTreats) : null;

  const tile = (treat: Treat) => {
    const kind = treatTypeById(treat.treat_type);
    const raw = isRaw(treat);
    const miss = missing(treat);
    return (
      <div key={treat.id} className={`tr-card${treat.is_available ? '' : ' is-hidden'}`}>
        <button type="button" className="tr-card__photo" onClick={() => handleEdit(treat)} title="Editar">
          {treat.image_url
            ? <Image src={treat.image_url} alt={treat.name} fill sizes="(max-width: 700px) 100vw, 300px" style={{ objectFit: 'cover' }} />
            : <span style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: '2.6rem' }}>{treat.emoji || '🍫'}</span>}
          <span className="tr-card__tags">
            {kind && <span>{kind.emoji} {kind.label}</span>}
            {raw && <span>{RAW.emoji} {RAW.label}</span>}
            {isWholeFood(treat) === false && <span>{WHOLE_FOOD.no.emoji} {WHOLE_FOOD.no.label}</span>}
          </span>
        </button>
        <p className="tr-card__name">{treat.emoji || '🍫'} {treat.name}</p>
        <label className="tr-cat" style={{ '--c': kind?.accent ?? '#8a7a6b' } as React.CSSProperties}>
          <span className="tr-cat__dot" aria-hidden />
          <select aria-label="Categoria" value={kind?.id ?? ''} onChange={e => setCategory(treat, e.target.value || null)}>
            {TREAT_TYPES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            <option value="">✨ Sem categoria (Outros)</option>
          </select>
        </label>
        <div className="tr-card__row">
          {priceEdit?.id === treat.id ? (
            <input className="tr-price-input" autoFocus type="number" step="0.01" min="0" value={priceEdit.value}
              onChange={e => setPriceEdit({ id: treat.id, value: e.target.value })}
              onBlur={() => savePrice(treat)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setPriceEdit(null); }} />
          ) : (
            <button type="button" className="tr-price" onClick={() => setPriceEdit({ id: treat.id, value: String(treat.price ?? '') })} title="Tocar para mudar o preço">
              R$ {Number(treat.price || 0).toFixed(2).replace('.', ',')}
            </button>
          )}
          <button type="button" className={`tr-mini-switch${treat.is_available ? ' is-on' : ''}`} onClick={() => setShown(treat, !treat.is_available)} aria-pressed={treat.is_available}>
            <i />{treat.is_available ? 'No menu' : 'Escondido'}
          </button>
        </div>
        <p className="tr-card__meta">mín. {treat.min_batch_size} · de {treat.batch_multiplier || 1} em {treat.batch_multiplier || 1} · {(treat.ingredients || []).length} ingredientes</p>
        {miss.length > 0 && <div className="tr-card__missing">{miss.map(m => <span key={m}>falta {m}</span>)}</div>}
        <div className="bx-tile__actions">
          <button type="button" className="bx-link" onClick={() => handleEdit(treat)}>Editar</button>
          <button type="button" className="bx-link bx-link--danger" onClick={() => handleDelete(treat.id)}>Excluir</button>
        </div>
      </div>
    );
  };

  return (
    <div className="bx" style={{ maxWidth: '1600px' }}>
      <div className="bx-head">
        <div>
          <h1 className="bx-h1">Doces do Menu</h1>
          <p className="bx-sub">Tudo o que você faz, num olhar. Toque no preço para mudar, no botão para esconder ou mostrar.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setShowCats(v => !v)} aria-expanded={showCats}>🗂️ Categorias</button>
          <button type="button" className="bx-btn bx-btn--dark" onClick={startNew}>＋ Novo doce</button>
        </div>
      </div>

      {showCats && <CategoryManager treats={treats} onTreatsChanged={fetchTreats} onClose={() => setShowCats(false)} />}

      <div className="tr-status" role="group" aria-label="Mostrar">
        {([
          ['all', 'Todos', counts.all],
          ['on', '🟢 No menu', counts.on],
          ['off', '🙈 Escondidos', counts.off],
          ['todo', '✏️ Falta informação', counts.todo],
        ] as const).map(([k, l, n]) => (
          <button key={k} type="button" className={`tr-pill${status === k ? ' is-on' : ''}${k === 'todo' && n > 0 ? ' tr-pill--warn' : ''}`} onClick={() => setStatus(k)} aria-pressed={status === k}>
            {l} <b>{n}</b>
          </button>
        ))}
      </div>

      {/* The finer filters (type, allergens, ingredients) from before, unchanged. */}
      <style>{`
        .treats-aside { margin-bottom: 1.5rem; }
        .treats-typebar { display: flex; flex-direction: column; align-items: stretch; gap: 0.75rem; margin-bottom: 1.25rem; }
        @media (min-width: 1280px) {
          .treats-layout { display: grid; grid-template-columns: minmax(300px, 340px) minmax(0, 1fr); gap: 1.75rem; align-items: start; }
          .treats-aside { position: sticky; top: 7.5rem; max-height: calc(100vh - 9rem); overflow-y: auto; margin-bottom: 0; padding: 2px 6px 10px 2px; }
          .treats-typebar { align-items: flex-end; }
        }
      `}</style>
      <div className="treats-layout">
        <aside className="treats-aside" aria-label="Refinar busca">
          <TreatRefineMenu treats={treats} value={refine} onChange={setRefine} shown={visibleTreats.length} sheetBelow={1280} fabBottom="5.75rem" />
        </aside>
        <div className="treats-main" style={{ minWidth: 0 }}>
          <div className="treats-typebar">
            <TreatTypeBar tone="light" treats={treats} value={refine.types} onChange={(types: string[]) => setRefine({ ...refine, types })}
              toggles={styleToggles(treats, refine, setRefine)} />
          </div>

          {visibleTreats.length === 0 && (
            <div className="bx-empty">
              <p style={{ margin: '0 0 1rem', color: '#6a6a6a' }}>Nenhum doce aqui com esses filtros.</p>
              <button type="button" className="bx-btn bx-btn--ghost" onClick={() => { setStatus('all'); setRefine({ ...emptyRefine, mode: refine.mode }); }}>Mostrar todos</button>
            </div>
          )}

          {typeGroups ? typeGroups.map(group => (
            <div key={group.label}>
              <h2 className="tr-group-title"><span style={{ width: 12, height: 12, borderRadius: '50%', background: group.accent, display: 'inline-block' }} />{group.emoji} {group.label} <span style={{ color: '#6a6a6a', fontWeight: 600 }}>{group.items.length}</span></h2>
              <div className="tr-grid">{group.items.map(tile)}</div>
            </div>
          )) : <div className="tr-grid">{visibleTreats.map(tile)}</div>}
        </div>
      </div>
    </div>
  );
}
