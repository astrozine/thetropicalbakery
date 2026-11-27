'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ImagePicker from '@/components/ImagePicker';
import { supabase } from '@/lib/supabase';
import { brandConfirm } from '@/lib/brandDialog';
import { uploadPublicImage } from '@/lib/imageUpload';
import {
  bannedClaimsIn, collectionHref, collectionTextOf, fmtBRL, priceOf, textOf,
  type CollectionText, type JournalCollection, type JournalLang, type JournalRecipe,
} from '@/lib/journal/journal';

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const blank = (): JournalCollection => ({ id: '', slug: '', published: false, price_brl: 29.9, promo_price_brl: null, cover_url: null, sort: 100, text: { pt: { title: '' }, en: { title: '' } }, recipe_ids: [] });

/**
 * Admin › Diário › Coleções: themed bundles sold as one product. Pick the recipes (in order), the price, a cover and the
 * words in PT and EN; the page shows what they would cost one by one, so the saving is always visible.
 */
export default function Collections({ recipes }: { recipes: JournalRecipe[] }) {
  const [list, setList] = useState<JournalCollection[]>([]);
  const [edit, setEdit] = useState<JournalCollection | null>(null);
  const [lang, setLang] = useState<JournalLang>('pt');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [k, kr] = await Promise.all([
      supabase.from('journal_collections').select('*').order('sort'),
      supabase.from('journal_collection_recipes').select('collection_id, recipe_id, sort').order('sort'),
    ]);
    const links = (kr.data || []) as { collection_id: string; recipe_id: string }[];
    setList(((k.data || []) as Omit<JournalCollection, 'recipe_ids'>[]).map(x => ({ ...x, recipe_ids: links.filter(l => l.collection_id === x.id).map(l => l.recipe_id) })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const separately = (ids: string[]) => ids.map(id => recipes.find(r => r.id === id)).filter(r => r && !r.is_free).reduce((s, r) => s + priceOf(r!), 0);

  const toggle = async (k: JournalCollection) => {
    const { error } = await supabase.from('journal_collections').update({ published: !k.published }).eq('id', k.id);
    setMsg(error ? `Não mudou: ${error.message}` : k.published ? '📝 Saiu do site.' : '🌍 Publicada. Aparece no Diário em até 1 minuto.');
    load();
  };
  const remove = async (k: JournalCollection) => {
    if (!(await brandConfirm(`Apagar a coleção “${collectionTextOf(k, 'pt').title}”? Quem já comprou perde o acesso às receitas dela.`, { confirmLabel: 'Apagar', danger: true }))) return;
    await supabase.from('journal_collections').delete().eq('id', k.id);
    load();
  };

  if (edit) {
    const t = (edit.text[lang] || { title: '' }) as CollectionText;
    const setT = (v: Partial<CollectionText>) => setEdit({ ...edit, text: { ...edit.text, [lang]: { ...t, ...v } } });
    const pick = (id: string) => setEdit({ ...edit, recipe_ids: edit.recipe_ids.includes(id) ? edit.recipe_ids.filter(x => x !== id) : [...edit.recipe_ids, id] });
    const move = (i: number, d: number) => {
      const ids = [...edit.recipe_ids]; const j = i + d;
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]]; setEdit({ ...edit, recipe_ids: ids });
    };
    const sep = separately(edit.recipe_ids);
    const price = priceOf(edit);
    const banned = bannedClaimsIn(JSON.stringify(edit.text));

    const save = async () => {
      setMsg('');
      const title = edit.text.pt?.title?.trim();
      if (!title) { setLang('pt'); setMsg('Falta o nome em português.'); return; }
      if (!edit.recipe_ids.length) { setMsg('Escolha pelo menos uma receita.'); return; }
      setBusy(true);
      const row = {
        slug: edit.slug || slugify(title), published: edit.published, price_brl: Number(edit.price_brl) || 0,
        promo_price_brl: edit.promo_price_brl ? Number(edit.promo_price_brl) : null, cover_url: edit.cover_url || null,
        sort: Number(edit.sort) || 100, text: edit.text,
      };
      const res = edit.id
        ? await supabase.from('journal_collections').update(row).eq('id', edit.id).select('id').single()
        : await supabase.from('journal_collections').insert([row]).select('id').single();
      if (res.error) { setBusy(false); setMsg(/duplicate/.test(res.error.message) ? 'Já existe uma coleção com esse endereço. Mude o nome ou o endereço.' : `Não salvou: ${res.error.message}`); return; }
      const id = res.data.id as string;
      await supabase.from('journal_collection_recipes').delete().eq('collection_id', id);
      const { error } = await supabase.from('journal_collection_recipes').insert(edit.recipe_ids.map((recipe_id, i) => ({ collection_id: id, recipe_id, sort: (i + 1) * 10 })));
      setBusy(false);
      if (error) { setMsg(`As receitas não salvaram: ${error.message}`); return; }
      setMsg(`✓ “${title}” salva.`);
      setEdit(null);
      load();
    };

    return (
      <section className="bx-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 className="bx-h" style={{ margin: 0 }}>{edit.id ? 'Editar coleção' : 'Nova coleção'}</h2>
          <button type="button" className="bx-link" onClick={() => setEdit(null)}>← Voltar</button>
        </div>
        {msg && <p className="bx-sub" style={{ fontWeight: 700 }}>{msg}</p>}
        {banned.length > 0 && <p className="bx-sub" style={{ color: '#a2331f', fontWeight: 700 }}>✋ Tire “{banned.join('”, “')}”: nada de sem glúten / sem açúcar. Use “sem trigo”.</p>}

        <ImagePicker label="Capa (opcional: sem capa, usamos as fotos das receitas)" imageUrl={edit.cover_url || undefined} uploading={uploading}
          onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            setUploading(true);
            try { setEdit({ ...edit, cover_url: await uploadPublicImage(f, 'journal') }); } catch (err) { setMsg(`A foto não subiu: ${err instanceof Error ? err.message : String(err)}`); }
            setUploading(false); e.target.value = '';
          }} />

        <div className="crm-pills">
          {(['pt', 'en'] as const).map(l => <button key={l} type="button" className={`crm-pill${lang === l ? ' is-on' : ''}`} onClick={() => setLang(l)}>{l === 'pt' ? '🇧🇷 Português' : '🇬🇧 English'}</button>)}
        </div>
        <label className="bx-field"><span>Nome</span><input className="bx-input" value={t.title || ''} onChange={e => setT({ title: e.target.value })} placeholder={lang === 'pt' ? 'Natal Tropical' : 'Tropical Christmas'} /></label>
        <label className="bx-field"><span>Uma frase (aparece no cartão e no topo)</span><input className="bx-input" value={t.summary || ''} onChange={e => setT({ summary: e.target.value })} /></label>
        <label className="bx-field"><span>Texto da página (opcional; parágrafos separados por uma linha em branco)</span><textarea className="bx-input" rows={5} value={t.description || ''} onChange={e => setT({ description: e.target.value })} /></label>

        <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <label className="bx-field"><span>Preço (R$)</span><input className="bx-input" type="number" step="0.1" min={0} value={edit.price_brl} onChange={e => setEdit({ ...edit, price_brl: Number(e.target.value) })} /></label>
          <label className="bx-field"><span>Preço promocional (opcional)</span><input className="bx-input" type="number" step="0.1" min={0} value={edit.promo_price_brl ?? ''} onChange={e => setEdit({ ...edit, promo_price_brl: e.target.value ? Number(e.target.value) : null })} /></label>
          <label className="bx-field"><span>Endereço</span><input className="bx-input" value={edit.slug} onChange={e => setEdit({ ...edit, slug: slugify(e.target.value) })} placeholder={slugify(edit.text.pt?.title || '') || 'natal-tropical'} /></label>
          <label className="bx-field"><span>Ordem</span><input className="bx-input" type="number" value={edit.sort} onChange={e => setEdit({ ...edit, sort: Number(e.target.value) })} /></label>
        </div>
        <p className="bx-sub" style={{ margin: 0 }}>
          Separadas, as receitas premium custam <strong>{fmtBRL(sep)}</strong>. A coleção sai por <strong>{fmtBRL(price)}</strong>
          {sep > price ? <> : economia de <strong>{fmtBRL(sep - price)}</strong> ({Math.round(((sep - price) / sep) * 100)}%).</> : '.'}
        </p>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 700 }}>
          <input type="checkbox" checked={edit.published} onChange={e => setEdit({ ...edit, published: e.target.checked })} /> No site (publicada)
        </label>

        <div>
          <h3 className="bx-h" style={{ fontSize: '1rem' }}>Receitas nesta coleção ({edit.recipe_ids.length})</h3>
          <ol style={{ margin: '0 0 1rem', paddingLeft: '1.2rem' }}>
            {edit.recipe_ids.map((id, i) => {
              const r = recipes.find(x => x.id === id);
              return (
                <li key={id} style={{ padding: '0.25rem 0' }}>
                  {r ? textOf(r, 'pt').title : '(apagada)'} {r && !r.is_free ? `· ${fmtBRL(priceOf(r))}` : '· grátis'}{' '}
                  <button type="button" className="bx-link" onClick={() => move(i, -1)} aria-label="Subir">↑</button>
                  <button type="button" className="bx-link" onClick={() => move(i, 1)} aria-label="Descer">↓</button>
                  <button type="button" className="bx-link bx-link--danger" onClick={() => pick(id)}>tirar</button>
                </li>
              );
            })}
          </ol>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {recipes.filter(r => !edit.recipe_ids.includes(r.id)).map(r => (
              <button key={r.id} type="button" className="bx-chip" style={{ cursor: 'pointer', border: 0 }} onClick={() => pick(r.id)}>+ {textOf(r, 'pt').title}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="bx-btn bx-btn--gold" onClick={save} disabled={busy}>{busy ? 'Salvando…' : 'Salvar coleção'}</button>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setEdit(null)}>Cancelar</button>
        </div>
      </section>
    );
  }

  return (
    <section className="bx-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <p className="bx-sub" style={{ margin: 0 }}>Pacotes temáticos vendidos de uma vez, com preço melhor que comprar receita por receita. Quem compra abre todas as receitas da coleção.</p>
        <button type="button" className="bx-btn bx-btn--gold" onClick={() => { setLang('pt'); setEdit(blank()); }}>+ Nova coleção</button>
      </div>
      {msg && <p className="bx-sub" style={{ fontWeight: 700 }}>{msg}</p>}
      <div className="bx-grid" style={{ marginTop: '1rem' }}>
        {list.map(k => {
          const kt = collectionTextOf(k, 'pt');
          const cover = k.cover_url || recipes.find(r => r.id === k.recipe_ids[0])?.hero_url;
          const sep = separately(k.recipe_ids);
          return (
            <div key={k.id} className="bx-tile">
              <button type="button" className="bx-tile__photo" onClick={() => { setLang('pt'); setEdit(k); }} aria-label={`Editar ${kt.title}`} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {cover && <img src={cover} alt="" />}
                <span className="bx-listing__badge">📚 {fmtBRL(priceOf(k))}</span>
              </button>
              <p className="bx-tile__title">{kt.title}</p>
              <p className="bx-tile__meta">{k.published ? '🌍 No site' : '📝 Rascunho'} · {k.recipe_ids.length} receitas{sep > priceOf(k) ? ` · economia ${fmtBRL(sep - priceOf(k))}` : ''}</p>
              <div className="bx-tile__actions">
                <button type="button" className="bx-link" onClick={() => { setLang('pt'); setEdit(k); }}>Editar</button>
                <button type="button" className="bx-link" onClick={() => toggle(k)}>{k.published ? 'Tirar do site' : 'Publicar'}</button>
                {k.published && <a className="bx-link" href={collectionHref('pt', k.slug)} target="_blank" rel="noopener noreferrer">Ver ↗</a>}
                <button type="button" className="bx-link bx-link--danger" onClick={() => remove(k)}>Apagar</button>
              </div>
            </div>
          );
        })}
      </div>
      {list.length === 0 && <p className="bx-sub">Nenhuma coleção ainda.</p>}
    </section>
  );
}
