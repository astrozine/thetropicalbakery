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
    title: 'SOS-free: sem sal, óleo e açúcar refinado',
    body: 'Alan Goldhamer, do TrueNorth Health Center, fala do trio sal, óleo e açúcar (em inglês, SOS) como o que mais vicia o paladar e esconde o sabor real dos ingredientes. Quando você tira os três, fruta, castanha e cacau passam a ter gosto de fruta, castanha e cacau. É por isso que as nossas caixas são SOS-free.',
  },
  {
    title: 'Onde a gente faz diferente',
    body: 'Não seguimos todas as regras deles, e não pedimos que você siga. O que a gente pegou foi a lógica: comida de verdade, densa em nutrientes e sem os três vilões do paladar. Depois disso, o critério é que seja gostoso e caiba numa rotina real. Sobremesa vegana e sem glúten, feita para dar prazer.',
  },
  {
    title: 'Como isso vira aprendizado nos retiros',
    body: 'Nos retiros, essa lógica vira aula prática: como montar um prato com a ideia dos G-BOMBS, como fazer as compras e ler rótulos, como preparar refeições veganas e sem sal, óleo e açúcar refinado para a semana, e como fazer sobremesas que combinam com tudo isso.',
  },
];

function VideoCard({ v }: { v: typeof VIDEOS[number] }) {
  const [play, setPlay] = useState(false);
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: '14px', overflow: 'hidden', background: '#1a1a1a' }}>
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={`${v.who} — vídeo do YouTube`}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlay(true)}
            aria-label={`Assistir vídeo com ${v.who}`}
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
        <span style={{ color: '#a89a90', fontSize: '0.75rem' }}>{v.source} · conteúdo público de terceiros no YouTube</span>
      </figcaption>
    </figure>
  );
}

export function InspirationSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="inspiracao" style={{ background: '#fdfaf3', padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <span style={{ color: '#a6832b', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
            Inspiração por trás da nossa dieta e do nosso pensamento
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#3c2a21', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Por que a gente come (e cozinha) assim
          </h2>
          <p style={{ color: '#594a42', fontSize: '1.08rem', lineHeight: 1.85, maxWidth: '720px', margin: '0 auto' }}>
            Boa parte das ideias por trás da Tropical Bakery vem de dois profissionais de saúde americanos que estudamos:
            o médico Joel Fuhrman, de Nova Jersey, e o Dr. Alan Goldhamer, fundador do TrueNorth Health Center, na Califórnia.
            A gente não segue todas as regras deles. Mas entender a lógica nos ajudou a nos sentirmos bem todos os dias,
            e queremos dividir esse raciocínio com você.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '3rem' }}>
          {IDEAS.map((idea, i) => {
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

        <div style={{ display: 'grid', gap: '1.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', marginBottom: '2.5rem' }}>
          {VIDEOS.map(v => <VideoCard key={v.id} v={v} />)}
        </div>

        <p style={{ background: '#f5efe2', border: '1px solid #e8e1d7', borderRadius: '14px', padding: '1.1rem 1.4rem', color: '#7a6a61', fontSize: '0.85rem', lineHeight: 1.75, margin: 0 }}>
          <strong style={{ color: '#3c2a21' }}>Importante:</strong> isto é inspiração, não aconselhamento médico ou nutricional. A Tropical Bakery é uma
          confeitaria e uma casa de retiros: não somos profissionais de saúde e não temos vínculo, parceria ou aval do Dr. Fuhrman ou do
          Dr. Goldhamer. Os vídeos são conteúdo público de terceiros, incorporados do YouTube. Antes de mudar sua alimentação, converse
          com seu médico ou nutricionista, principalmente se você tem alguma condição de saúde.
        </p>
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
        <span style={{ display: 'block', color: '#a6832b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
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
