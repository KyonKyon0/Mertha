"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GlobalLoading from '@/components/ui/GlobalLoading';
import { ArrowLeft, MapPin, Clock, Receipt, HelpCircle, Store, Navigation, CheckCircle2, Package, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import SlideToConfirm from '@/components/ui/SlideToConfirm';
import { XCircle, Info } from 'lucide-react';
import Barcode from 'react-barcode';

// Animated progress bar score
function ScoreBar({ label, value, inverted = false }) {
  const [width, setWidth] = useState(0);
  const pct = Math.round(value * 100);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  // For fraud score: high = bad (red). For quality: high = good (green)
  let barColor = 'bg-mertha-success';
  if (inverted) {
    if (pct > 60) barColor = 'bg-mertha-error';
    else if (pct > 30) barColor = 'bg-mertha-accent';
    else barColor = 'bg-mertha-success';
  } else {
    if (pct < 40) barColor = 'bg-mertha-error';
    else if (pct < 70) barColor = 'bg-mertha-accent';
    else barColor = 'bg-mertha-success';
  }

  let textColor = barColor.replace('bg-', 'text-');

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-mertha-text">{label}</span>
        <span className={`text-sm font-black ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full bg-mertha-bg rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict, isProcessing }) {
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 bg-mertha-primary/10 border border-mertha-primary/30 px-4 py-2 rounded-full">
        <div className="w-4 h-4 border-2 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-black text-mertha-primary tracking-wide">
          MEMPROSES AI...
        </span>
      </div>
    );
  }

  const v = verdict || 'MENUNGGU';
  
  if (v === 'SANGAT_BAIK' || v === 'BAIK') {
    return (
      <div className="flex items-center gap-2 bg-mertha-success/10 border border-mertha-success/30 px-4 py-2 rounded-full">
        <CheckCircle2 size={18} className="text-mertha-success" />
        <span className="text-sm font-black text-mertha-success tracking-wide">
          {v === 'SANGAT_BAIK' ? 'INDIKASI SANGAT BAIK' : 'INDIKASI BAIK'}
        </span>
      </div>
    );
  }
  if (v === 'BURUK' || v === 'SANGAT_BURUK') {
    return (
      <div className="flex items-center gap-2 bg-mertha-error/10 border border-mertha-error/30 px-4 py-2 rounded-full">
        <XCircle size={18} className="text-mertha-error" />
        <span className="text-sm font-black text-mertha-error tracking-wide">
          {v === 'SANGAT_BURUK' ? 'INDIKASI SANGAT BURUK' : 'INDIKASI BURUK'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-mertha-accent/10 border border-mertha-accent/30 px-4 py-2 rounded-full">
      <HelpCircle size={18} className="text-mertha-accent" />
      <span className="text-sm font-black text-mertha-accent tracking-wide">
        {v === 'CUKUP' ? 'INDIKASI CUKUP' : 'MENUNGGU REVIEW'}
      </span>
    </div>
  );
}

export default function OrderDetail({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [refund, setRefund] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
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
            .maybeSingle();

          if (refundData) {
            setRefund(refundData);
            const { data: aiData } = await supabase
              .from('ai_food_reviews')
              .select('*')
              .eq('refund_id', refundData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (aiData) {
              // Try to parse ai_analysis JSON string
              try {
                const parsed = JSON.parse(aiData.ai_analysis);
                setAiReview({ ...aiData, parsedData: parsed });
              } catch (e) {
                setAiReview(aiData);
              }
            } else {
              // NO aiData in DB! Check sessionStorage for pending AI task
              const claimId = refundData.id;
              const storedImages = sessionStorage.getItem(`mertha_ai_images_${claimId}`);
              const storedReason = sessionStorage.getItem(`mertha_ai_reason_${claimId}`);
              
              if (storedImages && storedReason) {
                setIsProcessingAI(true);
                sessionStorage.removeItem(`mertha_ai_images_${claimId}`);
                sessionStorage.removeItem(`mertha_ai_reason_${claimId}`);
                
                // Fire and forget AI fetch
                fetch('/api/ai/food-review', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    refundId: claimId,
                    reason: storedReason,
                    images: JSON.parse(storedImages)
                  })
                })
                .then(res => res.ok ? res.json() : Promise.reject('API Error'))
                .then(newAiData => {
                  setAiReview({ ...newAiData, parsedData: { ...newAiData, ai_model: newAiData.ai_model } });
                })
                .catch(err => console.error("AI Error:", err))
                .finally(() => setIsProcessingAI(false));
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

    // Listen for real-time updates (e.g. from Merchant Scan)
    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
            <div className="bg-mertha-primary/5 rounded-xl p-5 border border-mertha-primary/20 flex flex-col items-center w-full max-w-[280px] mx-auto animate-in zoom-in duration-300">
              <p className="text-xs text-mertha-primary font-bold mb-2 tracking-widest">KODE PENGAMBILAN</p>
              
              <div className="bg-white p-2 rounded-lg w-full mb-3 shadow-sm border border-mertha-border flex justify-center">
                {order.pickup_code ? (
                  <Barcode value={order.pickup_code} width={1.8} height={60} displayValue={false} />
                ) : (
                  <div className="h-[60px] flex items-center justify-center text-mertha-subtext">Kode tidak tersedia</div>
                )}
              </div>
              
              <p className="text-2xl font-black tracking-[0.2em] text-mertha-text">{order.pickup_code || "N/A"}</p>
            </div>
          )}
          {isActive && !isDelivery && (
            <p className="text-xs text-mertha-subtext mt-4 leading-relaxed max-w-[240px] mx-auto">
              Tunjukkan barcode ini kepada merchant saat mengambil pesanan.
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
                {order.status === 'completed' ? (
                  <p className="text-sm font-bold text-green-600 mt-1">
                    Selesai Diambil: {new Date(order.updated_at || order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                ) : (
                  <p className="text-sm text-mertha-subtext mt-1">Hari ini, Sesuai Jam Operasional</p>
                )}
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
            <div className="bg-white border border-mertha-border rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
              <div className="bg-mertha-primary/10 px-4 py-3 border-b border-mertha-primary/20 flex items-center gap-2">
                <ShieldCheck className="text-mertha-primary" size={20} />
                <h3 className="font-bold text-mertha-primary text-sm">Status Pengembalian Dana</h3>
              </div>
              <div className="p-4 space-y-4">
                
                {/* Status Refund */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-mertha-subtext uppercase tracking-wider">Status Komplain</span>
                  <span className="inline-flex px-2 py-1 rounded-md text-xs font-bold bg-mertha-accent/10 text-mertha-accent capitalize">
                    {refund.status}
                  </span>
                </div>

                <div className="border-t border-mertha-border/50 pt-4">
                  {isProcessingAI ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-8 h-8 border-4 border-mertha-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-sm font-bold text-mertha-text">AI Sedang Memeriksa</p>
                      <p className="text-xs text-mertha-subtext mt-1 max-w-[200px]">Mohon tunggu sebentar...</p>
                    </div>
                  ) : aiReview?.parsedData ? (
                    <div className="space-y-4">
                      {/* Verdict Badge & Overall Score */}
                      <div className="flex flex-col items-center justify-center mb-2 space-y-3">
                        <VerdictBadge verdict={aiReview.parsedData.verdict} isProcessing={false} />
                        
                        {aiReview.parsedData.overall_score !== undefined && (
                          <div className="flex items-center gap-4 bg-mertha-bg px-5 py-3 rounded-2xl border border-mertha-border w-full justify-center">
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-mertha-subtext uppercase tracking-widest mb-0.5">Skor Akhir</p>
                              <p className="text-3xl font-black text-mertha-text leading-none">{aiReview.parsedData.overall_score}<span className="text-sm text-mertha-muted">/100</span></p>
                            </div>
                            <div className="w-px h-10 bg-mertha-border"></div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-mertha-subtext uppercase tracking-widest mb-0.5">Grade</p>
                              <p className={`text-3xl font-black leading-none ${
                                ['A+', 'A', 'B'].includes(aiReview.parsedData.grade) ? 'text-mertha-success' : 
                                ['C', 'D'].includes(aiReview.parsedData.grade) ? 'text-mertha-accent' : 'text-mertha-error'
                              }`}>{aiReview.parsedData.grade || '-'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Data Klaim */}
                      <div className="bg-mertha-bg p-3 rounded-xl border border-mertha-border">
                        <h4 className="text-xs font-bold text-mertha-text mb-2 flex items-center gap-1">
                          <Info size={14} className="text-mertha-primary" />
                          Detail Klaim
                        </h4>
                        
                        {aiReview.parsedData.submitted_images && aiReview.parsedData.submitted_images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 snap-x no-scrollbar mb-2">
                            {aiReview.parsedData.submitted_images.map((img, i) => (
                              <div key={i} className="relative w-16 h-16 shrink-0 snap-start">
                                <img src={img} alt="Bukti" className="w-full h-full object-cover rounded-lg border border-mertha-border" />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-[11px] text-mertha-subtext font-semibold mb-1">Alasan:</p>
                        <p className="text-xs text-mertha-text leading-relaxed">
                          "{refund.reason || 'Tidak ada alasan'}"
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="space-y-4 pt-2">
                        <ScoreBar label="Kelayakan Konsumsi" value={aiReview.parsedData.edibility_score ?? aiReview.parsedData.quality_score ?? 0} inverted={false} />
                        <ScoreBar label="Tingkat Kesegaran" value={aiReview.parsedData.freshness_score ?? 0} inverted={false} />
                        <ScoreBar label="Kualitas Visual" value={aiReview.parsedData.visual_score ?? 0} inverted={false} />
                        <ScoreBar label="Tingkat Kerusakan" value={aiReview.parsedData.defect_score ?? 0} inverted={true} />
                        <ScoreBar label="Kebersihan & Kontaminasi Visual" value={aiReview.parsedData.hygiene_score ?? 0} inverted={false} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-12 h-12 bg-mertha-bg rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle size={24} className="text-mertha-subtext" />
                      </div>
                      <p className="text-sm font-bold text-mertha-text">Analisis AI Belum Tersedia</p>
                      <p className="text-xs text-mertha-subtext mt-1 max-w-[200px]">Hasil akan muncul secara otomatis.</p>
                    </div>
                  )}
                </div>
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
          
          {/* AI Attribution — hanya tampil kalau ada model yang diketahui */}
          {(() => {
            const model = aiReview?.parsedData?.ai_model ?? aiReview?.ai_model ?? null;
            if (!model) return null;
            return (
              <div className="flex items-center justify-center gap-1.5 py-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-mertha-primary flex-shrink-0" style={{color:'var(--color-mertha-primary)'}}>
                  <path d="M12 2L13.09 8.26L19 7L15.45 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L8.55 12L5 7L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
                <span className="text-[10px] text-mertha-subtext font-medium tracking-wide">
                  Generated by <span className="text-mertha-primary font-bold">Mertha AI</span>
                  <span className="mx-1 opacity-40">|</span>
                  <span className="font-semibold">{model}</span>
                </span>
              </div>
            );
          })()}

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
