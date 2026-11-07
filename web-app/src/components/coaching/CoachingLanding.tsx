'use client';

import React from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import IconTile from '@/components/IconTile';
import WhatsAppGate from '@/components/WhatsAppGate';
import { trackMeta } from '@/lib/metaPixel';
import { DOLLY_CALENDLY_URL, STORE_WHATSAPP } from '@/lib/siteContact';

/*
 * The words come from Dolly herself: her Paradise Pantry guide (the six building blocks, where she shops, the
 * "Food Healing Studio" pages) and the Food Healing ad inside Sweet Escape. Prices are not on the page on purpose:
 * every plan is made to measure and Dolly gives the price on the free call.
 */

const WA_RESET = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Olá, Dolly! Quero saber mais sobre o The Daily Tropical Reset.')}`;
const WA_SOS = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Olá, Dolly! Quero saber mais sobre o Reset SOS: sem sal e sem óleo em 2 semanas.')}`;

/** Marie Kondo, for food: look at everything, thank and let go, give each thing its place. */
const KONDO = [
  { icon: '👀', title: 'Olhar tudo, sem julgamento', text: 'Sua rotina, seus horários, suas comidas favoritas, suas vontades e cada prateleira da despensa. Nada de culpa: a gente só olha.' },
  { icon: '🙏', title: 'Agradecer e deixar ir', text: 'O que não te nutre sai de casa com carinho, e cada coisa que sai ganha uma troca gostosa. Você não perde nada: você troca.' },
  { icon: '🫙', title: 'Dar um lugar a cada coisa', text: 'Potes de vidro, básicos sempre à mão e uma semana que se organiza sozinha. Fica só o que nutre e o que te faz feliz.' },
];

const STEPS = [
  { icon: '☎️', title: 'Conversa grátis de 30 minutos', text: 'A gente se conhece, você me conta onde está e aonde quer chegar. Sem compromisso.' },
  { icon: '🔍', title: 'Raio-X da sua rotina', text: 'Como você come hoje, seus pratos favoritos e as suas vontades. Para cada vontade, uma alternativa que você vai amar.' },
  { icon: '🧺', title: 'Destralhe da despensa', text: 'O que fica, o que sai e o que entra no lugar. Sua despensa vira um lugar que te ajuda, não que te sabota.' },
  { icon: '🛒', title: 'Compras sem confusão', text: 'Como montar a sua despensa saudável: o hortifruti primeiro, a cerealista depois, os rótulos que importam e a lista dos G-BOMBS.' },
  { icon: '🗓️', title: 'Seu plano semanal completo', text: 'Cardápio da semana inteira, meal-prep de domingo e os básicos do dia a dia, para nunca ficar sem saber o que comer.' },
  { icon: '👨‍👩‍👧', title: 'A família junto', text: 'Pratos que a casa toda come, crianças crescendo com uma energia calma em volta da comida e um ritmo que cabe na vida real.' },
];

const INCLUDES = [
  'Análise da sua rotina, comidas favoritas e vontades',
  'Alternativas saudáveis para cada vontade',
  'Planos de refeição semanais completos',
  'Como virar plant-based do jeito certo, sem deficiências',
  'Comer nutritariano e SOS free: sem sal, sem óleo, sem açúcar refinado',
  'Como fazer as compras e montar a despensa saudável',
  'Os G-BOMBS todos os dias, sem pensar',
  'Meal-prep e os básicos diários',
  'Como levar tudo isso para a família e as refeições em casa',
  'Passo a passo, no seu ritmo: sem sofrimento e sem tudo-ou-nada',
];

/** Dr. Joel Fuhrman's G-BOMBS: the foods that protect the most, every day. */
const GBOMBS = [
  { icon: '🥬', en: 'Greens', pt: 'Folhas verdes' },
  { icon: '🫘', en: 'Beans', pt: 'Feijões e grãos' },
  { icon: '🧅', en: 'Onions', pt: 'Cebola e alho' },
  { icon: '🍄', en: 'Mushrooms', pt: 'Cogumelos' },
  { icon: '🫐', en: 'Berries', pt: 'Frutas vermelhas' },
  { icon: '🌰', en: 'Seeds', pt: 'Sementes e castanhas' },
];

