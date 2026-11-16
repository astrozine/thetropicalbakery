'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/**
 * Videos are public third-party YouTube content, embedded on click (no
 * YouTube requests until someone chooses to play). Add more by appending here.
 */
const VIDEOS = [
  {
    id: 'A9jE_KzW6J0',
    who: 'Dr. Joel Fuhrman',
    credential: 'Médico de família com certificação nos EUA (MD), autor de vários best-sellers do New York Times e presidente da Nutritional Research Foundation. Atende em Nova Jersey.',
    caption: 'O que ele chama de dieta “nutritariana” e os seis grupos G-BOMBS.',
    source: 'Canal oficial do Dr. Fuhrman',
  },
  {
    id: 'Ls_sI4zdm_M',
    who: 'Dr. Alan Goldhamer',
    credential: 'Fundador do TrueNorth Health Center, em Santa Rosa, Califórnia: um centro de saúde com internação, focado em alimentação vegetal integral sem sal, óleo e açúcar e em jejum supervisionado.',
    caption: 'Por que sal, óleo e açúcar viciam o paladar, e como largar.',
    source: 'Entrevista do HappyCow',
  },
];

const IDEAS = [
  {
    title: 'G-BOMBS: o que entra no prato todo dia',
    body: 'Joel Fuhrman popularizou a sigla em inglês G-BOMBS: Greens (folhas), Beans (feijões e leguminosas), Onions (cebola, alho e afins), Mushrooms (cogumelos), Berries (frutas vermelhas) e Seeds (sementes e oleaginosas). A lógica é priorizar comida com muito nutriente para cada caloria. Na nossa cozinha isso aparece nas frutas vermelhas, nas sementes, nas oleaginosas e no cacau que a Dolly usa em quase tudo.',
  },
  {
    title: 'SOS-free: sem sal, sem óleo, sem açúcar refinado',
    body: 'Alan Goldhamer, do TrueNorth Health Center, fala do trio sal, óleo e açúcar (em inglês, SOS) como o que mais vicia o paladar e esconde o sabor real dos ingredientes. Quando você tira os três, fruta, castanha e cacau passam a ter gosto de fruta, castanha e cacau. É daí que vem o nosso jeito de fazer doce: sem sal, sem óleo e sem açúcar refinado, com a doçura vindo de tâmaras, frutas, açúcar de coco ou rapadura (no SOS-free mais rigoroso nem esses entram: esta é a nossa versão). A única exceção é o chocolate vegano que a Dolly usa em alguns doces, que vem pronto com açúcar e óleo, e a gente marca no próprio doce. Doce, para nós, é de ocasião especial: a ideia é celebrar sem bagunçar a saúde. (Não temos ligação com o Goldhamer nem com o TrueNorth: só acreditamos na ideia.)',
  },
  {
    title: 'Onde a gente faz diferente',
    body: 'Não seguimos todas as regras deles, e não pedimos que você siga. O que a gente pegou foi a lógica: comida de verdade, densa em nutrientes e com o mínimo possível dos três vilões do paladar. Depois disso, o critério é que seja gostoso e caiba numa rotina real. Sobremesa vegana e sem trigo, feita para dar prazer.',
  },
  {
    title: 'Como isso vira aprendizado nos retiros',
    body: 'Nos retiros, essa lógica vira aula prática: como montar um prato com a ideia dos G-BOMBS, como fazer as compras e ler rótulos, como preparar refeições veganas e sem sal, óleo e açúcar refinado para a semana, e como fazer sobremesas que combinam com tudo isso.',
  },
];

const VIDEOS_EN: typeof VIDEOS = [
  {
    id: 'A9jE_KzW6J0',
    who: 'Dr. Joel Fuhrman',
    credential: 'Board-certified family physician (MD) in the US, author of several New York Times best-sellers and president of the Nutritional Research Foundation. He practices in New Jersey.',
    caption: 'What he calls a “nutritarian” diet, and the six G-BOMBS groups.',
    source: 'Dr. Fuhrman’s official channel',
  },
  {
    id: 'Ls_sI4zdm_M',
    who: 'Dr. Alan Goldhamer',
    credential: 'Founder of TrueNorth Health Center in Santa Rosa, California: a residential health center focused on whole plant foods without salt, oil or sugar, and on supervised fasting.',
    caption: 'Why salt, oil and sugar hook the palate, and how to let them go.',
    source: 'HappyCow interview',
  },
];

