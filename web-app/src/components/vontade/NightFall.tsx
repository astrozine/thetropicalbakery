'use client';

import { useEffect, useState } from 'react';

/** Fixed star field (same on server and client, so no hydration mismatch). */
const STARS = Array.from({ length: 48 }, (_, i) => {
  const r = (n: number) => { const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return Math.round((v - Math.floor(v)) * 1000) / 1000; };
  const f = (v: number) => Math.round(v * 10) / 10;
  return { x: f(r(1) * 100), y: f(35 + r(2) * 65), s: f(1 + r(3) * 2.4), d: f(1.1 + r(4) * 1.1), t: f(1.4 + r(5) * 1.2) };
});

/**
 * The /vontade load intro: the day sky falls through sunset into night while stars rise (vontade.css, "nightfall").
 * Pure CSS motion; this only removes the layer once it has faded.
 */
export default function NightFall() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 3600); return () => clearTimeout(t); }, []);
  if (!on) return null;
  return (
    <div className="va-night" aria-hidden>
      <div className="va-night__sky" />
      <div className="va-night__sun" />
      <div className="va-night__palms" />
      {STARS.map((s, i) => (
        <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.s}px`, height: `${s.s}px`, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />
      ))}
    </div>
  );
}
