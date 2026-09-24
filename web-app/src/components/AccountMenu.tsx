'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Deliberately renders nothing for signed-out visitors: signing in is offered at
 * the purchase points, not pushed in the navigation. Signed-in customers get a
 * quiet confirmation of who they are, plus a way out.
 */
export default function AccountMenu({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [portals, setPortals] = useState<{ is_partner: boolean; is_worker: boolean }>({ is_partner: false, is_worker: false });

  // Only shows the admin link to people on the `admins` list. This is a
  // convenience — the real gate is the database (is_admin() + RLS).
  const userId = user?.id;
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!error && data === true);
    });
    // Which private areas this person has (partner portal, team area).
    supabase.rpc('my_portals').then(({ data, error }) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (!cancelled && !error && row) setPortals({ is_partner: !!row.is_partner, is_worker: !!row.is_worker });
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (!user) return null;

  const displayName = (profile?.full_name || user.email || '').split(' ')[0];
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const avatar = avatarUrl
    ? <img src={avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
    : (
      <span style={{
        width: '28px', height: '28px', borderRadius: '50%', background: '#d4af37', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
      }}>
        {(displayName[0] || '?').toUpperCase()}
      </span>
    );

  if (variant === 'mobile') {
    return (
      <div style={{ padding: '1.5rem 0 0.5rem 0', borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          {avatar}
          <span className="notranslate" translate="no" style={{ color: '#3c2a21', fontWeight: 600 }}>{displayName}</span>
        </div>
        <Link
          href="/minha-conta"
          style={{ display: 'block', color: '#594a42', fontSize: '1rem', textDecoration: 'none', marginBottom: '0.75rem' }}
        >
          Minha Conta
        </Link>
        {portals.is_partner && (
          <Link href="/parceiro" style={{ display: 'block', color: '#594a42', fontSize: '1rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
            Portal do Parceiro
          </Link>
        )}
        {portals.is_worker && (
          <Link href="/equipe" style={{ display: 'block', color: '#594a42', fontSize: '1rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
            Área da Equipe
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            style={{ display: 'block', color: '#8a6d1f', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', marginBottom: '0.75rem' }}
          >
            Administração
          </Link>
        )}
        <button
          onClick={signOut}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: '#594a42', fontSize: '1rem', textDecoration: 'underline',
          }}
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', marginLeft: '1.5rem', cursor: 'pointer' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {avatar}
        <span className="notranslate" translate="no" style={{
          color: '#3c2a21', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px',
        }}>
          {displayName}
        </span>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, background: 'rgba(253,250,243,0.95)',
          backdropFilter: 'blur(10px)', minWidth: '160px', padding: '0.5rem 0', borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(60,42,33,0.1)',
        }}>
          <Link
            href="/minha-conta"
            style={{
              display: 'block', padding: '0.5rem 1.5rem', color: '#594a42',
              fontSize: '0.9rem', textTransform: 'uppercase', textDecoration: 'none',
            }}
          >
            Minha Conta
          </Link>
          {portals.is_partner && (
            <Link href="/parceiro" style={{ display: 'block', padding: '0.5rem 1.5rem', color: '#594a42', fontSize: '0.9rem', textTransform: 'uppercase', textDecoration: 'none' }}>
              Portal do Parceiro
            </Link>
          )}
          {portals.is_worker && (
            <Link href="/equipe" style={{ display: 'block', padding: '0.5rem 1.5rem', color: '#594a42', fontSize: '0.9rem', textTransform: 'uppercase', textDecoration: 'none' }}>
              Área da Equipe
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                display: 'block', padding: '0.5rem 1.5rem', color: '#8a6d1f', fontWeight: 700,
                fontSize: '0.9rem', textTransform: 'uppercase', textDecoration: 'none',
              }}
            >
              Administração
            </Link>
          )}
          <button
            onClick={signOut}
            style={{
              width: '100%', textAlign: 'left', padding: '0.5rem 1.5rem', background: 'none',
              border: 'none', cursor: 'pointer', color: '#594a42', fontSize: '0.9rem', textTransform: 'uppercase',
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
