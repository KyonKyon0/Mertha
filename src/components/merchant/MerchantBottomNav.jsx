"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Package, ClipboardList, User } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function MerchantBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/merchant', icon: House, label: 'Beranda' },
    { href: '/merchant/kelola', icon: Package, label: 'Kelola' },
    { href: '/merchant/penyaluran', icon: ClipboardList, label: 'Penyaluran' },
    { href: '/merchant/profil', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] border border-amber-200/50 bg-[#FFFCF5]/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(251,191,36,0.15)] rounded-full flex justify-around items-center min-h-[68px] px-2 py-2">
      {navItems.map((item) => {
        let isActive = false;
        if (item.href === '/merchant') {
          isActive = pathname === '/merchant';
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
                layoutId="merchant-bottom-nav-indicator"
                className="absolute inset-0 bg-amber-100/50 rounded-full"
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
                  isActive ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500"
                )}
              />
              <span className={clsx(
                "text-[10px] font-bold transition-colors duration-300",
                isActive ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500"
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
