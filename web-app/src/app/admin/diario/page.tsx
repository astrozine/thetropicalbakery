'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandConfirm } from '@/lib/brandDialog';
import RecipeEditor, { type Draft } from './RecipeEditor';
import { Categories, Codes, Sales } from './Extras';
import Collections from './Collections';
import {
  DEFAULT_CATEGORIES, fmtBRL, isLive, priceOf, recipeHref, textOf,
  type JournalCategory, type JournalRecipe, type RecipeBody, type JournalLang,
} from '@/lib/journal/journal';
import '../caixas/caixas.css';
import '../crm/crm.css';

type Tab = 'receitas' | 'colecoes' | 'categorias' | 'cupons' | 'vendas';
const TABS: { id: Tab; label: string }[] = [
  { id: 'receitas', label: '📖 Receitas' },
  { id: 'colecoes', label: '📚 Coleções' },
  { id: 'vendas', label: '💰 Vendas e números' },
  { id: 'cupons', label: '🏷️ Cupons' },
  { id: 'categorias', label: '🗂️ Categorias' },
];

/**
 * /admin/diario: the Recipe Journal (/diario, /en/journal). Photo cards with one-tap switches (published, featured,
 * free or premium), the editor, the categories, discount codes, and sales with views. Schema: migration_55.
 */
