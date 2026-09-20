'use client';

import React from 'react';
import { motion } from 'framer-motion';
import menuItems from '@/data/menu.json';

interface ScatteredImagesProps {
  sectionId: string;
}

export default function ScatteredImages({ sectionId }: ScatteredImagesProps) {
  // Use specific images for different sections to add variety
  const images = sectionId === 'about' 
    ? [menuItems[0]?.image, menuItems[5]?.image, menuItems[10]?.image]
    : [menuItems[15]?.image, menuItems[20]?.image, menuItems[25]?.image];

  if (!images[0]) return null;

  return (
    <>
      <motion.img
        src={images[0]}
        alt="Tropical Treat"
        style={{
          position: 'absolute',
          top: sectionId === 'about' ? '10%' : '5%',
          left: '-2%',
          width: 'clamp(80px, 12vw, 150px)',
          borderRadius: '12px',
          objectFit: 'cover',
          zIndex: 0,
          boxShadow: '0 10px 25px rgba(60,42,33,0.1)',
          transform: 'rotate(-15deg)',
          opacity: 0.8
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 0.8, y: 0, rotate: -15 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      />
      <motion.img
        src={images[1]}
        alt="Tropical Treat"
        style={{
          position: 'absolute',
          top: sectionId === 'about' ? '40%' : '60%',
          right: '-2%',
          width: 'clamp(100px, 15vw, 180px)',
          borderRadius: '12px',
          objectFit: 'cover',
          zIndex: 0,
          boxShadow: '0 10px 25px rgba(60,42,33,0.1)',
          transform: 'rotate(20deg)',
          opacity: 0.7
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 0.7, y: 0, rotate: 20 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.img
        src={images[2]}
        alt="Tropical Treat"
        style={{
          position: 'absolute',
          bottom: sectionId === 'about' ? '10%' : '15%',
          left: '5%',
          width: 'clamp(90px, 13vw, 160px)',
          borderRadius: '12px',
          objectFit: 'cover',
          zIndex: 0,
          boxShadow: '0 10px 25px rgba(60,42,33,0.1)',
          transform: 'rotate(-10deg)',
          opacity: 0.6
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 0.6, y: 0, rotate: -10 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
    </>
  );
}
