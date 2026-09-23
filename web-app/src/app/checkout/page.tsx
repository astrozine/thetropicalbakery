'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginPanel from '@/components/LoginPanel';
import DeliveryDatePicker from '@/components/DeliveryDatePicker';
import { generatePixData } from '@/utils/pix';

import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile, saveProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [pixPayload, setPixPayload] = useState('');
  const [pixQR, setPixQR] = useState('');
  const [copied, setCopied] = useState(false);
  const [dateError, setDateError] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    address: '',
    date: ''
  });

  // Pre-fill with anything the customer already gave us (box order form, or their account)
  useEffect(() => {
    const savedName = localStorage.getItem('checkout_fullName');
    const savedPhone = localStorage.getItem('checkout_phone');
    const savedAddress = localStorage.getItem('checkout_address');
    setFormData(prev => ({
      ...prev,
      name: prev.name || savedName || '',
      whatsapp: prev.whatsapp || savedPhone || '',
      address: prev.address || savedAddress || '',
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
  }, [profile, user]);

  // Keep it in sync for the next form that reads these keys (e.g. the tasting box checkout)
  useEffect(() => {
    if (formData.name) localStorage.setItem('checkout_fullName', formData.name);
    if (formData.whatsapp) localStorage.setItem('checkout_phone', formData.whatsapp);
    if (formData.address) localStorage.setItem('checkout_address', formData.address);
  }, [formData.name, formData.whatsapp, formData.address]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp || !formData.address) return;
    if (!formData.date) {
      setDateError(true);
      return;
    }
    setDateError(false);
    
    // Generate Pix Code
    const transactionId = `ORD${Date.now()}`.substring(0, 25);
    const { payload, base64 } = await generatePixData({
      value: totalPrice,
      transactionId
    });
    
    setPixPayload(payload);
    setPixQR(base64);
    setStep(2);

    // Remember these details so the next order is one click lighter.
    await saveProfile({
      full_name: formData.name,
      phone: formData.whatsapp,
      address: formData.address,
    });

    // Save to Supabase 'orders' table
    try {
      await supabase.from('orders').insert([{
        customer_name: formData.name,
        customer_email: formData.email,
        customer_whatsapp: formData.whatsapp.replace(/\D/g, ''),
        delivery_address: formData.address,
        requested_date: formData.date || null,
        total_price: totalPrice,
        pix_transaction_id: transactionId,
        status: 'PENDING'
      }]);
    } catch (err) {
      console.error("Error saving order:", err);
    }
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
          <a href="/menu" className="btn btn-primary">Voltar para o Menu</a>
        </div>
      </main>
    );
  }

  const getNumericPrice = (priceStr: string) => parseFloat(priceStr.replace(/[^\d,]/g, '').replace(',', '.'));

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
          
          {/* RIGHT: CART SUMMARY */}
          <div style={{ flex: '1 1 350px' }}>
            <div className="liquid-glass-card" style={{ padding: '2rem', position: 'sticky', top: '8rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212,175,55,0.3)', fontFamily: 'var(--font-heading)' }}>Resumo do Pedido</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '40vh', overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '4rem', height: '4rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)', position: 'relative' }}>
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.6rem', width: '1.2rem', height: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>{item.quantity}</span>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: '1.2', marginBottom: '0.2rem' }}>{item.name}</p>
                      <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>R$ {(getNumericPrice(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(212,175,55,0.3)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                  <span>Frete</span>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>A Combinar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.3)' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LEFT: FORM OR PIX */}
          <div style={{ flex: '2 1 500px' }}>
            {step === 1 ? (
              <form onSubmit={handleCheckout} className="liquid-glass-card" style={{ padding: '3rem 2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '2rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>Informações de Entrega</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <LoginPanel />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nome Completo</label>
                    <input required type="text" placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '1rem', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>E-mail</label>
                      <input required type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '1rem', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>WhatsApp (com DDD)</label>
                      <input required type="tel" placeholder="Ex: 11999999999" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} style={{ width: '100%', padding: '1rem', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Endereço Completo</label>
                    <input required type="text" placeholder="Rua, Número, Bairro, CEP" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '1rem', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Data de Entrega Desejada</label>
                    <DeliveryDatePicker value={formData.date} onChange={date => { setFormData({ ...formData, date }); setDateError(false); }} />
                    {dateError && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginTop: '0.5rem' }}>Escolha uma data de entrega.</p>}
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '8px' }}>
                    Continuar para Pagamento ➔
                  </button>
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '1rem' }}>
                    🔒 Pagamento 100% seguro via Pix
                  </p>
                </div>
              </form>
            ) : (
              <div className="liquid-glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Pagamento Pix</h2>
                <p style={{ color: 'var(--color-text)', marginBottom: '2rem', fontSize: '1.1rem' }}>Seu pedido foi registrado. Realize o pagamento para confirmar a produção.</p>
                
                {/* Desktop QR Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#fff', border: '2px solid rgba(212,175,55,0.3)', borderRadius: '12px', marginBottom: '1rem' }}>
                    <img src={pixQR} alt="QR Code Pix" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>Abra o app do seu banco e escaneie o QR Code acima</p>
                </div>

                {/* Mobile Copia e Cola */}
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

                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(212,175,55,0.3)' }}>
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
