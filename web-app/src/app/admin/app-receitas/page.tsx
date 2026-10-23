'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandConfirm } from '@/lib/brandDialog';
import ShowOnSiteSwitch from '@/components/ShowOnSiteSwitch';
import { CRAVINGS, GUIDELINES, checkGuidelines, inkFor, type RecipeRow } from '@/lib/vontade';
import RecipeFlow, { type Draft } from './RecipeFlow';
import '../caixas/caixas.css';
import '../crm/crm.css';
import './appRecipes.css';

type Filter = 'todas' | 'gratis' | 'plus' | 'rascunho' | 'revisar';
type View = { kind: 'list' } | { kind: 'edit'; draft: Draft | null };

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'gratis', label: '🎁 Grátis' },
  { id: 'plus', label: '🌴 Tropical+' },
  { id: 'rascunho', label: '📝 Rascunhos' },
  { id: 'revisar', label: '✋ Fora das regras' },
];

const errorsOf = (r: RecipeRow) => checkGuidelines([...r.ingredients, ...r.steps]).filter(i => i.level === 'erro');
const timeOf = (r: RecipeRow) => `${r.minutes} min${r.wait_minutes ? ' + geladeira' : ''}`;

/**
 * /admin/app-receitas: the recipes of the "Bateu Vontade?" app (/vontade). Photo cards like the box studio, a one-tap
 * switch to show or hide each one, ↑ ↓ for the order in the app's recipe list, and the step-by-step RecipeFlow to
 * create or change one. Every card says whether the recipe keeps to GUIDELINES (Fuhrman + Goldhamer).
 * Schema: migration_48_app_recipes.sql.
 */
