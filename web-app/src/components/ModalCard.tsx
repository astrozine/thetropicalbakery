'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ModalCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

export default function ModalCard({ imageSrc, title, description }: ModalCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const WHATSAPP_NUMBER = "5511932119196";
  const getWhatsAppLink = (boxName: string) => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Gostaria de fazer o pedido da caixa degustação: ${boxName}`)}`;
  };

  return (
    <>
      <div 
        className="menu-card" 
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ position: 'relative', width: '100%', height: '450px', background: '#e8e1d7', overflow: 'hidden' }}>
          <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} className="menu-image" />
        </div>
        <div className="menu-content">
          <h3 className="menu-title" style={{ color: '#3c2a21' }}>{title}</h3>
          <p className="menu-desc" style={{ color: '#7a6a61' }}>{description}</p>
        </div>
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#fdfaf3',
              borderRadius: '24px',
              overflow: 'hidden',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                color: '#3c2a21'
              }}
            >
              ×
            </button>
            <div style={{ position: 'relative', width: '100%', height: '45vh', minHeight: '300px' }}>
              <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2.2rem', color: '#3c2a21', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>{title}</h3>
              <p style={{ color: '#594a42', fontSize: '1.2rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>{description}</p>
              <a 
                href={getWhatsAppLink(title)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  display: 'block',
                  fontSize: '1.2rem',
                  padding: '1.2rem'
                }}
              >
                Fazer Pedido
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
