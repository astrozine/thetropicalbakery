import Link from 'next/link';
import { optimizedSrc } from '@/lib/thumbs';
import { shortTitle } from '@/lib/boxWindow';

/** One live box as the home hero shows it (worked out on the server in app/page.tsx). */
export interface HeroBox {
  id: string;
  title: string;
  image: string;
  /** "🎁 Edição especial", "🧁 Pronta entrega", "🗓️ Pré-venda" */
  kicker: string;
  /** "R$ 49", "a partir de R$ 59" */
  price: string;
  /** "restam 4 · entregas de 6 a 11 de out" */
  sub: string;
}

/**
 * "À venda agora": every box that can be ordered, right in the home hero, each one tap from its own
 * page. Andrew found the old one-line rows too small to fall for, so these are the /caixas chooser's
 * photo tiles (BoxPicker): big photo, "OPÇÃO 1 / 2", a gold "OU" coin between two boxes, a handwritten
 * "Escolha a sua!" and a little wiggle, taking turns, until someone taps. Three or more scroll sideways.
 */
export default function HeroLiveBoxes({ boxes }: { boxes: HeroBox[] }) {
  if (!boxes.length) return null;
  const one = boxes.length === 1;
  const two = boxes.length === 2;
  const many = boxes.length > 2;
  return (
    <div className="hlb">
      <style>{`
        .hlb { width: 100%; text-align: left; pointer-events: auto; }
        .hlb-k { display: block; width: fit-content; margin: 0 auto 0.2rem; background: #d4af37; color: #3c2a21; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; padding: 0.35rem 0.9rem; border-radius: 999px; box-shadow: 0 6px 14px rgba(212,175,55,0.35); }
        .hlb-note { display: flex; justify-content: center; align-items: flex-end; gap: 0.2rem; margin: 0 0 0.15rem; pointer-events: none; }
        .hlb-note span { font-family: 'Yellowtail', 'Brush Script MT', cursive; color: #a6832b; font-size: 1.7rem; line-height: 1; transform: rotate(-5deg); }
        .hlb-note svg { width: 34px; height: 34px; overflow: visible; }
        .hlb-note path { fill: none; stroke: #a6832b; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 90; stroke-dashoffset: 90; animation: hlb-draw 0.9s ease-out 0.6s forwards; }
        @keyframes hlb-draw { to { stroke-dashoffset: 0; } }
        .hlb-stage { position: relative; }
        .hlb-row { display: grid; gap: 0.75rem; grid-template-columns: repeat(${one ? 1 : 2}, minmax(0, 1fr)); }
        .hlb-row.is-many { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding: 0.4rem 0.1rem 0.5rem; }
        .hlb-row.is-many .hlb-t { flex: 0 0 min(72%, 220px); scroll-snap-align: start; }
        .hlb-t { position: relative; display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; background: #fff; color: #3c2a21; text-decoration: none; border: 3px solid #fff; box-shadow: 0 0 0 1px rgba(212,175,55,0.45), 0 14px 28px rgba(60,42,33,0.22); transition: transform 0.2s, box-shadow 0.2s; }
        .hlb-t:hover { transform: translateY(-4px); box-shadow: 0 0 0 3px #d4af37, 0 18px 34px rgba(60,42,33,0.28); }
        .hlb-t.is-nudge { animation: hlb-nudge 4s ease-in-out infinite; }
        .hlb-t.is-nudge:nth-child(2) { animation-delay: 2s; }
        @keyframes hlb-nudge {
          0%, 80%, 100% { transform: none; }
          84% { transform: translateY(-6px) rotate(-2deg); }
          88% { transform: translateY(-6px) rotate(2deg); }
          92% { transform: translateY(-3px) rotate(-1deg); }
          96% { transform: none; }
        }
        .hlb-photo { position: relative; display: block; }
        .hlb-t img { display: block; width: 100%; aspect-ratio: ${one ? '16 / 10' : '4 / 3'}; object-fit: cover; background: #f5efe2; }
        .hlb-empty { display: flex; align-items: center; justify-content: center; aspect-ratio: 4 / 3; font-size: 3rem; background: #f5efe2; }
        .hlb-opt { position: absolute; top: 8px; left: 8px; background: #3c2a21; color: #fdfaf3; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; padding: 0.3rem 0.6rem; border-radius: 999px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); }
        .hlb-b { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.65rem 0.7rem 0.75rem; flex: 1; }
        .hlb-kick { font-size: 0.72rem; font-weight: 800; color: #a6832b; }
        .hlb-title { font-weight: 800; font-size: 0.98rem; line-height: 1.2; overflow-wrap: anywhere; }
        .hlb-price { font-weight: 800; font-size: 0.95rem; }
        .hlb-sub { font-size: 0.75rem; color: #594a42; line-height: 1.35; }
        .hlb-cta { margin-top: auto; padding-top: 0.5rem; }
        .hlb-cta span { display: block; text-align: center; border-radius: 999px; padding: 0.55rem 0.4rem; font-size: 0.8rem; font-weight: 800; background: #3c2a21; color: #fdfaf3; transition: background 0.2s; }
        .hlb-t:hover .hlb-cta span { background: #d4af37; color: #3c2a21; }
        /* The gold coin between two boxes, on the line where the photos end. margin-top in % is a share of
           the row's WIDTH, so this tracks the photo height (half the row, 4:3) at any screen size. */
        .hlb-or { position: absolute; z-index: 3; left: 50%; top: 0; margin-top: calc((100% - 0.75rem) * 0.375); transform: translate(-50%, -50%);
          width: 50px; height: 50px; border-radius: 50%; background: #d4af37; color: #3c2a21; border: 4px solid #3c2a21; box-shadow: 0 6px 16px rgba(60,42,33,0.4);
          display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; pointer-events: none; }
        @media (min-width: 768px) { .hlb-title { font-size: 1.05rem; } .hlb-or { width: 58px; height: 58px; font-size: 1.05rem; } }
        @media (prefers-reduced-motion: reduce) { .hlb-t.is-nudge { animation: none; } .hlb-note path { animation: none; stroke-dashoffset: 0; } }
      `}</style>
      <p className="hlb-k">{one ? '✨ À venda agora' : `✨ ${boxes.length} caixas à venda agora`}</p>
      <div className="hlb-note" aria-hidden>
        <span>{one ? 'Corre que acaba!' : 'Escolha a sua!'}</span>
        <svg viewBox="0 0 34 34">
          {/* A hand-drawn curve ending in an arrowhead, pointing down at the boxes. */}
          <path d="M4 4 C 22 4, 28 14, 24 30 M16 24 L24 31 L30 22" />
        </svg>
      </div>
      <div className="hlb-stage">
        <div className={`hlb-row hide-scrollbars${many ? ' is-many' : ''}`}>
          {boxes.map((b, i) => (
            <Link key={b.id} href={`/caixas?caixa=${b.id}`} className={`hlb-t${one ? '' : ' is-nudge'}`}>
              <span className="hlb-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.image ? <img src={optimizedSrc(b.image, 640)} alt="" /> : <span className="hlb-empty">📦</span>}
                {!one && <span className="hlb-opt">OPÇÃO {i + 1}</span>}
              </span>
              <span className="hlb-b">
                <span className="hlb-kick">{b.kicker}</span>
                <span className="hlb-title">{shortTitle(b.title)}</span>
                {b.price && <span className="hlb-price">{b.price}</span>}
                {b.sub && <span className="hlb-sub">{b.sub}</span>}
                <span className="hlb-cta"><span>👉 Ver esta caixa</span></span>
              </span>
            </Link>
          ))}
        </div>
        {two && <span className="hlb-or" aria-hidden>OU</span>}
      </div>
    </div>
  );
}
