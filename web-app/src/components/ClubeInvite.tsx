'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { usePageLang } from '@/lib/usePageLang';
import { shellText } from '@/lib/shellCopy';

/**
 * The signed-out visitor's way into an account, framed as joining Clube Tropical (src/lib/loyalty.ts).
 * Every perk listed here is something the account really does: keep it that way.
 * Same button creates an account or signs back in (Google / Facebook / e-mail / WhatsApp code).
 */
const PERKS: { icon: string; title: string; text: string }[] = [
  // Boxes are paused (2026-11), so the perks talk about what people buy now: recipes, classes, retreat, coaching.
  { icon: '📖', title: 'Suas receitas guardadas', text: 'As receitas que você abrir no Diário ficam na sua conta.' },
  { icon: '🗓️', title: 'Sua agenda com a Dolly', text: 'Aulas, retiro, coaching e pedidos, tudo num só lugar.' },
  { icon: '⚡', title: 'Próxima compra em segundos', text: 'Nome, WhatsApp e endereço já preenchidos.' },
  { icon: '🥥', title: 'Seu perfil de sabor', text: 'Suas alergias e preferências salvas, para a Dolly conferir.' },
];

/** Small second line under a gold pill, saying what it is. Also used by Navigation (Assinatura). */
export const SUB_STYLE: React.CSSProperties = {
  fontSize: '0.62rem', fontWeight: 500, textTransform: 'none', letterSpacing: '0.2px', opacity: 0.85, whiteSpace: 'nowrap',
};

export function ClubeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();

  // Signed in (one-tap, or after the e-mail link / code): the job is done.
  useEffect(() => { if (open && user) onClose(); }, [open, user, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  // Portal: the phone's bottom bar is transformed, which would trap a fixed overlay inside it.
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(60,42,33,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Entrar"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: '460px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
          background: 'var(--color-background)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(60,42,33,0.3)',
          padding: '1.6rem 1.4rem 1.2rem', color: '#594a42',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: 'absolute', top: '0.6rem', right: '0.6rem', width: '44px', height: '44px',
            border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#594a42',
          }}
        >
          ×
        </button>
        <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#8a6d1f', fontWeight: 700 }}>
          Clube Tropical · grátis · 10 segundos
        </p>
        <h2 style={{ margin: '0.3rem 0 1rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '1.7rem', lineHeight: 1.2 }}>
          Entre ou crie sua conta
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.2rem', display: 'grid', gap: '0.7rem' }}>
          {PERKS.map(p => (
            <li key={p.title} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', lineHeight: 1.45, fontSize: '0.92rem' }}>
              <span aria-hidden style={{ fontSize: '1.3rem', lineHeight: 1.1 }}>{p.icon}</span>
              <span><strong style={{ color: '#3c2a21' }}>{p.title}.</strong> {p.text}</span>
            </li>
          ))}
        </ul>
        <LoginPanel message="Um toque e você está dentro" subMessage="Já tem conta? É o mesmo botão: você entra direto." />
      </div>
    </div>,
    document.body,
  );
}

/** A simple person outline: the sign everyone reads as "log in / my account". */
export function PersonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

/** The log-in button (Andrew, 2026-11-27: "Entrar no Clube" read like a promo, not a login). Opens the Clube Tropical sign-in. that sits where a signed-in person's name goes. */
export default function ClubeInvite({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const lang = usePageLang();

  const button = variant === 'mobile'
    ? (
      <div style={{ padding: '0.25rem 0 0.75rem' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%', minHeight: '48px', border: '2px solid #3c2a21', borderRadius: '999px', background: '#fff',
            color: '#3c2a21', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          <PersonIcon size={20} /> {shellText('Entrar ou criar conta', lang)}
        </button>
      </div>
    )
    : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={shellText('Entrar ou criar conta', lang)}
        style={{
          marginLeft: 'clamp(0.7rem, 1.1vw, 1.5rem)', padding: '0.5rem 1.1rem', border: 'none', borderRadius: '999px', background: '#d4af37',
          color: '#3c2a21', fontWeight: 700, fontSize: 'clamp(0.74rem, 0.78vw, 0.9rem)', letterSpacing: '0.5px', textTransform: 'uppercase',
          cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          boxShadow: '0 4px 12px rgba(212,175,55,0.35)',
        }}
      >
        <PersonIcon size={17} /> {shellText('Entrar', lang)}
      </button>
    );

  return (
    <>
      {button}
      <ClubeModal open={open} onClose={close} />
    </>
  );
}
