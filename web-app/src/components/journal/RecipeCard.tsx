import Image from 'next/image';
import Link from 'next/link';
import {
  JOURNAL_COPY, fmtBRL, fmtMinutes, priceOf, recipeHref, textOf,
  type JournalCategory, type JournalLang, type JournalRecipe,
} from '@/lib/journal/journal';

/** Category names for a recipe's chips, themes first, at most `max`. */
export function chipNames(r: JournalRecipe, cats: JournalCategory[], lang: JournalLang, max = 3): string[] {
  const order = new Map(cats.map((c, i) => [c.slug, (c.kind === 'tema' ? 0 : 1000) + i]));
  return r.categories
    .filter(s => order.has(s))
    .sort((a, b) => (order.get(a)! - order.get(b)!))
    .slice(0, max)
    .map(s => cats.find(c => c.slug === s)!.name[lang] || s);
}

/** One recipe in a grid: photo, badge, name, a short line, a few chips, time, and the price or "Grátis". */
export default function RecipeCard({ r, lang, cats, owned = false, priority = false }: {
  r: JournalRecipe; lang: JournalLang; cats: JournalCategory[]; owned?: boolean; priority?: boolean;
}) {
  const c = JOURNAL_COPY[lang];
  const t = textOf(r, lang);
  const total = r.prep_minutes + r.cook_minutes;
  return (
    <Link href={recipeHref(lang, r)} className="rj-card">
      <span className="rj-card__photo">
        <span className={`rj-badge${r.is_free ? '' : ' rj-badge--premium'}`}>{r.is_free ? c.free_badge : c.premium_badge}</span>
        {r.hero_url && (
          <Image src={r.hero_url} alt={t.title} fill sizes="(min-width: 1000px) 360px, (min-width: 560px) 50vw, 100vw" priority={priority} />
        )}
      </span>
      <ul className="rj-tags">{chipNames(r, cats, lang).map(n => <li key={n}><span>{n}</span></li>)}</ul>
      <h3 className="rj-card__title">{t.title}</h3>
      {t.summary && <p className="rj-card__summary">{t.summary}</p>}
      <span className="rj-card__foot">
        <span>{c.view} →</span>
        <span className="rj-card__price">
          {total ? `${fmtMinutes(total, lang)} · ` : ''}
          {r.is_free ? c.free : owned ? '✓' : fmtBRL(priceOf(r))}
        </span>
      </span>
    </Link>
  );
}
