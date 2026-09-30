'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Meta dataset (pixel) "The Tropical Bakery Website". The ID is public by design.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1953002309021163';
const STORAGE_KEY = 'tb-cookie-consent';

type Consent = 'accepted' | 'declined' | null;

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: unknown;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

function loadPixel() {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  fbq('init', PIXEL_ID);
}

/**
 * LGPD: the Meta pixel is only loaded after the visitor taps "Aceitar".
 * "Recusar" (or no answer) means nothing is sent to Meta. The choice is kept in localStorage.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  // Read after mount so server and first client render match (no localStorage on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readConsent());
    setReady(true);
  }, []);

  // Admin, partner and team areas are staff-only: never track them.
  const tracked = !!pathname && !/^\/(admin|parceiro|equipe)(\/|$)/.test(pathname);

  useEffect(() => {
    if (consent !== 'accepted' || !tracked) return;
    loadPixel();
    window.fbq?.('track', 'PageView');
  }, [consent, tracked, pathname]);

  function choose(value: 'accepted' | 'declined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private mode: the choice just lasts for this visit */
    }
    setConsent(value);
  }

  if (!ready || consent !== null || !tracked) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      style={{
        position: 'fixed',
        left: '0.75rem',
        right: '0.75rem',
        bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        maxWidth: '640px',
        margin: '0 auto',
        zIndex: 1100,
        background: 'var(--color-background)',
        border: '1px solid var(--color-secondary)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(60,42,33,0.25)',
        padding: '1rem 1.1rem',
        color: '#594a42',
        fontSize: '0.9rem',
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: 0 }}>
        🌴 Ajude a cozinha da Dolly a chegar em quem vai amar! Com os cookies da Meta, mostramos nossos doces
        no Instagram e no Facebook para quem tem a ver com eles, e você vê menos anúncios que não têm nada a ver.
        Só ativamos se você aceitar.{' '}
        <Link href="/privacidade" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
          Política de Privacidade
        </Link>
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => choose('accepted')}
          style={{
            flex: '1 1 140px',
            minHeight: '44px',
            border: 'none',
            borderRadius: '999px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={() => choose('declined')}
          style={{
            flex: '1 1 140px',
            minHeight: '44px',
            border: '1px solid var(--color-primary)',
            borderRadius: '999px',
            background: 'transparent',
            color: 'var(--color-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
