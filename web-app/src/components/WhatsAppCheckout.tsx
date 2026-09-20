'use client';

import React, { useState, useEffect } from 'react';

export default function WhatsAppCheckout() {
  const [boxCount, setBoxCount] = useState(1);
  const [address, setAddress] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const pricePerBox = 99;
  const total = boxCount * pricePerBox;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const whatsappNumber = '5511932119196'; 

  const handleOrder = () => {
    let message = `Hello Tropical Bakery! I'd like to order ${boxCount} Surprise Treat Box(es) for a total of R$${total}.`;
    if (address.trim()) {
      message += `\nDelivery Address: ${address.trim()}`;
    }
    if (affiliateCode.trim()) {
      message += `\nAffiliate Code: ${affiliateCode.trim()}`;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="checkout-container" style={{
      padding: isMobile ? '0' : 'clamp(1.5rem, 5vw, 3rem) 0',
      maxWidth: '1100px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isMobile ? '2rem' : 'clamp(2rem, 4vw, 4rem)',
      alignItems: 'center',
      background: 'transparent',
    }}>
      {/* Product Image — left side */}
      <div style={{ flex: '1 1 380px', minWidth: '250px', position: 'relative' }}>
        <img 
          src="/treats/media_1789712796150.jpg" 
          alt="Surprise Treat Box" 
          style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: isMobile ? '0' : '24px', objectFit: 'cover', boxShadow: isMobile ? 'none' : '0 15px 30px rgba(0,0,0,0.15)', display: 'block' }} 
        />
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: '#d4af37',
          color: '#fff',
          padding: '1rem 0.8rem',
          borderRadius: '50%',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          width: '65px',
          height: '65px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(212, 175, 55, 0.4)',
          transform: 'rotate(15deg)'
        }}>
          R$99
        </div>
      </div>

      {/* Checkout Details — right side */}
      <div style={{ 
        flex: '1 1 320px', 
        minWidth: '250px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem', 
        justifyContent: 'center',
        background: 'transparent',
        padding: '0',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#3c2a21', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '0.75rem' }}>Peça Sua Caixa Surpresa</h2>
          <p style={{ fontSize: '1.1rem', color: '#594a42', lineHeight: '1.8' }}>Cada caixa é embalada com nossas melhores criações tropicais. Reserve a sua para o fim de semana!</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#3c2a21', background: '#fdf7ee', padding: '1rem', borderRadius: '20px', border: '1px solid #e8e1d7', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '1.2rem', fontWeight: 600, flex: 1, minWidth: '120px' }}>Quantidade:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setBoxCount(Math.max(1, boxCount - 1))}
              style={{ width: '45px', height: '45px', borderRadius: '25px', border: 'none', background: '#fff', color: '#3c2a21', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}
            >-</button>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{boxCount}</span>
            <button 
              onClick={() => setBoxCount(boxCount + 1)}
              style={{ width: '45px', height: '45px', borderRadius: '25px', border: 'none', background: '#d4af37', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)', transition: 'all 0.2s' }}
            >+</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fdfaf3', padding: '1rem', borderRadius: '20px', border: '1px solid #e8e1d7' }}>
          <label style={{ fontSize: '1rem', fontWeight: 600, color: '#594a42' }}>Endereço de Entrega:</label>
          <input 
            type="text" 
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Ex: Rua das Flores, 123 - Centro"
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fdfaf3', padding: '1rem', borderRadius: '20px', border: '1px solid #e8e1d7' }}>
          <label style={{ fontSize: '1rem', fontWeight: 600, color: '#594a42' }}>Código de Afiliado (Opcional):</label>
          <input 
            type="text" 
            value={affiliateCode}
            onChange={e => setAffiliateCode(e.target.value)}
            placeholder="Ex: TROPICAL10"
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', textTransform: 'uppercase' }}
          />
        </div>

        <div style={{ fontSize: 'clamp(1.4rem, 4vw, 1.6rem)', color: '#3c2a21', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
          <span>Total:</span>
          <strong>R$ {total},00</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', padding: '1rem', borderRadius: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ 
            width: 'clamp(80px, 20vw, 120px)', 
            height: 'clamp(80px, 20vw, 120px)', 
            flexShrink: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 20px rgba(60,42,33,0.15)',
            border: '2px solid #fdfaf3'
          }}>
            <img src="/pix-qr.jpeg" alt="Pix QR Code" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h4 style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: '#3c2a21', marginBottom: '0.25rem', fontWeight: 700 }}>Pague com Pix</h4>
            <p style={{ fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', color: '#594a42', lineHeight: '1.6', margin: 0 }}>
              Escaneie o QR e envie o comprovante no WhatsApp!
            </p>
          </div>
        </div>

        <button 
          onClick={handleOrder}
          style={{ 
            width: '100%', 
            padding: '1.5rem', 
            borderRadius: '40px', 
            border: 'none', 
            background: 'linear-gradient(135deg, #25D366, #128C7E)', 
            color: '#fff', 
            fontSize: '1.3rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 15px 30px rgba(37, 211, 102, 0.4)',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(37, 211, 102, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(37, 211, 102, 0.4)';
          }}
        >
          📱 Enviar Pedido pelo WhatsApp
        </button>
      </div>
    </div>
  );
}
