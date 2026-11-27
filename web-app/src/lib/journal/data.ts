import 'server-only';
import { createClient } from '@supabase/supabase-js';
import seed from './seed.json';
import {
  DEFAULT_CATEGORIES, countFrom, isLive, searchFrom, searchWords,
  type JournalCategory, type JournalCollection, type JournalLang, type JournalRecipe, type RecipeBody,
} from './journal';

/**
 * Reading the journal for the public pages (server components). Uses the PUBLIC key, so row level security applies
 * exactly as for a visitor: published recipes, and bodies only of free recipes. Premium bodies are fetched in the browser
 * by RecipeUnlock with the buyer's own session.
 *
 * Until migration 55 runs, everything falls back to the launch recipes in seed.json (free bodies only), so the pages
 * work from the first deploy.
 */

const anon = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type SeedRecipe = (typeof seed.recipes)[number];

const seedRecipes: JournalRecipe[] = seed.recipes.map((r: SeedRecipe, i) => ({
  id: r.slug, slug: r.slug, slug_en: r.slug_en, status: 'published', publish_at: new Date(Date.UTC(2026, 10, 27, 12, i)).toISOString(),
  is_free: r.is_free, price_brl: r.price_brl, promo_price_brl: null, is_featured: r.featured, sort: r.sort,
  hero_url: r.hero_url, gallery: r.gallery, video_url: null, prep_minutes: r.prep_minutes, cook_minutes: r.cook_minutes,
  chill_minutes: r.chill_minutes, difficulty: r.difficulty as JournalRecipe['difficulty'], categories: r.categories, tags: r.tags,
  contains: r.contains, views: 0, created_at: new Date(Date.UTC(2026, 10, 27, 12, i)).toISOString(),
  text: Object.fromEntries(Object.entries(r.text).map(([lang, t]) => [lang, { ...t, preview: r.body[lang as JournalLang].sections[0].ingredients.slice(0, 4), search: searchFrom(r.body[lang as JournalLang] as RecipeBody), count: countFrom(r.body[lang as JournalLang] as RecipeBody) }])),
}));
const seedBody = (slug: string): Record<JournalLang, RecipeBody> | null => {
  const r = seed.recipes.find(x => x.slug === slug);
  return r && r.is_free ? (r.body as unknown as Record<JournalLang, RecipeBody>) : null;
};

export interface JournalData {
  recipes: JournalRecipe[];
  categories: JournalCategory[];
  collections: JournalCollection[];
  /** false = migration 55 not run yet: built-in recipes, nothing for sale. */
  live: boolean;
}

const RECIPE_COLS = 'id, slug, slug_en, status, publish_at, is_free, price_brl, promo_price_brl, is_featured, sort, hero_url, gallery, video_url, prep_minutes, cook_minutes, chill_minutes, difficulty, categories, tags, contains, text, views, created_at';

export async function getJournal(): Promise<JournalData> {
  try {
    const db = anon();
    const [r, c, k, kr] = await Promise.all([
      db.from('journal_recipes').select(RECIPE_COLS).order('publish_at', { ascending: false }),
      db.from('journal_categories').select('*').order('sort'),
      db.from('journal_collections').select('*').order('sort'),
      db.from('journal_collection_recipes').select('collection_id, recipe_id, sort').order('sort'),
    ]);
    if (r.error) throw r.error;
    // Never pass an ingredient list to the browser: older rows kept every line (with amounts) in text.search, so it is
    // reduced to single words here whatever the database holds (migration 56 rewrites the rows themselves).
    const recipes = ((r.data || []) as JournalRecipe[]).filter(x => isLive(x)).map(x => ({
      ...x,
      text: Object.fromEntries(Object.entries(x.text || {}).map(([l, t]) => [l, t && {
        ...t,
        count: t.count ?? (t.search ? t.search.split(' · ').filter(Boolean).length : undefined),
        search: searchWords(t.search || ''),
      }])) as JournalRecipe['text'],
    }));
    const collections = ((k.data || []) as Omit<JournalCollection, 'recipe_ids'>[]).map(col => ({
      ...col,
      recipe_ids: ((kr.data || []) as { collection_id: string; recipe_id: string }[]).filter(x => x.collection_id === col.id).map(x => x.recipe_id),
    }));
    return { recipes, categories: (c.data as JournalCategory[])?.length ? (c.data as JournalCategory[]) : DEFAULT_CATEGORIES, collections, live: true };
  } catch {
    return { recipes: [...seedRecipes].sort((a, b) => b.publish_at.localeCompare(a.publish_at)), categories: DEFAULT_CATEGORIES, collections: [], live: false };
  }
}

/** One recipe by its Portuguese or English slug, with its body when the public may read it (free recipes). */
export async function getRecipe(slug: string): Promise<{ data: JournalData; recipe: JournalRecipe | null; body: Record<JournalLang, RecipeBody> | null }> {
  const data = await getJournal();
  const recipe = data.recipes.find(r => r.slug === slug || r.slug_en === slug) || null;
  if (!recipe || !recipe.is_free) return { data, recipe, body: null };
  if (!data.live) return { data, recipe, body: seedBody(recipe.slug) };
  try {
    const { data: b } = await anon().from('journal_recipe_bodies').select('body').eq('recipe_id', recipe.id).maybeSingle();
    return { data, recipe, body: (b?.body as Record<JournalLang, RecipeBody>) || null };
  } catch {
    return { data, recipe, body: null };
  }
}

/** One published collection by its slug, with its live recipes in Dolly's order. */
export async function getCollection(slug: string): Promise<{ data: JournalData; collection: JournalCollection | null; recipes: JournalRecipe[] }> {
  const data = await getJournal();
  const collection = data.collections.find(k => k.slug === slug && k.published) || null;
  const recipes = collection ? collection.recipe_ids.map(id => data.recipes.find(r => r.id === id)).filter((r): r is JournalRecipe => !!r) : [];
  return { data, collection, recipes };
}