/** The six building blocks from Paradise Pantry, with the illustrations from the guide. */
const PANTRY = [
  { img: '/coaching/pantry-fats.webp', title: 'Gorduras boas e proteínas', text: 'Amêndoas, castanhas, chia, linhaça, cânhamo, coco, tofu.' },
  { img: '/coaching/pantry-sweet.webp', title: 'Doçura natural', text: 'Tâmaras, figos secos, damascos, banana, manga, maçã.' },
  { img: '/coaching/pantry-structure.webp', title: 'Base sem trigo', text: 'Aveia, farinha de amêndoas, de trigo-sarraceno, de coco.' },
  { img: '/coaching/pantry-flavors.webp', title: 'Sabores e especiarias', text: 'Frutas frescas, cacau, baunilha, canela, cravo, gengibre.' },
  { img: '/coaching/pantry-toppings.webp', title: 'Coberturas e texturas', text: 'Nibs de cacau, coco tostado, sementes, frutas liofilizadas.' },
  { img: '/coaching/pantry-color.webp', title: 'Cor e vibe', text: 'Beterraba, cúrcuma, espirulina, matcha, açaí, mirtilo.' },
];

const SOS_WEEKS = [
  { icon: '💧', title: 'Semana 1 · sem óleo', text: 'Refogar na água ou no caldo, assar sem untar, molhos cremosos de castanha e abacate. A gordura vem inteira, da planta.' },
  { icon: '🌿', title: 'Semana 2 · sem sal', text: 'Ervas, limão, especiarias, alho e o umami dos cogumelos. Em poucas semanas o paladar acorda e a comida volta a ter gosto de comida.' },
];

const FAQ = [
  { q: 'É online?', a: 'Sim. A conversa e os encontros são por vídeo, então dá para fazer de qualquer lugar. Quem está perto de Ubatuba pode combinar com a Dolly um encontro presencial.' },
  { q: 'Preciso virar vegana de uma vez?', a: 'Não. O Reset é passo a passo, no seu ritmo, sem tudo-ou-nada. Você começa pelo que é mais fácil para você e a gente vai trocando o resto com calma.' },
  { q: 'Funciona com marido e filhos que não querem mudar?', a: 'É exatamente por isso que existe a parte da família: pratos que todo mundo come, sem cozinhar duas vezes e sem briga na mesa.' },
  { q: 'Quanto custa?', a: 'Cada plano é feito sob medida. Na conversa grátis de 30 minutos a Dolly entende o que você precisa e te mostra as opções e o valor, sem pressão.' },
  { q: 'Substitui o meu médico ou nutricionista?', a: 'Não. O coaching é educação alimentar e mudança de hábitos. Se você tem uma condição de saúde ou toma remédios, continue com o seu médico e conte a ele sobre as mudanças.' },
];

function BookCall({ label, className, where }: { label: string; className?: string; where: string }) {
  return (
    <a
      href={DOLLY_CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackMeta('Schedule', { content_name: `Coaching: conversa grátis (${where})` })}
    >
      {label}
    </a>
  );
}

