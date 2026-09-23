'use client';

import React from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';

const PROVIDER_STYLES: Record<AuthProvider, { label: string; icon: string; style: React.CSSProperties }> = {
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

interface SocialLoginPromptProps {
  message?: string;
}

/**
 * Shown only at purchase points, and only to signed-out visitors: signing in is
 * always optional here, never a gate in front of the order.
 */
export default function SocialLoginPrompt({
  message = 'Já tem cadastro? Entre para preencher seus dados automaticamente:',
}: SocialLoginPromptProps) {
  const { user, availableProviders, signIn } = useAuth();

  if (user || availableProviders.length === 0) return null;

  return (
    <div style={{
      background: '#fdfaf3',
      padding: '1.2rem',
      borderRadius: '16px',
      border: '1px solid #e8e1d7',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '0.9rem', color: '#594a42', marginBottom: '1rem', fontWeight: 600 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {availableProviders.map(provider => {
          const { label, icon, style } = PROVIDER_STYLES[provider];
          return (
            <button
              key={provider}
              type="button"
              onClick={() => signIn(provider)}
              className="notranslate"
              translate="no"
              style={{
                padding: '0.6rem 1.2rem',
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
                alt={label}
                style={{ width: '18px', ...(provider === 'facebook' ? { filter: 'brightness(0) invert(1)' } : {}) }}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
