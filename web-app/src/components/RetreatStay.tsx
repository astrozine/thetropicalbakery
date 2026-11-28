'use client';

import React, { useEffect, useState } from 'react';
import WhatsAppGate from '@/components/WhatsAppGate';
import { STAY_COPY, type StayLang } from '@/lib/retreatStayCopy';
import { IMMERSION_FEE_PER_GUEST_PER_NIGHT } from '@/lib/retreatPricing';
import { getSiteSetting } from '@/lib/siteSettings';

/**
 * The lived-in retreat (Andrew, 2026-11-25): the sections that tell people what staying with the family is,
 * what a day looks like, what they take home, how the price works, how to get here and how to book.
 * RetreatsLayout places the parts around the rooms and the price planner. Words: src/lib/retreatStayCopy.ts.
 */
type Part = 'intro' | 'price' | 'after';

interface Props {
  part: Part;
  locale?: StayLang;
  whatsappHref: string;
}

const DAY_PHOTOS = ['/retreats/rooms/house-10.jpg', '/retreats/rooms/experience-1.jpg', '/dolly/dolly-tray.jpg', '/retreats/rooms/experience-4.jpg', '/retreats/real-cachoeira.jpg', '/retreats/Evening shot Itamabuca beach.webp', '/retreats/rooms/house-12.jpg'];

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;

