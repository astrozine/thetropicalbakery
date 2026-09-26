'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ScrollReveal from '@/components/ScrollReveal';
import MenuCard from '@/components/MenuCard';
import TreatPicker, { type PickableTreat } from '@/components/TreatPicker';
import SquiggleArrows from '@/components/SquiggleArrows';
import EventOrderSheet, { EventQuoteForm } from '@/components/EventOrder';
import { useCart } from '@/context/CartContext';
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
  // The quick pick's button opens one sheet with both ways to order (see EventOrder.tsx).
  const [sheetPicks, setSheetPicks] = useState<PickableTreat[] | null>(null);
  const { items: cartItems } = useCart();
  const cartNames = cartItems.filter(i => i.kind === 'events').map(i => i.name);

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
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: 'max(6rem, calc(90px + env(safe-area-inset-bottom, 0px) + 80px))', overflowX: 'clip' }}>
      
      {/* Header Section */}
      <section style={{ 
        padding: 'clamp(2rem, 5vw, 6rem) 1rem', 
        background: '#fdfaf3',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div className="menu-hero" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3rem' }}>
          
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
            <h1 style={{ fontSize: 'clamp(1.95rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem', color: '#3c2a21' }}>
              Menu para Eventos
            </h1>
            
            {/* PHONE HERO: tapping photos beats reading a paragraph. By the time
                someone has picked four treats they have already decided they want
                something — the button only has to catch that. Desktop keeps its
                own hero, which works well there. */}
            <div className="mobile-only" style={{ margin: '0 0 2rem' }}>
              <TreatPicker
                hero
                title="Escolha rápida"
                subtitle="Toque nos doces que você quer servir. Depois é só escolher: pedir agora ou montar junto com a gente."
                initial={8}
                ctaLabel="Continuar"
                onAction={chosen => setSheetPicks(chosen)}
              />
            </div>

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
            
          </div>
        </div>
      </section>

      {/* Gallery / Events Menu Section */}
      <section id="portfolio" className="menu-detailed" style={{ padding: 'clamp(2rem, 6vw, 5rem) 2rem' }}>
        <div className="menu-detailed-head">
          <span className="menu-detailed-kicker">Busca detalhada</span>
          <h2>Todos os doces, com filtros</h2>
          <p>
            Precisa evitar um alérgeno ou procurar por ingrediente? Aqui está o catálogo inteiro,
            com os filtros. Se você só quer escolher pelas fotos, a <strong>Escolha rápida</strong> lá em cima resolve.
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

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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

      {/* Last stop for anyone who browsed the catalogue instead of tapping photos: the same "build it together" path. */}
      <section id="orcamento" style={{ padding: 'clamp(2.25rem, 6vw, 5rem) 1rem', background: '#fdfaf3' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <SquiggleArrows />
          <div style={{ position: 'relative', zIndex: 11, background: 'rgba(253,250,243,0.96)', border: '1px solid rgba(212,175,55,0.45)', borderRadius: '22px', padding: 'clamp(1.25rem, 4vw, 2rem)', boxShadow: '0 12px 34px rgba(60,42,33,0.12)', color: '#3c2a21' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 4.5vw, 1.9rem)', lineHeight: 1.15, marginBottom: '0.5rem', textAlign: 'center' }}>
              Quer ajuda para montar o seu evento?
            </h2>
            <p style={{ color: '#594a42', lineHeight: 1.65, textAlign: 'center', fontSize: '0.98rem', marginBottom: '1.25rem' }}>
              {cartNames.length > 0
                ? `Você já separou ${cartNames.length} ${cartNames.length === 1 ? 'doce' : 'doces'} no carrinho. Pode finalizar por lá, ou deixar o seu contato que a Dolly monta o orçamento com você.`
                : 'Deixe seu contato e a Dolly monta o orçamento com você. Se preferir pedir direto, é só adicionar os doces ao carrinho.'}
            </p>
            <EventQuoteForm picks={cartNames} withNote />
          </div>
        </div>
      </section>

      {sheetPicks && <EventOrderSheet picks={sheetPicks} onClose={() => setSheetPicks(null)} />}

    </main>
  );
}
