import Image from 'next/image';
import Link from 'next/link';
import HandWrittenLang from '@/components/HandWrittenLang';
import JournalLibrary from './JournalLibrary';
import RecipeCard, { chipNames } from './RecipeCard';
import MyRecipesLink from './MyRecipesLink';
import { getJournal } from '@/lib/journal/data';
import { COACHING_PATH } from '@/lib/coachingCopy';
import {
  DIFFICULTY, JOURNAL_COPY, JOURNAL_PATH, collectionHref, collectionTextOf, fmtBRL, fmtMinutes, priceOf, recipeHref, textOf,
  type JournalLang,
} from '@/lib/journal/journal';
import './journal.css';

/**
 * The Recipe Journal's front page, in the site's landing-page language: a dark photo hero with jump links, then sections
 * that alternate cream and dark green, each opened by an icon + gold kicker + title. Featured recipe, how free/premium
 * works, the library, the latest recipes (once there are many), the collections or the book, and Dolly's next rung.
 */
export default async function JournalHome({ lang }: { lang: JournalLang }) {
  const c = JOURNAL_COPY[lang];
  const { recipes, categories, collections } = await getJournal();
  const featured = recipes.find(r => r.is_featured) || recipes[0];
  // With a small library the grid already shows everything; the latest row earns its place once it grows.
  const latest = recipes.length > 9 ? recipes.filter(r => r.id !== featured?.id).slice(0, 6) : [];
  const other: JournalLang = lang === 'pt' ? 'en' : 'pt';
  const books = recipes.filter(r => r.tags.includes('Sweet Escape') && r.hero_url).slice(0, 4);
  const liveCollections = collections.filter(k => k.published);
  const freeCount = recipes.filter(r => r.is_free).length;

  return (
    <main className="rj">
      <HandWrittenLang lang={lang} paths={JOURNAL_PATH} />

      {/* ── HERO: the featured photo, dimmed, and where to go from here ── */}
      <header className="rj-top">
        {featured?.hero_url && <Image className="rj-top__bg" src={featured.hero_url} alt="" fill priority sizes="100vw" />}
        <div className="rj-wrap rj-top__inner">
          <div className="rj-top__row">
            <span className="rj-top__kicker">{c.heroKicker}</span>
            <Link className="rj-pill rj-pill--dark" href={JOURNAL_PATH[other]} hrefLang={other}>{c.other}</Link>
          </div>
          <h1 className="rj-top__name">
            {lang === 'pt' ? <>Diário de <em>Receitas</em></> : <>Recipe <em>Journal</em></>}
          </h1>
          <p className="rj-top__tag">{c.tagline}</p>
          <nav className="rj-jump" aria-label={c.name}>
            {featured && <a href="#semana"><span aria-hidden>⭐</span>{c.jumpFeatured}</a>}
            <a href="#biblioteca"><span aria-hidden>🔎</span>{c.jumpLibrary}</a>
            {freeCount > 0 && <a href="#biblioteca"><span aria-hidden>🎁</span>{freeCount} {c.free.toLowerCase()}</a>}
            <a href="#colecoes"><span aria-hidden>📚</span>{c.jumpCollections}</a>
            <MyRecipesLink lang={lang} className="rj-jump__mine" />
          </nav>
        </div>
      </header>

      {/* ── How it works: free, premium, my recipes ── */}
      <section className="rj-how" aria-label={c.howKicker}>
        <ul className="rj-wrap rj-how__list">
          {c.how.map(h => (
            <li key={h.title}><span className="rj-how__sign" aria-hidden>{h.sign}</span><b>{h.title}</b><span>{h.text}</span></li>
          ))}
        </ul>
      </section>

      {/* ── Recipe of the week ── */}
      {featured && (() => {
        const t = textOf(featured, lang);
        return (
          <section id="semana" className="rj-band rj-band--cream">
            <div className="rj-wrap">
              <p className="rj-kicker" data-sign="⭐">{c.featuredKicker}</p>
              <h2 className="rj-h2c">{c.featured}</h2>
              <p className="rj-intro">{c.featuredIntro}</p>
              <Link href={recipeHref(lang, featured)} className="rj-feat">
                <span className="rj-feat__photo">
                  {featured.hero_url && <Image src={featured.hero_url} alt={t.title} fill sizes="(min-width: 900px) 620px, 100vw" />}
                  <span className={`rj-badge${featured.is_free ? '' : ' rj-badge--premium'}`}>{featured.is_free ? c.free_badge : c.premium_badge}</span>
                </span>
                <span className="rj-feat__body">
                  <h3 className="rj-feat__title">{t.title}</h3>
                  {t.subtitle && <p className="rj-feat__sub">{t.subtitle}</p>}
                  <ul className="rj-tags">{chipNames(featured, categories, lang, 4).map(n => <li key={n}><span>{n}</span></li>)}</ul>
                  {t.summary && <p className="rj-feat__summary">{t.summary}</p>}
                  <p className="rj-meta">
                    {featured.prep_minutes > 0 && <span><b>{c.prep}</b> {fmtMinutes(featured.prep_minutes, lang)}</span>}
                    {featured.chill_minutes > 0 && <span><b>{c.chill}</b> {fmtMinutes(featured.chill_minutes, lang)}</span>}
                    <span><b>{c.difficulty}</b> {DIFFICULTY[featured.difficulty][lang]}</span>
                    {t.yield && <span>{t.yield}</span>}
                  </p>
                  <span className="rj-feat__cta">{featured.is_free ? c.discover : `${c.discover} · ${fmtBRL(priceOf(featured))}`} →</span>
                </span>
              </Link>
            </div>
          </section>
        );
      })()}

      {/* ── The library ── */}
      <section id="biblioteca" className="rj-band rj-band--paper">
        <div className="rj-wrap">
          <p className="rj-kicker" data-sign="🔎">{c.exploreKicker}</p>
          <h2 className="rj-h2c">{c.explore}</h2>
          <p className="rj-intro">{c.exploreIntro}</p>
          <JournalLibrary recipes={recipes} cats={categories} lang={lang} />
          {latest.length > 0 && (
            <div className="rj-latest">
              <h3 className="rj-h3">{c.latest}</h3>
              <div className="rj-grid">{latest.map(r => <RecipeCard key={r.id} r={r} lang={lang} cats={categories} />)}</div>
            </div>
          )}
        </div>
      </section>

      {/* ── Collections, or the book while there are none ── */}
      <section id="colecoes" className="rj-band rj-band--green">
        <div className="rj-wrap">
          <p className="rj-kicker rj-kicker--light" data-sign="📚">{c.collKicker}</p>
          <h2 className="rj-h2c rj-h2c--light">{c.collections}</h2>
          {liveCollections.length > 0 ? (
            <div className="rj-grid rj-grid--dark">
              {liveCollections.map(k => {
                const kt = collectionTextOf(k, lang);
                return (
                  <Link key={k.id} href={collectionHref(lang, k.slug)} className="rj-card">
                    <span className="rj-card__photo">
                      {k.cover_url && <Image src={k.cover_url} alt={kt.title} fill sizes="(min-width: 1000px) 360px, 50vw" />}
                    </span>
                    <h3 className="rj-card__title">{kt.title}</h3>
                    {kt.summary && <p className="rj-card__summary">{kt.summary}</p>}
                    <span className="rj-card__foot"><span>{k.recipe_ids.length} {lang === 'en' ? 'recipes' : 'receitas'}</span><span className="rj-card__price">{fmtBRL(priceOf(k))}</span></span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Link href={lang === 'en' ? '/sweet-escape' : '/sweet-escape/pt'} className="rj-book">
              <span className="rj-book__covers">
                {books.map(b => <span key={b.id}><Image src={b.hero_url!} alt="" fill sizes="120px" /></span>)}
              </span>
              <span>
                <h3>{lang === 'en' ? 'All seven in one book: Sweet Escape' : 'As sete num livro só: Sweet Escape'}</h3>
                <p>{lang === 'en'
                  ? 'Seven colors, seven recipes, and the why behind every swap. A PDF you keep, with a free 30-minute call with Dolly.'
                  : 'Sete cores, sete receitas e o porquê de cada troca. Um PDF que fica com você, com uma conversa grátis de 30 minutos com a Dolly.'}</p>
                <span className="rj-book__cta">{lang === 'en' ? 'See the book' : 'Ver o livro'} →</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* ── The next rung: Dolly ── */}
      <section className="rj-band rj-band--cream">
        <div className="rj-wrap rj-dolly">
          <span className="rj-dolly__photo"><Image src="/dolly/dolly-portrait-sm.webp" alt="Dolly" fill sizes="160px" /></span>
          <div>
            <p className="rj-kicker rj-kicker--start" data-sign="👩‍🍳">{c.dollyKicker}</p>
            <h2 className="rj-h2c rj-h2c--start">{c.dollyTitle}</h2>
            <p className="rj-dolly__text">{c.dollyText}</p>
            <div className="rj-dolly__ctas">
              <Link href={`${COACHING_PATH[lang]}#conversa`} className="rj-btn rj-btn--gold">{c.dollyCta}</Link>
              <Link href="/dolly" className="rj-linkbtn">{c.dollyMore} →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
