'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import StripedBackground from '@/components/StripedBackground';
import BoxOrder from '@/components/BoxOrder';
import ScrollReveal from '@/components/ScrollReveal';
import WaitlistCapture from '@/components/WaitlistCapture';
import Marquee from '@/components/Marquee';
import BoxContents from '@/components/BoxContents';
import { BoxItem } from '@/lib/allergens';
import { formatBatchDate } from '@/lib/batchDate';
import { BoxWindowFields, deliveryWindowLabel, hasDeliveryWindow, longDay } from '@/lib/boxWindow';
import { useBoxSale } from '@/lib/useBoxSale';
import HeroBoxCard, { HeroBoxStrip, type HeroBoxPhoto } from '@/components/HeroBoxCard';
import MobileBuyBar from '@/components/MobileBuyBar';

// Real photos of earlier boxes, used whenever the database has too few of its own.
const FALLBACK_BOX_PHOTOS: HeroBoxPhoto[] = ['/box1.jpg', '/box2.jpg', '/box3.jpg', '/box4.jpg'].map(src => ({ src }));

interface TastingBox extends BoxWindowFields {
  id: string;
  title: string;
  description: string;
  image_url: string;
  batch_date_label: string;
  total_quantity: number;
  sold_quantity: number;
  price: number;
  items?: BoxItem[] | null;
}

