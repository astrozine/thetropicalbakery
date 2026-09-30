'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';
import ToggleSwitch from '@/components/ToggleSwitch';
import ShowOnSiteSwitch from '@/components/ShowOnSiteSwitch';
import { AllergenFields, EmojiField, IngredientsField, RawField, SugarCaffeineFields, TreatTypeField } from '@/components/TreatDetailsFields';
import TreatInfo from '@/components/TreatInfo';
import TreatRefineMenu, { emptyRefine, matchesRefine, refineCount, type RefineState } from '@/components/TreatRefineMenu';
import TreatTypeBar from '@/components/TreatTypeBar';
import RawSwitch from '@/components/RawSwitch';
import { uploadPublicImage } from '@/lib/imageUpload';
import { isMissingSugarColumns, syncTreatIntoBoxes } from '@/lib/treatSync';
import { caffeineOf, sugarOf } from '@/lib/sugarCaffeine';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { RAW, anyTyped, groupByType, isRaw, matchesRaw, textOn, treatTypeById } from '@/lib/treatTypes';

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
  sugar?: string | null;
  caffeine?: string | null;
}

const field: React.CSSProperties = { width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' };
const label: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' };
const card: React.CSSProperties = { background: 'white', padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };

export default function TreatsAdmin() {
  const [treats, setTreats] = useState<Treat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Treat>>({});
  const [uploading, setUploading] = useState(false);
  const [refine, setRefine] = useState<RefineState>(emptyRefine);

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
      sugar: formData.sugar ?? null,
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
    // Before migration_32: save everything else, and say that sugar/caffeine need it.
    const withoutSugarColumns = () => {
      const rest = { ...row };
      delete rest.sugar;
      delete rest.caffeine;
      row = rest;
      brandAlert('Salvei o doce, mas açúcar e cafeína só ficam guardados depois de rodar a migration_32_sugar_caffeine.sql no Supabase.');
    };

    // Supabase names one missing column per try, in any order, so drop whichever it names and try again.
    const saveWithFallbacks = async (write: () => PromiseLike<{ error: { message: string } | null }>) => {
      let { error } = await write();
      for (let tries = 0; error && tries < 2; tries++) {
        if (missingRawColumn(error.message) && 'is_raw' in row) withoutRawColumn();
        else if (isMissingSugarColumns(error.message) && 'sugar' in row) withoutSugarColumns();
        else break;
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
    fetchTreats();
  };

  const handleEdit = (treat: Treat) => {
    setEditingId(treat.id);
    setFormData(treat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!(await brandConfirm('Tem certeza que deseja excluir este item?', { danger: true, confirmLabel: 'Sim, remover' }))) return;

    const { error } = await supabase.from('treats').delete().eq('id', id);
    if (error) brandAlert('Erro ao deletar: ' + error.message);
    else fetchTreats();
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
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando doces...</div>;

  const visibleTreats = treats.filter(t => matchesRefine(t, refine));

  // One card, reused whether the list is grouped by type or shown flat.
  const renderTreatCard = (treat: Treat, grouped = false) => {
    const kind = treatTypeById(treat.treat_type);
    const raw = isRaw(treat);
    return (
      <div key={treat.id} style={{ background: 'white', borderRadius: grouped ? '0 0 12px 12px' : '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ position: 'relative', height: '200px', background: '#f5f6fa', opacity: treat.is_available ? 1 : 0.55, filter: treat.is_available ? undefined : 'grayscale(0.6)' }}>
          {treat.image_url ? (
            <Image src={treat.image_url} alt={treat.name} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bdc3c7' }}>Sem Foto</div>
          )}
          {!treat.is_available && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#9a5b00', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              🙈 Escondido
            </div>
          )}
          <div style={{ position: 'absolute', left: '10px', bottom: '10px', right: '10px', display: 'flex', flexWrap: 'wrap-reverse', gap: '0.3rem' }}>
            {raw && (
              <span style={{ background: RAW.accent, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                {RAW.emoji} {RAW.label}
              </span>
            )}
            {kind && (
              <span style={{ background: 'rgba(60,42,33,0.85)', color: '#fdfaf3', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                {kind.emoji} {kind.label}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '0.9rem' }}>
            <ShowOnSiteSwitch what="doce" shown={treat.is_available} onChange={v => setShown(treat, v)} />
          </div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#2c3e50' }}>{treat.emoji || '🍫'} {treat.name}</h3>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem', margin: '0 0 0.75rem' }}>R$ {treat.price.toFixed(2).replace('.', ',')}</p>

          <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '0.75rem' }}>
            {(treat.ingredients || []).length} ingredientes · {(treat.contains || []).length} alérgenos
            {(treat.ingredients || []).length + (treat.contains || []).length + (treat.may_contain || []).length === 0 && (
              <span style={{ color: '#e67e22', fontWeight: 'bold' }}> — falta preencher</span>
            )}
            {(!sugarOf(treat) || !caffeineOf(treat)) && (
              <span style={{ display: 'block', color: '#e67e22', fontWeight: 'bold', marginTop: '0.2rem' }}>
                Falta: {[!sugarOf(treat) && 'açúcar', !caffeineOf(treat) && 'cafeína'].filter(Boolean).join(' e ')}
              </span>
            )}
          </p>

          {(treat.ingredients || []).length + (treat.contains || []).length + (treat.may_contain || []).length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <TreatInfo ingredients={treat.ingredients} contains={treat.contains} may_contain={treat.may_contain} sugar={treat.sugar} caffeine={treat.caffeine} showEmptyNote={false} />
            </div>
          )}

          <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1.5rem', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
            <div><strong>Min:</strong> {treat.min_batch_size} un.</div>
            <div><strong>Aumenta de:</strong> {treat.batch_multiplier} em {treat.batch_multiplier}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <button onClick={() => handleEdit(treat)} style={{ flex: 1, padding: '0.5rem', background: '#f1c40f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Editar
            </button>
            <button onClick={() => handleDelete(treat.id)} style={{ flex: 1, padding: '0.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };
  const typeGroups = anyTyped(visibleTreats) ? groupByType(visibleTreats) : null;
  const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.5rem' };

  return (
    <div style={{ maxWidth: '2200px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Catálogo de Doces (Menu de Eventos)</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7, maxWidth: '760px' }}>
        Os mesmos doces podem estar aqui e dentro das Caixas de Degustação. Ingredientes e alérgenos que você mudar aqui são atualizados
        também nas caixas que incluem o doce. Ainda testando uma receita? Use o botão <strong>Aparecendo no site</strong> em cada doce para
        escondê-lo até ficar pronto: ele continua guardado aqui.
      </p>

      <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', color: '#3c2a21' }}>
        {editingId ? 'Editar Doce' : 'Adicionar Novo Doce'}
      </h2>

      <form onSubmit={handleSave} style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', alignItems: 'start' }}>

          {/* 1: the menu item */}
          <div style={{ ...card, display: 'grid', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#2c3e50' }}>🧁 Sobre o doce</h3>

            <ImagePicker label="Imagem" imageUrl={formData.image_url} uploading={uploading} onChange={handleImageUpload} />

            <div>
              <label style={label}>Nome do Doce</label>
              <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={field} />
            </div>

            <div>
              <label style={label}>Descrição</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...field, minHeight: '100px' }} />
            </div>

            <TreatTypeField value={formData.treat_type} onChange={treat_type => setFormData({ ...formData, treat_type })} />

            <RawField
              checked={isRaw(formData)}
              onChange={is_raw => setFormData({ ...formData, is_raw, treat_type: formData.treat_type === 'raw' ? null : formData.treat_type })}
            />

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div>
                <label style={label}>Preço Unitário (R$)</label>
                <input type="number" step="0.01" required value={formData.price || ''} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} style={field} />
              </div>
              <div>
                <label style={label}>Pedido Mínimo (un.)</label>
                <input type="number" min="1" required value={formData.min_batch_size || ''} onChange={e => setFormData({ ...formData, min_batch_size: parseInt(e.target.value) })} style={field} />
                <small style={{ color: '#7f8c8d' }}>Menos que isso o cliente não consegue pedir.</small>
              </div>
              <div>
                <label style={label}>Aumentar de quanto em quanto</label>
                <input type="number" min="1" placeholder="1" value={formData.batch_multiplier || ''} onChange={e => setFormData({ ...formData, batch_multiplier: parseInt(e.target.value) })} style={field} />
                <small style={{ color: '#7f8c8d' }}>Use 1 se o cliente pode pedir qualquer quantidade.</small>
              </div>
            </div>

            {(formData.min_batch_size || 0) > 0 && (
              <p style={{ background: '#fdf7ee', border: '1px solid #e8e1d7', borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.9rem', color: '#594a42', marginTop: '-0.5rem' }}>
                👀 O cliente poderá pedir:{' '}
                <strong>
                  {[0, 1, 2, 3].map(i => (formData.min_batch_size || 1) + i * (formData.batch_multiplier || 1)).join(', ')}…
                </strong>{' '}
                unidades.
              </p>
            )}

            <ToggleSwitch
              checked={formData.is_available ?? true}
              onChange={v => setFormData({ ...formData, is_available: v })}
              label="Mostrar este doce no Menu"
              onText="Ativado — aparecendo no menu"
              offText="Escondido — ainda em preparo ou fora do menu (fica guardado aqui e pode ir em caixas)"
            />

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando…' : editingId ? 'Salvar Alterações' : 'Adicionar Doce'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{ padding: '0.8rem 2rem', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* 2: what's in it, and allergens stacked underneath so this column fills the height of the first */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ ...card, display: 'grid', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#2c3e50' }}>🌿 Ingredientes</h3>
              <EmojiField emoji={formData.emoji || '🍫'} onChange={emoji => setFormData({ ...formData, emoji })} />
              <IngredientsField ingredients={formData.ingredients || []} onChange={ingredients => setFormData({ ...formData, ingredients })} />
            </div>

            <div style={{ ...card, display: 'grid', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#2c3e50' }}>⚠️ Alérgenos, açúcar e cafeína</h3>
              <AllergenFields
                contains={formData.contains || []}
                mayContain={formData.may_contain || []}
                onChange={a => setFormData({ ...formData, ...a })}
              />
              <SugarCaffeineFields
                sugar={formData.sugar}
                caffeine={formData.caffeine}
                ingredients={formData.ingredients || []}
                onChange={v => setFormData({ ...formData, ...v })}
              />
            </div>
          </div>
        </div>
      </form>

      {/* Refine the list: folders of allergens and ingredients. A sticky left column on wide screens, above the list otherwise. */}
      <style>{`
        .treats-aside { margin-bottom: 1.5rem; }
        /* Same place as on /menu: the type picker sits at the top of the catalogue column,
           pushed to the right once there's room for it beside the heading. */
        .treats-typebar { display: flex; flex-direction: column; align-items: stretch; gap: 0.75rem; margin-bottom: 1.25rem; }
        @media (min-width: 1280px) {
          .treats-layout { display: grid; grid-template-columns: minmax(320px, 380px) minmax(0, 1fr); gap: 1.75rem; align-items: start; }
          .treats-aside { position: sticky; top: 7.5rem; max-height: calc(100vh - 9rem); overflow-y: auto; margin-bottom: 0; padding: 2px 6px 10px 2px; }
          .treats-typebar { align-items: flex-end; }
        }
      `}</style>
      <div className="treats-layout">
      <aside className="treats-aside" aria-label="Refinar busca">
        <TreatRefineMenu treats={treats} value={refine} onChange={setRefine} shown={visibleTreats.length} defaultOpen sheetBelow={1280} fabBottom="5.75rem" />
      </aside>

      <div className="treats-main">
      <div className="treats-typebar">
        <RawSwitch tone="light" treats={treats} value={refine.raw || 'all'} onChange={raw => setRefine({ ...refine, raw })} />
        <TreatTypeBar tone="light" treats={treats.filter(t => matchesRaw(t, refine.raw || 'all'))} value={refine.types} onChange={(types: string[]) => setRefine({ ...refine, types })} />
      </div>

      {visibleTreats.length === 0 && (
        <div style={{ ...card, textAlign: 'center', color: '#7f8c8d' }}>
          <p style={{ marginBottom: '1rem' }}>Nenhum doce combina com esses filtros.</p>
          {refineCount(refine) > 0 && (
            <button type="button" onClick={() => setRefine({ ...emptyRefine, mode: refine.mode })}
              style={{ padding: '0.6rem 1.25rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Treats List: grouped once at least one treat has a type, same idea as the overview's own
          Atalhos grid — one continuous grid, the next category just slides in after the last card,
          and only the first card of each group carries the little coloured tab with its name.
          Otherwise (nothing typed yet) it's the same flat grid it always was. */}
      {typeGroups ? (
        <div style={cardGrid}>
          {typeGroups.flatMap(group => group.items.map((treat, i) => (
            <div key={treat.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ height: '1.7rem', display: 'flex', alignItems: 'flex-end', borderBottom: `4px solid ${group.accent}` }}>
                {i === 0 && (
                  <span style={{
                    display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontSize: '0.76rem', fontWeight: 800, lineHeight: 1, padding: '0.38rem 0.7rem', borderRadius: '8px 8px 0 0',
                    background: group.accent, color: textOn(group.accent),
                  }}>
                    {group.emoji} {group.label}
                  </span>
                )}
              </div>
              {renderTreatCard(treat, true)}
            </div>
          )))}
        </div>
      ) : (
        <div style={cardGrid}>{visibleTreats.map(t => renderTreatCard(t))}</div>
      )}
      </div>
      </div>
    </div>
  );
}
