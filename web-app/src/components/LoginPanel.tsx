'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, OAuthProvider, LoginMethod, formatBrazilianPhone } from '@/context/AuthContext';

const OAUTH_STYLES: Record<OAuthProvider, { label: string; icon: string; style: React.CSSProperties }> = {
  google: {
    label: 'Google',
    icon: 'https://www.svgrepo.com/show/475656/google-color.svg',
    style: { background: '#fff', color: '#3c2a21', border: '1px solid #ddd' },
  },
  facebook: {
    label: 'Facebook',
    icon: 'https://www.svgrepo.com/show/448224/facebook.svg',
    style: { background: '#1877F2', color: '#fff', border: 'none' },
  },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.9)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  outline: 'none',
};

const actionStyle: React.CSSProperties = {
  padding: '0.85rem 1.25rem',
  borderRadius: '8px',
  border: 'none',
  background: '#d4af37',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

interface LoginPanelProps {
  /** Headline above the options. */
  message?: string;
  /** Small print under the headline explaining what they get out of it. */
  subMessage?: string;
  /**
   * Admin demo ("Ver como"): shown even to a signed-in admin, and nothing is sent. Sending a code
   * or link just moves to the next step, so the whole flow can be seen.
   */
  demo?: boolean;
}

/**
 * Every way to sign in, in one panel: Google, Facebook, WhatsApp/SMS code, or
 * an email link. Only the methods actually enabled in Supabase are shown.
 *
 * Rendered inline at the purchase points and nothing else — signing in is
 * always an offer to save typing, never a gate in front of an order. Renders
 * nothing at all once someone is signed in.
 */
export default function LoginPanel({
  message = 'Entre e não digite seus dados de novo',
  subMessage = 'Seu nome, WhatsApp e endereço ficam salvos para o próximo pedido.',
  demo = false,
}: LoginPanelProps) {
  const {
    user, availableMethods,
    signInWithProvider, sendEmailLink, sendPhoneCode, verifyPhoneCode,
  } = useAuth();

  const oauthMethods = availableMethods.filter(
    (m): m is OAuthProvider => m === 'google' || m === 'facebook',
  );
  const hasPhone = availableMethods.includes('phone');
  const hasEmail = availableMethods.includes('email');

  // Brazilians reach for their phone number first, so that tab leads when available.
  const [tab, setTab] = useState<'phone' | 'email'>(hasPhone ? 'phone' : 'email');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if ((user && !demo) || availableMethods.length === 0) return null;

  const activeTab: 'phone' | 'email' = hasPhone && hasEmail ? tab : (hasPhone ? 'phone' : 'email');

  const run = async (fn: () => Promise<{ error?: string }>, onOk: () => void) => {
    if (demo) { setError(''); onOk(); return; }
    setBusy(true);
    setError('');
    const { error: err } = await fn();
    setBusy(false);
    if (err) setError(err);
    else onOk();
  };

  const submitPhone = () => run(() => sendPhoneCode(phone), () => setCodeSent(true));
  const submitCode = () => demo
    ? setError('Demonstração: aqui a pessoa entraria na conta.')
    : run(() => verifyPhoneCode(phone, code), () => { /* session arrives via listener */ });
  const submitEmail = () => run(() => sendEmailLink(email), () => setLinkSent(true));

  // These inputs sit inside the checkout <form>. Enter must trigger the login
  // step, never submit the order behind it.
  const onEnter = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      action();
    }
  };

  return (
    <div style={{
      background: '#fdfaf3',
      padding: '1.5rem 1.25rem',
      borderRadius: '16px',
      border: '1px solid #e8e1d7',
      textAlign: 'center',
    }}>
      <img
        src="/logo-gold.webp"
        alt=""
        style={{ height: '52px', width: 'auto', margin: '0 auto 0.75rem', display: 'block' }}
      />

      <p style={{ fontSize: '1rem', color: '#3c2a21', fontWeight: 700, marginBottom: '0.35rem' }}>
        {message}
      </p>
      <p style={{ fontSize: '0.85rem', color: '#7a6a61', marginBottom: '1.25rem' }}>
        {subMessage}
      </p>

      {oauthMethods.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {oauthMethods.map(provider => {
            const { label, icon, style } = OAUTH_STYLES[provider];
            return (
              <button
                key={provider}
                type="button"
                disabled={busy}
                onClick={() => run(() => signInWithProvider(provider), () => { if (demo) setError(`Demonstração: aqui abriria o login com ${label}.`); })}
                className="notranslate"
                translate="no"
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  ...style,
                }}
              >
                <img
                  src={icon}
                  alt=""
                  style={{ width: '18px', ...(provider === 'facebook' ? { filter: 'brightness(0) invert(1)' } : {}) }}
                />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {oauthMethods.length > 0 && (hasPhone || hasEmail) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0 1rem' }}>
          <span style={{ flex: 1, height: '1px', background: '#e8e1d7' }} />
          <span style={{ fontSize: '0.75rem', color: '#a89a90', textTransform: 'uppercase', letterSpacing: '1px' }}>ou</span>
          <span style={{ flex: 1, height: '1px', background: '#e8e1d7' }} />
        </div>
      )}

      {hasPhone && hasEmail && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {([['phone', 'Celular'], ['email', 'E-mail']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setError(''); }}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: activeTab === key ? '#d4af37' : '#e8e1d7',
                background: activeTab === key ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: activeTab === key ? '#3c2a21' : '#7a6a61',
                fontWeight: activeTab === key ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'phone' && hasPhone && (
        <div style={{ textAlign: 'left' }}>
          {!codeSent ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(12) 99123-4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={onEnter(submitPhone)}
                style={{ ...inputStyle, flex: '1 1 160px', width: 'auto' }}
              />
              <button type="button" disabled={busy} onClick={submitPhone} style={actionStyle}>
                {busy ? 'Enviando...' : 'Enviar código'}
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: '#594a42', marginBottom: '0.6rem' }}>
                Enviamos um código de 6 dígitos por SMS para{' '}
                <strong className="notranslate" translate="no">{formatBrazilianPhone(phone)}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={onEnter(submitCode)}
                  style={{ ...inputStyle, flex: '1 1 120px', width: 'auto', letterSpacing: '0.3em', textAlign: 'center' }}
                />
                <button type="button" disabled={busy} onClick={submitCode} style={actionStyle}>
                  {busy ? 'Conferindo...' : 'Entrar'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setCodeSent(false); setCode(''); setError(''); }}
                style={{ background: 'none', border: 'none', padding: '0.5rem 0 0', color: '#7a6a61', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Usar outro número
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'email' && hasEmail && (
        <div style={{ textAlign: 'left' }}>
          {!linkSent ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={onEnter(submitEmail)}
                style={{ ...inputStyle, flex: '1 1 180px', width: 'auto' }}
              />
              <button type="button" disabled={busy} onClick={submitEmail} style={actionStyle}>
                {busy ? 'Enviando...' : 'Enviar link'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#2e4432', background: 'rgba(46,68,50,0.08)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
              ✅ Pronto! Abra seu e-mail e clique no link para entrar. Você volta direto para esta página.
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'left' }}>
          {error}
        </p>
      )}

      <p style={{ fontSize: '0.7rem', color: '#a89a90', marginTop: '1rem' }}>
        Ao entrar, você concorda com nossa{' '}
        <Link href="/privacidade" style={{ color: '#a89a90', textDecoration: 'underline' }}>
          Política de Privacidade
        </Link>.
      </p>
    </div>
  );
}

export type { LoginMethod };
