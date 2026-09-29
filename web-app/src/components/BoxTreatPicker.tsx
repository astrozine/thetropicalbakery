'use client';

import React, { useState } from 'react';
import type { BoxItem } from '@/lib/allergens';
import type { BoxPlan } from '@/lib/boxPicks';
import { optimizedSrc } from '@/lib/thumbs';

interface Props {
  /** This week's treats (tasting_boxes.items). */
  items: BoxItem[];
  plan: BoxPlan;
  /** Picked BoxItem ids, in the order they were picked. The same id may appear twice. */
  picks: string[];
  onChange: (picks: string[]) => void;
  /** Outline the picker when the customer tried to continue with picks missing. */
  attention?: boolean;
  /** "Deixa a Dolly escolher": shows the dice button. While on, the pick slots show dice and nothing needs choosing. */
  surprise?: boolean;
  onSurprise?: (on: boolean) => void;
  /** The small line above the title. */
  kicker?: string;
}

/**
 * "O que vai na sua caixa": the box drawn as a tray of slots (2 = 2×1, 4 = 2×2, 6 = 3×2, the same
 * layout as the dots on the size cards). The week's treats sit in solid gold slots; the ones the
 * customer chooses go in dashed slots. Tap a treat card to put it in, tap a slot to take it out.
 * Or roll the dice and Dolly chooses (the parent keeps that flag; picking a treat turns it off).
 */
