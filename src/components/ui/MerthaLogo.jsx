import React from 'react';
import { Leaf } from 'lucide-react';

export default function MerthaLogo({ className = "", size = "md" }) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xl",
    md: "w-8 h-8 text-2xl",
    lg: "w-12 h-12 text-4xl"
  };

  return (
    <div className={`flex items-center gap-2 text-mertha-primary font-bold ${className}`}>
      <div className={`flex items-center justify-center bg-mertha-primary text-white rounded-lg ${sizeClasses[size].split(' ').slice(0, 2).join(' ')}`}>
        <Leaf size={size === 'sm' ? 16 : size === 'lg' ? 32 : 20} />
      </div>
      <span className={`tracking-tight ${sizeClasses[size].split(' ')[2]}`}>
        Mertha
      </span>
    </div>
  );
}
