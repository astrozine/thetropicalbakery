'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ZoomableImage from '@/components/ZoomableImage';
import { optimizedSrc } from '@/lib/thumbs';
import { MagicTrick, PATHS, PathId, RETREAT_PHOTOS } from '@/lib/courseContent';

export type Enquire = (interest: string, type?: 'curso' | 'retiro') => void;

const bg = (src: string, w: 1080 | 1920 = 1920) => `url("${optimizedSrc(src, w)}")`;

/* ------------------------------------------------------------------ hero: photos floating over a full-bleed scene */
export function CourseHero({ eyebrow, title, tagline, image, floating, price, cta, onCta, secondary }: {
  eyebrow: string; title: string; tagline: string; image: string; floating: string[];
  price?: string; cta: string; onCta: () => void; secondary?: { label: string; href: string };
}) {
  return (
    <section className="crs-hero">
      <div className="crs-hero-bg" style={{ backgroundImage: bg(image) }} aria-hidden />
      {floating.slice(0, 3).map((src, i) => (
        <img key={src} src={optimizedSrc(src, 384)} alt="" aria-hidden className={`crs-float crs-float-${i}`} />
      ))}
      <div className="crs-hero-inner">
        <span className="crs-eyebrow">{eyebrow}</span>
        <h1 className="crs-hero-title">{title}</h1>
        <p className="crs-hero-tagline">{tagline}</p>
        <div className="crs-hero-actions">
          <button type="button" onClick={onCta} className="crs-btn crs-btn-gold">{cta}</button>
          {secondary && <a href={secondary.href} className="crs-btn crs-btn-ghost">{secondary.label}</a>}
        </div>
        {price && <p className="crs-hero-price">{price}</p>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ magic flavour combinations: flip cards */
function TrickCard({ t, i }: { t: MagicTrick; i: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className={`crs-trick${flipped ? ' is-flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
      aria-pressed={flipped}
      aria-label={`${t.craving}. ${flipped ? t.trick : 'Toque para descobrir o truque.'}`}
      style={{ animationDelay: `${i * 0.08}s` }}
    >
      <span className="crs-trick-inner">
        <span className="crs-trick-face crs-trick-front">
          <span className="crs-trick-emoji" aria-hidden>{t.emoji}</span>
          <span className="crs-trick-label">A boca sente</span>
          <span className="crs-trick-craving">{t.craving}</span>
          <span className="crs-trick-hint">Toque para ver o truque ↻</span>
        </span>
        <span className="crs-trick-face crs-trick-back">
          <span className="crs-trick-label">O truque</span>
          <span className="crs-trick-text">{t.trick}</span>
        </span>
      </span>
    </button>
  );
}

export function MagicFlavors({ intro, tricks, title = 'As combinações mágicas da Dolly' }: { intro: string; tricks: MagicTrick[]; title?: string }) {
  return (
    <section className="crs-magic">
      <div className="crs-wrap">
        <span className="crs-eyebrow">O segredo da casa ✦ Enganar o paladar</span>
        <h2 className="crs-h2 crs-light">{title}</h2>
        <p className="crs-lead crs-light-soft">
          A marca registrada da Dolly são combinações de sabor que <strong>enganam as papilas e até os dentes</strong>: a boca sente
          o caramelo, a crocância e a cremosidade que a gente deseja nos doces industrializados, mas o que chega ao corpo é fruta,
          castanha, semente e especiaria. {intro}
        </p>
        <div className="crs-tricks">
          {tricks.map((t, i) => <TrickCard key={t.craving} t={t} i={i} />)}
        </div>
        <p className="crs-footnote crs-light-soft">Estes são os princípios. As combinações exatas, a Dolly ensina na bancada.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ who it's for / what you leave with */
export function WhoAndWhat({ story, whoFor, youLeaveWith }: { story: string[]; whoFor: string[]; youLeaveWith: string[] }) {
  return (
    <section className="crs-section">
      <div className="crs-wrap">
        <div className="crs-story">{story.map(p => <p key={p.slice(0, 20)}>{p}</p>)}</div>
        <div className="crs-two">
          <div className="crs-card">
            <h3 className="crs-h3">Para quem é</h3>
            <ul className="crs-list">{whoFor.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="crs-card crs-card-gold">
            <h3 className="crs-h3">Você sai com</h3>
            <ul className="crs-list crs-list-check">{youLeaveWith.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ the journey */
export function CourseJourney({ steps, title = 'Como é a experiência' }: { steps: { title: string; text: string }[]; title?: string }) {
  return (
    <section className="crs-section crs-section-soft">
      <div className="crs-wrap">
        <h2 className="crs-h2">{title}</h2>
        <ol className="crs-journey">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="crs-journey-num" aria-hidden>{i + 1}</span>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ where this can take you */
export function CoursePaths({ ids, title = 'Onde isso pode te levar' }: { ids: PathId[]; title?: string }) {
  return (
    <section className="crs-section">
      <div className="crs-wrap">
        <span className="crs-eyebrow">Mais do que uma aula</span>
        <h2 className="crs-h2">{title}</h2>
        <p className="crs-lead">Um curso com a Dolly é uma porta. Para onde ela abre, depende de você.</p>
        <div className="crs-paths">
          {ids.map(id => {
            const p = PATHS[id];
            return (
              <div key={id} className="crs-path">
                <span className="crs-path-emoji" aria-hidden>{p.emoji}</span>
                <h3 className="crs-h3">{p.title}</h3>
                <p>{p.text}</p>
                {p.link && <Link href={p.link.href} className="crs-link">{p.link.label} →</Link>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ course + beach retreat */
export function BeachRetreat({ text, onEnquire, interest }: { text: string; onEnquire: Enquire; interest: string }) {
  return (
    <section className="crs-beach">
      <div className="crs-beach-bg" style={{ backgroundImage: bg('/retreats/real-itamambuca-aerial.jpg') }} aria-hidden />
      {RETREAT_PHOTOS.map((src, i) => (
        <ZoomableImage key={src} src={src} alt="Itamambuca" thumbWidth={384} className={`crs-beach-photo crs-beach-photo-${i}`} />
      ))}
      <div className="crs-beach-inner">
        <img src="/itamambuca-ribbon.png" alt="Itamambuca" className="crs-ribbon" />
        <span className="crs-eyebrow">Curso + Retiro</span>
        <h2 className="crs-h2 crs-light">Aprenda de manhã. Mergulhe à tarde.</h2>
        <p className="crs-lead crs-light-soft">{text}</p>
        <ul className="crs-beach-list">
          <li>🌊 Praia de Itamambuca, um dos picos de surf mais bonitos do litoral</li>
          <li>💧 Cachoeira do Prumirim e o rio que desce da Mata Atlântica</li>
          <li>🏝️ Trilhas, ilhas e pôr do sol na areia</li>
          <li>🏡 Hospedagem na casa de retiro em Itamambuca</li>
        </ul>
        <div className="crs-hero-actions">
          <button type="button" onClick={() => onEnquire(`Curso + Retiro: ${interest}`, 'retiro')} className="crs-btn crs-btn-gold">Quero o pacote com praia</button>
          <Link href="/retreats" className="crs-btn crs-btn-ghost">Ver a casa e os quartos</Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ rainy day in Itamambuca, for the whole family */
export function RainyDay({ text, onEnquire }: { text: string; onEnquire: Enquire }) {
  return (
    <section className="crs-rain">
      <div className="crs-rain-bg" style={{ backgroundImage: bg('/assets/chef_training_1789884593538.jpg', 1080) }} aria-hidden />
      <div className="crs-rain-drops" aria-hidden />
      <div className="crs-wrap crs-rain-inner">
        <span className="crs-rain-cloud" aria-hidden>🌧️</span>
        <span className="crs-eyebrow">Plano B que vira o melhor dia da viagem</span>
        <h2 className="crs-h2 crs-light">Choveu em Itamambuca?</h2>
        <p className="crs-lead crs-light-soft">{text}</p>
        <div className="crs-rain-points">
          <span>👨‍👩‍👧‍👦 Para todas as idades</span>
          <span>🧁 Cada um leva o que fez</span>
          <span>🍫 Doce que pode repetir</span>
          <span>📵 Uma tarde longe das telas</span>
        </div>
        <button type="button" onClick={() => onEnquire('Tarde em família (dia de chuva)')} className="crs-btn crs-btn-gold">Reservar uma tarde em família</button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ */
export function CourseFAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="crs-section crs-section-soft">
      <div className="crs-wrap crs-narrow">
        <h2 className="crs-h2">Perguntas frequentes</h2>
        <div className="crs-faq">
          {items.map((f, i) => (
            <div key={f.q} className={`crs-faq-item${open === i ? ' is-open' : ''}`}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span><span aria-hidden className="crs-faq-plus">+</span>
              </button>
              {open === i && <p>{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ closing band */
export function CourseCTA({ title, text, cta, onCta }: { title: string; text: string; cta: string; onCta: () => void }) {
  return (
    <section className="crs-cta">
      <div className="crs-wrap crs-narrow">
        <h2 className="crs-h2 crs-light">{title}</h2>
        <p className="crs-lead crs-light-soft">{text}</p>
        <button type="button" onClick={onCta} className="crs-btn crs-btn-gold">{cta}</button>
      </div>
    </section>
  );
}

export function CourseGallery({ images }: { images: string[] }) {
  return (
    <section className="crs-section" style={{ paddingTop: 0 }}>
      {/* The rail (.crs-gallery) pulls itself 1rem past its container on phones, so it must sit INSIDE
          the padded wrap. When it was the wrap itself it ended up 32px wider than the screen. */}
      <div className="crs-wrap">
        <div className="crs-gallery">
          {images.map(src => <ZoomableImage key={src} src={src} alt="Criação da The Tropical Bakery" thumbWidth={384} />)}
        </div>
      </div>
    </section>
  );
}
