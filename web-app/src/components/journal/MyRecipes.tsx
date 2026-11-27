'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginPanel from '@/components/LoginPanel';
import RecipeCard from './RecipeCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_CATEGORIES, JOURNAL_COPY, JOURNAL_PATH, collectionTextOf, fmtBRL, textOf,
  type JournalCategory, type JournalCollection, type JournalLang, type JournalRecipe,
} from '@/lib/journal/journal';
import './journal.css';

interface Purchase { reference: string | null; created_at: string; price_brl: number | null; paid: boolean; recipe_id: string | null; collection_id: string | null; source: string }

/** "Minhas receitas": every recipe the signed-in person has unlocked, and their purchase history. */
export default function MyRecipes({ lang }: { lang: JournalLang }) {
  const c = JOURNAL_COPY[lang];
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Purchase[] | null>(null);
  const [recipes, setRecipes] = useState<JournalRecipe[]>([]);
  const [collections, setCollections] = useState<(JournalCollection)[]>([]);
  const [cats, setCats] = useState<JournalCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, r, k, kr, ct] = await Promise.all([
        supabase.rpc('journal_my_purchases'),
        supabase.from('journal_recipes').select('*'),
        supabase.from('journal_collections').select('*'),
        supabase.from('journal_collection_recipes').select('collection_id, recipe_id'),
        supabase.from('journal_categories').select('*').order('sort'),
      ]);
      setRows((p.data || []) as Purchase[]);
      setRecipes((r.data || []) as JournalRecipe[]);
      const links = (kr.data || []) as { collection_id: string; recipe_id: string }[];
      setCollections(((k.data || []) as JournalCollection[]).map(x => ({ ...x, recipe_ids: links.filter(l => l.collection_id === x.id).map(l => l.recipe_id) })));
      if (ct.data?.length) setCats(ct.data as JournalCategory[]);
    })();
  }, [user]);

  const paid = (rows || []).filter(x => x.paid);
  const ownedIds = new Set(paid.flatMap(x => x.recipe_id ? [x.recipe_id] : collections.find(k => k.id === x.collection_id)?.recipe_ids || []));
  const owned = recipes.filter(r => ownedIds.has(r.id));
  const nameOf = (x: Purchase) => {
    if (x.recipe_id) { const r = recipes.find(y => y.id === x.recipe_id); return r ? textOf(r, lang).title : '—'; }
    const k = collections.find(y => y.id === x.collection_id);
    return k ? collectionTextOf(k, lang).title : '—';
  };

  return (
    <main className="rj">
      <div className="rj-wrap">
        <nav className="rj-crumb"><Link href={JOURNAL_PATH[lang]}>← {c.back}</Link></nav>
        <h1 className="rj-title" style={{ textAlign: 'left' }}>{c.myRecipes}</h1>
        {!user ? (
          loading ? null : <div className="rj-mine rj-login"><LoginPanel message={c.signIn} subMessage={c.signInSub} locale={lang} /></div>
        ) : rows === null ? null : (
          <>
            {owned.length ? (
              <div className="rj-grid">{owned.map(r => <RecipeCard key={r.id} r={r} lang={lang} cats={cats} owned />)}</div>
            ) : (
              <p className="rj-empty rj-mine">{c.myEmpty} <Link href={JOURNAL_PATH[lang]} className="rj-linkbtn">{c.explore}</Link></p>
            )}
            {rows.length > 0 && (
              <section className="rj-section">
                <h2 className="rj-h2">{c.myOrders}</h2>
                <ul className="rj-orders">
                  {rows.map((x, i) => (
                    <li key={i}>
                      <span>{nameOf(x)}<br /><small className="rj-fine">{new Date(x.created_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-BR')} · {x.reference || (lang === 'en' ? 'gift' : 'presente')}{x.paid ? '' : ` · ${c.pending}`}</small></span>
                      <span>{x.price_brl != null ? fmtBRL(Number(x.price_brl)) : ''}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