export default function AdminJournalPage() {
  const [tab, setTab] = useState<Tab>('receitas');
  const [rows, setRows] = useState<JournalRecipe[]>([]);
  const [cats, setCats] = useState<JournalCategory[]>(DEFAULT_CATEGORIES);
  const [missing, setMissing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Draft | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<'todas' | 'gratis' | 'premium' | 'rascunho'>('todas');

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([
      supabase.from('journal_recipes').select('*').order('publish_at', { ascending: false }),
      supabase.from('journal_categories').select('*').order('sort'),
    ]);
    setMissing(!!r.error);
    setRows((r.data || []) as JournalRecipe[]);
    if (c.data?.length) setCats(c.data as JournalCategory[]);
    setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => rows.filter(r =>
    filter === 'gratis' ? r.is_free : filter === 'premium' ? !r.is_free : filter === 'rascunho' ? !isLive(r) : true), [rows, filter]);

  const open = async (r: JournalRecipe) => {
    const { data } = await supabase.from('journal_recipe_bodies').select('body').eq('recipe_id', r.id).maybeSingle();
    setEditing({ ...r, body: (data?.body || {}) as Partial<Record<JournalLang, RecipeBody>> });
  };

  const patch = async (r: JournalRecipe, values: Partial<JournalRecipe>, msg: string) => {
    const { error } = await supabase.from('journal_recipes').update(values).eq('id', r.id);
    if (error) { setNotice(`Não mudou: ${error.message}`); return; }
    setRows(list => list.map(x => (x.id === r.id ? { ...x, ...values } : x)));
    setNotice(msg);
  };

  const feature = async (r: JournalRecipe) => {
    // One featured recipe at a time (the database insists): switch the old one off first.
    const { error: e1 } = await supabase.from('journal_recipes').update({ is_featured: false }).eq('is_featured', true);
    if (e1) { setNotice(`Não mudou: ${e1.message}`); return; }
    const { error } = await supabase.from('journal_recipes').update({ is_featured: true }).eq('id', r.id);
    if (error) { setNotice(`Não mudou: ${error.message}`); return; }
    setRows(list => list.map(x => ({ ...x, is_featured: x.id === r.id })));
    setNotice(`★ “${textOf(r, 'pt').title}” é a receita da semana (aparece no site em até 1 minuto).`);
  };

  const remove = async (r: JournalRecipe) => {
    const ok = await brandConfirm(`Apagar “${textOf(r, 'pt').title}” para sempre? Quem comprou perde o acesso. Para tirar do site só por um tempo, use “Rascunho”.`, { confirmLabel: 'Apagar', danger: true });
    if (!ok) return;
    const { error } = await supabase.from('journal_recipes').delete().eq('id', r.id);
    if (!error) { setRows(list => list.filter(x => x.id !== r.id)); setNotice('Apagada.'); }
    else setNotice(`Não apagou: ${error.message}`);
  };

  if (editing !== undefined) {
    return (
      <RecipeEditor initial={editing} categories={cats}
        onCancel={() => setEditing(undefined)}
        onDone={title => { setNotice(`✓ “${title}” salva. No site em até 1 minuto.`); setEditing(undefined); load(); }} />
    );
  }

  const live = rows.filter(r => isLive(r));
  return (
    <div className="bx">
      <div className="bx-head">
        <div>
          <h1 className="bx-h1">📖 Diário de Receitas</h1>
          <p className="bx-sub">{live.length} no site · {live.filter(r => r.is_free).length} grátis · {live.filter(r => !r.is_free).length} premium</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a className="bx-btn bx-btn--ghost" href="/diario" target="_blank" rel="noopener noreferrer">Ver o Diário ↗</a>
          <button type="button" className="bx-btn bx-btn--gold" onClick={() => setEditing(null)} disabled={missing}>+ Nova receita</button>
        </div>
      </div>

      {missing && loaded && (
        <div className="bx-banner" style={{ background: '#fff4e5', border: '1px solid #f0c98a', color: '#7a4a00' }}>
          <span>Falta rodar a <strong>migration_55_recipe_journal.sql</strong> no Supabase. Ela já traz as 7 receitas do Sweet Escape. Até lá, o site mostra essas 7 e ninguém consegue comprar.</span>
        </div>
      )}
      {notice && <div className="bx-banner bx-banner--ok"><span>{notice}</span><button type="button" className="bx-link" onClick={() => setNotice('')}>Ok</button></div>}

      <div className="crm-pills" style={{ margin: '1rem 0' }}>
        {TABS.map(x => <button key={x.id} type="button" className={`crm-pill${tab === x.id ? ' is-on' : ''}`} aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>{x.label}</button>)}
      </div>

      {tab === 'categorias' && <Categories cats={cats} onChange={load} />}
      {tab === 'cupons' && <Codes />}
      {tab === 'colecoes' && <Collections recipes={rows} />}
      {tab === 'vendas' && <Sales recipes={rows} />}

      {tab === 'receitas' && (
        <>
          <div className="crm-pills" style={{ margin: '0 0 1rem' }}>
            {(['todas', 'gratis', 'premium', 'rascunho'] as const).map(f => (
              <button key={f} type="button" className={`crm-pill${filter === f ? ' is-on' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === 'todas' ? 'Todas' : f === 'gratis' ? '🎁 Grátis' : f === 'premium' ? '🔒 Premium' : '📝 Rascunhos e agendadas'}
              </button>
            ))}
          </div>
          {!loaded ? <p className="bx-sub">Carregando…</p> : (
            <div className="bx-grid">
              {shown.map(r => {
                const t = textOf(r, 'pt');
                const scheduled = r.status === 'published' && !isLive(r);
                return (
                  <div key={r.id} className="bx-tile">
                    <button type="button" className="bx-tile__photo" onClick={() => open(r)} aria-label={`Editar ${t.title}`} style={{ position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.hero_url && <img src={r.hero_url} alt="" />}
                      <span className="bx-listing__badge">{r.is_featured ? '★ Da semana' : r.is_free ? '🎁 Grátis' : `🔒 ${fmtBRL(priceOf(r))}`}</span>
                    </button>
                    <p className="bx-tile__title">{t.title}</p>
                    <p className="bx-tile__meta">
                      {r.status === 'draft' ? '📝 Rascunho' : scheduled ? `🗓️ Agendada para ${new Date(r.publish_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : '🌍 No site'}
                      {' · '}👀 {r.views} · {r.text.en?.title ? '🇬🇧 ok' : '🇬🇧 falta'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {!r.is_featured && <button type="button" className="bx-chip" style={{ cursor: 'pointer', border: 0 }} onClick={() => feature(r)}>★ Receita da semana</button>}
                      <button type="button" className="bx-chip" style={{ cursor: 'pointer', border: 0 }}
                        onClick={() => patch(r, { is_free: !r.is_free }, r.is_free ? `🔒 “${t.title}” agora é premium (${fmtBRL(priceOf(r))}).` : `🎁 “${t.title}” agora é grátis.`)}>
                        {r.is_free ? '→ Premium' : '→ Grátis'}
                      </button>
                      <button type="button" className="bx-chip" style={{ cursor: 'pointer', border: 0 }}
                        onClick={() => patch(r, { status: r.status === 'draft' ? 'published' : 'draft' }, r.status === 'draft' ? `🌍 “${t.title}” publicada.` : `📝 “${t.title}” saiu do site.`)}>
                        {r.status === 'draft' ? '→ Publicar' : '→ Rascunho'}
                      </button>
                    </div>
                    <div className="bx-tile__actions">
                      <button type="button" className="bx-link" onClick={() => open(r)}>Editar</button>
                      <a className="bx-link" href={recipeHref('pt', r)} target="_blank" rel="noopener noreferrer">Ver ↗</a>
                      <button type="button" className="bx-link bx-link--danger" onClick={() => remove(r)}>Apagar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
