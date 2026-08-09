"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Clock, CheckCircle, XCircle, Search, FileText } from 'lucide-react';
import clsx from 'clsx';

export default function PenyaluranRecovery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, history

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
        // Fetch orders for this merchant
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            profiles:user_id(name, phone),
            order_items(quantity, products(name))
          `)
          .eq('merchant_id', merchantData.id)
          .order('created_at', { ascending: false });
          
        if (ordersData) {
          setOrders(ordersData);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const updateOrderStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') {
      return ['pending', 'paid', 'preparing'].includes(o.status);
    } else {
      return ['ready', 'completed', 'cancelled', 'refunded'].includes(o.status);
    }
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-xl font-black text-gray-900 mb-1">Penyaluran & Recovery</h1>
        <p className="text-sm text-gray-500">Kelola pesanan dan pengambilan makanan</p>
      </div>

      <div className="px-6 mt-4">
        {/* Search */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Cari ID Pesanan atau Nama..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-amber-500 text-sm"
          />
          <Search size={18} className="text-gray-400 absolute left-4 top-3.5" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('pending')}
            className={clsx("flex-1 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white text-gray-500 border border-gray-200')}
          >
            Perlu Proses
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={clsx("flex-1 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'history' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200')}
          >
            Riwayat
          </button>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {loading ? (
             <div className="flex justify-center p-8"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">Tidak ada pesanan.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                  <div>
                    <p className="text-xs font-bold text-amber-500 mb-1 uppercase tracking-wider">ORDER #{order.id.split('-')[0]}</p>
                    <p className="text-sm font-bold text-gray-900">{order.profiles?.name || 'Pelanggan'}</p>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide",
                    ['pending', 'paid'].includes(order.status) && "bg-blue-50 text-blue-600",
                    order.status === 'preparing' && "bg-amber-50 text-amber-600",
                    order.status === 'ready' && "bg-green-50 text-green-600",
                    order.status === 'completed' && "bg-gray-100 text-gray-500",
                    ['cancelled', 'refunded'].includes(order.status) && "bg-red-50 text-red-600",
                  )}>
                    {order.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  {order.order_items?.map((item, idx) => (
                    <p key={idx} className="text-sm text-gray-600 font-medium">{item.quantity}x {item.products?.name}</p>
                  ))}
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Clock size={12}/> Waktu Pesan: {new Date(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>

                {/* Actions */}
                {activeTab === 'pending' && (
                  <div className="flex gap-2">
                    {order.status === 'paid' && (
                       <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors">Terima & Siapkan</button>
                    )}
                    {order.status === 'preparing' && (
                       <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"><CheckCircle size={18}/> Siap Diambil</button>
                    )}
                    {['pending', 'paid'].includes(order.status) && (
                       <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"><XCircle size={18}/></button>
                    )}
                  </div>
                )}
                
                {activeTab === 'history' && order.status === 'ready' && (
                  <button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">Selesaikan Pesanan</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
