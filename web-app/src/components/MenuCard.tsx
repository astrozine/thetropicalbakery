'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import TreatInfo, { hasTreatInfo } from '@/components/TreatInfo';
import { allergenById } from '@/lib/allergens';
import Image from 'next/image';
import { canOptimize } from '@/lib/thumbs';

interface MenuCardProps {
  item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    min_batch_size?: number;
    batch_multiplier?: number;
    emoji?: string | null;
    ingredients?: string[] | null;
    contains?: string[] | null;
    may_contain?: string[] | null;
  };
  /** On a page with a quick pick: this treat is one of the ones already chosen there. */
  picked?: boolean;
  /** Present when the page has a quick pick; adds a choose/unchoose button to the phone drawer. */
  onTogglePick?: () => void;
}

export default function MenuCard({ item, picked = false, onTogglePick }: MenuCardProps) {
  const { addToCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const hasInfo = hasTreatInfo(item);

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
    addToCart({
      id: item.id, name: item.name, price: item.price, image: item.image,
      min_batch_size: item.min_batch_size, batch_multiplier: item.batch_multiplier, kind: 'events',
    });
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
          border: picked ? '2px solid #d4af37' : '1px solid rgba(212,175,55,0.1)',
          ...(picked ? { boxShadow: '0 8px 22px rgba(212,175,55,0.38)' } : null),
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: isMobile ? 'pointer' : 'default'
        }}
      >
        <div style={{ height: isMobile ? '160px' : '260px', overflow: 'hidden', position: 'relative' }}>
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 340px"
            unoptimized={!canOptimize(item.image)}
            style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
          />
          {picked && (
            <span aria-label="Na sua escolha" style={{ position: 'absolute', top: '8px', left: '8px', width: '30px', height: '30px', borderRadius: '50%', background: '#d4af37', color: '#3c2a21', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.28)' }}>✓</span>
          )}
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
            {item.emoji ? `${item.emoji} ` : ''}{item.name}
          </h3>
          
          {!isMobile && (
            <p style={{ color: '#594a42', fontSize: '0.95rem', lineHeight: '1.5', flexGrow: 1 }}>
              {item.description}
            </p>
          )}

          {!isMobile && (item.contains?.length || 0) > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' }} aria-label="Alérgenos">
              {item.contains!.map(id => {
                const a = allergenById(id);
                return a ? <span key={id} title={`Contém ${a.label}`} style={{ background: '#fdecea', color: '#b03a2e', border: '1px solid #f5b7b1', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>{a.emoji} {a.label}</span> : null;
              })}
            </div>
          )}

          {!isMobile && hasInfo && (
            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowInfo(v => !v)}
                aria-expanded={showInfo}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#8a6d1f', fontWeight: 700, fontSize: '0.85rem' }}
              >
                🌿 Ingredientes e alérgenos {showInfo ? '−' : '+'}
              </button>
              {showInfo && (
                <div style={{ marginTop: '0.75rem' }}>
                  <TreatInfo ingredients={item.ingredients} contains={item.contains} may_contain={item.may_contain} showEmptyNote={false} />
                </div>
              )}
            </div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99990, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', opacity: 1, transition: 'opacity 0.3s' }}
          />
          
          {/* Drawer Content */}
          <div style={{ position: 'relative', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem 1.5rem', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out' }}>
            
            {/* Handle */}
            <div style={{ width: '40px', height: '5px', background: '#e0e0e0', borderRadius: '3px', margin: '0 auto 1.5rem' }} />

            <img src={item.image} alt={item.name} style={{ width: '100%', height: '35vh', minHeight: '250px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem' }} />
            
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              {item.emoji ? `${item.emoji} ` : ''}{item.name}
            </h3>
            
            <p style={{ color: '#594a42', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {item.description}
            </p>

            {hasInfo && (
              <div style={{ marginBottom: '1.5rem' }}>
                <TreatInfo ingredients={item.ingredients} contains={item.contains} may_contain={item.may_contain} showEmptyNote={false} />
              </div>
            )}

            {(item.min_batch_size && item.min_batch_size > 1) ? (
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '0.5rem' }}><strong>Pedido Mínimo:</strong> {item.min_batch_size} unidades</div>
                <div><strong>Tamanho do Lote:</strong> múltiplos de {item.batch_multiplier}</div>
              </div>
            ) : null}

            {onTogglePick && (
              <button
                type="button"
                onClick={onTogglePick}
                aria-pressed={picked}
                style={{ width: '100%', minHeight: '48px', marginBottom: '1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
                  border: '2px solid #d4af37', background: picked ? '#d4af37' : 'rgba(212,175,55,0.08)', color: picked ? '#3c2a21' : '#8a6d1f' }}
              >
                {picked ? '✓ Na sua escolha rápida (toque para tirar)' : '+ Incluir na escolha rápida'}
              </button>
            )}

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
