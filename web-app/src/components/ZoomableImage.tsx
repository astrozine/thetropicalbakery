"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { optimizedSrc, type OptimizedWidth } from '@/lib/thumbs';

interface ZoomableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Width of the resized copy shown in the page; the full photo opens on click. */
  thumbWidth?: OptimizedWidth;
}

export default function ZoomableImage({ src, alt, style, className, thumbWidth = 750, ...props }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const initialScrollY = window.scrollY;
    
    const handleScroll = () => {
      if (Math.abs(window.scrollY - initialScrollY) > 150) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const modalContent = isOpen && mounted ? createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999, // Extremely high z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            background: '#fff',
            color: '#3c2a21',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000000
          }}
        >
          ✕
        </button>
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}
        />
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <img
        src={optimizedSrc(src, thumbWidth)}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ cursor: 'pointer', ...style }}
        className={className}
        onClick={() => setIsOpen(true)}
        {...props}
      />
      {modalContent}
    </>
  );
}
