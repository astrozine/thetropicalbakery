'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import DeliveryCalendar from '@/components/DeliveryCalendar';
import { formatBRL } from '@/lib/deliveryZones';

interface BoxOrderProps {
  box: { id: string; title: string; image_url: string; price: number };
  maxQuantity: number;
}

const DATE_KEY = 'checkout_delivery_date';

/**
 * "Peça Sua Caixa": pick how many and which day it arrives, then go to the same
 * two-step Pix checkout as every other purchase. Name, address, region and
 * dietary restrictions are collected there, once.
 */
export default function BoxOrder({ box, maxQuantity }: BoxOrderProps) {
  const router = useRouter();
  const { addToCart, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const changeQuantity = (delta: number) => {
    const next = quantity + delta;
    if (next < 1) return;
    if (next > maxQuantity) {
      setError(`Temos apenas ${maxQuantity} caixas disponíveis.`);
      return;
    }
    setError('');
    setQuantity(next);
  };

  const pickDate = (iso: string) => {
    setDate(iso);
    setError('');
    try { localStorage.setItem(DATE_KEY, iso); } catch { /* private mode */ }
  };

  const goToCheckout = () => {
    if (!date) {
      setError('Escolha o dia em que você quer receber sua caixa no calendário.');
      return;
    }
    const id = `box-${box.id}`;
    removeFromCart(id); // re-adding sets the exact quantity instead of stacking on an older order
    addToCart({
      id,
      name: box.title,
      price: box.price.toFixed(2).replace('.', ','),
      image: box.image_url,
      kind: 'box',
      tasting_box_id: box.id,
      max_quantity: maxQuantity,
    }, { open: false, quantity });
    router.push('/checkout');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(1.5rem, 4vw, 3.5rem)', alignItems: 'flex-start' }}>
      {/* Product image */}
      <div style={{ flex: '1 1 340px', minWidth: '260px', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={box.image_url}
          alt={box.title}
          style={{ width: '100%', height: 'auto', maxHeight: '640px', objectFit: 'contain', background: '#f5efe2', borderRadius: '24px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#d4af37', color: '#fff', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.1rem', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(212,175,55,0.4)', transform: 'rotate(15deg)' }}>
          R${Math.round(box.price)}
        </div>
      </div>

      {/* Order details */}
      <div style={{ flex: '1 1 380px', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#3c2a21', fontFamily: 'var(--font-heading)', lineHeight: 1.1, marginBottom: '0.75rem' }}>Peça Sua Caixa</h2>
          <p style={{ fontSize: '1rem', color: '#594a42', lineHeight: 1.6 }}>
            Escolha o dia e pague por Pix em seguida. Receba em casa (Itamambuca, praias vizinhas e eventos em Paraty) ou retire no nosso home bakery: você escolhe no próximo passo.
          </p>
        </div>

        <DeliveryCalendar value={date} onChange={pickDate} title="Escolha o dia da sua caixa" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#3c2a21', background: '#fdf7ee', padding: '1rem', borderRadius: '16px', border: '1px solid #e8e1d7', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '1.1rem', fontWeight: 600, flex: 1, minWidth: '120px' }}>Quantidade:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="button" onClick={() => changeQuantity(-1)} aria-label="Menos" style={{ width: '40px', height: '40px', borderRadius: '20px', border: 'none', background: '#fff', color: '#3c2a21', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>-</button>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '25px', textAlign: 'center' }}>{quantity}</span>
            <button type="button" onClick={() => changeQuantity(1)} aria-label="Mais" style={{ width: '40px', height: '40px', borderRadius: '20px', border: 'none', background: '#d4af37', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(212,175,55,0.3)' }}>+</button>
          </div>
        </div>

        <div style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', color: '#3c2a21', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
          <span>{quantity}x {formatBRL(box.price)}</span>
          <strong>{formatBRL(quantity * box.price)}</strong>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#7a6a61', marginTop: '-0.75rem', padding: '0 0.5rem' }}>
          + taxa de entrega conforme a região (Itamambuca é grátis), calculada no próximo passo.
        </p>

        {error && <p style={{ color: '#c0392b', fontSize: '0.92rem' }}>{error}</p>}

        <button type="button" onClick={goToCheckout} className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '40px' }}>
          Continuar para o pagamento ➔
        </button>
      </div>
    </div>
  );
}
