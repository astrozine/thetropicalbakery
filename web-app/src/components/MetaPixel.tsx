'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { loadGoogleTag, trackGoogle } from '@/lib/googleTag';
import { Consent, CONSENT_KEY as STORAGE_KEY, isTrackedPath, loadPixel, readConsent } from '@/lib/metaPixel';

/**
 * LGPD: the Meta pixel and the Google tag (Analytics / Ads) are only loaded after the visitor taps "Aceitar".
 * "Recusar" (or no answer) means nothing is sent to Meta or Google. One banner, one choice, kept in localStorage.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [more, setMore] = useState(false);

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
    // Same consent, same moment: runs on the tap of "Aceitar" and again on every route change.
    loadGoogleTag();
    trackGoogle('page_view', { page_location: window.location.href, page_path: pathname });
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
        padding: '0.7rem 0.9rem',
        color: '#594a42',
        fontSize: '0.85rem',
        lineHeight: 1.45,
      }}
    >
      {/* Short on purpose (Nov 2026): the full notice covered most of a phone screen and few people answered it,
          so the pixel saw almost no one. Andrew's full text is one tap away. */}
      <p style={{ margin: 0 }}>
        🌴 Sejamos sinceros: o algoritmo não está fazendo favor a ninguém. Aceitar os cookies é um empurrãozinho pra Chef
        Dolly aparecer pra quem vai amar. Só ativamos se você aceitar.{' '}
        {more ? null : (
          <button
            type="button"
            onClick={() => setMore(true)}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-secondary)', fontWeight: 600, cursor: 'pointer', font: 'inherit' }}
          >
            Ler mais
          </button>
        )}
        {more ? null : ' · '}
        <Link href="/privacidade" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
          Privacidade
        </Link>
      </p>
      {more ? (
        <p style={{ margin: '0.5rem 0 0' }}>
          Pra uma cozinha pequena como a da Chef Dolly, chegar até a comunidade vegana nas redes está cada vez mais difícil.
          Aceitar os cookies da Meta e do Google é um empurrãozinho contra o algoritmo: a gente aparece pra quem vai amar,
          e você vê menos anúncio aleatório.
        </p>
      ) : null}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
        <button
          type="button"
          onClick={() => choose('accepted')}
          style={{
            flex: '1 1 0',
            minHeight: '40px',
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
            flex: '1 1 0',
            minHeight: '40px',
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
