'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExplodingTreats() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const treats = [
    { id: '1', src: '/treats/media_1789712796150.jpg', mobile: { x: -80, y: -160, scale: 0.55 }, desktop: { x: -500, y: -150, scale: 1.2 }, rotate: -15 },
    { id: '2', src: '/treats/media_1789712814475.jpg', mobile: { x: 80, y: -130, scale: 0.6 }, desktop: { x: 550, y: -120, scale: 1.2 }, rotate: 20 },
    { id: '3', src: '/treats/media_1789712835955.jpg', mobile: { x: -80, y: 100, scale: 0.5 }, desktop: { x: -550, y: 180, scale: 1.2 }, rotate: -25 },
    { id: '4', src: '/treats/media_1789712972031.jpg', mobile: { x: 80, y: 110, scale: 0.55 }, desktop: { x: 480, y: 200, scale: 1.2 }, rotate: 10 },
  ];

  if (isMobile) {
    // Mobile: Native App Home Screen Experience
    return (
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0', paddingBottom: '1rem' }}>
        
        {/* Center Content — Logo */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '1rem', textAlign: 'center' }}>
          <motion.img
            src="/hero-logo-transparent.png"
            alt="The Tropical Bakery Logo"
            style={{ width: '85vw', maxWidth: '500px', filter: 'drop-shadow(0 0 25px rgba(253,250,243,1))' }}
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#d4af37', opacity: 0.8 }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Deslize para ver mais</span>
          <span style={{ fontSize: '1.2rem' }}>→</span>
        </div>

        {/* Fixed Pinned CTA Action Area */}
        <div style={{ width: '90%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div style={{ background: 'rgba(253,250,243,0.7)', padding: '0.75rem', borderRadius: '12px', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
            <p style={{ color: '#3c2a21', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.7rem', margin: 0 }}>
              Surprise Treat Boxes · 100% Vegano
            </p>
          </div>
          <a href="#order" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', pointerEvents: 'auto', width: '100%', textAlign: 'center', borderRadius: '999px', boxShadow: '0 10px 20px rgba(212,175,55,0.3)' }}>
            Garanta a Sua Caixa
          </a>
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backdropFilter: 'blur(20px)', background: 'rgba(60, 42, 33, 0.4)' }}
            >
              <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedId(null)} />
              <button onClick={() => setSelectedId(null)} className="absolute top-8 right-8 text-white z-50 text-4xl" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
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

  // Desktop layout — unchanged spring animation
  return (
    <div className="relative flex items-center justify-center" style={{ width: '100%', padding: '2rem 0' }}>

      {treats.map((treat) => {
        const layout = treat.desktop;
        return (
          <motion.img
            key={treat.id}
            layoutId={`treat-${treat.id}`}
            onClick={() => setSelectedId(treat.id)}
            src={treat.src}
            alt="Treat"
            className="absolute z-0 rounded-lg"
            style={{
              width: '200px',
              objectFit: 'cover',
              cursor: 'pointer',
              boxShadow: '0 15px 35px -5px rgba(60,42,33,0.3), 0 5px 15px -5px rgba(60,42,33,0.2), 0 0 0 1px rgba(255,255,255,0.4)'
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{ opacity: 1, x: layout.x, y: layout.y, scale: layout.scale, rotate: treat.rotate }}
            transition={{ type: 'spring', stiffness: 50, damping: 15, delay: parseInt(treat.id) * 0.1, duration: 1.5 }}
            whileHover={{ scale: layout.scale * 1.05 }}
          />
        );
      })}

      {/* Main Content (Logo + CTA) */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <motion.img
          src="/hero-logo-transparent.png"
          alt="The Tropical Bakery Logo"
          style={{ maxWidth: '750px', width: '90%', filter: 'drop-shadow(0 0 30px rgba(253,250,243,0.9))', marginBottom: '2rem' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <p className="hero-subtitle text-center" style={{ color: '#3c2a21', fontWeight: '400', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem', maxWidth: '600px', marginBottom: '2rem' }}>
          Surprise Treat Boxes • Sem Açúcar, Sal ou Óleo • 100% Vegano • Sem Glúten
        </p>
        <a href="#order" className="btn btn-primary pointer-events-auto" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', pointerEvents: 'auto' }}>Garanta a Sua Caixa</a>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(60, 42, 33, 0.4)' }}
          >
            <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedId(null)} style={{ backdropFilter: 'blur(25px)' }} />
            <button onClick={() => setSelectedId(null)} className="absolute top-8 right-8 text-white z-50 text-4xl" style={{ background: 'none', border: 'none', cursor: 'pointer', mixBlendMode: 'difference' }}>✕</button>
            <motion.img
              layoutId={`treat-${selectedId}`}
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
