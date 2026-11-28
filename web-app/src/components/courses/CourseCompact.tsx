'use client';

import { noEmoji } from '@/lib/noEmoji';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';
import { optimizedSrc } from '@/lib/thumbs';
import { COURSE_CONTENT, MagicTrick, PATHS, PathId } from '@/lib/courseContent';
import { courseIsShown, useShownCourses } from '@/lib/useShownCourses';
import {
  WORKSHOP_GROUP_LINE, WORKSHOP_HOURS, WORKSHOP_PRICE_SHORT, WORKSHOP_START, workshopBreakLine,
} from '@/lib/workshopDates';
import './courseCompact.css';

/**
 * The compact course pages (2026-11-15). Andrew: the old pages were "way too long and scroll intensive".
 * The rule here: the first screen answers what, when, how long and how to book; the courses come right
 * after; and everything that is nice to know (retreat, rainy day, paths, questions) waits behind one tap.
 * Styles: courseCompact.css (cx- prefix). The older, longer sections are still in CourseSections.tsx.
 */

export type Enquire = (interest: string, type?: 'curso' | 'retiro') => void;

const bg = (src: string, w: 384 | 750 | 1080 | 1920 = 1920) => `url("${optimizedSrc(src, w)}")`;
const endHour = `${parseInt(WORKSHOP_START, 10) + WORKSHOP_HOURS}h`;

/* ------------------------------------------------------------------ hero: what, when, how long, book */
/**
 * The course's own photo is the star: shown bright and big, with two smaller photos tucked on its corners
 * (Andrew, 2026-11-21: "those pages say nothing without those images"). A blurred, dark copy sits behind it
 * only as atmosphere. Phone: photo first, then the words. Desktop: words left, photo right.
 */
