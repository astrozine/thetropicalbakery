'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ScrollReveal from '@/components/ScrollReveal';
import MenuCard from '@/components/MenuCard';
import SquiggleArrows from '@/components/SquiggleArrows';
import EventLeadCapture from '@/components/EventLeadCapture';
import TreatRefineMenu, { emptyRefine, matchesRefine, refineCount, type RefineState } from '@/components/TreatRefineMenu';

interface Treat {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  min_batch_size: number;
  batch_multiplier: number;
  emoji?: string | null;
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<Treat[]>([]);
  const [loading, setLoading] = useState(true);
  // Customers mostly arrive with an allergy in mind, so the panel starts on "Sem" (free of).
  const [refine, setRefine] = useState<RefineState>({ ...emptyRefine, mode: 'free' });

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

  const visibleItems = menuItems.filter(t => matchesRefine(t, refine, { hideUnknownWhenFree: true }));

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem', overflowX: 'clip' }}>
      
      {/* Header Section */}
      <section style={{ 
        padding: 'clamp(3rem, 5vw, 6rem) 1rem', 
        background: '#fdfaf3',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3rem' }}>
          
          {/* Image Column */}
          <div style={{ flex: '1 1 400px', position: 'relative' }}>
            <img 
              src="/event_hero.jpg" 
              alt="Menu de Eventos The Tropical Bakery" 
              style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', objectFit: 'cover' }} 
            />
          </div>

          {/* Content Column */}
          <div style={{ flex: '1 1 400px' }}>
            <span style={{ color: '#d4af37', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '1.5rem' }}>
              Atacado &amp; Casamentos
            </span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem', color: '#3c2a21' }}>
              Menu para Eventos
            </h1>
            
            <details style={{ marginBottom: '2.5rem', cursor: 'pointer' }}>
              <summary style={{ fontSize: '1.15rem', color: '#594a42', fontWeight: 600, padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                Ler sobre nossa proposta para eventos...
              </summary>
              <div style={{ padding: '1rem 0', color: '#7a6a61', lineHeight: '1.8' }}>
                Planejando um aniversário, casamento, retiro ou encontro corporativo na nossa região? 
                Abaixo você encontra nosso portfólio de doces de luxo 100% Veganos, Sem Glúten e SOS-Free (livres de açúcar refinado e óleo). 
                Todos os itens abaixo são para <strong>encomendas em grandes quantidades</strong>. Entre em contato conosco via WhatsApp para organizarmos os detalhes, quantidades e a data de entrega do seu evento!
              </div>
            </details>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
              <SquiggleArrows />
              <div style={{ position: 'relative', zIndex: 11 }}>
                <EventLeadCapture />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery / Events Menu Section */}
      <section id="portfolio" style={{ padding: 'clamp(3rem, 6vw, 5rem) 2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
          <>
          {/* Allergy/preference finder: a sticky left column on desktop, above the treats on phones. */}
          <style>{`
            .menu-aside { margin-bottom: 2.5rem; }
            @media (min-width: 1024px) {
              .menu-layout { display: grid; grid-template-columns: minmax(320px, 380px) minmax(0, 1fr); gap: 2rem; align-items: start; }
              .menu-aside { position: sticky; top: 7.5rem; max-height: calc(100vh - 9rem); overflow-y: auto; margin-bottom: 0; padding: 2px 6px 10px 2px; }
            }
          `}</style>
          <div className="menu-layout">
          <aside className="menu-aside" aria-label="Filtro de alergias e preferências">
            <TreatRefineMenu variant="public" treats={menuItems} value={refine} onChange={setRefine} shown={visibleItems.length} sheetBelow={1024} fabBottom="5.5rem" />
          </aside>

          <div className="menu-main">
          {visibleItems.length === 0 && (
            <div style={{ textAlign: 'center', color: '#594a42', padding: '2rem 1rem' }}>
              <p style={{ marginBottom: '1rem' }}>Nenhum doce combina com essa busca. Tente tirar algum filtro, ou fale com a gente no WhatsApp: podemos adaptar um doce para você.</p>
              {refineCount(refine) > 0 && (
                <button type="button" onClick={() => setRefine({ ...emptyRefine, mode: refine.mode })}
                  style={{ padding: '0.7rem 1.5rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {visibleItems.map(item => (
              <ScrollReveal key={item.id}>
                <MenuCard item={{
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  price: item.price.toFixed(2).replace('.', ','),
                  image: item.image_url,
                  min_batch_size: item.min_batch_size,
                  batch_multiplier: item.batch_multiplier,
                  emoji: item.emoji,
                  ingredients: item.ingredients,
                  contains: item.contains,
                  may_contain: item.may_contain,
                }} />
              </ScrollReveal>
            ))}
          </div>
          </div>
          </div>
          </>
        )}

        <p style={{ maxWidth: '760px', margin: '3rem auto 0', textAlign: 'center', color: '#7a6a61', fontSize: '0.85rem', lineHeight: 1.75 }}>
          Alérgenos e ingredientes são informados por doce. Tudo é feito na mesma cozinha, então traços de outros ingredientes podem existir
          mesmo quando não estão na receita. Se algum convidado tem alergia grave, fale com a gente no WhatsApp antes de fechar o pedido.
        </p>
      </section>

    </main>
  );
}
