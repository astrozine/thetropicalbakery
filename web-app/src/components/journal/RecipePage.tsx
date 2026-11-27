import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import HandWrittenLang from '@/components/HandWrittenLang';
import RecipeBodyView from './RecipeBodyView';
import RecipeUnlock from './RecipeUnlock';
import RecipeCard, { chipNames } from './RecipeCard';
import ViewCount from './ViewCount';
import { ALLERGENS } from '@/lib/allergens';
import { getRecipe } from '@/lib/journal/data';
import { SITE_URL } from '@/lib/email/layout';
import {
  DIFFICULTY, JOURNAL_COPY, JOURNAL_PATH, collectionHref, collectionTextOf, fmtBRL, fmtMinutes, priceOf, recipeHref, textOf,
  type JournalLang, type JournalRecipe, type RecipeBody,
} from '@/lib/journal/journal';
import './journal.css';

const iso = (min: number) => `PT${Math.floor(min / 60) ? `${Math.floor(min / 60)}H` : ''}${min % 60 ? `${min % 60}M` : ''}` || 'PT0M';

const ALLERGEN_EN: Record<string, string> = { castanhas: 'Tree nuts', amendoim: 'Peanuts', coco: 'Coconut', gergelim: 'Sesame', soja: 'Soy', aveia: 'Oats' };

/** Title, description and share photo of a recipe, in the page's language. */
export async function recipeMetadata(slug: string, lang: JournalLang): Promise<Metadata> {
  const { recipe } = await getRecipe(slug);
  const c = JOURNAL_COPY[lang];
  if (!recipe) return { title: `${c.name} | The Tropical Bakery` };
  const t = textOf(recipe, lang);
  const title = t.seo_title || `${t.title} | ${c.name}`;
  const description = t.seo_description || t.summary || c.metaDescription;
  const image = recipe.hero_url ? (recipe.hero_url.startsWith('http') ? recipe.hero_url : SITE_URL + recipe.hero_url) : undefined;
  return {
    title, description,
    alternates: {
      canonical: SITE_URL + recipeHref(lang, recipe),
      languages: { 'pt-BR': SITE_URL + recipeHref('pt', recipe), en: SITE_URL + recipeHref('en', recipe) },
    },
    openGraph: { title: t.title, description, type: 'article', images: image ? [{ url: image }] : undefined, locale: lang === 'en' ? 'en_US' : 'pt_BR' },
  };
}

/** Google's Recipe structured data. Premium recipes say so (isAccessibleForFree + the locked part), without the steps. */
function jsonLd(r: JournalRecipe, lang: JournalLang, body: RecipeBody | null, cats: string[]) {
  const t = textOf(r, lang);
  const image = r.hero_url ? [r.hero_url.startsWith('http') ? r.hero_url : SITE_URL + r.hero_url] : undefined;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: t.title,
    description: t.summary || t.subtitle,
    image,
    author: { '@type': 'Person', name: 'Elisabeth Van Dam (Chef Dolly)' },
    publisher: { '@type': 'Organization', name: 'The Tropical Bakery', url: SITE_URL },
    datePublished: r.publish_at.slice(0, 10),
    prepTime: iso(r.prep_minutes),
    cookTime: iso(r.cook_minutes),
    totalTime: iso(r.prep_minutes + r.cook_minutes + r.chill_minutes),
    recipeYield: t.yield,
    recipeCategory: lang === 'en' ? 'Dessert' : 'Sobremesa',
    recipeCuisine: lang === 'en' ? 'Plant-based' : 'Vegana',
    keywords: [...cats, ...r.tags].join(', '),
    suitableForDiet: 'https://schema.org/VeganDiet',
    url: SITE_URL + recipeHref(lang, r),
    inLanguage: lang === 'en' ? 'en' : 'pt-BR',
  };
  if (body) {
    ld.recipeIngredient = body.sections.flatMap(s => s.ingredients);
    ld.recipeInstructions = body.sections.map(s => ({
      '@type': 'HowToSection', name: s.name,
      itemListElement: s.steps.map(x => ({ '@type': 'HowToStep', text: x })),
    }));
    ld.isAccessibleForFree = true;
  } else {
    ld.isAccessibleForFree = false;
    ld.hasPart = { '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: '.rj-locked' };
    ld.offers = { '@type': 'Offer', price: priceOf(r).toFixed(2), priceCurrency: 'BRL', availability: 'https://schema.org/InStock' };
  }
  return ld;
}

