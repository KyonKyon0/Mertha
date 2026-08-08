"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GlobalLoading from '@/components/ui/GlobalLoading';
import { ArrowLeft, MapPin, Clock, Receipt, HelpCircle, Store, Navigation, CheckCircle2, Package, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import SlideToConfirm from '@/components/ui/SlideToConfirm';

export default function OrderDetail({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [refund, setRefund] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*, merchants(*)')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(*)')
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // Fetch refund and ai review if any
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: refundData } = await supabase
            .from('refunds')
            .select('*')
            .eq('order_id', orderId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (refundData) {
            setRefund(refundData);
            const { data: aiData } = await supabase
              .from('ai_food_reviews')
              .select('*')
              .eq('refund_id', refundData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (aiData) {
              // Try to parse ai_analysis JSON string
              try {
                const parsed = JSON.parse(aiData.ai_analysis);
                setAiReview({ ...aiData, parsedData: parsed });
              } catch (e) {
                setAiReview(aiData);
              }
            }
          }
        }

        setOrder(orderData);
        setItems(itemsData);
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, supabase]);

  const handleBetaComplete = async () => {
    setIsSimulating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state immediately, no artificial delay
      setOrder({ ...order, status: 'completed' });
      setIsSimulating(false);
      
    } catch (err) {
      console.error(err);
      alert("Gagal mensimulasikan penyelesaian pesanan");
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return <GlobalLoading fullScreen={true} />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-mertha-bg flex flex-col items-center justify-center p-4 text-center">
        <p className="text-mertha-subtext mb-4">Pesanan tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-mertha-primary font-bold">Kembali</button>
      </div>
    );
  }

  const isDelivery = order.delivery_method === 'delivery';
  const isActive = order.status === 'pending' || order.status === 'paid' || order.status === 'preparing';

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pb-safe animate-in fade-in duration-300">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 border-b border-outline-variant/30 sticky top-0 z-40">
        <button onClick={() => router.back()} className="text-on-surface hover:bg-surface-variant p-1.5 rounded-full transition-colors active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Detail Pesanan</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-mertha-border text-center shadow-sm relative overflow-hidden">
          {isActive ? (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mertha-primary/40 via-mertha-primary to-mertha-primary/40 shimmer-effect"></div>
          ) : (
            <div className="absolute top-0 left-0 w-full h-1 bg-mertha-success"></div>
          )}

          <h2 className="text-sm font-medium text-mertha-subtext mb-1 mt-2">Status Pesanan</h2>
          <p className="text-xl font-bold text-mertha-text mb-4 capitalize">
            {order.status === 'pending' ? (isDelivery ? 'Sedang Diproses' : 'Menunggu Pengambilan') : order.status}
          </p>
          
          {isActive && !isDelivery && (
            <div className="bg-mertha-primary/5 rounded-xl p-5 border border-mertha-primary/20 inline-block w-full max-w-[260px] animate-in zoom-in duration-300">
              <p className="text-xs text-mertha-primary font-bold mb-2 tracking-widest">KODE PENGAMBILAN</p>
              <p className="text-3xl font-black tracking-[0.2em] text-mertha-text">{order.pickup_code || "N/A"}</p>
            </div>
          )}
          {isActive && !isDelivery && (
            <p className="text-xs text-mertha-subtext mt-4 leading-relaxed max-w-[240px] mx-auto">
              Tunjukkan kode ini kepada kasir saat mengambil pesanan di lokasi.
            </p>
          )}

          {isActive && isDelivery && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 inline-block w-full max-w-[260px]">
              <Package size={32} className="text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-blue-900">Pesanan Akan Diantar</p>
              <p className="text-xs text-blue-700 mt-1">Estimasi tiba: 30-45 menit</p>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="flex flex-col items-center justify-center mt-2 animate-in zoom-in">
              <div className="w-16 h-16 bg-mertha-success/10 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 size={32} className="text-mertha-success" />
              </div>
              <p className="text-sm text-mertha-success font-bold">Pesanan Telah Selesai</p>
            </div>
          )}
        </div>

        {/* Beta Test Bypass Slide (ONLY FOR ACTIVE ORDERS) */}
        {isActive && (
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl animate-in slide-in-from-bottom-2 shadow-sm">
            <h3 className="text-sm font-bold text-yellow-800 mb-1 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              Mode Beta Tester
            </h3>
            <p className="text-xs text-yellow-700 mb-4 leading-relaxed">Geser tombol di bawah untuk mensimulasikan bahwa kasir telah memverifikasi pesanan ini. Status akan berubah menjadi Selesai.</p>
            <SlideToConfirm 
              onConfirm={handleBetaComplete} 
              isLoading={isSimulating} 
              text="Simulasi Pesanan Selesai" 
              successText="Mensimulasikan..." 
            />
          </div>
        )}

        {/* Location & Time */}
        <div className="bg-white p-4 rounded-2xl border border-mertha-border shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            {isDelivery ? <Navigation size={20} className="text-mertha-primary shrink-0 mt-0.5" /> : <Store size={20} className="text-mertha-primary shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-sm text-mertha-text">{isDelivery ? "Lokasi Pengiriman" : order.merchants?.name}</p>
              <p className="text-sm text-mertha-subtext mt-1">{isDelivery ? "Alamat Anda (Simulasi)" : order.merchants?.address}</p>
            </div>
          </div>
          {!isDelivery && (
            <div className="flex items-start gap-3 pt-3 border-t border-mertha-border/50">
              <Clock size={20} className="text-mertha-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-mertha-text">Waktu Pengambilan</p>
                <p className="text-sm text-mertha-subtext mt-1">Hari ini, Sesuai Jam Operasional</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white p-4 rounded-2xl border border-mertha-border shadow-sm">
          <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-mertha-primary" />
            Rincian Pesanan
          </h3>
          
          <div className="space-y-3 mb-3 border-b border-mertha-border/50 pb-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-mertha-text">{item.products?.name || "Produk"}</p>
                  <p className="text-xs text-mertha-subtext bg-mertha-bg inline-block px-1.5 py-0.5 rounded mt-1">{item.quantity}x</p>
                </div>
                <p className="font-medium text-sm text-mertha-text">Rp {(item.price_at_time * item.quantity).toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center text-sm text-mertha-subtext">
              <span>Biaya Layanan</span>
              <span>Rp {order.admin_fee.toLocaleString('id-ID')}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between items-center text-sm text-mertha-subtext">
                <span>Ongkos Kirim</span>
                <span>Rp 12.000</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center font-bold text-mertha-text pt-2 border-t border-mertha-border border-dashed">
            <span>Total Pembayaran</span>
            <span className="text-mertha-primary text-lg">Rp {order.total_amount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Actions & Refund Section */}
        <div className="space-y-4 pt-2">
          {refund ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
              <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center gap-2">
                <ShieldCheck className="text-primary" size={20} />
                <h3 className="font-bold text-primary text-sm">Status Pengembalian Dana</h3>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Status</span>
                  <span className="inline-flex px-2 py-1 rounded-md text-xs font-bold bg-secondary-container/50 text-on-secondary-container capitalize">
                    {refund.status}
                  </span>
                </div>
                
                {aiReview?.parsedData ? (
                  <div className="space-y-3 border-t border-outline-variant/30 pt-3">
                    <div>
                      <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Indikasi AI</span>
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                        ['BURUK', 'SANGAT_BURUK'].includes(aiReview.parsedData.verdict) ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                      }`}>
                        {aiReview.parsedData.verdict?.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Analisis AI Lengkap</span>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {aiReview.parsedData.ai_analysis || "Sedang memproses..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs text-on-surface-variant">AI sedang memproses komplain Anda...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            order.status === "completed" && (
              <Link href={`/refund/${order.id}`} className="w-full bg-surface-container-lowest border border-error/50 text-error font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-error/5 active:scale-95 transition-all shadow-sm">
                <HelpCircle size={18} />
                Ajukan Pengembalian Dana (Refund)
              </Link>
            )
          )}
          
          <button className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-variant active:scale-95 transition-all shadow-sm">
            Hubungi Bantuan
          </button>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .shimmer-effect {
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />
    </div>
  );
}
