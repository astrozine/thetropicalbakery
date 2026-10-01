'use client';

import React, { useEffect, useState } from 'react';
import { OriginSeal } from '@/components/BelgiumBrazil';
import { supabase } from '@/lib/supabase';
import ScrollReveal from '@/components/ScrollReveal';
import MenuCard from '@/components/MenuCard';
import TreatPicker, { type PickableTreat } from '@/components/TreatPicker';
import SquiggleArrows from '@/components/SquiggleArrows';
import EventQuoteDecor from '@/components/EventQuoteDecor';
import EventOrderSheet, { EventQuoteForm } from '@/components/EventOrder';
import { useCart } from '@/context/CartContext';
import TreatRefineMenu, { emptyRefine, matchesRefine, refineCount, type RefineState } from '@/components/TreatRefineMenu';
import TreatTypeBar, { styleToggles } from '@/components/TreatTypeBar';
import SosFreeExplainer from '@/components/SosFreeExplainer';
import { ALLERGEN_LIST_NEM } from '@/lib/allergens';
import { anyTyped, groupByType, textOn } from '@/lib/treatTypes';

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
  treat_type?: string | null;
  is_raw?: boolean | null;
  sugars?: string[] | null;
  caffeine?: string | null;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<Treat[]>([]);
  const [loading, setLoading] = useState(true);
  // Customers mostly arrive with an allergy in mind, so the panel starts on "Sem" (free of).
  const [refine, setRefine] = useState<RefineState>({ ...emptyRefine, mode: 'free' });
  // The quick pick's button opens one sheet with both ways to order (see EventOrder.tsx).
  const [sheetPicks, setSheetPicks] = useState<PickableTreat[] | null>(null);
  // One list of chosen treats, shared by the photo quick pick and the catalogue below it,
  // so what you tapped up there is still marked (and can be changed) down here.
  const [picked, setPicked] = useState<string[]>([]);
  const togglePick = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
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

  // /menu?raw=1 opens on the raw treats and /menu?sos=1 on the SOS-free ones (?integral=1, the first name, still works), so a post or a
  // message can link straight to them; the address follows the pills, so what you see can be shared.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setRefine(r => ({ ...r, raw: q.get('raw') === '1' ? 'raw' : 'all', wholeFood: q.get('sos') === '1' || q.get('integral') === '1' }));
  }, []);
  const setStyle = (next: RefineState) => {
    setRefine(next);
    const url = new URL(window.location.href);
    if (next.raw === 'raw') url.searchParams.set('raw', '1'); else url.searchParams.delete('raw');
    url.searchParams.delete('integral');
    if (next.wholeFood) url.searchParams.set('sos', '1'); else url.searchParams.delete('sos');
    window.history.replaceState(window.history.state, '', url);
  };

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
            <OriginSeal text="Confeitaria de luxo · Técnica belga" style={{ marginBottom: '1.5rem' }} />
            
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
                picked={picked}
                onPickedChange={setPicked}
                onAction={chosen => setSheetPicks(chosen)}
              />
            </div>

            <details style={{ marginBottom: '2.5rem', cursor: 'pointer' }}>
              <summary style={{ fontSize: '1.15rem', color: '#594a42', fontWeight: 600, padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                Ler sobre nossa proposta para eventos...
              </summary>
              <div style={{ padding: '1rem 0', color: '#7a6a61', lineHeight: '1.8' }}>
                Planejando um aniversário, casamento, retiro ou encontro corporativo na nossa região? 
                Abaixo você encontra nosso portfólio de doces de luxo, 100% veganos, sem glúten e SOS-free: sem sal, sem óleo e sem açúcar refinado, com a doçura vindo de tâmaras, frutas, açúcar de coco ou rapadura. A única exceção é o chocolate vegano que alguns doces levam, que vem pronto com açúcar e óleo: esses aparecem marcados com “🍫 Com chocolate vegano”. 
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
          <SosFreeExplainer tone="dark" style={{ margin: '0.6rem auto 0', textAlign: 'center' }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>Carregando doces maravilhosos...</div>
        ) : (
          <>
          {/* Allergy/preference finder: a sticky left column on desktop, above the treats on phones. */}
          <style>{`
            .menu-aside { margin-bottom: 2.5rem; }
            /* The type picker sits at the top of the treats column — top-right on a wide screen,
               a swipeable strip above the grid on a phone. */
            .menu-typebar { display: flex; flex-direction: column; align-items: stretch; gap: 0.8rem; margin-bottom: 1.5rem; }
            @media (min-width: 1024px) {
              .menu-layout { display: grid; grid-template-columns: minmax(320px, 380px) minmax(0, 1fr); gap: 2rem; align-items: start; }
              .menu-aside { position: sticky; top: 7.5rem; max-height: calc(100vh - 9rem); overflow-y: auto; margin-bottom: 0; padding: 2px 6px 10px 2px; }
              .menu-typebar { align-items: flex-end; margin-bottom: 1.25rem; }
            }
          `}</style>
          <div className="menu-layout">
          <aside className="menu-aside" aria-label="Filtro de alergias e preferências">
            <TreatRefineMenu variant="public" treats={menuItems} value={refine} onChange={setStyle} shown={visibleItems.length} sheetBelow={1024} fabBottom={picked.length > 0 ? '9.5rem' : '5.5rem'} />
          </aside>

          <div className="menu-main">
          <div className="menu-typebar">
            {/* One row: 🌿 Raw and 🌾 SOS-free (on/off), then the kinds of treat. */}
            <TreatTypeBar bleed treats={menuItems} value={refine.types} onChange={(types: string[]) => setRefine({ ...refine, types })}
              toggles={styleToggles(menuItems, refine, setStyle)} />
          </div>

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

          {/* Grouped once Dolly has typed at least one treat, in the same style as the admin's own
              Atalhos grid: one continuous grid (rows never break for a group change — the next
              category just slides in after the last card), and the group's colour runs across the
              top of every one of its cards with the name sitting on that line. Until anything is
              typed, this is exactly the flat grid it always was. */}
          {anyTyped(visibleItems) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
              {groupByType(visibleItems).flatMap(group => group.items.map((item, i) => (
                <div
                  key={item.id}
                  className="menu-type-cell"
                  data-first={i === 0 ? 'true' : 'false'}
                  style={{ ['--cell-accent' as string]: group.accent } as React.CSSProperties}
                >
                  {/* The name is rendered on every card but only revealed on the group's first one
                      and at the start of each row (see the CSS) — so however long a group runs,
                      the left-hand card of the row you're looking at always says where you are. */}
                  <div className="menu-type-head">
                    <span style={{ background: group.accent, color: textOn(group.accent) }}>
                      {group.emoji} {group.label}
                    </span>
                  </div>
                  <ScrollReveal>
                    <MenuCard flatTop picked={picked.includes(item.id)} onTogglePick={() => togglePick(item.id)} item={{
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
                      treat_type: item.treat_type,
                      is_raw: item.is_raw,
                      sugars: item.sugars,
                      caffeine: item.caffeine,
                    }} />
                  </ScrollReveal>
                </div>
              )))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
              {visibleItems.map(item => (
                <ScrollReveal key={item.id}>
                  <MenuCard picked={picked.includes(item.id)} onTogglePick={() => togglePick(item.id)} item={{
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
                    treat_type: item.treat_type,
                    is_raw: item.is_raw,
                    sugars: item.sugars,
                    caffeine: item.caffeine,
                  }} />
                </ScrollReveal>
              ))}
            </div>
          )}

          <style>{`
            .menu-type-cell { display: flex; flex-direction: column; min-width: 0; }
            /* The group's colour, drawn across the full width of every card it owns, with the
               name tab sitting on that line — the card below is squared off so the two meet. */
            .menu-type-head { height: 1.7rem; display: flex; align-items: flex-end; border-bottom: 4px solid var(--cell-accent, #d4af37); }
            .menu-type-head span { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.76rem; font-weight: 800; line-height: 1; letter-spacing: 0.01em; padding: 0.38rem 0.7rem; border-radius: 8px 8px 0 0; visibility: hidden; }

            /* The name shows on the group's first card, and again on whichever card starts a row,
               so a long group keeps telling you what you're looking at however far it runs.
               The counts below mirror the grid classes above (2 / md:3 / lg:2 / xl:3 / 2xl:4 — the
               filter column takes the room from lg up), in Tailwind's own rem breakpoints (md 48rem,
               lg 64rem, xl 80rem, 2xl 96rem) so the two can't drift apart. Within each block the
               [data-first] rule has to come last: it has the same specificity as the nth-child
               ones and must win. */
            .menu-type-cell:nth-child(2n+1) .menu-type-head span { visibility: visible; }
            .menu-type-cell[data-first="true"] .menu-type-head span { visibility: visible; }
            @media (min-width: 48rem) {
              .menu-type-cell:nth-child(2n+1) .menu-type-head span { visibility: hidden; }
              .menu-type-cell:nth-child(3n+1) .menu-type-head span { visibility: visible; }
              .menu-type-cell[data-first="true"] .menu-type-head span { visibility: visible; }
            }
            @media (min-width: 64rem) {
              .menu-type-cell:nth-child(3n+1) .menu-type-head span { visibility: hidden; }
              .menu-type-cell:nth-child(2n+1) .menu-type-head span { visibility: visible; }
              .menu-type-cell[data-first="true"] .menu-type-head span { visibility: visible; }
            }
            @media (min-width: 80rem) {
              .menu-type-cell:nth-child(2n+1) .menu-type-head span { visibility: hidden; }
              .menu-type-cell:nth-child(3n+1) .menu-type-head span { visibility: visible; }
              .menu-type-cell[data-first="true"] .menu-type-head span { visibility: visible; }
            }
            @media (min-width: 96rem) {
              .menu-type-cell:nth-child(3n+1) .menu-type-head span { visibility: hidden; }
              .menu-type-cell:nth-child(4n+1) .menu-type-head span { visibility: visible; }
              .menu-type-cell[data-first="true"] .menu-type-head span { visibility: visible; }
            }
          `}</style>
          </div>
          </div>
          </>
        )}

        <p style={{ maxWidth: '760px', margin: '3rem auto 0', textAlign: 'center', color: '#7a6a61', fontSize: '0.85rem', lineHeight: 1.75 }}>
          Todos os doces são 100% vegetais e feitos sem glúten. O que muda de um doce para outro ({ALLERGEN_LIST_NEM.replace(' nem ', ' e ')},
          que açúcar leva e se tem cafeína) está em cada um. Tudo é feito na mesma cozinha, então pode haver traços, inclusive de glúten. Se algum convidado tem alergia grave ou é celíaco,
          fale com a gente no WhatsApp antes de fechar o pedido.
        </p>
      </section>

      {/* Last stop for anyone who browsed the catalogue instead of tapping photos: the same "build it together" path. */}
      <section id="orcamento" style={{ padding: 'clamp(4rem, 8vw, 5rem) 1rem clamp(2.25rem, 6vw, 5rem)', background: '#fdfaf3' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <SquiggleArrows />
          <EventQuoteDecor />
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
