'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { optimizedSrc } from '@/lib/thumbs';

export interface PickableTreat {
  id: string;
  name: string;
  image_url: string | null;
  /** Only when the picker loaded them itself: what "order now" needs to fill the cart. */
  price?: number;
  min_batch_size?: number;
  batch_multiplier?: number;
}

interface Props {
  /** Big line above the photos. */
  title: string;
  /** One short line of instruction. Keep it to a breath. */
  subtitle?: string;
  /** How many photos before the "show me more" button. */
  initial?: number;
  /** Text on the action that appears once something is chosen. */
  ctaLabel: string;
  /** Given the chosen names, where does the button take them. */
  onAction: (chosen: PickableTreat[]) => void;
  /** Supply the treats instead of letting the picker load them. */
  treats?: PickableTreat[];
  /** Hero use: bigger photos, tighter copy. */
  hero?: boolean;
}

/**
 * Pick-the-photos.
 *
 * This is the one interaction on the site people actually enjoy on a phone, and
 * it is worth understanding why, because the rest of the page is the opposite:
 *
 *   · it asks for a tap, not for reading
 *   · every tap answers instantly — a ring, a tick, a small pop
 *   · there is no wrong answer, so there is nothing to be careful about
 *   · the tally underneath grows, and what grows starts to feel like yours
 *
 * By the time someone has tapped four treats they have already decided they want
 * something; the button below only has to catch a decision that is already made.
 * So the action stays hidden until the first tap, then slides up and follows them.
 */
