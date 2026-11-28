'use client';

import React, { useMemo, useState } from 'react';
import ImagePicker from '@/components/ImagePicker';
import { supabase } from '@/lib/supabase';
import { uploadPublicImage } from '@/lib/imageUpload';
import { ALLERGENS } from '@/lib/allergens';
import {
  DIFFICULTY, JOURNAL_LANGS, bannedClaimsIn, countFrom, previewFrom, searchFrom,
  type Difficulty, type JournalCategory, type JournalLang, type JournalRecipe, type RecipeBody, type RecipeText,
} from '@/lib/journal/journal';

export type Draft = Partial<JournalRecipe> & { body?: Partial<Record<JournalLang, RecipeBody>> };

const LANG_NAME: Record<JournalLang, string> = { pt: '🇧🇷 Português', en: '🇬🇧 English' };
const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
const toLocal = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

interface SectionDraft { name: string; ingredients: string; steps: string }
const emptySection = (): SectionDraft => ({ name: '', ingredients: '', steps: '' });

/**
 * Create or change one Recipe Journal recipe: photo, times, categories, free or premium and price, and the text in
 * Portuguese and English (the public part: title, story, what makes it special; the protected part: ingredients and
 * steps per layer, notes, storage). Saves journal_recipes (public) and journal_recipe_bodies (protected).
 */