export default function RetreatStay({ part, locale = 'pt', whatsappHref }: Props) {
  const t = STAY_COPY[locale] ?? STAY_COPY.pt;
  const [fee, setFee] = useState(IMMERSION_FEE_PER_GUEST_PER_NIGHT);
  useEffect(() => {
    if (part === 'price') getSiteSetting('retreat_immersion_fee_per_guest_per_night', IMMERSION_FEE_PER_GUEST_PER_NIGHT).then(setFee);
  }, [part]);

  const topic = `Retiro: quero vir (${locale})`;

  return (
    <>
      {part === 'intro' && (
        <>
          {/* Who it's for */}
          <section className="rs rs--cream">
            <div className="rs__wrap">
              <p className="rs__kicker">{t.who.kicker}</p>
              <h2 className="rs__h2">{t.who.title}</h2>
              <p className="rs__lead">{t.who.text}</p>
              <div className="rs__who">
                <img className="rs__whoimg" src="/retreats/rooms/house-11.jpg" alt="" loading="lazy" />
                <div className="rs__cards">
                  {t.who.cards.map(c => (
                    <div key={c.title} className="rs__card">
                      <span className="rs__emoji" aria-hidden>{c.emoji}</span>
                      <div><h3 className="rs__h3">{c.title}</h3><p className="rs__p">{c.text}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* A day with us */}
          <section className="rs rs--dark">
            <div className="rs__wrap">
              <p className="rs__kicker">{t.day.kicker}</p>
              <h2 className="rs__h2 rs__h2--light">{t.day.title}</h2>
              <p className="rs__lead rs__lead--light">{t.day.text}</p>
              <ol className="rs__day">
                {t.day.steps.map((s, i) => (
                  <li key={s.time} className="rs__step">
                    <img src={DAY_PHOTOS[i % DAY_PHOTOS.length]} alt="" loading="lazy" />
                    <div>
                      <span className="rs__time">{s.time}</span>
                      <h3 className="rs__h3 rs__h3--light">{s.title}</h3>
                      <p className="rs__p rs__p--light">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="rs__note">{t.day.note}</p>
            </div>
          </section>

          {/* What you take home */}
          <section className="rs rs--cream">
            <div className="rs__wrap">
              <p className="rs__kicker">{t.leave.kicker}</p>
              <h2 className="rs__h2">{t.leave.title}</h2>
              <ul className="rs__leave">
                {t.leave.items.map((it, i) => (
                  <li key={it.title}><b className="rs__num">{i + 1}</b><div><h3 className="rs__h3">{it.title}</h3><p className="rs__p">{it.text}</p></div></li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {part === 'price' && (
        <div className="rs__price">
          <p className="rs__kicker">{t.price.kicker}</p>
          <h2 className="rs__h2 rs__h2--light">{t.price.title}</h2>
          <p className="rs__lead rs__lead--light">{t.price.text}</p>
          <div className="rs__parts">
            {t.price.parts.map(p => (
              <div key={p.n} className="rs__part"><b className="rs__num rs__num--gold">{p.n}</b><div><h3 className="rs__h3 rs__h3--light">{p.title}</h3><p className="rs__p rs__p--light">{p.text}</p></div></div>
            ))}
          </div>
          <p className="rs__fee">{t.price.feeLine(brl(fee))}</p>
          <p className="rs__note">{t.price.tip}</p>
        </div>
      )}

      {part === 'after' && (
        <>
          {/* Getting here */}
          <section className="rs rs--cream" id="como-chegar">
            <div className="rs__wrap">
              <p className="rs__kicker">{t.travel.kicker}</p>
              <h2 className="rs__h2">{t.travel.title}</h2>
              <p className="rs__lead">{t.travel.text}</p>
              <div className="rs__grid">
                {t.travel.cards.map(c => (
                  <div key={c.title} className="rs__tile">
                    <span className="rs__emoji" aria-hidden>{c.emoji}</span>
                    <h3 className="rs__h3">{c.title}</h3>
                    <p className="rs__p">{c.text}</p>
                    {c.link && <a className="rs__link" href={c.link.href} target="_blank" rel="noopener noreferrer">{c.link.label} ↗</a>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How to book + FAQ */}
          <section className="rs rs--white">
            <div className="rs__wrap">
              <p className="rs__kicker">{t.steps.kicker}</p>
              <h2 className="rs__h2">{t.steps.title}</h2>
              <ol className="rs__book">
                {t.steps.items.map((s, i) => (
                  <li key={s.title}><b className="rs__num">{i + 1}</b><div><h3 className="rs__h3">{s.title}</h3><p className="rs__p">{s.text}</p></div></li>
                ))}
              </ol>
              <WhatsAppGate href={whatsappHref} topic={topic} tags={['retiros']} locale={locale} className="btn btn-primary rs__cta">
                {t.steps.cta}
              </WhatsAppGate>

              <div className="rs__faq">
                <p className="rs__kicker">{t.faq.kicker}</p>
                <h2 className="rs__h2 rs__h2--sm">{t.faq.title}</h2>
                {t.faq.items.slice(0, 3).map(f => (
                  <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
                ))}
                <details className="rs__more">
                  <summary>{t.faq.more}</summary>
                  {t.faq.items.slice(3).map(f => (
                    <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
                  ))}
                </details>
              </div>
            </div>
          </section>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .rs { padding: clamp(2.5rem, 7vw, 6rem) 1.25rem; }
        .rs--cream { background: #f7efdf; }
        .rs--white { background: #faf5ec; }
        .rs--dark { background: linear-gradient(180deg, #1e5d54 0%, #23352a 100%); }
        .rs__wrap { max-width: 1000px; margin: 0 auto; }
        .rs__kicker { color: #b8921f; letter-spacing: 3px; text-transform: uppercase; font-size: 0.78rem; font-weight: 700; margin: 0 0 0.6rem; }
        .rs--dark .rs__kicker, .rs__price .rs__kicker { color: #c9a257; }
        .rs__h2 { font-family: var(--font-heading); color: var(--color-primary); font-size: clamp(1.7rem, 4.5vw, 2.9rem); line-height: 1.12; margin: 0 0 0.9rem; }
        .rs__h2--light { color: #faf5ec; }
        .rs__h2--sm { font-size: clamp(1.4rem, 3.5vw, 2rem); }
        .rs__lead { font-size: 1.05rem; line-height: 1.7; color: #594a42; max-width: 640px; margin: 0 0 1.75rem; }
        .rs__lead--light { color: rgba(253,250,243,0.82); }
        .rs__h3 { font-size: 1.02rem; font-weight: 700; color: #2a1a12; margin: 0 0 0.25rem; line-height: 1.3; }
        .rs__h3--light { color: #faf5ec; }
        .rs__p { font-size: 0.95rem; line-height: 1.6; color: #594a42; margin: 0; }
        .rs__p--light { color: rgba(253,250,243,0.75); }
        .rs__emoji { font-size: 1.6rem; line-height: 1; }
        .rs__note { font-size: 0.88rem; font-style: italic; color: rgba(253,250,243,0.6); margin: 1.25rem 0 0; }
        .rs__num { flex: 0 0 auto; width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center; background: #2a1a12; color: #f7efdf; font-family: var(--font-heading); font-size: 0.95rem; }
        .rs__num--gold { background: #c9a257; color: #2a1a12; }

        .rs__who { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.25rem; }
        .rs__whoimg { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 16px; }
        .rs__cards { display: grid; gap: 0.75rem; }
        .rs__card { display: flex; gap: 0.9rem; align-items: flex-start; background: #faf5ec; border: 1px solid rgba(212,175,55,0.35); border-radius: 14px; padding: 0.95rem 1rem; }
        @media (min-width: 860px) { .rs__who { grid-template-columns: 1.1fr 1fr; align-items: center; } .rs__whoimg { aspect-ratio: 4 / 5; } }

        .rs__day { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.7rem; }
        .rs__step { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 0.9rem; align-items: center; background: rgba(253,250,243,0.06); border: 1px solid rgba(212,175,55,0.22); border-radius: 14px; padding: 0.6rem; }
        .rs__step img { width: 76px; height: 76px; object-fit: cover; border-radius: 10px; }
        .rs__time { display: inline-block; font-size: 0.72rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #c9a257; margin-bottom: 0.1rem; }
        @media (min-width: 860px) { .rs__day { grid-template-columns: 1fr 1fr; } .rs__step img { width: 96px; height: 96px; } .rs__step { grid-template-columns: 96px minmax(0, 1fr); } }

        .rs__leave, .rs__book { list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem; }
        .rs__leave li, .rs__book li { display: flex; gap: 0.9rem; align-items: flex-start; }
        @media (min-width: 860px) { .rs__leave { grid-template-columns: 1fr 1fr; column-gap: 2.5rem; } .rs__book { grid-template-columns: repeat(3, 1fr); } }

        .rs__price { max-width: 720px; margin: 0 auto 2rem; text-align: left; }
        .rs__parts { display: grid; gap: 0.75rem; }
        .rs__part { display: flex; gap: 0.9rem; align-items: flex-start; background: rgba(253,250,243,0.07); border-radius: 14px; padding: 0.95rem 1rem; }
        .rs__fee { margin: 1rem 0 0; padding: 0.85rem 1rem; border: 1px dashed rgba(212,175,55,0.6); border-radius: 12px; color: #faf5ec; font-weight: 600; font-size: 0.98rem; }
        @media (min-width: 720px) { .rs__parts { grid-template-columns: 1fr 1fr; } }

        .rs__grid { display: grid; gap: 0.75rem; grid-template-columns: minmax(0, 1fr); }
        .rs__tile { background: #faf5ec; border-radius: 14px; padding: 1rem 1.1rem; border: 1px solid rgba(42,26,18,0.08); display: grid; gap: 0.35rem; align-content: start; }
        .rs__link { color: #1e5d54; font-weight: 700; font-size: 0.9rem; text-decoration: underline; }
        @media (min-width: 720px) { .rs__grid { grid-template-columns: 1fr 1fr; } }

        .rs__cta { display: block; width: 100%; max-width: 360px; margin: 1.75rem 0 0; text-align: center; padding: 1rem; font-size: 1.05rem; }
        .rs__faq { margin-top: 3rem; }
        .rs__faq details { border-bottom: 1px solid rgba(42,26,18,0.12); padding: 0.85rem 0; }
        .rs__faq summary { cursor: pointer; font-weight: 700; color: #2a1a12; list-style: none; }
        .rs__faq summary::after { content: '+'; float: right; color: #b8921f; }
        .rs__faq details[open] > summary::after { content: '–'; }
        .rs__faq details p { margin: 0.5rem 0 0; color: #594a42; line-height: 1.6; font-size: 0.95rem; }
        .rs__more { border-bottom: 0 !important; }
        .rs__more > summary { color: #b8921f; }
      ` }} />
    </>
  );
}