const IDEAS_EN: typeof IDEAS = [
  {
    title: 'G-BOMBS: what goes on the plate every day',
    body: 'Joel Fuhrman popularized the acronym G-BOMBS: Greens, Beans (and other legumes), Onions (plus garlic and their relatives), Mushrooms, Berries and Seeds (and nuts). The idea is to favor food with lots of nutrients for each calorie. In our kitchen you see it in the berries, the seeds, the nuts and the cacao Dolly uses in almost everything.',
  },
  {
    title: 'SOS-free: no salt, no oil, no refined sugar',
    body: 'Alan Goldhamer, of TrueNorth Health Center, talks about salt, oil and sugar (SOS) as the trio that hooks the palate most and hides the real taste of the ingredients. Take all three out, and fruit, nuts and cacao start to taste like fruit, nuts and cacao. That is where our way of making sweets comes from: no salt, no oil and no refined sugar, with the sweetness coming from dates, fruit, coconut sugar or rapadura (in the strictest SOS-free eating even those are left out: this is our version). The one exception is the vegan chocolate Dolly uses in some treats, which comes ready-made with sugar and oil, and we mark it on the treat itself. For us, sweets are for special occasions: the idea is to celebrate without throwing your health off track. (We have no connection with Goldhamer or TrueNorth: we just believe in the idea.)',
  },
  {
    title: 'Where we do things differently',
    body: 'We don’t follow all of their rules, and we don’t ask you to. What we took is the thinking: real food, rich in nutrients, with as little as possible of the three things that trouble the palate most. After that, the test is that it tastes good and fits into real life. Vegan, wheat-free desserts, made for pleasure.',
  },
  {
    title: 'How this becomes learning at the retreats',
    body: 'At the retreats, this thinking becomes hands-on classes: how to build a plate around the G-BOMBS idea, how to shop and read labels, how to prepare vegan meals for the week without salt, oil or refined sugar, and how to make desserts that go with all of it.',
  },
];

const VIDEOS_ES: typeof VIDEOS = [
  {
    id: 'A9jE_KzW6J0',
    who: 'Dr. Joel Fuhrman',
    credential: 'Médico de familia certificado en EE. UU. (MD), autor de varios best-sellers del New York Times y presidente de la Nutritional Research Foundation. Atiende en Nueva Jersey.',
    caption: 'Lo que él llama dieta “nutritariana” y los seis grupos G-BOMBS.',
    source: 'Canal oficial del Dr. Fuhrman',
  },
  {
    id: 'Ls_sI4zdm_M',
    who: 'Dr. Alan Goldhamer',
    credential: 'Fundador del TrueNorth Health Center, en Santa Rosa, California: un centro de salud con internación, enfocado en alimentación vegetal integral sin sal, aceite ni azúcar y en ayuno supervisado.',
    caption: 'Por qué la sal, el aceite y el azúcar enganchan el paladar, y cómo dejarlos.',
    source: 'Entrevista de HappyCow',
  },
];

const IDEAS_ES: typeof IDEAS = [
  {
    title: 'G-BOMBS: lo que va al plato todos los días',
    body: 'Joel Fuhrman popularizó la sigla en inglés G-BOMBS: Greens (hojas verdes), Beans (frijoles y legumbres), Onions (cebolla, ajo y similares), Mushrooms (hongos), Berries (frutos rojos) y Seeds (semillas y frutos secos). La idea es priorizar comida con muchos nutrientes por cada caloría. En nuestra cocina eso se ve en los frutos rojos, las semillas, los frutos secos y el cacao que Dolly usa en casi todo.',
  },
  {
    title: 'SOS-free: sin sal, sin aceite, sin azúcar refinado',
    body: 'Alan Goldhamer, del TrueNorth Health Center, habla del trío sal, aceite y azúcar (en inglés, SOS) como lo que más engancha el paladar y esconde el sabor real de los ingredientes. Cuando quitas los tres, la fruta, los frutos secos y el cacao vuelven a saber a fruta, frutos secos y cacao. De ahí viene nuestra forma de hacer dulces: sin sal, sin aceite y sin azúcar refinado, con el dulzor de dátiles, frutas, azúcar de coco o rapadura (en el SOS-free más estricto ni esos entran: esta es nuestra versión). La única excepción es el chocolate vegano que Dolly usa en algunos dulces, que viene listo con azúcar y aceite, y lo marcamos en el propio dulce. Para nosotros, el dulce es de ocasión especial: la idea es celebrar sin descuidar la salud. (No tenemos relación con Goldhamer ni con TrueNorth: solo creemos en la idea.)',
  },
  {
    title: 'Dónde lo hacemos distinto',
    body: 'No seguimos todas sus reglas, y no te pedimos que las sigas. Lo que tomamos fue la lógica: comida de verdad, rica en nutrientes y con lo mínimo posible de los tres villanos del paladar. Después de eso, el criterio es que sea rico y quepa en una rutina real. Postres veganos y sin trigo, hechos para disfrutar.',
  },
  {
    title: 'Cómo se vuelve aprendizaje en los retiros',
    body: 'En los retiros, esta lógica se vuelve clase práctica: cómo armar un plato con la idea de los G-BOMBS, cómo hacer las compras y leer etiquetas, cómo preparar comidas veganas sin sal, aceite ni azúcar refinado para la semana, y cómo hacer postres que combinan con todo eso.',
  },
];

