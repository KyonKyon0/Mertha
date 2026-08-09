"use client";

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Store, TrendingUp, Package, Clock, Bell, QrCode, ChevronRight, PlusCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MerchantDashboard() {
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOrdersList, setActiveOrdersList] = useState([]);
  const [stats, setStats] = useState({
    activeOrders: 0,
    todayRevenue: 0,
    itemsSold: 0,
    totalListedProducts: 0
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
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (merchantData) {
        setMerchant(merchantData);
        
        // Fetch active orders (pending, paid, preparing, ready)
        const { data: activeOrdersData } = await supabase
          .from('orders')
          .select('*, profiles(id, name, email)')
          .eq('merchant_id', merchantData.id)
          .in('status', ['pending', 'paid', 'preparing', 'ready'])
          .order('created_at', { ascending: true });
          
        const activeOrders = activeOrdersData || [];
        setActiveOrdersList(activeOrders);

        // Calculate today's stats from completed orders today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: completedOrders } = await supabase
          .from('orders')
          .select('id, total_amount')
          .eq('merchant_id', merchantData.id)
          .eq('status', 'completed')
          .gte('created_at', today.toISOString());
          
        let todayRev = 0;
        let todayItems = 0;
        
        if (completedOrders && completedOrders.length > 0) {
          todayRev = completedOrders.reduce((acc, order) => acc + parseFloat(order.total_amount), 0);
          
          const orderIds = completedOrders.map(o => o.id);
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('quantity')
            .in('order_id', orderIds);
            
          if (orderItems) {
            todayItems = orderItems.reduce((acc, item) => acc + item.quantity, 0);
          }
        }
        
        // Fetch total listed products for this merchant
        const { count: listedCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantData.id);
        
        setStats({
          activeOrders: activeOrders.length,
          todayRevenue: todayRev,
          itemsSold: todayItems,
          totalListedProducts: listedCount || 0
        });
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const toggleStoreStatus = async () => {
    if (!merchant) return;
    const newStatus = !merchant.is_active;
    setMerchant({ ...merchant, is_active: newStatus });
    await supabase.from('merchants').update({ is_active: newStatus }).eq('id', merchant.id);
  };
  
  const updateOrderStatus = async (orderId, currentStatus) => {
    let nextStatus = 'preparing';
    if (currentStatus === 'pending' || currentStatus === 'paid') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    
    await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
    
    // Update local state
    setActiveOrdersList(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: nextStatus } : o
    ));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>;
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F9FAFB]">
        <Store size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Toko Tidak Ditemukan</h2>
        <p className="text-gray-500 text-sm mb-6">Anda belum terdaftar sebagai merchant.</p>
        <Link href="/profil" className="px-6 py-3 bg-amber-500 text-white rounded-full font-bold shadow-lg shadow-amber-500/30">Kembali ke Profil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[2rem] shadow-sm relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Halo, Selamat Datang!</p>
            <h1 className="text-2xl font-black text-gray-900">{merchant.name}</h1>
          </div>
        </div>

        {/* Store Status Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${merchant.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <p className="text-sm font-bold text-gray-900">{merchant.is_active ? 'Toko Buka' : 'Toko Tutup'}</p>
              <p className="text-xs text-gray-500">{merchant.is_active ? 'Menerima pesanan' : 'Tidak menerima pesanan'}</p>
            </div>
          </div>
          <button 
            onClick={toggleStoreStatus}
            className={`w-12 h-6 rounded-full relative transition-colors ${merchant.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${merchant.is_active ? 'right-0.5' : 'left-0.5'}`}></div>
          </button>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Address Warning Notification */}
        {(!merchant.address || merchant.address.trim() === '') && (
          <Link href="/merchant/profil" className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm hover:bg-red-100 transition-colors mt-[-10px] mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-700">Alamat belum diset</h3>
              <p className="text-[11px] text-red-600 mt-0.5 font-medium leading-tight">Perbaiki segera untuk mulai menerima pesanan.</p>
            </div>
            <ChevronRight size={16} className="text-red-400" />
          </Link>
        )}

        {/* Ringkasan Hari Ini */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Ringkasan Hari Ini</h2>
            <Link href="/merchant/pendapatan" className="text-xs font-bold text-amber-500 flex items-center">
              Detail Penjualan <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/merchant/pendapatan" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:bg-gray-50 transition-colors cursor-pointer w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-amber-500" />
                </div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Pendapatan (Hari Ini)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">Rp {(stats.todayRevenue).toLocaleString('id-ID')}</p>
              </div>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-default">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Store size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Produk Listing</p>
                  <p className="text-lg font-black text-gray-900">{stats.totalListedProducts} item</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-default">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <Package size={16} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Produk Terjual</p>
                  <p className="text-lg font-black text-gray-900">{stats.itemsSold} porsi</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/merchant/kelola" className="bg-amber-500 text-white p-4 rounded-2xl shadow-md shadow-amber-500/20 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <PlusCircle size={24} />
            <span className="text-sm font-bold">Tambah Produk</span>
          </Link>
          <Link href="/merchant/scan" className="bg-gray-900 text-white p-4 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <QrCode size={24} />
            <span className="text-sm font-bold">Scan Pickup</span>
          </Link>
        </section>

        {/* Pesanan Aktif */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              Pesanan Aktif <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.activeOrders}</span>
            </h2>
            <Link href="/merchant/penyaluran" className="text-xs font-bold text-amber-500">
              Lihat Semua
            </Link>
          </div>
          
          <div className="space-y-3">
            {activeOrdersList.length > 0 ? (
              activeOrdersList.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                        #{order.id.slice(0, 4).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{order.profiles?.name || 'Customer'}</p>
                        <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">{order.profiles?.id ? `ID: ${order.profiles.id.slice(0, 8)}` : ''}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10}/> {new Date(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                      order.status === 'ready' ? 'bg-green-50 text-green-600' :
                      order.status === 'preparing' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end gap-2">
                    <p className="text-xs text-gray-600 font-medium line-clamp-1">
                      Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}
                    </p>
                    {order.status !== 'ready' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, order.status)}
                        className="bg-gray-900 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg whitespace-nowrap active:scale-95"
                      >
                        {order.status === 'preparing' ? 'Siap Diambil' : 'Siapkan'}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase italic">
                        Menunggu Pickup
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                  <Package size={24} />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Belum Ada Pesanan</p>
                <p className="text-xs text-gray-500">Pesanan yang masuk akan muncul di sini.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
