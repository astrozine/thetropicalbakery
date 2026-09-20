"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ZoomableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function ZoomableImage({ src, alt, style, className, ...props }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  // When open, render a modal overlay using a portal to document.body, or just a fixed overlay if portal is tricky with SSR
  // To avoid SSR issues with createPortal, we can just render it conditionally in the normal tree with fixed positioning,
  // since a fixed position element covers the viewport regardless of where it is in the tree (unless trapped by transform).
  
  return (
    <>
      <img
        src={src}
        alt={alt}
        style={{ cursor: 'pointer', ...style }}
        className={className}
        onClick={() => setIsOpen(true)}
        {...props}
      />

      {isOpen && (
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
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()} // prevent click on image from closing, though maybe we want it to close?
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
                zIndex: 100000
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
        </div>
      )}
    </>
  );
}
