'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import WhatsAppGate from '@/components/WhatsAppGate';
import BrunchEventCard, { loadBrunches } from './BrunchEventCard';
import { BRUNCH_CSS } from './brunchStyles';
import { CIRCLE_PERKS, DEFAULT_INCLUDES, HOST, VENUE_KINDS, isUpcoming, type Availability, type BrunchEvent } from '@/lib/brunch';

const WHO = [
  '🥗 Nutricionistas', '🧘‍♀️ Professoras de yoga e pilates', '💆‍♀️ Terapeutas', '👩‍🍳 Chefs e confeiteiras',
  '🌿 Naturopatas', '💪 Personal trainers', '🛍️ Empreendedoras do bem-estar', '✨ Quem quer entrar nesse mundo',
];

const MOMENTS = [
  { img: '/email/tile-brunch-box.jpg', title: 'Chegada, chá e a mesa da Dolly', text: 'Doces saudáveis feitos para aquele dia, frutas da estação, chás e cafés. Você prova antes de todo mundo.' },
  { img: '/email/tile-brunch-talk.jpg', title: 'A roda de conversa', text: 'Um tema por brunch: como viver de saúde e bem-estar, vender o que você sabe, cuidar de você enquanto cuida dos outros.' },
  { img: '/email/tile-brunch-toast.jpg', title: 'Conexões de verdade', text: 'Mesa pequena de propósito. Você sai conhecendo cada pessoa: o que ela faz e com o que pode te ajudar.' },
  { img: '/brunch/brunch-mesa.webp', title: 'O depois', text: 'Uma caixinha de doces para casa e o grupo do brunch, com a Dolly lá dentro, para a conversa continuar.' },
];

const FAQ = [
  { q: 'Como funciona a compra?', a: 'Os lugares são por ordem de pagamento: quem paga primeiro, garante. No Pix o seu lugar fica guardado por 24 horas enquanto o pagamento não cai; no cartão a confirmação é na hora. Lotou? Você entra na lista de espera e é avisada se abrir um lugar.' },
  { q: 'Onde é? Por que o endereço só aparece depois?', a: 'Cada brunch acontece num lugar especial da região: a casa da Dolly em Itamambuca, uma pousada parceira, uma praia, um restaurante ou um espaço com música e pop-ups. A página de cada brunch diz o tipo de lugar; o endereço exato e como chegar aparecem na sua sala assim que o pagamento é confirmado.' },
  { q: 'É só para mulheres?', a: 'Os brunches são pensados para mulheres que trabalham ou querem trabalhar com saúde e bem-estar, mas a mesa é aberta a quem chega com respeito e vontade de trocar.' },
  { q: 'Tem opção para quem tem restrição?', a: 'Tudo o que a Dolly serve é vegano e as receitas não levam glúten. Avise as suas alergias no seu perfil em Minha Conta e a cozinha confere antes.' },
  { q: 'E se eu não puder ir?', a: 'Avise a gente pelo WhatsApp o quanto antes. Se alguém da lista de espera ficar com o seu lugar, a Dolly combina com você o que fazer.' },
  { q: 'Como uso o crédito na assinatura?', a: 'Em Minha Conta, no seu ingresso, toque em "Usar meu crédito". Assinando o plano Anual da Caixa de Degustação em até 30 dias depois do brunch, o valor do ingresso sai da sua primeira mensalidade.' },
];

