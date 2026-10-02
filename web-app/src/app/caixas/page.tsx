'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import StripedBackground from '@/components/StripedBackground';
import BoxOrder from '@/components/BoxOrder';
import ScrollReveal from '@/components/ScrollReveal';
import Marquee from '@/components/Marquee';
import BoxContents from '@/components/BoxContents';
import { BoxItem } from '@/lib/allergens';
import { formatBatchDate } from '@/lib/batchDate';
import BoxItemList from '@/components/BoxItemList';
import { BoxWindowFields, longDay, noUpcomingEdition, splitActive } from '@/lib/boxWindow';
import NoBoxNotice from '@/components/NoBoxNotice';
import { useBoxSale } from '@/lib/useBoxSale';
import HeroBoxCard, { HeroBoxStrip, type HeroBoxPhoto } from '@/components/HeroBoxCard';
import MobileBuyBar from '@/components/MobileBuyBar';
import BoxesLeftBadge from '@/components/BoxesLeftBadge';
import { useBoxSizePrices } from '@/lib/useBoxSizePrices';
import { TREAT_COUNTS } from '@/lib/boxSizes';

// Real photos of earlier boxes, only for the "no box yet" notice (the hero shows the current box only).
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
  /** Extra photos of this box (migration 24). */
  gallery?: string[] | null;
}

type Mode = 'stock' | 'presale';

/** `?edicao=pre` opens the pre-sale (for ads and posts), `?edicao=pronta` the ready box. */
const modeFromUrl = (): Mode | null => {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('edicao');
  return v === 'pre' ? 'presale' : v === 'pronta' ? 'stock' : null;
};

