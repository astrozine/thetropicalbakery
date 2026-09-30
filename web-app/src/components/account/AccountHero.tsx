'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Level } from '@/lib/loyalty';

export type HeroAction = { label: string; href?: string; onClick?: () => void };

interface Props {
  firstName: string;
  avatarUrl?: string;
  level: Level;
  next: Level | null;
  toNext: number;
  /** 0..1, drawn as the gold ring around the photo (the stamp card's progress). */
  ring: number;
  stats: string[];
  primary: HeroAction;
  secondary?: HeroAction;
  /** A line above the buttons when something needs them now (a box is ready, a payment is waiting). */
  alert?: string;
}

function ActionButton({ a, variant }: { a: HeroAction; variant: 'gold' | 'ghost' }) {
  const cls = variant === 'gold' ? 'acct-btn acct-btn-gold' : 'acct-btn acct-btn-ghost';
  return a.href
    ? <Link href={a.href} className={cls}>{a.label}</Link>
    : <button type="button" onClick={a.onClick} className={cls}>{a.label}</button>;
}

/**
 * The top of Minha Conta: the /retreats floating-photo recipe (moody full-bleed
 * photo, tilted polaroids) with who you are, your Clube Tropical level and the
 * one thing worth doing next.
 */
export default function AccountHero({ firstName, avatarUrl, level, next, toNext, ring, stats, primary, secondary, alert }: Props) {
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <section className="acct-hero" aria-label="Seu perfil">
      <Image src="/dolly/hero-mata.webp" alt="" fill priority sizes="100vw" className="acct-hero-bg" />
      <div className="acct-hero-shade" aria-hidden />

      <div className="acct-float acct-float-1" aria-hidden>
        <Image src="/box2.jpg" alt="" width={220} height={300} />
      </div>
      <div className="acct-float acct-float-2" aria-hidden>
        <Image src="/mango.jpg" alt="" width={220} height={220} />
      </div>
      <div className="acct-float acct-float-3" aria-hidden>
        <Image src="/dolly/dolly-tray.jpg" alt="" width={220} height={290} />
      </div>

      <div className="acct-hero-inner">
        <div className="acct-avatar">
          <svg viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="5" />
            <circle
              cx="50" cy="50" r={R} fill="none" stroke="url(#acctGold)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${C * Math.max(0.03, ring)} ${C}`} transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <defs>
              <linearGradient id="acctGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd166" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" />
          ) : (
            <span className="acct-avatar-initial">{(firstName[0] || '🌴').toUpperCase()}</span>
          )}
          <span className="acct-avatar-badge" title={`Nível ${level.name}`}>{level.emoji}</span>
        </div>

        <p className="acct-eyebrow">Clube Tropical · Nível {level.name}</p>
        <h1 className="acct-hello notranslate" translate="no">{firstName ? `Oi, ${firstName}!` : 'Bem-vindo(a)!'}</h1>
        <p className="acct-hero-sub">
          {level.blurb}
          {next && (
            <> <span className="acct-hero-next">Mais {toNext} {toNext === 1 ? 'caixa' : 'caixas'} e você vira {next.name} {next.emoji}</span></>
          )}
        </p>

        {alert && <p className="acct-hero-alert" role="status">{alert}</p>}

        <div className="acct-hero-actions">
          <ActionButton a={primary} variant="gold" />
          {secondary && <ActionButton a={secondary} variant="ghost" />}
        </div>

        {stats.length > 0 && (
          <ul className="acct-hero-stats">
            {stats.map(s => <li key={s}>{s}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
