'use client';

import React, { useState, useEffect } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import ZoomableImage from '@/components/ZoomableImage';
import CrmRegistrationModal from '@/components/CrmRegistrationModal';
import RetreatPricingCalculator from '@/components/RetreatPricingCalculator';
import MobileBuyBar from '@/components/MobileBuyBar';
import RoomsAccordion from '@/components/RoomsAccordion';
import RetreatTracks from '@/components/RetreatTracks';
import { InspirationSection } from '@/components/InspirationSection';
import { supabase } from '@/lib/supabase';

export interface RetreatsLayoutProps {
  /** English/Spanish visitors get an approximate USD/EUR line under the retreat calculator's total. */
  locale?: 'pt' | 'en' | 'es';
  texts: {
    whatsappMessage: string;
    hero: {
      location: string;
      title: React.ReactNode;
      description: string;
      cta: string;
    };
    experience: {
      subtitle: string;
      title: string;
      description: string;
      bullets: string[];
    };
    foodHero: {
      title: string;
      subtitle: string;
    };
    suites: {
      subtitle: string;
      title: string;
      description: string;
      penthouse: { capacity: string; title: string; description: string; cta: string };
      bigSuite: { capacity: string; title: string; description: string; cta: string };
      smallSuite: { capacity: string; title: string; description: string; cta: string };
    };
    finalCta: {
      subtitle: string;
      title: string;
      description: string;
      cta: string;
    };
  }
}

/** The little "how far is it" cards that hang off the bottom of the photos. */
const NEARBY = {
  pt: {
    beach: { num: '100 m', label: 'da casa até a areia de Itamambuca', extra: 'Aulas de surfe à parte' },
    island: { num: '15–20 min', label: 'de carro da casa · Ilha do Prumirim' },
    waterfall: { num: '15–20 min', label: 'de carro da casa · Cachoeira do Prumirim' },
  },
  en: {
    beach: { num: '100 m', label: 'from the house to the sand at Itamambuca', extra: 'Surf classes as an add-on' },
    island: { num: '15–20 min', label: 'by car from the house · Prumirim Island' },
    waterfall: { num: '15–20 min', label: 'by car from the house · Prumirim Waterfall' },
  },
  es: {
    beach: { num: '100 m', label: 'de la casa a la arena de Itamambuca', extra: 'Clases de surf aparte' },
    island: { num: '15–20 min', label: 'en auto desde la casa · Isla de Prumirim' },
    waterfall: { num: '15–20 min', label: 'en auto desde la casa · Cascada de Prumirim' },
  },
} as const;

