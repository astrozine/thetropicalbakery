// Prints the INSERT that seeds `app_recipes` (migration 48) from the launch set in src/lib/vontade.ts, so the
// recipes are written once. Node 22.18+ reads the .ts file directly.
//
//   node tools/vontade-seed.mjs > seed.sql
//
// ON CONFLICT (slug) DO NOTHING: running it again never overwrites what Dolly changed in the admin.
import { RESCUES } from '../src/lib/vontade.ts';

const q = s => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const arr = a => `ARRAY[${a.map(q).join(', ')}]::text[]`;

const rows = RESCUES.map((r, i) => `    (${[
  q(r.id), q(r.name), q(r.emoji), q(r.hex), arr(r.cravings), r.minutes, r.waitMinutes ?? 0, arr(r.needs),
  arr(r.ingredients), arr(r.steps), q(r.tip ?? null), arr(r.contains), r.free, 'true', (i + 1) * 10,
].join(', ')})`);

console.log(`INSERT INTO public.app_recipes
    (slug, name, emoji, color, cravings, minutes, wait_minutes, needs, ingredients, steps, tip, contains, is_free, published, sort)
VALUES
${rows.join(',\n')}
ON CONFLICT (slug) DO NOTHING;`);
