'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

interface MenuCardProps {
  item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    min_batch_size?: number;
    batch_multiplier?: number;
  };
}

export default function MenuCard({ item }: MenuCardProps) {
  const { addToCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCardClick = () => {
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(item);
    if (isMobile) setIsDrawerOpen(false);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        style={{
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(212,175,55,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: isMobile ? 'pointer' : 'default'
        }}
      >
        <div style={{ height: isMobile ? '160px' : '260px', overflow: 'hidden', position: 'relative' }}>
          <img 
            src={item.image} 
            alt={item.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          />
          {isMobile && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3c2a21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          )}
        </div>
        
        <div style={{ padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {item.name}
          </h3>
          
          {!isMobile && (
            <p style={{ color: '#594a42', fontSize: '0.95rem', lineHeight: '1.5', flexGrow: 1 }}>
              {item.description}
            </p>
          )}

          {(!isMobile && item.min_batch_size && item.min_batch_size > 1) ? (
            <div style={{ fontSize: '0.85rem', color: '#7f8c8d', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
              <div><strong>Min:</strong> {item.min_batch_size} un.</div>
              <div><strong>Lote:</strong> múltiplos de {item.batch_multiplier}</div>
            </div>
          ) : null}

          <div style={{ marginTop: isMobile ? '0.5rem' : '1.5rem', borderTop: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)', paddingTop: isMobile ? '0' : '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#3c2a21', fontSize: isMobile ? '1.1rem' : '1rem' }}>
              R$ {item.price} <span style={{ fontSize: '0.85rem', color: '#7a6a61', fontWeight: 400 }}>/ un.</span>
            </span>
            
            {!isMobile && (
              <button 
                onClick={handleAddToCart}
                style={{ 
                  background: '#d4af37', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#c9a67a'}
                onMouseOut={(e) => e.currentTarget.style.background = '#d4af37'}
              >
                Adicionar +
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Drawer */}
      {isMobile && isDrawerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', opacity: 1, transition: 'opacity 0.3s' }}
          />
          
          {/* Drawer Content */}
          <div style={{ position: 'relative', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem 1.5rem', paddingBottom: 'calc(3rem + 70px)', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out' }}>
            
            {/* Handle */}
            <div style={{ width: '40px', height: '5px', background: '#e0e0e0', borderRadius: '3px', margin: '0 auto 1.5rem' }} />

            <img src={item.image} alt={item.name} style={{ width: '100%', height: '35vh', minHeight: '250px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem' }} />
            
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              {item.name}
            </h3>
            
            <p style={{ color: '#594a42', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {item.description}
            </p>

            {(item.min_batch_size && item.min_batch_size > 1) ? (
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '0.5rem' }}><strong>Pedido Mínimo:</strong> {item.min_batch_size} unidades</div>
                <div><strong>Tamanho do Lote:</strong> múltiplos de {item.batch_multiplier}</div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: '#7a6a61' }}>Preço unitário</span>
                <span style={{ fontWeight: 'bold', color: '#3c2a21', fontSize: '1.3rem' }}>
                  R$ {item.price}
                </span>
              </div>
              
              <button 
                onClick={handleAddToCart}
                style={{ 
                  background: '#d4af37', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1rem 2rem', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  textTransform: 'uppercase', 
                  boxShadow: '0 4px 15px rgba(212,175,55,0.4)',
                  cursor: 'pointer'
                }}
              >
                Adicionar +
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </>
  );
}
