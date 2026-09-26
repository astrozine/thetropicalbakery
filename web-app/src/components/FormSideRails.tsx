'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { optimizedSrc } from '@/lib/thumbs';

/**
 * Wide-screen company for a slim form: a sticky rail on the left (what happens next, a live
 * summary; reassurance, never links out of a checkout) and a scatter of treat photos on the right.
 * Both only appear when there is real empty space beside the form; on laptops and phones the
 * form renders exactly as it would without this wrapper.
 */

const RAIL = 236;
const GAP = 30;

/** Where each photo sits in the right gutter: [top %, side offset px, rotation deg, width px]. */
const SPOTS: [number, number, number, number][] = [
  [3, 6, 4, 176],
  [22, 46, -5, 158],
  [42, 4, 3, 182],
  [62, 40, -4, 160],
  [81, 8, 5, 172],
];

interface Photo { src: string; caption?: string }

interface Props {
  /** Width of the form column, in px. The rails appear once the screen fits form + both rails. */
  formWidth: number;
  /** Sticky content for the left rail. Use RailCard / RailSteps. */
  rail: React.ReactNode;
  /** Photos for the right side. Omit to pull a spread of treat photos from the menu. */
  photos?: Photo[];
  children: React.ReactNode;
}

export default function FormSideRails({ formWidth, rail, photos, children }: Props) {
  const [menuPhotos, setMenuPhotos] = useState<Photo[]>([]);
  const showAt = formWidth + 2 * (RAIL + GAP) + 64;

  useEffect(() => {
    if (photos) return;
    // Only fetch where the rail can actually be seen.
    if (typeof window === 'undefined' || !window.matchMedia(`(min-width: ${showAt}px)`).matches) return;
    supabase.from('treats').select('name, image_url').eq('is_available', true).not('image_url', 'is', null).order('name')
      .then(({ data }) => {
        const list = (data ?? []) as { name: string; image_url: string }[];
        if (!list.length) return;
        const step = Math.max(1, Math.floor(list.length / SPOTS.length));
        setMenuPhotos(SPOTS.map((_, i) => list[(i * step + 2) % list.length]).map(t => ({ src: t.image_url, caption: t.name })));
      });
  }, [photos, showAt]);

  const shown = (photos ?? menuPhotos).slice(0, SPOTS.length);

  return (
    <div className="fsr" style={{ maxWidth: `${formWidth}px` }}>
      <style>{`
        .fsr { position: relative; margin: 0 auto; }
        .fsr-rail, .fsr-photos { display: none; }
        @media (min-width: ${showAt}px) {
          .fsr-rail, .fsr-photos { display: block; position: absolute; top: 0; bottom: 0; width: ${RAIL}px; }
          .fsr-rail { right: calc(100% + ${GAP}px); }
          .fsr-photos { left: calc(100% + ${GAP}px); pointer-events: none; }
          .fsr-rail-inner { position: sticky; top: 7rem; display: grid; gap: 0.9rem; }
        }
        .fsr-card { background: rgba(255,255,255,0.75); border: 1px solid #efe4c8; border-radius: 16px; padding: 1rem 1.1rem; text-align: left; }
        .fsr-card h3 { margin: 0 0 0.6rem; font-family: var(--font-body); font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: #a6832b; font-weight: 700; }
        .fsr-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
        .fsr-steps li { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 0.86rem; line-height: 1.4; color: #594a42; }
        .fsr-steps b { flex-shrink: 0; width: 1.35rem; height: 1.35rem; border-radius: 50%; background: #d4af37; color: #3c2a21; font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: center; }
        .fsr-photo { position: absolute; margin: 0; background: #fff; padding: 7px 7px 0; border-radius: 12px; box-shadow: 0 12px 28px rgba(60,42,33,0.16); }
        .fsr-photo img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
        .fsr-photo figcaption { padding: 0.35rem 0.2rem 0.5rem; font-size: 0.74rem; line-height: 1.25; text-align: center; color: #6b5a4e; }
        @media print { .fsr-rail, .fsr-photos { display: none !important; } }
      `}</style>

      <aside className="fsr-rail">
        <div className="fsr-rail-inner">{rail}</div>
      </aside>

      {shown.length > 0 && (
        <div className="fsr-photos" aria-hidden>
          {shown.map((p, i) => {
            const [top, side, rot, w] = SPOTS[i];
            return (
              <figure key={p.src} className="fsr-photo" style={{ top: `${top}%`, left: `${side}px`, width: `${w}px`, transform: `rotate(${rot}deg)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizedSrc(p.src, 384)} alt="" loading="lazy" decoding="async" />
                {p.caption && <figcaption>{p.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}

export function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fsr-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function RailSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="fsr-steps">
      {steps.map((s, i) => <li key={i}><b>{i + 1}</b><span>{s}</span></li>)}
    </ol>
  );
}
