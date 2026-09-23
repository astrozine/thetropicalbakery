'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart, CartItem } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import DeliveryCalendar from '@/components/DeliveryCalendar';
import { generatePixData } from '@/utils/pix';
import { supabase } from '@/lib/supabase';
import { DELIVERY_ZONES, getZone, formatBRL } from '@/lib/deliveryZones';
import { DIETARY_FIELDS, DietaryKey } from '@/lib/subscriptions';
import { fetchSchedule, selectableDates, toISODate } from '@/lib/deliverySchedule';

const STORE_WHATSAPP = '5511932119196';
const DATE_KEY = 'checkout_delivery_date';

const parsePrice = (price: string) => parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '1rem', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', outline: 'none' };

interface PlacedOrder {
  items: CartItem[];
  subtotal: number;
  fee: number;
  total: number;
  isBox: boolean;
  date: string;
  zoneLabel: string;
  saved: boolean;
}

/** One checkout for everything: Degustation Boxes and Menu de Eventos items, always ending in Pix. */
export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile, saveProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [pixPayload, setPixPayload] = useState('');
  const [pixQR, setPixQR] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', address: '', date: '' });
  const [zoneId, setZoneId] = useState('zone1');
  const [dietary, setDietary] = useState<Record<DietaryKey, boolean>>({
    is_vegan: false, is_gluten_free: false, is_sugar_free: false, is_salt_free: false, is_oil_free: false,
  });

  const boxItems = items.filter(i => i.kind === 'box');
  const hasBox = boxItems.length > 0;
  const boxCount = boxItems.reduce((n, i) => n + i.quantity, 0);
  const zone = getZone(zoneId);
  const deliveryFee = hasBox ? (zone?.fee ?? 0) : 0;
  const total = totalPrice + deliveryFee;

  // Pre-fill with anything the customer already gave us (earlier order, or their account)
  useEffect(() => {
    const savedName = localStorage.getItem('checkout_fullName');
    const savedPhone = localStorage.getItem('checkout_phone');
    const savedAddress = localStorage.getItem('checkout_address');
    const savedDate = localStorage.getItem(DATE_KEY);
    setFormData(prev => ({
      ...prev,
      name: prev.name || savedName || '',
      whatsapp: prev.whatsapp || savedPhone || '',
      address: prev.address || savedAddress || '',
      date: prev.date || savedDate || '',
    }));
  }, []);

  useEffect(() => {
    if (!profile && !user) return;
    setFormData(prev => ({
      ...prev,
      name: profile?.full_name || prev.name,
      whatsapp: profile?.phone || prev.whatsapp,
      address: profile?.address || prev.address,
      email: user?.email || prev.email,
    }));
    if (profile) {
      if (profile.delivery_zone) setZoneId(profile.delivery_zone);
      setDietary({
        is_vegan: profile.is_vegan, is_gluten_free: profile.is_gluten_free, is_sugar_free: profile.is_sugar_free,
        is_salt_free: profile.is_salt_free, is_oil_free: profile.is_oil_free,
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (formData.name) localStorage.setItem('checkout_fullName', formData.name);
    if (formData.whatsapp) localStorage.setItem('checkout_phone', formData.whatsapp);
    if (formData.address) localStorage.setItem('checkout_address', formData.address);
  }, [formData.name, formData.whatsapp, formData.address]);

  const setDate = (date: string) => {
    setFormData(f => ({ ...f, date }));
    setError('');
    try { localStorage.setItem(DATE_KEY, date); } catch { /* private mode */ }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp || !formData.address) return;
    setError('');

    if (hasBox && zone && boxCount < zone.minBoxes) {
      setError(`O pedido mínimo para esta região é de ${zone.minBoxes} caixas.`);
      return;
    }

    if (hasBox) {
      // The date must really be a box day (a stale saved date may no longer be).
      const schedule = await fetchSchedule();
      if (!formData.date || !selectableDates(schedule).includes(formData.date)) {
        setError('Escolha um dia de entrega no calendário acima.');
        return;
      }
    } else if (!formData.date) {
      setError('Escolha uma data de entrega.');
      return;
    }

    setSubmitting(true);

    const transactionId = `ORD${Date.now()}`.substring(0, 25);
    const { payload, base64 } = await generatePixData({ value: total, transactionId });

    const restrictions = DIETARY_FIELDS.filter(d => dietary[d.key]).map(d => d.label);
    const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join(', ');

    // Remember these details so the next order is one click lighter.
    await saveProfile({
      full_name: formData.name,
      phone: formData.whatsapp,
      address: formData.address,
      ...(hasBox ? { delivery_zone: zoneId, ...dietary } : {}),
    } as never);

    // Save to Supabase 'orders'. Extra columns come from migration 12; if it
    // hasn't been run yet, fall back to the original columns so no order is lost.
    const base = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_whatsapp: formData.whatsapp.replace(/\D/g, ''),
      delivery_address: formData.address,
      requested_date: formData.date || null,
      total_price: total,
      pix_transaction_id: transactionId,
      status: 'PENDING',
    };
    let saved = true;
    const full = await supabase.from('orders').insert([{
      ...base,
      order_kind: hasBox ? 'box' : 'events',
      delivery_zone: hasBox ? zoneId : null,
      delivery_fee: deliveryFee,
      dietary_notes: restrictions.length ? restrictions.join(', ') : null,
      items_summary: itemsSummary,
    }]);
    if (full.error) {
      const plain = await supabase.from('orders').insert([base]);
      if (plain.error) {
        console.error('Error saving order:', plain.error);
        saved = false;
      }
    }

    if (hasBox) {
      // Keep the limited-edition counter honest.
      for (const box of boxItems) {
        if (!box.tasting_box_id) continue;
        const { data } = await supabase.from('tasting_boxes').select('sold_quantity').eq('id', box.tasting_box_id).single();
        if (data) {
          await supabase.from('tasting_boxes').update({ sold_quantity: data.sold_quantity + box.quantity }).eq('id', box.tasting_box_id);
        }
      }

      // Feed the CRM through the controlled function (the customer list itself stays private).
      const { error: crmError } = await supabase.rpc('upsert_crm_customer', {
        p_full_name: formData.name,
        p_whatsapp_number: formData.whatsapp,
        p_location: `${formData.address} - ${zone?.label ?? ''}`,
        p_email: user?.email ?? (formData.email || null),
        p_is_vegan: dietary.is_vegan,
        p_is_gluten_free: dietary.is_gluten_free,
        p_is_sugar_free: dietary.is_sugar_free,
        p_is_salt_free: dietary.is_salt_free,
        p_is_oil_free: dietary.is_oil_free,
      });
      if (crmError) console.error('CRM save error:', crmError);
    }

    setPlaced({
      items: [...items], subtotal: totalPrice, fee: deliveryFee, total, isBox: hasBox,
      date: formData.date, zoneLabel: zone?.label ?? '', saved,
    });
    setPixPayload(payload);
    setPixQR(base64);
    clearCart();
    try { localStorage.removeItem(DATE_KEY); } catch { /* ignore */ }
    setSubmitting(false);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (items.length === 0 && step === 1) {
    return (
      <main className="min-h-screen pt-32 pb-16 px-4 flex justify-center bg-[#fdfaf3]">
        <div className="text-center">
          <h1 className="text-3xl text-[#3c2a21] font-bold mb-4">Seu Carrinho está vazio</h1>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/caixas" className="btn btn-primary">Pedir a Caixa de Degustação</Link>
            <Link href="/menu" className="btn btn-secondary">Menu de Eventos</Link>
          </div>
        </div>
      </main>
    );
  }

  const shown = step === 2 && placed ? placed.items : items;
  const shownSubtotal = step === 2 && placed ? placed.subtotal : totalPrice;
  const shownFee = step === 2 && placed ? placed.fee : deliveryFee;
  const shownTotal = step === 2 && placed ? placed.total : total;
  const shownIsBox = step === 2 && placed ? placed.isBox : hasBox;

  const waProof = placed
    ? `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
        `Olá Tropical Bakery! Acabei de fazer um pedido pelo site 🌴\n\n` +
        placed.items.map(i => `*${i.quantity}x* ${i.name}`).join('\n') +
        `\n\n*Total:* ${formatBRL(placed.total)}` +
        (placed.date ? `\n*Entrega:* ${new Date(placed.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}` : '') +
        `\n\nVou enviar o comprovante do Pix por aqui.`
      )}`
    : '';

  return (
    <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem', backgroundColor: 'var(--color-background)' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>

        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', backgroundColor: step === 1 ? 'var(--color-secondary)' : 'var(--color-primary)', color: '#fff' }}>1</div>
            <span style={{ fontWeight: 'bold', color: step === 1 ? 'var(--color-secondary)' : 'var(--color-primary)' }}>Dados</span>
          </div>
          <div style={{ height: '2px', width: '4rem', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--color-secondary)', transition: 'width 0.5s', width: step === 2 ? '100%' : '0%' }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', backgroundColor: step === 2 ? 'var(--color-secondary)' : '#e5e7eb', color: step === 2 ? '#fff' : '#9ca3af' }}>2</div>
            <span style={{ fontWeight: 'bold', color: step === 2 ? 'var(--color-secondary)' : '#9ca3af' }}>Pagamento</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flexDirection: 'row-reverse' }}>

          {/* RIGHT: SUMMARY */}
          <div style={{ flex: '1 1 350px' }}>
            <div className="liquid-glass-card" style={{ padding: '2rem', position: 'sticky', top: '8rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212,175,55,0.3)', fontFamily: 'var(--font-heading)' }}>Resumo do Pedido</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '40vh', overflowY: 'auto' }}>
                {shown.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '4rem', height: '4rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)', position: 'relative', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.6rem', width: '1.2rem', height: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>{item.quantity}</span>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: 1.2, marginBottom: '0.2rem' }}>{item.name}</p>
                      <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>{formatBRL(parsePrice(item.price) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(212,175,55,0.3)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                  <span>Subtotal</span>
                  <span>{formatBRL(shownSubtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                  <span>Entrega</span>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                    {shownIsBox ? (shownFee === 0 ? 'Grátis' : formatBRL(shownFee)) : 'A combinar'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.3)' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{formatBRL(shownTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LEFT: FORM OR PIX */}
          <div style={{ flex: '2 1 500px' }}>
            {step === 1 ? (
              <form onSubmit={handleCheckout} className="liquid-glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '2rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>Informações de Entrega</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <LoginPanel />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Nome Completo</label>
                    <input required type="text" placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={labelStyle}>E-mail</label>
                      <input required type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={labelStyle}>WhatsApp (com DDD)</label>
                      <input required type="tel" placeholder="Ex: 11999999999" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} style={inputStyle} />
                    </div>
                  </div>

                  {hasBox && (
                    <div>
                      <label style={labelStyle}>Região de Entrega</label>
                      <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {DELIVERY_ZONES.map(z => (
                          <option key={z.id} value={z.id}>{z.label} — {z.fee === 0 ? 'entrega grátis' : `+${formatBRL(z.fee)}`}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Endereço Completo</label>
                    <input required type="text" placeholder="Rua, Número, Bairro, Pousada / referência" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
                  </div>

                  {hasBox && (
                    <div>
                      <label style={labelStyle}>Restrições Alimentares</label>
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
                                borderColor: on ? '#d4af37' : '#e8e1d7', background: on ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.7)',
                                color: on ? '#3c2a21' : '#7a6a61', fontWeight: on ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
                              }}
                            >
                              {on ? '✓ ' : ''}{label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    {hasBox ? (
                      <>
                        <label style={labelStyle}>Quando você quer receber sua caixa?</label>
                        <DeliveryCalendar value={formData.date} onChange={setDate} />
                      </>
                    ) : (
                      <>
                        <label style={labelStyle}>Data desejada para a entrega</label>
                        <input
                          required type="date"
                          min={toISODate(new Date(Date.now() + 3 * 86400000))}
                          value={formData.date}
                          onChange={e => setDate(e.target.value)}
                          style={inputStyle}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#7a6a61', marginTop: '0.5rem', lineHeight: 1.6 }}>
                          Encomendas do Menu de Eventos precisam de pelo menos 3 dias. Confirmamos a data e os detalhes com você pelo WhatsApp.
                        </p>
                      </>
                    )}
                    {error && <p style={{ color: '#c0392b', fontSize: '0.9rem', marginTop: '0.75rem' }}>{error}</p>}
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
                  <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '8px', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Gerando seu Pix...' : 'Continuar para Pagamento ➔'}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '1rem' }}>
                    🔒 Pagamento 100% seguro via Pix
                  </p>
                </div>
              </form>
            ) : (
              <div className="liquid-glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Pagamento Pix</h2>
                <p style={{ color: 'var(--color-text)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                  {placed?.saved === false
                    ? 'Não conseguimos registrar o pedido automaticamente. Faça o Pix e nos chame no WhatsApp para confirmar.'
                    : 'Seu pedido foi registrado. Realize o pagamento para confirmar a produção.'}
                </p>

                {placed?.isBox && placed.date && (
                  <div style={{ margin: '0 auto 2rem', maxWidth: '440px', padding: '1rem 1.25rem', borderRadius: '16px', background: 'linear-gradient(135deg, #3c2a21 0%, #5a3d2e 100%)', color: '#fdfaf3', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem' }} aria-hidden>🎉</span>
                    <div>
                      <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffd166', fontWeight: 700 }}>Sua caixa chega</p>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                        {new Date(placed.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#fff', border: '2px solid rgba(212,175,55,0.3)', borderRadius: '12px', marginBottom: '1rem' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pixQR} alt="QR Code Pix" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#666' }}>Abra o app do seu banco e escaneie o QR Code acima</p>
                </div>

                <div style={{ maxWidth: '400px', margin: '0 auto', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Pix Copia e Cola</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px', padding: '0.5rem', position: 'relative' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#666', fontSize: '0.85rem', paddingLeft: '0.5rem', paddingRight: '1rem', width: '100%' }}>{pixPayload}</div>
                    <button
                      onClick={copyPix}
                      className="btn"
                      style={{ padding: '0.75rem 1rem', minWidth: '130px', fontSize: '0.8rem', borderRadius: '6px', backgroundColor: copied ? '#2e4432' : 'var(--color-primary)', color: 'white' }}
                    >
                      {copied ? '✅ Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                </div>

                <a href={waProof} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-block', padding: '0.9rem 1.75rem', marginBottom: '0.5rem' }}>
                  Enviar comprovante pelo WhatsApp
                </a>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(212,175,55,0.3)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', backgroundColor: 'rgba(212,175,55,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}>
                    💡 <strong>Atenção:</strong> Seu pedido só começará a ser produzido após a confirmação do pagamento pelo banco.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
