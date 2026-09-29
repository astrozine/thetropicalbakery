'use client';

import React from 'react';
import Link from 'next/link';
import StripedBackground from '@/components/StripedBackground';
import WaitlistCapture from '@/components/WaitlistCapture';

const HEADING = 'Ainda não há uma caixa marcada para o próximo período';
const WAIT_HEADING = 'Entre na fila de espera';
const WAIT_SUB = 'Como ainda não há uma edição marcada, você pode entrar na fila e ser a primeira pessoa a saber quando a Dolly abrir a próxima, antes de todo mundo.';

/**
 * The hero picture: two real boxes, tilted like they were just set down, with a kraft tag tied to the
 * first one ("Reservada para você") and a gold ribbon on the second ("Em breve"). It says "your box has
 * a place in line" without an error-page feel, and it still shows what the box looks like.
 */
function WaitingBoxes({ photos }: { photos: string[] }) {
  const [a, b] = [photos[0] || '/box1.jpg', photos[1] || '/box3.jpg'];
  return (
    <div className="nbn-art" aria-hidden>
      <div className="nbn-photo nbn-a">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a} alt="" />
        <div className="nbn-tag">
          <span className="nbn-hole" />
          <small>Reservada para</small>
          <strong>você</strong>
        </div>
      </div>
      <div className="nbn-photo nbn-b">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b} alt="" />
        <span className="nbn-ribbon">Em breve</span>
      </div>
      <span className="nbn-pill">🔥 Em preparo na cozinha da Dolly</span>
    </div>
  );
}

const HERO_CSS = `
.nbn-grid{display:grid;gap:clamp(1.5rem,4vw,3.5rem);align-items:center;max-width:1080px;margin:0 auto}
.nbn-copy{text-align:center;max-width:560px;margin:0 auto;width:100%}
.nbn-art{position:relative;width:min(100%,420px);height:clamp(270px,78vw,340px);margin:0 auto;order:-1}
.nbn-photo{position:absolute;background:#fdfaf3;padding:6px;border-radius:14px;box-shadow:0 18px 38px rgba(0,0,0,.5)}
.nbn-photo img{display:block;width:100%;height:100%;object-fit:cover;border-radius:9px}
.nbn-a{left:2%;top:0;width:56%;aspect-ratio:3/4;transform:rotate(-4deg);z-index:1}
.nbn-b{right:2%;bottom:14%;width:44%;aspect-ratio:3/4;transform:rotate(5deg);z-index:2}
.nbn-tag{position:absolute;left:-6%;bottom:-7%;width:44%;min-width:96px;background:#d9b382;background-image:linear-gradient(160deg,#e3c194,#c99f68);color:#3c2a21;text-align:center;padding:1.1rem .4rem .6rem;clip-path:polygon(14% 0,86% 0,100% 16%,100% 100%,0 100%,0 16%);transform:rotate(-6deg);box-shadow:0 6px 14px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:.1rem}
.nbn-tag small{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.nbn-tag strong{font-family:var(--font-heading);font-size:1.35rem;line-height:1.1}
.nbn-hole{position:absolute;top:.35rem;left:50%;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:#3c2a21;opacity:.75}
.nbn-ribbon{position:absolute;top:12px;right:-8px;background:#d4af37;color:#3c2a21;font-weight:800;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;padding:.3rem .8rem;border-radius:4px 0 0 4px;box-shadow:0 4px 10px rgba(0,0,0,.35)}
.nbn-pill{position:absolute;left:50%;bottom:-2%;transform:translateX(-50%);z-index:3;white-space:nowrap;background:rgba(43,29,22,.92);color:#d4af37;border:1px solid rgba(212,175,55,.6);border-radius:999px;padding:.4rem .95rem;font-size:.78rem;font-weight:700}
@media (min-width:900px){
  .nbn-grid{grid-template-columns:1.05fr .95fr}
  .nbn-copy{text-align:left;margin:0;max-width:none}
  .nbn-copy .nbn-center{text-align:left!important}
  .nbn-pill{bottom:12%}
  .nbn-art{order:0;align-self:start;margin-top:2.5rem;width:100%;max-width:460px;height:clamp(400px,38vw,500px)}
}
@media (prefers-reduced-motion:no-preference){
  .nbn-a{animation:nbn-float 7s ease-in-out infinite}
  .nbn-b{animation:nbn-float 7s ease-in-out 1.6s infinite reverse}
}
@keyframes nbn-float{0%,100%{translate:0 0}50%{translate:0 -8px}}
`;

