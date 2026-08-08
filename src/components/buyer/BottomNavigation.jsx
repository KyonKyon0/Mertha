"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Compass, ReceiptText, User } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: House, label: 'Beranda' },
    { href: '/jelajahi', icon: Compass, label: 'Jelajahi' },
    { href: '/pesanan', icon: ReceiptText, label: 'Pesanan' },
    { href: '/profil', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] border border-outline-variant/30 bg-surface/90 backdrop-blur-xl shadow-lg rounded-full flex justify-around items-center min-h-[68px] px-2 py-2">
      {navItems.map((item) => {
        let isActive = false;
        if (item.href === '/') {
          isActive = pathname === '/';
        } else if (item.href === '/jelajahi') {
          isActive = pathname === '/jelajahi' || pathname === '/jelajahi/peta';
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
            className="relative flex flex-col items-center justify-center w-full h-full min-h-[52px] group"
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-primary/10 rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30
                }}
              />
            )}
            <motion.div 
              className="relative flex flex-col items-center gap-1 z-10"
              whileTap={{ scale: 0.9 }}
              animate={isActive ? { y: -2 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={clsx(
                  "transition-colors duration-300",
                  isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                )}
              />
              <span className={clsx(
                "text-[10px] font-bold transition-colors duration-300",
                isActive ? "text-primary" : "text-on-surface-variant opacity-70 group-hover:text-primary"
              )}>
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
