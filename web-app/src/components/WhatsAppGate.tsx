'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth, OAuthProvider } from '@/context/AuthContext';

const PENDING_KEY = 'tb_wa_gate_pending';

export type GateLocale = 'pt' | 'en' | 'es';

const COPY: Record<GateLocale, {
  kicker: string; headIn: string; headKnown: string; known: string; bullets: string[];
  google: string; facebook: string; orWith: string; orWithout: string;
  name: string; whatsapp: string; email: string; optional: string; submit: string;
  errName: string; errPhone: string; errMail: string; privacy: string; privacyLink: string;
  thanks: (n: string) => string; opened: string; open: string; next: (via: string) => string;
  readyTitle: (n: string) => string; readyBody: string; close: string; or: string;
}> = {
  pt: {
    kicker: 'Antes do WhatsApp',
    headIn: 'Entre em 1 toque e não digite nada',
    headKnown: 'Só falta o seu WhatsApp',
    known: 'Você já está com a sua conta. Confirme o número e a conversa começa; ele fica salvo para as próximas vezes.',
    bullets: [
      'Sem senha para lembrar: um toque e pronto.',
      'Você ganha a sua conta na Tropical Bakery para acompanhar e repetir pedidos em segundos.',
      'Nome, WhatsApp e endereço ficam salvos para as próximas vezes.',
    ],
    google: 'Continuar com Google', facebook: 'Continuar com Facebook',
    orWith: 'ou deixe só o seu contato', orWithout: 'deixe o seu contato',
    name: 'Seu nome', whatsapp: 'Seu WhatsApp', email: 'E-mail', optional: '(opcional)', submit: 'Continuar no WhatsApp',
    errName: 'Como podemos te chamar?',
    errPhone: 'Digite o WhatsApp com DDD, por exemplo (12) 99123-4567.',
    errMail: 'Confira o e-mail, parece que falta algo.',
    privacy: 'Usamos seus dados só para responder a você.', privacyLink: 'Política de Privacidade',
    thanks: n => (n ? `Obrigada, ${n}!` : 'Obrigada!'),
    opened: 'Abrimos o WhatsApp em outra aba. Se ele não abriu, é só tocar abaixo.',
    open: 'Abrir o WhatsApp',
    next: via => `Da próxima vez, entre com ${via} e tudo já vem preenchido.`,
    readyTitle: n => `${n ? `Pronto, ${n}!` : 'Pronto!'} Você entrou.`,
    readyBody: 'Sua conta na Tropical Bakery já existe: nos próximos pedidos seus dados vêm preenchidos.',
    close: 'Fechar', or: 'ou',
  },
  en: {
    kicker: 'Before WhatsApp',
    headIn: 'Sign in with one tap, no typing',
    headKnown: 'Just your WhatsApp number',
    known: 'You are already signed in. Confirm your number and we start chatting; it is saved for next time.',
    bullets: [
      'No password to remember: one tap and you are in.',
      'You get your own Tropical Bakery account to follow and repeat orders in seconds.',
      'Your name, WhatsApp and address are saved for next time.',
    ],
    google: 'Continue with Google', facebook: 'Continue with Facebook',
    orWith: 'or just leave your contact', orWithout: 'leave your contact',
    name: 'Your name', whatsapp: 'Your WhatsApp', email: 'E-mail', optional: '(optional)', submit: 'Continue on WhatsApp',
    errName: 'What should we call you?',
    errPhone: 'Enter your WhatsApp number with country and area code.',
    errMail: 'Please check the e-mail address.',
    privacy: 'We only use your details to reply to you.', privacyLink: 'Privacy Policy',
    thanks: n => (n ? `Thank you, ${n}!` : 'Thank you!'),
    opened: 'We opened WhatsApp in another tab. If it did not open, tap below.',
    open: 'Open WhatsApp',
    next: via => `Next time, sign in with ${via} and everything is filled in.`,
    readyTitle: n => `${n ? `All set, ${n}!` : 'All set!'} You are signed in.`,
    readyBody: 'Your Tropical Bakery account now exists: your details will be filled in next time.',
    close: 'Close', or: 'or',
  },
  es: {
    kicker: 'Antes de WhatsApp',
    headIn: 'Entra con un toque, sin escribir nada',
    headKnown: 'Solo falta tu WhatsApp',
    known: 'Ya tienes tu cuenta. Confirma el número y empezamos a conversar; queda guardado para la próxima.',
    bullets: [
      'Sin contraseña que recordar: un toque y listo.',
      'Recibes tu cuenta en Tropical Bakery para seguir y repetir pedidos en segundos.',
      'Tu nombre, WhatsApp y dirección quedan guardados para la próxima vez.',
    ],
    google: 'Continuar con Google', facebook: 'Continuar con Facebook',
    orWith: 'o deja solo tu contacto', orWithout: 'deja tu contacto',
    name: 'Tu nombre', whatsapp: 'Tu WhatsApp', email: 'E-mail', optional: '(opcional)', submit: 'Continuar en WhatsApp',
    errName: '¿Cómo te llamamos?',
    errPhone: 'Escribe tu WhatsApp con código de país y de área.',
    errMail: 'Revisa el e-mail, parece que falta algo.',
    privacy: 'Usamos tus datos solo para responderte.', privacyLink: 'Política de Privacidad',
    thanks: n => (n ? `¡Gracias, ${n}!` : '¡Gracias!'),
    opened: 'Abrimos WhatsApp en otra pestaña. Si no se abrió, toca abajo.',
    open: 'Abrir WhatsApp',
    next: via => `La próxima vez, entra con ${via} y todo viene completado.`,
    readyTitle: n => `${n ? `¡Listo, ${n}!` : '¡Listo!'} Ya entraste.`,
    readyBody: 'Tu cuenta en Tropical Bakery ya existe: la próxima vez tus datos vienen completados.',
    close: 'Cerrar', or: 'o',
  },
};