/** One recipe: the hero photo, the story and what makes it special (always public), then the recipe or the paywall. */
export default async function RecipePage({ slug, lang }: { slug: string; lang: JournalLang }) {
  const { data, recipe, body } = await getRecipe(slug);
  if (!recipe) notFound();
  const c = JOURNAL_COPY[lang];
  const t = textOf(recipe, lang);
  const b = body ? ((body[lang] || body.pt) as RecipeBody) : null;
  const other: JournalLang = lang === 'pt' ? 'en' : 'pt';
  const cats = chipNames(recipe, data.categories, lang, 12);
  const dietCats = data.categories.filter(x => x.kind === 'dieta' && recipe.categories.includes(x.slug)).map(x => x.name[lang]);
  const facts = [
    recipe.prep_minutes ? [c.prep, fmtMinutes(recipe.prep_minutes, lang)] : null,
    recipe.cook_minutes ? [c.cook, fmtMinutes(recipe.cook_minutes, lang)] : null,
    recipe.chill_minutes ? [c.chill, fmtMinutes(recipe.chill_minutes, lang)] : null,
    [c.difficulty, DIFFICULTY[recipe.difficulty][lang]],
    t.yield ? [c.yield, t.yield.replace(/^(Serves|Makes|Rende)\s+/i, '')] : null,
  ].filter(Boolean) as [string, string][];
  const related = data.recipes
    .filter(r => r.id !== recipe.id)
    .map(r => ({ r, score: r.categories.filter(x => recipe.categories.includes(x)).length }))
    .sort((a, z) => z.score - a.score || z.r.publish_at.localeCompare(a.r.publish_at))
    .slice(0, 3).map(x => x.r);
  const inCollections = data.collections.filter(k => k.published && k.recipe_ids.includes(recipe.id));
  const ingredientCount = (t.search || '').split(' · ').filter(Boolean).length;
  const story = (t.story || '').split(/\n{2,}/).filter(Boolean);

  return (
    <main className="rj">
      <HandWrittenLang lang={lang} paths={{ pt: recipeHref('pt', recipe), en: recipeHref('en', recipe) }} />
      <ViewCount slug={recipe.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(recipe, lang, b, cats)).replace(/</g, '\\u003c') }} />
      <div className="rj-wrap">
        <nav className="rj-crumb rj-noprint">
          <Link href={JOURNAL_PATH[lang]}>← {c.name}</Link>
          <Link href={recipeHref(other, recipe)} hrefLang={other} className="rj-pill">{c.other}</Link>
        </nav>

        <div className="rj-hero">
          {recipe.hero_url && <Image src={recipe.hero_url} alt={t.title} fill priority sizes="(min-width: 1160px) 1100px, 100vw" />}
          <span className={`rj-badge${recipe.is_free ? '' : ' rj-badge--premium'}`}>{recipe.is_free ? c.free_badge : c.premium_badge}</span>
        </div>

        <header className="rj-head">
          <ul className="rj-tags">{cats.slice(0, 6).map(n => <li key={n}><span>{n}</span></li>)}</ul>
          <h1 className="rj-title">{t.title}</h1>
          {t.subtitle && <p className="rj-sub">{t.subtitle}</p>}
          {t.summary && <p className="rj-summary">{t.summary}</p>}
          <a href="#receita-lock" className="rj-jumpdown rj-noprint">↓ {c.jumpRecipe}{recipe.is_free ? '' : ` · ${fmtBRL(priceOf(recipe))}`}</a>
        </header>

        <ul className="rj-facts" style={{ ['--n' as string]: facts.length }}>
          {facts.map(([k, v]) => <li key={k}><small>{k}</small><strong>{v}</strong></li>)}
        </ul>

        <div className="rj-cols">
          <div className="rj-prose">
            {story.length > 0 && (
              <section>
                <h2 className="rj-kicker rj-kicker--start" data-sign="📖">{c.storyKicker}</h2>
                {story.map((para, i) => <p key={i} className={i === 0 ? 'rj-dropcap' : undefined}>{para}</p>)}
              </section>
            )}
            {(t.benefits || []).length > 0 && (
              <section>
                <h2 className="rj-kicker rj-kicker--start" data-sign="✨">{c.special}</h2>
                <ul className="rj-special">
                  {t.benefits!.map((x, i) => {
                    const k = x.indexOf(':');
                    return <li key={i}>{k > 0 && k < 40 ? <><b>{x.slice(0, k)}</b>{x.slice(k)}</> : x}</li>;
                  })}
                </ul>
              </section>
            )}
          </div>
          <aside className="rj-aside">
            <div className="rj-aside__box">
              <h3>{c.dietInfo}</h3>
              {dietCats.length > 0 && <ul className="rj-tags" style={{ marginBottom: '0.6rem' }}>{dietCats.map(n => <li key={n}><span>{n}</span></li>)}</ul>}
              {recipe.contains.length > 0 && (
                <>
                  <p style={{ fontWeight: 700 }}>{c.contains}:</p>
                  <p>{recipe.contains.map(id => {
                    const a = ALLERGENS.find(x => x.id === id);
                    return a ? <span key={id} className="rj-allergen">{lang === 'en' ? ALLERGEN_EN[id] || a.label : a.label}</span> : null;
                  })}</p>
                </>
              )}
              <p>{c.kitchenNote}</p>
            </div>
            {!recipe.is_free && (
              <div className="rj-aside__box rj-aside__buy rj-noprint">
                <h3>{c.premium}</h3>
                <p><strong style={{ fontSize: '1.2rem' }}>{fmtBRL(priceOf(recipe))}</strong></p>
                <p>{c.payHint}</p>
                <p><a href="#receita-lock" className="rj-linkbtn">{c.unlock(fmtBRL(priceOf(recipe)))}</a></p>
              </div>
            )}
          </aside>
        </div>

        <div id="receita-lock">
          {b ? (
            <RecipeBodyView body={b} lang={lang} yieldText={t.yield} />
          ) : (
            <Suspense fallback={null}>
              <RecipeUnlock
                recipeId={data.live ? recipe.id : null} slug={recipe.slug} lang={lang}
                price={priceOf(recipe)} was={recipe.promo_price_brl ? recipe.price_brl : null}
                preview={t.preview || []} ingredientCount={ingredientCount} yieldText={t.yield} live={data.live}
              />
            </Suspense>
          )}
        </div>

        {recipe.gallery.length > 0 && (
          <div className="rj-gallery">
            {recipe.gallery.map(src => <span key={src}><Image src={src} alt={t.title} fill sizes="(min-width: 760px) 50vw, 50vw" /></span>)}
          </div>
        )}
        {recipe.video_url && (
          <div className="rj-video">
            {/\.(mp4|webm|mov)(\?|$)/i.test(recipe.video_url)
              ? <video src={recipe.video_url} controls playsInline preload="metadata" />
              : <iframe src={recipe.video_url} title={c.video} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />}
          </div>
        )}

        {inCollections.length > 0 && (
          <section className="rj-section">
            <div className="rj-section__head"><h2 className="rj-h2">{c.collections}</h2></div>
            <ul className="rj-orders">
              {inCollections.map(k => (
                <li key={k.id}><Link href={collectionHref(lang, k.slug)}>{collectionTextOf(k, lang).title}</Link><span>{fmtBRL(priceOf(k))}</span></li>
              ))}
            </ul>
          </section>
        )}

      </div>

      {related.length > 0 && (
        <section className="rj-band rj-band--cream rj-related rj-noprint">
          <div className="rj-wrap">
            <p className="rj-kicker" data-sign="🍰">{c.relatedKicker}</p>
            <h2 className="rj-h2c">{c.related}</h2>
            <div className="rj-grid">{related.map(r => <RecipeCard key={r.id} r={r} lang={lang} cats={data.categories} />)}</div>
            <p className="rj-intro" style={{ marginTop: '1.8rem', marginBottom: 0 }}><Link href={JOURNAL_PATH[lang]} className="rj-linkbtn">← {c.back}</Link></p>
          </div>
        </section>
      )}
    </main>
  );
}
