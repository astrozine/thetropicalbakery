'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import { SunbakedLettersNote } from '@/components/SunbakedLetters';
import FormSideRails, { RailCard, RailSteps } from '@/components/FormSideRails';
import AddressFields, { AddressValue, EMPTY_ADDRESS, addressToOneLine } from '@/components/AddressFields';
import { SUBSCRIPTION_ZONES, getZone, formatBRL } from '@/lib/deliveryZones';
import { SubscriptionPlan, DIETARY_FIELDS, DietaryKey } from '@/lib/subscriptions';
import BoxSizePicker from '@/components/BoxSizePicker';
import { DEFAULT_TREAT_COUNT, TreatCount, planBoxPrice, sizeText } from '@/lib/boxSizes';
import { useBoxSizePrices } from '@/lib/useBoxSizePrices';

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
  const [boxSize, setBoxSize] = useState<TreatCount>(DEFAULT_TREAT_COUNT);
  const sizePrices = useBoxSizePrices();
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
  const [showOptional, setShowOptional] = useState(false);

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
  // Every plan takes its usual discount off every size (create_subscription does the same sum in SQL).
  const basePerBox = Math.max(0, ...plans.map(p => Number(p.price_per_box) || 0));
  const perBoxFor = (p: SubscriptionPlan, size: TreatCount = boxSize) => planBoxPrice(Number(p.price_per_box), basePerBox, sizePrices[size]);
  const perBox = plan ? perBoxFor(plan) : 0;
  const boxesMonthly = perBox * 4 * boxesPerWeek;
  const total = boxesMonthly + deliveryFee * 4;

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

    const args = {
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
    };
    let { error: rpcError } = await supabase.rpc('create_subscription', { ...args, p_box_size: boxSize });
    if (rpcError && (rpcError.code === 'PGRST202' || /p_box_size|create_subscription/.test(rpcError.message))) {
      // Migration 24 not run yet: save without the size, and put the size in the note so Dolly sees it.
      ({ error: rpcError } = await supabase.rpc('create_subscription', {
        ...args,
        p_customer_message: [`Caixa de ${sizeText(boxSize)}`, message].filter(Boolean).join(' · '),
      }));
    }

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
      `*Plano:* ${plan.name} — ${formatBRL(perBox * 4)}/mês`,
      `*Tamanho:* caixa de ${sizeText(boxSize)}`,
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
        <SunbakedLettersNote />
      </div>
    );
  }

  // Desktop rail: the live total stays in view while they fill in the address, instead of only at the bottom.
  const rail = (
    <>
      {plan && (
        <RailCard title="Seu plano">
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-primary)' }}>{plan.name}</p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#7a6a61', lineHeight: 1.5 }}>
            {boxesPerWeek} {boxesPerWeek === 1 ? 'caixa' : 'caixas'} de {sizeText(boxSize)} por semana · entrega {deliveryFee === 0 ? 'inclusa' : `${formatBRL(deliveryFee)}/semana`}
          </p>
          <div style={{ marginTop: '0.7rem', paddingTop: '0.7rem', borderTop: '1px solid #efe4c8' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#594a42', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total por mês</span>
            <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{formatBRL(total)}</span>
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#7a6a61' }}>
            {formatBRL(perBox)} por caixa{plan.commitment_months > 1 && ` · ${plan.commitment_months} meses`}
          </p>
        </RailCard>
      )}
      <RailCard title="Como funciona">
        <RailSteps steps={[
          'Você reserva agora, sem pagar nada',
          'A Dolly te chama no WhatsApp, normalmente no mesmo dia',
          'Pagamento por Pix e a primeira caixa sai na próxima entrega',
        ]} />
      </RailCard>
    </>
  );

  return (
    <FormSideRails formWidth={760} rail={rail}>
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

      {/* Logged-in welcome banner — replaces the LoginPanel only when we already
          know who they are, because typing your name twice is demoralising. */}
      {user ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.75rem',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)',
        }}>
          <span style={{ fontSize: '1.5rem' }}>✓</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
              {profile?.full_name ? `Olá, ${profile.full_name.split(' ')[0]}!` : 'Você está conectado'}
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#7a6a61' }}>
              {profile?.full_name ? 'Seus dados já estão preenchidos.' : 'Entre para preencher tudo em 10 segundos.'}
            </p>
          </div>
        </div>
      ) : (
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
                <div style={{ fontSize: '0.85rem', color: '#7a6a61' }}>{formatBRL(perBoxFor(p) * 4)}/mês</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Same three sizes as the one-off box, at this plan's price. */}
      {plan && (
        <div style={{ marginBottom: '1.75rem' }}>
          <BoxSizePicker
            value={boxSize}
            onChange={setBoxSize}
            priceOf={size => perBoxFor(plan, size)}
            priceNote="por caixa"
            title="Quantos doces em cada caixa?"
          />
          <p style={{ fontSize: '0.8rem', color: '#7a6a61', marginTop: '0.6rem' }}>
            Quer mudar depois? Dá para aumentar ou diminuir a caixa a qualquer momento, é só avisar a Dolly.
          </p>
        </div>
      )}

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

        {/* ── Optional fields: collapsed by default ── */}
        <div style={{
          borderRadius: '12px',
          border: '1px solid #e8e1d7',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => setShowOptional(v => !v)}
            style={{
              width: '100%', textAlign: 'left', background: 'rgba(212,175,55,0.06)',
              border: 'none', padding: '0.85rem 1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
              🌿 Personalizar minha caixa
            </span>
            <span style={{ color: '#d4af37', fontSize: '1.1rem', flexShrink: 0 }}>
              {showOptional ? '−' : '+'}
            </span>
          </button>

          {showOptional && (
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
                  Isso aparece destacado na cozinha toda semana.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={labelStyle}>Quem te indicou? <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(opcional)</span></label>
                  <input type="text" value={referredBy} onChange={e => setReferredBy(e.target.value)} placeholder="Nome de quem indicou" style={inputStyle} />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={labelStyle}>Caixas por semana</label>
                  <select value={boxesPerWeek} onChange={e => setBoxesPerWeek(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'caixa' : 'caixas'}</option>)}
                  </select>
                </div>
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
          )}
        </div>
      </div>

      {/* Running total, so there is never a surprise at the end. */}
      {plan && (
        <div style={{
          marginTop: '2rem', padding: '1.25rem', borderRadius: '14px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#594a42', marginBottom: '0.4rem',
            flexWrap: 'wrap', gap: '0.25rem',
          }}>
            <span>{boxesPerWeek} {boxesPerWeek === 1 ? 'caixa' : 'caixas'} de {sizeText(boxSize)} por semana — plano {plan.name}</span>
            <span>{formatBRL(boxesMonthly)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#594a42' }}>
            <span>Entrega ({zone?.label.split(',')[0]})</span>
            <span>{deliveryFee === 0 ? 'Inclusa' : `${formatBRL(deliveryFee * 4)}`}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            flexWrap: 'wrap', gap: '0.25rem',
            marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(212,175,55,0.35)',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Total por mês</span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.3rem, 5vw, 1.7rem)',
              color: 'var(--color-primary)',
              whiteSpace: 'nowrap',
            }}>
              {formatBRL(total)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginTop: '0.6rem' }}>
            Equivale a {formatBRL(perBox)} por caixa
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
        style={{
          width: '100%', padding: '1.2rem', marginTop: '1.5rem', borderRadius: '10px', fontSize: '1.05rem',
          marginBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 64px)',
        }}
      >
        {submitting ? 'Reservando...' : 'Reservar minha vaga'}
      </button>

      <p style={{ fontSize: '0.75rem', color: '#a89a90', textAlign: 'center', marginTop: '1rem', lineHeight: 1.7 }}>
        Você não paga nada agora. A Dolly confirma sua vaga e o pagamento por WhatsApp.
      </p>
    </form>
    </FormSideRails>
  );
}
