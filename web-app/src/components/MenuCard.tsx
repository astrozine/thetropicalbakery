'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { SugarCaffeineChips } from '@/components/TreatInfo';
import { allergenById, normalizeAllergens } from '@/lib/allergens';
import TreatDetail, { TreatTags, WholePhoto } from '@/components/TreatDetail';

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
    /** Cookie, cake, chocolate… shown as a small tag over the photo. Absent treats simply get none. */
    treat_type?: string | null;
    /** Made without an oven. Its own green leaf tag, next to the type one. */
    is_raw?: boolean | null;
    /** SugarLevel / CaffeineLevel (sugarCaffeine.ts). */
    sugar?: string | null;
    caffeine?: string | null;
  };
  /** On a page with a quick pick: this treat is one of the ones already chosen there. */
  picked?: boolean;
  /** Present when the page has a quick pick; adds a choose/unchoose button to the detail overlay. */
  onTogglePick?: () => void;
  /**
   * Square off the top corners so the card can sit flush under its group's colour bar
   * (see the grouped grid on /menu). Rounded on every other page.
   */
  flatTop?: boolean;
}

export default function MenuCard({ item, picked = false, onTogglePick, flatTop = false }: MenuCardProps) {
  const { addToCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // The description scrolls inside a fixed-height box so every card is the same size; the fade at
  // its foot only shows while there's more text below.
  const textRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const contains = normalizeAllergens(item.contains);
  const closeDetail = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const measure = useCallback(() => {
    const el = textRef.current;
    setMoreBelow(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);
  useEffect(() => {
    measure();
    const el = textRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, isMobile, item.description]);

  const add = () => {
    addToCart({
      id: item.id, name: item.name, price: item.price, image: item.image,
      min_batch_size: item.min_batch_size, batch_multiplier: item.batch_multiplier, kind: 'events',
    });
  };

  return (
    <>
      <div
        className="ev-card"
        role="button"
        tabIndex={0}
        aria-label={`${item.name}: ver foto e detalhes`}
        onClick={() => setIsOpen(true)}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setIsOpen(true); } }}
        style={{
          background: '#fff',
          borderRadius: flatTop ? '0 0 16px 16px' : '16px',
          overflow: 'hidden',
          boxShadow: picked ? '0 8px 22px rgba(212,175,55,0.38)' : '0 4px 20px rgba(0,0,0,0.05)',
          border: picked ? '2px solid #d4af37' : '1px solid rgba(212,175,55,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: 'pointer'
        }}
      >
        {/* Square frame, whole photo: nothing gets cut off, whatever shape the picture is.
            Tap anywhere on the card for the full-size photo and every detail. */}
        <WholePhoto src={item.image} alt={item.name} width={isMobile ? 640 : 750} style={{ aspectRatio: '1 / 1', flexShrink: 0 }}>
          {picked && (
            <span aria-label="Na sua escolha" style={{ position: 'absolute', top: '8px', left: '8px', width: '30px', height: '30px', borderRadius: '50%', background: '#d4af37', color: '#3c2a21', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.28)' }}>✓</span>
          )}
          {/* Bottom-left, so the tags never fight the "picked" mark (top-left) or the zoom icon (top-right). */}
          <TreatTags item={item} />
          <div className="ev-card-zoom" aria-hidden style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3c2a21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
        </WholePhoto>

        {/* A fixed-height body: the title is held to two lines and the description (with its chips)
            scrolls in its own box, so a long text never makes one card taller than the rest. */}
        <div style={{ padding: isMobile ? '0.8rem 0.7rem 0.95rem' : '1.1rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '17.5rem', flexGrow: isMobile ? 1 : 0 }}>
          {/* Phones get three lines (and no emoji) so a long word like "Tartarugas" still fits. */}
          <h3 title={item.name} style={{ fontSize: isMobile ? '0.84rem' : '1.15rem', lineHeight: 1.25, minHeight: isMobile ? '3.75em' : '2.5em', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: isMobile ? '0.35rem' : '0.5rem',
            display: '-webkit-box', WebkitLineClamp: isMobile ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'break-word' }}>
            {item.emoji && !isMobile ? `${item.emoji} ` : ''}{item.name}
          </h3>

          {!isMobile && (
            <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0 }}>
              {/* Clicks in here scroll the text rather than open the overlay. */}
              <div ref={textRef} onScroll={measure} onClick={e => e.stopPropagation()} className="ev-card-text" tabIndex={0} aria-label={`Descrição de ${item.name}`}
                style={{ height: '100%', overflowY: 'auto', paddingRight: '0.35rem', cursor: 'default' }}>
                <p style={{ color: '#594a42', fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>
                  {item.description}
                </p>
                {contains.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' }} aria-label="Alérgenos">
                    {contains.map(id => {
                      const a = allergenById(id);
                      return a ? <span key={id} title={`Contém ${a.label}`} style={{ background: '#fdecea', color: '#b03a2e', border: '1px solid #f5b7b1', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>{a.emoji} {a.label}</span> : null;
                    })}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  <SugarCaffeineChips compact ingredients={item.ingredients} sugar={item.sugar} caffeine={item.caffeine} />
                </div>
              </div>
              <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '2.2rem', pointerEvents: 'none', background: 'linear-gradient(rgba(255,255,255,0), #fff)', opacity: moreBelow ? 1 : 0, transition: 'opacity 0.2s' }} />
            </div>
          )}

          {!isMobile && (
            <button type="button" onClick={e => { e.stopPropagation(); setIsOpen(true); }}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, marginTop: '0.55rem', cursor: 'pointer', color: '#8a6d1f', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              Ver detalhes e ingredientes →
            </button>
          )}

          {!isMobile && (
            <div style={{ fontSize: '0.78rem', color: '#7f8c8d', marginTop: '0.4rem', minHeight: '1.2em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(item.min_batch_size && item.min_batch_size > 1)
                ? <><strong>Mín.</strong> {item.min_batch_size} un. · <strong>lotes de</strong> {item.batch_multiplier}</>
                : null}
            </div>
          )}

          <div style={{ marginTop: isMobile ? 'auto' : '0.6rem', borderTop: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)', paddingTop: isMobile ? '0' : '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: '#3c2a21', fontSize: isMobile ? '1.05rem' : '1rem', whiteSpace: 'nowrap' }}>
              R$ {item.price} <span style={{ fontSize: '0.85rem', color: '#7a6a61', fontWeight: 400 }}>/ un.</span>
            </span>

            {!isMobile && (
              <button
                type="button"
                className="ev-card-add"
                onClick={e => { e.stopPropagation(); add(); }}
                style={{
                  background: '#d4af37',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.3s'
                }}
              >
                Adicionar +
              </button>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <TreatDetail
          item={item}
          picked={picked}
          onTogglePick={onTogglePick}
          onAdd={() => { add(); setIsOpen(false); }}
          onClose={closeDetail}
        />
      )}

      <style>{`
        .ev-card { transition: transform 0.25s, box-shadow 0.25s; }
        .ev-card:focus-visible { outline: 3px solid #d4af37; outline-offset: 2px; }
        .ev-card-add:hover { background: #c9a67a !important; }
        @media (hover: hover) {
          .ev-card:hover { transform: translateY(-3px); }
          .ev-card-zoom { opacity: 0.75; transition: opacity 0.2s, transform 0.2s; }
          .ev-card:hover .ev-card-zoom { opacity: 1; transform: scale(1.08); }
        }
        .ev-card-text { scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.55) transparent; }
        .ev-card-text::-webkit-scrollbar { width: 5px; }
        .ev-card-text::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.55); border-radius: 4px; }
      `}</style>
    </>
  );
}
