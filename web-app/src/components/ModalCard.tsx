'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ModalCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

export default function ModalCard({ imageSrc, title, description }: ModalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const WHATSAPP_NUMBER = "5511932119196";
  
  const handleOrder = async (orderType: 'CAIXA_DEGUSTACAO' | 'EVENTO') => {
    if (!name || !whatsapp) {
      alert('Por favor, preencha seu nome e WhatsApp.');
      return;
    }

    setLoading(true);
    
    // Register the lead in the CRM orders table
    const { error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: name,
          customer_whatsapp: whatsapp,
          order_type: orderType,
          items: { title, description } // Which highlight they clicked
        }
      ]);

    setLoading(false);

    if (error) {
      console.error('Error saving lead:', error);
      // Proceed anyway so the user experience isn't broken
    }

    if (orderType === 'CAIXA_DEGUSTACAO') {
      // Redirect to WhatsApp with prefilled message
      const text = `Olá! Meu nome é ${name}. Gostaria de fazer o pedido da caixa degustação: ${title}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
      setIsOpen(false);
    } else {
      // Redirect to events menu
      setIsOpen(false);
      router.push('/menu');
    }
  };

  return (
    <>
      <div 
        className="menu-card" 
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ position: 'relative', width: '100%', height: '450px', background: '#e8e1d7', overflow: 'hidden' }}>
          <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} className="menu-image" />
        </div>
        <div className="menu-content">
          <h3 className="menu-title" style={{ color: '#3c2a21' }}>{title}</h3>
          <p className="menu-desc" style={{ color: '#7a6a61' }}>{description}</p>
        </div>
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#fdfaf3',
              borderRadius: '24px',
              overflow: 'hidden',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                color: '#3c2a21'
              }}
            >
              ×
            </button>
            <div style={{ position: 'relative', width: '100%', height: '30vh', minHeight: '200px' }}>
              <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} />
            </div>
            
            <div style={{ padding: '2rem', textAlign: 'center', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.8rem', color: '#3c2a21', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>{title}</h3>
              <p style={{ color: '#594a42', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{description}</p>
              
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#3c2a21', fontSize: '1.1rem' }}>Preencha seus dados para continuar</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="Seu Nome Completo" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
                  />
                  <input 
                    type="tel" 
                    placeholder="Seu WhatsApp (Ex: 11999999999)" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button 
                  onClick={() => handleOrder('CAIXA_DEGUSTACAO')}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                    padding: '1rem',
                    background: '#d4af37',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Aguarde...' : 'CAIXA DE DEGUSTAÇÃO'}
                </button>
                <button 
                  onClick={() => handleOrder('EVENTO')}
                  disabled={loading}
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                    padding: '1rem',
                    background: 'transparent',
                    color: '#2c3e50',
                    border: '2px solid #2c3e50',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Aguarde...' : 'PEDIDOS GRANDES PARA EVENTOS'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
