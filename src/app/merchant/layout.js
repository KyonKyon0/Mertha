"use client";

import React from 'react';
import MerchantBottomNav from '@/components/merchant/MerchantBottomNav';

export default function MerchantLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 relative overflow-x-hidden">
      {children}
      <MerchantBottomNav />
    </div>
  );
}
