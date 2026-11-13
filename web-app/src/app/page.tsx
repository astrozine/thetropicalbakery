import Link from 'next/link';
import { optimizedSrc } from '@/lib/thumbs';

/*
 * Home page, simple version (Andrew, 2026-11-13): "more simple and get people hungry".
 * Dolly is not selling the weekly tasting box right now, so the home shows the boxes she has made
 * as a showcase of the look and style, with no prices, stock or "buy now".
 * The old box-selling home is saved in src/components/home/BoxSaleHome.tsx (see the note there).
 */

// The boxes Dolly has already made: real photos, shown as a showcase only.
const BOXES = [
  { src: '/treats/media_1789712796150.jpg', alt: 'Caixa com doce de frutas vermelhas, bombom de chocolate e cookies' },
  { src: '/treats/media_1789712835955.jpg', alt: 'Doce de frutas vermelhas com coco e bombons na caixa listrada' },
  { src: '/treats/media_1789712814475.jpg', alt: 'Caixa aberta com o selo da The Tropical Bakery' },
  { src: '/treats/media_1789712998942.jpg', alt: 'Caixa de doces com bombom branco e cookies' },
  { src: '/treats/media_1789712777199.jpg', alt: 'Tampa da caixa com o selo dourado da The Tropical Bakery' },
];

// Close-ups that make people hungry.
const TREATS = [
  '/menu-items/Screenshot_20260513_114809_Edits.jpg',
  '/menu-items/20250823_121752.jpg',
  '/menu-items/20260620_163438.jpg',
  '/menu-items/Screenshot_20260810_135948_Photos.jpg',
  '/menu-items/1000240473 - Edited (1).jpg',
  '/menu-items/Screenshot_20260708_144013_Gallery.jpg',
  '/menu-items/20250907_143728.jpg',
  '/menu-items/Screenshot_20260415_110305_Gallery.jpg',
];

const WAYS = [
  { href: '/receitas', img: '/menu-items/20250823_122444.jpg', title: 'Receitas grátis', text: 'Duas receitas da Dolly no seu e-mail.' },
  { href: '/menu', img: '/menu-items/Screenshot_20260518_122444_Gallery.jpg', title: 'Doces para eventos', text: 'Mesas de doces, festas e presentes.' },
  { href: '/brunch', img: '/menu-items/20260724_154636.jpg', title: 'Brunch com a Dolly', text: 'Chá, doces e boa conversa.' },
  { href: '/cursos', img: '/menu-items/20250914_132214.jpg', title: 'Cursos e retiros', text: 'Aprenda a fazer na cozinha dela.' },
];

const HERO = '/menu-items/Screenshot_20260401_193246_Edits.jpg';

