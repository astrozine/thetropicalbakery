'use client';

import React from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import IconTile from '@/components/IconTile';
import WhatsAppGate from '@/components/WhatsAppGate';
import { trackMeta } from '@/lib/metaPixel';
import { clearGoogleTranslate } from '@/lib/googleTranslate';
import { DOLLY_CALENDLY_URL, STORE_WHATSAPP } from '@/lib/siteContact';
import { COACHING_COPY, COACHING_LANGS, COACHING_LANG_LABEL, COACHING_PATH, type CoachingLang } from '@/lib/coachingCopy';

/*
 * The words come from Dolly herself: her Paradise Pantry guide (her basket question, the six building blocks, where
 * she shops, the "Food Healing Studio" pages) and the Food Healing ad inside Sweet Escape, written by hand in four
 * languages in src/lib/coachingCopy.ts. The page is about her whole way of eating, breakfast to dinner, told under her
 * own names only (see the note at the top of coachingCopy.ts), and it is written for women who may carry shame about
 * their weight, so there is no scale, no number and no before-and-after anywhere on it. Prices are not on the page
 * on purpose: every plan is made to measure and Dolly gives the price on the free call.
 */

const SAFE_ICONS = ['⚖️', '🔢', '📸', '🤍'];
const KONDO_ICONS = ['👀', '🙏', '🫙'];
const WAY_ICONS = ['🌱', '🍋', '🥗'];
/** The seven colors of the plate (Dolly's own frame, from the seven colors of Sweet Escape), one icon each. */
const COLOR_ICONS = ['🥬', '🍅', '🍆', '🥕', '🍌', '🧄', '🫘'];
const COLOR_DOTS = ['#4f8a3a', '#d33a3a', '#6b3c8f', '#e67e22', '#e9c23a', '#f3ede0', '#8a5a2b'];
const DAY_ICONS = ['🌅', '🥗', '🍲', '🍓'];
const STEP_ICONS = ['☎️', '🔍', '🧺', '🛒', '🗓️', '👨‍👩‍👧'];
const FEEL_IMGS = ['/coaching/people-table.webp', '/coaching/people-garden.webp', '/coaching/people-street.webp'];
/** The six building blocks from Paradise Pantry, with the illustrations from the guide. */
const PANTRY_IMGS = ['fats', 'sweet', 'structure', 'flavors', 'toppings', 'color'].map(n => `/coaching/pantry-${n}.webp`);
const SHOP_ICONS = ['🥭', '🌾', '🫙'];
const SOS_ICONS = ['💧', '🌿'];
const GIFT_ICONS = ['☎️', '📖'];

const wa = (text: string) => `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`;

function BookCall({ label, className, where, lang }: { label: string; className?: string; where: string; lang: CoachingLang }) {
  return (
    <a
      href={DOLLY_CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackMeta('Schedule', { content_name: `Coaching: conversa grátis (${where}, ${lang})` })}
    >
      {label}
    </a>
  );
}

/**
 * PT · EN · ES · NL, each a hand-written page. Google Translate's cookie is cleared on the way, or it would go on
 * "translating" the page someone just picked into whatever language they had chosen in the menu before.
 */
