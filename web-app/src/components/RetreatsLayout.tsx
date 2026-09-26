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

export default function RetreatsLayout({ texts, locale = 'pt' }: RetreatsLayoutProps) {
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
          </div>
          <div className="rh__ph rh__ph--island">
            <img src="/retreats/real-prumirim-island.jpg" alt="Ilha do Prumirim" />
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
          .rh__ph--bundt { top: 15%; right: 12%; width: clamp(90px, 16vw, 220px); border-radius: 12px; transform: rotate(12deg); box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 2; }
          .rh__ph--cake  { bottom: 20%; left: 15%; width: clamp(90px, 15vw, 210px); border-radius: 12px; transform: rotate(-10deg); box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 2; }
          .rh__ph--coast { top: 15%; left: 8%; width: clamp(250px, 40vw, 550px); z-index: 1; opacity: 0.9; transform: rotate(-4deg); }
          .rh__ph--island { bottom: 15%; right: 8%; width: clamp(250px, 40vw, 550px); z-index: 1; opacity: 0.9; transform: rotate(4deg); }
          .rh__ph--coast img, .rh__ph--island img { display: block; width: 100%; border-radius: 24px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); object-fit: cover; }
          .rh__content { position: relative; z-index: 10; text-align: center; padding: 0 2rem; max-width: 800px; }
          .rh__ribbon { width: clamp(140px, 20vw, 220px); margin: 0 auto 1rem; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4)); }
          .rh__location { display: inline-block; color: #d4af37; letter-spacing: 4px; text-transform: uppercase; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(212,175,55,0.4); padding-bottom: 0.5rem; }
          .rh__title { font-size: clamp(1.95rem, 7vw, 5.5rem); color: #fff; font-family: var(--font-heading); line-height: 1.1; margin-bottom: 1.5rem; text-shadow: 0 4px 30px rgba(0,0,0,0.5); }
          .rh__text { font-size: clamp(1rem, 2.5vw, 1.3rem); color: rgba(255,255,255,0.85); line-height: 1.9; max-width: 600px; margin: 0 auto 2.5rem; font-weight: 300; }
          .rh__cta { padding: 1rem 3rem; font-size: 1.1rem; letter-spacing: 2px; }

          /* Phones: photos first, in a collage of their own; then the words. Nothing overlaps. */
          @media (max-width: 767px) {
            .rh { display: block; min-height: 0; padding: 1.25rem 0 3rem; }
            .rh__photos { position: relative; inset: auto; width: min(92%, 480px); aspect-ratio: 1 / 0.84; margin: 0 auto 1rem; }
            .rh__ph--bundt  { top: 0; right: 3%; bottom: auto; left: auto; width: 28%; transform: rotate(9deg); z-index: 3; }
            .rh__ph--cake   { bottom: 0; left: 6%; top: auto; right: auto; width: 28%; transform: rotate(-9deg); z-index: 3; }
            .rh__ph--coast  { top: 3%; left: 4%; width: 60%; opacity: 1; transform: rotate(-4deg); }
            .rh__ph--island { bottom: 4%; right: 2%; top: auto; left: auto; width: 52%; opacity: 1; transform: rotate(4deg); z-index: 2; }
            .rh__ph--coast img, .rh__ph--island img { border-radius: 16px; box-shadow: 0 16px 32px rgba(0,0,0,0.5); }
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
          {/* Image side */}
          <div style={{
            flex: '1 1 50%',
            minWidth: '300px',
            minHeight: '450px',
            backgroundImage: 'url("/retreats/real-cachoeira.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
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
          <ZoomableImage src="/menu-items/Screenshot_20260412_123155_Edits.jpg" alt="Treats" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
          <ZoomableImage src="/menu-items/20260724_154636.jpg" alt="Treats" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
          <ZoomableImage src="/menu-items/Screenshot_20260623_080155_Gallery.jpg" alt="Treats" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
          <ZoomableImage src="/menu-items/Screenshot_20260818_075043_Gallery.jpg" alt="Treats" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }} />
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
