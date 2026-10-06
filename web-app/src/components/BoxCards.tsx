'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { optimizedSrc } from '@/lib/thumbs';
import { BoxWindowFields, boxPriceText, editionIcon, editionLabel, noUpcomingEdition, sortLive } from '@/lib/boxWindow';
import type { BoxSizePrices } from '@/lib/boxSizes';
import { boxSale, useSchedule } from '@/lib/useBoxSale';
import { useBoxSizePrices } from '@/lib/useBoxSizePrices';

/**
 * Several boxes can be on sale at once (the box of the week, next week's pre-sale, and any number of
 * special editions, migration 40). These cards offer the OTHER ones: under the order form on /caixas
 * ("Também à venda") and at checkout ("Quer levar também?"), so ordering both is one tap away.
 */
export interface CardBox extends BoxWindowFields {
  id: string;
  title: string;
  image_url: string;
  fixed_price?: number | string | null;
  created_at?: string | null;
}

export function BoxCards({ boxes, prices, heading, sub, onPick }: {
  boxes: CardBox[];
  prices: BoxSizePrices;
  heading: string;
  sub?: string;
  /** On /caixas the card switches the page to that box; elsewhere it links to it. */
  onPick?: (id: string) => void;
}) {
  if (!boxes.length) return null;
  return (
    <section className="bxc" aria-label={heading}>
      <style>{`
        .bxc { max-width: 1000px; margin: 0 auto; }
        .bxc-kicker { text-align: center; color: #a6832b; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.4rem; }
        .bxc-h { text-align: center; font-family: var(--font-heading); color: #3c2a21; font-size: clamp(1.5rem, 4vw, 2.1rem); line-height: 1.15; margin: 0 0 1.25rem; }
        .bxc-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
        .bxc-card { display: flex; gap: 0.9rem; align-items: center; width: 100%; text-align: left; background: #fff; border: 1px solid #e8e1d7; border-radius: 18px; padding: 0.75rem; cursor: pointer; color: #3c2a21; text-decoration: none; box-shadow: 0 10px 24px rgba(60,42,33,0.08); transition: transform 0.2s, box-shadow 0.2s; font: inherit; }
        .bxc-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(60,42,33,0.14); }
        .bxc-card img { width: 88px; height: 88px; flex-shrink: 0; object-fit: cover; border-radius: 12px; background: #f5efe2; }
        .bxc-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .bxc-badge { align-self: flex-start; background: #fff5d6; color: #8a6d00; border-radius: 999px; padding: 0.15rem 0.6rem; font-size: 0.75rem; font-weight: 800; }
        .bxc-title { font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; }
        .bxc-meta { font-size: 0.85rem; color: #594a42; }
        .bxc-go { flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%; background: #d4af37; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; }
      `}</style>
      <p className="bxc-kicker">{boxes.length === 1 ? 'Mais uma caixa à venda' : `Mais ${boxes.length} caixas à venda`}</p>
      <h2 className="bxc-h">{heading}</h2>
      {sub && <p style={{ textAlign: 'center', color: '#594a42', margin: '-0.5rem auto 1.25rem', maxWidth: '560px', lineHeight: 1.6 }}>{sub}</p>}
      <div className="bxc-grid">
        {boxes.map(b => {
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {b.image_url ? <img src={optimizedSrc(b.image_url, 256)} alt="" loading="lazy" /> : <span style={{ fontSize: '2.5rem', width: 88, textAlign: 'center' }}>📦</span>}
              <span className="bxc-body">
                <span className="bxc-badge">{editionIcon(b)} {editionLabel(b)}</span>
                <span className="bxc-title">{b.title}</span>
                <span className="bxc-meta">
                  {boxPriceText(b, prices)}
                  {b.total_quantity > 0 ? ` · restam ${Math.max(0, b.total_quantity - b.sold_quantity)}` : ''}
                </span>
              </span>
              <span className="bxc-go" aria-hidden>→</span>
            </>
          );
          return onPick
            ? <button key={b.id} type="button" className="bxc-card" onClick={() => onPick(b.id)}>{inner}</button>
            : <Link key={b.id} className="bxc-card" href={`/caixas?caixa=${b.id}`}>{inner}</Link>;
        })}
      </div>
    </section>
  );
}

/**
 * For pages that don't load the boxes themselves (checkout): the live boxes that can be ordered now,
 * minus the ones already in the cart. Shows nothing when there are none.
 */
export function AlsoOnSale({ excludeIds, heading = 'Quer levar também?', sub }: { excludeIds: string[]; heading?: string; sub?: string }) {
  const [rows, setRows] = useState<CardBox[]>([]);
  const schedule = useSchedule();
  const prices = useBoxSizePrices();
  useEffect(() => {
    supabase.from('tasting_boxes').select('*').eq('is_active', true)
      .then(({ data }) => setRows((data as CardBox[]) || []));
  }, []);
  const key = excludeIds.join(',');
  const boxes = useMemo(() => {
    if (!schedule) return [];
    const open = (b: CardBox) => boxSale(b, schedule).state === 'open';
    return sortLive(rows.filter(b => !key.split(',').includes(b.id) && open(b)), open);
  }, [rows, schedule, key]);
  return <BoxCards boxes={boxes} prices={prices} heading={heading} sub={sub} />;
}

/** Whether a box belongs on the page at all (it can be ordered, or it sold out and carries the waiting list). */
export const showable = (sale: ReturnType<typeof boxSale>) => !noUpcomingEdition(sale.state, sale.choosable);
