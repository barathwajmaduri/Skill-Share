import React from 'react';

interface WalkingPersonProps {
  id: number | string;
  color: string;
  speed: number; // Time to cross screen in seconds
  direction: 1 | -1;
  className?: string;
}

export default function WalkingPerson({ id, color, speed, direction, className = "" }: WalkingPersonProps) {
  // Faster crossing speed = faster leg animation
  // If speed is 15s, cycle is ~1.2s. If speed is 3s, cycle is ~0.24s.
  const cycleDuration = Math.max(0.4, (speed / 15)); 
  const uid = `wp-${id}`;

  return (
    <div className={className} style={{ transform: `scaleX(${direction})`, color }}>
      <svg viewBox="0 0 100 200" width="100%" height="100%" className="overflow-visible">
        <style>
          {`
            .leg-left-${uid} {
              transform-origin: 50px 120px;
              animation: walk-leg-${uid} ${cycleDuration}s infinite ease-in-out;
            }
            .leg-right-${uid} {
              transform-origin: 50px 120px;
              animation: walk-leg-${uid} ${cycleDuration}s infinite ease-in-out;
              animation-delay: -${cycleDuration / 2}s;
            }
            .arm-left-${uid} {
              transform-origin: 50px 60px;
              animation: walk-arm-${uid} ${cycleDuration}s infinite ease-in-out;
            }
            .arm-right-${uid} {
              transform-origin: 50px 60px;
              animation: walk-arm-${uid} ${cycleDuration}s infinite ease-in-out;
              animation-delay: -${cycleDuration / 2}s;
            }
            .body-bob-${uid} {
              animation: bob-${uid} ${cycleDuration / 2}s infinite ease-in-out;
            }
            @keyframes walk-leg-${uid} {
              0% { transform: rotate(-30deg); }
              50% { transform: rotate(30deg); }
              100% { transform: rotate(-30deg); }
            }
            @keyframes walk-arm-${uid} {
              0% { transform: rotate(30deg); }
              50% { transform: rotate(-30deg); }
              100% { transform: rotate(30deg); }
            }
            @keyframes bob-${uid} {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
              100% { transform: translateY(0px); }
            }
          `}
        </style>
        <g className={`body-bob-${uid}`}>
          {/* Back Arm (darker) */}
          <line x1="50" y1="60" x2="50" y2="110" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className={`arm-right-${uid}`} opacity="0.6" />
          {/* Back Leg (darker) */}
          <line x1="50" y1="120" x2="50" y2="190" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className={`leg-right-${uid}`} opacity="0.6" />
          
          {/* Head */}
          <circle cx="50" cy="30" r="18" fill="currentColor" />
          {/* Body */}
          <line x1="50" y1="50" x2="50" y2="120" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
          
          {/* Front Leg */}
          <line x1="50" y1="120" x2="50" y2="190" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className={`leg-left-${uid}`} />
          {/* Front Arm */}
          <line x1="50" y1="60" x2="50" y2="110" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className={`arm-left-${uid}`} />
        </g>
      </svg>
    </div>
  );
}
