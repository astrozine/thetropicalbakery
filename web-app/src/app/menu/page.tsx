import React from 'react';
import menuItems from '@/data/menu.json';
import ScrollReveal from '@/components/ScrollReveal';
import MenuCard from '@/components/MenuCard';
import SquiggleArrows from '@/components/SquiggleArrows';

export const metadata = {
  title: 'Menu de Eventos e Caixas Surpresa | The Tropical Bakery',
  description: 'Veja as nossas criações passadas e encomende os seus doces favoritos para o seu próximo evento.',
};

export default function MenuPage() {
  const WHATSAPP_NUMBER = "5511932119196";

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem' }}>
      
      {/* Header Section */}
      <section style={{ 
        position: 'relative',
        padding: 'clamp(4rem, 8vw, 8rem) 2rem', 
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
            Nossas Criações
          </span>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem' }}>
            Caixas Surpresa &amp; Menu para Eventos
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.8)', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.8' }}>
            Toda semana, nossa fundadora cria uma nova <strong>Caixa Surpresa de Degustação</strong> com 4 doces exclusivos por R$ 99,00. 
            Abaixo, você pode explorar nosso portfólio de criações passadas e encomendá-las em maiores quantidades para o seu próximo evento especial.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <SquiggleArrows />
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de reservar a Caixa Surpresa de Degustação desta semana.')}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary" 
                style={{ padding: '1rem 2rem', position: 'relative', zIndex: 11 }}
              >
                Pedir a Caixa Desta Semana
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
            Portfólio de Eventos
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#594a42', maxWidth: '600px', margin: '0 auto' }}>
            Planejando um aniversário, casamento ou encontro corporativo? Encomende qualquer um dos nossos luxuosos doces 100% Veganos, Sem Glúten e SOS-Free.
            <br/><br/>
            <strong>Pedido Mínimo Aplicável. Valor Base: R$ 28,00 / unidade.</strong>
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {menuItems.map((item, idx) => (
            <ScrollReveal key={idx}>
              <MenuCard item={item} />
            </ScrollReveal>
          ))}
        </div>
      </section>

    </main>
  );
}
