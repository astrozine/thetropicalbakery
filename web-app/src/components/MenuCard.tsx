'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

interface MenuCardProps {
  item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
  };
}

export default function MenuCard({ item }: MenuCardProps) {
  const { addToCart } = useCart();

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid rgba(212,175,55,0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ height: '260px', overflow: 'hidden' }}>
        <img 
          src={item.image} 
          alt={item.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
        />
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          {item.name}
        </h3>
        <p style={{ color: '#594a42', fontSize: '0.95rem', lineHeight: '1.5', flexGrow: 1 }}>
          {item.description}
        </p>
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#3c2a21' }}>R$ {item.price}</span>
          <button 
            onClick={() => addToCart(item)}
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
        </div>
      </div>
    </div>
  );
}
