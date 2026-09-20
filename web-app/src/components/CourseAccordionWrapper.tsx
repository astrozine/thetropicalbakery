'use client';

import React, { useState, useEffect } from 'react';

interface CourseAccordionWrapperProps {
  title: string;
  tag: string;
  children: React.ReactNode;
}

export default function CourseAccordionWrapper({
  title,
  tag,
  children
}: CourseAccordionWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div style={{ 
      marginBottom: '1rem', 
      background: 'rgba(255,255,255,0.95)', 
      borderRadius: '24px', 
      overflow: 'hidden', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
      border: '1px solid rgba(212,175,55,0.3)',
      width: '100%'
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem', 
          background: 'none', 
          border: 'none', 
          textAlign: 'left', 
          cursor: 'pointer' 
        }}
      >
        <span style={{ fontSize: '0.9rem', color: '#d4af37', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>{tag}</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#3c2a21', margin: 0, paddingRight: '1rem', lineHeight: 1.2 }}>{title}</h3>
          <span style={{ fontSize: '2rem', color: '#d4af37', fontWeight: 300, lineHeight: 1 }}>{isOpen ? '−' : '+'}</span>
        </div>
      </button>
      
      {isOpen && (
        <div className="mobile-accordion-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '0.5rem', paddingTop: '1.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}