const COPY = {
  pt: {
    videos: VIDEOS,
    ideas: IDEAS,
    videoTitle: (who: string) => `${who} — vídeo do YouTube`,
    watch: (who: string) => `Assistir vídeo com ${who}`,
    thirdParty: 'conteúdo público de terceiros no YouTube',
    eyebrow: 'Inspiração por trás da nossa dieta e do nosso pensamento',
    title: 'Por que a gente come (e cozinha) assim',
    intro: 'Boa parte das ideias por trás da Tropical Bakery vem de dois profissionais de saúde americanos que estudamos: o médico Joel Fuhrman, de Nova Jersey, e o Dr. Alan Goldhamer, fundador do TrueNorth Health Center, na Califórnia. A gente não segue todas as regras deles. Mas entender a lógica nos ajudou a nos sentirmos bem todos os dias, e queremos dividir esse raciocínio com você.',
    more: 'Assistir aos vídeos e ler a nota completa',
    important: 'Importante:',
    disclaimer: 'isto é inspiração, não aconselhamento médico ou nutricional. A Tropical Bakery é uma confeitaria e uma casa de retiros: não somos profissionais de saúde e não temos vínculo, parceria ou aval do Dr. Fuhrman ou do Dr. Goldhamer. Os vídeos são conteúdo público de terceiros, incorporados do YouTube. Antes de mudar sua alimentação, converse com seu médico ou nutricionista, principalmente se você tem alguma condição de saúde.',
    short: 'Isto é inspiração, não aconselhamento médico. Sem vínculo com o Dr. Fuhrman ou o Dr. Goldhamer.',
  },
  en: {
    videos: VIDEOS_EN,
    ideas: IDEAS_EN,
    videoTitle: (who: string) => `${who} — YouTube video`,
    watch: (who: string) => `Watch the video with ${who}`,
    thirdParty: 'public third-party content on YouTube',
    eyebrow: 'The inspiration behind how we eat and think',
    title: 'Why we eat (and cook) this way',
    intro: 'Many of the ideas behind The Tropical Bakery come from two American health professionals we have studied: Dr. Joel Fuhrman, a physician in New Jersey, and Dr. Alan Goldhamer, founder of TrueNorth Health Center in California. We don’t follow all of their rules. But understanding their thinking has helped us feel good every day, and we want to share it with you.',
    more: 'Watch the videos and read the full note',
    important: 'Important:',
    disclaimer: 'this is inspiration, not medical or nutritional advice. The Tropical Bakery is a bakery and a retreat house: we are not health professionals, and we have no connection with, partnership with or endorsement from Dr. Fuhrman or Dr. Goldhamer. The videos are public third-party content, embedded from YouTube. Before changing the way you eat, talk to your doctor or dietitian, especially if you have a health condition.',
    short: 'This is inspiration, not medical advice. No affiliation with Dr. Fuhrman or Dr. Goldhamer.',
  },
  es: {
    videos: VIDEOS_ES,
    ideas: IDEAS_ES,
    videoTitle: (who: string) => `${who} — video de YouTube`,
    watch: (who: string) => `Ver el video con ${who}`,
    thirdParty: 'contenido público de terceros en YouTube',
    eyebrow: 'La inspiración detrás de nuestra forma de comer y de pensar',
    title: 'Por qué comemos (y cocinamos) así',
    intro: 'Buena parte de las ideas detrás de The Tropical Bakery viene de dos profesionales de la salud estadounidenses que estudiamos: el médico Joel Fuhrman, de Nueva Jersey, y el Dr. Alan Goldhamer, fundador del TrueNorth Health Center, en California. No seguimos todas sus reglas. Pero entender su lógica nos ayudó a sentirnos bien todos los días, y queremos compartir ese razonamiento contigo.',
    more: 'Ver los videos y leer la nota completa',
    important: 'Importante:',
    disclaimer: 'esto es inspiración, no consejo médico ni nutricional. The Tropical Bakery es una pastelería y una casa de retiros: no somos profesionales de la salud y no tenemos vínculo, alianza ni aval del Dr. Fuhrman ni del Dr. Goldhamer. Los videos son contenido público de terceros, insertados desde YouTube. Antes de cambiar tu alimentación, habla con tu médico o nutricionista, sobre todo si tienes alguna condición de salud.',
    short: 'Esto es inspiración, no consejo médico. Sin vínculo con el Dr. Fuhrman ni el Dr. Goldhamer.',
  },
};
type Copy = typeof COPY.pt;