export default function TreatPicker({
  title, subtitle, initial = 8, ctaLabel, onAction, treats: given, hero = false,
}: Props) {
  const [loaded, setLoaded] = useState<PickableTreat[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [pop, setPop] = useState<string | null>(null);

  useEffect(() => {
    if (given) return;
    supabase.from('treats').select('id, name, image_url, price, min_batch_size, batch_multiplier').eq('is_available', true).order('name')
      .then(({ data }) => setLoaded((data as PickableTreat[]) || []));
  }, [given]);

  const treats = given ?? loaded;
  const visible = showAll ? treats : treats.slice(0, initial);
  const chosen = useMemo(() => treats.filter(t => picked.includes(t.id)), [treats, picked]);

  const toggle = (id: string) => {
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
    // A tiny bounce confirms the tap even before you read the tick.
    setPop(id);
    setTimeout(() => setPop(cur => (cur === id ? null : cur)), 260);
  };

  if (!treats.length) return null;

  return (
    <section className={`tp${hero ? ' tp--hero' : ''}`} aria-label={title}>
      <h2 className="tp__title">{title}</h2>
      {subtitle && <p className="tp__sub">{subtitle}</p>}

      <div className="tp__grid">
        {visible.map(t => {
          const on = picked.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              aria-label={t.name}
              onClick={() => toggle(t.id)}
              className={`tp__card${on ? ' is-on' : ''}${pop === t.id ? ' is-pop' : ''}`}
            >
              <span className="tp__photo">
                {t.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={optimizedSrc(t.image_url, 384)} alt="" loading="lazy" decoding="async" />
                )}
              </span>
              <span className="tp__name">{t.name}</span>
              <span aria-hidden className="tp__tick">✓</span>
            </button>
          );
        })}
      </div>

      {!showAll && treats.length > initial && (
        <button type="button" className="tp__more" onClick={() => setShowAll(true)}>
          Ver os outros {treats.length - initial} doces
        </button>
      )}

      {/* Appears on the first tap and rides along from then on. */}
      <div className="tp__bar" data-on={chosen.length > 0 ? 'true' : 'false'}>
        <span className="tp__count">
          <strong>{chosen.length}</strong>
          {chosen.length === 1 ? ' doce escolhido' : ' doces escolhidos'}
        </span>
        <button type="button" className="tp__go" onClick={() => onAction(chosen)}>{ctaLabel}</button>
      </div>

      <style>{`
        .tp { --gap: 0.6rem; }
        .tp__title {
          font-family: var(--font-heading);
          font-size: clamp(1.45rem, 5.2vw, 2.4rem);
          line-height: 1.12; color: #3c2a21; margin: 0 0 0.4rem;
        }
        .tp__sub { color: #7a6a61; font-size: 0.95rem; line-height: 1.55; margin: 0 0 1.1rem; }
        .tp__grid {
          display: grid; gap: var(--gap);
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
        .tp__card {
          position: relative; padding: 0; border-radius: 16px; overflow: hidden; cursor: pointer;
          background: #fff; border: 2px solid #e8e1d7; font-family: inherit; text-align: center;
          transition: border-color .18s, box-shadow .18s, transform .18s;
          -webkit-tap-highlight-color: transparent;
        }
        .tp__card.is-on { border-color: #d4af37; box-shadow: 0 8px 22px rgba(212,175,55,0.38); }
        .tp__card.is-pop { transform: scale(0.955); }
        .tp__card:active { transform: scale(0.97); }
        .tp__photo { display: block; aspect-ratio: 1; background: #f5efe2; }
        .tp__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tp__name {
          display: block; padding: 0.45rem 0.45rem 0.55rem; font-size: 0.85rem; line-height: 1.25;
          color: #3c2a21; font-weight: 500; overflow-wrap: break-word;
        }
        .tp__card.is-on .tp__name { font-weight: 800; }
        .tp__tick {
          position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%;
          background: #d4af37; color: #3c2a21; font-weight: 900; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.28);
          transform: scale(0); transition: transform .22s cubic-bezier(.34,1.56,.64,1);
        }
        .tp__card.is-on .tp__tick { transform: scale(1); }
        .tp__more {
          display: block; width: 100%; margin-top: 0.9rem; padding: 0.9rem 1rem; min-height: 48px;
          border: 1px dashed #d4af37; border-radius: 14px; background: rgba(212,175,55,0.08);
          color: #8a6d1f; font-family: inherit; font-weight: 700; font-size: 0.95rem; cursor: pointer;
        }

        /* The action: inline on a desktop, a bar under the thumb on a phone. */
        .tp__bar {
          display: flex; align-items: center; gap: 0.75rem; flex-wrap: nowrap;
          margin-top: 1.1rem; padding: 0.85rem 1rem; border-radius: 16px;
          background: #3c2a21; color: #fdfaf3;
          transition: opacity .25s, transform .25s;
        }
        .tp__bar[data-on="false"] { opacity: 0; transform: translateY(8px); pointer-events: none; height: 0; margin: 0; padding: 0; overflow: hidden; }
        .tp__count { font-size: 0.95rem; flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tp__count strong { font-family: var(--font-heading); font-size: 1.35rem; color: #ffd166; margin-right: 0.15rem; }
        .tp__go {
          flex-shrink: 0; margin-left: auto; min-height: 48px; padding: 0 1.5rem; border: none; border-radius: 999px;
          background: linear-gradient(135deg, #f4c542, #d4af37); color: #3c2a21;
          font-family: inherit; font-weight: 800; font-size: 1rem; cursor: pointer; white-space: nowrap;
        }
        .tp__go:active { transform: scale(0.97); }

        @media (max-width: 767px) {
          .tp__grid { grid-template-columns: 1fr 1fr; gap: 0.55rem; }
          .tp--hero .tp__title { font-size: 1.6rem; }
          .tp__name { font-size: 0.82rem; }
          /* Under the thumb, above the tab bar, from the first tap onward. */
          .tp__bar {
            position: fixed; left: 0.6rem; right: 0.6rem;
            bottom: calc(74px + env(safe-area-inset-bottom, 0px));
            z-index: 998; margin: 0; border-radius: 999px; padding: 0.5rem 0.5rem 0.5rem 1.1rem;
            box-shadow: 0 10px 30px rgba(60,42,33,0.42);
            flex-wrap: nowrap;
          }
          .tp__bar[data-on="false"] { transform: translateY(200%); opacity: 0; height: auto; padding: 0.5rem 0.5rem 0.5rem 1.1rem; }
          .tp__count { font-size: 0.85rem; }
          .tp__go { padding: 0 1.2rem; font-size: 0.9rem; min-height: 44px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tp__card, .tp__tick, .tp__bar { transition: none; }
          .tp__card.is-pop { transform: none; }
        }
      `}</style>
    </section>
  );
}