function LangSwitch({ lang, label, dark }: { lang: CoachingLang; label: string; dark?: boolean }) {
  return (
    <nav className={`fc-lang${dark ? ' fc-lang--dark' : ''} notranslate`} translate="no" aria-label={label}>
      <span className="fc-lang__globe" aria-hidden>🌐</span>
      {COACHING_LANGS.map(l => (
        <a
          key={l}
          href={COACHING_PATH[l]}
          hrefLang={l}
          lang={l}
          title={COACHING_LANG_LABEL[l]}
          aria-current={l === lang ? 'page' : undefined}
          className={l === lang ? 'is-on' : undefined}
          onClick={e => { e.preventDefault(); if (l === lang) return; clearGoogleTranslate(); window.location.href = COACHING_PATH[l]; }}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}

export default function CoachingLanding({ lang = 'pt' }: { lang?: CoachingLang }) {
  const t = COACHING_COPY[lang];
  // The WhatsApp sign-up speaks Portuguese, English and Spanish; Dutch readers get English.
  const gateLocale = lang === 'nl' ? 'en' : lang;
  return (
    <main className="fc" lang={lang}>
      {/* ── HERO: Dolly up front, the people she cooks for around her, over the Mata Atlântica ── */}
      <section className="fc-hero">
        <div className="fc-hero__bg" />
        <div className="fc-hero__inner">
          <div className="fc-hero__stage">
            <figure className="fc-hero__dolly">
              <img src="/coaching/dolly-hero.webp" alt={t.hero.dollyAlt} />
              <figcaption className="fc-hero__tag">
                <b>Dolly Van Dam</b>
                <span>{t.hero.tag}</span>
              </figcaption>
            </figure>
            <img className="fc-pol fc-pol--talk" src="/coaching/people-talk.webp" alt={t.hero.talkAlt} />
            <img className="fc-pol fc-pol--studio" src="/coaching/people-studio.webp" alt={t.hero.studioAlt} />
            <img className="fc-pol fc-pol--table" src="/brunch/brunch-jardim.webp" alt={t.hero.tableAlt} />
          </div>
          <div className="fc-hero__content">
            <LangSwitch lang={lang} label={t.langLabel} dark />
            <span className="fc-hero__kicker">{t.hero.kicker}</span>
            <h1 className="fc-hero__title notranslate" translate="no">The Daily<br />Tropical Reset</h1>
            <p className="fc-hero__text">{t.hero.text}</p>
            <div className="fc-hero__hi">
              <img src="/coaching/dolly-face.webp" alt="" />
              <p>{t.hero.hi}</p>
            </div>
            <BookCall label={t.hero.cta} className="btn btn-secondary fc-hero__cta" where="topo" lang={lang} />
            <p className="fc-hero__note">{t.hero.note}</p>
            <span className="fc-hero__gift"><span aria-hidden>🎁</span> {t.hero.gift}</span>
          </div>
        </div>
      </section>

      {/* ── The feeling: her own words from the e-book, on photos of the women it is for ── */}
      <section className="fc-sec fc-feel">
        <ScrollReveal>
          <p className="fc-feel__lead">{t.feel.lead}</p>
        </ScrollReveal>
        <div className="fc-feel__grid">
          {t.feel.cards.map((p, i) => (
            <ScrollReveal key={p.text} delay={i * 0.08}>
              <figure className="fc-feel__card">
                <img src={FEEL_IMGS[i]} alt={p.alt} loading="lazy" />
                <figcaption>{p.text}</figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <h2 className="fc-feel__q">{t.feel.q[0]}<em>{t.feel.q[1]}</em>{t.feel.q[2]}</h2>
          <p className="fc-feel__not">{t.feel.not}</p>
        </ScrollReveal>
      </section>

      {/* ── The promise: no scale, no counting, no before-and-after, no guilt ── */}
      <section className="fc-sec fc-safe">
        <ScrollReveal>
          <div className="fc-safe__card">
            <p className="fc-kicker" data-sign="🤍">{t.safe.kicker}</p>
            <h2 className="fc-h2">{t.safe.title}</h2>
            <p className="fc-intro">{t.safe.intro}</p>
            <div className="fc-safe__grid">
              {t.safe.items.map((s, i) => (
                <div key={s.title} className="fc-safe__item">
                  <IconTile size={50}>{SAFE_ICONS[i]}</IconTile>
                  <div><b>{s.title}</b><p>{s.text}</p></div>
                </div>
              ))}
            </div>
            <p className="fc-safe__end">{t.safe.end}</p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Marie Kondo, for food ── */}
      <section className="fc-sec fc-kondo">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="✨">{t.kondo.kicker}</p>
          <h2 className="fc-h2">{t.kondo.title}</h2>
          <p className="fc-intro">{t.kondo.intro}</p>
        </ScrollReveal>
        <div className="fc-kondo__grid">
          {t.kondo.items.map((k, i) => (
            <ScrollReveal key={k.title} delay={i * 0.08}>
              <div className="fc-card">
                <IconTile size={52}>{KONDO_ICONS[i]}</IconTile>
                <h3>{k.title}</h3>
                <p>{k.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Dolly's way: her three rules, then the seven colors of the plate ── */}
      <section className="fc-sec fc-way">
        <ScrollReveal>
          <p className="fc-kicker fc-kicker--light" data-sign="🌿">{t.way.kicker}</p>
          <h2 className="fc-h2 fc-h2--light">{t.way.title}</h2>
          <p className="fc-intro fc-intro--light">{t.way.intro}</p>
        </ScrollReveal>
        <div className="fc-way__grid">
          {t.way.items.map((w, i) => (
            <ScrollReveal key={w.title} delay={i * 0.08}>
              <div className="fc-way__card">
                <span className="fc-way__n">{i + 1}</span>
                <IconTile size={54}>{WAY_ICONS[i]}</IconTile>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <div className="fc-colors">
            <p className="fc-kicker fc-kicker--light" data-sign="🎨">{t.colors.kicker}</p>
            <h3 className="fc-colors__title">{t.colors.title}</h3>
            <p className="fc-intro fc-intro--light fc-colors__intro">{t.colors.intro}</p>
            <div className="fc-colors__grid">
              {t.colors.items.map((c, i) => (
                <div key={c.name} className="fc-colors__item">
                  <IconTile size={52}>{COLOR_ICONS[i]}</IconTile>
                  <b><span className="fc-colors__dot" style={{ background: COLOR_DOTS[i] }} aria-hidden />{c.name}</b>
                  <span>{c.foods}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── A day in the Reset: breakfast, lunch, dinner and the sweet ── */}
      <section className="fc-sec fc-day">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="🍽️">{t.day.kicker}</p>
          <h2 className="fc-h2">{t.day.title}</h2>
          <p className="fc-intro">{t.day.intro}</p>
        </ScrollReveal>
        <div className="fc-day__grid">
          {t.day.items.map((d, i) => (
            <ScrollReveal key={d.title} delay={i * 0.07}>
              <div className="fc-card fc-day__card">
                <IconTile size={52}>{DAY_ICONS[i]}</IconTile>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <p className="fc-day__note">{t.day.note}</p>
        </ScrollReveal>
      </section>

      {/* ── Step by step ── */}
      <section className="fc-sec fc-steps">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="🪜">{t.steps.kicker}</p>
          <h2 className="fc-h2">{t.steps.title}</h2>
        </ScrollReveal>
        <ol className="fc-steps__list">
          {t.steps.items.map((s, i) => (
            <li key={s.title}>
              <ScrollReveal delay={i * 0.05}>
                <div className="fc-step">
                  <span className="fc-step__n">{i + 1}</span>
                  <IconTile size={46}>{STEP_ICONS[i]}</IconTile>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Paradise Pantry: a real slice of her guide ── */}
      <section className="fc-sec fc-pantry">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="🧺">{t.pantry.kicker}</p>
          <h2 className="fc-h2">{t.pantry.title}</h2>
          <p className="fc-intro">{t.pantry.intro}</p>
        </ScrollReveal>
        <div className="fc-pantry__grid">
          {t.pantry.blocks.map((p, i) => (
            <ScrollReveal key={p.title} delay={(i % 3) * 0.06}>
              <figure className="fc-block">
                <img src={PANTRY_IMGS[i]} alt={p.title} loading="lazy" />
                <figcaption>
                  <span className="fc-block__n">{i + 1}</span>
                  <b>{p.title}</b>
                  <span>{p.text}</span>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <div className="fc-shop">
            {t.pantry.shop.map((s, i) => (
              <div key={s.lead}><IconTile size={42}>{SHOP_ICONS[i]}</IconTile><p><b>{s.lead}</b> {s.text}</p></div>
            ))}
          </div>
          <p className="fc-pantry__more">{t.pantry.more}</p>
        </ScrollReveal>
      </section>

      {/* ── Everything that's inside ── */}
      <section className="fc-sec fc-inc">
        <div className="fc-inc__wrap">
          <ScrollReveal>
            <img className="fc-inc__photo" src="/brunch/brunch-mesa.webp" alt={t.inc.photoAlt} loading="lazy" />
          </ScrollReveal>
          <ScrollReveal>
            <p className="fc-kicker" data-sign="📋">{t.inc.kicker}</p>
            <h2 className="fc-h2 fc-h2--start">{t.inc.title}</h2>
            <ul className="fc-inc__list">
              {t.inc.items.map(item => <li key={item}>{item}</li>)}
            </ul>
            <p className="fc-inc__end">{t.inc.end}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── The separate 2-week package ── */}
      <section id="sos" className="fc-sec fc-sos">
        <ScrollReveal>
          <div className="fc-sos__card">
            <span className="fc-sos__badge">{t.sos.badge}</span>
            <h2 className="fc-h2 fc-h2--start">{t.sos.title}</h2>
            <p className="fc-sos__lead">{t.sos.lead}</p>
            <div className="fc-sos__weeks">
              {t.sos.weeks.map((w, i) => (
                <div key={w.title} className="fc-sos__week">
                  <IconTile size={44}>{SOS_ICONS[i]}</IconTile>
                  <div><b>{w.title}</b><p>{w.text}</p></div>
                </div>
              ))}
            </div>
            <WhatsAppGate href={wa(t.whatsapp.sos)} topic={`Coaching: Reset SOS 2 semanas (${lang})`} tags={['cursos']} locale={gateLocale} className="btn btn-primary fc-sos__cta">
              {t.sos.cta}
            </WhatsAppGate>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Dolly ── */}
      <section className="fc-sec fc-dolly">
        <div className="fc-dolly__wrap">
          <ScrollReveal>
            <img className="fc-dolly__photo" src="/coaching/dolly-spatula.webp" alt={t.dolly.photoAlt} loading="lazy" />
          </ScrollReveal>
          <ScrollReveal>
            <p className="fc-kicker" data-sign="👩‍🍳">{t.dolly.kicker}</p>
            <h2 className="fc-h2 fc-h2--start">{t.dolly.title}</h2>
            <p>{t.dolly.p1}</p>
            <p>{t.dolly.p2}</p>
            <p className="fc-dolly__p3">{t.dolly.p3}</p>
            <Link href="/dolly" className="fc-link">{t.dolly.link}</Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Gifts + the way in ── */}
      <section id="conversa" className="fc-final">
        <div className="fc-final__bg" />
        <ScrollReveal>
          <div className="fc-final__inner">
            <p className="fc-final__kicker">{t.final.kicker}</p>
            <h2 className="fc-final__title">{t.final.title}</h2>
            <div className="fc-gifts">
              {t.final.gifts.map((g, i) => (
                <div key={g.title} className="fc-gift">
                  <IconTile size={54}>{GIFT_ICONS[i]}</IconTile>
                  <b>{g.title}</b>
                  <span>{g.text}</span>
                </div>
              ))}
            </div>
            <BookCall label={t.final.cta} className="btn btn-secondary fc-final__cta" where="final" lang={lang} />
            <p className="fc-final__or">
              {t.final.or}{' '}
              <WhatsAppGate href={wa(t.whatsapp.reset)} topic={`Coaching: The Daily Tropical Reset (${lang})`} tags={['cursos']} locale={gateLocale} className="fc-final__wa">
                {t.final.wa}
              </WhatsAppGate>
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FAQ ── */}
      <section className="fc-sec fc-faq">
        <p className="fc-kicker" data-sign="💬">{t.faq.kicker}</p>
        <h2 className="fc-h2">{t.faq.title}</h2>
        <div className="fc-faq__list">
          {t.faq.items.map(f => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="fc-faq__lang"><LangSwitch lang={lang} label={t.langLabel} /></div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </main>
  );
}

const CSS = `
.fc { background: var(--color-background); color: var(--color-text); overflow-x: hidden; }
.fc img { max-width: 100%; }
.fc-sec { padding: clamp(3.5rem, 8vw, 6rem) 1.25rem; max-width: 1100px; margin: 0 auto; }
.fc-kicker { display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: #b8921f; letter-spacing: 3px; text-transform: uppercase; font-size: 0.8rem; font-weight: 700; margin: 0 0 0.9rem; }
.fc-kicker--light { color: #e7c75a; }
.fc-h2 { font-family: var(--font-heading); font-size: clamp(1.45rem, 3.6vw, 2.5rem); line-height: 1.2; text-align: center; color: var(--color-primary); margin: 0 auto 1.1rem; max-width: 760px; }
.fc-h2--start { text-align: left; margin-left: 0; }
.fc-h2--light { color: #fdfaf3; }
.fc-intro { text-align: center; max-width: 680px; margin: 0 auto 2.5rem; line-height: 1.75; color: #594a42; font-size: 1.05rem; }
.fc-intro--light { color: rgba(253,250,243,0.85); }

/* Hero */
.fc-hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; background: #16201a; }
.fc-hero__bg { position: absolute; inset: 0; background: url("/dolly/hero-mata.webp") center / cover; filter: brightness(0.38) saturate(1.1); transform: scale(1.05); }
.fc-hero__inner { position: relative; z-index: 2; width: 100%; max-width: 1240px; margin: 0 auto; padding: 7rem 2rem 4.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 5vw, 5rem); align-items: center; }
/* Dolly in an arched frame, with the people she cooks for pinned around her like photos on a fridge. */
.fc-hero__stage { position: relative; width: min(100%, 470px); justify-self: center; padding: 2.5rem 3.5rem 3.5rem; }
.fc-hero__dolly { position: relative; margin: 0; z-index: 2; }
.fc-hero__dolly img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; object-position: center 20%; border-radius: 999px 999px 26px 26px; border: 6px solid #fdfaf3; box-shadow: 0 34px 70px rgba(0,0,0,0.55); }
.fc-hero__tag { position: absolute; left: 50%; bottom: -1.4rem; transform: translateX(-50%) rotate(-2deg); background: #fdfaf3; border: 1px solid rgba(212,175,55,0.7); border-radius: 14px; padding: 0.6rem 1.2rem; text-align: center; white-space: nowrap; box-shadow: 0 14px 30px rgba(0,0,0,0.4); }
.fc-hero__tag b { display: block; font-family: var(--font-heading); color: #3c2a21; font-size: 1rem; }
.fc-hero__tag span { font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase; color: #b8921f; font-weight: 700; }
.fc-pol { position: absolute; z-index: 3; object-fit: cover; border: 5px solid #fdfaf3; border-radius: 16px; box-shadow: 0 22px 44px rgba(0,0,0,0.5); }
.fc-pol--talk { top: 0; left: -1rem; width: 40%; aspect-ratio: 1; transform: rotate(-8deg); }
.fc-pol--studio { bottom: 3.5rem; right: -1.5rem; width: 38%; aspect-ratio: 4 / 5; transform: rotate(7deg); }
.fc-pol--table { top: 1.5rem; right: 0; width: 25%; aspect-ratio: 1; border-radius: 50%; transform: rotate(6deg); object-position: 50% 62%; }
.fc-hero__content { text-align: left; display: flex; flex-direction: column; align-items: flex-start; }
.fc-hero__hi { display: flex; gap: 0.8rem; align-items: center; background: rgba(253,250,243,0.1); border: 1px solid rgba(212,175,55,0.35); border-radius: 18px; padding: 0.7rem 1rem 0.7rem 0.7rem; margin: 0 0 1.6rem; max-width: 500px; backdrop-filter: blur(4px); }
.fc-hero__hi img { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid #d4af37; flex-shrink: 0; }
.fc-hero__hi p { margin: 0; color: #fdfaf3; font-style: italic; font-size: 0.95rem; line-height: 1.5; }
.fc-hero__kicker { color: #d4af37; letter-spacing: 3px; text-transform: uppercase; font-size: 0.8rem; font-weight: 700; padding-bottom: 0.55rem; border-bottom: 1px solid rgba(212,175,55,0.45); margin-bottom: 1.4rem; }
.fc-hero__title { font-family: var(--font-heading); color: #fff; font-size: clamp(2.2rem, 7vw, 5.2rem); line-height: 1.08; margin: 0 0 1.3rem; text-shadow: 0 4px 30px rgba(0,0,0,0.5); }
.fc-hero__text { color: rgba(255,255,255,0.88); font-size: clamp(1.02rem, 2vw, 1.25rem); line-height: 1.75; font-weight: 300; max-width: 540px; margin: 0 0 1.6rem; }
.fc-hero__cta { padding: 1rem 2.4rem; font-size: 1.05rem; letter-spacing: 1px; }
.fc-hero__note { color: rgba(255,255,255,0.7); font-size: 0.85rem; margin: 0.8rem 0 1.2rem; }
.fc-hero__gift { display: inline-flex; gap: 0.5rem; align-items: center; background: rgba(253,250,243,0.96); color: #3c2a21; border: 1px solid rgba(212,175,55,0.7); border-radius: 999px; padding: 0.5rem 1.1rem; font-size: 0.88rem; font-weight: 600; box-shadow: 0 10px 24px rgba(0,0,0,0.35); }

/* The feeling */
.fc-feel { text-align: center; }
.fc-feel__lead { font-family: var(--font-heading); font-size: clamp(1.15rem, 2.6vw, 1.6rem); color: #3c2a21; margin: 0 0 2rem; }
.fc-feel__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; margin: 0 0 3rem; }
.fc-feel__card { position: relative; margin: 0; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 50px -24px rgba(60,42,33,0.55); }
.fc-feel__card img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
.fc-feel__card figcaption { position: absolute; inset: auto 0 0 0; padding: 3.5rem 1.2rem 1.2rem; background: linear-gradient(to top, rgba(30,20,15,0.85), transparent); color: #fff; font-family: var(--font-heading); font-size: 1rem; line-height: 1.35; text-align: left; }
.fc-feel__q { font-family: var(--font-heading); font-size: clamp(1.6rem, 4.4vw, 2.8rem); line-height: 1.2; color: #2e4432; margin: 0 0 1rem; }
.fc-feel__q em { font-style: normal; color: #b8921f; }
.fc-feel__not { color: #8a6a3c; font-style: italic; font-size: 1.1rem; margin: 0; }

/* The promise: a soft card, four quiet points, no numbers anywhere */
.fc-safe { max-width: 980px; padding-top: 0; }
.fc-safe__card { background: #fdfaf3; border: 1px solid rgba(212,175,55,0.45); border-radius: 30px; padding: clamp(1.8rem, 4vw, 3rem); box-shadow: 0 30px 60px -34px rgba(60,42,33,0.45); }
.fc-safe .fc-intro { margin-bottom: 1.8rem; }
.fc-safe__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.fc-safe__item { display: flex; gap: 0.9rem; align-items: flex-start; background: #fff; border-radius: 18px; padding: 1.1rem; border: 1px solid rgba(60,42,33,0.06); }
.fc-safe__item b { font-family: var(--font-heading); font-size: 1rem; color: #2e4432; }
.fc-safe__item p { margin: 0.3rem 0 0; color: #594a42; line-height: 1.6; font-size: 0.95rem; }
.fc-safe__end { text-align: center; font-family: var(--font-heading); color: #3c2a21; font-size: 1.1rem; margin: 1.8rem 0 0; }

/* Cards */
.fc-kondo__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
.fc-card { background: #fff; border: 1px solid rgba(60,42,33,0.08); border-radius: 22px; padding: 1.8rem 1.5rem; height: 100%; box-shadow: 0 14px 34px -18px rgba(60,42,33,0.3); }
.fc-card h3 { font-family: var(--font-heading); font-size: 1.1rem; color: #3c2a21; margin: 1rem 0 0.5rem; }
.fc-card p { margin: 0; color: #594a42; line-height: 1.65; }

/* Steps */
.fc-steps { max-width: 820px; }
.fc-steps__list { list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: 0.9rem; }
.fc-step { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: start; background: #fff; border-radius: 18px; padding: 1.2rem 1.2rem 1.2rem 1.4rem; border: 1px solid rgba(60,42,33,0.08); }
.fc-step__n { position: absolute; top: -0.55rem; left: -0.55rem; width: 1.7rem; height: 1.7rem; border-radius: 50%; background: #d4af37; color: #3c2a21; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
.fc-step h3 { font-family: var(--font-heading); font-size: 1.02rem; margin: 0.2rem 0 0.35rem; color: #3c2a21; }
.fc-step p { margin: 0; color: #594a42; line-height: 1.6; }

/* Pantry */
.fc-pantry { max-width: 1180px; }
.fc-pantry__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.1rem; }
.fc-block { margin: 0; background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(60,42,33,0.08); height: 100%; display: flex; flex-direction: column; }
.fc-block img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.fc-block figcaption { padding: 1rem 1.1rem 1.2rem; display: grid; gap: 0.3rem; position: relative; }
.fc-block b { font-family: var(--font-heading); font-size: 0.98rem; color: #2e4432; }
.fc-block span { color: #594a42; font-size: 0.92rem; line-height: 1.5; }
.fc-block .fc-block__n { position: absolute; top: -1.1rem; right: 1rem; width: 2rem; height: 2rem; border-radius: 50%; background: #2e4432; color: #fdfaf3; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid #fdfaf3; }
.fc-shop { margin-top: 2.2rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.fc-shop > div { display: flex; gap: 0.9rem; align-items: flex-start; background: #f4ecdc; border-radius: 18px; padding: 1.1rem; }
.fc-shop p { margin: 0; line-height: 1.55; color: #3c2a21; font-size: 0.95rem; }
.fc-pantry__more { text-align: center; margin: 1.6rem 0 0; color: #8a6a3c; font-weight: 600; }

/* Dolly's way: three rules on the dark green, then the seven colors */
.fc-way { max-width: none; background: linear-gradient(160deg, #2e4432 0%, #22342a 100%); }
.fc-way > * { max-width: 1040px; margin-left: auto; margin-right: auto; }
.fc-way__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.1rem; }
.fc-way__card { position: relative; height: 100%; background: rgba(253,250,243,0.07); border: 1px solid rgba(212,175,55,0.35); border-radius: 22px; padding: 1.8rem 1.4rem 1.6rem; }
.fc-way__n { position: absolute; top: -0.7rem; left: 1.2rem; width: 1.8rem; height: 1.8rem; border-radius: 50%; background: #d4af37; color: #3c2a21; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; }
.fc-way__card h3 { font-family: var(--font-heading); font-size: 1.08rem; line-height: 1.3; color: #fdfaf3; margin: 1rem 0 0.55rem; }
.fc-way__card p { margin: 0; color: rgba(253,250,243,0.8); line-height: 1.65; font-size: 0.96rem; }
.fc-colors { margin-top: 3.2rem; padding-top: 2.6rem; border-top: 1px solid rgba(212,175,55,0.25); }
.fc-colors__title { font-family: var(--font-heading); text-align: center; color: #fdfaf3; font-size: clamp(1.3rem, 3vw, 2rem); margin: 0 0 0.9rem; }
.fc-colors__intro { margin-bottom: 1.8rem; }
.fc-colors__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem; }
.fc-colors__item { text-align: center; background: rgba(253,250,243,0.06); border: 1px solid rgba(212,175,55,0.3); border-radius: 18px; padding: 1.1rem 0.5rem; display: grid; justify-items: center; gap: 0.4rem; height: 100%; }
.fc-colors__item b { color: #fdfaf3; font-family: var(--font-heading); font-size: 0.92rem; margin-top: 0.25rem; display: inline-flex; align-items: center; gap: 0.4rem; }
.fc-colors__dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; display: inline-block; border: 1px solid rgba(253,250,243,0.5); }
.fc-colors__item > span { color: rgba(253,250,243,0.72); font-size: 0.78rem; line-height: 1.4; }

/* A day in the Reset */
.fc-day { max-width: 1100px; }
.fc-day__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.1rem; }
.fc-day__card { background: #f8f3e8; border-color: rgba(212,175,55,0.35); }
.fc-day__note { text-align: center; color: #8a6a3c; font-style: italic; margin: 1.6rem 0 0; }

/* Includes */
.fc-inc__wrap { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: clamp(1.5rem, 5vw, 4rem); align-items: center; }
.fc-inc__photo { width: 100%; border-radius: 26px; transform: rotate(-2.5deg); box-shadow: 0 30px 60px -20px rgba(60,42,33,0.5); border: 6px solid #fff; }
.fc-inc .fc-kicker { justify-content: flex-start; }
.fc-inc__list { list-style: none; padding: 0; margin: 0 0 1.4rem; display: grid; gap: 0.55rem; }
.fc-inc__list li { position: relative; padding-left: 1.9rem; line-height: 1.55; color: #3c2a21; }
.fc-inc__list li::before { content: '✓'; position: absolute; left: 0; top: 0.05rem; width: 1.3rem; height: 1.3rem; border-radius: 50%; background: #2e4432; color: #fdfaf3; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.fc-inc__end { font-style: italic; color: #8a6a3c; line-height: 1.7; margin: 0; }

/* SOS package */
.fc-sos { max-width: 900px; }
.fc-sos__card { position: relative; background: #fff; border: 2px solid #d4af37; border-radius: 28px; padding: clamp(1.6rem, 4vw, 2.8rem); box-shadow: 0 30px 60px -30px rgba(60,42,33,0.45); }
.fc-sos__badge { display: inline-block; background: #3c2a21; color: #e7c75a; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-radius: 999px; padding: 0.4rem 0.95rem; margin-bottom: 1rem; }
.fc-sos__lead { color: #594a42; line-height: 1.7; margin: 0 0 1.5rem; }
.fc-sos__weeks { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.8rem; }
.fc-sos__week { display: flex; gap: 0.9rem; align-items: flex-start; background: #f8f3e8; border-radius: 18px; padding: 1.1rem; }
.fc-sos__week b { font-family: var(--font-heading); font-size: 0.95rem; color: #2e4432; }
.fc-sos__week p { margin: 0.35rem 0 0; color: #594a42; line-height: 1.55; font-size: 0.94rem; }
.fc-sos__cta { display: inline-flex; }

/* Dolly */
.fc-dolly__wrap { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: clamp(1.5rem, 5vw, 4rem); align-items: center; }
.fc-dolly__photo { width: 100%; border-radius: 26px; transform: rotate(2deg); box-shadow: 0 30px 60px -20px rgba(60,42,33,0.5); border: 6px solid #fff; }
.fc-dolly .fc-kicker { justify-content: flex-start; }
.fc-dolly p { line-height: 1.75; color: #594a42; }
.fc-dolly__p3 { font-family: var(--font-heading); color: #2e4432; font-size: 1.08rem; }
.fc-link { color: #2e4432; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }

/* Final */
.fc-final { position: relative; padding: clamp(4rem, 9vw, 7rem) 1.25rem; overflow: hidden; background: #2a1d16; text-align: center; }
.fc-final__bg { position: absolute; inset: 0; background: url("/dolly/hero-mata.webp") center / cover; filter: brightness(0.3) blur(2px); transform: scale(1.08); }
.fc-final__inner { position: relative; max-width: 760px; margin: 0 auto; }
.fc-final__kicker { color: #d4af37; letter-spacing: 4px; text-transform: uppercase; font-size: 0.82rem; font-weight: 700; margin: 0 0 0.8rem; }
.fc-final__title { font-family: var(--font-heading); color: #fff; font-size: clamp(1.6rem, 4.4vw, 2.8rem); margin: 0 0 2rem; }
.fc-gifts { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2.2rem; }
.fc-gift { background: rgba(253,250,243,0.97); color: #3c2a21; border: 1px solid rgba(212,175,55,0.7); border-radius: 20px; padding: 1.4rem 1.2rem; display: grid; justify-items: center; gap: 0.5rem; }
.fc-gift b { font-family: var(--font-heading); font-size: 1rem; margin-top: 0.3rem; }
.fc-gift span { color: #594a42; font-size: 0.92rem; line-height: 1.5; }
.fc-final__cta { padding: 1rem 2.4rem; font-size: 1.05rem; }
.fc-final__or { color: rgba(255,255,255,0.8); margin: 1.3rem 0 0; font-size: 0.95rem; }
.fc-final__wa { color: #e7c75a; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; background: none; border: 0; cursor: pointer; font: inherit; padding: 0; }

/* FAQ */
.fc-faq { max-width: 780px; }
.fc-faq__list { display: grid; gap: 0.7rem; margin-top: 1.4rem; }
.fc-faq details { background: #fff; border: 1px solid rgba(60,42,33,0.1); border-radius: 16px; padding: 1rem 1.2rem; }
.fc-faq summary { cursor: pointer; font-weight: 700; color: #3c2a21; }
.fc-faq details p { margin: 0.7rem 0 0; color: #594a42; line-height: 1.65; }

/* Language switch: PT · EN · ES · NL */
.fc-lang { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.25rem; border-radius: 999px; background: #fff; border: 1px solid rgba(60,42,33,0.12); margin: 0 0 1.4rem; }
.fc-lang__globe { font-size: 0.95rem; padding: 0 0.35rem 0 0.45rem; }
.fc-lang a { min-width: 2.6rem; padding: 0.42rem 0.7rem; border-radius: 999px; text-align: center; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px; color: #3c2a21; text-decoration: none; }
.fc-lang a:hover { background: rgba(212,175,55,0.15); }
.fc-lang a.is-on { background: #d4af37; color: #3c2a21; }
.fc-lang--dark { background: rgba(253,250,243,0.1); border-color: rgba(212,175,55,0.45); backdrop-filter: blur(4px); }
.fc-lang--dark a { color: #fdfaf3; }
.fc-lang--dark a.is-on { color: #3c2a21; }
.fc-faq__lang { display: flex; justify-content: center; margin-top: 2.5rem; }

/* Tablets */
@media (max-width: 900px) {
  .fc-pantry__grid { grid-template-columns: repeat(2, 1fr); }
  .fc-colors__grid { grid-template-columns: repeat(4, 1fr); }
  .fc-way__grid { grid-template-columns: 1fr; max-width: 560px; margin: 0 auto; }
  .fc-day__grid { grid-template-columns: 1fr 1fr; }
  .fc-shop { grid-template-columns: 1fr; }
}

/* Phones: the photos get their own little collage above the words, so nothing covers the text. */
@media (max-width: 767px) {
  .fc-hero { display: block; min-height: 0; }
  .fc-hero__inner { grid-template-columns: 1fr; gap: 2.2rem; padding: 6rem 1.25rem 3rem; }
  .fc-hero__stage { width: min(100%, 360px); padding: 1.5rem 2.6rem 2.4rem; }
  .fc-pol { border-width: 4px; border-radius: 12px; }
  .fc-pol--talk { left: -0.25rem; }
  .fc-pol--studio { right: -0.5rem; bottom: 2.6rem; }
  .fc-hero__tag { padding: 0.5rem 1rem; }
  .fc-hero__tag b { font-size: 0.9rem; }
  .fc-hero__tag span { font-size: 0.62rem; letter-spacing: 1px; }
  .fc-hero__content { text-align: center; align-items: center; }
  .fc-hero__hi { text-align: left; }
  .fc-hero__kicker { font-size: 0.7rem; letter-spacing: 2px; }
  .fc-feel__grid { grid-template-columns: 1fr; gap: 1rem; max-width: 380px; margin-left: auto; margin-right: auto; }
  .fc-feel__card img { aspect-ratio: 4 / 3; }
  .fc-hero__cta { width: 100%; max-width: 340px; padding: 1rem 1.2rem; }
  .fc-pantry__grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .fc-block figcaption { padding: 0.85rem 0.8rem 1rem; }
  .fc-block b { font-size: 0.85rem; }
  .fc-block span { font-size: 0.8rem; }
  .fc-colors__grid { grid-template-columns: repeat(2, 1fr); }
  .fc-safe__grid, .fc-day__grid { grid-template-columns: 1fr; }
  .fc-safe__card { border-radius: 22px; }
  .fc-inc__wrap, .fc-dolly__wrap { grid-template-columns: 1fr; }
  .fc-inc__photo, .fc-dolly__photo { max-width: 300px; margin: 0 auto; display: block; }
  .fc-h2--start { text-align: center; }
  .fc-inc .fc-kicker, .fc-dolly .fc-kicker { justify-content: center; }
  .fc-sos__weeks, .fc-gifts { grid-template-columns: 1fr; }
  .fc-sos__cta { width: 100%; justify-content: center; }
  .fc-final__cta { width: 100%; max-width: 340px; }
}
`;
