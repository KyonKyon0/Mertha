import React from 'react';
import { Bell, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BuyerHeader({ showLogo = true, title = "", rightAction = null }) {
  return (
    <header className="sticky top-0 w-full bg-surface z-40 px-5 py-4 flex items-center justify-between border-b border-outline-variant/30">
      <div className="flex-1 flex items-center justify-start">
        {showLogo ? (
          <Link href="/">
            <Image 
              src="/images/logo/mertha-logo.png" 
              alt="Mertha" 
              width={100} 
              height={32} 
              className="h-8 w-auto object-contain" 
            />
          </Link>
        ) : (
          <h1 className="text-lg font-bold text-mertha-text">{title}</h1>
        )}
      </div>
      
      <div className="flex items-center justify-end gap-3">
        {rightAction || (
          <>
            <button className="relative p-2 text-mertha-subtext hover:bg-mertha-bg rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mertha-error rounded-full border-2 border-white"></span>
            </button>
            <Link 
              href="/profil"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-mertha-primary/10 text-mertha-primary hover:bg-mertha-primary hover:text-white transition-colors"
            >
              <User size={18} />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
