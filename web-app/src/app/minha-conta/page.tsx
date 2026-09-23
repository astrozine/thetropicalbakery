'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, formatBrazilianPhone } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem 1rem',
  border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.8)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  outline: 'none',
};

const DIETARY: { key: DietaryKey; label: string }[] = [
  { key: 'is_vegan', label: 'Vegano' },
  { key: 'is_gluten_free', label: 'Sem Glúten' },
  { key: 'is_sugar_free', label: 'Sem Açúcar' },
  { key: 'is_salt_free', label: 'Sem Sal' },
  { key: 'is_oil_free', label: 'Sem Óleo' },
];

type DietaryKey = 'is_vegan' | 'is_gluten_free' | 'is_sugar_free' | 'is_salt_free' | 'is_oil_free';

export default function MyAccountPage() {
  const { user, profile, loading, saveProfile, signOut } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    is_vegan: false,
    is_gluten_free: false,
    is_sugar_free: false,
    is_salt_free: false,
    is_oil_free: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      is_vegan: profile.is_vegan,
      is_gluten_free: profile.is_gluten_free,
      is_sugar_free: profile.is_sugar_free,
      is_salt_free: profile.is_salt_free,
      is_oil_free: profile.is_oil_free,
    });
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await saveProfile(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '6rem', background: 'var(--color-background)' }}>
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1.5rem' }}>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-primary)',
          marginBottom: '0.5rem',
        }}>
          Minha Conta
        </h1>

        {loading ? (
          <p style={{ color: '#7a6a61' }}>Carregando...</p>
        ) : !user ? (
          <>
            <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '2rem' }}>
              Entre para salvar seus dados de entrega e fazer seus próximos pedidos em segundos.
            </p>
            <LoginPanel />
          </>
        ) : (
          <>
            <p style={{ color: '#7a6a61', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
              Estes dados são preenchidos automaticamente nos seus pedidos. Altere quando quiser.
            </p>

            <form onSubmit={handleSave} className="liquid-glass-card" style={{ padding: '2rem 1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Nome Completo</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp (com DDD)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="(12) 99123-4567"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Endereço de Entrega</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Rua, Número, Bairro, CEP"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Restrições Alimentares</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {DIETARY.map(({ key, label }) => {
                      const on = form[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, [key]: !on })}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: on ? '#d4af37' : '#e8e1d7',
                            background: on ? 'rgba(212,175,55,0.15)' : 'transparent',
                            color: on ? '#3c2a21' : '#7a6a61',
                            fontWeight: on ? 700 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          {on ? '✓ ' : ''}{label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.1rem', marginTop: '2rem', borderRadius: '8px', fontSize: '1rem' }}
              >
                {saving ? 'Salvando...' : saved ? '✅ Dados salvos!' : 'Salvar meus dados'}
              </button>
            </form>

            <div style={{
              marginTop: '2rem',
              padding: '1.25rem',
              background: '#fdfaf3',
              border: '1px solid #e8e1d7',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: '#7a6a61',
              lineHeight: 1.7,
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#3c2a21' }}>Como você entrou:</strong>{' '}
                <span className="notranslate" translate="no">
                  {user.email || formatBrazilianPhone(user.phone) || '—'}
                </span>
              </p>
              <p>
                Para excluir sua conta e seus dados, fale com a gente pelo{' '}
                <a
                  href="https://wa.me/5511932119196"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-secondary)', fontWeight: 600 }}
                >
                  WhatsApp
                </a>. Veja também nossa{' '}
                <Link href="/privacidade" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
                  Política de Privacidade
                </Link>.
              </p>
            </div>

            <button
              onClick={signOut}
              style={{
                marginTop: '1.5rem',
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#7a6a61',
                fontSize: '0.9rem',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Sair da conta
            </button>
          </>
        )}
      </div>
    </main>
  );
}