export default function Home() {
  return (
    <main className="hm">
      <style>{CSS}</style>

      {/* Hero: one big photo, one line, two buttons */}
      <section className="hm-hero">
        <img className="hm-hero__img" src={optimizedSrc(HERO, 1920)} alt="" fetchPriority="high" />
        <div className="hm-hero__shade" />
        <div className="hm-hero__inner">
          <p className="hm-kicker hm-kicker--light">Itamambuca · Ubatuba</p>
          <h1 className="hm-hero__title">Doces que dão <em>água na boca</em>.</h1>
          <p className="hm-hero__text">Veganos, feitos à mão pela Dolly, entre a Mata Atlântica e o mar.</p>
          <ul className="hm-pills">
            <li>100% vegetal</li><li>Sem trigo</li><li>Feito à mão</li>
          </ul>
          <div className="hm-hero__ctas">
            <a href="#caixas" className="hm-btn hm-btn--gold">Ver os doces</a>
            <Link href="/receitas" className="hm-btn hm-btn--ghost">Receitas grátis</Link>
          </div>
        </div>
      </section>

      {/* The boxes Dolly has made: the look and style, nothing to buy */}
      <section id="caixas" className="hm-sec">
        <div className="hm-wrap">
          <p className="hm-kicker">Já saiu da nossa cozinha</p>
          <h2 className="hm-h2">As caixas da Dolly</h2>
          <p className="hm-lead">Papel listrado, selo dourado e doces que mudam a cada edição.</p>
          <div className="hm-boxes">
            {BOXES.map((b, i) => (
              <figure key={b.src} className={`hm-box hm-box--${i}`}>
                <img src={optimizedSrc(b.src, i === 0 ? 1080 : 750)} alt={b.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Close-ups: a swipe row on phones, a grid on desktop */}
      <section className="hm-sec hm-sec--dark">
        <div className="hm-wrap">
          <p className="hm-kicker hm-kicker--light">Fruta, castanha e cacau</p>
          <h2 className="hm-h2 hm-h2--light">Um pedacinho de cada</h2>
        </div>
        <div className="hm-treats">
          {TREATS.map(src => (
            <img key={src} src={optimizedSrc(src, 640)} alt="Doce vegano da The Tropical Bakery" loading="lazy" />
          ))}
        </div>
      </section>

      {/* Who makes it */}
      <section className="hm-sec">
        <div className="hm-wrap hm-dolly">
          <img src={optimizedSrc('/dolly/dolly-portrait.jpg', 750)} alt="Dolly, a confeiteira da The Tropical Bakery" loading="lazy" />
          <div>
            <p className="hm-kicker">Quem faz</p>
            <h2 className="hm-h2">Feito pela Dolly</h2>
            <p className="hm-lead hm-lead--left">
              Chef belga, da terra do chocolate, que trocou a cidade pela Mata Atlântica. Os doces dela são fruta,
              castanha e cacau, o mais perto possível de comida de verdade.
            </p>
            <Link href="/dolly" className="hm-link">Conheça a Dolly →</Link>
          </div>
        </div>
      </section>

      {/* Where to go next */}
      <section className="hm-sec hm-sec--soft">
        <div className="hm-wrap">
          <h2 className="hm-h2">Quer provar?</h2>
          <div className="hm-ways">
            {WAYS.map(w => (
              <Link key={w.href} href={w.href} className="hm-way">
                <img src={optimizedSrc(w.img, 640)} alt="" loading="lazy" />
                <span><b>{w.title}</b><small>{w.text}</small></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const CSS = `
.hm { background: #fdfaf3; color: #3c2a21; }
.hm-wrap { max-width: 1120px; margin: 0 auto; padding: 0 1.25rem; }
.hm-kicker { margin: 0 0 0.5rem; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #a6832b; }
.hm-kicker--light { color: #f4d675; }
.hm-h2 { margin: 0 0 0.6rem; font-family: var(--font-heading); font-size: clamp(1.8rem, 5vw, 3rem); line-height: 1.08; color: #3c2a21; text-wrap: balance; }
.hm-h2--light { color: #fdfaf3; }
.hm-lead { margin: 0 0 1.75rem; max-width: 560px; color: #594a42; font-size: 1.05rem; line-height: 1.65; }
.hm-lead--left { margin-bottom: 1.1rem; }
.hm-sec { padding: clamp(3rem, 8vw, 6rem) 0; }
.hm-sec--dark { background: #3c2a21; }
.hm-sec--soft { background: #f6eedf; }

/* hero */
.hm-hero { position: relative; min-height: min(86vh, 760px); display: flex; align-items: flex-end; overflow: hidden; background: #3c2a21; }
.hm-hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hm-hero__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(30,20,14,0.05) 25%, rgba(30,20,14,0.82) 100%); }
.hm-hero__inner { position: relative; width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 1.25rem clamp(2.5rem, 7vw, 4.5rem); }
.hm-hero__title { margin: 0 0 0.7rem; font-family: var(--font-heading); font-size: clamp(2.4rem, 8vw, 5rem); line-height: 1.02; color: #fdfaf3; max-width: 12ch; text-wrap: balance; }
.hm-hero__title em { font-style: normal; color: #f4d675; }
.hm-hero__text { margin: 0 0 1.1rem; max-width: 34ch; color: rgba(253,250,243,0.9); font-size: clamp(1.05rem, 2.4vw, 1.25rem); line-height: 1.5; }
.hm-pills { list-style: none; display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0 0 1.5rem; padding: 0; }
.hm-pills li { padding: 0.35rem 0.85rem; border-radius: 999px; background: rgba(253,250,243,0.14); border: 1px solid rgba(253,250,243,0.35); color: #fdfaf3; font-size: 0.85rem; font-weight: 700; backdrop-filter: blur(6px); }
.hm-hero__ctas { display: flex; flex-wrap: wrap; gap: 0.7rem; }
.hm-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 50px; padding: 0 1.6rem; border-radius: 999px; font-weight: 800; font-size: 1rem; text-decoration: none; }
.hm-btn--gold { background: #f4d675; color: #3c2a21; }
.hm-btn--ghost { border: 1.5px solid rgba(253,250,243,0.8); color: #fdfaf3; }

/* boxes showcase */
.hm-boxes { display: grid; gap: 0.6rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.hm-box { margin: 0; border-radius: 18px; overflow: hidden; background: #efe4cf; }
.hm-box img { display: block; width: 100%; height: 100%; aspect-ratio: 1; object-fit: cover; transition: transform .5s ease; }
.hm-box--0 { grid-column: 1 / -1; }
.hm-box--0 img { aspect-ratio: 4 / 3; }
@media (min-width: 760px) {
  .hm-boxes { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.9rem; }
  .hm-box--0 { grid-column: span 2; grid-row: span 2; }
  .hm-box--0 img { aspect-ratio: auto; }
  .hm-box:hover img { transform: scale(1.04); }
}

/* treats row */
.hm-treats { display: flex; gap: 0.7rem; overflow-x: auto; scroll-snap-type: x mandatory; padding: 0.4rem 1.25rem 0.2rem; scrollbar-width: none; max-width: 1120px; margin: 1rem auto 0; }
.hm-treats::-webkit-scrollbar { display: none; }
.hm-treats img { flex: 0 0 62%; width: 62%; min-width: 0; height: auto; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 18px; scroll-snap-align: start; }
@media (min-width: 760px) { .hm-treats img { flex-basis: 23%; width: 23%; } }

/* Dolly */
.hm-dolly { display: grid; gap: 1.5rem; align-items: center; }
.hm-dolly img { width: min(260px, 70%); aspect-ratio: 1; object-fit: cover; border-radius: 50%; border: 5px solid #f4d675; }
@media (min-width: 760px) { .hm-dolly { grid-template-columns: 300px minmax(0, 1fr); gap: 3rem; } .hm-dolly img { width: 100%; } }
.hm-link { font-weight: 800; color: #3c2a21; text-decoration: underline; text-underline-offset: 4px; }

/* ways */
.hm-ways { display: grid; gap: 0.7rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 1.25rem; }
@media (min-width: 900px) { .hm-ways { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; } }
.hm-way { display: flex; flex-direction: column; background: #fff; border-radius: 18px; overflow: hidden; text-decoration: none; color: #3c2a21; box-shadow: 0 8px 22px rgba(60,42,33,0.08); }
.hm-way img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.hm-way span { display: grid; gap: 0.2rem; padding: 0.75rem 0.85rem 0.9rem; }
.hm-way b { font-family: var(--font-heading); font-size: 1rem; line-height: 1.2; }
.hm-way small { color: #7a6a61; font-size: 0.85rem; line-height: 1.4; }
`;
