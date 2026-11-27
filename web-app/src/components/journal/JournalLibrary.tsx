'use client';

import { useMemo, useState } from 'react';
import RecipeCard from './RecipeCard';
import { JOURNAL_COPY, fold, textOf, type JournalCategory, type JournalLang, type JournalRecipe } from '@/lib/journal/journal';

type Access = 'all' | 'free' | 'premium';
type Sort = 'newest' | 'popular' | 'az';

/**
 * "Explore the recipe library": search (name, story, tags and every ingredient line), one theme, any number of "how it
 * is made" filters (all must match), free or premium, and the order. Runs in the browser over the recipes the page
 * already has, so filtering is instant.
 */
export default function JournalLibrary({ recipes, cats, lang }: { recipes: JournalRecipe[]; cats: JournalCategory[]; lang: JournalLang }) {
  const c = JOURNAL_COPY[lang];
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState('');
  const [diets, setDiets] = useState<string[]>([]);
  const [access, setAccess] = useState<Access>('all');
  const [sort, setSort] = useState<Sort>('newest');

  // Only the categories that have at least one recipe, so no chip leads to an empty page.
  const used = useMemo(() => new Set(recipes.flatMap(r => r.categories)), [recipes]);
  const themes = cats.filter(x => x.kind === 'tema' && used.has(x.slug));
  const dietCats = cats.filter(x => x.kind === 'dieta' && used.has(x.slug));

  const shown = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    const list = recipes.filter(r => {
      if (theme && !r.categories.includes(theme)) return false;
      if (diets.some(d => !r.categories.includes(d))) return false;
      if (access === 'free' && !r.is_free) return false;
      if (access === 'premium' && r.is_free) return false;
      if (!words.length) return true;
      const t = textOf(r, lang);
      const hay = fold([t.title, t.subtitle, t.summary, t.search, r.text.pt?.search, r.tags.join(' '), ...(t.preview || [])].filter(Boolean).join(' '));
      return words.every(w => hay.includes(w));
    });
    const title = (r: JournalRecipe) => textOf(r, lang).title;
    if (sort === 'az') list.sort((a, b) => title(a).localeCompare(title(b), lang));
    else if (sort === 'popular') list.sort((a, b) => b.views - a.views || b.publish_at.localeCompare(a.publish_at));
    else list.sort((a, b) => b.publish_at.localeCompare(a.publish_at));
    return list;
  }, [recipes, q, theme, diets, access, sort, lang]);

  const filtered = !!(q || theme || diets.length || access !== 'all');
  const clear = () => { setQ(''); setTheme(''); setDiets([]); setAccess('all'); };

  return (
    <div>
      <input
        className="rj-search" type="search" value={q} onChange={e => setQ(e.target.value)}
        placeholder={c.search} aria-label={c.search} enterKeyHint="search"
      />
      <div className="rj-chips" role="group" aria-label={c.allThemes}>
        <button type="button" className="rj-chip" aria-pressed={!theme} onClick={() => setTheme('')}>{c.allThemes}</button>
        {themes.map(x => (
          <button key={x.slug} type="button" className="rj-chip" aria-pressed={theme === x.slug} onClick={() => setTheme(theme === x.slug ? '' : x.slug)}>
            {x.name[lang]}
          </button>
        ))}
      </div>
      {dietCats.length > 0 && (
        <div className="rj-chips" role="group" aria-label={c.diet}>
          {dietCats.map(x => (
            <button key={x.slug} type="button" className="rj-chip rj-chip--diet" aria-pressed={diets.includes(x.slug)}
              onClick={() => setDiets(d => (d.includes(x.slug) ? d.filter(y => y !== x.slug) : [...d, x.slug]))}>
              {diets.includes(x.slug) ? '✓ ' : ''}{x.name[lang]}
            </button>
          ))}
        </div>
      )}
      <div className="rj-filterrow">
        <div className="rj-seg" role="group" aria-label={c.access}>
          {(['all', 'free', 'premium'] as Access[]).map(a => (
            <button key={a} type="button" aria-pressed={access === a} onClick={() => setAccess(a)}>
              {a === 'all' ? c.all : a === 'free' ? c.free : c.premium}
            </button>
          ))}
        </div>
        <select className="rj-select" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label={c.sort}>
          <option value="newest">{c.newest}</option>
          <option value="popular">{c.popular}</option>
          <option value="az">{c.az}</option>
        </select>
        <span className="rj-count">{shown.length}</span>
      </div>

      {shown.length ? (
        <div className="rj-grid">
          {shown.map(r => <RecipeCard key={r.id} r={r} lang={lang} cats={cats} />)}
        </div>
      ) : (
        <p className="rj-empty">
          {c.none}{filtered && <> <button type="button" className="rj-linkbtn" onClick={clear}>{c.clear}</button></>}
        </p>
      )}
    </div>
  );
}
