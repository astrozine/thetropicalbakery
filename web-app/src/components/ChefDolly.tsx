import React from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import ZoomableImage from '@/components/ZoomableImage';
import { Flags } from '@/components/BelgiumBrazil';
import { optimizedSrc } from '@/lib/thumbs';

/*
 * "Sobre a Dolly" — the chef's own page.
 *
 * The conceit is a theatre programme, because that is literally what her life was: she danced,
 * she performed as Dolly Bing Bing, she sculpted, and only then did she bake. So the page opens
 * on a playbill, names the parts she has played, and tells her story in four acts.
 *
 * Two rules the design follows:
 *  - The three portraits are from one afternoon, same dress, same leaves. Putting them side by side
 *    would look like a contact sheet, so they are spread as far apart as the page allows (hero,
 *    fourth act, and a cropped medallion) and everything between them is borrowed from elsewhere
 *    on the site: the treats, Itamambuca, the palms.
 *  - Act II is about her first husband's death. It gets a quiet band of its own — no photos, no
 *    gold, no animation — because decorating that would be the wrong instinct.
 */

/** The parts she has played, in the order she played them. */
const CAST = [
  {
    num: 'I',
    role: 'A bailarina',
    line: 'Anos de barra, espelho e palco. A disciplina do corpo — e o preço que ela cobra.',
  },
  {
    num: 'II',
    role: 'Dolly Bing Bing',
    line: 'O nome artístico com que subiu ao palco por toda uma carreira. A performer nunca saiu de cena.',
  },
  {
    num: 'III',
    role: 'A escultora',
    line: 'Mãos na matéria: forma, volume, superfície. O ofício que hoje cabe na palma da mão.',
  },
  {
    num: 'IV',
    role: 'A chef',
    line: 'Técnica belga, pâtisserie francesa, fruta brasileira. O palco virou bancada.',
  },
];

/** The five worlds that meet in the bakery, in her own words. */
const WORLDS = [
  { n: '01', t: 'Raízes belgas', d: 'A escola do país que aperfeiçoou o chocolate.' },
  { n: '02', t: 'Natureza brasileira', d: 'Cacau, castanhas, coco e fruta da Mata Atlântica.' },
  { n: '03', t: 'Pâtisserie francesa', d: 'A gramática clássica das massas, cremes e camadas.' },
  { n: '04', t: 'Artesanato plant-based', d: 'Tudo à mão, em pequenos lotes, sem nada de origem animal.' },
  { n: '05', t: 'Uma profunda paixão por saúde', d: 'Totalmente vegetal, sem glúten, com alimentos integrais sempre que possível e o mais perto possível do SOS-free: sem sal e sem óleo, adoçado sobretudo com tâmaras e frutas.' },
];

/**
 * The gallery wall. No titles: the placard names the matter, the way a museum names the medium,
 * because inventing names for real treats would only contradict the menu.
 */
const SCULPTURES = [
  { src: '/menu-items/Screenshot_20260415_110305_Gallery.jpg', medium: 'Pitaya · cacau · ouro', alt: 'Doces com creme rosa de pitaya servidos em pratinhos dourados' },
  { src: '/menu-items/20250914_132214.jpg', medium: 'Pistache · kiwi · sementes', alt: 'Fatia triangular coberta de pistache sobre louça verde' },
  { src: '/menu-items/20260620_163438.jpg', medium: 'Fruta vermelha · flor comestível', alt: 'Torta de creme rosa decorada com flores brancas' },
  { src: '/menu-items/Screenshot_20260401_193246_Edits.jpg', medium: 'Cacau · matcha · castanha', alt: 'Fatia de torta verde com calda de chocolate sendo despejada' },
  { src: '/menu-items/Screenshot_20260818_075043_Gallery.jpg', medium: 'Cacau · cereja · camadas', alt: 'Bolo de camadas escuras com cereja no topo' },
  { src: '/menu-items/20250823_121752.jpg', medium: 'Coco · frutas vermelhas', alt: 'Docinhos cor-de-rosa com morangos e cerejas' },
];

