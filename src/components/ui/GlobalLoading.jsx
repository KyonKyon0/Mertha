import React from 'react';
import Image from 'next/image';

export default function GlobalLoading({ fullScreen = true }) {
  return (
    <div className={`flex flex-col items-center justify-center z-[50] ${fullScreen ? 'fixed inset-0 h-screen w-screen bg-surface/80 backdrop-blur-md z-[9999]' : 'w-full py-12 flex-1'}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 w-32 h-32 -m-8 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-0 w-24 h-24 -m-4 rounded-full border-2 border-transparent border-b-primary/80 border-l-primary/30 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
        
        {/* Pulsing Logo */}
        <div className="w-16 h-16 bg-white rounded-full shadow-lg shadow-primary/20 flex items-center justify-center animate-pulse z-10 overflow-hidden relative">
          <Image
            src="/logo.png"
            alt="Loading..."
            width={48}
            height={48}
            className="w-10 h-10 object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Loading text with animated dots */}
      <div className="mt-8 flex items-center gap-1">
        <span className="text-sm font-bold text-on-surface tracking-widest uppercase">Memuat</span>
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
      </div>
    </div>
  );
}
