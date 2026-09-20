'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [showError, setShowError] = useState(false);

  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isSugarFree, setIsSugarFree] = useState(false);
  const [isSaltFree, setIsSaltFree] = useState(false);
  const [isOilFree, setIsOilFree] = useState(false);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleWhatsAppCheckout = async () => {
    if (!customerName.trim() || !deliveryAddress.trim()) {
      setShowError(true);
      return;
    }

    try {
      const randomPassword = Math.random().toString(36).slice(-8);
      const whatsappNumberFallback = '00000000000';
      
      await supabase
        .from('users')
        .insert([{
          full_name: customerName,
          whatsapp_number: whatsappNumberFallback,
          password_hash: randomPassword,
          location: deliveryAddress,
          is_vegan: isVegan,
          is_gluten_free: isGlutenFree,
          is_sugar_free: isSugarFree,
          is_salt_free: isSaltFree,
          is_oil_free: isOilFree,
        }]);
    } catch (e) {
      console.error("CRM Error:", e);
    }

    const orderLines = items.map(item => `*${item.quantity}x* ${item.name} (${item.price})`);
    
    const restrictions = [];
    if (isVegan) restrictions.push('Vegano');
    if (isGlutenFree) restrictions.push('Sem Glúten');
    if (isSugarFree) restrictions.push('Sem Açúcar');
    if (isSaltFree) restrictions.push('Sem Sal (SOS-Free)');
    if (isOilFree) restrictions.push('Sem Óleo (SOS-Free)');

    let message = `*NOVO PEDIDO - THE TROPICAL BAKERY* 🌴🥐\n\n` +
      `*Cliente:* ${customerName}\n` +
      `*Endereço:* ${deliveryAddress}\n\n`;

    if (restrictions.length > 0) {
      message += `*Restrições Alimentares:* ${restrictions.join(', ')}\n\n`;
    }

    message += `*Itens do Pedido:*\n` +
      orderLines.join('\n') + `\n\n` +
      (affiliateCode.trim() ? `*Código de Afiliado:* ${affiliateCode}\n\n` : '') +
      `*Total:* ${formatPrice(totalPrice)}\n\n` +
      `_O pagamento via PIX já foi realizado e o comprovante será enviado em seguida!_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511932119196?text=${encodedMessage}`, '_blank');
  };

  return (
    <AnimatePresence>
      {/* Error Modal */}
      {showError && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setShowError(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', padding: '2rem', borderRadius: '16px',
              maxWidth: '400px', width: '90%', textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#e74c3c', marginBottom: '1rem' }}>Atenção</h3>
            <p style={{ color: '#594a42', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Por favor, preencha seu nome e endereço de entrega antes de enviar o pedido.
            </p>
            <button 
              onClick={() => setShowError(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}

      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: '100%',
              maxWidth: '500px', // Slightly larger max width for desktop
              backgroundColor: '#fdfaf3',
              zIndex: 9999,
              boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid rgba(212,175,55,0.3)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3c2a21', color: 'white' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Seu Carrinho</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#7a6a61', marginTop: '3rem' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Seu carrinho está vazio.</p>
                  <button onClick={() => setIsCartOpen(false)} className="btn btn-primary">Continuar Comprando</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        onError={(e) => { e.currentTarget.src = '/box1.jpg'; }}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#3c2a21', fontWeight: 600, fontSize: '1.25rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                        <p style={{ color: '#d4af37', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.price}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0.2rem' }}>
                            <button onClick={() => updateQuantity(item.id, item.quantity - (item.batch_multiplier || 1))} style={{ padding: '0.4rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>-</button>
                            <span style={{ padding: '0 0.8rem', minWidth: '2rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + (item.batch_multiplier || 1))} style={{ padding: '0.4rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', textDecoration: 'underline' }}>Remover</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add More Items Button */}
                  <button 
                    onClick={() => { setIsCartOpen(false); router.push('/menu'); }}
                    style={{ 
                      width: '100%', 
                      padding: '1.2rem', 
                      marginTop: '0.5rem',
                      background: 'rgba(212,175,55,0.1)', 
                      color: '#3c2a21', 
                      border: '2px dashed #d4af37', 
                      borderRadius: '12px', 
                      fontSize: '1.1rem', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>+</span> Adicionar Mais Produtos
                  </button>

                  {/* Checkout Form */}
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#3c2a21', marginBottom: '1rem' }}>Dados de Entrega</h3>
                    
                    <label style={{ display: 'block', marginBottom: '1rem' }}>
                      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.25rem' }}>Nome Completo</span>
                      <input 
                        type="text" 
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                      />
                    </label>
                    
                    <label style={{ display: 'block', marginBottom: '1rem' }}>
                      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.25rem' }}>Endereço Completo (Rua, Número, Bairro)</span>
                      <textarea 
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                        rows={2}
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit', resize: 'none' }}
                      />
                    </label>

                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#594a42', marginBottom: '0.25rem' }}>Código de Afiliado (Opcional)</span>
                      <input 
                        type="text" 
                        value={affiliateCode}
                        onChange={e => setAffiliateCode(e.target.value)}
                        placeholder="Ex: TROPICAL10"
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontFamily: 'inherit', textTransform: 'uppercase' }}
                      />
                    </label>
                  </div>

                  {/* Dietary Restrictions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e8e1d7', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <label style={{ fontSize: '1rem', fontFamily: 'var(--font-heading)', color: '#3c2a21' }}>Restrições Alimentares</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isVegan} onChange={e => setIsVegan(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} /> Vegano
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isGlutenFree} onChange={e => setIsGlutenFree(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} /> Sem Glúten
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isSugarFree} onChange={e => setIsSugarFree(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} /> Sem Açúcar
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isSaltFree} onChange={e => setIsSaltFree(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} /> SOS-Free (Sem Sal)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', gridColumn: '1 / -1' }}>
                        <input type="checkbox" checked={isOilFree} onChange={e => setIsOilFree(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} /> SOS-Free (Sem Óleo)
                      </label>
                    </div>
                  </div>

                  {/* PIX Payment Section */}
                  <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#3c2a21', marginBottom: '0.5rem' }}>Pagamento via PIX</h3>
                    <p style={{ fontSize: '0.95rem', color: '#7a6a61', marginBottom: '1rem' }}>
                      Escaneie o QR Code abaixo para realizar o pagamento. O valor total é <strong style={{color: '#d4af37'}}>{formatPrice(totalPrice)}</strong>.
                    </p>
                    <img src="/pix-qr.jpeg" alt="PIX QR Code" style={{ width: '160px', height: '160px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)' }} />
                    <p style={{ fontSize: '0.85rem', color: '#d4af37', marginTop: '1rem', fontWeight: 600 }}>
                      Após o pagamento, clique no botão abaixo para enviar o comprovante via WhatsApp!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1rem', color: '#594a42' }}>Total Estimado</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3c2a21' }}>{formatPrice(totalPrice)}</span>
                </div>
                <button 
                  onClick={handleWhatsAppCheckout}
                  style={{ width: '100%', padding: '0.75rem', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>Enviar Pedido pelo WhatsApp</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