export default function AdminAppRecipesPage() {
  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [missing, setMissing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [filter, setFilter] = useState<Filter>('todas');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('app_recipes').select('*').order('sort').order('name');
    setMissing(!!error);
    setRows((data || []) as RecipeRow[]);
    setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => rows.filter(r =>
    filter === 'gratis' ? r.is_free : filter === 'plus' ? !r.is_free : filter === 'rascunho' ? !r.published : filter === 'revisar' ? errorsOf(r).length > 0 : true,
  ), [rows, filter]);

  const nextSort = (rows.reduce((m, r) => Math.max(m, r.sort), 0) || 0) + 10;
  const live = rows.filter(r => r.published);
  const outOfRules = rows.filter(r => errorsOf(r).length > 0).length;

  if (view.kind === 'edit') {
    return (
      <RecipeFlow initial={view.draft} nextSort={nextSort}
        onCancel={() => setView({ kind: 'list' })}
        onDone={name => { setNotice(`✓ “${name}” salva.`); setView({ kind: 'list' }); load(); }} />
    );
  }

  const publish = async (r: RecipeRow, next: boolean) => {
    const { error } = await supabase.from('app_recipes').update({ published: next }).eq('id', r.id);
    if (error) throw error;
    setRows(list => list.map(x => (x.id === r.id ? { ...x, published: next } : x)));
  };

  // ↑ ↓: swap places with the neighbour in the full list (the order of the app's recipe list).
  const move = async (r: RecipeRow, by: number) => {
    const i = rows.findIndex(x => x.id === r.id);
    const other = rows[i + by];
    if (!other) return;
    // Equal sort numbers (two recipes added at once): nudge this one past the other instead of swapping.
    const a = r.sort === other.sort ? r.sort + by : other.sort;
    const b = other.sort === r.sort ? other.sort : r.sort;
    setRows(list => [...list.map(x => (x.id === r.id ? { ...x, sort: a } : x.id === other.id ? { ...x, sort: b } : x))].sort((p, q) => p.sort - q.sort || p.name.localeCompare(q.name)));
    await Promise.all([
      supabase.from('app_recipes').update({ sort: a }).eq('id', r.id),
      supabase.from('app_recipes').update({ sort: b }).eq('id', other.id),
    ]);
  };

  const remove = async (r: RecipeRow) => {
    const ok = await brandConfirm(`Apagar “${r.name}” para sempre? Se for só por um tempo, use o botão de esconder: ela fica guardada aqui.`, { confirmLabel: 'Apagar', danger: true });
    if (!ok) return;
    const { error } = await supabase.from('app_recipes').delete().eq('id', r.id);
    if (!error) { setRows(list => list.filter(x => x.id !== r.id)); setNotice(`“${r.name}” apagada.`); }
  };

  const duplicate = (r: RecipeRow) => {
    const { id: _id, slug: _slug, updated_at: _u, ...rest } = r;
    setView({ kind: 'edit', draft: { ...rest, name: `${r.name} (cópia)`, published: false } });
  };

  return (
    <div className="bx">
      <div className="bx-head">
        <div>
          <h1 className="bx-h1">🆘 Receitas do App</h1>
          <p className="bx-sub">O que aparece no app Bateu Vontade? · {live.length} no app · {live.filter(r => r.is_free).length} grátis · {live.filter(r => !r.is_free).length} Tropical+</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a className="bx-btn bx-btn--ghost" href="/vontade" target="_blank" rel="noopener noreferrer">📱 Abrir o app ↗</a>
          <button type="button" className="bx-btn bx-btn--gold" onClick={() => setView({ kind: 'edit', draft: null })} disabled={missing}>+ Nova receita</button>
        </div>
      </div>

      {missing && (
        <div className="bx-banner" style={{ background: '#fff4e5', border: '1px solid #f0c98a', color: '#7a4a00' }}>
          <span>Falta rodar a <strong>migration_48_app_recipes.sql</strong> no Supabase. Ela já traz as 13 receitas de lançamento; depois disso esta página liga sozinha. Até lá, o app mostra as receitas que vieram com ele.</span>
        </div>
      )}
      {notice && <div className="bx-banner bx-banner--ok"><span>{notice}</span><button type="button" className="bx-link" onClick={() => setNotice('')}>Ok</button></div>}

      <details className="bx-card ar-rulecard">
        <summary><strong>🍓 {GUIDELINES.title}</strong><span className="bx-sub" style={{ margin: 0 }}>Toda receita do app segue estas regras. O editor avisa na hora se algo escapar.</span></summary>
        <ul>{GUIDELINES.rules.map(g => <li key={g.text}><span aria-hidden>{g.emoji}</span>{g.text}</li>)}</ul>
        <p className="bx-sub">{GUIDELINES.credit}</p>
      </details>

      {rows.length > 0 && (
        <div className="crm-pills" style={{ margin: '1.25rem 0' }}>
          {FILTERS.filter(f => f.id !== 'revisar' || outOfRules > 0).map(f => (
            <button key={f.id} type="button" className={`crm-pill${filter === f.id ? ' is-on' : ''}${f.id === 'revisar' ? ' crm-pill--warn' : ''}`} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}>
              {f.label}{f.id === 'revisar' ? ` (${outOfRules})` : ''}
            </button>
          ))}
        </div>
      )}

      {!loaded ? <p className="bx-sub">Carregando…</p> : rows.length === 0 && !missing ? (
        <div className="bx-empty">
          <p className="bx-empty__icon">🍓</p>
          <h2 style={{ margin: '0 0 0.4rem' }}>Nenhuma receita ainda</h2>
          <p className="bx-sub" style={{ marginBottom: '1rem' }}>Crie a primeira: nome, vontade, tempo, ingredientes e passos. Leva uns 3 minutos.</p>
          <button type="button" className="bx-btn bx-btn--gold" onClick={() => setView({ kind: 'edit', draft: null })}>+ Criar uma receita</button>
        </div>
      ) : shown.length === 0 && rows.length > 0 ? (
        <p className="bx-sub">Nenhuma receita neste filtro.</p>
      ) : (
        <div className="bx-grid ar-grid">
          {shown.map(r => {
            const errs = errorsOf(r);
            const idx = rows.findIndex(x => x.id === r.id);
            return (
              <div key={r.id} className="bx-tile ar-tile">
                <button type="button" className="bx-tile__photo ar-tile__photo" style={{ background: r.color, color: inkFor(r.color) }}
                  onClick={() => setView({ kind: 'edit', draft: r })} aria-label={`Editar ${r.name}`}>
                  {r.photo_url ? <img src={r.photo_url} alt="" /> : <span className="ar-tile__emoji">{r.emoji}</span>}
                  <span className="bx-listing__badge">{r.is_free ? '🎁 Grátis' : '🌴 Tropical+'}</span>
                </button>
                <p className="bx-tile__title">{r.name}</p>
                <p className="bx-tile__meta">⏱️ {timeOf(r)} · {r.cravings.map(c => CRAVINGS.find(x => x.id === c)?.emoji).join(' ')}</p>
                {errs.length > 0
                  ? <span className="bx-chip" style={{ background: '#fdecea', color: '#a03027' }}>✋ Fora das regras: {[...new Set(errs.map(e => e.label))].join(', ')}</span>
                  : <span className="bx-chip" style={{ background: '#ecf7f0', color: '#1e6b3c' }}>✓ Dentro das regras</span>}
                <ShowOnSiteSwitch shown={r.published} onChange={next => publish(r, next)} what="receita" />
                <div className="bx-tile__actions">
                  <button type="button" className="bx-link" onClick={() => setView({ kind: 'edit', draft: r })}>Editar</button>
                  <button type="button" className="bx-link" onClick={() => duplicate(r)}>Duplicar</button>
                  <button type="button" className="bx-link bx-link--danger" onClick={() => remove(r)}>Apagar</button>
                  {filter === 'todas' && (
                    <span className="ar-order">
                      <button type="button" onClick={() => move(r, -1)} disabled={idx === 0} aria-label="Mais para o início">↑</button>
                      <button type="button" onClick={() => move(r, 1)} disabled={idx === rows.length - 1} aria-label="Mais para o fim">↓</button>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
