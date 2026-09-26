'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * The homepage "Destaques Anteriores" row. On desktop it is the usual grid; on a
 * phone it is a swipeable rail (see .tb-rail in globals.css) with dots and a
 * hint underneath, so nobody has to guess that it moves sideways.
 */
export default function HighlightsRail({ children }: { children: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = React.Children.count(children);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => {
      const kids = Array.from(rail.children) as HTMLElement[];
      if (kids.length === 0) return;
      // The card whose left edge is closest to the rail's left edge is "current".
      let best = 0;
      let bestDist = Infinity;
      kids.forEach((k, i) => {
        const d = Math.abs(k.offsetLeft - rail.scrollLeft - kids[0].offsetLeft);
        if (d < bestDist) { best = i; bestDist = d; }
      });
      // At the very end the last card can't reach the left edge, so pin it.
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4) best = kids.length - 1;
      setActive(best);
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
    return () => rail.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (i: number) => {
    const rail = railRef.current;
    const kid = rail?.children[i] as HTMLElement | undefined;
    if (!rail || !kid) return;
    const first = rail.children[0] as HTMLElement;
    rail.scrollTo({ left: kid.offsetLeft - first.offsetLeft, behavior: 'smooth' });
  };

  return (
    <div className="tb-rail-wrap">
      <div className="menu-grid tb-rail tb-highlights-rail" ref={railRef}>
        {children}
      </div>
      {count > 1 && (
        <div className="tb-rail-nav" aria-hidden="false">
          <div className="tb-rail-dots" role="tablist" aria-label="Destaques">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Ir para o destaque ${i + 1}`}
                className={i === active ? 'is-active' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <p className="tb-rail-hint">Deslize para ver mais <span aria-hidden="true">→</span></p>
        </div>
      )}
    </div>
  );
}
