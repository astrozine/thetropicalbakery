import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import HandWrittenLang from '@/components/HandWrittenLang';
import RecipeCard from './RecipeCard';
import RecipeUnlock from './RecipeUnlock';
import { getCollection } from '@/lib/journal/data';
import { SITE_URL } from '@/lib/email/layout';
import {
  JOURNAL_COPY, JOURNAL_PATH, collectionHref, collectionTextOf, fmtBRL, priceOf, type JournalLang,
} from '@/lib/journal/journal';
import './journal.css';

export async function collectionMetadata(slug: string, lang: JournalLang): Promise<Metadata> {
  const { collection } = await getCollection(slug);
  const c = JOURNAL_COPY[lang];
  if (!collection) return { title: `${c.collections} | ${c.name}` };
  const t = collectionTextOf(collection, lang);
  const image = collection.cover_url ? (collection.cover_url.startsWith('http') ? collection.cover_url : SITE_URL + collection.cover_url) : undefined;
  return {
    title: `${t.title} | ${c.name}`,
    description: t.summary || c.metaDescription,
    alternates: {
      canonical: SITE_URL + collectionHref(lang, collection.slug),
      languages: { 'pt-BR': SITE_URL + collectionHref('pt', collection.slug), en: SITE_URL + collectionHref('en', collection.slug) },
    },
    openGraph: { title: t.title, description: t.summary, images: image ? [{ url: image }] : undefined },
  };
}

/**
 * A collection: a dark hero (cover, or a mosaic of its recipes), the price against buying them one by one, the
 * unlock panel (same checkout as a recipe, kind 'collection'), then every recipe in it.
 */
export default async function CollectionPage({ slug, lang }: { slug: string; lang: JournalLang }) {
  const { data, collection, recipes } = await getCollection(slug);
  if (!collection) notFound();
  const c = JOURNAL_COPY[lang];
  const t = collectionTextOf(collection, lang);
  const other: JournalLang = lang === 'pt' ? 'en' : 'pt';
  const price = priceOf(collection);
  const separately = recipes.filter(r => !r.is_free).reduce((s, r) => s + priceOf(r), 0);
  const saving = separately - price;
  const mosaic = recipes.filter(r => r.hero_url).slice(0, 4);
  const description = (t.description || '').split(/\n{2,}/).filter(Boolean);
  const others = data.collections.filter(k => k.published && k.id !== collection.id);

  return (
    <main className="rj">
      <HandWrittenLang lang={lang} paths={{ pt: collectionHref('pt', collection.slug), en: collectionHref('en', collection.slug) }} />
      <header className="rj-top">
        {collection.cover_url
          ? <Image className="rj-top__bg" src={collection.cover_url} alt="" fill priority sizes="100vw" />
          : mosaic[0]?.hero_url && <Image className="rj-top__bg" src={mosaic[0].hero_url} alt="" fill priority sizes="100vw" />}
        <div className="rj-wrap rj-top__inner">
          <div className="rj-top__row">
            <Link href={`${JOURNAL_PATH[lang]}#colecoes`} className="rj-top__kicker" style={{ textDecoration: 'none' }}>← {c.name}</Link>
            <Link className="rj-pill rj-pill--dark" href={collectionHref(other, collection.slug)} hrefLang={other}>{c.other}</Link>
          </div>
          <p className="rj-top__kicker" style={{ marginTop: '1.4rem' }}>📚 {c.collKicker1} · {c.collRecipes(recipes.length)}</p>
          <h1 className="rj-top__name" style={{ fontSize: 'clamp(1.9rem, 8vw, 3.6rem)' }}>{t.title}</h1>
          {t.summary && <p className="rj-top__tag">{t.summary}</p>}
          {mosaic.length > 1 && (
            <div className="rj-mosaic">{mosaic.map(r => <span key={r.id}><Image src={r.hero_url!} alt="" fill sizes="120px" /></span>)}</div>
          )}
          <div className="rj-collprice">
            <strong>{fmtBRL(price)}</strong>
            {saving > 0.5 && <span><s>{c.collSeparately(fmtBRL(separately))}</s> · {c.collSave(fmtBRL(saving))}</span>}
          </div>
          <nav className="rj-jump">
            <a href="#receita-lock"><span aria-hidden>🔓</span>{c.collBuy}</a>
            <a href="#dentro"><span aria-hidden>📖</span>{c.collInside}</a>
          </nav>
        </div>
      </header>

      {description.length > 0 && (
        <section className="rj-band rj-band--paper" style={{ paddingBottom: 0 }}>
          <div className="rj-wrap rj-prose" style={{ maxWidth: 720 }}>
            {description.map((para, i) => <p key={i} className={i === 0 ? 'rj-dropcap' : undefined}>{para}</p>)}
          </div>
        </section>
      )}

      <div className="rj-wrap" id="receita-lock" style={{ maxWidth: 720 }}>
        <Suspense fallback={null}>
          <RecipeUnlock
            kind="collection" collectionId={data.live ? collection.id : null} recipeId={null} slug={collection.slug} lang={lang}
            price={price} was={collection.promo_price_brl ? collection.price_brl : null}
            preview={[]} ingredientCount={0} live={data.live}
            title={c.collLockTitle} text={c.collLockBody} ownedText={c.collOwned}
          />
        </Suspense>
      </div>

      <section id="dentro" className="rj-band rj-band--cream" style={{ marginTop: '3rem' }}>
        <div className="rj-wrap">
          <p className="rj-kicker" data-sign="📖">{c.collKicker1}</p>
          <h2 className="rj-h2c">{c.collInside}</h2>
          <div className="rj-grid">{recipes.map(r => <RecipeCard key={r.id} r={r} lang={lang} cats={data.categories} />)}</div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="rj-band rj-band--green">
          <div className="rj-wrap">
            <p className="rj-kicker rj-kicker--light" data-sign="📚">{c.collKicker}</p>
            <h2 className="rj-h2c rj-h2c--light">{c.collections}</h2>
            <div className="rj-grid rj-grid--dark">
              {others.map(k => {
                const kt = collectionTextOf(k, lang);
                return (
                  <Link key={k.id} href={collectionHref(lang, k.slug)} className="rj-card">
                    <span className="rj-card__photo">{k.cover_url && <Image src={k.cover_url} alt={kt.title} fill sizes="(min-width: 1000px) 360px, 50vw" />}</span>
                    <h3 className="rj-card__title">{kt.title}</h3>
                    <span className="rj-card__foot"><span>{c.collRecipes(k.recipe_ids.length)}</span><span className="rj-card__price">{fmtBRL(priceOf(k))}</span></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