export default function RetreatsLayout({ texts, locale = 'pt' }: RetreatsLayoutProps) {
  const nearby = NEARBY[locale];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState('');
  const [roomImages, setRoomImages] = useState<{ [key: string]: string }>({
    penthouse: '/retreats/Room with open ripada door.jpg',
    big_suite: '/retreats/Room with open ripada door other angle.webp',
    small_suite: '/retreats/Room shot with view on window and plants.webp'
  });

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase.from('retreat_rooms').select('id, image_url');
      if (data) {
        const newImages = { ...roomImages };
        data.forEach(room => {
          if (room.image_url) newImages[room.id] = room.image_url;
        });
        setRoomImages(newImages);
      }
    };
    fetchImages();
  }, []);
  
  const WHATSAPP_NUMBER = "5511932119196";
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texts.whatsappMessage)}`;

  return (
    <main style={{ minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════════════════════════
          HERO — Full-screen cinematic with overlapping images
      ══════════════════════════════════════════════════════════════ */}
      <section className="rh">
        {/* Background — drone shot */}
        <div className="rh__bg" />

        {/* The photos. Wide screens: scattered over the whole hero. Phones: their own collage above
            the text, so a photo can never land on top of the words (a phone is tall and narrow, and
            the text fills most of it). */}
        <div className="rh__photos">
          <ZoomableImage className="rh__ph rh__ph--bundt" src="/menu-items/1000215018.jpg" alt="Tropical Treats" />
          <ZoomableImage className="rh__ph rh__ph--cake" src="/menu-items/Screenshot_20260513_114809_Edits.jpg" alt="Tropical Treats" />
          <div className="rh__ph rh__ph--coast">
            <img src="/retreats/real-itamambuca-coast.jpg" alt="Praia de Itamambuca vista do alto" />
            <div className="rh__card">
              <b className="rh__num">{nearby.beach.num}</b>
              <span className="rh__lbl">{nearby.beach.label}</span>
              <span className="rh__extra"><span aria-hidden>✦</span> {nearby.beach.extra}</span>
            </div>
          </div>
          <div className="rh__ph rh__ph--island">
            <img src="/retreats/real-prumirim-island.jpg" alt="Ilha do Prumirim" />
            <div className="rh__card rh__card--right">
              <b className="rh__num">{nearby.island.num}</b>
              <span className="rh__lbl">{nearby.island.label}</span>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="rh__content">
          <img
            className="rh__ribbon"
            src="/itamambuca-ribbon.png"
            alt="Itamambuca"
          />
          <span className="rh__location">
            {texts.hero.location}
          </span>
          <h1 className="rh__title">
            {texts.hero.title}
          </h1>
          <p className="rh__text">
            {texts.hero.description}
          </p>
          <button
            onClick={() => { setSelectedInterest(typeof texts.hero.title === 'string' ? texts.hero.title : 'Retiro Tropical'); setIsModalOpen(true); }}
            className="btn btn-secondary rh__cta"
          >
            {texts.hero.cta}
          </button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .rh { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #1a1a1a; }
          .rh__bg { position: absolute; inset: 0; background-image: url("/retreats/real-itamambuca-aerial.jpg"); background-size: cover; background-position: center; filter: brightness(0.45); transform: scale(1.05); }
          .rh__photos { position: absolute; inset: 0; pointer-events: none; }
          .rh__ph { position: absolute; pointer-events: auto; }
          .rh__ph--bundt { top: 15%; right: 12%; width: clamp(90px, 16vw, 220px); border-radius: 12px; transform: rotate(12deg); box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 4; }
          .rh__ph--cake  { bottom: 20%; left: 15%; width: clamp(90px, 15vw, 210px); border-radius: 12px; transform: rotate(-10deg); box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 2; }
          .rh__ph--coast { top: 15%; left: 8%; width: clamp(250px, 40vw, 550px); z-index: 3; transform: rotate(-4deg); }
          .rh__ph--island { bottom: 21%; right: 8%; width: clamp(250px, 40vw, 550px); z-index: 3; transform: rotate(4deg); }
          .rh__ph--coast img, .rh__ph--island img { display: block; width: 100%; border-radius: 24px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); object-fit: cover; opacity: 0.9; }
          /* The "how far" cards: cream, gold-edged, hanging off the bottom of the photo like a name tag. */
          .rh__card { position: absolute; left: 1.25rem; bottom: -1.3rem; z-index: 3; display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 0.85rem; max-width: min(88%, 340px); padding: 0.7rem 1.05rem 0.7rem 0.95rem; background: rgba(253,250,243,0.97); color: #3c2a21; border: 1px solid rgba(212,175,55,0.6); border-radius: 14px; box-shadow: 0 16px 34px rgba(0,0,0,0.4); }
          .rh__card--right { left: auto; right: 1.25rem; }
          .rh__num { font-family: var(--font-heading); font-size: clamp(1.3rem, 2.1vw, 1.85rem); line-height: 1; color: #b8921f; white-space: nowrap; }
          .rh__lbl { font-size: 0.82rem; line-height: 1.3; color: #594a42; }
          .rh__extra { grid-column: 1 / -1; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed rgba(212,175,55,0.7); font-size: 0.68rem; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #3c2a21; }
          .rh__extra span { color: #d4af37; }
          .rh__content { position: relative; z-index: 10; text-align: center; padding: 0 2rem; max-width: 800px; }
          .rh__ribbon { width: clamp(140px, 20vw, 220px); margin: 0 auto 1rem; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4)); }
          .rh__location { display: inline-block; color: #d4af37; letter-spacing: 4px; text-transform: uppercase; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(212,175,55,0.4); padding-bottom: 0.5rem; }
          .rh__title { font-size: clamp(1.95rem, 7vw, 5.5rem); color: #fff; font-family: var(--font-heading); line-height: 1.1; margin-bottom: 1.5rem; text-shadow: 0 4px 30px rgba(0,0,0,0.5); }
          .rh__text { font-size: clamp(1rem, 2.5vw, 1.3rem); color: rgba(255,255,255,0.85); line-height: 1.9; max-width: 600px; margin: 0 auto 2.5rem; font-weight: 300; }
          .rh__cta { padding: 1rem 3rem; font-size: 1.1rem; letter-spacing: 2px; }

          /* Phones: photos first, in a collage of their own; then the words. Nothing overlaps. */
          @media (max-width: 767px) {
            .rh { display: block; min-height: 0; padding: 1.25rem 0 3rem; }
            /* The two place photos become polaroids: the "how far" note is written in the cream strip under the
               picture, so it never covers the photo. The two treats float over their corners. The polaroids are
               in the flow (their height follows the note), the treats are the only absolute pieces. */
            .rh__photos { position: relative; inset: auto; width: min(92%, 480px); margin: 0 auto 1.25rem; padding-bottom: 0.5rem; }
            .rh__ph--coast, .rh__ph--island { position: relative; top: auto; right: auto; bottom: auto; left: auto; padding: 6px 6px 0; background: #fdfaf3; border: 1px solid rgba(212,175,55,0.55); border-radius: 16px; box-shadow: 0 18px 36px rgba(0,0,0,0.5); }
            .rh__ph--coast  { width: 68%; transform: rotate(-3deg); }
            .rh__ph--island { width: 64%; margin: -0.6rem 0 0 auto; transform: rotate(3deg); z-index: 2; }
            .rh__ph--coast img, .rh__ph--island img { opacity: 1; border-radius: 11px; box-shadow: none; aspect-ratio: 4 / 3; }
            .rh__ph--bundt  { top: -2%; right: -1%; bottom: auto; left: auto; width: 29%; transform: rotate(9deg); z-index: 4; }
            .rh__ph--cake   { bottom: 0; left: 1%; top: auto; right: auto; width: 29%; transform: rotate(-9deg); z-index: 4; }
            .rh__card, .rh__card--right { position: static; left: auto; right: auto; bottom: auto; max-width: none; padding: 0.5rem 0.45rem 0.6rem; column-gap: 0.55rem; background: transparent; border: 0; border-radius: 0; box-shadow: none; grid-template-columns: auto 1fr; }
            .rh__num { font-size: 1.15rem; }
            .rh__lbl { font-size: 0.72rem; line-height: 1.25; }
            .rh__extra { margin-top: 0.35rem; padding-top: 0.35rem; font-size: 0.62rem; letter-spacing: 0.9px; }
            .rh__ph--bundt, .rh__ph--cake { border-radius: 10px; box-shadow: 0 12px 26px rgba(0,0,0,0.5); }
            .rh__content { padding: 0 1.25rem; }
            .rh__ribbon { width: 130px; margin-bottom: 0.75rem; }
            .rh__location { letter-spacing: 3px; font-size: 0.8rem; margin-bottom: 1.1rem; }
            .rh__title { margin-bottom: 1.1rem; }
            .rh__text { line-height: 1.75; margin-bottom: 1.75rem; }
            .rh__cta { padding: 0.95rem 2.25rem; font-size: 1.05rem; letter-spacing: 1.5px; }
          }
        ` }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHAT'S INCLUDED — Alternating full-bleed sections
      ══════════════════════════════════════════════════════════════ */}

      {/* Experience Block */}
      <section style={{ background: 'var(--color-background)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', minHeight: '70vh' }}>
          {/* Image side: an arched portrait with the wide waterfall overlapping it, gold outline behind */}
          <div className="rx">
            <div className="rx__stage">
              <div className="rx__ring" aria-hidden />
              <div className="rx__arch">
                <img src="/retreats/prumirim-woman.jpg" alt="Mulher relaxando na piscina natural da Cachoeira do Prumirim" loading="lazy" />
              </div>
              <div className="rx__wide">
                <img src="/retreats/real-cachoeira.jpg" alt="Cachoeira do Prumirim, Ubatuba" loading="lazy" />
              </div>
              <div className="rx__card">
                <b className="rx__num">{nearby.waterfall.num}</b>
                <span className="rx__lbl">{nearby.waterfall.label}</span>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              .rx { flex: 1 1 50%; min-width: 300px; display: flex; align-items: center; justify-content: center; padding: clamp(1.5rem, 4vw, 4rem); background: linear-gradient(160deg, #f7eedb 0%, #ecdcbc 100%); overflow: hidden; }
              .rx__stage { position: relative; width: min(100%, 640px); aspect-ratio: 1 / 1.1; }
              .rx__arch, .rx__ring { position: absolute; left: 6%; top: 0; width: 58%; aspect-ratio: 3 / 4.1; border-radius: 999px 999px 28px 28px; }
              .rx__ring { left: 0; top: -3%; border: 1.5px solid #d4af37; }
              .rx__arch { overflow: hidden; box-shadow: 0 30px 60px rgba(60,42,33,0.3); z-index: 1; }
              .rx__arch img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 62%; }
              .rx__wide { position: absolute; right: 0; bottom: 4%; width: 62%; aspect-ratio: 4 / 3; border: 8px solid #fdfaf3; border-radius: 22px; overflow: hidden; box-shadow: 0 24px 50px rgba(60,42,33,0.35); transform: rotate(3deg); z-index: 2; }
              .rx__wide img { display: block; width: 100%; height: 100%; object-fit: cover; }
              /* Same "how far" card as the hero, in brown so it sits on the cream panel. */
              .rx__card { position: absolute; left: 2%; bottom: -1%; z-index: 3; display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 0.8rem; max-width: 62%; padding: 0.7rem 1.05rem 0.7rem 0.95rem; background: #3c2a21; color: #fdfaf3; border: 1px solid rgba(212,175,55,0.55); border-radius: 14px; box-shadow: 0 16px 34px rgba(60,42,33,0.4); }
              .rx__num { font-family: var(--font-heading); font-size: clamp(1.15rem, 2.4vw, 1.7rem); line-height: 1; color: #d4af37; white-space: nowrap; }
              .rx__lbl { font-size: clamp(0.72rem, 1.5vw, 0.8rem); line-height: 1.3; color: rgba(253,250,243,0.85); }
              /* Phones: the card hangs below the photos, across the full width, so it never sits on the picture
                 or squeezes its own words into a narrow column. */
              @media (max-width: 767px) {
                .rx { padding-bottom: 5.25rem; }
                .rx__wide { border-width: 5px; border-radius: 16px; }
                .rx__card { left: 0; right: 0; bottom: -3.75rem; max-width: none; padding: 0.65rem 0.9rem; column-gap: 0.75rem; }
                .rx__num { font-size: 1.45rem; }
                .rx__lbl { font-size: 0.78rem; }
              }
            ` }} />
          </div>
          {/* Text side */}
          <div style={{ flex: '1 1 50%', minWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(2rem, 6vw, 6rem)' }}>
            <ScrollReveal>
              <div style={{ maxWidth: '500px' }}>
                <span style={{ color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'block' }}>
                  {texts.experience.subtitle}
                </span>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', lineHeight: '1.15', marginBottom: '1.5rem' }}>
                  {texts.experience.title}
                </h2>
                <p style={{ fontSize: '1.1rem', lineHeight: '2', color: '#594a42', marginBottom: '2rem' }}>
                  {texts.experience.description}
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {texts.experience.bullets.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem', fontSize: '1.05rem', lineHeight: '1.7', color: '#594a42' }}>
                      <span style={{ color: '#d4af37', fontSize: '1.2rem', flexShrink: 0 }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Food Hero — full-bleed with treats mosaic */}
      <section style={{ position: 'relative', padding: '6rem 2rem', background: '#3c2a21', textAlign: 'center', overflow: 'hidden' }}>
        <div className="tb-rail" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',   // .tb-rail turns this into a swipe on phones
          gap: '1rem',
          maxWidth: '1200px',
          margin: '0 auto 3rem',
        }}>
          <ZoomableImage src="/menu-items/Screenshot_20260415_110305_Gallery.jpg" alt="Criações da Tropical Bakery" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
          <ZoomableImage src="/menu-items/Screenshot_20260401_193246_Edits.jpg"   alt="Criações da Tropical Bakery" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
          <ZoomableImage src="/menu-items/Screenshot_20260518_122444_Gallery.jpg" alt="Criações da Tropical Bakery" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
          <ZoomableImage src="/menu-items/20260209_172647.jpg"                    alt="Criações da Tropical Bakery" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
        </div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontFamily: 'var(--font-heading)', color: '#fdfaf3', marginBottom: '1rem' }}>
          {texts.foodHero.title}
        </h2>
        <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.7)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.8' }}>
          {texts.foodHero.subtitle}
        </p>
      </section>

      {/* Suites Section */}
      <section id="quartos" style={{ background: 'var(--color-background)', padding: 'clamp(2.25rem, 8vw, 8rem) clamp(1rem, 4vw, 2rem)', scrollMarginTop: '4.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span style={{ color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'block' }}>
                {texts.suites.subtitle}
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', lineHeight: '1.15', marginBottom: '1.5rem' }}>
                {texts.suites.title}
              </h2>
              <p style={{ fontSize: '1.15rem', color: '#594a42', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto' }}>
                {texts.suites.description}
              </p>
            </div>
          </ScrollReveal>

          <RoomsAccordion onInquire={(name) => { setSelectedInterest(name); setIsModalOpen(true); }} />
        </div>
      </section>

      <RetreatTracks onInquire={(interest) => { setSelectedInterest(interest); setIsModalOpen(true); }} />

      <InspirationSection />

      {/* Pricing Calculator */}
      <section style={{ padding: 'clamp(2.25rem, 8vw, 6rem) 1.5rem', background: 'linear-gradient(180deg, #2e4432 0%, #3c2a21 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '1rem' }}>
            Reserva Fora do Airbnb
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontFamily: 'var(--font-heading)', color: '#fdfaf3', lineHeight: '1.15' }}>
            O Pacote Completo, Não Só a Estadia
          </h2>
        </div>
        <div id="pacote"><RetreatPricingCalculator whatsappNumber={WHATSAPP_NUMBER} locale={locale} /></div>
      </section>

      {/* Photo Gallery — cinematic grid */}
      <section style={{ padding: '0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 250px)',
          gap: '4px',
        }}>
          <div style={{ gridColumn: '1 / 3', gridRow: '1 / 3', backgroundImage: 'url("/retreats/Palmtrees frog view.webp")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ backgroundImage: 'url("/retreats/Surfer girl.webp")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ backgroundImage: 'url("/retreats/Evening shot Itamabuca beach.webp")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ backgroundImage: 'url("/retreats/Kolibrie.webp")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ backgroundImage: 'url("/retreats/Wave.webp")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: 'clamp(2.25rem, 8vw, 8rem) 2rem',
        background: 'linear-gradient(180deg, #3c2a21 0%, #2e4432 100%)',
        textAlign: 'center'
      }}>
        <ScrollReveal>
          <span style={{ color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '1.5rem' }}>
            {texts.finalCta.subtitle}
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontFamily: 'var(--font-heading)', color: '#fdfaf3', marginBottom: '1.5rem', lineHeight: '1.15' }}>
            {texts.finalCta.title}
          </h2>
          <p style={{ fontSize: '1.15rem', color: 'rgba(253,250,243,0.7)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.9' }}>
            {texts.finalCta.description}
          </p>
          <button 
            onClick={() => { setSelectedInterest('Retiro Geral'); setIsModalOpen(true); }}
            className="btn btn-secondary" 
            style={{ padding: '1.2rem 3.5rem', fontSize: '1.1rem', letterSpacing: '2px' }}
          >
            {texts.finalCta.cta}
          </button>
        </ScrollReveal>
      </section>

      <CrmRegistrationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        interestType="retiro"
        specificInterest={selectedInterest}
      />
      {/* Phones only: the package builder sat fourteen screens down, so the way
          in rides along instead. */}
      <MobileBuyBar
        kicker="Itamambuca"
        price="Monte seu pacote"
        note="estadia + cursos + comida"
        label="Ver preços"
        targetId="#pacote"
      />

    </main>
  );
}
