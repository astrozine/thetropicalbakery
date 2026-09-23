'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, formatBrazilianPhone } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import AddressFields, { AddressValue, EMPTY_ADDRESS, addressToOneLine } from '@/components/AddressFields';
import MySubscription from '@/components/MySubscription';
import { SUBSCRIPTION_ZONES, formatBRL, isItamambuca } from '@/lib/deliveryZones';
import { DIETARY_FIELDS, DietaryKey } from '@/lib/subscriptions';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  outline: 'none',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.3rem',
  color: 'var(--color-primary)',
  marginBottom: '1.25rem',
  paddingBottom: '0.6rem',
  borderBottom: '1px solid rgba(212,175,55,0.3)',
};

export default function MyAccountPage() {
  const { user, profile, loading, saveProfile, signOut } = useAuth();

  const [basics, setBasics] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    household_size: '',
    delivery_zone: SUBSCRIPTION_ZONES[0]?.id ?? 'zone1',
  });
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [dietary, setDietary] = useState<Record<DietaryKey, boolean>>({
    is_vegan: false, is_gluten_free: false, is_sugar_free: false,
    is_salt_free: false, is_oil_free: false,
  });
  const [tastes, setTastes] = useState({
    allergies: '',
    favorite_flavors: '',
    avoid_ingredients: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setBasics({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      birth_date: profile.birth_date || '',
      household_size: profile.household_size ? String(profile.household_size) : '',
      delivery_zone: profile.delivery_zone || SUBSCRIPTION_ZONES[0]?.id || 'zone1',
    });

    setAddress({
      address_postal_code: profile.address_postal_code || '',
      address_street: profile.address_street || '',
      address_number: profile.address_number || '',
      address_complement: profile.address_complement || '',
      address_neighborhood: profile.address_neighborhood || '',
      // Anyone who filled in the old single-line address before the split keeps
      // it visible in "Rua" until they tidy it up, rather than losing it.
      address_city: profile.address_city || 'Ubatuba',
      address_reference: profile.address_reference || '',
      ...(!profile.address_street && profile.address
        ? { address_street: profile.address }
        : {}),
    });

    setDietary({
      is_vegan: profile.is_vegan,
      is_gluten_free: profile.is_gluten_free,
      is_sugar_free: profile.is_sugar_free,
      is_salt_free: profile.is_salt_free,
      is_oil_free: profile.is_oil_free,
    });

    setTastes({
      allergies: profile.allergies || '',
      favorite_flavors: profile.favorite_flavors || '',
      avoid_ingredients: profile.avoid_ingredients || '',
    });
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await saveProfile({
      full_name: basics.full_name || null,
      phone: basics.phone || null,
      birth_date: basics.birth_date || null,
      household_size: basics.household_size ? Number(basics.household_size) : null,
      delivery_zone: basics.delivery_zone,
      ...address,
      // Keep the one-line version in step for the WhatsApp order messages.
      address: addressToOneLine(address),
      ...dietary,
      allergies: tastes.allergies || null,
      favorite_flavors: tastes.favorite_flavors || null,
      avoid_ingredients: tastes.avoid_ingredients || null,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inItamambuca = isItamambuca({
    delivery_zone: basics.delivery_zone,
    address_neighborhood: address.address_neighborhood,
    address_city: address.address_city,
  });

  return (
    <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '6rem', background: 'var(--color-background)' }}>
      <div className="container" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

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
            <p style={{ color: '#7a6a61', marginBottom: '2.5rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
              Tudo aqui é preenchido automaticamente nos seus pedidos e na sua assinatura.
              Quanto mais completo, mais a Dolly acerta na sua caixa.
            </p>

            <MySubscription />

            {inItamambuca && (
              <div className="liquid-glass-card fade-in" style={{
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(60,42,33,0.03))',
              }}>
                <Image
                  src="/itamambuca-lockup.png"
                  alt="The Tropical Bakery — Itamambuca"
                  width={172}
                  height={220}
                  style={{ width: '86px', height: 'auto', flexShrink: 0 }}
                />
                <div style={{ flex: '1 1 280px' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#3c2a21', marginBottom: '0.5rem' }}>
                    Você está bem no coração de Itamambuca 🌴
                  </h2>
                  <p style={{ color: '#594a42', lineHeight: 1.7, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                    Sendo daqui, você está pertinho de tudo que a Tropical Bakery faz — não só a caixa semanal.
                    Dá uma olhada no que dá pra viver de perto:
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link href="/cursos" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                      Cursos de Confeitaria
                    </Link>
                    <Link href="/retreats" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                      Retiros e Estadias
                    </Link>
                    <Link href="/assinatura" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                      Caixa de Degustação
                    </Link>
                    <a
                      href="https://wa.me/5511932119196?text=Ol%C3%A1%21%20Sou%20de%20Itamambuca%20e%20queria%20saber%20mais%20sobre%20os%20retiros%2Fcursos%20da%20Tropical%20Bakery."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                    >
                      Fazer uma Pergunta
                    </a>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="liquid-glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)' }}>

              {/* ------------------------------------------------ WHO YOU ARE */}
              <h2 style={sectionTitle}>Seus dados</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '2 1 220px' }}>
                    <label style={labelStyle}>Nome completo</label>
                    <input
                      type="text"
                      value={basics.full_name}
                      onChange={e => setBasics({ ...basics, full_name: e.target.value })}
                      placeholder="Ex: Ana Souza"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: '1 1 170px' }}>
                    <label style={labelStyle}>WhatsApp (com DDD)</label>
                    <input
                      type="tel"
                      value={basics.phone}
                      onChange={e => setBasics({ ...basics, phone: e.target.value })}
                      placeholder="(12) 99123-4567"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={labelStyle}>
                      Aniversário{' '}
                      <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(ganha surpresa)</span>
                    </label>
                    <input
                      type="date"
                      value={basics.birth_date}
                      onChange={e => setBasics({ ...basics, birth_date: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={labelStyle}>Quantas pessoas em casa</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={basics.household_size}
                      onChange={e => setBasics({ ...basics, household_size: e.target.value })}
                      placeholder="2"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ ADDRESS */}
              <h2 style={sectionTitle}>Endereço de entrega</h2>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Região</label>
                <select
                  value={basics.delivery_zone}
                  onChange={e => setBasics({ ...basics, delivery_zone: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {SUBSCRIPTION_ZONES.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.label}{z.fee > 0 ? ` — entrega ${formatBRL(z.fee)}` : ' — entrega inclusa'}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                <AddressFields value={address} onChange={setAddress} />
              </div>

              {/* ------------------------------------------------------- TASTES */}
              <h2 style={sectionTitle}>Restrições e preferências</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={labelStyle}>Restrições alimentares</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {DIETARY_FIELDS.map(({ key, label }) => {
                      const on = dietary[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDietary({ ...dietary, [key]: !on })}
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

                <div>
                  <label style={labelStyle}>Alergias</label>
                  <input
                    type="text"
                    value={tastes.allergies}
                    onChange={e => setTastes({ ...tastes, allergies: e.target.value })}
                    placeholder="Ex: castanha de caju, amendoim"
                    style={{ ...inputStyle, borderColor: tastes.allergies ? '#c0392b' : 'rgba(212,175,55,0.5)' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
                    Aparece destacado em vermelho na cozinha toda semana.
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Sabores que você ama</label>
                  <input
                    type="text"
                    value={tastes.favorite_flavors}
                    onChange={e => setTastes({ ...tastes, favorite_flavors: e.target.value })}
                    placeholder="Ex: cacau intenso, coco, maracujá"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>O que você prefere não receber</label>
                  <input
                    type="text"
                    value={tastes.avoid_ingredients}
                    onChange={e => setTastes({ ...tastes, avoid_ingredients: e.target.value })}
                    placeholder="Ex: banana, hortelã"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
                    Não é alergia — só não é a sua praia. A Dolly troca por outra coisa.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.1rem', marginTop: '2.5rem', borderRadius: '8px', fontSize: '1rem' }}
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
