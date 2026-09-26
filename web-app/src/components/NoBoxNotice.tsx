'use client';

import React from 'react';
import Link from 'next/link';
import StripedBackground from '@/components/StripedBackground';
import WaitlistCapture from '@/components/WaitlistCapture';

const HEADING = 'Ainda não há uma caixa marcada para o próximo período';
const WAIT_HEADING = 'Entre na fila de espera';
const WAIT_SUB = 'Como ainda não há uma edição marcada, você pode entrar na fila e ser a primeira pessoa a saber quando a Dolly abrir a próxima, antes de todo mundo.';

/** A small pair of earlier boxes, so the page still feels like the bakery and not an error. */
function PastBoxes({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem' }} aria-hidden>
      {photos.slice(0, 2).map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" loading="lazy"
          style={{ width: 'min(44vw, 200px)', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: '14px', transform: `rotate(${i === 0 ? -3 : 3}deg)`, boxShadow: '0 12px 26px rgba(0,0,0,0.4)', border: '5px solid #fdfaf3' }} />
      ))}
    </div>
  );
}

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
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
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

          <PastBoxes photos={photos} />
        </div>
      </StripedBackground>
    </main>
  );
}