export default function CaixasPage() {
  // Up to two boxes are live (migration 35): the ready one ("pronta entrega", already baked, sold until
  // it runs out) and next week's pre-sale (made to order, closes on its deadline).
  const [stockBox, setStockBox] = useState<TastingBox | null>(null);
  const [presaleBox, setPresaleBox] = useState<TastingBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [pastPhotos, setPastPhotos] = useState<HeroBoxPhoto[]>([]);
  const stockSale = useBoxSale(stockBox);
  const presaleSale = useBoxSale(presaleBox);
  const sizePrices = useBoxSizePrices();
  const [chosen, setChosen] = useState<Mode | null>(null);
  useEffect(() => { setChosen(modeFromUrl()); }, []);

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
        .eq('is_active', true);

      if (!error && data) {
        const { stock, presale } = splitActive(data as TastingBox[]);
        setStockBox(stock);
        setPresaleBox(presale);
      }
      setLoading(false);
    };

    fetchActiveBox();
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando a surpresa da semana...</div>;
  }

  // Wait for the delivery calendar too, so a box with no days left never flashes on screen first.
  if ((stockSale && !stockSale.loaded) || (presaleSale && !presaleSale.loaded)) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando a surpresa da semana...</div>;
  }

  // Which box can be shown. The ready box stays visible when it sells out (the waiting list lives there),
  // unless the pre-sale can take the order instead: then a sold-out box would only be in the way.
  const presaleOk = !!presaleBox && !!presaleSale && !noUpcomingEdition(presaleSale.state, presaleSale.choosable);
  const stockShowable = !!stockBox && !!stockSale && !noUpcomingEdition(stockSale.state, stockSale.choosable);
  const stockOk = stockShowable && !(presaleOk && stockSale!.state === 'soldout');
  const mode: Mode | null =
    chosen === 'presale' && presaleOk ? 'presale'
    : chosen === 'stock' && stockOk ? 'stock'
    : stockOk && stockSale!.state === 'open' ? 'stock'
    : presaleOk ? 'presale'
    : stockOk ? 'stock' : null;
  const activeBox = mode === 'presale' ? presaleBox : mode === 'stock' ? stockBox : null;
  const sale = mode === 'presale' ? presaleSale : stockSale;
  const isPre = mode === 'presale';
  const bothLive = stockOk && presaleOk;
  const pick = (m: Mode) => {
    setChosen(m);
    try { window.history.replaceState(null, '', m === 'presale' ? '?edicao=pre' : '?edicao=pronta'); } catch { /* old browser */ }
  };

  // Nothing to order: no box set up, or the one that is has no delivery day left / is past its ordering window.
  if (!activeBox) {
    return <NoBoxNotice variant="page" photos={[...pastPhotos.map(p => p.src), ...FALLBACK_BOX_PHOTOS.map(p => p.src)]} />;
  }

  // total_quantity 0 means "no fixed batch" — what saleState() and the server's reserve_box_stock both
  // read it as. Treating it as a batch of zero showed "Restam apenas 0 caixas!" and "NaN% Vendido", and
  // left the order form capped at zero, so a box that was on sale could not be bought.
  const limited = activeBox.total_quantity > 0;
  const remainingQuantity = limited ? Math.max(0, activeBox.total_quantity - activeBox.sold_quantity) : 999;
  // Only photos of THIS box: its main photo, the extra photos, then each treat's own photo. Alternate them left/right.
  const seen = new Set<string>();
  const heroPhotos: HeroBoxPhoto[] = [
    ...[activeBox.image_url, ...(Array.isArray(activeBox.gallery) ? activeBox.gallery : [])].map(src => ({ src })),
    ...(activeBox.items || []).filter(i => i.image_url).map(i => ({ src: i.image_url, caption: i.name })),
  ].filter(p => p.src && !seen.has(p.src) && seen.add(p.src));
  const leftPhotos = heroPhotos.filter((_, i) => i % 2 === 0).slice(0, 4);
  const rightPhotos = heroPhotos.filter((_, i) => i % 2 === 1).slice(0, 4);

  const percentageSold = limited ? Math.min(100, (activeBox.sold_quantity / activeBox.total_quantity) * 100) : 0;

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
        
        <HeroBoxCard side="left" photos={leftPhotos} tag={isPre ? 'Próxima fornada' : 'Nesta caixa'} />
        <HeroBoxCard side="right" photos={rightPhotos} delayMs={2750} tag={isPre ? 'Próxima fornada' : 'Nesta caixa'} />
        {limited && sale?.state === 'open' && <BoxesLeftBadge remaining={remainingQuantity} />}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <HeroBoxStrip photos={[leftPhotos[0], rightPhotos[0]].filter(Boolean)} tag={isPre ? 'Próxima fornada' : 'Nesta caixa'} />
          {bothLive && (
            <EditionSwitch mode={mode!} onPick={pick}
              stockLeft={stockBox!.total_quantity > 0 ? Math.max(0, stockBox!.total_quantity - stockBox!.sold_quantity) : null}
              stockWindow={stockSale?.windowLabel || ''} presaleWindow={presaleSale?.windowLabel || ''} />
          )}
          <ScrollReveal>
            <span style={{ display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
              {isPre
                ? <>Pré-venda • {sale?.windowLabel ? `entregas ${sale.windowLabel}` : 'próxima semana'}</>
                : <>{bothLive ? 'Pronta entrega' : 'Edição Limitada'} • {sale?.rolledOver ? `entregas ${sale.windowLabel}` : formatBatchDate(activeBox.batch_date_label)}</>}
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
            <div style={{ maxWidth: '680px', margin: '0 auto 2.5rem' }}>
              <BoxItemList description={activeBox.description} items={activeBox.items} tone="dark" />
            </div>

            {/* Scarcity Counter. The count and the bar only mean something for a limited batch; the
                delivery/ordering chips below them are shown either way. */}
            <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
              {limited && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
                    <span>{isPre ? `Restam ${remainingQuantity} vagas nesta fornada` : `Restam apenas ${remainingQuantity} caixas!`}</span>
                    <span>{percentageSold.toFixed(0)}% {isPre ? 'Encomendado' : 'Vendido'}</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentageSold}%`, height: '100%', background: remainingQuantity <= 5 ? '#ff7675' : '#d4af37', transition: 'width 1s ease-in-out' }} />
                  </div>
                  {remainingQuantity <= 5 && remainingQuantity > 0 && sale?.state === 'open' && (
                    <p style={{ color: '#ff7675', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', animation: 'pulse 2s infinite', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{isPre ? 'Corra! A fornada está quase cheia.' : 'Corra! O lote está quase no fim.'}</p>
                  )}
                </>
              )}

              {/* The two windows: when it arrives, and until when you can order */}
              {sale && (sale.windowLabel || sale.state !== 'open' || (isPre && sale.closesOn)) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                  {sale.windowLabel && (
                    <span style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.6)', color: '#fdfaf3', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 600 }}>
                      🚚 Entregas {sale.windowLabel}
                    </span>
                  )}
                  {isPre && sale.state === 'open' && sale.closesOn && (
                    <span style={{ background: '#d4af37', color: '#3c2a21', borderRadius: '999px', padding: '0.35rem 0.9rem', fontSize: '0.88rem', fontWeight: 800 }}>
                      ⏳ Encomendas até {longDay(sale.closesOn)}
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

      {isPre && <PresaleSteps closesOn={sale?.closesOn ?? null} windowLabel={sale?.windowLabel || ''} />}

      {activeBox.items && activeBox.items.length > 0 && <BoxContents items={activeBox.items} />}

      {/* Checkout Section */}
      <section id="order" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <ScrollReveal>
            <BoxOrder key={activeBox.id} box={activeBox} maxQuantity={remainingQuantity} sale={sale} prices={sizePrices} />
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
        kicker={`${isPre ? 'Pré-venda' : limited && remainingQuantity > 0 ? `Restam ${remainingQuantity}` : 'Caixa da semana'} · a partir de`}
        price={`R$ ${Math.round(Math.min(...TREAT_COUNTS.map(n => sizePrices[n])))}`}
        note={isPre || sale?.rolledOver ? (sale?.windowLabel ? `entregas ${sale.windowLabel}` : undefined) : activeBox.batch_date_label ? formatBatchDate(activeBox.batch_date_label) : undefined}
        label={isPre ? 'Encomendar' : 'Pedir'}
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

/** "Pronta entrega" or "Pré-venda", when both are on sale. Sits at the top of the hero, on the dark photo. */
function EditionSwitch({ mode, onPick, stockLeft, stockWindow, presaleWindow }: {
  mode: Mode; onPick: (m: Mode) => void; stockLeft: number | null; stockWindow: string; presaleWindow: string;
}) {
  const opt = (m: Mode, title: string, sub: string) => {
    const on = mode === m;
    return (
      <button type="button" onClick={() => onPick(m)} aria-pressed={on} style={{
        flex: '1 1 0', minWidth: 0, padding: '0.7rem 0.8rem', borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
        border: on ? '2px solid #d4af37' : '2px solid transparent',
        background: on ? '#fdfaf3' : 'transparent', color: on ? '#3c2a21' : '#fdfaf3',
        transition: 'background 0.2s, color 0.2s',
      }}>
        <span style={{ display: 'block', fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.2 }}>{title}</span>
        <span style={{ display: 'block', fontSize: '0.78rem', marginTop: '0.2rem', opacity: on ? 0.75 : 0.85, lineHeight: 1.3 }}>{sub}</span>
      </button>
    );
  };
  const stockSub = [stockLeft != null ? `restam ${stockLeft}` : 'já saiu do forno', stockWindow].filter(Boolean).join(' · ');
  return (
    <div role="group" aria-label="Qual caixa" style={{
      display: 'flex', gap: '0.35rem', maxWidth: '520px', margin: '0 auto 1.75rem', padding: '0.35rem',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.2)',
    }}>
      {opt('stock', '🧁 Pronta entrega', stockSub)}
      {opt('presale', '🗓️ Pré-venda', presaleWindow ? `próxima fornada · ${presaleWindow}` : 'próxima fornada')}
    </div>
  );
}

/** Why pre-order: three steps, so "pay now, get it next week" reads as fresher, not as waiting. */
function PresaleSteps({ closesOn, windowLabel }: { closesOn: string | null; windowLabel: string }) {
  const steps = [
    { n: '1', title: 'Você encomenda', text: closesOn ? `Até ${longDay(closesOn)}. Pague por Pix e sua caixa está garantida.` : 'Pague por Pix e sua caixa está garantida.' },
    { n: '2', title: 'A Dolly assa a sua', text: 'Só as caixas encomendadas entram no forno. Nada fica parado na vitrine.' },
    { n: '3', title: 'Chega fresquinha', text: windowLabel ? `No dia que você escolher, ${windowLabel}.` : 'No dia que você escolher.' },
  ];
  return (
    <section style={{ padding: 'clamp(2.5rem, 6vw, 4rem) 1rem 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: '#a6832b', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          Como funciona a pré-venda
        </p>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: '#fdf7ee', border: '1px solid #e8e1d7', borderRadius: '18px', padding: '1.25rem 1.3rem', display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: '#d4af37', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</span>
              <div>
                <p style={{ fontWeight: 800, color: '#3c2a21', marginBottom: '0.25rem' }}>{s.title}</p>
                <p style={{ color: '#594a42', fontSize: '0.92rem', lineHeight: 1.55 }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
