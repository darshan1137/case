'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function TourButton({ onClick, color = '#4f46e5' }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-24 right-6 z-50 transition-all duration-300 ease-in-out group"
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
      aria-label="Start guided tour"
    >
      <div
        className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
        style={{
          backgroundColor: color,
        }}
      >
        <HelpCircle className="w-7 h-7 text-white" />
        
        {/* Pulse animation ring */}
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: color }}
        />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Take a guided tour
          <span
            className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"
          />
        </span>
      </div>
    </button>
  );
}
