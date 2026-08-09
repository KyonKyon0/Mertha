"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Leaf, TrendingUp, Users, Heart } from 'lucide-react';
import Link from 'next/link';

export default function DashboardDampak() {
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (merchantData) {
        setMerchant(merchantData);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Dummy data for visual representation
  const impactData = {
    foodSaved: 1250, // portions
    co2Reduced: 3125, // kg
    waterSaved: 25000, // liters
    customersHelped: 480
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <div className="bg-gradient-to-br from-green-500 to-emerald-700 px-6 pt-12 pb-16 rounded-b-[2rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10">
          <Leaf size={200} className="text-white" />
        </div>
        
        <h1 className="text-xl font-black text-white mb-1 relative z-10">Dashboard Dampak</h1>
        <p className="text-sm text-green-100 relative z-10">Laporan kontribusi nyata Anda untuk bumi.</p>
        
        <div className="mt-8 relative z-10 flex gap-4 items-end">
          <div>
            <p className="text-xs font-bold text-green-200 uppercase tracking-widest mb-1">Total Makanan Diselamatkan</p>
            <p className="text-4xl font-black text-white">{impactData.foodSaved.toLocaleString('id-ID')}</p>
          </div>
          <p className="text-sm font-bold text-green-100 mb-1">Porsi</p>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Emisi CO2 Dicegah</p>
            <p className="text-xl font-black text-gray-900">{impactData.co2Reduced.toLocaleString('id-ID')} <span className="text-sm text-gray-400">kg</span></p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Air Dihemat</p>
            <p className="text-xl font-black text-gray-900">{impactData.waterSaved.toLocaleString('id-ID')} <span className="text-sm text-gray-400">L</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Users size={24} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pelanggan Bahagia</p>
            <p className="text-lg font-black text-gray-900">{impactData.customersHelped.toLocaleString('id-ID')} <span className="text-sm font-medium text-gray-500">orang membeli dari Anda</span></p>
          </div>
        </div>

        {/* Milestone */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 mt-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Heart size={100} />
          </div>
          <h3 className="font-bold text-amber-900 mb-2 relative z-10">Pencapaian Berikutnya</h3>
          <p className="text-sm text-amber-700/80 mb-4 relative z-10">Selamatkan 1.500 porsi untuk mendapatkan badge "Pahlawan Bumi".</p>
          
          <div className="relative z-10">
            <div className="flex justify-between text-xs font-bold text-amber-900 mb-1">
              <span>{impactData.foodSaved}</span>
              <span>1.500</span>
            </div>
            <div className="w-full h-2 bg-amber-200/50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(impactData.foodSaved / 1500) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
