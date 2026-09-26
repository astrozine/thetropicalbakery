'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import menuItems from '@/data/menu.json';
import { thumb } from '@/lib/thumbs';

/**
 * Pages where the events strip earns its place: people browsing, and events are a natural next
 * thought. Everywhere else (checkout, the box and subscription pages, accounts, partner and staff
 * areas, login, privacy, admin, and the Menu de Eventos itself) the page has one job, and a big
 * tappable strip leading somewhere else pulls the visitor away from it.
 */
const SHOW_ON = (path: string) =>
  path === '/' ||
  path === '/retreats' ||
  path === '/cursos' || path.startsWith('/cursos/') ||
  path === '/b2b' || path.startsWith('/b2b/');

export default function GlobalMenuTeaser() {
  const pathname = usePathname() || '';
  const isSpanish = pathname.startsWith('/es');
  // /es/retreats and /en/retreats follow the same rule as /retreats.
  const bare = pathname.replace(/^\/(es|en)(?=\/|$)/, '') || '/';

  const trackRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  // Only animate while the strip is on screen: an endless animation nobody is looking at still costs battery.
  const visible = SHOW_ON(bare);
  useEffect(() => {
    const el = trackRef.current;
    if (!visible || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  if (!visible) return null;

  // Take the first 10 items for the teaser
  const teaserItems = menuItems.slice(0, 10);

  const texts = {
    subtitle: isSpanish ? "Descubre Nuestras Creaciones" : "Descubra Nossas Criações",
    title: isSpanish ? "Para Eventos y Momentos Especiales" : "Para Eventos e Momentos Especiais",
    description: isSpanish
      ? "Mira lo que ya hemos servido en nuestras Cajas Sorpresa y planea tu próximo evento."
      : "Veja o que já servimos em nossas Caixas Surpresa e planeje seu próximo evento.",
    btn: isSpanish ? "Ver Menú Completo" : "Ver Menu Completo",
  };

  return (
    <section className="events-teaser">
      <span className="events-teaser__eyebrow">{texts.subtitle}</span>
      <h2 className="events-teaser__title">{texts.title}</h2>
      <p className="events-teaser__text">{texts.description}</p>

      {/* Scrolling Gallery */}
      <div ref={trackRef} className="events-teaser__track" style={{ animationPlayState: running ? 'running' : 'paused' }}>
        {/* Double the array for seamless infinite scrolling */}
        {[...teaserItems, ...teaserItems].map((item, idx) => (
          <Link
            href={isSpanish ? "/es/menu" : "/menu"}
            key={idx}
            className="events-teaser__item"
            aria-hidden={idx >= teaserItems.length ? true : undefined}
            tabIndex={idx >= teaserItems.length ? -1 : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb(item.image)}
              alt={idx >= teaserItems.length ? '' : item.name}
              loading="lazy"
              decoding="async"
            />
          </Link>
        ))}
      </div>

      <div className="events-teaser__cta">
        <Link href={isSpanish ? "/es/menu" : "/menu"} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
          {texts.btn}
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .events-teaser { padding: 4rem 0; background: var(--color-background); border-top: 1px solid rgba(212,175,55,0.2); text-align: center; overflow: hidden; }
        .events-teaser__eyebrow { color: #d4af37; letter-spacing: 3px; text-transform: uppercase; font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 1rem; }
        .events-teaser__title { font-size: clamp(2rem, 4vw, 3rem); font-family: var(--font-heading); color: var(--color-primary); margin-bottom: 1rem; padding: 0 1rem; }
        .events-teaser__text { font-size: 1.1rem; color: #594a42; margin-bottom: 3rem; padding: 0 1rem; }
        .events-teaser__track { display: flex; width: max-content; animation: scrollGallery 40s linear infinite; }
        .events-teaser__item { width: clamp(200px, 20vw, 280px); height: clamp(200px, 20vw, 280px); margin: 0 1rem; flex-shrink: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: block; }
        .events-teaser__item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
        .events-teaser__item:hover img { transform: scale(1.05); }
        .events-teaser__cta { margin-top: 3rem; }
        @keyframes scrollGallery {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Phones: a slim strip. Shorter heading area, smaller photos, no long paragraph. */
        @media (max-width: 767px) {
          .events-teaser { padding: 2rem 0 1.75rem; }
          .events-teaser__eyebrow { margin-bottom: 0.5rem; }
          .events-teaser__title { font-size: 1.5rem; margin-bottom: 1.1rem; }
          .events-teaser__text { display: none; }
          .events-teaser__item { width: 132px; height: 132px; margin: 0 0.4rem; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.1); }
          .events-teaser__cta { margin-top: 1.4rem; }
          .events-teaser__cta .btn { padding: 0.85rem 2rem !important; font-size: 1rem !important; }
        }
        @media (prefers-reduced-motion: reduce) { .events-teaser__track { animation: none; } }
      `}} />
    </section>
  );
}