/**
 * Shown whenever there is no Degustation Box a customer could actually order: nothing is set up,
 * or the box that is set up has no delivery day left to pick or is past its ordering window.
 * It says so plainly, and offers the waiting list as the way to be first in line.
 *
 * `page` is the full-width version for /caixas; `card` is the compact light one for the home page.
 */
export default function NoBoxNotice({ variant = 'page', photos = [] }: { variant?: 'page' | 'card'; photos?: string[] }) {
  if (variant === 'card') {
    return (
      <div style={{ padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(60, 42, 33, 0.05)', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', color: '#a6832b', letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Caixa de Degustação
        </span>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#3c2a21', fontSize: 'clamp(1.4rem, 5vw, 2rem)', lineHeight: 1.2, margin: '0 auto 0.9rem', maxWidth: '560px' }}>
          {HEADING}
        </h2>
        <p style={{ color: '#594a42', lineHeight: 1.75, maxWidth: '520px', margin: '0 auto 1.75rem', fontSize: '1rem' }}>
          Cada caixa é feita à mão, uma edição por vez. Assim que a Dolly marcar a próxima, você pode ser a primeira pessoa a saber.
        </p>
        <WaitlistCapture theme="light" plain heading={WAIT_HEADING} subheading={WAIT_SUB} />
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <StripedBackground
        tone="dark" bandHeight={90} image="/textures/copacabana-baker.webp" imagePosition="40% 60%"
        style={{ padding: 'clamp(2rem, 7vw, 5rem) 1rem clamp(2.5rem, 8vw, 5rem)' }}
      >
        <style>{HERO_CSS}</style>
        <div className="nbn-grid">
          <WaitingBoxes photos={photos} />
          <div className="nbn-copy">
          <span style={{ display: 'inline-block', border: '1px solid rgba(212,175,55,0.6)', color: '#d4af37', padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '1.25rem' }}>
            Caixa de Degustação
          </span>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.7rem, 7vw, 3rem)', lineHeight: 1.15, color: '#fdfaf3', marginBottom: '1.1rem' }}>
            Ainda não há uma <span style={{ color: '#d4af37' }}>caixa marcada</span> para o próximo período
          </h1>

          <p style={{ color: 'rgba(253,250,243,0.88)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.75rem' }}>
            A Dolly ainda não definiu a data e o menu da próxima edição. Cada caixa é feita à mão, uma edição por vez,
            e só abrimos os pedidos quando tudo está pronto.
          </p>

          {/* The way forward, stated once and clearly */}
          <div style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '16px', padding: 'clamp(1.1rem, 4vw, 1.6rem)', textAlign: 'left', marginBottom: '1.25rem' }}>
            <p style={{ color: '#d4af37', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.4rem', textAlign: 'center' }}>
              🥇 Quer ser a primeira pessoa da fila?
            </p>
            <p style={{ color: 'rgba(253,250,243,0.9)', fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'center', marginBottom: '1.25rem' }}>
              Como ainda não há nada marcado, você pode entrar na fila de espera. Quando a próxima caixa for aberta, avisamos você antes de todo mundo.
            </p>
            <WaitlistCapture plain heading={WAIT_HEADING} subheading="Deixe seu nome e WhatsApp. Não enviamos nada além do aviso da próxima edição." />
          </div>

          <p style={{ color: 'rgba(253,250,243,0.75)', fontSize: '0.92rem', lineHeight: 1.7, margin: '1.5rem 0 0.9rem' }}>
            Prefere não depender de lote? Assinantes recebem uma caixa toda semana, com prioridade nas edições limitadas.
          </p>
          <Link href="/assinatura" style={{ display: 'inline-block', background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '0.85rem 1.8rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.98rem' }}>
            Ver a assinatura semanal
          </Link>

          </div>
        </div>
      </StripedBackground>
    </main>
  );
}
