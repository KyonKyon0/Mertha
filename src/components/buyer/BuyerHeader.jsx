"use client";

import React, { useState, useEffect } from 'react';
import { User, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ subsets: ['latin'], weight: ['700', '800'] });

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
          <span className={`${poppins.className} text-2xl font-extrabold text-mertha-primary tracking-tight`}>Mertha</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
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
