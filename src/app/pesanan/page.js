"use client";

import React, { useState } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import Link from 'next/link';
import { Clock, CheckCircle2, ChevronRight, Store } from 'lucide-react';

export default function PesananPage() {
  const [activeTab, setActiveTab] = useState('aktif');

  const orders = [
    { id: "1", merchant: "Toko Roti Makmur", product: "Surprise Bag - Pastry", status: "Menunggu Pengambilan", price: 26000, time: "Hari ini, 19:00-21:00", type: "aktif" },
    { id: "2", merchant: "Warung Bu Nani", product: "Nasi Campur Ayam", status: "Selesai", price: 16000, time: "Kemarin, 20:00", type: "riwayat" },
  ];

  const filteredOrders = orders.filter(o => o.type === activeTab);

  return (
    <>
      <BuyerHeader showLogo={false} title="Pesanan Saya" />
      
      <main className="flex-1 bg-mertha-bg pb-24 min-h-[calc(100vh-64px)]">
        <div className="flex border-b border-mertha-border bg-white sticky top-14 z-30">
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'aktif' ? 'border-mertha-primary text-mertha-primary' : 'border-transparent text-mertha-subtext'}`}
            onClick={() => setActiveTab('aktif')}
          >
            Pesanan Aktif
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'riwayat' ? 'border-mertha-primary text-mertha-primary' : 'border-transparent text-mertha-subtext'}`}
            onClick={() => setActiveTab('riwayat')}
          >
            Riwayat
          </button>
        </div>

        <div className="p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-mertha-subtext">Belum ada pesanan di sini.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <Link href={`/pesanan/${order.id}`} key={order.id} className="block bg-white p-4 rounded-xl border border-mertha-border shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-center mb-3 border-b border-mertha-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-mertha-subtext" />
                    <span className="text-sm font-bold text-mertha-text">{order.merchant}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${order.type === 'aktif' ? 'bg-mertha-accent/10 text-mertha-accent' : 'bg-mertha-success/10 text-mertha-success'}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-mertha-text mb-1">{order.product}</h3>
                    <div className="flex items-center gap-1 text-xs text-mertha-subtext">
                      <Clock size={12} />
                      {order.time}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-mertha-muted" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <BottomNavigation />
    </>
  );
}
