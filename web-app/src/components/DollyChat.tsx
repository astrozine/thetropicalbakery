'use client';

import React, { useEffect, useState } from 'react';
import './dollyChat.css';

/**
 * Dolly talking to you, like a chat: her photo with the green "online" dot, "digitando…", then her messages
 * arrive one at a time. Used wherever a person needs a push (the craving app first, any page of the site after).
 *
 * Rules for what she says: short messages (one idea each, 2 or 3 per spot), warm and in the first person,
 * encouraging and TRUE. Never a story about herself she did not tell, never a promise the page can't keep.
 *
 * Plays once per mount; with reduced motion, everything shows at once.
 */
export default function DollyChat({ lines, small, className }: { lines: string[]; small?: boolean; className?: string }) {
  const key = lines.join('\n');
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const all = key.split('\n');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(all.length); setTyping(false); return; }
    setShown(0); setTyping(true);
    const timers: number[] = [];
    let at = 0;
    all.forEach((line, i) => {
      // A beat to "type" each message: longer messages take a little longer, never more than 1.6 s.
      at += i === 0 ? 650 : Math.min(1600, 500 + line.length * 16);
      timers.push(window.setTimeout(() => { setShown(i + 1); setTyping(i + 1 < all.length); }, at));
    });
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [key]);

  return (
    <div className={`dc${small ? ' dc--sm' : ''}${className ? ` ${className}` : ''}`}>
      <span className="dc__avatar">
        <img src="/vontade/dolly-avatar.webp" alt="" width={small ? 40 : 48} height={small ? 40 : 48} />
        <i aria-hidden />
      </span>
      <div className="dc__col" aria-live="polite">
        <span className="dc__name">Dolly <small>{typing ? 'digitando…' : 'online'}</small></span>
        {lines.slice(0, shown).map((l, i) => <p key={i} className="dc__msg">{l}</p>)}
        {typing && <p className="dc__msg dc__typing" aria-label="Dolly está digitando"><i /><i /><i /></p>}
      </div>
    </div>
  );
}
