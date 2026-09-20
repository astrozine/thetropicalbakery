'use client';

import React from 'react';

interface MarqueeProps {
  text: string;
}

export default function Marquee({ text }: MarqueeProps) {
  // We duplicate the text multiple times to ensure it covers the screen for the infinite scroll
  const marqueeContent = Array(10).fill(text).join(' ');

  return (
    <div className="marquee-container">
      <div className="marquee-content">
        <span className="marquee-text">{marqueeContent}</span>
        <span className="marquee-text">{marqueeContent}</span>
      </div>
    </div>
  );
}
