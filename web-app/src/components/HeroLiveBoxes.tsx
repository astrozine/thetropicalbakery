import Link from 'next/link';
import { optimizedSrc } from '@/lib/thumbs';

/** One live box as the home hero shows it (worked out on the server in app/page.tsx). */
export interface HeroBox {
  id: string;
  title: string;
  image: string;
  /** "🎁 Edição especial", "🧁 Pronta entrega", "🗓️ Pré-venda" */
  kicker: string;
  /** "R$ 79 · restam 4" */
  meta: string;
}

/**
 * "À venda agora": every box that can be ordered, right in the home hero, each one tap from its own
 * page. With several boxes on sale (the box of the week plus a special edition) nobody has to find
 * out on /caixas that there was a second one.
 */
export default function HeroLiveBoxes({ boxes }: { boxes: HeroBox[] }) {
  if (!boxes.length) return null;
  return (
    <div className="hlb">
      <style>{`
        .hlb { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; text-align: left; }
        .hlb-k { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #a6832b; text-align: center; margin: 0 0 0.1rem; }
        .hlb a { display: flex; align-items: center; gap: 0.7rem; min-height: 56px; padding: 0.45rem 0.6rem 0.45rem 0.45rem; border-radius: 14px; background: #fff; border: 1px solid rgba(212,175,55,0.45); color: #3c2a21; text-decoration: none; box-shadow: 0 6px 16px rgba(60,42,33,0.1); transition: transform 0.2s, box-shadow 0.2s; pointer-events: auto; }
        .hlb a:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(60,42,33,0.16); }
        .hlb img { width: 48px; height: 48px; flex-shrink: 0; object-fit: cover; border-radius: 10px; background: #f5efe2; }
        .hlb-b { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
        .hlb-kick { font-size: 0.75rem; font-weight: 800; color: #a6832b; }
        .hlb-t { font-weight: 800; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hlb-m { font-size: 0.78rem; color: #594a42; }
        .hlb-go { flex-shrink: 0; color: #d4af37; font-weight: 800; font-size: 1.1rem; }
      `}</style>
      <p className="hlb-k">{boxes.length === 1 ? '✦ À venda agora ✦' : `✦ ${boxes.length} caixas à venda agora ✦`}</p>
      {boxes.map(b => (
        <Link key={b.id} href={`/caixas?caixa=${b.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {b.image ? <img src={optimizedSrc(b.image, 256)} alt="" /> : <span style={{ fontSize: '2rem', width: 48, textAlign: 'center' }}>📦</span>}
          <span className="hlb-b">
            <span className="hlb-kick">{b.kicker}</span>
            <span className="hlb-t">{b.title}</span>
            <span className="hlb-m">{b.meta}</span>
          </span>
          <span className="hlb-go" aria-hidden>→</span>
        </Link>
      ))}
    </div>
  );
}