export default function BoxTreatPicker({ items, plan, picks, onChange, attention, surprise = false, onSurprise, kicker = 'O que vai na sua caixa' }: Props) {
  const [full, setFull] = useState(false);
  const size = plan.fixed + plan.picks;
  const byId = new Map(items.map(i => [i.id, i]));
  const left = surprise ? 0 : plan.picks - picks.length;

  const add = (id: string) => {
    if (surprise) { setFull(false); onChange([id]); return; } // changed their mind: start choosing
    if (left > 0) { setFull(false); onChange([...picks, id]); return; }
    if (plan.picks === 1) { onChange([id]); return; } // one choice: just swap it
    setFull(true);
  };
  const removeAt = (i: number) => { setFull(false); onChange(picks.filter((_, j) => j !== i)); };

  const title = plan.picks === 0 ? 'A caixa completa'
    : plan.fixed === 0 ? `Escolha ${plan.picks === 1 ? 'o seu favorito' : `seus ${plan.picks} favoritos`}`
    : `A completa + ${plan.picks} favoritos`;
  const sub = plan.picks === 0 ? `Um de cada dos ${plan.fixed} doces desta semana.`
    : plan.fixed === 0 ? 'Toque nos doces abaixo para colocar na caixa. Pode repetir o mesmo.'
    : `Os ${plan.fixed} doces da semana, e mais ${plan.picks} que você escolhe abaixo. Pode repetir o seu preferido.`;

  const photo = (item: BoxItem | undefined, w: 256 | 384) =>
    item?.image_url
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={optimizedSrc(item.image_url, w)} alt="" loading="lazy" decoding="async" />
      : <span className="btp-emoji" aria-hidden>{item?.emoji || '🍫'}</span>;

  return (
    <div className={`btp${attention && left > 0 ? ' btp-attn' : ''}`}>
      <style>{`
        .btp { background: #fdf7ee; border: 2px solid #e8e1d7; border-radius: 20px; padding: 1.1rem; color: #3c2a21; transition: border-color 0.2s; }
        .btp-attn { border-color: #c0392b; }
        .btp-kicker { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 800; color: #a8862a; margin: 0 0 0.2rem; }
        .btp-title { font-family: var(--font-heading); font-size: 1.4rem; line-height: 1.15; margin: 0 0 0.3rem; }
        .btp-sub { font-size: 0.92rem; color: #594a42; line-height: 1.5; margin: 0 0 1rem; }
        .btp-tray { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 0.5rem; max-width: 300px; margin: 0 auto;
          padding: 0.6rem; background: #efe0c4; border-radius: 16px; box-shadow: inset 0 2px 8px rgba(60,42,33,0.18); }
        .btp-tray.btp-shake { animation: btp-shake 0.35s; }
        .btp-slot { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;
          background: #fff; border: 2px solid #d4af37; padding: 0; font: inherit; color: inherit; }
        .btp-slot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .btp-slot .btp-emoji { font-size: 1.8rem; }
        .btp-slot-empty { background: rgba(255,255,255,0.55); border: 2px dashed #c9a43a; color: #a8862a; font-size: 1.6rem; font-weight: 300; }
        .btp-slot-pick { cursor: pointer; animation: btp-pop 0.25s ease-out; }
        .btp-slot-pick:focus-visible { outline: 3px solid #3c2a21; outline-offset: 2px; }
        .btp-x { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(60,42,33,0.85); color: #fff;
          font-size: 0.75rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .btp-lock { position: absolute; bottom: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: #d4af37; color: #fff;
          font-size: 0.75rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .btp-legend { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.4rem 1rem; margin-top: 0.6rem; font-size: 0.78rem; color: #594a42; }
        .btp-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 4px; vertical-align: -1px; margin-right: 0.35rem; }
        .btp-status { text-align: center; font-weight: 700; font-size: 0.92rem; margin: 0.8rem 0 0; min-height: 1.4em; }
        .btp-done { color: #2e7d4f; }
        .btp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin-top: 0.9rem; }
        .btp-card { position: relative; display: flex; flex-direction: column; text-align: left; padding: 0; background: #fff; border: 2px solid #e8e1d7;
          border-radius: 14px; overflow: hidden; cursor: pointer; font: inherit; color: #3c2a21; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
        .btp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(60,42,33,0.1); }
        .btp-card:focus-visible { outline: 3px solid #d4af37; outline-offset: 2px; }
        .btp-card[data-on="true"] { border-color: #d4af37; box-shadow: 0 8px 20px rgba(212,175,55,0.3); }
        .btp-card-ph { position: relative; width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #f5efe2; display: flex; align-items: center; justify-content: center; }
        .btp-card-ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .btp-card-ph .btp-emoji { font-size: 2.2rem; }
        .btp-card-name { padding: 0.5rem 0.6rem 0.6rem; font-weight: 700; font-size: 0.88rem; line-height: 1.25; }
        .btp-card-add { position: absolute; top: 6px; right: 6px; min-width: 28px; height: 28px; padding: 0 6px; border-radius: 999px; background: #fff;
          color: #3c2a21; font-weight: 900; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.18); }
        .btp-card[data-on="true"] .btp-card-add { background: #d4af37; color: #fff; }
.btp-slot-dice { font-size: 1.7rem; background: #fff8e6; }
        .btp-dice { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; min-height: 44px; margin-top: 0.7rem;
          padding: 0.6rem 1rem; border-radius: 999px; border: 2px dashed #c9a43a; background: #fff; color: #3c2a21; font: inherit;
          font-weight: 700; font-size: 0.92rem; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .btp-dice:hover .btp-dice-icon { transform: rotate(-20deg) scale(1.15); }
        .btp-dice-icon { font-size: 1.3rem; display: inline-block; transition: transform 0.2s; }
        .btp-dice[aria-pressed="true"] { background: #d4af37; border-style: solid; border-color: #d4af37; color: #fff; }
        .btp-dice:focus-visible { outline: 3px solid #3c2a21; outline-offset: 2px; }
        @keyframes btp-pop { 0% { transform: scale(0.6); } 70% { transform: scale(1.06); } 100% { transform: scale(1); } }
        @keyframes btp-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        @media (prefers-reduced-motion: reduce) { .btp-slot-pick, .btp-tray.btp-shake { animation: none; } .btp-card { transition: none; } .btp-card:hover { transform: none; } }
      `}</style>

      <p className="btp-kicker">{kicker}</p>
      <p className="btp-title">{title}</p>
      <p className="btp-sub">{sub}</p>

      <div className={`btp-tray${full ? ' btp-shake' : ''}`} style={{ ['--cols' as string]: size > 4 ? 3 : 2 }} onAnimationEnd={() => setFull(false)}>
        {items.slice(0, plan.fixed).map(item => (
          <div key={`f-${item.id}`} className="btp-slot" title={`${item.name} (da semana)`} role="img" aria-label={`${item.name} (da semana)`}>
            {photo(item, 256)}
            <span className="btp-lock" aria-hidden>✓</span>
          </div>
        ))}
        {Array.from({ length: plan.picks }).map((_, i) => {
          if (surprise) return <div key={`d-${i}`} className="btp-slot btp-slot-empty btp-slot-dice" aria-hidden>🎲</div>;
          const item = picks[i] ? byId.get(picks[i]) : undefined;
          if (!item) return <div key={`e-${i}`} className="btp-slot btp-slot-empty" aria-hidden>+</div>;
          return (
            <button key={`p-${i}-${item.id}`} type="button" className="btp-slot btp-slot-pick" onClick={() => removeAt(i)} aria-label={`Tirar ${item.name} da caixa`} title={`Tirar ${item.name}`}>
              {photo(item, 256)}
              <span className="btp-x" aria-hidden>✕</span>
            </button>
          );
        })}
      </div>

      {plan.fixed > 0 && plan.picks > 0 && (
        <div className="btp-legend" aria-hidden>
          <span><i style={{ background: '#fff', border: '2px solid #d4af37' }} />da semana</span>
          <span><i style={{ border: '2px dashed #c9a43a' }} />você escolhe</span>
        </div>
      )}

      {plan.picks > 0 && (
        <>
          <p className={`btp-status${left === 0 ? ' btp-done' : ''}`} aria-live="polite">
            {surprise ? `A Dolly escolhe ${plan.picks === 1 ? 'o seu' : `os seus ${plan.picks}`} 🎲 Mudou de ideia? Toque num doce.`
              : full ? 'Caixa cheia! Toque num doce da caixa para trocar.'
              : left === 0 ? 'Pronto, sua caixa está montada ✓'
              : picks.length === 0 ? `Toque em ${plan.picks === 1 ? 'um doce' : `${plan.picks} doces`} 👇`
              : `Falta${left > 1 ? 'm' : ''} ${left}`}
          </p>
          {onSurprise && (
            <button type="button" className="btp-dice" aria-pressed={surprise} onClick={() => { setFull(false); onSurprise(!surprise); }}>
              <span aria-hidden className="btp-dice-icon">🎲</span>
              {surprise ? 'A Dolly escolhe ✓' : 'Não sabe? Deixa a Dolly escolher'}
            </button>
          )}
          <div className="btp-grid">
            {items.map(item => {
              const n = picks.filter(p => p === item.id).length;
              return (
                <button key={item.id} type="button" className="btp-card" data-on={n > 0} onClick={() => add(item.id)}
                  aria-label={`Colocar ${item.name} na caixa${n ? ` (já tem ${n})` : ''}`}>
                  <span className="btp-card-ph">{photo(item, 384)}</span>
                  <span className="btp-card-name">{item.emoji ? `${item.emoji} ` : ''}{item.name}</span>
                  <span className="btp-card-add" aria-hidden>{n === 0 ? '+' : n > 1 ? `×${n}` : '✓'}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
