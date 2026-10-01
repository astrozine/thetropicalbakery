'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RECIPES } from '@/lib/ebook';
import { EBOOK_COPY, type EbookLang } from '@/lib/ebookCopy';

/**
 * The seven days, one color at a time. The whole section takes on the color of the day you pick; until
 * the visitor taps, it walks through the rainbow by itself (only while it is on screen).
 */
export default function RainbowJourney({ lang = 'en' }: { lang?: EbookLang }) {
  const c = EBOOK_COPY[lang];
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI(n => (n + 1) % RECIPES.length), 5200);
    return () => clearInterval(t);
  }, [auto, visible]);

  const pick = (n: number) => { setAuto(false); setI(n); };
  const r = RECIPES[i];
  const t = c.recipes[i];

  return (
    <section
      ref={ref}
      id="recipes"
      className="se-journey"
      style={{ '--day': r.hex, '--ink': r.ink } as React.CSSProperties}
      aria-label={c.journey.title}
    >
      <div className="se-wrap">
        <p className="se-kicker se-kicker--ink">{c.journey.kicker}</p>
        <h2 className="se-h2 se-journey__h2">{c.journey.title}</h2>
        <p className="se-journey__lead">{c.journey.lead}</p>

        <div className="se-days" role="tablist" aria-label={c.journey.tabs}>
          {RECIPES.map((d, n) => (
            <button
              key={d.day}
              type="button"
              role="tab"
              aria-selected={n === i}
              className={`se-day${n === i ? ' is-on' : ''}`}
              style={{ '--c': d.hex } as React.CSSProperties}
              onClick={() => pick(n)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.img} alt="" loading="lazy" />
              <span>{c.journey.day} {d.day}<b>{c.recipes[n].color}</b></span>
            </button>
          ))}
        </div>

        <article className="se-feature" key={r.day} role="tabpanel">
          <div className="se-feature__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.img} alt={t.alt} />
            <span className="se-feature__badge">{c.journey.day} {r.day} · {t.color}</span>
          </div>
          <div className="se-feature__text">
            {/* Recipe names stay in English: that is what the reader will find in the book. */}
            <h3 className="notranslate" translate="no" lang="en">{r.name}</h3>
            <p className="se-feature__sub">{t.subtitle}</p>
            <p>{t.hook}</p>
            <p className="se-feature__kid"><span aria-hidden>👧</span> {t.kidAngle}</p>
            <p className="se-feature__makes">{t.makes}</p>
          </div>
        </article>

        {auto && visible && (
          <div className="se-journey__progress" aria-hidden>
            <span key={i} />
          </div>
        )}
      </div>
    </section>
  );
}
