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

/** Flavour keywords (accents removed, lower case) and the emoji that says it at a glance. */
const FLAVOR_EMOJIS: { re: RegExp; emoji: string; label: string }[] = [
  { re: /chocolate branco/, emoji: '🤍', label: 'chocolate branco' },
  { re: /chocolate(?! branco)|cacau|brigadeiro/, emoji: '🍫', label: 'chocolate' },
  { re: /coco/, emoji: '🥥', label: 'coco' },
  { re: /abacaxi/, emoji: '🍍', label: 'abacaxi' },
  { re: /manga/, emoji: '🥭', label: 'manga' },
  { re: /limao|lima\b/, emoji: '🍋', label: 'limão' },
  { re: /laranja|tangerina|mexerica/, emoji: '🍊', label: 'laranja' },
  { re: /banana/, emoji: '🍌', label: 'banana' },
  { re: /morango/, emoji: '🍓', label: 'morango' },
  { re: /maracuja/, emoji: '💛', label: 'maracujá' },
  { re: /goiaba/, emoji: '🍈', label: 'goiaba' },
  { re: /uva/, emoji: '🍇', label: 'uva passa' },
  { re: /cafe|espresso/, emoji: '☕', label: 'café' },
  { re: /noz|nozes|peca\b|pecan|macadamia|avela/, emoji: '🌰', label: 'nozes' },
  { re: /castanha|caju|amendoim|pistache|amendoa/, emoji: '🥜', label: 'castanhas' },
  { re: /tamara/, emoji: '🌴', label: 'tâmara' },
  { re: /caramel|doce de leite|pudim/, emoji: '🍮', label: 'caramelo' },
  { re: /\bmel\b|geleia/, emoji: '🍯', label: 'geleia' },
  { re: /canela|especiaria|gengibre/, emoji: '🫚', label: 'especiarias' },
];

/** Up to four flavour emojis for a treat, in the order the flavours appear in its name. */
function flavorEmojis(text: string): { emoji: string; label: string }[] {
  const t = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const seen = new Set<string>();
  return FLAVOR_EMOJIS
    .map(f => ({ ...f, at: t.search(f.re) }))
    .filter(f => f.at >= 0)
    .sort((a, b) => a.at - b.at)
    .filter(f => (seen.has(f.emoji) ? false : (seen.add(f.emoji), true)))
    .slice(0, 4);
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
        .bil-flavors { display: flex; gap: 0.4rem; margin-top: 0.3rem; font-size: 1.2rem; line-height: 1.2; }
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
        {parsed.items.map((item, i) => {
          const flavors = flavorEmojis(item);
          return (
            <li key={i} style={{ ['--i' as string]: i }}>
              <span className="bil-star" aria-hidden>✦</span>
              <span>
                {item}
                {flavors.length > 0 && (
                  <span className="bil-flavors" aria-hidden>
                    {flavors.map(f => <span key={f.emoji} title={f.label}>{f.emoji}</span>)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
