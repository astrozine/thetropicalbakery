'use client';

import React from 'react';

export default function SquiggleArrows() {
  return (
    <>
      <style>{`
        @keyframes squiggleLoop {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-2px, 2px) rotate(-1deg) scale(1.02); }
          66% { transform: translate(2px, -1px) rotate(1deg) scale(0.98); }
        }
        
        .squiggle-arrow-container {
          position: absolute;
          pointer-events: none;
          z-index: 10;
        }

        .squiggle-arrow {
          animation: squiggleLoop 0.3s steps(3, end) infinite;
          transform-origin: center;
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
        }

        /* Desktop positions */
        @media (min-width: 768px) {
          .arrow-1 { top: -20px; left: -140px; transform: scale(1.5); }
          .arrow-2 { top: 40px; left: -160px; transform: scale(1.5); }
          .arrow-3 { top: 10px; right: -140px; transform: scale(1.5) scaleX(-1); }
          .arrow-4 { bottom: -60px; right: -120px; transform: scale(1.5) scaleX(-1); }
        }
        
        /* Mobile positions - hide some or reposition */
        @media (max-width: 767px) {
          .arrow-1 { top: -60px; left: -30px; transform: rotate(30deg) scale(1.5); }
          .arrow-2 { display: none; }
          .arrow-3 { display: none; }
          .arrow-4 { bottom: -70px; right: -30px; transform: rotate(-30deg) scale(1.5) scaleX(-1); }
        }
      `}</style>

      {/* Top Left Arrow */}
      <div className="squiggle-arrow-container arrow-1">
        <svg width="80" height="60" viewBox="0 0 100 100" className="squiggle-arrow" style={{ transform: 'rotate(20deg)' }}>
          <path d="M10,20 Q40,40 80,80 M55,80 L80,80 L80,55" fill="none" stroke="#e67e22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Middle Left Arrow */}
      <div className="squiggle-arrow-container arrow-2">
        <svg width="90" height="40" viewBox="0 0 100 100" className="squiggle-arrow" style={{ transform: 'rotate(-10deg)' }}>
          <path d="M10,50 Q50,40 90,50 M65,40 L90,50 L65,60" fill="none" stroke="#e67e22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Top Right Arrow */}
      <div className="squiggle-arrow-container arrow-3">
        <svg width="80" height="60" viewBox="0 0 100 100" className="squiggle-arrow" style={{ transform: 'rotate(20deg)' }}>
          <path d="M10,20 Q40,40 80,80 M55,80 L80,80 L80,55" fill="none" stroke="#e67e22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Bottom Right Arrow */}
      <div className="squiggle-arrow-container arrow-4">
        <svg width="90" height="50" viewBox="0 0 100 100" className="squiggle-arrow" style={{ transform: 'rotate(-10deg)' }}>
          <path d="M10,50 Q50,40 90,50 M65,40 L90,50 L65,60" fill="none" stroke="#e67e22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}
