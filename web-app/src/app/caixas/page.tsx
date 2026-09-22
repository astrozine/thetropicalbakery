'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import WhatsAppCheckout from '@/components/WhatsAppCheckout';
import ScrollReveal from '@/components/ScrollReveal';

interface TastingBox {
  id: string;
  title: string;
  description: string;
  image_url: string;
  batch_date_label: string;
  total_quantity: number;
  sold_quantity: number;
  price: number;
}

export default function CaixasPage() {
  const [activeBox, setActiveBox] = useState<TastingBox | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveBox = async () => {
      const { data, error } = await supabase
        .from('tasting_boxes')
        .select('*')
        .eq('is_active', true)
        .single();
        
      if (!error && data) {
        setActiveBox(data);
      }
      setLoading(false);
    };

    fetchActiveBox();
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando a surpresa da semana...</div>;
  }

  if (!activeBox) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
        <section style={{ 
          flex: 1,
          position: 'relative',
          padding: 'clamp(6rem, 8vw, 8rem) 1rem', 
          textAlign: 'center',
          color: '#fdfaf3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
              backgroundSize: 'cover', backgroundPosition: 'center',
              backgroundImage: 'url(/iphone_cacao_pod.jpg), linear-gradient(rgba(60, 42, 33, 0.8), rgba(60, 42, 33, 0.95))',
              backgroundBlendMode: 'overlay',
            }}
          />
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
            <ScrollReveal>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem', color: '#d4af37' }}>
                Preparando o Próximo Lote...
              </h1>
              <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.9)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
                Nossas Caixas de Degustação são edições limitadas lançadas semanalmente. O lote atual já esgotou ou estamos preparando o próximo menu surpresa com nossos melhores doces veganos, sem glúten e sem açúcar.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://instagram.com/thetropicalbakery" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #d4af37, #c19b2e)', border: 'none', borderRadius: '40px' }}>
                  Acompanhar no Instagram
                </a>
                <a href="/menu" className="btn btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '40px' }}>
                  Ver Menu para Eventos
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    );
  }

  const remainingQuantity = Math.max(0, activeBox.total_quantity - activeBox.sold_quantity);
  const percentageSold = Math.min(100, (activeBox.sold_quantity / activeBox.total_quantity) * 100);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem' }}>
      
      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: 'clamp(6rem, 8vw, 8rem) 1rem clamp(2rem, 5vw, 4rem) 1rem', 
        textAlign: 'center',
        color: '#fdfaf3',
        overflow: 'hidden'
      }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundImage: `url(${activeBox.image_url}), linear-gradient(rgba(60, 42, 33, 0.85), rgba(60, 42, 33, 0.85))`
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <ScrollReveal>
            <span style={{ display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
              Edição Limitada • {activeBox.batch_date_label}
            </span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem' }}>
              {activeBox.title}
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.9)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
              {activeBox.description}
            </p>

            {/* Scarcity Counter */}
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>Restam apenas {remainingQuantity} caixas!</span>
                <span>{percentageSold.toFixed(0)}% Vendido</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${percentageSold}%`, height: '100%', background: remainingQuantity <= 5 ? '#e74c3c' : '#d4af37', transition: 'width 1s ease-in-out' }} />
              </div>
              {remainingQuantity <= 5 && remainingQuantity > 0 && (
                <p style={{ color: '#ff7675', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>Corra! O lote está quase no fim.</p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Checkout Section */}
      <section id="order" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <ScrollReveal>
            <WhatsAppCheckout activeTastingBoxId={activeBox.id} priceOverride={activeBox.price} />
          </ScrollReveal>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}} />
    </main>
  );
}
