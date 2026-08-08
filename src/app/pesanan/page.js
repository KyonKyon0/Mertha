"use client";

import React, { useState, useEffect } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import GlobalLoading from '@/components/ui/GlobalLoading';
import Link from 'next/link';
import { Clock, ChevronRight, Store, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function PesananPage() {
  const [activeTab, setActiveTab] = useState('aktif');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch orders, merchants, and the first order item with product
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            delivery_method,
            merchants(name),
            order_items(
              products(
                name,
                pickup_time_start,
                pickup_time_end
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedOrders = ordersData.map(o => {
          const product = o.order_items?.[0]?.products;
          
          let statusText = o.status;
          let isExpired = false;
          let type = 'aktif';
          const isDelivery = o.delivery_method === 'delivery';

          if (o.status === 'completed' || o.status === 'cancelled' || o.status === 'refunded') {
            type = 'riwayat';
            if (o.status === 'completed') statusText = 'Selesai';
            if (o.status === 'cancelled') statusText = 'Dibatalkan';
            if (o.status === 'refunded') statusText = 'Dikembalikan';
          } else {
            // Check if expired based on current time vs pickup_time_end
            // For simplicity in demo, if status is 'pending' and > 24 hours old, we mark as expired
            const orderDate = new Date(o.created_at);
            const now = new Date();
            const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
              isExpired = true;
              statusText = isDelivery ? 'Gagal Dikirim' : 'Kedaluwarsa (Tidak Diambil)';
              type = 'riwayat';
            } else {
              statusText = isDelivery ? 'Sedang Diproses' : 'Menunggu Pengambilan';
              type = 'aktif';
            }
          }

          let timeString = 'Hari ini';
          if (product?.pickup_time_start && product?.pickup_time_end) {
            timeString = `Hari ini, ${product.pickup_time_start.slice(0, 5)} - ${product.pickup_time_end.slice(0, 5)}`;
          }
          if (isDelivery) timeString = 'Estimasi tiba 30-45 mnt';

          return {
            id: o.id,
            merchant: o.merchants?.name || 'Unknown Merchant',
            product: product?.name || 'Produk',
            status: statusText,
            price: o.total_amount,
            time: timeString,
            type: type,
            isExpired: isExpired
          };
        });

        setOrders(formattedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [supabase]);

  const filteredOrders = orders.filter(o => o.type === activeTab);

  return (
    <>
      <BuyerHeader />
      
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <GlobalLoading fullScreen={false} />
            </div>
          ) : filteredOrders.length === 0 ? (
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
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    order.type === 'aktif' 
                      ? 'bg-mertha-accent/10 text-mertha-accent' 
                      : order.isExpired 
                        ? 'bg-mertha-error/10 text-mertha-error'
                        : 'bg-mertha-success/10 text-mertha-success'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-bold text-mertha-text mb-1 ${order.isExpired ? 'opacity-50 line-through' : ''}`}>{order.product}</h3>
                    <div className="flex items-center gap-1 text-xs text-mertha-subtext">
                      {order.isExpired ? <AlertCircle size={12} className="text-mertha-error" /> : <Clock size={12} />}
                      {order.isExpired ? 'Waktu pengambilan terlewat' : order.time}
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
