'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ScrollReveal from '@/components/ScrollReveal';
import MenuCard from '@/components/MenuCard';
import SquiggleArrows from '@/components/SquiggleArrows';

interface Treat {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  min_batch_size: number;
  batch_multiplier: number;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<Treat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('treats')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMenuItems(data);
      }
      setLoading(false);
    };
    fetchMenu();
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem' }}>
      
      {/* Header Section */}
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
            backgroundImage: 'url(/iphone_cacao_pod.jpg), linear-gradient(rgba(60, 42, 33, 0.92), rgba(60, 42, 33, 0.92))',
            backgroundBlendMode: 'overlay',
            backgroundColor: '#3c2a21'
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
          <span style={{ color: '#d4af37', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '1.5rem' }}>
            Atacado &amp; Casamentos
          </span>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem' }}>
            Menu para Eventos
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.8)', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.8' }}>
            Planejando um aniversário, casamento, retiro ou encontro corporativo na nossa região? 
            Abaixo você encontra nosso portfólio de doces de luxo 100% Veganos, Sem Glúten e SOS-Free (livres de açúcar refinado e óleo). 
            Todos os itens abaixo são para <strong>encomendas em grandes quantidades</strong>. Entre em contato conosco via WhatsApp para organizarmos os detalhes, quantidades e a data de entrega do seu evento!
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <SquiggleArrows />
              <a 
                href="https://wa.me/5511932119196"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary" 
                style={{ padding: '1rem 2rem', position: 'relative', zIndex: 11 }}
              >
                Conversar no WhatsApp
              </a>
            </div>
          </div>
        </ScrollReveal>
        </div>
      </section>

      {/* Gallery / Events Menu Section */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Nosso Portfólio
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#594a42', maxWidth: '600px', margin: '0 auto' }}>
            Navegue pelas nossas criações para montar a mesa perfeita para seus convidados.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>Carregando doces maravilhosos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {menuItems.map((item, idx) => (
              <ScrollReveal key={idx}>
                <MenuCard item={{
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price.toFixed(2).replace('.', ','),
                  image: item.image_url,
                  min_batch_size: item.min_batch_size,
                  batch_multiplier: item.batch_multiplier
                }} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
