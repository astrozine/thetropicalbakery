'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import StripedBackground from '@/components/StripedBackground';
import BoxOrder from '@/components/BoxOrder';
import ScrollReveal from '@/components/ScrollReveal';
import Marquee from '@/components/Marquee';
import BoxContents from '@/components/BoxContents';
import { TreatCareCard } from '@/components/TreatCare';
import { BoxItem } from '@/lib/allergens';
import { formatBatchDate } from '@/lib/batchDate';
import BoxItemList from '@/components/BoxItemList';
import { BoxWindowFields, boxPriceText, editionIcon, editionLabel, fixedPrice, isPresale, isSpecial, longDay, shortTitle, sortLive } from '@/lib/boxWindow';
import NoBoxNotice from '@/components/NoBoxNotice';
import { boxSale, useSchedule, type BoxSale } from '@/lib/useBoxSale';
import { BoxCards, showable } from '@/components/BoxCards';
import HeroBoxCard, { HeroBoxStrip, type HeroBoxPhoto } from '@/components/HeroBoxCard';
import MobileBuyBar from '@/components/MobileBuyBar';
import BoxesLeftBadge from '@/components/BoxesLeftBadge';
import { useBoxSizePrices } from '@/lib/useBoxSizePrices';
import { TREAT_COUNTS } from '@/lib/boxSizes';
import { optimizedSrc } from '@/lib/thumbs';

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
  /** Sold as it is at this price instead of in sizes (migration 40). */
  fixed_price?: number | string | null;
  created_at?: string | null;
}

/**
 * Which box the link asks for: `?caixa=<id>` (every card and the admin's "Ver no site"), or the older
 * `?edicao=pre` / `?edicao=pronta` (the weekly pre-sale / ready box, still used in ads and posts).
 */
const choiceFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  const v = q.get('edicao');
  return q.get('caixa') || (v === 'pre' ? 'presale' : v === 'pronta' ? 'stock' : null);
};

