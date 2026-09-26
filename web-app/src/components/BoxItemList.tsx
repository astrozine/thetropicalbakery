'use client';

import React from 'react';

/**
 * A box description is typed as one run of text ("1. Tartelete… 2. Blissball… 3. …") or as lines.
 * When it is really a list, return the pieces; otherwise null and the text is shown as it is.
 */
export function parseBoxItems(text: string): { intro: string; items: string[] } | null {
  const clean = (text || '').trim();
  if (!clean) return null;

  // "1. … 2. … 3. …"
  const parts = clean.split(/\s+(?=\d+\.\s)/).map(p => p.trim()).filter(Boolean);
  const firstIsItem = /^1\.\s/.test(parts[0] ?? '');
  const rest = [...parts];
  const intro = firstIsItem ? '' : (rest.shift() ?? '');
  if (rest.length >= 2) {
    const items: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      const m = /^(\d+)\.\s+([\s\S]*)$/.exec(rest[i]);
      if (!m || Number(m[1]) !== i + 1) { items.length = 0; break; }
      items.push(m[2].trim());
    }
    if (items.length >= 2) return { intro, items };
  }

  // One item per line ("- x", "• x", "✦ x" or plain lines)
  const lines = clean.split(/\n+/).map(l => l.replace(/^\s*(?:[-–•*✦]|\d+[.)])\s*/, '').trim()).filter(Boolean);
  if (lines.length >= 3) return { intro: '', items: lines };
  return null;
}

/**
 * The treats in a box, each on its own row with a glowing gold ✦ (the same star used across the site).
 * `dark` for the photo hero, `light` for white cards.
 */
export default function BoxItemList({ description, tone = 'dark' }: { description: string; tone?: 'dark' | 'light' }) {
  const parsed = parseBoxItems(description);
  const dark = tone === 'dark';

  if (!parsed) {
    return <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: dark ? 'rgba(253,250,243,0.9)' : '#594a42', margin: 0 }}>{description}</p>;
  }

  return (
    <div className={`bil bil-${tone}`}>
      <style>{`
        .bil-intro { margin: 0 0 1rem; font-size: 1.05rem; line-height: 1.7; }
        .bil ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.65rem; }
        .bil li { display: flex; align-items: flex-start; gap: 0.9rem; text-align: left; padding: 0.85rem 1.1rem 0.85rem 0.9rem; border-radius: 18px;
          font-size: 1.02rem; line-height: 1.55; animation: bil-rise 0.6s both; animation-delay: calc(var(--i) * 0.09s); transition: transform 0.2s, border-color 0.2s; }
        .bil li:hover { transform: translateX(4px); }
        .bil-star { flex-shrink: 0; width: 2.1rem; height: 2.1rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
          font-size: 1.15rem; line-height: 1; animation: bil-twinkle 3.2s ease-in-out infinite; animation-delay: calc(var(--i) * 0.45s); }
        .bil-dark .bil-intro { color: rgba(253, 250, 243, 0.9); }
        .bil-dark li { color: rgba(253, 250, 243, 0.96); background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(244, 214, 117, 0.3); backdrop-filter: blur(6px); }
        .bil-dark li:hover { border-color: rgba(244, 214, 117, 0.7); }
        .bil-dark .bil-star { background: rgba(244, 214, 117, 0.16); color: #f4d675; text-shadow: 0 0 12px rgba(244, 214, 117, 0.9); }
        .bil-light .bil-intro { color: #594a42; }
        .bil-light li { color: #594a42; background: #fffaf0; border: 1px solid #f0e2bf; }
        .bil-light li:hover { border-color: #d4af37; }
        .bil-light .bil-star { background: #fdf1d6; color: #d4a017; text-shadow: 0 0 10px rgba(212, 175, 55, 0.55); }
        @keyframes bil-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes bil-twinkle { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.18) rotate(18deg); } }
        @media (prefers-reduced-motion: reduce) { .bil li, .bil-star { animation: none; } }
      `}</style>
      {parsed.intro && <p className="bil-intro">{parsed.intro}</p>}
      <ul>
        {parsed.items.map((item, i) => (
          <li key={i} style={{ ['--i' as string]: i }}>
            <span className="bil-star" aria-hidden>✦</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