export default function ChefDolly() {
  return (
    <main className="cd">

      {/* ══════════════════════════════════════════════════════════════
          O PROGRAMA — the playbill. Dark stage, one portrait, gold billing.
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-hero">
        <div className="cd-hero__bg" />
        <div className="cd-hero__veil" />

        <div className="cd-hero__photos">
          {/* One stage, so the two floating treats hang off the poster itself and can never
              drift into the billing text, however wide or narrow the screen is. */}
          <div className="cd-hero__stage">
            <div className="cd-hero__poster">
              <ZoomableImage
                src="/dolly/dolly-spatula.jpg"
                alt="Dolly Van Dam segurando uma espátula atrás de uma tábua de doces, na mata de Itamambuca"
                thumbWidth={1080}
              />
              <span className="cd-hero__plate">
                <b>Elisabeth “Dolly” Van Dam</b>
                <i>Bélgica → Itamambuca</i>
              </span>
            </div>
            <ZoomableImage
              className="cd-hero__chip cd-hero__chip--a"
              src="/menu-items/Screenshot_20260415_110305_Gallery.jpg"
              alt="Doces com creme rosa de pitaya"
              thumbWidth={384}
            />
            <ZoomableImage
              className="cd-hero__chip cd-hero__chip--b"
              src="/menu-items/20250914_132214.jpg"
              alt="Fatia coberta de pistache"
              thumbWidth={384}
            />
          </div>
        </div>

        <div className="cd-hero__bill">
          <span className="cd-rule" aria-hidden />
          <span className="cd-hero__presents">The Tropical Bakery apresenta</span>
          <h1 className="cd-hero__name">Dolly<br />Van Dam</h1>
          <span className="cd-hero__roles">Bailarina · Performer · Escultora · Chef</span>
          <span className="cd-rule" aria-hidden />
          <p className="cd-hero__lead">
            Eu sou Dolly — artista belga, criadora, mãe e fundadora da <em>The Tropical Bakery</em>.
          </p>
          <span className="cd-hero__tag">Eat Art. Feel Good. Repeat.</span>
          <span className="cd-hero__cue" aria-hidden>Uma vida em quatro atos ▾</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          O ELENCO — the parts she has played
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-cast">
        <div className="cd-wrap">
          <ScrollReveal>
            <span className="cd-kicker">O elenco</span>
            <h2 className="cd-h2">Os papéis de uma vida só</h2>
            <p className="cd-sub">
              Antes da bancada vieram o palco, a barra e a matéria. Nada disso ficou para trás — tudo virou ingrediente.
            </p>
          </ScrollReveal>
          <div className="cd-cast__grid">
            {CAST.map((c, i) => (
              <ScrollReveal key={c.role} delay={i * 0.08}>
                <article className="cd-cast__card">
                  <span className="cd-cast__num" aria-hidden>{c.num}</span>
                  <h3>{c.role}</h3>
                  <p>{c.line}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ATO I — O corpo
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-act cd-act--i">
        <div className="cd-wrap cd-wrap--narrow">
          <ScrollReveal>
            <span className="cd-act__label"><b>Ato I</b><i>O corpo</i></span>
            <p className="cd-body">
              Durante muitos anos, fui uma bailarina de coração, profundamente fascinada pelo corpo e pela
              ideia de beleza. Minha relação com a comida, o movimento e meu próprio corpo nem sempre foi saudável.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <blockquote className="cd-quote">
              <span aria-hidden className="cd-quote__mark">“</span>
              Com o tempo, aprendi que verdadeiro bem-estar nunca teve a ver com ocupar menos espaço —
              mas com <em>estar mais viva</em>.
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ATO II — 2018. No photographs here, and nothing gold.
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-loss" aria-label="Ato II — A perda">
        <div className="cd-wrap cd-wrap--narrow">
          <span className="cd-act__label cd-act__label--quiet"><b>Ato II · 2018</b><i>A perda</i></span>
          <p className="cd-loss__p">
            Então, em 2018, meu primeiro marido morreu de ELA. Nossa filha Gigi tinha apenas quatro anos.
          </p>
          <p className="cd-loss__p cd-loss__p--last">O luto mudou tudo.</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ATO III — A travessia
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-act cd-act--iii">
        <div className="cd-wrap cd-cross">
          <ScrollReveal className="cd-cross__text">
            <span className="cd-act__label"><b>Ato III · 2022</b><i>A travessia</i></span>
            <p className="cd-body">
              Eu sabia que precisava levar minha filha para um lugar onde a vida voltasse a parecer imensa —
              um lugar selvagem, bonito e cheio de vida. Eu já havia conhecido Andrew, um artista
              brasileiro-americano que também estava prestes a deixar a cidade para viver entre a mata e o mar.
            </p>
            <p className="cd-body cd-body--strong">
              Então, em 2022, deixei a Bélgica e me mudei para o Brasil.
            </p>
            <p className="cd-body">
              Viemos parar em <em>Itamambuca, onde a Mata Atlântica encontra o oceano</em>. Construímos uma vida
              cercada de natureza, arte, movimento e família. Hoje, Andrew e eu criamos Gigi e nossa pequena
              Zimi aqui — e a vida que um dia imaginei acabou se tornando algo completamente diferente.
              E muito mais bonito.
            </p>
            <p className="cd-body">
              Aqui, a saúde virou princípio da família: comemos de forma <em>nutritariana</em> — alimentos
              vegetais, integrais e o mais próximos possível da natureza. É essa mesma mesa que chega
              à The Tropical Bakery.
            </p>
            <span className="cd-passport">
              <Flags size={16} />
              <span>Bruxelas → Itamambuca</span>
            </span>
          </ScrollReveal>

          <ScrollReveal className="cd-cross__photo" delay={0.12}>
            <figure className="cd-frame">
              <img
                src={optimizedSrc('/retreats/Evening shot Itamabuca beach.webp', 1080)}
                alt="Fim de tarde na praia de Itamambuca, com as montanhas ao fundo"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <b>Itamambuca</b>
                <span>Onde a Mata Atlântica encontra o oceano</span>
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ATO IV — A bancada
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-act cd-act--iv">
        <div className="cd-wrap cd-cross cd-cross--flip">
          <ScrollReveal className="cd-cross__text">
            <span className="cd-act__label"><b>Ato IV</b><i>A bancada</i></span>
            <p className="cd-body">Foi em meio a essa transformação que comecei a criar sobremesas.</p>
            <p className="cd-body">
              O que começou como uma paixão se tornou mais uma forma de expressão artística: transformar
              frutas tropicais, chocolate, castanhas, flores, cores e texturas em pequenas
              <em> esculturas comestíveis</em>.
            </p>
          </ScrollReveal>

          <ScrollReveal className="cd-cross__photo" delay={0.12}>
            <div className="cd-portrait">
              <ZoomableImage
                src="/dolly/dolly-portrait.jpg"
                alt="Dolly Van Dam atrás de uma tábua de doces recém-prontos"
                thumbWidth={828}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ONDE MEUS MUNDOS SE ENCONTRAM
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-worlds">
        <div className="cd-wrap">
          <ScrollReveal>
            <span className="cd-kicker cd-kicker--gold">Cinco mundos, uma bancada</span>
            <h2 className="cd-h2 cd-h2--light">
              A <em>The Tropical Bakery</em> é onde todos os meus mundos se encontram.
            </h2>
          </ScrollReveal>

          <div className="cd-worlds__grid">
            <ScrollReveal className="cd-worlds__medal">
              <span className="cd-medal">
                <img
                  src={optimizedSrc('/dolly/dolly-face.jpg', 640)}
                  alt="Retrato de Dolly Van Dam"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="cd-medal__sig">Dolly</span>
            </ScrollReveal>

            <ol className="cd-worlds__list">
              {WORLDS.map((w, i) => (
                <ScrollReveal key={w.n} delay={i * 0.07}>
                  <li>
                    <span className="cd-worlds__n" aria-hidden>{w.n}</span>
                    <b>{w.t}</b>
                    <span>{w.d}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ol>
          </div>

          <ScrollReveal>
            <p className="cd-worlds__end">
              E a convicção de que a própria vida pode ser uma obra de arte.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ESCULTURAS COMESTÍVEIS — the gallery wall
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-gallery">
        <div className="cd-wrap">
          <ScrollReveal>
            <span className="cd-kicker">A exposição</span>
            <h2 className="cd-h2">Esculturas comestíveis</h2>
            <p className="cd-sub">
              A escultora nunca largou a matéria. Só trocou o barro por cacau, fruta e flor — e passou a
              fazer peças que duram uma tarde.
            </p>
          </ScrollReveal>
          <div className="cd-gallery__wall">
            {SCULPTURES.map((s, i) => (
              <ScrollReveal key={s.src} delay={(i % 3) * 0.08}>
                <figure className="cd-piece">
                  <ZoomableImage src={s.src} alt={s.alt} thumbWidth={640} />
                  <figcaption>
                    <b>{s.medium}</b>
                    <span>Peça única · feita à mão em Itamambuca</span>
                  </figcaption>
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CORTINA — her closing words, then the three doors
      ══════════════════════════════════════════════════════════════ */}
      <section className="cd-end">
        <div className="cd-wrap cd-wrap--narrow">
          <ScrollReveal>
            <figure className="cd-bow">
              <ZoomableImage
                src="/dolly/dolly-tray.jpg"
                alt="Dolly Van Dam oferecendo uma tábua de madeira cheia de doces"
                thumbWidth={640}
              />
            </figure>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <p className="cd-end__p">
              Crio sobremesas feitas para encantar os olhos, despertar os sentidos e fazer você se sentir bem —
              porque hoje não acredito mais que precisamos escolher entre <em>beleza, prazer e bem-estar</em>.
            </p>
            <p className="cd-end__p cd-end__p--small">Este é o meu pequeno universo.</p>
            <p className="cd-end__welcome">Bem-vindo à The Tropical Bakery.</p>
            <span className="cd-rule" aria-hidden />
            <p className="cd-end__tag">Eat&nbsp;Art. Feel&nbsp;Good. Repeat.</p>
          </ScrollReveal>

        </div>

        {/* The three doors get the full width: at 760px their titles broke over two lines. */}
        <div className="cd-wrap">
          <ScrollReveal delay={0.14}>
            <div className="cd-end__doors">
              <Link href="/assinatura" className="cd-door cd-door--gold">
                <b>Assinatura semanal</b>
                <span>Uma caixa por semana, sempre diferente</span>
              </Link>
              <Link href="/caixas" className="cd-door">
                <b>Caixa de degustação</b>
                <span>Comece por uma caixa só</span>
              </Link>
              <Link href="/cursos" className="cd-door">
                <b>Aprenda com a Dolly</b>
                <span>Cursos e retiros em Itamambuca</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .cd { --gold: #d4af37; --cocoa: #3c2a21; --cream: #fdfaf3; background: var(--cream); }
        .cd-wrap { max-width: 1120px; margin: 0 auto; padding: 0 1.25rem; }
        .cd-wrap--narrow { max-width: 760px; }
        .cd-rule { display: block; width: 92px; height: 1px; margin: 1.5rem auto; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
        .cd-kicker { display: block; text-align: center; color: #9a7a1f; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; margin-bottom: 0.9rem; }
        .cd-kicker--gold { color: var(--gold); }
        .cd-h2 { font-family: var(--font-heading); font-size: clamp(1.55rem, 4.4vw, 2.7rem); line-height: 1.18; text-align: center; color: var(--cocoa); margin: 0 auto 1rem; max-width: 18ch; }
        .cd-h2--light { color: var(--cream); max-width: 22ch; }
        .cd-h2--light em { color: var(--gold); font-style: normal; }
        .cd-sub { text-align: center; max-width: 60ch; margin: 0 auto 2.75rem; color: #5d4c42; line-height: 1.85; font-size: clamp(0.95rem, 2vw, 1.05rem); }
        .cd-body { color: #4a3a31; line-height: 1.95; font-size: clamp(1rem, 2.1vw, 1.12rem); margin: 0 0 1.35rem; }
        .cd-body em { font-style: normal; font-weight: 600; color: var(--cocoa); box-shadow: inset 0 -0.45em 0 rgba(212,175,55,0.28); }
        .cd-body--strong { font-family: var(--font-heading); font-size: clamp(1.1rem, 2.6vw, 1.4rem); line-height: 1.55; color: var(--cocoa); }

        /* ── Act labels ───────────────────────────────────────────── */
        .cd-act__label { display: flex; align-items: baseline; gap: 0.85rem; margin-bottom: 1.6rem; }
        .cd-act__label b { flex: none; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #9a7a1f; padding: 0.35rem 0.75rem; border: 1px solid rgba(212,175,55,0.55); border-radius: 999px; }
        .cd-act__label i { font-style: normal; font-family: var(--font-heading); font-size: clamp(1.15rem, 3vw, 1.6rem); color: var(--cocoa); }
        .cd-act__label i::after { content: ''; display: block; height: 1px; margin-top: 0.4rem; background: linear-gradient(90deg, rgba(212,175,55,0.65), transparent); }

        /* ── HERO ─────────────────────────────────────────────────── */
        /* Two columns: the poster lives in the left one, the billing in the right. Nothing the
           photos do can reach the words, because they are in a column of their own. */
        .cd-hero { position: relative; overflow: hidden; background: #17100c; min-height: calc(100svh - 9rem); display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); align-items: center; gap: clamp(1rem, 3vw, 2.5rem); padding: clamp(2.5rem, 6vh, 4.5rem) max(clamp(1.25rem, 4vw, 3.5rem), calc((100% - 1240px) / 2)); }
        .cd-hero__bg { position: absolute; inset: 0; background: url("/dolly/hero-mata.webp") center 35%/cover; filter: brightness(0.36) saturate(0.85); transform: scale(1.06); }
        .cd-hero__veil { position: absolute; inset: 0; background: radial-gradient(70% 55% at 50% 45%, rgba(23,16,12,0.35), rgba(23,16,12,0.9) 75%), radial-gradient(45% 40% at 12% 10%, rgba(212,175,55,0.22), transparent 70%); }
        .cd-hero__photos { position: relative; z-index: 4; display: flex; justify-content: center; }
        /* As big as the column allows, but never taller than the screen under the site header: the whole poster, name plate included, is in view on a laptop. */
        .cd-hero__stage { position: relative; width: min(clamp(280px, 31vw, 500px), calc((100svh - 18rem) * 0.72)); }
        .cd-hero__poster { position: relative; z-index: 3; transform: rotate(-3.5deg); padding: 10px 10px 0; background: var(--cream); border: 1px solid rgba(212,175,55,0.65); border-radius: 14px; box-shadow: 0 34px 70px rgba(0,0,0,0.6); }
        .cd-hero__poster img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 8px; }
        .cd-hero__plate { display: block; padding: 0.7rem 0.3rem 0.85rem; text-align: center; }
        .cd-hero__plate b { display: block; font-family: var(--font-heading); font-size: 0.86rem; color: var(--cocoa); line-height: 1.3; text-wrap: balance; }
        .cd-hero__plate i { display: block; margin-top: 0.3rem; font-style: normal; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #9a7a1f; }
        .cd-hero__chip { position: absolute; width: 40%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; box-shadow: 0 20px 44px rgba(0,0,0,0.6); z-index: 4; }
        .cd-hero__chip--a { top: -7%; right: -20%; transform: rotate(9deg); }
        .cd-hero__chip--b { bottom: 20%; left: -22%; transform: rotate(-8deg); }
        .cd-hero__bill { position: relative; z-index: 6; text-align: center; max-width: 620px; margin: 0 auto; }
        .cd-hero__presents { display: block; color: rgba(253,250,243,0.75); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; }
        .cd-hero__name { font-family: var(--font-heading); font-size: clamp(2.6rem, 8.5vw, 5.4rem); line-height: 0.98; color: var(--cream); margin: 1.1rem 0 1rem; text-shadow: 0 6px 40px rgba(0,0,0,0.65); }
        .cd-hero__roles { display: block; color: var(--gold); font-size: clamp(0.72rem, 1.8vw, 0.85rem); font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
        .cd-hero__lead { color: rgba(253,250,243,0.9); font-size: clamp(1rem, 2.2vw, 1.15rem); line-height: 1.85; margin: 0 auto 1.75rem; max-width: 46ch; }
        .cd-hero__lead em { font-style: normal; color: var(--gold); }
        .cd-hero__tag { display: inline-block; padding: 0.6rem 1.35rem; border: 1px solid rgba(212,175,55,0.6); border-radius: 999px; color: var(--gold); font-family: var(--font-heading); font-size: clamp(0.85rem, 2vw, 1rem); }
        .cd-hero__cue { display: block; margin-top: 2.25rem; color: rgba(253,250,243,0.55); font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; }

        /* ── Cast ─────────────────────────────────────────────────── */
        .cd-cast { padding: clamp(3.5rem, 9vw, 6.5rem) 0; background: var(--cream); }
        .cd-cast__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.1rem; }
        .cd-cast__card { position: relative; height: 100%; padding: 2.4rem 1.35rem 1.5rem; background: #fff; border: 1px solid rgba(212,175,55,0.35); border-radius: 16px; box-shadow: 0 10px 30px rgba(60,42,33,0.06); }
        .cd-cast__num { position: absolute; top: 0.9rem; left: 1.35rem; font-family: var(--font-heading); font-size: 0.95rem; color: var(--gold); letter-spacing: 0.1em; }
        .cd-cast__card h3 { font-family: var(--font-heading); font-size: 1.1rem; color: var(--cocoa); margin: 0 0 0.55rem; }
        .cd-cast__card p { margin: 0; color: #5d4c42; font-size: 0.93rem; line-height: 1.75; }

        /* ── Acts ─────────────────────────────────────────────────── */
        .cd-act { padding: clamp(3.5rem, 9vw, 6rem) 0; }
        .cd-act--i { background: var(--cream); }
        .cd-act--iii { background: #f6efe2; }
        .cd-act--iv { background: var(--cream); }
        .cd-quote { margin: 2rem 0 0; padding: 0 0 0 1.5rem; border-left: 2px solid rgba(212,175,55,0.7); font-family: var(--font-heading); font-size: clamp(1.15rem, 3.2vw, 1.75rem); line-height: 1.5; color: var(--cocoa); position: relative; }
        .cd-quote em { font-style: normal; color: #9a7a1f; }
        .cd-quote__mark { position: absolute; left: 0.35rem; top: -1.6rem; font-size: 3.5rem; color: rgba(212,175,55,0.35); line-height: 1; }

        /* ── Act II: the quiet band ───────────────────────────────── */
        .cd-loss { background: #2b1e17; padding: clamp(5rem, 13vw, 9rem) 0; }
        .cd-loss .cd-act__label { justify-content: flex-start; }
        .cd-act__label--quiet b { color: rgba(253,250,243,0.6); border-color: rgba(253,250,243,0.25); }
        .cd-act__label--quiet i { color: rgba(253,250,243,0.9); }
        .cd-act__label--quiet i::after { background: linear-gradient(90deg, rgba(253,250,243,0.35), transparent); }
        .cd-loss__p { color: rgba(253,250,243,0.86); font-size: clamp(1.05rem, 2.4vw, 1.25rem); line-height: 2; margin: 0 0 1.75rem; max-width: 52ch; }
        .cd-loss__p--last { font-family: var(--font-heading); font-size: clamp(1.2rem, 3vw, 1.6rem); color: var(--cream); margin-bottom: 0; }

        /* ── Two-column acts ──────────────────────────────────────── */
        .cd-cross { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(1.75rem, 5vw, 4rem); align-items: center; }
        .cd-cross--flip .cd-cross__text { order: 2; }
        .cd-cross--flip .cd-cross__photo { order: 1; }
        .cd-frame { margin: 0; padding: 10px 10px 0; background: #fff; border: 1px solid rgba(212,175,55,0.45); border-radius: 18px; box-shadow: 0 26px 50px rgba(60,42,33,0.18); transform: rotate(1.5deg); }
        .cd-frame img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; }
        .cd-frame figcaption { padding: 0.85rem 0.4rem 1rem; text-align: center; }
        .cd-frame figcaption b { display: block; font-family: var(--font-heading); font-size: 1rem; color: var(--cocoa); }
        .cd-frame figcaption span { display: block; margin-top: 0.25rem; font-size: 0.78rem; color: #6d5c50; }
        .cd-passport { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.45rem 1rem 0.45rem 0.7rem; border: 1px solid rgba(212,175,55,0.6); border-radius: 999px; background: #fff; color: #7a5a14; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .cd-portrait { max-width: 400px; margin: 0 auto; padding: 10px; background: var(--cream); border: 1px solid rgba(212,175,55,0.5); border-radius: 18px; box-shadow: 0 26px 50px rgba(60,42,33,0.18); transform: rotate(-2deg); }
        .cd-portrait img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 10px; }

        /* ── Worlds ───────────────────────────────────────────────── */
        .cd-worlds { background: #34241c; padding: clamp(3.5rem, 9vw, 6.5rem) 0; position: relative; overflow: hidden; }
        .cd-worlds::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(55% 45% at 20% 0%, rgba(212,175,55,0.16), transparent 70%), radial-gradient(50% 45% at 90% 100%, rgba(0,156,59,0.12), transparent 70%); }
        .cd-worlds .cd-wrap { position: relative; }
        .cd-worlds__grid { display: grid; grid-template-columns: minmax(200px, 300px) 1fr; gap: clamp(1.75rem, 5vw, 3.5rem); align-items: center; margin-top: 2.5rem; }
        .cd-worlds__medal { text-align: center; }
        .cd-medal { display: block; width: min(100%, 260px); margin: 0 auto; aspect-ratio: 1; border-radius: 50%; padding: 7px; background: linear-gradient(140deg, rgba(212,175,55,0.95), rgba(212,175,55,0.25) 45%, rgba(212,175,55,0.9)); box-shadow: 0 24px 55px rgba(0,0,0,0.45); }
        .cd-medal img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .cd-medal__sig { display: block; margin-top: 1rem; font-family: var(--font-heading); font-size: 1.35rem; color: var(--gold); letter-spacing: 0.04em; }
        .cd-worlds__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.65rem; }
        .cd-worlds__list li { display: grid; grid-template-columns: auto 1fr; column-gap: 0.95rem; align-items: baseline; padding: 0.95rem 1.15rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.28); border-left: 3px solid rgba(212,175,55,0.75); border-radius: 12px; }
        .cd-worlds__n { grid-row: 1 / 3; font-family: var(--font-heading); font-size: 0.9rem; color: var(--gold); }
        .cd-worlds__list b { font-family: var(--font-heading); font-size: 1.02rem; color: var(--cream); }
        .cd-worlds__list li > span:last-child { font-size: 0.88rem; line-height: 1.6; color: rgba(253,250,243,0.72); }
        .cd-worlds__end { margin: 2.75rem auto 0; max-width: 40ch; text-align: center; font-family: var(--font-heading); font-size: clamp(1.05rem, 2.8vw, 1.45rem); line-height: 1.5; color: var(--gold); }

        /* ── Gallery wall ─────────────────────────────────────────── */
        .cd-gallery { background: #efe7db; padding: clamp(3.5rem, 9vw, 6.5rem) 0; }
        .cd-gallery__wall { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(1.25rem, 3.5vw, 2.25rem); }
        .cd-piece { margin: 0; }
        .cd-piece img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 6px; box-shadow: 0 20px 40px rgba(60,42,33,0.2); }
        .cd-piece figcaption { margin-top: 1rem; padding-left: 0.85rem; border-left: 2px solid rgba(212,175,55,0.8); }
        .cd-piece figcaption b { display: block; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cocoa); }
        .cd-piece figcaption span { display: block; margin-top: 0.3rem; font-size: 0.78rem; color: #6d5c50; font-style: italic; }

        /* ── Curtain ──────────────────────────────────────────────── */
        .cd-end { background: var(--cream); padding: clamp(3.5rem, 9vw, 6.5rem) 0 clamp(4rem, 10vw, 7rem); text-align: center; }
        .cd-bow { margin: 0 auto 2.25rem; width: min(100%, 270px); padding: 9px; background: #fff; border: 1px solid rgba(212,175,55,0.5); border-radius: 18px; box-shadow: 0 20px 44px rgba(60,42,33,0.16); transform: rotate(2deg); }
        .cd-bow img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 10px; }
        .cd-end__p { color: #4a3a31; font-size: clamp(1rem, 2.2vw, 1.15rem); line-height: 1.95; margin: 0 auto 1.5rem; max-width: 56ch; }
        .cd-end__p em { font-style: normal; font-weight: 600; color: var(--cocoa); box-shadow: inset 0 -0.45em 0 rgba(212,175,55,0.28); }
        .cd-end__p--small { font-size: clamp(0.95rem, 2vw, 1.05rem); color: #6d5c50; }
        .cd-end__welcome { font-family: var(--font-heading); font-size: clamp(1.3rem, 3.6vw, 2.1rem); color: var(--cocoa); margin: 0; }
        .cd-end__tag { font-family: var(--font-heading); font-size: clamp(1.05rem, 3vw, 1.6rem); color: #9a7a1f; letter-spacing: 0.02em; margin: 0 0 2.75rem; }
        .cd-end__doors { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.9rem; text-align: left; }
        .cd-door { display: block; min-height: 44px; padding: 1.1rem 1.25rem; background: #fff; border: 1px solid rgba(212,175,55,0.45); border-radius: 14px; text-decoration: none; box-shadow: 0 8px 22px rgba(60,42,33,0.07); }
        .cd-door b { display: block; font-family: var(--font-heading); font-size: 1rem; color: var(--cocoa); }
        .cd-door span { display: block; margin-top: 0.3rem; font-size: 0.85rem; color: #6d5c50; line-height: 1.55; }
        .cd-door--gold { background: var(--cocoa); border-color: rgba(212,175,55,0.7); }
        .cd-door--gold b { color: var(--gold); }
        .cd-door--gold span { color: rgba(253,250,243,0.8); }

        /* ── Tablet: the chips tuck in so the collage stays inside its column ── */
        @media (max-width: 1023px) {
          .cd-hero { gap: 1rem; padding: 3.5rem 1.25rem; }
          .cd-hero__stage { width: clamp(165px, 30vw, 240px); }
          .cd-hero__chip { width: 42%; }
          .cd-hero__chip--a { right: -12%; }
          .cd-hero__chip--b { left: -12%; }
        }

        /* ── Phone: the playbill photos come first, then the words ─── */
        @media (max-width: 767px) {
          .cd-hero { display: block; min-height: 0; padding: 1.5rem 0 3.25rem; }
          .cd-hero__bg { background-image: url("/dolly/hero-mata-sm.webp"); }
          .cd-hero__photos { margin-bottom: 1.75rem; }
          .cd-hero__stage { width: min(58%, 250px); }
          .cd-hero__poster { transform: rotate(-3deg); }
          .cd-hero__chip { width: 46%; }
          .cd-hero__chip--a { top: -4%; right: -24%; }
          .cd-hero__chip--b { bottom: 26%; left: -24%; }
          .cd-hero__plate b { font-size: 0.78rem; }
          .cd-hero__bill { padding: 0 1.25rem; }
          .cd-hero__cue { margin-top: 1.75rem; }
          .cd-cross, .cd-worlds__grid { grid-template-columns: 1fr; }
          .cd-cross--flip .cd-cross__text { order: 2; }
          .cd-cross--flip .cd-cross__photo { order: 1; }
          .cd-portrait { max-width: 340px; margin: 0 auto; }
          .cd-frame { transform: rotate(1deg); }
          .cd-worlds__medal { margin-bottom: 1.5rem; }
          .cd-medal { width: min(70%, 210px); }
          .cd-gallery__wall { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .cd-piece figcaption b { font-size: 0.72rem; letter-spacing: 0.1em; }
          .cd-piece figcaption span { font-size: 0.75rem; }
        }

        @media (max-width: 420px) {
          .cd-gallery__wall { grid-template-columns: 1fr; }
          .cd-act__label { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cd-hero__bg { transform: none; }
        }
      ` }} />
    </main>
  );
}