export default function BrunchLanding() {
  const [events, setEvents] = useState<BrunchEvent[] | null>(null);
  const [avail, setAvail] = useState<Record<string, Availability>>({});
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notified, setNotified] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  useEffect(() => {
    loadBrunches().then(r => { setEvents(r.events); setAvail(r.avail); }).catch(() => setEvents([]));
  }, []);

  const upcoming = (events || []).filter(e => e.status === 'publicado' && isUpcoming(e));
  const past = (events || []).filter(e => !isUpcoming(e)).reverse().slice(0, 4);

  const notify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setNotified('err'); return; }
    setNotified('busy');
    const { error } = await supabase.rpc('email_contact_upsert', { p_email: email.trim(), p_full_name: name.trim() || null, p_tags: ['brunch'], p_source: 'brunch-avise-me' });
    setNotified(error ? 'err' : 'ok');
  };

  return (
    <main className="bn">
      {/* ================================================================ hero */}
      <section className="bn-hero">
        <div className="bn-hero__bg" style={{ backgroundImage: 'url(/brunch/brunch-jardim.webp)' }} />
        <div className="bn-hero__shade" />
        <div className="bn-hero__photos" aria-hidden>
          <figure className="bn-polaroid bn-polaroid--a">
            <img src="/brunch/brunch-jardim.webp" alt="" />
            <figcaption>Chá, doces e boa conversa</figcaption>
          </figure>
          <figure className="bn-polaroid bn-polaroid--b">
            <img src="/brunch/brunch-mesa.webp" alt="" />
            <figcaption>Mesa pequena, de propósito</figcaption>
          </figure>
          <div className="bn-float bn-float--dolly"><img src={HOST.photo} alt="" /></div>
          <div className="bn-float bn-float--treat"><img src="/email/tile-brunch-box.jpg" alt="" /></div>
        </div>
        <div className="bn-hero__content">
          <span className="bn-hero__eyebrow">Brunch Tropical · com a Dolly</span>
          <h1 className="bn-hero__title">Chá, doces saudáveis e as mulheres que fazem o bem-estar acontecer</h1>
          <p className="bn-hero__text">
            Uma manhã especial, uma mesa pequena num lugar lindo da região, e uma conversa sobre como crescer
            trabalhando com saúde: cuidando de você, ajudando outras pessoas e ganhando bem com isso.
          </p>
          <div className="bn-hero__ctas">
            <a href="#agenda" className="bn-btn bn-btn--gold">Ver as próximas datas</a>
            <a href="#como" className="bn-btn bn-btn--light">Como funciona</a>
          </div>
          <div className="bn-hero__proof">
            <span>🎟️ Lugares limitados</span><span>⚡ Quem paga primeiro garante</span><span>💬 Grupo com a Dolly</span>
          </div>
        </div>
      </section>

      {/* ============================================================== agenda */}
      <section id="agenda" className="bn-section" style={{ scrollMarginTop: 80 }}>
        <div className="bn-wrap">
          <p className="bn-kicker">Agenda</p>
          <h2 className="bn-h2">Próximos brunches</h2>
          <p className="bn-lead">Cada encontro tem um tema, um lugar e poucos lugares. Quando acaba, acaba: o próximo abre primeiro para quem já é do Círculo.</p>

          {events === null ? (
            <p className="bn-muted">Carregando a agenda…</p>
          ) : upcoming.length ? (
            <div className="bn-agenda">
              {upcoming.map(e => <BrunchEventCard key={e.id} event={e} avail={avail[e.id]} />)}
            </div>
          ) : (
            <div className="bn-empty">
              <p className="bn-empty__icon" aria-hidden>🥂</p>
              <h3 className="bn-h3">A próxima data sai em breve</h3>
              <p className="bn-muted">Deixe o seu e-mail e você fica sabendo antes de abrir para todo mundo.</p>
              {notified === 'ok' ? (
                <p className="bn-ok" style={{ maxWidth: 420, margin: '1rem auto 0' }}>Pronto! Você vai ser uma das primeiras a saber. 💛</p>
              ) : (
                <form className="bn-notify" onSubmit={notify}>
                  <input className="bn-input" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" aria-label="Seu nome" autoComplete="name" />
                  <input className="bn-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" aria-label="Seu e-mail" autoComplete="email" required />
                  <button className="bn-btn bn-btn--gold" disabled={notified === 'busy'}>{notified === 'busy' ? 'Salvando…' : 'Me avise'}</button>
                  {notified === 'err' && <p className="bn-error" style={{ width: '100%' }}>Confira o e-mail e tente de novo.</p>}
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================= how it works */}
      <section id="como" className="bn-section" style={{ background: '#fff', scrollMarginTop: 80 }}>
        <div className="bn-wrap">
          <p className="bn-kicker">Como é um brunch</p>
          <h2 className="bn-h2">Quatro momentos, uma manhã inteira</h2>
          <div className="bn-moments">
            {MOMENTS.map((m, i) => (
              <article key={m.title} className="bn-moment">
                <img src={m.img} alt="" loading="lazy" />
                <div><b><span className="bn-step">{i + 1}</span>{m.title}</b><p>{m.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================= value stack */}
      <section className="bn-section">
        <div className="bn-wrap" style={{ display: 'grid', gap: '2rem' }}>
          <div>
            <p className="bn-kicker">No seu ingresso</p>
            <h2 className="bn-h2">Tudo o que vem junto</h2>
            <ul className="bn-stack">
              {DEFAULT_INCLUDES.map(i => <li key={i}>{i}</li>)}
              <li><strong>Você ajuda a montar o brunch:</strong> vota nos doces da mesa e nos temas da conversa, e vê a votação andar ao vivo.</li>
              <li><strong>E você entra para o Círculo Tropical</strong>, com as vantagens abaixo.</li>
            </ul>
          </div>
          <div>
            <p className="bn-kicker">Círculo Tropical</p>
            <h2 className="bn-h2">Quem vem a um brunch, ganha</h2>
            <div className="bn-perks">
              {CIRCLE_PERKS.map(p => (
                <div key={p.title} className="bn-perk">
                  <div className="bn-perk__icon" aria-hidden>{p.emoji}</div>
                  <div><b>{p.title}</b><p>{p.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== host */}
      <section className="bn-section bn-dark">
        <div className="bn-wrap bn-host">
          <div className="bn-host__photo">
            <img src="/dolly/dolly-portrait.jpg" alt="Dolly, a confeiteira da The Tropical Bakery" />
            <span className="bn-host__sig">Sua anfitriã ✨</span>
          </div>
          <div>
            <p className="bn-kicker">Quem recebe</p>
            <h2 className="bn-h2">A Dolly abre a mesa</h2>
            <p className="bn-lead">
              Elisabeth “Dolly” Van Dam: artista belga, bailarina, escultora, mãe e hoje chef em Itamambuca, onde fundou
              a The Tropical Bakery. Ela transformou o que ama num trabalho de saúde e bem-estar, e sabe o caminho.
              No brunch ela apresenta cada pessoa, puxa a conversa e continua com vocês no grupo depois.
            </p>
            <p className="bn-kicker" style={{ marginTop: '1.5rem' }}>Para quem é</p>
            <div className="bn-who">
              {WHO.map(w => <span key={w} className="bn-chip" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}>{w}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ venues */}
      <section className="bn-section">
        <div className="bn-wrap">
          <p className="bn-kicker">Onde acontece</p>
          <h2 className="bn-h2">Um lugar lindo diferente a cada vez</h2>
          <p className="bn-lead">Às vezes na nossa casa, às vezes numa pousada, numa praia ou num espaço com música ao vivo e pop-ups de marcas locais.</p>
          <div className="bn-venues">
            {VENUE_KINDS.map(v => (
              <div key={v.id} className="bn-venue"><span aria-hidden>{v.emoji}</span><b>{v.label}</b><p>{v.blurb}</p></div>
            ))}
          </div>
          <div className="bn-card" style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
            <h3 className="bn-h3">Tem um espaço lindo, uma marca ou um pop-up?</h3>
            <p className="bn-muted">Pousadas, restaurantes e marcas do bem-estar podem receber ou patrocinar um brunch: sua marca na mesa de quem mais consome saúde na região.</p>
            <div>
              <WhatsAppGate
                href="https://wa.me/5511932119196?text=Ol%C3%A1!%20Quero%20receber%20ou%20patrocinar%20um%20Brunch%20Tropical."
                topic="Receber ou patrocinar um Brunch Tropical"
                tags={['parceiro', 'brunch']}
                className="bn-btn bn-btn--dark"
              >
                Quero receber ou patrocinar
              </WhatsAppGate>
            </div>
          </div>
        </div>
      </section>

      {past.length > 0 && (
        <section className="bn-section" style={{ background: '#fff' }}>
          <div className="bn-wrap">
            <p className="bn-kicker">Já aconteceu</p>
            <h2 className="bn-h2">Brunches anteriores</h2>
            <div className="bn-agenda">{past.map(e => <BrunchEventCard key={e.id} event={e} avail={avail[e.id]} />)}</div>
          </div>
        </section>
      )}

      {/* =============================================================== faq */}
      <section className="bn-section">
        <div className="bn-wrap" style={{ maxWidth: 820 }}>
          <p className="bn-kicker">Perguntas</p>
          <h2 className="bn-h2">Antes de garantir o seu lugar</h2>
          <div className="bn-faq">
            {FAQ.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
          <div className="bn-center" style={{ marginTop: '2rem' }}>
            <a href="#agenda" className="bn-btn bn-btn--gold">Ver as próximas datas</a>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: BRUNCH_CSS }} />
    </main>
  );
}