function VideoCard({ v, t }: { v: typeof VIDEOS[number]; t: Copy }) {
  const [play, setPlay] = useState(false);
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: '14px', overflow: 'hidden', background: '#1a1a1a' }}>
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={t.videoTitle(v.who)}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlay(true)}
            aria-label={t.watch(v.who)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer', background: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url("https://i.ytimg.com/vi/${v.id}/hqdefault.jpg") center/cover` }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(253,250,243,0.95)', color: '#3c2a21', fontSize: '1.4rem', paddingLeft: '4px' }}>▶</span>
          </button>
        )}
      </div>
      <figcaption style={{ padding: '0.85rem 0.25rem 0' }}>
        <strong style={{ color: '#3c2a21', display: 'block', fontSize: '1rem' }}>{v.who}</strong>
        <span style={{ color: '#8a6d1f', fontSize: '0.82rem', lineHeight: 1.55, display: 'block', margin: '0.15rem 0 0.45rem' }}>{v.credential}</span>
        <span style={{ color: '#594a42', fontSize: '0.9rem', lineHeight: 1.6, display: 'block' }}>{v.caption}</span>
        <span style={{ color: '#a89a90', fontSize: '0.75rem' }}>{v.source} · {t.thirdParty}</span>
      </figcaption>
    </figure>
  );
}

export function InspirationSection({ locale = 'pt' }: { locale?: 'pt' | 'en' | 'es' } = {}) {
  const [open, setOpen] = useState<number | null>(null);
  const t = COPY[locale] ?? COPY.pt;

  return (
    <section id="inspiracao" style={{ background: '#fdfaf3', padding: 'clamp(2.25rem, 8vw, 7rem) clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <span style={{ color: '#a6832b', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
            {t.eyebrow}
          </span>
          <h2 data-sign-top="🌱" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#3c2a21', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            {t.title}
          </h2>
          <p style={{ color: '#594a42', fontSize: '1.08rem', lineHeight: 1.85, maxWidth: '720px', margin: '0 auto' }}>
            {t.intro}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {t.ideas.map((idea, i) => {
            const isOpen = open === i;
            return (
              <div key={idea.title} style={{ background: '#fff', border: isOpen ? '1px solid #d4af37' : '1px solid #e8e1d7', borderRadius: '16px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.4rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#3c2a21', fontSize: '1.05rem', fontWeight: 700 }}
                >
                  {idea.title}
                  <span aria-hidden style={{ color: '#d4af37', fontSize: '1.5rem', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                {isOpen && <p style={{ padding: '0 1.4rem 1.4rem', margin: 0, color: '#594a42', lineHeight: 1.85 }}>{idea.body}</p>}
              </div>
            );
          })}
        </div>

        {/* The two videos and the full note wait behind one tap (2026-11-13: the page got much shorter). */}
        <details className="insp-more">
          <summary>{t.more}</summary>
        <div style={{ display: 'grid', gap: '1.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', margin: '1.25rem 0 2rem' }}>
          {t.videos.map(v => <VideoCard key={v.id} v={v} t={t} />)}
        </div>

        <p style={{ background: '#f5efe2', border: '1px solid #e8e1d7', borderRadius: '14px', padding: '1.1rem 1.4rem', color: '#7a6a61', fontSize: '0.85rem', lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: '#3c2a21' }}>{t.important}</strong> {t.disclaimer}
        </p>
        </details>
        <p style={{ textAlign: 'center', color: '#7a6a61', fontSize: '0.85rem', margin: '0.6rem 0 0' }}>
          {t.short}
        </p>
        <style>{`
          .insp-more > summary { display: flex; justify-content: center; align-items: center; gap: 0.4rem; min-height: 44px; cursor: pointer; list-style: none; font-weight: 700; color: #2e4432; text-decoration: underline; text-underline-offset: 4px; }
          .insp-more > summary::-webkit-details-marker { display: none; }
          .insp-more > summary::after { content: '+'; font-size: 1.2rem; }
          .insp-more[open] > summary::after { content: '–'; }
        `}</style>
      </div>
    </section>
  );
}

/** A slim pointer to the full section, for pages where a whole section would be too much. */
export function InspirationTeaser({ href = '/retreats#inspiracao' }: { href?: string }) {
  return (
    <Link
      href={href}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto', padding: '1.25rem 1.6rem', background: '#f5efe2', border: '1px solid #e8e1d7', borderRadius: '16px', textDecoration: 'none' }}
    >
      <span>
        <span style={{ display: 'block', color: '#a6832b', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          Inspiração por trás da nossa dieta e do nosso pensamento
        </span>
        <span style={{ color: '#3c2a21', fontSize: '1rem', lineHeight: 1.5 }}>
          Conheça as ideias de Joel Fuhrman e Alan Goldhamer que moldaram o jeito como a gente cozinha.
        </span>
      </span>
      <span style={{ color: '#3c2a21', fontWeight: 700, whiteSpace: 'nowrap' }}>Ler mais →</span>
    </Link>
  );
}