export default function CoachingLanding() {
  return (
    <main className="fc">
      {/* ── HERO: Dolly up front, the people she cooks for around her, over the Mata Atlântica ── */}
      <section className="fc-hero">
        <div className="fc-hero__bg" />
        <div className="fc-hero__inner">
          <div className="fc-hero__stage">
            <figure className="fc-hero__dolly">
              <img src="/coaching/dolly-hero.webp" alt="Dolly com uma bandeja dos seus doces, no jardim em Itamambuca" />
              <figcaption className="fc-hero__tag">
                <b>Dolly Van Dam</b>
                <span>Food Coach · Food Healing Studio</span>
              </figcaption>
            </figure>
            <img className="fc-pol fc-pol--talk" src="/coaching/people-talk.webp" alt="Amigas rindo à mesa com doces e chá" />
            <img className="fc-pol fc-pol--studio" src="/coaching/people-studio.webp" alt="Mulheres provando doces saudáveis depois da aula" />
            <img className="fc-pol fc-pol--treat" src="/coaching/treat-raspberry.webp" alt="Bliss balls de frutas vermelhas" />
          </div>
          <div className="fc-hero__content">
            <span className="fc-hero__kicker">Food Healing Studio · com a Food Coach Dolly</span>
            <h1 className="fc-hero__title">The Daily<br />Tropical Reset</h1>
            <p className="fc-hero__text">
              Um Marie Kondo dos seus hábitos alimentares e da sua despensa. Porque comer bem começa pelo que entra em casa.
            </p>
            <div className="fc-hero__hi">
              <img src="/coaching/dolly-face.webp" alt="" />
              <p>“Oi, eu sou a Dolly. Vamos arrumar a sua relação com a comida juntas, um passo de cada vez.”</p>
            </div>
            <BookCall label="Agendar minha conversa grátis" className="btn btn-secondary fc-hero__cta" where="topo" />
            <p className="fc-hero__note">30 minutos · online · sem compromisso</p>
            <span className="fc-hero__gift"><span aria-hidden>🎁</span> E-book Sweet Escape de presente</span>
          </div>
        </div>
      </section>

      {/* ── The feeling: her own words from the e-book, on photos of the women it is for ── */}
      <section className="fc-sec fc-feel">
        <ScrollReveal>
          <p className="fc-feel__lead">Talvez você esteja cansada de tanta neura com comida.</p>
        </ScrollReveal>
        <div className="fc-feel__grid">
          {[
            { img: '/coaching/people-table.webp', alt: 'Mulheres à mesa dividindo doces e frutas', text: 'Você quer alimentar melhor a sua família.' },
            { img: '/coaching/people-garden.webp', alt: 'Amigas num brunch no jardim', text: 'Você quer saúde sem obsessão.' },
            { img: '/coaching/people-street.webp', alt: 'Amigas na calçada dividindo uma caixa de doces saudáveis', text: 'Você quer equilíbrio, não sobrecarga.' },
          ].map((p, i) => (
            <ScrollReveal key={p.text} delay={i * 0.08}>
              <figure className="fc-feel__card">
                <img src={p.img} alt={p.alt} loading="lazy" />
                <figcaption>{p.text}</figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <h2 className="fc-feel__q">E se a comida finalmente parecesse <em>segura</em>?</h2>
          <p className="fc-feel__not">Não confusa. Não restritiva. Não algo que controla você.</p>
        </ScrollReveal>
      </section>

      {/* ── Marie Kondo, for food ── */}
      <section className="fc-sec fc-kondo">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="✨">O método</p>
          <h2 className="fc-h2">Fica só o que nutre e o que te faz feliz</h2>
          <p className="fc-intro">
            Comer bem começa no carrinho do mercado, não na força de vontade. Se não está em casa, você não come. Então a
            gente arruma a sua vida alimentar como quem arruma um armário: com calma, com carinho e por categoria.
          </p>
        </ScrollReveal>
        <div className="fc-kondo__grid">
          {KONDO.map((k, i) => (
            <ScrollReveal key={k.title} delay={i * 0.08}>
              <div className="fc-card">
                <IconTile size={52}>{k.icon}</IconTile>
                <h3>{k.title}</h3>
                <p>{k.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Step by step ── */}
      <section className="fc-sec fc-steps">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="🪜">Como funciona</p>
          <h2 className="fc-h2">Passo a passo, sem sofrimento</h2>
        </ScrollReveal>
        <ol className="fc-steps__list">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <ScrollReveal delay={i * 0.05}>
                <div className="fc-step">
                  <span className="fc-step__n">{i + 1}</span>
                  <IconTile size={46}>{s.icon}</IconTile>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Paradise Pantry: a real slice of her guide ── */}
      <section className="fc-sec fc-pantry">
        <ScrollReveal>
          <p className="fc-kicker" data-sign="🧺">Paradise Pantry</p>
          <h2 className="fc-h2">Eu compro ingredientes, não produtos</h2>
          <p className="fc-intro">
            Se cresce da terra, tem fibra e ainda parece com o que era, tem lugar no meu carrinho. Monte a sua despensa em
            volta destes seis blocos e você nunca mais vai ficar perdida no mercado. Você simplesmente reconhece o que pertence.
          </p>
        </ScrollReveal>
        <div className="fc-pantry__grid">
          {PANTRY.map((p, i) => (
            <ScrollReveal key={p.title} delay={(i % 3) * 0.06}>
              <figure className="fc-block">
                <img src={p.img} alt={p.title} loading="lazy" />
                <figcaption>
                  <span className="fc-block__n">{i + 1}</span>
                  <b>{p.title}</b>
                  <span>{p.text}</span>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <div className="fc-shop">
            <div><IconTile size={42}>🥭</IconTile><p><b>1º o hortifruti.</b> Frutas da estação, folhas, legumes coloridos e ervas frescas. O fresco não é acompanhamento, é a base.</p></div>
            <div><IconTile size={42}>🌾</IconTile><p><b>2º a cerealista.</b> A granel, na quantidade certa, com menos embalagem e mais qualidade.</p></div>
            <div><IconTile size={42}>🫙</IconTile><p><b>Em casa, potes de vidro.</b> Uma despensa bonita, sem tóxicos, onde tudo fica à vista.</p></div>
          </div>
          <p className="fc-pantry__more">O guia completo Paradise Pantry vem com o seu coaching.</p>
        </ScrollReveal>
      </section>

      {/* ── Nutritarian, SOS free, G-BOMBS ── */}
      <section className="fc-sec fc-gb">
        <ScrollReveal>
          <p className="fc-kicker fc-kicker--light" data-sign="💚">Nutritariano e SOS free</p>
          <h2 className="fc-h2 fc-h2--light">O máximo de nutrientes em cada garfada</h2>
          <p className="fc-intro fc-intro--light">
            Nutritariano é escolher os alimentos com mais vitaminas, minerais, fibras e antioxidantes por caloria. SOS free é
            sem sal, sem óleo e sem açúcar refinado. E todo dia entram no prato os G-BOMBS, os alimentos que mais protegem:
          </p>
        </ScrollReveal>
        <div className="fc-gb__grid">
          {GBOMBS.map((g, i) => (
            <ScrollReveal key={g.en} delay={i * 0.05}>
              <div className="fc-gb__item">
                <IconTile size={56}>{g.icon}</IconTile>
                <b><span className="fc-gb__letter">{g.en[0]}</span>{g.en.slice(1)}</b>
                <span>{g.pt}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Everything that's inside ── */}
      <section className="fc-sec fc-inc">
        <div className="fc-inc__wrap">
          <ScrollReveal>
            <img className="fc-inc__photo" src="/coaching/treat-cheesecake.webp" alt="Cheesecake da Dolly com calda de frutas vermelhas" loading="lazy" />
          </ScrollReveal>
          <ScrollReveal>
            <p className="fc-kicker" data-sign="📋">No seu Reset</p>
            <h2 className="fc-h2 fc-h2--start">Tudo o que a gente constrói junto</h2>
            <ul className="fc-inc__list">
              {INCLUDES.map(t => <li key={t}>{t}</li>)}
            </ul>
            <p className="fc-inc__end">E o mais importante: estabilidade por dentro. Porque quando a comida parece segura, todo o resto fica mais leve.</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── The separate 2-week package ── */}
      <section id="sos" className="fc-sec fc-sos">
        <ScrollReveal>
          <div className="fc-sos__card">
            <span className="fc-sos__badge">Pacote à parte · 14 dias</span>
            <h2 className="fc-h2 fc-h2--start">Reset SOS: sem sal e sem óleo em 2 semanas</h2>
            <p className="fc-sos__lead">
              Para quem quer dar um passo só, bem dado. Duas semanas guiadas, com lista de compras, cardápio dia a dia e a
              Dolly acompanhando você.
            </p>
            <div className="fc-sos__weeks">
              {SOS_WEEKS.map(w => (
                <div key={w.title} className="fc-sos__week">
                  <IconTile size={44}>{w.icon}</IconTile>
                  <div><b>{w.title}</b><p>{w.text}</p></div>
                </div>
              ))}
            </div>
            <WhatsAppGate href={WA_SOS} topic="Coaching: Reset SOS 2 semanas" tags={['cursos']} className="btn btn-primary fc-sos__cta">
              Quero o Reset SOS
            </WhatsAppGate>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Dolly ── */}
      <section className="fc-sec fc-dolly">
        <div className="fc-dolly__wrap">
          <ScrollReveal>
            <img className="fc-dolly__photo" src="/coaching/dolly-spatula.webp" alt="Dolly Van Dam com a espátula e uma bandeja de doces" loading="lazy" />
          </ScrollReveal>
          <ScrollReveal>
            <p className="fc-kicker" data-sign="👩‍🍳">Sua Food Coach</p>
            <h2 className="fc-h2 fc-h2--start">Eu também já tive medo de comer</h2>
            <p>
              Como bailarina profissional, aprendi a controlar cada caloria, cada mordida, as formas do meu corpo. Isso me
              desconectou do prazer de comer. Aos poucos eu me curei, e você também vai se curar.
            </p>
            <p>
              Hoje eu vivo na Mata Atlântica, em Itamambuca, e cozinho tudo do zero, só com plantas. A comida não precisa ser
              temida nem proibida: ela pode ser prazerosa e gentil ao mesmo tempo.
            </p>
            <Link href="/dolly" className="fc-link">Conheça a história da Dolly →</Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Gifts + the way in ── */}
      <section id="conversa" className="fc-final">
        <div className="fc-final__bg" />
        <ScrollReveal>
          <div className="fc-final__inner">
            <p className="fc-final__kicker">Entre no estúdio</p>
            <h2 className="fc-final__title">Comece com dois presentes</h2>
            <div className="fc-gifts">
              <div className="fc-gift">
                <IconTile size={54}>☎️</IconTile>
                <b>Conversa grátis de 30 minutos</b>
                <span>Online, com a Dolly. A gente olha a sua rotina e o primeiro passo.</span>
              </div>
              <div className="fc-gift">
                <IconTile size={54}>📖</IconTile>
                <b>E-book Sweet Escape</b>
                <span>7 cores, 7 doces plant-based sem açúcar refinado, de presente para você.</span>
              </div>
            </div>
            <BookCall label="Agendar minha conversa grátis" className="btn btn-secondary fc-final__cta" where="final" />
            <p className="fc-final__or">
              Prefere conversar antes?{' '}
              <WhatsAppGate href={WA_RESET} topic="Coaching: The Daily Tropical Reset" tags={['cursos']} className="fc-final__wa">
                Fale com a Dolly no WhatsApp
              </WhatsAppGate>
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FAQ ── */}
      <section className="fc-sec fc-faq">
        <p className="fc-kicker" data-sign="💬">Dúvidas</p>
        <h2 className="fc-h2">Bom saber</h2>
        <div className="fc-faq__list">
          {FAQ.map(f => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </main>
  );
}

const CSS = `
.fc { background: var(--color-background); color: var(--color-text); overflow-x: hidden; }
.fc img { max-width: 100%; }
.fc-sec { padding: clamp(3.5rem, 8vw, 6rem) 1.25rem; max-width: 1100px; margin: 0 auto; }
.fc-kicker { display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: #b8921f; letter-spacing: 3px; text-transform: uppercase; font-size: 0.8rem; font-weight: 700; margin: 0 0 0.9rem; }
.fc-kicker--light { color: #e7c75a; }
.fc-h2 { font-family: var(--font-heading); font-size: clamp(1.45rem, 3.6vw, 2.5rem); line-height: 1.2; text-align: center; color: var(--color-primary); margin: 0 auto 1.1rem; max-width: 760px; }
.fc-h2--start { text-align: left; margin-left: 0; }
.fc-h2--light { color: #fdfaf3; }
.fc-intro { text-align: center; max-width: 680px; margin: 0 auto 2.5rem; line-height: 1.75; color: #594a42; font-size: 1.05rem; }
.fc-intro--light { color: rgba(253,250,243,0.85); }

/* Hero */
.fc-hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; background: #16201a; }
.fc-hero__bg { position: absolute; inset: 0; background: url("/dolly/hero-mata.webp") center / cover; filter: brightness(0.38) saturate(1.1); transform: scale(1.05); }
.fc-hero__inner { position: relative; z-index: 2; width: 100%; max-width: 1240px; margin: 0 auto; padding: 7rem 2rem 4.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 5vw, 5rem); align-items: center; }
/* Dolly in an arched frame, with the people she cooks for pinned around her like photos on a fridge. */
.fc-hero__stage { position: relative; width: min(100%, 470px); justify-self: center; padding: 2.5rem 3.5rem 3.5rem; }
.fc-hero__dolly { position: relative; margin: 0; z-index: 2; }
.fc-hero__dolly img { display: block; width: 100%; aspect-ratio: 3 / 4; object-fit: cover; object-position: center 20%; border-radius: 999px 999px 26px 26px; border: 6px solid #fdfaf3; box-shadow: 0 34px 70px rgba(0,0,0,0.55); }
.fc-hero__tag { position: absolute; left: 50%; bottom: -1.4rem; transform: translateX(-50%) rotate(-2deg); background: #fdfaf3; border: 1px solid rgba(212,175,55,0.7); border-radius: 14px; padding: 0.6rem 1.2rem; text-align: center; white-space: nowrap; box-shadow: 0 14px 30px rgba(0,0,0,0.4); }
.fc-hero__tag b { display: block; font-family: var(--font-heading); color: #3c2a21; font-size: 1rem; }
.fc-hero__tag span { font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase; color: #b8921f; font-weight: 700; }
.fc-pol { position: absolute; z-index: 3; object-fit: cover; border: 5px solid #fdfaf3; border-radius: 16px; box-shadow: 0 22px 44px rgba(0,0,0,0.5); }
.fc-pol--talk { top: 0; left: -1rem; width: 40%; aspect-ratio: 1; transform: rotate(-8deg); }
.fc-pol--studio { bottom: 3.5rem; right: -1.5rem; width: 38%; aspect-ratio: 4 / 5; transform: rotate(7deg); }
.fc-pol--treat { top: 1.5rem; right: 0; width: 25%; aspect-ratio: 1; border-radius: 50%; transform: rotate(6deg); }
.fc-hero__content { text-align: left; display: flex; flex-direction: column; align-items: flex-start; }
.fc-hero__hi { display: flex; gap: 0.8rem; align-items: center; background: rgba(253,250,243,0.1); border: 1px solid rgba(212,175,55,0.35); border-radius: 18px; padding: 0.7rem 1rem 0.7rem 0.7rem; margin: 0 0 1.6rem; max-width: 500px; backdrop-filter: blur(4px); }
.fc-hero__hi img { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid #d4af37; flex-shrink: 0; }
.fc-hero__hi p { margin: 0; color: #fdfaf3; font-style: italic; font-size: 0.95rem; line-height: 1.5; }
.fc-hero__kicker { color: #d4af37; letter-spacing: 3px; text-transform: uppercase; font-size: 0.8rem; font-weight: 700; padding-bottom: 0.55rem; border-bottom: 1px solid rgba(212,175,55,0.45); margin-bottom: 1.4rem; }
.fc-hero__title { font-family: var(--font-heading); color: #fff; font-size: clamp(2.2rem, 7vw, 5.2rem); line-height: 1.08; margin: 0 0 1.3rem; text-shadow: 0 4px 30px rgba(0,0,0,0.5); }
.fc-hero__text { color: rgba(255,255,255,0.88); font-size: clamp(1.02rem, 2vw, 1.25rem); line-height: 1.75; font-weight: 300; max-width: 540px; margin: 0 0 1.6rem; }
.fc-hero__cta { padding: 1rem 2.4rem; font-size: 1.05rem; letter-spacing: 1px; }
.fc-hero__note { color: rgba(255,255,255,0.7); font-size: 0.85rem; margin: 0.8rem 0 1.2rem; }
.fc-hero__gift { display: inline-flex; gap: 0.5rem; align-items: center; background: rgba(253,250,243,0.96); color: #3c2a21; border: 1px solid rgba(212,175,55,0.7); border-radius: 999px; padding: 0.5rem 1.1rem; font-size: 0.88rem; font-weight: 600; box-shadow: 0 10px 24px rgba(0,0,0,0.35); }

/* The feeling */
.fc-feel { text-align: center; }
.fc-feel__lead { font-family: var(--font-heading); font-size: clamp(1.15rem, 2.6vw, 1.6rem); color: #3c2a21; margin: 0 0 2rem; }
.fc-feel__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; margin: 0 0 3rem; }
.fc-feel__card { position: relative; margin: 0; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 50px -24px rgba(60,42,33,0.55); }
.fc-feel__card img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
.fc-feel__card figcaption { position: absolute; inset: auto 0 0 0; padding: 3.5rem 1.2rem 1.2rem; background: linear-gradient(to top, rgba(30,20,15,0.85), transparent); color: #fff; font-family: var(--font-heading); font-size: 1rem; line-height: 1.35; text-align: left; }
.fc-feel__q { font-family: var(--font-heading); font-size: clamp(1.6rem, 4.4vw, 2.8rem); line-height: 1.2; color: #2e4432; margin: 0 0 1rem; }
.fc-feel__q em { font-style: normal; color: #b8921f; }
.fc-feel__not { color: #8a6a3c; font-style: italic; font-size: 1.1rem; margin: 0; }

/* Cards */
.fc-kondo__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
.fc-card { background: #fff; border: 1px solid rgba(60,42,33,0.08); border-radius: 22px; padding: 1.8rem 1.5rem; height: 100%; box-shadow: 0 14px 34px -18px rgba(60,42,33,0.3); }
.fc-card h3 { font-family: var(--font-heading); font-size: 1.1rem; color: #3c2a21; margin: 1rem 0 0.5rem; }
.fc-card p { margin: 0; color: #594a42; line-height: 1.65; }

/* Steps */
.fc-steps { max-width: 820px; }
.fc-steps__list { list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: 0.9rem; }
.fc-step { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: start; background: #fff; border-radius: 18px; padding: 1.2rem 1.2rem 1.2rem 1.4rem; border: 1px solid rgba(60,42,33,0.08); }
.fc-step__n { position: absolute; top: -0.55rem; left: -0.55rem; width: 1.7rem; height: 1.7rem; border-radius: 50%; background: #d4af37; color: #3c2a21; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
.fc-step h3 { font-family: var(--font-heading); font-size: 1.02rem; margin: 0.2rem 0 0.35rem; color: #3c2a21; }
.fc-step p { margin: 0; color: #594a42; line-height: 1.6; }

/* Pantry */
.fc-pantry { max-width: 1180px; }
.fc-pantry__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.1rem; }
.fc-block { margin: 0; background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(60,42,33,0.08); height: 100%; display: flex; flex-direction: column; }
.fc-block img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.fc-block figcaption { padding: 1rem 1.1rem 1.2rem; display: grid; gap: 0.3rem; position: relative; }
.fc-block b { font-family: var(--font-heading); font-size: 0.98rem; color: #2e4432; }
.fc-block span { color: #594a42; font-size: 0.92rem; line-height: 1.5; }
.fc-block .fc-block__n { position: absolute; top: -1.1rem; right: 1rem; width: 2rem; height: 2rem; border-radius: 50%; background: #2e4432; color: #fdfaf3; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid #fdfaf3; }
.fc-shop { margin-top: 2.2rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.fc-shop > div { display: flex; gap: 0.9rem; align-items: flex-start; background: #f4ecdc; border-radius: 18px; padding: 1.1rem; }
.fc-shop p { margin: 0; line-height: 1.55; color: #3c2a21; font-size: 0.95rem; }
.fc-pantry__more { text-align: center; margin: 1.6rem 0 0; color: #8a6a3c; font-weight: 600; }

/* G-BOMBS */
.fc-gb { max-width: none; background: linear-gradient(160deg, #2e4432 0%, #22342a 100%); }
.fc-gb > * { max-width: 1000px; margin-left: auto; margin-right: auto; }
.fc-gb__grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.9rem; }
.fc-gb__item { text-align: center; background: rgba(253,250,243,0.06); border: 1px solid rgba(212,175,55,0.3); border-radius: 18px; padding: 1.2rem 0.6rem; display: grid; justify-items: center; gap: 0.45rem; height: 100%; }
.fc-gb__item b { color: #fdfaf3; font-family: var(--font-heading); font-size: 0.95rem; margin-top: 0.3rem; }
.fc-gb__letter { color: #e7c75a; font-size: 1.25rem; }
.fc-gb__item > span { color: rgba(253,250,243,0.75); font-size: 0.85rem; }

/* Includes */
.fc-inc__wrap { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: clamp(1.5rem, 5vw, 4rem); align-items: center; }
.fc-inc__photo { width: 100%; border-radius: 26px; transform: rotate(-2.5deg); box-shadow: 0 30px 60px -20px rgba(60,42,33,0.5); border: 6px solid #fff; }
.fc-inc .fc-kicker { justify-content: flex-start; }
.fc-inc__list { list-style: none; padding: 0; margin: 0 0 1.4rem; display: grid; gap: 0.55rem; }
.fc-inc__list li { position: relative; padding-left: 1.9rem; line-height: 1.55; color: #3c2a21; }
.fc-inc__list li::before { content: '✓'; position: absolute; left: 0; top: 0.05rem; width: 1.3rem; height: 1.3rem; border-radius: 50%; background: #2e4432; color: #fdfaf3; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.fc-inc__end { font-style: italic; color: #8a6a3c; line-height: 1.7; margin: 0; }

/* SOS package */
.fc-sos { max-width: 900px; }
.fc-sos__card { position: relative; background: #fff; border: 2px solid #d4af37; border-radius: 28px; padding: clamp(1.6rem, 4vw, 2.8rem); box-shadow: 0 30px 60px -30px rgba(60,42,33,0.45); }
.fc-sos__badge { display: inline-block; background: #3c2a21; color: #e7c75a; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-radius: 999px; padding: 0.4rem 0.95rem; margin-bottom: 1rem; }
.fc-sos__lead { color: #594a42; line-height: 1.7; margin: 0 0 1.5rem; }
.fc-sos__weeks { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.8rem; }
.fc-sos__week { display: flex; gap: 0.9rem; align-items: flex-start; background: #f8f3e8; border-radius: 18px; padding: 1.1rem; }
.fc-sos__week b { font-family: var(--font-heading); font-size: 0.95rem; color: #2e4432; }
.fc-sos__week p { margin: 0.35rem 0 0; color: #594a42; line-height: 1.55; font-size: 0.94rem; }
.fc-sos__cta { display: inline-flex; }

/* Dolly */
.fc-dolly__wrap { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: clamp(1.5rem, 5vw, 4rem); align-items: center; }
.fc-dolly__photo { width: 100%; border-radius: 26px; transform: rotate(2deg); box-shadow: 0 30px 60px -20px rgba(60,42,33,0.5); border: 6px solid #fff; }
.fc-dolly .fc-kicker { justify-content: flex-start; }
.fc-dolly p { line-height: 1.75; color: #594a42; }
.fc-link { color: #2e4432; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }

/* Final */
.fc-final { position: relative; padding: clamp(4rem, 9vw, 7rem) 1.25rem; overflow: hidden; background: #2a1d16; text-align: center; }
.fc-final__bg { position: absolute; inset: 0; background: url("/coaching/treat-chocolate.webp") center / cover; filter: brightness(0.3) blur(2px); transform: scale(1.08); }
.fc-final__inner { position: relative; max-width: 760px; margin: 0 auto; }
.fc-final__kicker { color: #d4af37; letter-spacing: 4px; text-transform: uppercase; font-size: 0.82rem; font-weight: 700; margin: 0 0 0.8rem; }
.fc-final__title { font-family: var(--font-heading); color: #fff; font-size: clamp(1.6rem, 4.4vw, 2.8rem); margin: 0 0 2rem; }
.fc-gifts { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2.2rem; }
.fc-gift { background: rgba(253,250,243,0.97); color: #3c2a21; border: 1px solid rgba(212,175,55,0.7); border-radius: 20px; padding: 1.4rem 1.2rem; display: grid; justify-items: center; gap: 0.5rem; }
.fc-gift b { font-family: var(--font-heading); font-size: 1rem; margin-top: 0.3rem; }
.fc-gift span { color: #594a42; font-size: 0.92rem; line-height: 1.5; }
.fc-final__cta { padding: 1rem 2.4rem; font-size: 1.05rem; }
.fc-final__or { color: rgba(255,255,255,0.8); margin: 1.3rem 0 0; font-size: 0.95rem; }
.fc-final__wa { color: #e7c75a; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; background: none; border: 0; cursor: pointer; font: inherit; padding: 0; }

/* FAQ */
.fc-faq { max-width: 780px; }
.fc-faq__list { display: grid; gap: 0.7rem; margin-top: 1.4rem; }
.fc-faq details { background: #fff; border: 1px solid rgba(60,42,33,0.1); border-radius: 16px; padding: 1rem 1.2rem; }
.fc-faq summary { cursor: pointer; font-weight: 700; color: #3c2a21; }
.fc-faq details p { margin: 0.7rem 0 0; color: #594a42; line-height: 1.65; }

/* Tablets */
@media (max-width: 900px) {
  .fc-pantry__grid { grid-template-columns: repeat(2, 1fr); }
  .fc-gb__grid { grid-template-columns: repeat(3, 1fr); }
  .fc-shop { grid-template-columns: 1fr; }
}

/* Phones: the photos get their own little collage above the words, so nothing covers the text. */
@media (max-width: 767px) {
  .fc-hero { display: block; min-height: 0; }
  .fc-hero__inner { grid-template-columns: 1fr; gap: 2.2rem; padding: 6rem 1.25rem 3rem; }
  .fc-hero__stage { width: min(100%, 360px); padding: 1.5rem 2.6rem 2.4rem; }
  .fc-pol { border-width: 4px; border-radius: 12px; }
  .fc-pol--talk { left: -0.25rem; }
  .fc-pol--studio { right: -0.5rem; bottom: 2.6rem; }
  .fc-hero__tag { padding: 0.5rem 1rem; }
  .fc-hero__tag b { font-size: 0.9rem; }
  .fc-hero__tag span { font-size: 0.62rem; letter-spacing: 1px; }
  .fc-hero__content { text-align: center; align-items: center; }
  .fc-hero__hi { text-align: left; }
  .fc-hero__kicker { font-size: 0.7rem; letter-spacing: 2px; }
  .fc-feel__grid { grid-template-columns: 1fr; gap: 1rem; max-width: 380px; margin-left: auto; margin-right: auto; }
  .fc-feel__card img { aspect-ratio: 4 / 3; }
  .fc-hero__cta { width: 100%; max-width: 340px; padding: 1rem 1.2rem; }
  .fc-pantry__grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .fc-block figcaption { padding: 0.85rem 0.8rem 1rem; }
  .fc-block b { font-size: 0.85rem; }
  .fc-block span { font-size: 0.8rem; }
  .fc-gb__grid { grid-template-columns: repeat(2, 1fr); }
  .fc-inc__wrap, .fc-dolly__wrap { grid-template-columns: 1fr; }
  .fc-inc__photo, .fc-dolly__photo { max-width: 300px; margin: 0 auto; display: block; }
  .fc-h2--start { text-align: center; }
  .fc-inc .fc-kicker, .fc-dolly .fc-kicker { justify-content: center; }
  .fc-sos__weeks, .fc-gifts { grid-template-columns: 1fr; }
  .fc-sos__cta { width: 100%; justify-content: center; }
  .fc-final__cta { width: 100%; max-width: 340px; }
}
`;