export default function CaixasPage() {
  // Every live box: the weekly ready box, next week's pre-sale, and any special editions (migrations 35, 40).
  const [boxes, setBoxes] = useState<TastingBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastPhotos, setPastPhotos] = useState<HeroBoxPhoto[]>([]);
  const schedule = useSchedule();
  const sizePrices = useBoxSizePrices();
  const [chosen, setChosen] = useState<string | null>(null);
  /** Where a tap on a box tile scrolls to: the chosen box's name and details. */
  const detailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setChosen(choiceFromUrl()); }, []);

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

      if (!error && data) setBoxes(data as TastingBox[]);
      setLoading(false);
    };

    fetchActiveBox();
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando a surpresa da semana...</div>;
  }

  // Wait for the delivery calendar too, so a box with no days left never flashes on screen first.
  if (boxes.length && !schedule) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando a surpresa da semana...</div>;
  }

  // Which boxes can be shown. A sold-out box stays visible (the waiting list lives there) only while
  // nothing else can take the order: next to a box that can, it would only be in the way.
  const sales = new Map<string, BoxSale>(boxes.map(b => [b.id, boxSale(b, schedule)]));
  const saleOf = (b: TastingBox) => sales.get(b.id)!;
  const candidates = boxes.filter(b => showable(saleOf(b)));
  const anyAvailable = candidates.some(b => saleOf(b).state !== 'soldout');
  const shown = sortLive(candidates.filter(b => !anyAvailable || saleOf(b).state !== 'soldout'), b => saleOf(b).state === 'open');
  const activeBox =
    shown.find(b => b.id === chosen)
    ?? (chosen === 'presale' ? shown.find(b => isPresale(b) && !isSpecial(b)) : chosen === 'stock' ? shown.find(b => !isPresale(b) && !isSpecial(b)) : undefined)
    ?? shown[0] ?? null;
  const sale = activeBox ? saleOf(activeBox) : null;
  const isPre = !!activeBox && isPresale(activeBox);
  const special = !!activeBox && isSpecial(activeBox);
  const own = fixedPrice(activeBox);
  const others = shown.filter(b => b.id !== activeBox?.id);
  const multi = shown.length > 1;
  const heroTag = isPre ? 'Próxima fornada' : special ? 'Edição especial' : 'Nesta caixa';
  const pick = (id: string, scroll = false) => {
    setChosen(id);
    try { window.history.replaceState(null, '', `?caixa=${id}`); } catch { /* old browser */ }
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        <HeroBoxCard key={`l-${activeBox.id}`} side="left" photos={leftPhotos} tag={heroTag} />
        <HeroBoxCard key={`r-${activeBox.id}`} side="right" photos={rightPhotos} delayMs={2750} tag={heroTag} />
        {/* With several boxes the tiles carry each one's photo and count: no extra strip or sticker. */}
        {!multi && limited && sale?.state === 'open' && <BoxesLeftBadge remaining={remainingQuantity} />}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          {!multi && <HeroBoxStrip key={activeBox.id} photos={[leftPhotos[0], rightPhotos[0]].filter(Boolean)} tag={heroTag} />}
          {multi && (
            <BoxPicker boxes={shown} activeId={activeBox.id}
              onPick={id => { pick(id); setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }}
              priceOf={b => boxPriceText(b, sizePrices)}
              subOf={b => {
                const s = saleOf(b);
                const left = b.total_quantity > 0 ? `restam ${Math.max(0, b.total_quantity - b.sold_quantity)}` : '';
                return [s.state === 'soldout' ? 'esgotada' : left, s.windowLabel ? `entregas ${s.windowLabel}` : ''].filter(Boolean).join(' · ');
              }} />
          )}
          <div ref={detailsRef} style={{ scrollMarginTop: '5.5rem' }} />
          <ScrollReveal key={activeBox.id}>
            <span style={{ display: 'inline-block', background: '#d4af37', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
              {isPre
                ? <>Pré-venda • {sale?.windowLabel ? `entregas ${sale.windowLabel}` : 'próxima semana'}</>
                : special
                ? <>🎁 Edição especial{sale?.windowLabel ? ` • entregas ${sale.windowLabel}` : ''}</>
                : <>{shown.length > 1 ? 'Pronta entrega' : 'Edição Limitada'} • {sale?.windowLabel ? `entregas ${sale.windowLabel}` : formatBatchDate(activeBox.batch_date_label)}</>}
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

      {isPre && <PresaleSteps key={activeBox.id} closesOn={sale?.closesOn ?? null} windowLabel={sale?.windowLabel || ''} />}

      {activeBox.items && activeBox.items.length > 0 && <BoxContents key={activeBox.id} items={activeBox.items} />}

      {/* How to keep them: buyers who plan ahead (gifts, later in the week) need to know the freezer keeps them 4 weeks. */}
      <section style={{ padding: '1.5rem 1rem 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}><TreatCareCard /></div>
      </section>

      {/* Checkout Section */}
      <section id="order" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <ScrollReveal key={activeBox.id}>
            <BoxOrder key={activeBox.id} box={activeBox} maxQuantity={remainingQuantity} sale={sale} prices={sizePrices} />
          </ScrollReveal>
        </div>
      </section>

      {/* The other boxes on sale: one or the other, or both in the same checkout. */}
      {others.length > 0 && (
        <section key={activeBox.id} style={{ padding: '0 1rem clamp(3rem, 7vw, 4.5rem)' }}>
          <BoxCards boxes={others} prices={sizePrices} onPick={id => pick(id, true)}
            heading={others.length === 1 ? 'Também à venda esta semana' : 'Também à venda'}
            sub="Peça uma, a outra, ou as duas: vão juntas no mesmo pedido e na mesma entrega." />
        </section>
      )}

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
      <MobileBuyBar key={activeBox.id}
        kicker={`${isPre ? 'Pré-venda' : limited && remainingQuantity > 0 ? `Restam ${remainingQuantity}` : special ? 'Edição especial' : 'Caixa da semana'}${own ? '' : ' · a partir de'}`}
        price={`R$ ${Math.round(own ?? Math.min(...TREAT_COUNTS.map(n => sizePrices[n])))}`}
        note={isPre || sale?.windowLabel ? (sale?.windowLabel ? `entregas ${sale.windowLabel}` : undefined) : activeBox.batch_date_label ? formatBatchDate(activeBox.batch_date_label) : undefined}
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

/**
 * "Escolha a sua caixa": when more than one box is on sale (the box of the week, the pre-sale, special
 * editions), they are shown side by side as equal products — photo, name, price, how many are left —
 * at the top of the hero, before anything about one box in particular. Tapping one shows its details
 * and order form below. Two boxes share the row (also on a phone); three or more scroll sideways.
 *
 * Dolly found plain tiles too easy to miss, so the choice is made loud: "OPÇÃO 1 / OPÇÃO 2" on the photos,
 * a gold "OU" coin between two boxes, a handwritten "Olha esta também!" with a drawn arrow pointing at the
 * box you are NOT looking at, and that box gives a little wiggle every few seconds until something is tapped.
 */
function BoxPicker({ boxes, activeId, onPick, priceOf, subOf }: {
  boxes: TastingBox[]; activeId: string; onPick: (id: string) => void;
  priceOf: (b: TastingBox) => string; subOf: (b: TastingBox) => string;
}) {
  const many = boxes.length > 2;
  const two = boxes.length === 2;
  const [touched, setTouched] = useState(false);
  // The arrow points at the other box (of two): right when the first one is showing, left otherwise.
  const target = boxes[0]?.id === activeId ? 1 : 0;
  const count = boxes.length === 2 ? 'duas' : boxes.length === 3 ? 'três' : String(boxes.length);
  return (
    <div className="bxp" style={{ marginBottom: '2rem' }}>
      <style>{`
        .bxp-k { display: inline-block; background: #d4af37; color: #3c2a21; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; padding: 0.35rem 0.9rem; border-radius: 999px; margin: 0 0 0.6rem; }
        .bxp-h { font-family: var(--font-heading); font-size: clamp(1.6rem, 5vw, 2.4rem); line-height: 1.15; margin: 0 0 0.35rem; color: #fdfaf3; }
        .bxp-s { color: rgba(253,250,243,0.85); font-size: 0.95rem; margin: 0 0 0.5rem; }
        .bxp-stage { position: relative; max-width: ${many ? 'none' : '640px'}; margin: 0 auto; padding-top: ${two ? '4.6rem' : '0.6rem'}; }
        .bxp-row { display: grid; gap: 0.75rem; grid-template-columns: repeat(${many ? boxes.length : 2}, minmax(0, 1fr)); }
        .bxp-row.is-many { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding: 0.5rem 0 0.25rem; }
        .bxp-row.is-many .bxp-t { flex: 0 0 min(46%, 240px); scroll-snap-align: start; }
        .bxp-t { position: relative; display: flex; flex-direction: column; text-align: left; padding: 0; border-radius: 18px; overflow: hidden; cursor: pointer; background: #fdfaf3; color: #3c2a21; border: 3px solid rgba(253,250,243,0.35); box-shadow: 0 14px 30px rgba(0,0,0,0.3); transition: transform 0.2s, border-color 0.2s; font: inherit; }
        .bxp-t:hover { transform: translateY(-3px); }
        .bxp-t.is-on { border-color: #d4af37; box-shadow: 0 0 0 4px rgba(212,175,55,0.35), 0 14px 30px rgba(0,0,0,0.3); }
        .bxp-t.is-nudge { animation: bxp-nudge 3.6s ease-in-out 1.2s infinite; }
        @keyframes bxp-nudge {
          0%, 78%, 100% { transform: none; }
          82% { transform: translateY(-6px) rotate(-2deg); }
          86% { transform: translateY(-6px) rotate(2deg); }
          90% { transform: translateY(-3px) rotate(-1.5deg); }
          94% { transform: none; }
        }
        .bxp-photo { position: relative; display: block; }
        .bxp-t img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #f5efe2; }
        .bxp-opt { position: absolute; top: 8px; left: 8px; background: #3c2a21; color: #fdfaf3; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em; padding: 0.3rem 0.6rem; border-radius: 999px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); }
        .bxp-t.is-on .bxp-opt { background: #d4af37; color: #3c2a21; }
        .bxp-b { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.7rem 0.75rem 0.8rem; flex: 1; }
        .bxp-badge { font-size: 0.75rem; font-weight: 800; color: #a6832b; }
        .bxp-title { font-weight: 800; font-size: 1rem; line-height: 1.2; overflow-wrap: anywhere; }
        .bxp-price { font-weight: 800; color: #3c2a21; font-size: 0.95rem; }
        .bxp-sub { font-size: 0.78rem; color: #594a42; line-height: 1.35; }
        .bxp-cta { margin-top: auto; padding-top: 0.5rem; }
        .bxp-cta span { display: block; text-align: center; border-radius: 999px; padding: 0.55rem 0.4rem; font-size: 0.82rem; font-weight: 800; background: #3c2a21; color: #fdfaf3; }
        .bxp-t.is-on .bxp-cta span { background: #d4af37; color: #fff; }
        /* The gold coin between two boxes, on the line where the photos end. */
        .bxp-or { position: absolute; z-index: 3; left: 50%; top: calc(4.6rem + (min(100vw - 2rem, 640px) - 0.75rem) * 0.375); transform: translate(-50%, -50%);
          width: 54px; height: 54px; border-radius: 50%; background: #d4af37; color: #3c2a21; border: 4px solid #3c2a21; box-shadow: 0 6px 18px rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-weight: 800; font-size: 1rem; pointer-events: none; }
        /* Handwritten note + drawn arrow over the box you are not looking at. */
        .bxp-note { position: absolute; z-index: 2; top: 0; width: 50%; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
        .bxp-note span { font-family: 'Yellowtail', 'Brush Script MT', cursive; color: #e9cf7a; font-size: clamp(1.45rem, 4.6vw, 1.9rem); line-height: 1; white-space: nowrap; transform: rotate(-5deg); text-shadow: 0 2px 10px rgba(0,0,0,0.55); }
        .bxp-note svg { width: 54px; height: 44px; margin-top: 0.15rem; overflow: visible; }
        .bxp-note path { fill: none; stroke: #e9cf7a; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 120; stroke-dashoffset: 120; animation: bxp-draw 0.9s ease-out 0.35s forwards; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
        @keyframes bxp-draw { to { stroke-dashoffset: 0; } }
        @media (min-width: 768px) { .bxp-title { font-size: 1.1rem; } .bxp-b { padding: 0.9rem 1rem 1rem; } .bxp-or { width: 64px; height: 64px; font-size: 1.15rem; } }
        @media (prefers-reduced-motion: reduce) { .bxp-t.is-nudge { animation: none; } .bxp-note path { animation: none; stroke-dashoffset: 0; } }
      `}</style>
      <p className="bxp-k">✨ Esta semana tem {count} caixas</p>
      <h2 className="bxp-h">Escolha a sua (ou leve {boxes.length === 2 ? 'as duas' : 'mais de uma'})</h2>
      <p className="bxp-s">Vão juntas no mesmo pedido e na mesma entrega.</p>
      <div className="bxp-stage">
        {two && (
          <div key={target} className="bxp-note" style={{ left: target ? '50%' : 0 }} aria-hidden>
            <span>Olha esta também!</span>
            <svg viewBox="0 0 54 44">
              {/* A hand-drawn curve ending in an arrowhead, pointing down into the tile. */}
              <path d={target ? 'M8 4 C 30 6, 34 22, 28 38 M19 30 L28 39 L35 28' : 'M46 4 C 24 6, 20 22, 26 38 M19 28 L26 39 L35 30'} />
            </svg>
          </div>
        )}
        <div role="group" aria-label="Qual caixa" className={`bxp-row hide-scrollbars${many ? ' is-many' : ''}`}>
          {boxes.map((b, i) => {
            const on = b.id === activeId;
            return (
              <button key={b.id} type="button" className={`bxp-t${on ? ' is-on' : ''}${!on && !touched ? ' is-nudge' : ''}`}
                onClick={() => { setTouched(true); onPick(b.id); }} aria-pressed={on}>
                <span className="bxp-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {b.image_url ? <img src={optimizedSrc(b.image_url, 640)} alt="" /> : <span style={{ display: 'block', fontSize: '3rem', textAlign: 'center', padding: '1rem' }}>📦</span>}
                  <span className="bxp-opt">OPÇÃO {i + 1}</span>
                </span>
                <span className="bxp-b">
                  <span className="bxp-badge">{editionIcon(b)} {editionLabel(b)}</span>
                  <span className="bxp-title">{shortTitle(b.title)}</span>
                  <span className="bxp-price">{priceOf(b)}</span>
                  <span className="bxp-sub">{subOf(b)}</span>
                  <span className="bxp-cta"><span key={on ? 'on' : 'off'}>{on ? '✓ Você está vendo esta' : '👉 Ver esta caixa'}</span></span>
                </span>
              </button>
            );
          })}
        </div>
        {two && <span className="bxp-or" aria-hidden>OU</span>}
      </div>
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
