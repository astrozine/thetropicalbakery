'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import AddressFields, { AddressValue, EMPTY_ADDRESS, addressToOneLine } from '@/components/AddressFields';
import { SUBSCRIPTION_ZONES, getZone, formatBRL } from '@/lib/deliveryZones';
import { SubscriptionPlan, DIETARY_FIELDS, DietaryKey, monthlyTotal } from '@/lib/subscriptions';

const STORE_WHATSAPP = '5511932119196';

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

interface SubscriptionSignupProps {
  plans: SubscriptionPlan[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
}

export default function SubscriptionSignup({ plans, selectedPlanId, onSelectPlan }: SubscriptionSignupProps) {
  const { user, profile, saveProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [zoneId, setZoneId] = useState(SUBSCRIPTION_ZONES[0]?.id ?? 'zone1');
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [boxesPerWeek, setBoxesPerWeek] = useState(1);
  const [allergies, setAllergies] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [message, setMessage] = useState('');
  const [dietary, setDietary] = useState<Record<DietaryKey, boolean>>({
    is_vegan: false, is_gluten_free: false, is_sugar_free: false,
    is_salt_free: false, is_oil_free: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Nobody who already has an account should retype what we know.
  useEffect(() => {
    if (!profile) return;
    setFullName(prev => prev || profile.full_name || '');
    setWhatsapp(prev => prev || profile.phone || '');
    setAllergies(prev => prev || (profile as { allergies?: string }).allergies || '');
    setDietary({
      is_vegan: profile.is_vegan,
      is_gluten_free: profile.is_gluten_free,
      is_sugar_free: profile.is_sugar_free,
      is_salt_free: profile.is_salt_free,
      is_oil_free: profile.is_oil_free,
    });
    if (profile.delivery_zone) setZoneId(profile.delivery_zone);

    const p = profile as unknown as Partial<AddressValue>;
    setAddress(prev => ({
      address_postal_code: prev.address_postal_code || p.address_postal_code || '',
      address_street: prev.address_street || p.address_street || '',
      address_number: prev.address_number || p.address_number || '',
      address_complement: prev.address_complement || p.address_complement || '',
      address_neighborhood: prev.address_neighborhood || p.address_neighborhood || '',
      address_city: prev.address_city || p.address_city || 'Ubatuba',
      address_reference: prev.address_reference || p.address_reference || '',
    }));
  }, [profile]);

  useEffect(() => {
    if (user?.email) setEmail(prev => prev || user.email || '');
  }, [user]);

  const plan = plans.find(p => p.id === selectedPlanId) ?? plans[0];
  const zone = getZone(zoneId);
  const deliveryFee = zone?.fee ?? 0;
  const total = plan ? monthlyTotal(plan, boxesPerWeek, deliveryFee) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    if (!fullName.trim() || !whatsapp.trim()) {
      setError('Precisamos do seu nome e WhatsApp para confirmar a assinatura.');
      return;
    }
    if (!address.address_street.trim() || !address.address_number.trim()) {
      setError('Precisamos da rua e do número para entregar sua caixa.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: rpcError } = await supabase.rpc('create_subscription', {
      p_plan_id: plan.id,
      p_full_name: fullName,
      p_whatsapp_number: whatsapp,
      p_email: email || null,
      p_delivery_zone: zoneId,
      p_address_street: address.address_street,
      p_address_number: address.address_number,
      p_address_complement: address.address_complement || null,
      p_address_neighborhood: address.address_neighborhood || null,
      p_address_city: address.address_city || null,
      p_address_postal_code: address.address_postal_code || null,
      p_address_reference: address.address_reference || null,
      p_is_vegan: dietary.is_vegan,
      p_is_gluten_free: dietary.is_gluten_free,
      p_is_sugar_free: dietary.is_sugar_free,
      p_is_salt_free: dietary.is_salt_free,
      p_is_oil_free: dietary.is_oil_free,
      p_allergies: allergies || null,
      p_boxes_per_week: boxesPerWeek,
      p_delivery_fee: deliveryFee,
      p_referred_by: referredBy || null,
      p_customer_message: message || null,
    });

    if (rpcError) {
      console.error('Subscription error:', rpcError);
      setSubmitting(false);
      setError('Não conseguimos registrar sua assinatura. Tente novamente ou fale com a gente no WhatsApp.');
      return;
    }

    // Keep their account in step for next time. Never allowed to fail the signup.
    await saveProfile({
      full_name: fullName,
      phone: whatsapp,
      address: addressToOneLine(address),
      delivery_zone: zoneId,
      ...dietary,
      ...(address as unknown as Record<string, string>),
      allergies,
    } as never);

    if (email.trim()) {
      await supabase.rpc('email_contact_upsert', {
        p_email: email.trim(), p_full_name: fullName, p_tags: ['cliente', 'assinante'], p_source: 'assinatura',
      });
    }

    setSubmitting(false);
    setDone(true);
  };

  if (done && plan) {
    const restrictions = DIETARY_FIELDS.filter(d => dietary[d.key]).map(d => d.label);
    const lines = [
      `Olá Tropical Bakery! Quero assinar a Caixa de Degustação Semanal 🌴`,
      ``,
      `*Plano:* ${plan.name} — ${formatBRL(plan.monthly_price)}/mês`,
      `*Caixas por semana:* ${boxesPerWeek}`,
      `*Nome:* ${fullName}`,
      `*Região:* ${zone?.label ?? '-'}`,
      `*Endereço:* ${addressToOneLine(address)}`,
      address.address_reference ? `*Referência:* ${address.address_reference}` : '',
      restrictions.length ? `*Restrições:* ${restrictions.join(', ')}` : '',
      allergies ? `*Alergias:* ${allergies}` : '',
      ``,
      `*Total mensal:* ${formatBRL(total)}`,
    ].filter(Boolean);

    const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;

    return (
      <div style={{
        background: '#fdfaf3', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '20px',
        padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', maxWidth: '620px', margin: '0 auto',
      }}>
        <img src="/logo-gold.webp" alt="" style={{ height: '72px', margin: '0 auto 1.5rem', display: 'block' }} />
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
          Sua vaga está reservada
        </h3>
        <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          Recebemos seu pedido de assinatura do plano <strong>{plan.name}</strong>. A Dolly vai te
          chamar no WhatsApp para confirmar tudo e combinar o pagamento por Pix — normalmente no
          mesmo dia.
        </p>
        <p style={{ color: '#7a6a61', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Sua primeira caixa sai no próximo dia de entrega depois da confirmação.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', background: '#25D366', color: '#fff', padding: '1rem 2rem',
            borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '1.05rem',
          }}
        >
          Falar com a Dolly agora
        </a>
        <p style={{ fontSize: '0.8rem', color: '#a89a90', marginTop: '1.25rem' }}>
          Quer adiantar? Toque acima e a mensagem já vai pronta.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#fdfaf3', border: '1px solid rgba(212,175,55,0.35)', borderRadius: '20px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: '760px', margin: '0 auto',
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--color-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
        Reservar minha vaga
      </h3>
      <p style={{ color: '#7a6a61', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
        Sem pagamento agora. Você confirma tudo por WhatsApp com a Dolly.
      </p>

      {!user && (
        <div style={{ marginBottom: '2rem' }}>
          <LoginPanel
            message="Entre para reservar em 10 segundos"
            subMessage="Seus dados já vêm preenchidos, e você acompanha sua assinatura depois."
          />
        </div>
      )}

      {/* Plan picker, so someone who scrolled straight here can still choose. */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={labelStyle}>Plano escolhido</label>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {plans.map(p => {
            const on = p.id === selectedPlanId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPlan(p.id)}
                style={{
                  flex: '1 1 150px', padding: '0.85rem 1rem', borderRadius: '12px',
                  border: '1px solid', borderColor: on ? '#d4af37' : '#e8e1d7',
                  background: on ? 'rgba(212,175,55,0.14)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{p.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#7a6a61' }}>{formatBRL(p.monthly_price)}/mês</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={labelStyle}>Nome completo</label>
            <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: Ana Souza" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={labelStyle}>WhatsApp (com DDD)</label>
            <input required type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(12) 99123-4567" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>E-mail <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(opcional)</span></label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Região de entrega</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {SUBSCRIPTION_ZONES.map(z => (
              <option key={z.id} value={z.id}>
                {z.label}{z.fee > 0 ? ` — entrega ${formatBRL(z.fee)}/semana` : ' — entrega inclusa'}
              </option>
            ))}
          </select>
        </div>

        <AddressFields value={address} onChange={setAddress} required />

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 1 200px' }}>
            <label style={labelStyle}>Caixas por semana</label>
            <select value={boxesPerWeek} onChange={e => setBoxesPerWeek(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'caixa' : 'caixas'}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <label style={labelStyle}>Quem te indicou? <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(opcional)</span></label>
            <input type="text" value={referredBy} onChange={e => setReferredBy(e.target.value)} placeholder="Nome de quem indicou" style={inputStyle} />
          </div>
        </div>

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
                    padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid',
                    borderColor: on ? '#d4af37' : '#e8e1d7',
                    background: on ? 'rgba(212,175,55,0.15)' : 'transparent',
                    color: on ? '#3c2a21' : '#7a6a61', fontWeight: on ? 700 : 500,
                    fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  {on ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Alergias — o que nunca pode entrar na sua caixa</label>
          <input
            type="text"
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            placeholder="Ex: castanha de caju, amendoim, soja"
            style={inputStyle}
          />
          <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.4rem' }}>
            Isso aparece destacado na cozinha toda semana. Se for grave, conte pra gente no WhatsApp também.
          </p>
        </div>

        <div>
          <label style={labelStyle}>Algo que a Dolly deveria saber? <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(opcional)</span></label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Sabores favoritos, quantas pessoas em casa, melhor horário para entrega..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Running total, so there is never a surprise at the end. */}
      {plan && (
        <div style={{
          marginTop: '2rem', padding: '1.25rem', borderRadius: '14px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#594a42', marginBottom: '0.4rem' }}>
            <span>{boxesPerWeek} {boxesPerWeek === 1 ? 'caixa' : 'caixas'} por semana — plano {plan.name}</span>
            <span>{formatBRL(plan.monthly_price * boxesPerWeek)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#594a42' }}>
            <span>Entrega ({zone?.label.split(',')[0]})</span>
            <span>{deliveryFee === 0 ? 'Inclusa' : `${formatBRL(deliveryFee * 4)}`}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(212,175,55,0.35)',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Total por mês</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', color: 'var(--color-primary)' }}>
              {formatBRL(total)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.6rem' }}>
            Equivale a {formatBRL(plan.price_per_box)} por caixa
            {plan.commitment_months > 1 && ` · compromisso de ${plan.commitment_months} meses`}
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: '#c0392b', fontSize: '0.9rem', marginTop: '1rem' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
        style={{ width: '100%', padding: '1.2rem', marginTop: '1.5rem', borderRadius: '10px', fontSize: '1.05rem' }}
      >
        {submitting ? 'Reservando...' : 'Reservar minha vaga'}
      </button>

      <p style={{ fontSize: '0.75rem', color: '#a89a90', textAlign: 'center', marginTop: '1rem', lineHeight: 1.7 }}>
        Você não paga nada agora. A Dolly confirma sua vaga e o pagamento por WhatsApp.
      </p>
    </form>
  );
}