interface WhatsAppGateProps {
  /** The wa.me link the button used to open directly. Anything that is not a WhatsApp link stays a plain link. */
  href: string;
  /** What they are about to ask about, saved with the lead so Dolly knows the context, e.g. "Parceria: Hotéis". */
  topic: string;
  /** E-mail list tags for the address, when they give one (see emailTopics.ts). */
  tags?: string[];
  /** Language of the pop-up. The retreat pages speak English and Spanish too. */
  locale?: GateLocale;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface Person { name: string; whatsapp: string; email: string }

const digits = (v: string) => v.replace(/\D/g, '');
const validPhone = (v: string) => { const d = digits(v); return d.length >= 10 && d.length <= 13; };

const read = (key: string) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private window */ } };

const OAUTH: Record<OAuthProvider, { style: React.CSSProperties; icon: React.ReactNode }> = {
  google: {
    style: { background: '#fff', color: '#3c2a21', border: '1px solid #d9d2c7' },
    icon: (
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    ),
  },
  facebook: {
    style: { background: '#1877F2', color: '#fff', border: '1px solid #1877F2' },
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
};

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.46z" />
  </svg>
);

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a6d1f', marginBottom: '0.3rem' };
const fieldInput: React.CSSProperties = { width: '100%', padding: '0.8rem 0.9rem', fontSize: '1rem', fontFamily: 'var(--font-body)', border: '1px solid rgba(60,42,33,0.25)', borderRadius: '8px', background: '#fff', color: '#3c2a21' };
const greenButton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#25D366', color: '#0b3d1e', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-body)', padding: '0.95rem 1.6rem', minHeight: '50px', borderRadius: '999px', border: 'none', cursor: 'pointer', textDecoration: 'none' };

/**
 * A "Falar no WhatsApp" button that never jumps straight into the chat.
 *
 * First we want the person on file: a one-tap Google / Facebook sign-in (which also gives them an
 * account for future orders), or just a name and a WhatsApp number. Either way the lead is saved
 * (contact_leads, migration 23) and then WhatsApp opens with the same message the old link had.
 * Someone already signed in with a phone number on their account goes straight through.
 * Saving is best-effort: a database hiccup must never stop anyone reaching us.
 */
