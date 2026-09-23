'use client';

import React from 'react';

interface MarqueeProps {
  text: string;
  speed?: number;
}

export default function Marquee({ text, speed = 120 }: MarqueeProps) {
  // We duplicate the text multiple times to ensure it covers the screen for the infinite scroll
  const marqueeContent = Array(10).fill(text).join(' ');

  return (
    <div className="marquee-container">
      <div 
        className="marquee-content" 
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        <span className="marquee-text">{marqueeContent}</span>
        <span className="marquee-text">{marqueeContent}</span>
      </div>
    </div>
  );
}
