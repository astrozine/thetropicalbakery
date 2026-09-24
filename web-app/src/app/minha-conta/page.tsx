'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, formatBrazilianPhone } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import AddressFields, { AddressValue, EMPTY_ADDRESS, addressToOneLine } from '@/components/AddressFields';
import MySubscription from '@/components/MySubscription';
import MyPickups from '@/components/MyPickups';
import { SUBSCRIPTION_ZONES, formatBRL, isItamambuca } from '@/lib/deliveryZones';
import DietaryPicker, { DietaryValue } from '@/components/DietaryPicker';
import AccountSection from '@/components/AccountSection';
import { allergensFrom, dietTagsFrom, legacyFlags, tagsFromLegacy } from '@/lib/dietary';
import { supabase } from '@/lib/supabase';

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

const FOLD_ORDER = ['dados', 'endereco', 'dieta', 'gostos'] as const;
type FoldId = typeof FOLD_ORDER[number];

/** Which folds are filled in. Pure, so it can run before the form state has caught up with the profile. */
function completeness(
  b: { full_name: string; phone: string; birth_date: string; household_size: string },
  a: AddressValue,
  d: DietaryValue,
  t: { allergies: string; favorite_flavors: string; avoid_ingredients: string },
): Record<FoldId, boolean> {
  return {
    dados: !!(b.full_name.trim() && b.phone.trim() && b.birth_date && b.household_size),
    endereco: !!(a.address_street.trim() && a.address_number.trim() && a.address_neighborhood.trim()),
    dieta: d.tags.length + d.allergens.length > 0 || !!t.allergies.trim(),
    gostos: !!(t.favorite_flavors.trim() || t.avoid_ingredients.trim()),
  };
}

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
  const [diet, setDiet] = useState<DietaryValue>({ tags: [], allergens: [], notes: '' });
  const [tastes, setTastes] = useState({
    allergies: '',
    favorite_flavors: '',
    avoid_ingredients: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([]);
  // What was last saved, to tell when there are unsaved changes.
  const [baseline, setBaseline] = useState('');
  const openedFirst = useRef(false);

  const toggle = (id: string) => setOpenIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));

  useEffect(() => {
    if (!profile) return;

    const b = {
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      birth_date: profile.birth_date || '',
      household_size: profile.household_size ? String(profile.household_size) : '',
      delivery_zone: profile.delivery_zone || SUBSCRIPTION_ZONES[0]?.id || 'zone1',
    };
    const a: AddressValue = {
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
    };
    // An account from before migration 19 only has the five booleans.
    const d: DietaryValue = {
      tags: profile.diet_tags?.length ? profile.diet_tags : tagsFromLegacy(profile),
      allergens: profile.allergens_avoid || [],
      notes: profile.diet_notes || '',
    };
    const t = {
      allergies: profile.allergies || '',
      favorite_flavors: profile.favorite_flavors || '',
      avoid_ingredients: profile.avoid_ingredients || '',
    };

    setBasics(b);
    setAddress(a);
    setDiet(d);
    setTastes(t);
    setBaseline(JSON.stringify({ basics: b, address: a, diet: d, tastes: t }));

    // The first time, open the first fold that still needs something from them.
    if (!openedFirst.current) {
      openedFirst.current = true;
      const c = completeness(b, a, d, t);
      const firstTodo = FOLD_ORDER.find(id => !c[id]);
      if (firstTodo) setOpenIds([firstTodo]);
    }
  }, [profile]);

  // Everything the form holds, as one comparable string.
  const snapshot = JSON.stringify({ basics, address, diet, tastes });
  const dirty = baseline !== '' && snapshot !== baseline;
  const done = completeness(basics, address, diet, tastes);

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
      ...legacyFlags(diet.tags),
      diet_tags: diet.tags,
      allergens_avoid: diet.allergens,
      diet_notes: diet.notes.trim() || null,
      allergies: tastes.allergies || null,
      favorite_flavors: tastes.favorite_flavors || null,
      avoid_ingredients: tastes.avoid_ingredients || null,
    });

    // Keep the CRM list and the e-mail audience in step, so a change here also
    // changes which announcements reach this person. Never fails the save.
    const flags = legacyFlags(diet.tags);
    if (basics.phone) {
      await supabase.rpc('upsert_crm_customer', {
        p_full_name: basics.full_name || null,
        p_whatsapp_number: basics.phone,
        p_email: user?.email ?? null,
        p_is_vegan: flags.is_vegan,
        p_is_gluten_free: flags.is_gluten_free,
        p_is_sugar_free: flags.is_sugar_free,
        p_is_salt_free: flags.is_salt_free,
        p_is_oil_free: flags.is_oil_free,
        p_diet_tags: diet.tags,
        p_allergens: diet.allergens,
        p_diet_notes: tastes.allergies || null,
      }).then(({ error }) => { if (error) console.error('CRM sync:', error.message); });
    }
    if (user?.email) {
      await supabase.rpc('email_contact_set_diet', {
        p_email: user.email,
        p_diet_tags: diet.tags,
        p_allergens: diet.allergens,
        p_notes: tastes.allergies || null,
      }).then(({ error }) => { if (error) console.error('E-mail diet sync:', error.message); });
    }

    setBaseline(snapshot);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const firstName = (basics.full_name || profile?.full_name || '').trim().split(' ')[0];
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const checks = Object.values(done);
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const addressSummary = [
    [address.address_street, address.address_number].filter(Boolean).join(', '),
    address.address_neighborhood,
  ].filter(Boolean).join(' · ');
  const dietSummaryLine = [
    dietTagsFrom(diet.tags).map(t => t.label).join(', '),
    diet.allergens.length ? `${diet.allergens.length} ${diet.allergens.length === 1 ? 'alergia' : 'alergias'}: ${allergensFrom(diet.allergens).map(a => a.label).join(', ')}` : '',
  ].filter(Boolean).join(' · ');

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

            <MyPickups />

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

            <form onSubmit={handleSave}>

              {/* ------------------------------------------------- profile header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
                padding: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: '1.25rem', borderRadius: '24px',
                background: 'linear-gradient(135deg, #3c2a21 0%, #5a3d2e 100%)', color: '#fdfaf3',
                boxShadow: '0 16px 40px rgba(60,42,33,0.18)',
              }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #d4af37' }} />
                ) : (
                  <span aria-hidden style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#d4af37', color: '#3c2a21', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {(firstName[0] || '🌴').toUpperCase()}
                  </span>
                )}
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <p style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffd166', fontWeight: 700, margin: 0 }}>Seu perfil</p>
                  <p className="notranslate" translate="no" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem, 3.5vw, 1.7rem)', margin: '0.15rem 0 0.6rem', lineHeight: 1.15 }}>
                    {firstName ? `Oi, ${firstName}!` : 'Bem-vindo(a)!'}
                  </p>
                  <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #ffd166, #d4af37)', transition: 'width .5s' }} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(253,250,243,0.8)', margin: '0.5rem 0 0' }}>
                    {pct === 100
                      ? '🎉 Perfil completo — a Dolly já sabe tudo para acertar na sua caixa.'
                      : `${pct}% completo — quanto mais a Dolly conhece, mais a caixa é a sua cara.`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '0.75rem' }}>
                <button type="button" onClick={() => setOpenIds([...FOLD_ORDER, 'conta'])}
                  style={{ background: 'none', border: 'none', color: '#8a6d1f', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Abrir tudo
                </button>
                <button type="button" onClick={() => setOpenIds([])}
                  style={{ background: 'none', border: 'none', color: '#7a6a61', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Fechar tudo
                </button>
              </div>

              <div style={{ display: 'grid', gap: '0.9rem' }}>

                {/* --------------------------------------------------- WHO YOU ARE */}
                <AccountSection
                  id="dados" emoji="👤" accent="#e2792a" title="Seus dados"
                  open={openIds.includes('dados')} onToggle={() => toggle('dados')}
                  status={done.dados ? { label: 'Completo', tone: 'ok' } : { label: 'Falta preencher', tone: 'todo' }}
                  summary={[basics.full_name, basics.phone].filter(Boolean).join(' · ') || 'Nome, WhatsApp, aniversário…'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '2 1 220px' }}>
                        <label style={labelStyle}>Nome completo</label>
                        <input type="text" value={basics.full_name} onChange={e => setBasics({ ...basics, full_name: e.target.value })} placeholder="Ex: Ana Souza" style={inputStyle} />
                      </div>
                      <div style={{ flex: '1 1 170px' }}>
                        <label style={labelStyle}>WhatsApp (com DDD)</label>
                        <input type="tel" value={basics.phone} onChange={e => setBasics({ ...basics, phone: e.target.value })} placeholder="(12) 99123-4567" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 180px' }}>
                        <label style={labelStyle}>
                          Aniversário <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(ganha surpresa 🎂)</span>
                        </label>
                        <input type="date" value={basics.birth_date} onChange={e => setBasics({ ...basics, birth_date: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ flex: '1 1 180px' }}>
                        <label style={labelStyle}>Quantas pessoas em casa</label>
                        <input type="number" min={1} max={20} value={basics.household_size} onChange={e => setBasics({ ...basics, household_size: e.target.value })} placeholder="2" style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </AccountSection>

                {/* ------------------------------------------------------ ADDRESS */}
                <AccountSection
                  id="endereco" emoji="🏡" accent="#5aa9e6" title="Onde entregamos"
                  open={openIds.includes('endereco')} onToggle={() => toggle('endereco')}
                  status={done.endereco ? { label: 'Completo', tone: 'ok' } : { label: 'Falta preencher', tone: 'todo' }}
                  summary={addressSummary || 'Rua, número, bairro e ponto de referência'}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Região</label>
                    <select value={basics.delivery_zone} onChange={e => setBasics({ ...basics, delivery_zone: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {SUBSCRIPTION_ZONES.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.label}{z.fee > 0 ? ` — entrega ${formatBRL(z.fee)}` : ' — entrega inclusa'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <AddressFields value={address} onChange={setAddress} />
                </AccountSection>

                {/* ---------------------------------------------- DIET + ALLERGIES */}
                <AccountSection
                  id="dieta" emoji="🌱" accent="#9bab3c" title="Restrições e alergias"
                  open={openIds.includes('dieta')} onToggle={() => toggle('dieta')}
                  status={done.dieta ? { label: 'Preenchido', tone: 'ok' } : { label: 'Conte pra gente', tone: 'todo' }}
                  summary={dietSummaryLine || 'Vegano, sem glúten, alergias…'}
                >
                  <p style={{ fontSize: '0.86rem', color: '#7a6a61', lineHeight: 1.7, margin: '0 0 1rem' }}>
                    A gente confere isto contra <strong>cada doce</strong> antes de te mandar qualquer novidade.
                  </p>
                  <DietaryPicker value={diet} onChange={setDiet} showNotes={false} />

                  <div style={{ marginTop: '1.4rem' }}>
                    <label style={labelStyle}>Alergias, com as suas palavras</label>
                    <input
                      type="text" value={tastes.allergies}
                      onChange={e => setTastes({ ...tastes, allergies: e.target.value })}
                      placeholder="Ex: castanha de caju, amendoim"
                      style={{ ...inputStyle, borderColor: tastes.allergies ? '#c0392b' : 'rgba(212,175,55,0.5)' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
                      Aparece destacado em vermelho na cozinha toda semana.
                    </p>
                  </div>
                </AccountSection>

                {/* ---------------------------------------------------------- TASTES */}
                <AccountSection
                  id="gostos" emoji="💛" accent="#d9453a" title="Seus gostos"
                  open={openIds.includes('gostos')} onToggle={() => toggle('gostos')}
                  status={done.gostos ? { label: 'Preenchido', tone: 'ok' } : { label: 'Opcional', tone: 'quiet' }}
                  summary={tastes.favorite_flavors ? `Ama: ${tastes.favorite_flavors}` : 'Sabores que você ama e o que prefere não receber'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                      <label style={labelStyle}>Sabores que você ama</label>
                      <input type="text" value={tastes.favorite_flavors} onChange={e => setTastes({ ...tastes, favorite_flavors: e.target.value })} placeholder="Ex: cacau intenso, coco, maracujá" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>O que você prefere não receber</label>
                      <input type="text" value={tastes.avoid_ingredients} onChange={e => setTastes({ ...tastes, avoid_ingredients: e.target.value })} placeholder="Ex: banana, hortelã" style={inputStyle} />
                      <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
                        Não é alergia — só não é a sua praia. A Dolly troca por outra coisa.
                      </p>
                    </div>
                  </div>
                </AccountSection>

                {/* --------------------------------------------- ACCOUNT + PRIVACY */}
                <AccountSection
                  id="conta" emoji="🔐" accent="#8b7d72" title="Conta e privacidade"
                  open={openIds.includes('conta')} onToggle={() => toggle('conta')}
                  status={{ label: 'Segura', tone: 'quiet' }}
                  summary={<span className="notranslate" translate="no">{user.email || formatBrazilianPhone(user.phone) || '—'}</span>}
                >
                  <p style={{ color: '#7a6a61', fontSize: '0.88rem', lineHeight: 1.75, margin: '0 0 0.9rem' }}>
                    <strong style={{ color: '#3c2a21' }}>Como você entrou:</strong>{' '}
                    <span className="notranslate" translate="no">{user.email || formatBrazilianPhone(user.phone) || '—'}</span>
                  </p>
                  <p style={{ color: '#7a6a61', fontSize: '0.88rem', lineHeight: 1.75, margin: '0 0 1.1rem' }}>
                    Para excluir sua conta e seus dados, fale com a gente pelo{' '}
                    <a href="https://wa.me/5511932119196" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>WhatsApp</a>.
                    Veja também nossa{' '}
                    <Link href="/privacidade" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Política de Privacidade</Link>
                    {' '}e as suas{' '}
                    <Link href="/preferencias" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>preferências de e-mail</Link>.
                  </p>
                  <button type="button" onClick={signOut}
                    style={{ background: 'none', border: '1px solid #d9cfc2', borderRadius: '8px', padding: '0.6rem 1.2rem', color: '#594a42', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    Sair da conta
                  </button>
                </AccountSection>

              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.1rem', marginTop: '1.75rem', borderRadius: '8px', fontSize: '1rem' }}
              >
                {saving ? 'Salvando...' : saved ? '✅ Dados salvos!' : 'Salvar meus dados'}
              </button>

              {/* Appears when something has changed, so nobody leaves without saving. */}
              {dirty && (
                <div role="status" style={{
                  position: 'fixed', left: '50%', bottom: '1.25rem', transform: 'translateX(-50%)', zIndex: 60,
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 0.8rem 0.7rem 1.25rem',
                  background: '#3c2a21', color: '#fdfaf3', borderRadius: '999px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  maxWidth: 'calc(100vw - 2rem)',
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>✏️ Alterações não salvas</span>
                  <button type="submit" disabled={saving}
                    style={{ background: '#d4af37', color: '#3c2a21', border: 'none', borderRadius: '999px', padding: '0.55rem 1.2rem', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              )}
            </form>

          </>
        )}
      </div>
    </main>
  );
}