export default function CaixasPage() {
  const [activeBox, setActiveBox] = useState<TastingBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [pastPhotos, setPastPhotos] = useState<HeroBoxPhoto[]>([]);
  const sale = useBoxSale(activeBox);

  useEffect(() => {
    const fetchPastBoxes = async () => {
      const { data } = await supabase
        .from('tasting_boxes')
        .select('title, image_url')
        .eq('is_active', false)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8);
      if (data) setPastPhotos(data.filter(b => b.image_url).map(b => ({ src: b.image_url as string, caption: b.title })));
    };
    fetchPastBoxes();

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
        
        {/* Mobile Marquee */}
        <div className="mobile-only">
          <Marquee text="Nossas Caixas de Degustação são edições limitadas lançadas semanalmente. O lote atual já esgotou ou estamos preparando o próximo menu surpresa com nossos melhores doces veganos, sem glúten e sem açúcar. 🌿✨ " speed={250} />
        </div>

        <section style={{ 
          flex: 1,
          position: 'relative',
          padding: 'clamp(2.25rem, 8vw, 6rem) 1rem', 
          textAlign: 'center',
          color: '#fdfaf3',
          display: 'flex',
          alignItems: 'flex-start',
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
          
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            
            <h1 style={{ fontSize: 'clamp(1.85rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem', color: '#d4af37' }}>
              Preparando o Próximo Lote...
            </h1>
            
            <p className="desktop-only" style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.9)', maxWidth: '800px', margin: '0 auto 2rem auto', lineHeight: '1.8' }}>
              Cada Caixa de Degustação é uma edição única, feita à mão e lançada uma vez por semana.
              O lote desta semana já encontrou suas casas — o próximo já está sendo desenhado.
            </p>

            {/* Someone who arrived at a sold-out lot is the single most likely
                person on the site to subscribe. Offer it before the waitlist. */}
            <div style={{
              maxWidth: '620px', margin: '0 auto 3rem', padding: '1.5rem',
              background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.5)',
              borderRadius: '16px', backdropFilter: 'blur(6px)',
            }}>
              <p style={{ color: '#d4af37', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.6rem' }}>
                Cansado de perder o lote?
              </p>
              <p style={{ color: 'rgba(253,250,243,0.88)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
                Assinantes recebem uma caixa toda semana, com prioridade nas edições limitadas
                e a partir de R$ 79 por caixa.
              </p>
              <Link href="/assinatura" style={{
                display: 'inline-block', background: '#d4af37', color: '#3c2a21',
                padding: '0.9rem 2rem', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 700, fontSize: '0.98rem',
              }}>
                Ver a assinatura semanal
              </Link>
            </div>

            {/* Mobile Carousel */}
            <div className="mobile-only hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0.5rem', marginBottom: '2rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              <img src="/box1.jpg" alt="Tasting Box 1" style={{ flex: '0 0 85%', height: '350px', objectFit: 'cover', borderRadius: '16px', scrollSnapAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} />
              <img src="/box2.jpg" alt="Tasting Box 2" style={{ flex: '0 0 85%', height: '350px', objectFit: 'cover', borderRadius: '16px', scrollSnapAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} />
            </div>

            {/* Desktop 3-Column Layout */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              
              <div className="desktop-only" style={{ flex: '1', maxWidth: '400px', minWidth: '300px' }}>
                <img src="/box1.jpg" alt="Tasting Box" style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
              </div>

              <div style={{ flex: '1', maxWidth: '500px', width: '100%', minWidth: '300px' }}>
                <ScrollReveal>
                  <WaitlistCapture />
                </ScrollReveal>
              </div>

              <div className="desktop-only" style={{ flex: '1', maxWidth: '400px', minWidth: '300px' }}>
                <img src="/box2.jpg" alt="Tasting Box" style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
              </div>

            </div>

          </div>
        </section>
      </main>
    );
  }

  const remainingQuantity = Math.max(0, activeBox.total_quantity - activeBox.sold_quantity);
  // Earlier boxes first, then the stock photos, never the box that is on sale now. Alternate them left/right.
  const seen = new Set<string>([activeBox.image_url]);
  const heroPhotos = [...pastPhotos, ...FALLBACK_BOX_PHOTOS].filter(p => !seen.has(p.src) && seen.add(p.src));
  const leftPhotos = heroPhotos.filter((_, i) => i % 2 === 0).slice(0, 4);
  const rightPhotos = heroPhotos.filter((_, i) => i % 2 === 1).slice(0, 4);

  const percentageSold = Math.min(100, (activeBox.sold_quantity / activeBox.total_quantity) * 100);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem' }}>
      
      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: 'clamp(3.5rem, 8vw, 8rem) 1rem clamp(2rem, 5vw, 4rem) 1rem', 
        textAlign: 'center',
        color: '#fdfaf3',
        overflow: 'hidden'
      }}>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundImage: `url(${activeBox.image_url}), linear-gradient(180deg, rgba(60,42,33,0.55) 0%, rgba(60,42,33,0.9) 65%, rgba(60,42,33,0.95) 100%)`,
            backgroundBlendMode: 'overlay',
            backgroundColor: 'var(--color-primary)',
          }}
        />
        
        <HeroBoxCard side="left" photos={leftPhotos} />
        <HeroBoxCard side="right" photos={rightPhotos} delayMs={2750} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <HeroBoxStrip photos={[leftPhotos[0], rightPhotos[0]].filter(Boolean)} />
          <ScrollReveal>
            <span style={{ display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
              Edição Limitada • {formatBatchDate(activeBox.batch_date_label)}
            </span>
            <h1 style={{ fontSize: 'clamp(1.95rem, 6vw, 4.5rem)', fontFamily: 'var(--font-heading)', lineHeight: '1.1', marginBottom: '1.5rem' }}>
              {(() => {
                // "Chegada da Primavera: Sensações Amarelas" -> the theme after the colon is set in the site gold.
                const i = activeBox.title.indexOf(':');
                const gold: React.CSSProperties = { color: '#d4af37', textShadow: '0 2px 18px rgba(0,0,0,0.35)' };
                if (i === -1) return <span style={gold}>{activeBox.title}</span>;
                return <>{activeBox.title.slice(0, i + 1)} <span style={gold}>{activeBox.title.slice(i + 1).trim()}</span></>;
              })()}
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.9)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
              {activeBox.description}
            </p>

            {/* Scarcity Counter */}
            <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
                <span>Restam apenas {remainingQuantity} caixas!</span>
                <span>{percentageSold.toFixed(0)}% Vendido</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${percentageSold}%`, height: '100%', background: remainingQuantity <= 5 ? '#ff7675' : '#d4af37', transition: 'width 1s ease-in-out' }} />
              </div>
              {remainingQuantity <= 5 && remainingQuantity > 0 && sale?.state === 'open' && (
                <p style={{ color: '#ff7675', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', animation: 'pulse 2s infinite', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Corra! O lote está quase no fim.</p>
              )}

              {/* The two windows: when it arrives, and until when you can order */}
              {sale && (hasDeliveryWindow(activeBox) || sale.closesOn || sale.state !== 'open') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                  {hasDeliveryWindow(activeBox) && (
                    <span style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.6)', color: '#fdfaf3', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 600 }}>
                      🚚 Entregas {deliveryWindowLabel(activeBox)}
                    </span>
                  )}
                  {sale.state === 'open' && sale.closesOn && (
                    <span style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.6)', color: '#fdfaf3', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 600 }}>
                      ⏳ Pedidos até {longDay(sale.closesOn)}
                    </span>
                  )}
                  {sale.state === 'soon' && sale.opensOn && (
                    <span style={{ background: '#d4af37', color: '#3c2a21', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 800 }}>
                      🔔 Pedidos abrem {longDay(sale.opensOn)}
                    </span>
                  )}
                  {sale.state === 'closed' && (
                    <span style={{ background: '#fdfaf3', color: '#3c2a21', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 800 }}>
                      🔒 Pedidos encerrados para esta edição
                    </span>
                  )}
                  {sale.state === 'soldout' && (
                    <span style={{ background: '#ff7675', color: '#fff', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 800 }}>
                      Esgotada
                    </span>
                  )}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {activeBox.items && activeBox.items.length > 0 && <BoxContents items={activeBox.items} />}

      {/* Checkout Section */}
      <section id="order" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <ScrollReveal>
            <BoxOrder box={activeBox} maxQuantity={remainingQuantity} sale={sale} />
          </ScrollReveal>
        </div>
      </section>

      {/* Offered after the one-off purchase, where the value of not having to
          come back and do this every week is most obvious. */}
      <StripedBackground tone="dark" bandHeight={80} image="/textures/copacabana-baker.webp" imagePosition="80% 55%" style={{ padding: 'clamp(3.5rem, 8vw, 5.5rem) 1.5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            color: '#d4af37', fontSize: '0.8rem', textTransform: 'uppercase',
            letterSpacing: '0.2em', marginBottom: '1rem',
          }}>
            Assinatura Semanal
          </p>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)',
            color: '#fdfaf3', marginBottom: '1.25rem', lineHeight: 1.2,
          }}>
            Ou receba uma caixa nova toda semana
          </h2>
          <p style={{ color: 'rgba(253,250,243,0.85)', lineHeight: 1.85, marginBottom: '2rem' }}>
            Sem precisar voltar aqui, sem correr atrás do lote. A partir de R$ 79 por caixa,
            com prioridade nas edições limitadas e entrega inclusa em Itamambuca.
          </p>
          <Link href="/assinatura" style={{
            display: 'inline-block', background: '#d4af37', color: '#3c2a21',
            padding: '1.1rem 2.5rem', borderRadius: '10px', textDecoration: 'none',
            fontWeight: 700, fontSize: '1.02rem',
          }}>
            Conhecer os planos
          </Link>
        </div>
      </StripedBackground>

      <Marquee text="CAIXA DE DEGUSTAÇÃO SEMANAL ✦ FEITA À MÃO EM ITAMAMBUCA ✦ " speed={120} />

      {/* Phones only: keeps the price and one tap to order under the thumb the whole way down. */}
      <MobileBuyBar
        kicker={remainingQuantity > 0 ? `Restam ${remainingQuantity}` : 'Caixa da semana'}
        price={`R$ ${Math.round(activeBox.price)}`}
        note={activeBox.batch_date_label ? formatBatchDate(activeBox.batch_date_label) : undefined}
        label="Pedir"
        targetId="#order"
      />

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
