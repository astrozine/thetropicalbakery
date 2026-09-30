'use client';

import React from 'react';
import Link from 'next/link';
import { STAMPS_PER_REWARD, STAMP_REWARD } from '@/lib/loyalty';

const MARKS = ['🍍', '🥭', '🥥', '🍫', '🌺', '🍓'];
const TILTS = [-12, 8, -4, 14, -9, 5];

/**
 * A kraft-paper loyalty card. One stamp per paid box; a full card earns the
 * reward in loyalty.ts. `paidBoxes` is null while the database function
 * (migration 30) isn't there yet: the card then just explains how it works.
 */
export default function StampCard({ paidBoxes }: { paidBoxes: number | null }) {
  const total = paidBoxes ?? 0;
  const cards = Math.floor(total / STAMPS_PER_REWARD);
  const onCard = total % STAMPS_PER_REWARD;
  const left = STAMPS_PER_REWARD - onCard;

  return (
    <section className="acct-stamps" aria-label="Cartão fidelidade">
      <div className="acct-stamps-head">
        <div>
          <p className="acct-kicker">Cartão fidelidade</p>
          <h2 className="acct-h2">Cada caixa, um carimbo</h2>
        </div>
        <span className="acct-stamps-count" aria-label={`${onCard} de ${STAMPS_PER_REWARD} carimbos`}>
          {onCard}<small>/{STAMPS_PER_REWARD}</small>
        </span>
      </div>

      <ol className="acct-stamp-row">
        {Array.from({ length: STAMPS_PER_REWARD }, (_, i) => {
          const filled = i < onCard;
          const isNext = i === onCard;
          const last = i === STAMPS_PER_REWARD - 1;
          return (
            <li
              key={i}
              className={`acct-stamp${filled ? ' is-filled' : ''}${isNext ? ' is-next' : ''}${last ? ' is-gift' : ''}`}
              style={filled ? { transform: `rotate(${TILTS[i % TILTS.length]}deg)`, animationDelay: `${i * 90}ms` } : undefined}
            >
              {filled ? MARKS[i % MARKS.length] : last ? '🎁' : i + 1}
            </li>
          );
        })}
      </ol>

      <p className="acct-stamps-line">
        {paidBoxes === null
          ? <>Toda caixa paga ganha um carimbo. Com {STAMPS_PER_REWARD} carimbos você ganha <strong>{STAMP_REWARD}</strong>.</>
          : onCard === 0 && total > 0
            ? <>Cartão completo! 🎉 Você ganhou <strong>{STAMP_REWARD}</strong>. Um novo cartão já começou.</>
            : <>{left === 1 ? 'Falta só 1 caixa' : `Faltam ${left} caixas`} para <strong>{STAMP_REWARD}</strong>.</>}
        {cards > 0 && onCard !== 0 && <> Você já completou {cards} {cards === 1 ? 'cartão' : 'cartões'} 💛</>}
      </p>

      <Link href="/caixas" className="acct-btn acct-btn-dark">Ganhar o próximo carimbo</Link>
    </section>
  );
}
