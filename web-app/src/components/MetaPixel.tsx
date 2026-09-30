'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Consent, CONSENT_KEY as STORAGE_KEY, isTrackedPath, loadPixel, readConsent } from '@/lib/metaPixel';

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
  const tracked = isTrackedPath(pathname);

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
        🌴 Sejamos sinceros: o algoritmo não está fazendo favor a ninguém. Pra uma cozinha pequena como a da Chef
        Dolly, chegar até a comunidade vegana nas redes está cada vez mais difícil. Aceitar os cookies da Meta é um
        empurrãozinho contra o algoritmo: a gente aparece pra quem vai amar, e você vê menos anúncio aleatório.
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
