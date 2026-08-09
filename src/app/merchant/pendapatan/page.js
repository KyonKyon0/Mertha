"use client";

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, TrendingUp, Calendar, Wallet, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function MerchantPendapatan() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    settlementDate: null,
    walletBalance: 0, // In real app, this would be computed from successful settlements
    completedOrdersCount: 0
  });

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
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (merchantData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch all completed orders for this merchant
        const { data: completedOrders } = await supabase
          .from('orders')
          .select('id, total_amount, created_at')
          .eq('merchant_id', merchantData.id)
          .eq('status', 'completed');
          
        let todayRev = 0;
        let totalWallet = 0;
        let count = 0;
        
        if (completedOrders && completedOrders.length > 0) {
          count = completedOrders.length;
          completedOrders.forEach(order => {
            const amount = parseFloat(order.total_amount);
            totalWallet += amount;
            
            const orderDate = new Date(order.created_at);
            if (orderDate >= today) {
              todayRev += amount;
            }
          });
        }
        
        // H+7 Settlement Date from today
        const settlement = new Date(today);
        settlement.setDate(settlement.getDate() + 7);
        
        setStats({
          todayRevenue: todayRev,
          settlementDate: settlement,
          walletBalance: totalWallet,
          completedOrdersCount: count
        });
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-20">
        <Link href="/merchant" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
          <ArrowLeft size={20} className="text-gray-900" />
        </Link>
        <h1 className="text-lg font-black text-gray-900">Pendapatan Saya</h1>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Saldo Kantong (Wallet) */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wallet size={16} /> Saldo Kantong Aktif
              </p>
              <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">SIAP TARIK</span>
            </div>
            <h2 className="text-3xl font-black mb-6">Rp {(stats.walletBalance).toLocaleString('id-ID')}</h2>
            
            <button className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/20">
              Tarik Saldo
            </button>
          </div>
        </section>

        {/* Ringkasan Hari Ini & Settlement */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <TrendingUp size={16} className="text-blue-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">Pendapatan Hari Ini</p>
            <p className="text-lg font-black text-gray-900">Rp {(stats.todayRevenue).toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mb-3">
              <Calendar size={16} className="text-purple-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">Jadwal Pencairan (H+7)</p>
            <p className="text-sm font-bold text-gray-900">
              {stats.settlementDate ? stats.settlementDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Total Transaksi Selesai</p>
              <p className="text-xs text-gray-500">{stats.completedOrdersCount} Pesanan Berhasil</p>
            </div>
          </div>
          <div className="p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Lihat Riwayat Transaksi</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </section>
      </div>
    </div>
  );
}
