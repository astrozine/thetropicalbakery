'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DELIVERY_ZONES = [
  { id: 'zone1', label: 'Itamambuca', fee: 0, minBoxes: 1 },
  { id: 'zone2', label: 'Praia do Félix, Prumirim, Praia Vermelha, Perequê-Açú', fee: 15, minBoxes: 1 },
  { id: 'zone3', label: 'Ubatuba (Centro), Praia Grande, Puruba, Ubatumirim', fee: 25, minBoxes: 1 },
  { id: 'zone4', label: 'Paraty, Picinguaba (Somente Atacado/Eventos)', fee: 100, minBoxes: 10 },
];

export default function WhatsAppCheckout() {
  const [boxCount, setBoxCount] = useState(1);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [zoneId, setZoneId] = useState('zone1');
  
  // Dietary Restrictions
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isSugarFree, setIsSugarFree] = useState(false);
  const [isSaltFree, setIsSaltFree] = useState(false);
  const [isOilFree, setIsOilFree] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  const pricePerBox = 99;
  const selectedZone = DELIVERY_ZONES.find(z => z.id === zoneId);
  const deliveryFee = selectedZone ? selectedZone.fee : 0;
  const total = (boxCount * pricePerBox) + deliveryFee;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZoneId = e.target.value;
    setZoneId(newZoneId);
    
    // Auto-adjust box count if they select a bulk zone
    const newZone = DELIVERY_ZONES.find(z => z.id === newZoneId);
    if (newZone && boxCount < newZone.minBoxes) {
      setBoxCount(newZone.minBoxes);
    }
  };

  const handleBoxCountChange = (delta: number) => {
    const newCount = boxCount + delta;
    const minBoxes = selectedZone ? selectedZone.minBoxes : 1;
    if (newCount >= minBoxes) {
      setBoxCount(newCount);
    } else {
      alert(`O pedido mínimo para esta região é de ${minBoxes} unidades.`);
    }
  };

  const handleOrder = async () => {
    if (!fullName.trim() || !address.trim()) {
      alert("Por favor, preencha seu nome e o endereço exato.");
      return;
    }

    setLoading(true);

    try {
      // 1. Save to CRM (users table)
      // Since we don't have auth for checkout, we generate a random password for the NOT NULL constraint
      const randomPassword = Math.random().toString(36).slice(-8);
      const whatsappNumberFallback = '00' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
          full_name: fullName,
          whatsapp_number: whatsappNumberFallback, // We should probably add a field for this, but let's just use a placeholder for now to not overwhelm the form
          password_hash: randomPassword,
          location: `${address} - ${selectedZone?.label}`,
          is_vegan: isVegan,
          is_gluten_free: isGlutenFree,
          is_sugar_free: isSugarFree,
          is_salt_free: isSaltFree,
          is_oil_free: isOilFree,
        }])
        .select()
        .single();

      if (userError) {
        console.error("CRM Error:", userError);
        // Continue anyway to WhatsApp so we don't lose the sale
      }

      // 2. Redirect to WhatsApp
      const whatsappNumber = '5511932119196'; 
      let message = `Olá Tropical Bakery! Gostaria de encomendar ${boxCount} Surprise Treat Box(es).\n\n`;
      message += `*Nome:* ${fullName}\n`;
      message += `*Entrega:* ${selectedZone?.label}\n`;
      message += `*Endereço Exato:* ${address}\n\n`;
      
      const restrictions = [];
      if (isVegan) restrictions.push('Vegano');
      if (isGlutenFree) restrictions.push('Sem Glúten');
      if (isSugarFree) restrictions.push('Sem Açúcar');
      if (isSaltFree) restrictions.push('Sem Sal (SOS-Free)');
      if (isOilFree) restrictions.push('Sem Óleo (SOS-Free)');
      
      if (restrictions.length > 0) {
        message += `*Restrições Alimentares:* ${restrictions.join(', ')}\n\n`;
      }

      message += `*Subtotal:* R$${boxCount * pricePerBox},00\n`;
      message += `*Taxa de Entrega:* R$${deliveryFee},00\n`;
      message += `*Total a pagar:* R$${total},00\n`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      // Reset form
      setFullName('');
      setAddress('');
      
    } catch (e) {
      console.error(e);
      alert("Ocorreu um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
      alignItems: 'stretch',
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
        gap: '1.2rem', 
        justifyContent: 'center',
        background: 'transparent',
        padding: '0',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#3c2a21', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '0.75rem' }}>Peça Sua Caixa Surpresa</h2>
          <p style={{ fontSize: '1rem', color: '#594a42', lineHeight: '1.6' }}>Entregas exclusivas para Itamambuca, praias vizinhas e eventos em Paraty. Preencha seus dados para montarmos uma caixa perfeita para suas restrições!</p>
        </div>
        
        {/* Basic Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fdfaf3', padding: '1rem', borderRadius: '16px', border: '1px solid #e8e1d7' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#594a42' }}>Nome Completo:</label>
          <input 
            type="text" 
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ex: Maria Silva"
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit' }}
          />
        </div>

        {/* Dietary Restrictions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fdfaf3', padding: '1rem', borderRadius: '16px', border: '1px solid #e8e1d7' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#594a42' }}>Restrições Alimentares (Marque o que for necessário):</label>
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
              <input type="checkbox" checked={isOilFree} onChange={e => setIsOilFree(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} /> SOS-Free (Sem Óleo Refinado)
            </label>
          </div>
        </div>

        {/* Delivery Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fdfaf3', padding: '1rem', borderRadius: '16px', border: '1px solid #e8e1d7' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#594a42' }}>Região de Entrega:</label>
          <select 
            value={zoneId}
            onChange={handleZoneChange}
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.9rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', background: 'white' }}
          >
            {DELIVERY_ZONES.map(z => (
              <option key={z.id} value={z.id}>{z.label} (+R$ {z.fee},00)</option>
            ))}
          </select>
          
          <input 
            type="text" 
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Endereço Exato / Pousada"
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', marginTop: '0.5rem' }}
          />
        </div>

        {/* Quantity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#3c2a21', background: '#fdf7ee', padding: '1rem', borderRadius: '16px', border: '1px solid #e8e1d7', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1, minWidth: '120px' }}>Quantidade:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => handleBoxCountChange(-1)}
              style={{ width: '40px', height: '40px', borderRadius: '20px', border: 'none', background: '#fff', color: '#3c2a21', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
            >-</button>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '25px', textAlign: 'center' }}>{boxCount}</span>
            <button 
              onClick={() => handleBoxCountChange(1)}
              style={{ width: '40px', height: '40px', borderRadius: '20px', border: 'none', background: '#d4af37', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)' }}
            >+</button>
          </div>
        </div>

        {/* Total Price */}
        <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', color: '#3c2a21', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginTop: '0.5rem' }}>
          <span>Total ({boxCount}x R$99 + R${deliveryFee} taxa):</span>
          <strong>R$ {total},00</strong>
        </div>

        <button 
          onClick={handleOrder}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '1.2rem', 
            borderRadius: '40px', 
            border: 'none', 
            background: 'linear-gradient(135deg, #25D366, #128C7E)', 
            color: '#fff', 
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 15px 30px rgba(37, 211, 102, 0.4)',
            transition: 'all 0.3s ease',
            marginTop: '0.5rem'
          }}
        >
          {loading ? 'Processando...' : '📱 Enviar Pedido pelo WhatsApp'}
        </button>
      </div>
    </div>
  );
}
