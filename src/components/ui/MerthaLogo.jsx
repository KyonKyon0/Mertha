import React from 'react';
import Image from 'next/image';

export default function MerthaLogo({ className = "", size = "md" }) {
  const sizeClasses = {
    sm: { width: 120, height: 120 },
    md: { width: 240, height: 240 },
    lg: { width: 320, height: 320 }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image 
        src="/logo.png" 
        alt="Martha Logo" 
        width={currentSize.width} 
        height={currentSize.height}
        className="object-contain"
        priority
      />
    </div>
  );
}
