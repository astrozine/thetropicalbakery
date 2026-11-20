'use client';

import Link from 'next/link';
import { optimizedSrc } from '@/lib/thumbs';
import { useTranslateLang } from '@/lib/useTranslateLang';
import { shellHref, type ShellLang } from '@/lib/shellCopy';

/*
 * Home page, simple version (Andrew, 2026-11-13): "more simple and get people hungry".
 * Dolly is not selling the weekly tasting box right now, so the home shows the boxes she has made
 * as a showcase of the look and style, with no prices, stock or "buy now".
 * The old box-selling home is saved in src/components/home/BoxSaleHome.tsx (see the note there).
 */

// The boxes Dolly has already made: real photos, shown as a showcase only.
const BOXES = [
  { src: '/treats/media_1789712835955.jpg', alt: 'Doce de frutas vermelhas com coco e bombons na caixa listrada' },
  { src: '/treats/media_1789712814475.jpg', alt: 'Caixa aberta com o selo da The Tropical Bakery' },
  { src: '/treats/media_1789712998942.jpg', alt: 'Caixa de doces com bombom branco e cookies' },
  { src: '/treats/media_1789712777199.jpg', alt: 'Tampa da caixa com o selo dourado da The Tropical Bakery' },
  { src: '/treats/media_1789712972031.jpg', alt: 'Caixa da The Tropical Bakery vista de cima' },
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

// Quick look at everything on the site, shown right under the hero as a swipe row.
// Each line in Portuguese, then English, Spanish, Dutch and German.
type L4 = Record<Exclude<ShellLang, 'pt'>, string>;
const OFFERS: { href: string; img: string; title: string; text: string; t: L4; x: L4 }[] = [
  { href: '/receitas', img: '/menu-items/20250823_122444.jpg', title: 'Receitas grátis', text: 'Duas receitas no seu e-mail',
    t: { en: 'Free recipes', es: 'Recetas gratis', nl: 'Gratis recepten', de: 'Gratis-Rezepte' },
    x: { en: 'Two recipes in your inbox', es: 'Dos recetas en tu correo', nl: 'Twee recepten in je mailbox', de: 'Zwei Rezepte per E-Mail' } },
  { href: '/sweet-escape/pt', img: '/ebook/sweet-escape/pt/cover.webp', title: 'E-book Sweet Escape', text: 'As receitas da Dolly',
    t: { en: 'Sweet Escape e-book', es: 'E-book Sweet Escape', nl: 'E-book Sweet Escape', de: 'E-Book Sweet Escape' },
    x: { en: 'Dolly’s recipes', es: 'Las recetas de Dolly', nl: 'De recepten van Dolly', de: 'Dollys Rezepte' } },
  { href: '/menu', img: '/menu-items/Screenshot_20260518_122444_Gallery.jpg', title: 'Doces para eventos', text: 'Festas, mesas e presentes',
    t: { en: 'Treats for events', es: 'Dulces para eventos', nl: 'Lekkernijen voor events', de: 'Süßes für Events' },
    x: { en: 'Parties, tables and gifts', es: 'Fiestas, mesas y regalos', nl: 'Feesten, tafels en cadeaus', de: 'Feiern, Buffets und Geschenke' } },
  { href: '/brunch', img: '/brunch/brunch-mesa.webp', title: 'Brunch com a Dolly', text: 'Uma manhã à mesa',
    t: { en: 'Brunch with Dolly', es: 'Brunch con Dolly', nl: 'Brunch met Dolly', de: 'Brunch mit Dolly' },
    x: { en: 'A morning at the table', es: 'Una mañana a la mesa', nl: 'Een ochtend aan tafel', de: 'Ein Vormittag am Tisch' } },
  { href: '/cursos', img: '/menu-items/20250914_132214.jpg', title: 'Cursos', text: 'Aprenda a fazer',
    t: { en: 'Classes', es: 'Cursos', nl: 'Cursussen', de: 'Kurse' },
    x: { en: 'Learn to make them', es: 'Aprende a hacerlos', nl: 'Leer ze zelf maken', de: 'Selbst machen lernen' } },
  { href: '/retreats', img: '/retreats/Beach shot Itamambuca.webp', title: 'Retiros', text: 'Dias em Itamambuca',
    t: { en: 'Retreats', es: 'Retiros', nl: 'Retreats', de: 'Retreats' },
    x: { en: 'Days in Itamambuca', es: 'Días en Itamambuca', nl: 'Dagen in Itamambuca', de: 'Tage in Itamambuca' } },
  { href: '/coaching', img: '/coaching/dolly-hero.webp', title: 'Coaching', text: 'Comer melhor, com a Dolly',
    t: { en: 'Coaching', es: 'Coaching', nl: 'Coaching', de: 'Coaching' },
    x: { en: 'Eat better, with Dolly', es: 'Come mejor, con Dolly', nl: 'Beter eten, met Dolly', de: 'Besser essen, mit Dolly' } },
  { href: '/vontade', img: '/vontade/dolly-tray.webp', title: 'App Bateu Vontade', text: 'Doce saudável na hora',
    t: { en: 'App “Bateu Vontade”', es: 'App “Bateu Vontade”', nl: 'App “Bateu Vontade”', de: 'App „Bateu Vontade“' },
    x: { en: 'A healthy treat, right now', es: 'Un dulce sano al instante', nl: 'Gezonde zoetigheid, meteen', de: 'Gesundes Süßes, sofort' } },
  { href: '/b2b', img: '/b2b-hero/treat-3.jpg', title: 'Parcerias', text: 'Para cafés e hotéis',
    t: { en: 'Partnerships', es: 'Alianzas', nl: 'Samenwerkingen', de: 'Partnerschaften' },
    x: { en: 'For cafés and hotels', es: 'Para cafés y hoteles', nl: 'Voor cafés en hotels', de: 'Für Cafés und Hotels' } },
];

/*
 * The home page in the languages we write ourselves (Andrew, 2026-11-17). Google Translate made the hero say
 * "Mouthwatering sweets ." (one huge word that ran into the photos) and "between the Atlantic Forest and the sea".
 * Visitors who pick English, Spanish, Dutch or German get these lines instead, marked so Google leaves them alone.
 * Our rule: a jungle and an ocean, and Portuguese names stay Portuguese, in quotes: “Mata Atlântica”.
 */
const COPY = {
  pt: {
    title: ['Doces que dão ', 'água na boca', '.'], text: 'Veganos, feitos à mão pela Dolly, entre a Mata Atlântica e o mar.',
    pills: ['100% vegetal', 'Sem trigo', 'Feito à mão'], see: 'Ver os doces', free: 'Receitas grátis', offers: 'O que tem por aqui',
    boxKicker: 'Já saiu da nossa cozinha', boxTitle: 'As caixas da Dolly', boxLead: 'Papel listrado, selo dourado e doces que mudam a cada edição.',
    treatsKicker: 'Fruta, castanha e cacau', treatsTitle: 'Um pedacinho de cada',
    whoKicker: 'Quem faz', whoTitle: 'Feito pela Dolly',
    whoText: 'Chef belga, da terra do chocolate, que trocou a cidade pela Mata Atlântica. Os doces dela são fruta, castanha e cacau, o mais perto possível de comida de verdade.',
    meet: 'Conheça a Dolly →',
  },
  en: {
    title: ['Treats that make your ', 'mouth water', '.'], text: 'Vegan and handmade by Dolly, between the “Mata Atlântica” jungle and the ocean.',
    pills: ['100% plant-based', 'Wheat-free', 'Handmade'], see: 'See the treats', free: 'Free recipes', offers: 'What you’ll find here',
    boxKicker: 'Fresh from our kitchen', boxTitle: 'Dolly’s boxes', boxLead: 'Striped paper, a gold seal, and treats that change with every edition.',
    treatsKicker: 'Fruit, nuts and cacao', treatsTitle: 'A little bite of each',
    whoKicker: 'Who makes them', whoTitle: 'Made by Dolly',
    whoText: 'A Belgian chef from the land of chocolate, who traded the city for the “Mata Atlântica” jungle. Her treats are fruit, nuts and cacao, as close as possible to real, whole food.',
    meet: 'Meet Dolly →',
  },
  es: {
    title: ['Dulces que hacen ', 'agua la boca', '.'], text: 'Veganos y hechos a mano por Dolly, entre la selva de la “Mata Atlântica” y el océano.',
    pills: ['100% vegetal', 'Sin trigo', 'Hecho a mano'], see: 'Ver los dulces', free: 'Recetas gratis', offers: 'Lo que encontrarás aquí',
    boxKicker: 'Recién salido de nuestra cocina', boxTitle: 'Las cajas de Dolly', boxLead: 'Papel a rayas, sello dorado y dulces que cambian en cada edición.',
    treatsKicker: 'Fruta, frutos secos y cacao', treatsTitle: 'Un bocadito de cada uno',
    whoKicker: 'Quién los hace', whoTitle: 'Hechos por Dolly',
    whoText: 'Una chef belga, de la tierra del chocolate, que cambió la ciudad por la selva de la “Mata Atlântica”. Sus dulces son fruta, frutos secos y cacao, lo más cerca posible de la comida de verdad.',
    meet: 'Conoce a Dolly →',
  },
  nl: {
    title: ['Zoetigheid om van te ', 'watertanden', '.'], text: 'Vegan en met de hand gemaakt door Dolly, tussen de jungle van de “Mata Atlântica” en de oceaan.',
    pills: ['100% plantaardig', 'Tarwevrij', 'Handgemaakt'], see: 'Bekijk de lekkernijen', free: 'Gratis recepten', offers: 'Wat je hier vindt',
    boxKicker: 'Vers uit onze keuken', boxTitle: 'De dozen van Dolly', boxLead: 'Gestreept papier, een gouden zegel en lekkernijen die elke editie anders zijn.',
    treatsKicker: 'Fruit, noten en cacao', treatsTitle: 'Een hapje van alles',
    whoKicker: 'Wie ze maakt', whoTitle: 'Gemaakt door Dolly',
    whoText: 'Een Belgische chef uit het land van de chocolade, die de stad ruilde voor de jungle van de “Mata Atlântica”. Haar lekkernijen zijn fruit, noten en cacao, zo dicht mogelijk bij echt, puur eten.',
    meet: 'Maak kennis met Dolly →',
  },
  de: {
    title: ['Süßes, das ', 'glücklich macht', '.'], text: 'Vegan, von Dolly von Hand gemacht, zwischen dem Dschungel der „Mata Atlântica“ und dem Ozean.',
    pills: ['100 % pflanzlich', 'Weizenfrei', 'Handgemacht'], see: 'Zu den Leckereien', free: 'Gratis-Rezepte', offers: 'Was es hier gibt',
    boxKicker: 'Frisch aus unserer Küche', boxTitle: 'Dollys Boxen', boxLead: 'Gestreiftes Papier, ein goldenes Siegel und Süßes, das bei jeder Ausgabe wechselt.',
    treatsKicker: 'Obst, Nüsse und Kakao', treatsTitle: 'Ein Häppchen von allem',
    whoKicker: 'Wer sie macht', whoTitle: 'Gemacht von Dolly',
    whoText: 'Eine belgische Köchin aus dem Land der Schokolade, die die Stadt gegen den Dschungel der „Mata Atlântica“ getauscht hat. Ihr Süßes ist Obst, Nüsse und Kakao, so nah wie möglich an echtem, natürlichem Essen.',
    meet: 'Lerne Dolly kennen →',
  },
} satisfies Record<ShellLang, unknown>;


// Hero photos are shown no bigger than their real size (the originals are ~1000px phone photos;
// stretching one across the whole screen made it look pixelated).
const HERO = [
  { src: '/treats/media_1789712796150.jpg', alt: 'Caixa da Dolly com doces de frutas vermelhas, chocolate e cookies' },
  { src: '/menu-items/20250823_121752.jpg', alt: 'Bolinhas de frutas vermelhas com morangos e cerejas' },
  { src: '/menu-items/Screenshot_20260401_193246_Edits.jpg', alt: 'Calda de chocolate escorrendo sobre torta de menta' },
  { src: '/menu-items/20260620_163438.jpg', alt: 'Torta rosada com flores brancas' },
];

export default function Home() {
  const tl = useTranslateLang();
  // Our own words for the languages we write; any other language (French, Italian) is left to Google.
  const lang: ShellLang = tl in COPY ? (tl as ShellLang) : 'pt';
  const c = COPY[lang];
  const own = lang !== 'pt';
  return (
    // Keyed by language so React draws fresh text (Google swaps text nodes out, and React would update the old ones).
    <main key={lang} className={own ? 'hm notranslate' : 'hm'} translate={own ? 'no' : undefined} lang={own ? lang : undefined}>
      <style>{CSS}</style>

      {/* Hero: one line, two buttons, and four sharp photos (never stretched past their real size) */}
      <section className="hm-hero">
        <div className="hm-hero__inner">
          <div className="hm-hero__copy">
          <img className="hm-hero__logo" src="/hero-logo-transparent.png" alt="The Tropical Bakery" />
          <p className="hm-kicker">Itamambuca · Ubatuba</p>
          <h1 className="hm-hero__title">{c.title[0]}<em>{c.title[1]}</em>{c.title[2]}</h1>
          <p className="hm-hero__text">{c.text}</p>
          <ul className="hm-pills">
            {c.pills.map(p => <li key={p}>{p}</li>)}
          </ul>
          <div className="hm-hero__ctas">
            <a href="#caixas" className="hm-btn hm-btn--dark">{c.see}</a>
            <Link href={shellHref('/receitas', lang)} className="hm-btn hm-btn--ghost">{c.free}</Link>
          </div>
          </div>
          <div className="hm-hero__photos">
            {HERO.map((h, i) => (
              <img key={h.src} src={optimizedSrc(h.src, 640)} alt={h.alt} fetchPriority={i < 2 ? 'high' : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* Everything on the site at a glance: a short swipe row */}
      <section className="hm-offers" aria-label={c.offers}>
        <div className="hm-wrap">
          <p className="hm-kicker">{c.offers}</p>
          <div className="hm-offers__row">
            {OFFERS.map(o => (
              <Link key={o.href} href={shellHref(o.href, lang)} className="hm-offer">
                <img src={optimizedSrc(own && o.href === '/sweet-escape/pt' ? `/ebook/sweet-escape/${lang}/cover.webp` : o.img, 384)} alt="" loading="lazy" />
                <b>{own ? o.t[lang as keyof L4] : o.title}</b>
                <small>{own ? o.x[lang as keyof L4] : o.text}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The boxes Dolly has made: the look and style, nothing to buy */}
      <section id="caixas" className="hm-sec">
        <div className="hm-wrap">
          <p className="hm-kicker">{c.boxKicker}</p>
          <h2 className="hm-h2">{c.boxTitle}</h2>
          <p className="hm-lead">{c.boxLead}</p>
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
          <p className="hm-kicker hm-kicker--light">{c.treatsKicker}</p>
          <h2 className="hm-h2 hm-h2--light">{c.treatsTitle}</h2>
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
            <p className="hm-kicker">{c.whoKicker}</p>
            <h2 className="hm-h2">{c.whoTitle}</h2>
            <p className="hm-lead hm-lead--left">{c.whoText}</p>
            <Link href="/dolly" className="hm-link">{c.meet}</Link>
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
.hm-hero { background: #fdfaf3; padding: clamp(1.5rem, 5vw, 4rem) 0 clamp(2.5rem, 6vw, 4.5rem); }
.hm-hero__inner { max-width: 1120px; margin: 0 auto; padding: 0 1.25rem; display: grid; gap: 1.75rem; align-items: center; }
@media (min-width: 900px) { .hm-hero__inner { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 3.5rem; } }
.hm-hero__logo { display: block; width: clamp(110px, 14vw, 170px); height: auto; margin: 0 auto 1.25rem; filter: drop-shadow(0 10px 18px rgba(60,42,33,0.18)); }
@media (max-width: 899px) { .hm-hero__logo { display: none; } }
.hm-hero__copy { min-width: 0; container-type: inline-size; }
.hm-hero__title { margin: 0 0 0.7rem; font-family: var(--font-heading); font-size: clamp(2rem, 9.5cqi, 4.4rem); line-height: 1.04; color: #3c2a21; text-wrap: balance; overflow-wrap: break-word; }
.hm-hero__title em { font-style: normal; color: #c9852b; }
.hm-hero__text { margin: 0 0 1.1rem; max-width: 34ch; color: #594a42; font-size: clamp(1.05rem, 2.4vw, 1.25rem); line-height: 1.5; }
.hm-pills { list-style: none; display: flex; flex-wrap: wrap; gap: 0.45rem; margin: 0 0 1.5rem; padding: 0; }
.hm-pills li { padding: 0.35rem 0.85rem; border-radius: 999px; background: #f6eedf; border: 1px solid #eadfcb; color: #3c2a21; font-size: 0.85rem; font-weight: 700; }
.hm-hero__ctas { display: flex; flex-wrap: wrap; gap: 0.7rem; }
.hm-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 50px; padding: 0 1.6rem; border-radius: 999px; font-weight: 800; font-size: 1rem; text-decoration: none; }
.hm-btn--dark { background: #3c2a21; color: #f4d675; }
.hm-btn--ghost { border: 1.5px solid #3c2a21; color: #3c2a21; }
.hm-hero__photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; max-width: 560px; width: 100%; justify-self: center; }
.hm-hero__photos img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 18px; box-shadow: 0 12px 28px rgba(60,42,33,0.14); }
.hm-hero__photos img:nth-child(even) { transform: translateY(1.5rem); }
@media (max-width: 899px) { .hm-hero__photos { order: -1; } .hm-hero__photos img { aspect-ratio: 1; } .hm-hero__photos img:nth-child(even) { transform: none; } }

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

/* offers swipe row */
.hm-offers { background: #fff; padding: 1.25rem 0 1.4rem; border-bottom: 1px solid rgba(60,42,33,0.08); }
.hm-offers .hm-kicker { margin: 0 0 0.7rem; }
.hm-offers__row { display: flex; gap: 0.75rem; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 0.4rem; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
.hm-offer { flex: 0 0 132px; scroll-snap-align: start; display: grid; align-content: start; gap: 0.15rem; text-decoration: none; color: #3c2a21; }
.hm-offer img { width: 132px; height: 132px; object-fit: cover; object-position: center top; border-radius: 16px; margin-bottom: 0.35rem; background: #f3ece0; }
.hm-offer b { font-family: var(--font-heading); font-size: 0.95rem; line-height: 1.2; }
.hm-offer small { color: #7a6a61; font-size: 0.78rem; line-height: 1.3; }
.hm-offer:hover img { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(60,42,33,0.15); }
.hm-offer img { transition: transform .2s, box-shadow .2s; }
@media (min-width: 900px) { .hm-offer { flex-basis: 150px; } .hm-offer img { width: 150px; height: 150px; } }
`;