export function CompactHero({ eyebrow, title, tagline, image, floating = [], cta, onCta, secondary }: {
  eyebrow: string; title: string; tagline: string; image: string; floating?: string[];
  cta: string; onCta: () => void; secondary?: { label: string; href: string };
}) {
  // Read after the page is on screen, so the visitor's own date decides it (and the server's render matches).
  const [breakLine, setBreakLine] = useState('');
  useEffect(() => { setBreakLine(workshopBreakLine()); }, []);
  return (
    <section className="cx-hero">
      <div className="cx-hero-bg" style={{ backgroundImage: bg(image, 750) }} aria-hidden />
      <div className="cx-hero-grid">
      <figure className="cx-hero-photo">
        <img className="cx-hero-main" src={optimizedSrc(image, 1080)} alt={title} fetchPriority="high" />
        {floating.slice(0, 2).map((src, i) => (
          <img key={src} className={`cx-hero-float cx-hero-float-${i}`} src={optimizedSrc(src, 384)} alt="" aria-hidden />
        ))}
      </figure>
      <div className="cx-hero-in">
        <span className="cx-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="cx-hero-tag">{tagline}</p>
        <ul className="cx-facts">
          <li className="cx-fact-main">Todos os dias · {WORKSHOP_START} às {endHour}</li>
          <li>{WORKSHOP_HOURS} horas</li>
          <li>Itamambuca</li>
          <li>{WORKSHOP_PRICE_SHORT}</li>
        </ul>
        <div className="cx-hero-actions">
          <button type="button" onClick={onCta} className="cx-btn cx-btn-gold">{cta}</button>
          {secondary && <a href={secondary.href} className="cx-btn cx-btn-ghost">{secondary.label}</a>}
        </div>
        {breakLine && <p className="cx-hero-note">{breakLine}</p>}
      </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ the price */
export function PriceCard() {
  return (
    <div className="cx-price">
      <strong>{WORKSHOP_PRICE_SHORT}</strong>
      <p>{WORKSHOP_GROUP_LINE}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ one row of promises */
export function PromiseStrip({ items }: { items: string[] }) {
  return <div className="cx-strip">{items.map(t => <span key={t}>{noEmoji(t)}</span>)}</div>;
}

/* ------------------------------------------------------------------ Dolly's flavour tricks, small */
function Trick({ t }: { t: MagicTrick }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      className={`cx-trick${on ? ' is-on' : ''}`}
      onClick={() => setOn(v => !v)}
      aria-pressed={on}
      aria-label={`${t.craving}. ${on ? t.trick : 'Toque para descobrir o truque.'}`}
    >
      {on ? (
        <>
          <span className="cx-trick-label">O truque</span>
          <span className="cx-trick-text">{t.trick}</span>
        </>
      ) : (
        <>
          <span className="cx-trick-emoji" aria-hidden>{t.emoji}</span>
          <span className="cx-trick-label">A boca sente</span>
          <span className="cx-trick-name">{t.craving}</span>
          <span className="cx-trick-hint">Toque para ver o truque ↻</span>
        </>
      )}
    </button>
  );
}

export function CompactMagic({ tricks, text }: { tricks: MagicTrick[]; text: string }) {
  return (
    <section className="cx-magic" id="magia">
      <div className="cx-wrap">
        <span className="cx-eyebrow">O segredo da casa</span>
        <h2 className="cx-h2">As combinações mágicas da Dolly</h2>
        <p className="cx-p">{text}</p>
        <div className="cx-rail">{tricks.map(t => <Trick key={t.craving} t={t} />)}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ the fold-away rows */
export function Fold({ emoji, title, children }: { emoji?: string; title: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>{emoji && <span className="cx-acc-emoji" aria-hidden>{emoji}</span>}<span>{title}</span></summary>
      <div className="cx-acc-body">{children}</div>
    </details>
  );
}

export function RetreatFold({ text, interest, onEnquire }: { text: string; interest: string; onEnquire: Enquire }) {
  return (
    <Fold emoji="🏝️" title="Curso + retiro na praia">
      <img className="cx-acc-photo" src={optimizedSrc('/retreats/Beach shot Itamambuca.webp', 750)} alt="Praia de Itamambuca" loading="lazy" />
      <p><strong>Mergulhe de manhã. Aprenda à tarde.</strong> {text}</p>
      <button type="button" className="cx-btn cx-btn-gold cx-btn-sm" onClick={() => onEnquire(`Curso + Retiro: ${interest}`, 'retiro')}>Quero o pacote com praia</button>
      <Link href="/retreats#pacote" className="cx-btn cx-btn-line cx-btn-sm">Montar meu pacote</Link>
    </Fold>
  );
}

export function RainFold({ text, onEnquire }: { text: string; onEnquire: Enquire }) {
  return (
    <Fold emoji="🌧️" title="Choveu? Tarde em família na cozinha">
      <p>{text}</p>
      <button type="button" className="cx-btn cx-btn-gold cx-btn-sm" onClick={() => onEnquire('Tarde em família (dia de chuva)')}>Reservar uma tarde em família</button>
    </Fold>
  );
}

export function PathsFold({ ids }: { ids: PathId[] }) {
  return (
    <Fold emoji="🚪" title="Onde um curso pode te levar">
      <ul>
        {ids.map(id => {
          const p = PATHS[id];
          return (
            <li key={id}>
              <strong>{p.emoji} {p.title}.</strong> {p.text}
              {p.link && <> <Link href={p.link.href} style={{ color: '#a8843f', fontWeight: 700 }}>{p.link.label} →</Link></>}
            </li>
          );
        })}
      </ul>
    </Fold>
  );
}

export function FaqFolds({ items }: { items: { q: string; a: string }[] }) {
  return <>{items.map(f => <Fold key={f.q} title={f.q}><p>{f.a}</p></Fold>)}</>;
}

/* ------------------------------------------------------------------ photos, one row */
export function PhotoRow({ images }: { images: string[] }) {
  return (
    <div className="cx-photos">
      {images.map(src => <ZoomableImage key={src} src={src} alt="Criação da The Tropical Bakery" thumbWidth={384} />)}
    </div>
  );
}

/* ------------------------------------------------------------------ last call */
export function CompactCTA({ title, text, cta, onCta }: { title: string; text: string; cta: string; onCta: () => void }) {
  return (
    <section className="cx-cta">
      <div className="cx-wrap">
        <h2 className="cx-h2">{title}</h2>
        <p className="cx-p">{text}</p>
        <button type="button" onClick={onCta} className="cx-btn cx-btn-gold">{cta}</button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ the other courses, as slim rows */
export function OtherCourseRows({ currentSlug }: { currentSlug: string }) {
  const shown = useShownCourses();
  const others = COURSE_CONTENT.filter(c => c.slug !== currentSlug && courseIsShown(shown, c.slug));
  if (others.length === 0) return null;
  return (
    <section className="cx-sec">
      <div className="cx-wrap">
        <h2 className="cx-h2">Outros cursos</h2>
        <div className="cx-others">
          {others.map(c => (
            <Link key={c.slug} href={`/cursos/${c.slug}`} className="cx-other">
              <span className="cx-other-img" style={{ backgroundImage: bg(c.heroImage, 384) }} aria-hidden />
              <span><strong>{c.title}</strong><small>{c.short}</small></span>
              <span className="cx-other-go" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
