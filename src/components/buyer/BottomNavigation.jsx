"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Compass, ReceiptText, User, Map } from 'lucide-react';
import clsx from 'clsx';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: House, label: 'Beranda' },
    { href: '/jelajahi', icon: Compass, label: 'Jelajahi' },
    { href: '/jelajahi/peta', icon: Map, label: 'Peta' },
    { href: '/pesanan', icon: ReceiptText, label: 'Pesanan' },
    { href: '/profil', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-outline-variant/30 bg-surface shadow-lg rounded-t-xl flex justify-around items-center min-h-[64px] px-2 pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        let isActive = false;
        if (item.href === '/') {
          isActive = pathname === '/';
        } else if (item.href === '/jelajahi') {
          isActive = pathname === '/jelajahi';
        } else if (item.href === '/jelajahi/peta') {
          isActive = pathname === '/jelajahi/peta';
        } else if (item.href === '/pesanan') {
          isActive = pathname?.startsWith('/pesanan');
        } else {
          isActive = pathname?.startsWith(item.href);
        }
        
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 transition-all duration-200 min-w-[44px] min-h-[44px]",
              isActive ? "text-primary bg-secondary-container/30 rounded-full px-4 py-1 scale-110" : "text-on-surface-variant hover:text-primary"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