export default function RecipeEditor({ initial, categories, onCancel, onDone }: {
  initial: Draft | null;
  categories: JournalCategory[];
  onCancel: () => void;
  onDone: (title: string) => void;
}) {
  const isNew = !initial?.id;
  const [r, setR] = useState<Draft>(() => ({
    status: 'draft', is_free: false, price_brl: 12.9, promo_price_brl: null, prep_minutes: 20, cook_minutes: 0, chill_minutes: 0,
    difficulty: 'facil', categories: ['sem-trigo'], tags: [], contains: [], gallery: [], text: {}, sort: 100,
    ...(initial || {}),
  }));
  const [lang, setLang] = useState<JournalLang>('pt');
  const [sections, setSections] = useState<Record<JournalLang, SectionDraft[]>>(() => {
    const out = {} as Record<JournalLang, SectionDraft[]>;
    for (const l of JOURNAL_LANGS) {
      const b = initial?.body?.[l];
      out[l] = b?.sections?.length
        ? b.sections.map(s => ({ name: s.name, ingredients: s.ingredients.join('\n'), steps: s.steps.join('\n') }))
        : [emptySection()];
    }
    return out;
  });
  const [extra, setExtra] = useState<Record<JournalLang, { notes: string; storage: string }>>(() => {
    const out = {} as Record<JournalLang, { notes: string; storage: string }>;
    for (const l of JOURNAL_LANGS) out[l] = { notes: initial?.body?.[l]?.notes ?? '', storage: initial?.body?.[l]?.storage ?? '' };
    return out;
  });
  const [publishAt, setPublishAt] = useState(toLocal(initial?.publish_at));
  const [uploading, setUploading] = useState<'' | 'hero' | 'gallery'>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setR(x => ({ ...x, [k]: v }));
  const t: RecipeText = (r.text?.[lang] || { title: '' }) as RecipeText;
  const setT = (k: keyof RecipeText, v: unknown) => setR(x => ({ ...x, text: { ...x.text, [lang]: { ...(x.text?.[lang] || { title: '' }), [k]: v } } }));
  const toggle = (k: 'categories' | 'contains', id: string) => {
    const list = (r[k] as string[]) || [];
    set(k, list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const bodyFor = (l: JournalLang): RecipeBody => ({
    sections: sections[l].map(s => ({ name: s.name.trim(), ingredients: lines(s.ingredients), steps: lines(s.steps) })).filter(s => s.ingredients.length || s.steps.length),
    notes: extra[l].notes.trim() || undefined,
    storage: extra[l].storage.trim() || undefined,
  });

  // Andrew's rule: never "sem glúten" / "gluten-free" / "sem açúcar" / "sugar-free".
  const banned = useMemo(() => {
    const all = JSON.stringify([r.text, sections, extra, r.tags]);
    return [...new Set(bannedClaimsIn(all))];
  }, [r.text, sections, extra, r.tags]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, where: 'hero' | 'gallery') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(where);
    try {
      for (const f of files) {
        const url = await uploadPublicImage(f, 'journal');
        if (where === 'hero') set('hero_url', url);
        else setR(x => ({ ...x, gallery: [...(x.gallery || []), url] }));
      }
    } catch (err) {
      setError(`A foto não subiu: ${err instanceof Error ? err.message : String(err)}`);
    }
    setUploading('');
    e.target.value = '';
  };

  const save = async () => {
    setError('');
    const pt = r.text?.pt;
    if (!pt?.title?.trim()) { setLang('pt'); setError('Falta o nome da receita em português.'); return; }
    if (!r.hero_url) { setError('Falta a foto principal.'); return; }
    if (!bodyFor('pt').sections.length) { setLang('pt'); setError('Falta pelo menos uma parte com ingredientes e passos em português.'); return; }
    const slug = r.slug || slugify(pt.title);
    const enTitle = r.text?.en?.title?.trim();
    const slugEn = r.slug_en || (enTitle ? slugify(enTitle) : null);
    if (!slug) { setError('O endereço da receita ficou vazio. Escreva um nome com letras.'); return; }

    // The public text carries a preview (first ingredients) and the search words, computed from the body.
    const text: Draft['text'] = {};
    const body: Partial<Record<JournalLang, RecipeBody>> = {};
    for (const l of JOURNAL_LANGS) {
      const b = bodyFor(l);
      const tl = r.text?.[l];
      if (tl?.title?.trim()) {
        text[l] = { ...tl, benefits: (tl.benefits || []).map(x => x.trim()).filter(Boolean), preview: previewFrom(b), search: searchFrom(b), count: countFrom(b) };
      }
      if (b.sections.length) body[l] = b;
    }

    setSaving(true);
    const row = {
      slug, slug_en: slugEn, status: r.status, publish_at: new Date(publishAt).toISOString(), is_free: !!r.is_free,
      price_brl: Number(r.price_brl) || 0, promo_price_brl: r.promo_price_brl ? Number(r.promo_price_brl) : null,
      sort: r.sort ?? 100, hero_url: r.hero_url, gallery: r.gallery || [], video_url: r.video_url || null,
      prep_minutes: Number(r.prep_minutes) || 0, cook_minutes: Number(r.cook_minutes) || 0, chill_minutes: Number(r.chill_minutes) || 0,
      difficulty: r.difficulty, categories: r.categories || [], tags: r.tags || [], contains: r.contains || [], text,
    };
    try {
      let id = r.id;
      if (id) {
        const { error: e } = await supabase.from('journal_recipes').update(row).eq('id', id);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.from('journal_recipes').insert([row]).select('id').single();
        if (e) throw e;
        id = data.id;
      }
      const { error: be } = await supabase.from('journal_recipe_bodies').upsert({ recipe_id: id, body }, { onConflict: 'recipe_id' });
      if (be) throw be;
      onDone(pt.title);
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message || String(e);
      setError(/duplicate key/.test(msg) ? 'Já existe uma receita com este endereço. Mude o endereço (slug) abaixo.' : `Não salvou: ${msg}`);
    }
    setSaving(false);
  };

  const themes = categories.filter(c => c.kind === 'tema');
  const diets = categories.filter(c => c.kind === 'dieta');
  const chip = (on: boolean): React.CSSProperties => ({
    padding: '0.4rem 0.75rem', borderRadius: 999, border: `1px solid ${on ? '#1e5d54' : '#ddd'}`, background: on ? '#1e5d54' : '#fff',
    color: on ? '#fff' : '#2a1a12', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
  });
  const row: React.CSSProperties = { display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' };
  const sec = sections[lang];

  return (
    <div className="bx">
      <div className="bx-head">
        <div>
          <h1 className="bx-h1">{isNew ? '✍️ Nova receita' : `✍️ ${r.text?.pt?.title || 'Receita'}`}</h1>
          <p className="bx-sub">O nome, a história e “o que ela tem de especial” todo mundo vê. Ingredientes e passo a passo só quem comprou (ou todo mundo, se for grátis).</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={onCancel}>Voltar</button>
          <button type="button" className="bx-btn bx-btn--gold" onClick={save} disabled={saving || !!uploading}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>

      {banned.length > 0 && (
        <div className="bx-banner" style={{ background: '#fdecea', border: '1px solid #f3b8b1', color: '#a03027' }}>
          <span>✋ Tire “{banned.join('”, “')}”: a gente nunca promete sem glúten ou sem açúcar. Use “sem trigo” e “SOS-free”.</span>
        </div>
      )}
      {error && <div className="bx-banner" style={{ background: '#fdecea', border: '1px solid #f3b8b1', color: '#a03027' }}><span>{error}</span></div>}

      <section className="bx-card" style={{ display: 'grid', gap: '1.2rem' }}>
        <h2 className="bx-h">📷 Fotos e vídeo</h2>
        <ImagePicker label="Foto principal (grande, no topo)" imageUrl={r.hero_url || undefined} uploading={uploading === 'hero'} onChange={e => upload(e, 'hero')} />
        <div>
          <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Mais fotos (aparecem embaixo da receita)</span>
          <div className="bx-thumbs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(r.gallery || []).map(src => (
              <span key={src} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10 }} />
                <button type="button" onClick={() => set('gallery', (r.gallery || []).filter(x => x !== src))} aria-label="Tirar foto"
                  style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', border: 0, background: '#a03027', color: '#fff', cursor: 'pointer' }}>×</button>
              </span>
            ))}
            <label className="bx-btn bx-btn--ghost" style={{ cursor: 'pointer' }}>
              {uploading === 'gallery' ? 'Enviando…' : '+ Fotos'}
              <input type="file" accept="image/*" multiple hidden onChange={e => upload(e, 'gallery')} />
            </label>
          </div>
        </div>
        <label className="bx-field">
          <span>Vídeo do preparo (opcional): link do YouTube “embed”, ou de um arquivo .mp4</span>
          <input className="bx-input" value={r.video_url || ''} onChange={e => set('video_url', e.target.value)} placeholder="https://www.youtube.com/embed/…" />
        </label>
      </section>

      <section className="bx-card" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <h2 className="bx-h">💰 Grátis ou premium</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" style={chip(!!r.is_free)} onClick={() => set('is_free', true)}>🎁 Grátis (todo mundo vê tudo)</button>
          <button type="button" style={chip(!r.is_free)} onClick={() => set('is_free', false)}>🔒 Premium (desbloqueia pagando)</button>
        </div>
        <div style={row}>
          <label className="bx-field"><span>Preço (R$)</span>
            <input className="bx-input" type="number" step="0.1" min="1" value={r.price_brl ?? ''} onChange={e => set('price_brl', Number(e.target.value))} /></label>
          <label className="bx-field"><span>Preço promocional (R$, opcional)</span>
            <input className="bx-input" type="number" step="0.1" min="0" value={r.promo_price_brl ?? ''} onChange={e => set('promo_price_brl', e.target.value ? Number(e.target.value) : null)} placeholder="vazio = sem promoção" /></label>
        </div>
        <p className="bx-sub" style={{ margin: 0 }}>Sugestão: receitas avulsas de R$ 9,90 a R$ 14,90. O preço só vale para receitas premium.</p>
      </section>

      <section className="bx-card" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <h2 className="bx-h">🗓️ Publicação</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" style={chip(r.status === 'draft')} onClick={() => set('status', 'draft')}>📝 Rascunho (só aqui)</button>
          <button type="button" style={chip(r.status === 'published')} onClick={() => set('status', 'published')}>🌍 Publicada</button>
        </div>
        <label className="bx-field"><span>Aparece no site a partir de (data futura = agendada)</span>
          <input className="bx-input" type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)} /></label>
      </section>

      <section className="bx-card" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <h2 className="bx-h">⏱️ Tempos e dificuldade</h2>
        <div style={row}>
          <label className="bx-field"><span>Preparo (min)</span><input className="bx-input" type="number" min="0" value={r.prep_minutes ?? 0} onChange={e => set('prep_minutes', Number(e.target.value))} /></label>
          <label className="bx-field"><span>Forno (min)</span><input className="bx-input" type="number" min="0" value={r.cook_minutes ?? 0} onChange={e => set('cook_minutes', Number(e.target.value))} /></label>
          <label className="bx-field"><span>Geladeira/freezer (min)</span><input className="bx-input" type="number" min="0" value={r.chill_minutes ?? 0} onChange={e => set('chill_minutes', Number(e.target.value))} /></label>
          <label className="bx-field"><span>Dificuldade</span>
            <select className="bx-input" value={r.difficulty} onChange={e => set('difficulty', e.target.value as Difficulty)}>
              {(Object.keys(DIFFICULTY) as Difficulty[]).map(d => <option key={d} value={d}>{DIFFICULTY[d].pt}</option>)}
            </select></label>
        </div>
      </section>

      <section className="bx-card" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <h2 className="bx-h">🏷️ Categorias, etiquetas e alérgenos</h2>
        <div><strong style={{ fontSize: '0.9rem' }}>Temas</strong>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {themes.map(c => <button key={c.slug} type="button" style={chip((r.categories || []).includes(c.slug))} onClick={() => toggle('categories', c.slug)}>{c.name.pt}</button>)}
          </div></div>
        <div><strong style={{ fontSize: '0.9rem' }}>Como é feita</strong>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {diets.map(c => <button key={c.slug} type="button" style={chip((r.categories || []).includes(c.slug))} onClick={() => toggle('categories', c.slug)}>{c.name.pt}</button>)}
          </div></div>
        <div><strong style={{ fontSize: '0.9rem' }}>Contém (alérgenos)</strong>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {ALLERGENS.map(a => <button key={a.id} type="button" style={chip((r.contains || []).includes(a.id))} onClick={() => toggle('contains', a.id)}>{a.emoji} {a.label}</button>)}
          </div></div>
        <label className="bx-field"><span>Etiquetas livres (separadas por vírgula; entram na busca)</span>
          <input className="bx-input" value={(r.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} placeholder="Manga, Natal, Lancheira" /></label>
      </section>

      <section className="bx-card" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 className="bx-h" style={{ margin: 0 }}>📝 Texto</h2>
          {JOURNAL_LANGS.map(l => <button key={l} type="button" style={chip(lang === l)} onClick={() => setLang(l)}>{LANG_NAME[l]}{l !== 'pt' && !r.text?.[l]?.title ? ' (vazio)' : ''}</button>)}
        </div>
        {lang !== 'pt' && <p className="bx-sub" style={{ margin: 0 }}>Sem tradução, a página em inglês mostra o texto em português.</p>}
        <label className="bx-field"><span>Nome da receita</span><input className="bx-input bx-input--big" value={t.title || ''} onChange={e => setT('title', e.target.value)} /></label>
        <label className="bx-field"><span>Subtítulo (uma linha em itálico)</span><input className="bx-input" value={t.subtitle || ''} onChange={e => setT('subtitle', e.target.value)} /></label>
        <label className="bx-field"><span>Resumo (1 ou 2 frases: aparece nos cartões e no destaque)</span><textarea className="bx-input" rows={2} value={t.summary || ''} onChange={e => setT('summary', e.target.value)} /></label>
        <label className="bx-field"><span>A história por trás da receita (público; deixe uma linha em branco entre parágrafos)</span><textarea className="bx-input" rows={7} value={t.story || ''} onChange={e => setT('story', e.target.value)} /></label>
        <label className="bx-field"><span>O que ela tem de especial (público; um por linha, ex.: “Manga: vitamina C e fibras.”)</span>
          <textarea className="bx-input" rows={4} value={(t.benefits || []).join('\n')} onChange={e => setT('benefits', e.target.value.split('\n'))} /></label>
        <label className="bx-field"><span>Rendimento</span><input className="bx-input" value={t.yield || ''} onChange={e => setT('yield', e.target.value)} placeholder={lang === 'pt' ? '8 porções' : 'Serves 8'} /></label>

        <h3 className="bx-h" style={{ marginBottom: 0 }}>🔒 A receita (só quem tem acesso vê)</h3>
        {sec.map((s, i) => (
          <div key={i} style={{ border: '1px dashed #c9a257', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.7rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              <label className="bx-field" style={{ flex: 1 }}><span>Parte {i + 1} (ex.: Base, Creme, Cobertura; vazio se for uma parte só)</span>
                <input className="bx-input" value={s.name} onChange={e => setSections(x => ({ ...x, [lang]: x[lang].map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) }))} /></label>
              {sec.length > 1 && <button type="button" className="bx-link bx-link--danger" onClick={() => setSections(x => ({ ...x, [lang]: x[lang].filter((_, j) => j !== i) }))}>Tirar parte</button>}
            </div>
            <label className="bx-field"><span>Ingredientes com quantidade (um por linha)</span>
              <textarea className="bx-input" rows={6} value={s.ingredients} onChange={e => setSections(x => ({ ...x, [lang]: x[lang].map((y, j) => (j === i ? { ...y, ingredients: e.target.value } : y)) }))} /></label>
            <label className="bx-field"><span>Passo a passo (um passo por linha)</span>
              <textarea className="bx-input" rows={6} value={s.steps} onChange={e => setSections(x => ({ ...x, [lang]: x[lang].map((y, j) => (j === i ? { ...y, steps: e.target.value } : y)) }))} /></label>
          </div>
        ))}
        <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setSections(x => ({ ...x, [lang]: [...x[lang], emptySection()] }))}>+ Outra parte (camada, cobertura…)</button>
        <label className="bx-field"><span>Dicas e variações</span><textarea className="bx-input" rows={3} value={extra[lang].notes} onChange={e => setExtra(x => ({ ...x, [lang]: { ...x[lang], notes: e.target.value } }))} /></label>
        <label className="bx-field"><span>Como guardar</span><textarea className="bx-input" rows={2} value={extra[lang].storage} onChange={e => setExtra(x => ({ ...x, [lang]: { ...x[lang], storage: e.target.value } }))} /></label>

        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>🔎 Google (opcional)</summary>
          <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.7rem' }}>
            <label className="bx-field"><span>Título no Google (vazio = nome da receita)</span><input className="bx-input" value={t.seo_title || ''} onChange={e => setT('seo_title', e.target.value)} maxLength={70} /></label>
            <label className="bx-field"><span>Descrição no Google (vazio = resumo)</span><textarea className="bx-input" rows={2} value={t.seo_description || ''} onChange={e => setT('seo_description', e.target.value)} maxLength={160} /></label>
            <label className="bx-field"><span>Endereço em português: /diario/…</span><input className="bx-input" value={r.slug || ''} onChange={e => set('slug', slugify(e.target.value))} placeholder={slugify(r.text?.pt?.title || '') || 'nome-da-receita'} /></label>
            <label className="bx-field"><span>Endereço em inglês: /en/journal/…</span><input className="bx-input" value={r.slug_en || ''} onChange={e => set('slug_en', slugify(e.target.value) || null)} placeholder={slugify(r.text?.en?.title || '') || 'recipe-name'} /></label>
          </div>
        </details>
      </section>

      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
        <button type="button" className="bx-btn bx-btn--ghost" onClick={onCancel}>Voltar</button>
        <button type="button" className="bx-btn bx-btn--gold" onClick={save} disabled={saving || !!uploading}>{saving ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </div>
  );
}
