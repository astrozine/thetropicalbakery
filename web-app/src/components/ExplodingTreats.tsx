'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import BoxesLeftBadge from '@/components/BoxesLeftBadge';
import HeroLiveBoxes, { type HeroBox } from '@/components/HeroLiveBoxes';

/** Desktop-collage photos that are not in `treats` (keyed like treat ids, for the lightbox). */
const EXTRA_PHOTOS: Record<string, string> = { left: '/box3.jpg', right: '/box1.jpg', seal: '/treats/media_1789712777199.jpg' };

/** `liveBoxes`: every box that can be ordered now, listed in the hero card ("À venda agora"). */
export default function ExplodingTreats({ boxesLeft = null, liveBoxes = [] }: { boxesLeft?: number | null; liveBoxes?: HeroBox[] }) {
  const cta = liveBoxes.length > 1 ? 'Ver as caixas' : 'Garanta a Sua Caixa';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const initialScrollY = window.scrollY;
    
    const handleScroll = () => {
      if (Math.abs(window.scrollY - initialScrollY) > 150) {
        setSelectedId(null);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedId]);

  const treats = [
    { id: '1', src: '/treats/media_1789712796150.jpg', mobile: { x: -80, y: -160, scale: 0.55 }, desktop: { x: -380, y: -160, scale: 1.0 }, rotate: -15 },
    { id: '2', src: '/treats/media_1789712814475.jpg', mobile: { x: 80, y: -130, scale: 0.6 }, desktop: { x: 380, y: -140, scale: 1.0 }, rotate: 20 },
    { id: '3', src: '/treats/media_1789712835955.jpg', mobile: { x: -80, y: 100, scale: 0.5 }, desktop: { x: -400, y: 140, scale: 1.0 }, rotate: -25 },
    { id: '4', src: '/treats/media_1789712972031.jpg', mobile: { x: 80, y: 110, scale: 0.55 }, desktop: { x: 400, y: 160, scale: 1.0 }, rotate: 10 },
  ];

  // Only what is true of every treat: some carry an industrial vegan chocolate with crystal sugar.
  const tags = ['100% Vegetal', 'Sem Sal', 'Sem Trigo', 'Feito à Mão'];

  if (isMobile) {
    // Mobile: Native App Home Screen Experience
    return (
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0', paddingBottom: '1rem' }}>
        
        {/* Center Content — Logo */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '1rem', textAlign: 'center' }}>
          <motion.img
            src="/hero-logo-transparent.png"
            alt="The Tropical Bakery Logo"
            style={{ height: '170px', width: 'auto', maxWidth: '90vw', filter: 'drop-shadow(0 0 25px rgba(253,250,243,1))' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          />
        </div>

        {/* Swipeable Horizontal Carousel for Treats */}
        <div style={{ 
          width: '100%', 
          overflowX: 'auto', 
          display: 'flex', 
          gap: '1rem', 
          padding: '1rem 5%', 
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', // Hide scrollbar for Firefox
          msOverflowStyle: 'none' // Hide scrollbar for IE/Edge
        }}
        className="hide-scrollbars"
        >
          {treats.map((treat, index) => (
            <motion.img
              key={treat.id}
              layoutId={`treat-${treat.id}`}
              onClick={() => setSelectedId(treat.id)}
              src={treat.src}
              alt={`Treat ${index + 1}`}
              style={{ 
                flex: '0 0 70%', 
                scrollSnapAlign: 'center',
                borderRadius: '20px', 
                objectFit: 'cover', 
                cursor: 'pointer', 
                boxShadow: '0 10px 25px rgba(60,42,33,0.2)',
                aspectRatio: '4/5'
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 50, damping: 15, delay: index * 0.1 }}
            />
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#5a3d10' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Deslize para ver mais</span>
          <span style={{ fontSize: '1.2rem' }}>→</span>
        </div>

        {/* Fixed Pinned CTA Action Area */}
        <div style={{ width: '90%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div style={{ background: 'rgba(253,250,243,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(212,175,55,0.4)', padding: '1.1rem 1.25rem', borderRadius: '18px', textAlign: 'center' }}>
            <span style={{ display: 'block', color: '#a6832b', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              🌴 Itamambuca · Ubatuba
            </span>
            <p style={{ color: '#3c2a21', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.65rem', fontFamily: 'var(--font-heading)' }}>
              Veganos Chegando em Itamambuca
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center' }}>
              {tags.map(tag => (
                <span key={tag} style={{ background: 'rgba(212,175,55,0.15)', color: '#3c2a21', fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <HeroLiveBoxes boxes={liveBoxes} />
          <Link href="/caixas" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', pointerEvents: 'auto', width: '100%', textAlign: 'center', borderRadius: '999px', boxShadow: '0 10px 20px rgba(212,175,55,0.3)' }}>
            {cta}
          </Link>
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center"
              style={{ backdropFilter: 'blur(20px)', background: 'rgba(60, 42, 33, 0.4)', zIndex: 99999 }}
            >
              <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedId(null)} />
              <button onClick={() => setSelectedId(null)} className="absolute top-8 right-8 text-white text-4xl" style={{ background: 'none', border: 'none', cursor: 'pointer', zIndex: 100000 }}>✕</button>
              <motion.img
                src={treats.find(t => t.id === selectedId)?.src}
                alt="Treat Detail"
                className="rounded-lg relative z-10"
                style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /**
   * Desktop: one composed collage on each side, mirrored — a big photo of the box, a treat print tucked
   * behind its top corner and another overlapping its bottom corner, all in white photo-print frames
   * that drift slowly. Placed in their own columns so they never run into the card in the middle.
   */
  const collage = (side: 'left' | 'right') => {
    const s = side === 'left' ? 1 : -1; // mirror rotations
    const outer = side === 'left' ? 'left' : 'right';
    const inner = side === 'left' ? 'right' : 'left';
    // Right side: the kraft lid with the gold seal, not treats[3] (that is the same box as box1.jpg).
    const [back, front] = side === 'left' ? [treats[0], treats[2]] : [treats[1], { id: 'seal', src: EXTRA_PHOTOS.seal }];
    const prints: { id: string; src: string; pos: React.CSSProperties; rotate: number; z: number; aspect: string; float: number }[] = [
      { id: back.id, src: back.src, pos: { top: '0%', [inner]: '0%', width: '42%' }, rotate: 9 * s, z: 0, aspect: '1', float: 7 },
      { id: side, src: EXTRA_PHOTOS[side], pos: { top: '9%', [outer]: '4%', width: '70%' }, rotate: -4 * s, z: 1, aspect: '4/5', float: 9 },
      { id: front.id, src: front.src, pos: { bottom: '0%', [inner]: '2%', width: '48%' }, rotate: 7 * s, z: 2, aspect: '1', float: 6 },
    ];
    return (
      <div className="hero-collage" style={{ position: 'relative', width: 'min(100%, 440px)', aspectRatio: '4/5', justifySelf: side === 'left' ? 'end' : 'start' }}>
        {prints.map((p, i) => (
          <motion.div
            key={p.id}
            style={{ position: 'absolute', zIndex: p.z, ...p.pos }}
            initial={{ opacity: 0, x: 120 * s, scale: 0.85, rotate: 0 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: p.rotate }}
            transition={{ type: 'spring', stiffness: 55, damping: 16, delay: 0.15 + i * 0.12 }}
          >
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: p.float, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
              whileHover={{ scale: 1.04, rotate: -p.rotate / 2 }}
              onClick={() => setSelectedId(p.id)}
              style={{
                cursor: 'pointer', background: '#fffdf8', padding: '9px', borderRadius: '20px',
                boxShadow: '0 30px 60px -18px rgba(60,42,33,0.45), 0 10px 22px -10px rgba(60,42,33,0.3), inset 0 0 0 1px rgba(212,175,55,0.25)',
              }}
            >
              <img src={p.src} alt="Caixa de Degustação The Tropical Bakery" style={{ display: 'block', width: '100%', aspectRatio: p.aspect, objectFit: 'cover', borderRadius: '13px' }} />
            </motion.div>
          </motion.div>
        ))}
        {side === 'right' && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.7 }}
            style={{
              position: 'absolute', zIndex: 3, left: '-4%', bottom: '30%', width: 'clamp(76px, 5.5vw, 100px)', aspectRatio: '1', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 25%, #f3dc8a, #d4af37 55%, #a6832b)',
              boxShadow: '0 12px 26px -8px rgba(60,42,33,0.5), inset 0 0 0 3px rgba(253,250,243,0.55)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              color: '#3c2a21', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1, fontSize: 'clamp(0.5rem, 0.42vw, 0.64rem)', letterSpacing: '0.08em',
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🌴</span>
            Feito à mão<br />em Itamambuca
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="hero-grid" style={{ width: '100%', maxWidth: '1560px', margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 3rem)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: 'clamp(1.5rem, 4vw, 4.5rem)' }}>
      <style>{`
        @media (max-width: 1279px) {
          .hero-grid { grid-template-columns: 1fr !important; justify-items: center; }
          .hero-collage { display: none; }
        }
      `}</style>

      {collage('left')}

      {/* Main Content (Logo + CTA) */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <motion.img
          src="/hero-logo-transparent.png"
          alt="The Tropical Bakery Logo"
          style={{ maxWidth: '250px', width: '90%', filter: 'drop-shadow(0 0 30px rgba(253,250,243,0.9))', marginBottom: '1.5rem' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            background: 'rgba(253,250,243,0.72)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: '22px',
            padding: '2rem 2.5rem',
            // Wider when two boxes sit side by side, so their photos are big enough to want.
            maxWidth: liveBoxes.length > 1 ? '600px' : '480px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(60,42,33,0.3)',
            pointerEvents: 'auto',
            position: 'relative',
          }}
        >
          {liveBoxes.length <= 1 && boxesLeft !== null && boxesLeft > 0 && <BoxesLeftBadge remaining={boxesLeft} variant="sticker" />}
          <span style={{ display: 'inline-block', color: '#a6832b', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            🌴 Itamambuca · Ubatuba
          </span>
          <h2 style={{ color: '#3c2a21', fontWeight: 700, fontSize: 'clamp(1.5rem, 3.4vw, 1.9rem)', marginBottom: '1.1rem', lineHeight: 1.35, letterSpacing: '0.01em', fontFamily: 'var(--font-heading)' }}>
            Veganos Chegando em Itamambuca
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {tags.map(tag => (
              <span key={tag} style={{ background: 'rgba(212,175,55,0.15)', color: '#3c2a21', fontSize: '0.8rem', fontWeight: 700, padding: '0.35rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.35)' }}>
                {tag}
              </span>
            ))}
          </div>
          {liveBoxes.length > 0 && <div style={{ marginBottom: '1.25rem' }}><HeroLiveBoxes boxes={liveBoxes} /></div>}
          <Link href="/caixas" className="btn btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', display: 'inline-block' }}>{cta}</Link>
        </motion.div>
      </div>

      {collage('right')}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(60, 42, 33, 0.4)', zIndex: 99999 }}
          >
            <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedId(null)} style={{ backdropFilter: 'blur(25px)' }} />
            <button onClick={() => setSelectedId(null)} className="absolute top-8 right-8 text-white text-4xl" style={{ background: 'none', border: 'none', cursor: 'pointer', mixBlendMode: 'difference', zIndex: 100000 }}>✕</button>
            <motion.img
              src={EXTRA_PHOTOS[selectedId] ?? treats.find(t => t.id === selectedId)?.src}
              alt="Treat Detail"
              className="rounded-lg relative z-10"
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