export default function WhatsAppGate({ href, topic, tags = [], locale = 'pt', children, className, style }: WhatsAppGateProps) {
  const { user, profile, loading, availableMethods, signInWithProvider } = useAuth();
  const t = COPY[locale] || COPY.pt;
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'form' | 'ready' | 'done'>('form');
  const [person, setPerson] = useState<Person>({ name: '', whatsapp: '', email: '' });
  const [error, setError] = useState('');

  const isWhatsApp = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href);
  const oauth = availableMethods.filter((m): m is OAuthProvider => m === 'google' || m === 'facebook');

  // What we already know about this person, from their account or from an earlier form.
  const known = (): Person => ({
    name: profile?.full_name || (user?.user_metadata?.full_name as string | undefined) || read('checkout_fullName'),
    whatsapp: profile?.phone || read('checkout_phone'),
    email: user?.email || profile?.email || '',
  });

  // Back from Google / Facebook: the page reloads, so pick up where they left off. A window can only
  // be opened by a tap, so they get one big button instead of a surprise pop-up.
  useEffect(() => {
    if (loading || !user || !isWhatsApp) return;
    let pending = '';
    try { pending = sessionStorage.getItem(PENDING_KEY) || ''; } catch { /* ignore */ }
    if (pending !== href) return;
    try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    const k = known();
    setPerson(k);
    setPhase(validPhone(k.whatsapp) ? 'ready' : 'form');
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, href, isWhatsApp]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (!isWhatsApp) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>{children}</a>;
  }

  // Save the lead, then open the chat. The lead is saved in the background so the window opens
  // straight from the tap (phones block windows opened after a wait).
  const saveAndOpen = (p: Person) => {
    void (async () => {
      try {
        const { error: err } = await supabase.from('contact_leads').insert([{
          name: p.name.trim() || 'Sem nome',
          whatsapp: p.whatsapp.trim(),
          email: p.email.trim() || null,
          topic,
          source_page: window.location.pathname,
          user_id: user?.id ?? null,
          signed_in: !!user,
        }]);
        if (err) throw err;
      } catch (err) {
        // Migration 23 not run yet (or the network blinked): the e-mail list below still keeps them.
        console.error('Could not save contact lead:', err);
      }
      if (p.email.trim()) {
        await supabase.rpc('email_contact_upsert', { p_email: p.email.trim(), p_full_name: p.name.trim(), p_tags: tags, p_source: 'contato_whatsapp' });
      }
    })();
    if (p.name.trim()) write('checkout_fullName', p.name.trim());
    if (p.whatsapp.trim()) write('checkout_phone', p.whatsapp.trim());
    window.open(href, '_blank');
    setPhase('done');
  };

  const onTrigger = () => {
    const k = known();
    setError('');
    // Signed in with a number on the account: they are already on file, no questions.
    if (user && validPhone(k.whatsapp)) {
      saveAndOpen(k);
      return;
    }
    setPerson(k);
    setPhase('form');
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person.name.trim()) { setError(t.errName); return; }
    if (!validPhone(person.whatsapp)) { setError(t.errPhone); return; }
    if (person.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim())) { setError(t.errMail); return; }
    setError('');
    saveAndOpen(person);
  };

  const signIn = async (provider: OAuthProvider) => {
    setError('');
    try { sessionStorage.setItem(PENDING_KEY, href); } catch { /* ignore */ }
    const { error: err } = await signInWithProvider(provider);
    if (err) setError(err);
  };

  const firstName = person.name.trim().split(/\s+/)[0];
  // Without a className the button has to look like plain text or a custom-styled link, not a grey browser button.
  const triggerBase: React.CSSProperties = className
    ? {}
    : { border: 'none', background: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' };
  const viaNames = oauth.map(p => (p === 'google' ? 'Google' : 'Facebook')).join(` ${t.or} `);

  return (
    <>
      <button type="button" onClick={onTrigger} className={className} style={{ ...triggerBase, ...style }}>
        {children}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.kicker}
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(30,20,15,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', margin: 'auto', width: '100%', maxWidth: '460px', background: '#fdfaf3', border: '1px solid rgba(212,175,55,0.45)', borderRadius: '20px', padding: 'clamp(1.5rem, 5vw, 2.25rem)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', color: '#3c2a21', textAlign: 'left', fontFamily: 'var(--font-body)', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}
          >
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close} style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', width: '44px', height: '44px', background: 'none', border: 'none', fontSize: '1.4rem', lineHeight: 1, cursor: 'pointer', color: '#7a6a61' }}>✕</button>

            {phase === 'done' ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <p style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>🌴</p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', lineHeight: 1.25, marginBottom: '0.75rem' }}>{t.thanks(firstName)}</h2>
                <p style={{ color: '#594a42', lineHeight: 1.7, marginBottom: '1.25rem' }}>{t.opened}</p>
                <a href={href} target="_blank" rel="noopener noreferrer" style={greenButton}>
                  <WhatsAppIcon /> {t.open}
                </a>
                {!user && oauth.length > 0 && (
                  <p style={{ marginTop: '1.5rem', fontSize: '0.88rem', color: '#7a6a61', lineHeight: 1.6 }}>{t.next(viaNames)}</p>
                )}
              </div>
            ) : phase === 'ready' ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <p style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>✨</p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', lineHeight: 1.25, marginBottom: '0.75rem' }}>{t.readyTitle(firstName)}</h2>
                <p style={{ color: '#594a42', lineHeight: 1.7, marginBottom: '1.25rem' }}>{t.readyBody}</p>
                <button type="button" onClick={() => saveAndOpen(person)} style={greenButton}>
                  <WhatsAppIcon /> {t.submit}
                </button>
              </div>
            ) : (
              <>
                <span style={{ display: 'block', color: '#a6832b', letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {t.kicker}
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 4.5vw, 1.55rem)', lineHeight: 1.25, marginBottom: '0.75rem', paddingRight: '1.5rem' }}>
                  {user ? t.headKnown : t.headIn}
                </h2>

                {user ? (
                  <p style={{ color: '#594a42', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>{t.known}</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', color: '#594a42', fontSize: '0.95rem', lineHeight: 1.6, display: 'grid', gap: '0.35rem' }}>
                    {t.bullets.map(b => <li key={b}>✦ {b}</li>)}
                  </ul>
                )}

                {!user && oauth.length > 0 && (
                  <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.1rem' }}>
                    {oauth.map(provider => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => signIn(provider)}
                        className="notranslate"
                        translate="no"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', minHeight: '48px', padding: '0.7rem 1rem', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'var(--font-body)', ...OAUTH[provider].style }}
                      >
                        {OAUTH[provider].icon}
                        {provider === 'google' ? t.google : t.facebook}
                      </button>
                    ))}
                  </div>
                )}

                {!user && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1rem' }}>
                    <span style={{ flex: 1, height: '1px', background: '#e8e1d7' }} />
                    <span style={{ fontSize: '0.75rem', color: '#7a6a61', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {oauth.length > 0 ? t.orWith : t.orWithout}
                    </span>
                    <span style={{ flex: 1, height: '1px', background: '#e8e1d7' }} />
                  </div>
                )}

                <form onSubmit={submit} style={{ display: 'grid', gap: '0.9rem' }} noValidate>
                  <div>
                    <label style={fieldLabel} htmlFor="wag-name">{t.name}</label>
                    <input id="wag-name" type="text" autoComplete="name" value={person.name} onChange={e => setPerson({ ...person, name: e.target.value })} style={fieldInput} />
                  </div>
                  <div>
                    <label style={fieldLabel} htmlFor="wag-wa">{t.whatsapp}</label>
                    <input id="wag-wa" type="tel" inputMode="tel" autoComplete="tel" placeholder="(12) 99123-4567" value={person.whatsapp} onChange={e => setPerson({ ...person, whatsapp: e.target.value })} style={fieldInput} />
                  </div>
                  <div>
                    <label style={fieldLabel} htmlFor="wag-mail">{t.email} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t.optional}</span></label>
                    <input id="wag-mail" type="email" autoComplete="email" placeholder="seu@email.com" value={person.email} onChange={e => setPerson({ ...person, email: e.target.value })} style={fieldInput} />
                  </div>
                  {error && <p role="alert" style={{ color: '#c0392b', fontSize: '0.9rem', lineHeight: 1.5 }}>{error}</p>}
                  <button type="submit" style={{ ...greenButton, display: 'flex', width: '100%', borderRadius: '10px' }}>
                    <WhatsAppIcon /> {t.submit}
                  </button>
                </form>

                <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '1rem', lineHeight: 1.5, textAlign: 'center' }}>
                  {t.privacy} <Link href="/privacidade" style={{ color: '#7a6a61', textDecoration: 'underline' }}>{t.privacyLink}</Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
