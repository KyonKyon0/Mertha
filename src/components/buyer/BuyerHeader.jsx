"use client";

import React, { useState, useEffect } from 'react';
import { Bell, User, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function BuyerHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 w-full z-50 transition-all duration-300 ease-in-out ${
        scrolled 
          ? 'bg-surface/80 backdrop-blur-lg shadow-sm py-2 border-b border-outline-variant/30' 
          : 'bg-surface py-3 border-b border-transparent'
      } px-5 flex items-center justify-between`}
    >
      <div className="flex items-center">
        <Link href="/" className="hover:opacity-80 active:scale-95 transition-all duration-200">
          <Image
            src="/logo.png"
            alt="Martha Official Store"
            width={140}
            height={48}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-200 active:scale-95">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface animate-pulse"></span>
        </button>
        <Link
          href="/profil"
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md ${
            pathname === '/profil' 
              ? 'bg-primary text-on-primary' 
              : 'bg-primary/10 text-primary hover:bg-primary hover:text-on-primary'
          }`}
        >
          <User size={16} />
        </Link>
      </div>
    </header>
  );
}
