import React from 'react';
import { SUBSTACK_URL } from '@/lib/siteContact';

/**
 * Dolly's Substack, "Sunbaked Letters" (plant-based dessert recipes, written in English).
 * It's for people who are already deeper in: enrolled in or asking about a course,
 * subscribed, or looking at their own profile. Not a front-door item.
 */

const linkProps = { href: SUBSTACK_URL, target: '_blank', rel: 'noopener noreferrer' } as const;

/** A full card. `dark` sits on cocoa sections, `light` on cream pages. */
export default function SunbakedLetters({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <section
      aria-label="Sunbaked Letters, a newsletter da Dolly"
      style={{
        maxWidth: '760px', margin: '0 auto', textAlign: 'center',
        padding: 'clamp(1.5rem, 4vw, 2.25rem)', borderRadius: '20px',
        background: dark ? 'linear-gradient(135deg, #3c2a21 0%, #5a3d2e 100%)' : 'linear-gradient(135deg, #fffaf0 0%, #fdf1d6 100%)',
        border: `1px solid ${dark ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.45)'}`,
        boxShadow: dark ? '0 16px 40px rgba(0,0,0,0.25)' : '0 8px 24px rgba(60,42,33,0.08)',
      }}
    >
      <p style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, color: dark ? '#ffd166' : '#a6832b', marginBottom: '0.6rem' }}>
        Para ir mais fundo
      </p>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', color: dark ? '#fdfaf3' : '#3c2a21', lineHeight: 1.15, marginBottom: '0.75rem' }}>
        Sunbaked Letters
      </h3>
      <p style={{ color: dark ? 'rgba(253,250,243,0.88)' : '#594a42', lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 1.25rem' }}>
        A newsletter da Dolly no Substack: sobremesas saudáveis com sabor de férias, receitas de base vegetal e os
        segredos da cozinha direto da selva brasileira.{' '}
        <span style={{ opacity: 0.8 }}>(Escrita em inglês.)</span>
      </p>
      <a
        {...linkProps}
        style={{ display: 'inline-block', background: '#d4af37', color: '#3c2a21', padding: '0.85rem 1.8rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem' }}
      >
        Conhecer no Substack ↗
      </a>
    </section>
  );
}

/** One quiet line for confirmation screens. */
export function SunbakedLettersNote({ dark = false }: { dark?: boolean }) {
  return (
    <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: dark ? 'rgba(253,250,243,0.8)' : '#7a6a61', marginTop: '1.5rem' }}>
      Enquanto isso, vá mais fundo com a newsletter da Dolly:{' '}
      <a {...linkProps} style={{ color: dark ? '#ffd166' : '#a6832b', fontWeight: 700, textDecoration: 'underline' }}>
        Sunbaked Letters ↗
      </a>{' '}
      <span style={{ opacity: 0.8 }}>(em inglês)</span>
    </p>
  );
}
