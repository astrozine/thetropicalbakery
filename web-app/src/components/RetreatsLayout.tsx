'use client';

import React, { useState, useEffect } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import ZoomableImage from '@/components/ZoomableImage';
import CrmRegistrationModal from '@/components/CrmRegistrationModal';
import { supabase } from '@/lib/supabase';

export interface RetreatsLayoutProps {
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

export default function RetreatsLayout({ texts }: RetreatsLayoutProps) {
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
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#1a1a1a'
      }}>
        {/* Background — drone shot */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/assets/retreats_beach_bg_1789884804918.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.45)',
          transform: 'scale(1.05)',
        }} />

        {/* Floating scattered images */}
        {/* Original Treat Images Restored */}
        <ZoomableImage
          src="/menu-items/1000215018.jpg"
          alt="Tropical Treats"
          style={{ position: 'absolute', top: '15%', right: '12%', width: 'clamp(90px, 16vw, 220px)', borderRadius: '12px', transform: 'rotate(12deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 2 }}
        />
        <ZoomableImage
          src="/menu-items/Screenshot_20260513_114809_Edits.jpg"
          alt="Tropical Treats"
          style={{ position: 'absolute', bottom: '20%', left: '15%', width: 'clamp(90px, 15vw, 210px)', borderRadius: '12px', transform: 'rotate(-10deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 2 }}
        />

        {/* Large Side Images - Brought more inward and made bigger */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: 'clamp(250px, 40vw, 550px)', zIndex: 1, opacity: 0.9, transform: 'rotate(-4deg)' }}>
          <img
            src="/assets/tropical_event_retreat.jpg"
            alt="Event Retreat Treats"
            style={{ width: '100%', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', objectFit: 'cover' }}
          />
        </div>
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 'clamp(250px, 40vw, 550px)', zIndex: 1, opacity: 0.9, transform: 'rotate(4deg)' }}>
          <img
            src="/assets/tropical_event_evening.jpg"
            alt="Evening Retreat Event"
            style={{ width: '100%', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', objectFit: 'cover' }}
          />
        </div>

        {/* Center Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 2rem', maxWidth: '800px' }}>
          <img
            src="/itamambuca-ribbon.png"
            alt="Itamambuca"
            style={{ width: 'clamp(140px, 20vw, 220px)', marginBottom: '1rem', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))' }}
          />
          <span style={{
            display: 'inline-block',
            color: '#d4af37',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(212,175,55,0.4)',
            paddingBottom: '0.5rem'
          }}>
            {texts.hero.location}
          </span>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            color: '#fff',
            fontFamily: 'var(--font-heading)',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            textShadow: '0 4px 30px rgba(0,0,0,0.5)'
          }}>
            {texts.hero.title}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: '1.9',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            fontWeight: 300
          }}>
            {texts.hero.description}
          </p>
          <button 
            onClick={() => { setSelectedInterest(typeof texts.hero.title === 'string' ? texts.hero.title : 'Retiro Tropical'); setIsModalOpen(true); }}
            className="btn btn-secondary" 
            style={{ padding: '1rem 3rem', fontSize: '1.1rem', letterSpacing: '2px' }}
          >
            {texts.hero.cta}
          </button>
        </div>
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
            backgroundImage: 'url("/assets/retreats_waterfall_bg_1789884815000.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          {/* Text side */}
          <div style={{ flex: '1 1 50%', minWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(3rem, 6vw, 6rem)' }}>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
      <section style={{ background: 'var(--color-background)', padding: 'clamp(4rem, 8vw, 8rem) 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Penthouse */}
            <ScrollReveal>
              <div style={{
                background: '#fff',
                overflow: 'hidden',
                border: '1px solid rgba(212,175,55,0.3)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}>
                <div style={{ position: 'relative' }}>
                  <ZoomableImage src={roomImages.penthouse} alt="Penthouse" style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#d4af37', color: '#fff', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {texts.suites.penthouse.capacity}
                  </div>
                </div>
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    {texts.suites.penthouse.title}
                  </h3>
                  <p style={{ color: '#594a42', lineHeight: '1.7', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {texts.suites.penthouse.description}
                  </p>
                  <a href="https://www.airbnb.com/rooms/1257394362209121684?viralityEntryPoint=1&s=76" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                    {texts.suites.penthouse.cta}
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Big Suite */}
            <ScrollReveal>
              <div style={{
                background: '#fff',
                overflow: 'hidden',
                border: '1px solid rgba(212,175,55,0.3)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}>
                <div style={{ position: 'relative' }}>
                  <ZoomableImage src={roomImages.big_suite} alt="Big Suite" style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#d4af37', color: '#fff', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {texts.suites.bigSuite.capacity}
                  </div>
                </div>
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    {texts.suites.bigSuite.title}
                  </h3>
                  <p style={{ color: '#594a42', lineHeight: '1.7', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {texts.suites.bigSuite.description}
                  </p>
                  <a href="https://www.airbnb.com/rooms/589851889015316995?guests=1&adults=1&s=67&unique_share_id=c014bdfc-a020-454b-8ad3-b7ad34d1d84f" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                    {texts.suites.bigSuite.cta}
                  </a>
                </div>
              </div>
            </ScrollReveal>

            {/* Small Suite */}
            <ScrollReveal>
              <div style={{
                background: '#fff',
                overflow: 'hidden',
                border: '1px solid rgba(212,175,55,0.3)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}>
                <div style={{ position: 'relative' }}>
                  <ZoomableImage src={roomImages.small_suite} alt="Standard Suite" style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#d4af37', color: '#fff', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {texts.suites.smallSuite.capacity}
                  </div>
                </div>
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    {texts.suites.smallSuite.title}
                  </h3>
                  <p style={{ color: '#594a42', lineHeight: '1.7', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {texts.suites.smallSuite.description}
                  </p>
                  <a href="https://www.airbnb.com/rooms/873138853997998343?guests=1&adults=1&s=67&unique_share_id=932bf745-0053-450d-8afd-7a6008f1f21e" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                    {texts.suites.smallSuite.cta}
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
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
        padding: 'clamp(4rem, 8vw, 8rem) 2rem',
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
    </main>
  );
}
