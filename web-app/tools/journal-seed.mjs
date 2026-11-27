// Prints the seed SQL for migration_55 from src/lib/journal/seed.json and the default categories.
// Usage: node tools/journal-seed.mjs >> migration_55_recipe_journal.sql  (then add COMMIT + the check)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const seed = JSON.parse(fs.readFileSync(path.join(here, '../src/lib/journal/seed.json'), 'utf8'));
const src = fs.readFileSync(path.join(here, '../src/lib/journal/journal.ts'), 'utf8');
const cats = [...src.matchAll(/\{ slug: '([a-z0-9-]+)', kind: '(tema|dieta)', name: \{ pt: '([^']+)', en: '([^']+)' \}, sort: (\d+) \}/g)]
  .map(m => ({ slug: m[1], kind: m[2], name: { pt: m[3], en: m[4] }, sort: Number(m[5]) }));

const q = s => `'${String(s).replace(/'/g, "''")}'`;
const arr = a => `ARRAY[${a.map(q).join(', ')}]::text[]`;
const js = o => `${q(JSON.stringify(o))}::jsonb`;

let out = '';
out += 'INSERT INTO public.journal_categories (slug, kind, name, sort) VALUES\n';
out += cats.map(c => `    (${q(c.slug)}, ${q(c.kind)}, ${js(c.name)}, ${c.sort})`).join(',\n') + '\nON CONFLICT (slug) DO NOTHING;\n\n';

for (const r of seed.recipes) {
  const text = {};
  for (const lang of Object.keys(r.text)) text[lang] = { ...r.text[lang], preview: (r.body[lang]?.sections?.[0]?.ingredients || []).slice(0, 4), search: (r.body[lang]?.sections || []).flatMap(x => x.ingredients).join(' · ').toLowerCase().slice(0, 2000) };
  out += `-- ${r.text.pt.title}\n`;
  out += 'INSERT INTO public.journal_recipes (slug, slug_en, status, publish_at, is_free, price_brl, is_featured, sort, hero_url, gallery, prep_minutes, cook_minutes, chill_minutes, difficulty, categories, tags, contains, text)\n';
  out += `SELECT ${q(r.slug)}, ${q(r.slug_en)}, 'published', now() - interval '${70 - r.sort} minutes', ${r.is_free}, ${r.price_brl}, `;
  // Featured only if nothing is featured yet (the unique index allows one).
  out += r.featured ? `NOT EXISTS (SELECT 1 FROM public.journal_recipes WHERE is_featured), ` : 'false, ';
  out += `${r.sort}, ${q(r.hero_url)}, ${arr(r.gallery)}, ${r.prep_minutes}, ${r.cook_minutes}, ${r.chill_minutes}, ${q(r.difficulty)}, ${arr(r.categories)}, ${arr(r.tags)}, ${arr(r.contains)},\n    ${js(text)}\n`;
  out += 'ON CONFLICT (slug) DO NOTHING;\n';
  out += `INSERT INTO public.journal_recipe_bodies (recipe_id, body)\nSELECT id, ${js(r.body)} FROM public.journal_recipes WHERE slug = ${q(r.slug)}\nON CONFLICT (recipe_id) DO NOTHING;\n\n`;
}

// A first collection, left unpublished: Dolly checks the price and switches it on in the admin.
const coll = {
  pt: { title: 'Sweet Escape: 7 cores, 7 receitas', summary: 'As sete receitas do livro, uma para cada cor do arco-íris.', description: 'Do amarelo do abacaxi ao escuro do cacau: as sete receitas do Sweet Escape, com a história de cada fruta e o passo a passo completo.' },
  en: { title: 'Sweet Escape: 7 colors, 7 recipes', summary: 'All seven recipes from the book, one for every color of the rainbow.', description: 'From pineapple yellow to cocoa dark: the seven Sweet Escape recipes, with the story of each fruit and every step.' },
};
out += `INSERT INTO public.journal_collections (slug, published, price_brl, cover_url, sort, text)\nVALUES ('sweet-escape-7-cores', false, 39.90, '/ebook/sweet-escape/yellow-plate.webp', 10, ${js(coll)})\nON CONFLICT (slug) DO NOTHING;\n`;
out += `INSERT INTO public.journal_collection_recipes (collection_id, recipe_id, sort)\nSELECT c.id, r.id, r.sort FROM public.journal_collections c, public.journal_recipes r\nWHERE c.slug = 'sweet-escape-7-cores' AND r.slug IN (${seed.recipes.map(r => q(r.slug)).join(', ')})\nON CONFLICT DO NOTHING;\n`;
process.stdout.write(out);
