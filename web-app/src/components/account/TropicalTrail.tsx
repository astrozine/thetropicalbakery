'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TRAIL, StepId } from '@/lib/loyalty';

interface Props {
  done: Record<StepId, boolean>;
  /** Lives in Itamambuca: the retreat is on their doorstep, so say so. */
  local?: boolean;
}

/**
 * "Sua trilha tropical": everything we make, as a path. Done steps are gold,
 * the next one is spotlighted with a photo and one button. Tapping any other
 * step previews it, so nothing is locked away.
 */
export default function TropicalTrail({ done, local }: Props) {
  const nextIdx = TRAIL.findIndex(s => !done[s.id]);
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked ?? (nextIdx === -1 ? TRAIL.length - 1 : nextIdx);
  const step = TRAIL[shown];
  const doneCount = TRAIL.filter(s => done[s.id]).length;
  const pitch = step.id === 'retiro' && local
    ? 'Você mora no coração de Itamambuca, a poucos passos de onde tudo nasce. Venha passar uns dias na cozinha com a Dolly.'
    : step.pitch;

  return (
    <section className="acct-trail" aria-label="Sua trilha tropical">
      <div className="acct-trail-head">
        <div>
          <p className="acct-kicker">Sua trilha tropical</p>
          <h2 className="acct-h2">
            {nextIdx === -1 ? 'Você já viveu a Tropical inteira 🌴' : 'Seu próximo passo com a gente'}
          </h2>
        </div>
        <span className="acct-trail-count">{doneCount} de {TRAIL.length}</span>
      </div>

      <ol className="acct-trail-path">
        {TRAIL.map((s, i) => {
          const isDone = done[s.id];
          const isNext = i === nextIdx;
          return (
            <li key={s.id} className="acct-trail-li">
              <button
                type="button"
                onClick={() => setPicked(i)}
                aria-pressed={i === shown}
                className={`acct-node${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}${i === shown ? ' is-shown' : ''}`}
              >
                <span className="acct-node-dot" aria-hidden>{isDone ? '✓' : s.emoji}</span>
                <span className="acct-node-label">{s.title}</span>
                {isDone && <span className="acct-node-tag">{s.doneLabel}</span>}
                {isNext && <span className="acct-node-tag is-next">Próximo</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="acct-spot" key={step.id}>
        <div className="acct-spot-img">
          <Image src={step.image} alt="" fill sizes="(min-width: 1024px) 320px, 100vw" style={{ objectFit: 'cover' }} />
        </div>
        <div className="acct-spot-body">
          <p className="acct-spot-emoji" aria-hidden>{step.emoji}</p>
          <h3 className="acct-spot-title">{step.title}</h3>
          <p className="acct-spot-pitch">{pitch}</p>
          <Link href={step.href} className="acct-btn acct-btn-gold">
            {done[step.id] && step.id === 'caixa' ? 'Pedir de novo' : step.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
