'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BOX_SIZES, BoxSize } from '@/lib/boxSizes';
import { formatBRL } from '@/lib/deliveryZones';
import { STORE_WHATSAPP } from '@/lib/siteContact';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<BoxSize | null>(null);
  const router = useRouter();

  const handleOrder = async (orderType: 'CAIXA_DEGUSTACAO' | 'EVENTO') => {
    setErrorMsg(''); // clear previous errors
    if (!name || !whatsapp) {
      setErrorMsg('Por favor, preencha seu nome e WhatsApp para continuar.');
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
          // Which highlight they clicked, and for a box order how much of it
          items: orderType === 'CAIXA_DEGUSTACAO'
            ? { title, description, quantity, box_pieces: size?.pieces ?? null, unit_price: size?.price ?? null }
            : { title, description }
        }
      ]);

    setLoading(false);

    if (error) {
      console.error('Error saving lead:', error);
      // Proceed anyway so the user experience isn't broken
    }

    if (orderType === 'CAIXA_DEGUSTACAO') {
      // Redirect to WhatsApp with prefilled message
      const boxes = `${quantity} ${quantity === 1 ? 'caixa' : 'caixas'} de degustação`;
      const text =
        `Olá! Meu nome é ${name}. Vi "${title}" no site e gostaria de pedir *${boxes}*` +
        (size ? ` de ${size.pieces} peças (R$ ${size.price} cada)` : '') + `.
` +
        (size ? `Total estimado: ${formatBRL(quantity * size.price)}
` : '') +
        `Podem me passar as datas de entrega disponíveis? 🌴`;
      window.open(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
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
          {/* Wide screens: photo flanks the order form. Narrow: photo on top. */}
          <style>{`
            .order-modal { display: flex; flex-direction: row; max-width: 980px; }
            .order-modal-photo { position: relative; flex: 0 0 42%; min-height: 100%; }
            @media (max-width: 760px) {
              .order-modal { flex-direction: column; max-width: 500px; }
              .order-modal-photo { flex: none; height: 30vh; min-height: 200px; }
            }
          `}</style>
          <div 
            className="order-modal"
            style={{
              backgroundColor: '#fdfaf3',
              borderRadius: '24px',
              overflow: 'hidden',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              maxHeight: '90vh'
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
            <div className="order-modal-photo">
              <Image src={imageSrc} alt={title} fill sizes="(max-width: 760px) 100vw, 410px" style={{ objectFit: 'cover' }} />
            </div>
            
            <div style={{ flex: 1, minWidth: 0, padding: '1.75rem 2rem', textAlign: 'center', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.8rem', color: '#3c2a21', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>{title}</h3>
              <p style={{ color: '#594a42', fontSize: '1rem', marginBottom: '1.1rem', lineHeight: 1.6 }}>{description}</p>
              
              <div style={{ background: 'white', padding: '1.1rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '0.9rem', textAlign: 'left' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#3c2a21', fontSize: '1.1rem', textAlign: 'center' }}>Quantas caixas você quer?</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {BOX_SIZES.map(option => {
                    const selected = size?.pieces === option.pieces;
                    return (
                      <button
                        key={option.pieces}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSize(selected ? null : option)}
                        style={{ flex: 1, padding: '0.6rem 0.25rem', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', lineHeight: 1.3, background: selected ? '#d4af37' : '#fdf7ee', color: selected ? 'white' : '#3c2a21', border: `1px solid ${selected ? '#d4af37' : '#e8e1d7'}` }}
                      >
                        <strong style={{ display: 'block' }}>{option.pieces} peças</strong>
                        <span style={{ fontSize: '0.85rem' }}>R$ {option.price}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: '#3c2a21' }}>Quantidade de caixas</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <button type="button" aria-label="Menos" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e8e1d7', background: '#fff', color: '#3c2a21', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>-</button>
                    <span aria-live="polite" style={{ minWidth: '1.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#3c2a21' }}>{quantity}</span>
                    <button type="button" aria-label="Mais" onClick={() => setQuantity(q => Math.min(20, q + 1))} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#d4af37', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>
                {size && (
                  <p style={{ marginTop: '0.9rem', textAlign: 'right', color: '#3c2a21' }}>
                    {quantity} × R$ {size.price} = <strong>{formatBRL(quantity * size.price)}</strong>
                  </p>
                )}
              </div>

              <div style={{ background: 'white', padding: '1.1rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.1rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#3c2a21', fontSize: '1.1rem' }}>Preencha seus dados para continuar</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                <button 
                  onClick={() => handleOrder('CAIXA_DEGUSTACAO')}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    flex: '1 1 200px',
                    fontSize: '0.95rem',
                    padding: '1rem 0.75rem',
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
                    flex: '1 1 200px',
                    fontSize: '0.95rem',
                    padding: '1rem 0.75rem',
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

          <AnimatePresence>
            {errorMsg && (
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
                onClick={() => setErrorMsg('')}
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
                    {errorMsg}
                  </p>
                  <button 
                    onClick={() => setErrorMsg('')}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Entendido
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
