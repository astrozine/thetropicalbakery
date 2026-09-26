'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { optimizedSrc } from '@/lib/thumbs';

/**
 * Treat photos hanging in the empty space beside something narrow (a calendar, a short form),
 * tilted like snapshots. They only appear when there is really room beside the content, they
 * never take clicks, and screen readers skip them. Nothing changes on laptops and phones.
 *
 * The photos come from the live menu, so new treats show up here by themselves.
 */

const COL = 190;   // width of each photo column
const GAP = 28;    // between the content and the photos

interface Spot { top: number; side: number; rot: number; w: number }

// [top %, distance from the content's edge px, rotation deg, photo width px]
const LEFT: Spot[] = [
  { top: 2, side: 4, rot: -4, w: 168 },
  { top: 37, side: 34, rot: 3, w: 148 },
  { top: 70, side: 6, rot: -5, w: 166 },
];
const RIGHT: Spot[] = [
  { top: 8, side: 30, rot: 4, w: 150 },
  { top: 42, side: 4, rot: -3, w: 170 },
  { top: 75, side: 32, rot: 5, w: 152 },
];

interface Photo { src: string; name: string }

// One fetch per page, however many flanks are on it.
let cache: Promise<Photo[]> | null = null;
const loadPhotos = () => {
  if (!cache) {
    cache = Promise.resolve(
      supabase.from('treats').select('name, image_url').eq('is_available', true).not('image_url', 'is', null).order('name'),
    ).then(({ data }) => ((data ?? []) as { name: string; image_url: string }[]).map(t => ({ src: t.image_url, name: t.name })))
      .catch(() => []);
  }
  return cache;
};

interface Props {
  /** Width of the content the photos hang beside, in px (decides when there is room for them). */
  contentWidth: number;
  /** 'both' hangs photos on each side; 'right'/'left' only that side. */
  sides?: 'both' | 'left' | 'right';
  children: React.ReactNode;
}

export default function TreatFlank({ contentWidth, sides = 'both', children }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const both = sides === 'both';
  const showAt = contentWidth + 2 * (COL + GAP) + 48;
  const id = React.useId().replace(/:/g, '');

  useEffect(() => {
    // Only fetch where the photos can actually be seen.
    if (!window.matchMedia(`(min-width: ${showAt}px)`).matches) return;
    let alive = true;
    loadPhotos().then(list => { if (alive) setPhotos(list); });
    return () => { alive = false; };
  }, [showAt]);

  // Spread picks through the menu so the six are not all the same kind of sweet; each side starts elsewhere.
  const pick = (spots: Spot[], from: number) => {
    if (!photos.length) return [];
    const step = Math.max(1, Math.floor(photos.length / (spots.length * (both ? 2 : 1))));
    return spots.map((_, i) => photos[(from + i * step) % photos.length]);
  };
  const left = pick(LEFT, 1);
  const right = pick(RIGHT, both ? 1 + Math.floor(photos.length / 2) : 4);

  const column = (spots: Spot[], list: Photo[], side: 'left' | 'right') => (
    <div className={`tf-col tf-${side}-${id}`} aria-hidden>
      {list.map((p, i) => {
        const s = spots[i];
        return (
          <figure key={p.src} className="tf-photo" style={{ top: `${s.top}%`, [side === 'left' ? 'right' : 'left']: `${s.side}px`, width: `${s.w}px`, transform: `rotate(${s.rot}deg)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={optimizedSrc(p.src, 384)} alt="" loading="lazy" decoding="async" />
            <figcaption>{p.name}</figcaption>
          </figure>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .tf-col { display: none; }
        @media (min-width: ${showAt}px) {
          .tf-col { display: block; position: absolute; top: 0; bottom: 0; width: ${COL}px; pointer-events: none; }
          .tf-left-${id} { right: calc(100% + ${GAP}px); }
          .tf-right-${id} { left: calc(100% + ${GAP}px); }
        }
        .tf-photo { position: absolute; margin: 0; background: #fff; padding: 7px 7px 0; border-radius: 12px; box-shadow: 0 12px 28px rgba(60,42,33,0.16); }
        .tf-photo img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
        .tf-photo figcaption { padding: 0.35rem 0.2rem 0.5rem; font-size: 0.74rem; line-height: 1.25; text-align: center; color: #6b5a4e; }
        @media print { .tf-col { display: none !important; } }
      `}</style>
      {sides !== 'right' && column(LEFT, left, 'left')}
      {sides !== 'left' && column(RIGHT, right, 'right')}
      {children}
    </div>
  );
}
