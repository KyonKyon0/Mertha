"use client";

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import GlobalLoading from '@/components/ui/GlobalLoading';
import { ArrowLeft, MapPin, Receipt, Wallet, ChevronRight, Copy, CheckCircle2, Check, Navigation, Package } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

// --- Slide to Confirm Component ---
function SlideToConfirm({ onConfirm, disabled, isLoading, text = "Geser untuk Konfirmasi" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const startDrag = (e) => {
    if (disabled || isLoading || isConfirmed) return;
    setIsDragging(true);
  };

  const onDrag = (e) => {
    if (!isDragging || !containerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(0, Math.min(clientX - containerRect.left, containerRect.width));
    setSlideWidth(newWidth);

    if (newWidth >= containerRect.width * 0.9) {
      setIsDragging(false);
      setIsConfirmed(true);
      setSlideWidth(containerRect.width);
      onConfirm();
    }
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!isConfirmed) setSlideWidth(0); // bounce back
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchmove', onDrag);
      window.addEventListener('touchend', endDrag);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-[52px] w-full rounded-xl overflow-hidden shadow-sm transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'} bg-mertha-bg border border-mertha-border`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 bg-mertha-primary/20 transition-all"
        style={{ width: isConfirmed ? '100%' : slideWidth + 'px', transitionDuration: isDragging ? '0ms' : '300ms' }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-sm font-bold transition-all ${isConfirmed ? 'text-mertha-primary opacity-0' : 'text-mertha-muted'}`}>
          {text}
        </span>
      </div>
      <button
        ref={buttonRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className={`absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-white border border-mertha-border rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-transform ${isConfirmed ? 'border-mertha-primary' : ''}`}
        style={{ transform: `translateX(${isConfirmed ? containerRef.current?.getBoundingClientRect().width - 64 : slideWidth}px)`, transitionDuration: isDragging ? '0ms' : '300ms' }}
      >
        {isConfirmed ? (
          <Check size={20} className="text-mertha-primary" />
        ) : (
          <ChevronRight size={20} className="text-mertha-primary" />
        )}
      </button>
      
      {isConfirmed && isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-5 h-5 border-2 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qty = parseInt(searchParams.get('qty') || "1");
  const productId = searchParams.get('productId');
  
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // 'pickup' | 'delivery'
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('checkout'); // 'checkout' | 'payment'
  const [copied, setCopied] = useState(false);
  const [payCode, setPayCode] = useState('');
  const [newOrderId, setNewOrderId] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, merchants(*)')
          .eq('id', productId)
          .single();
          
        if (data) setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId, supabase]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mertha-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-mertha-bg flex flex-col items-center justify-center p-4 text-center">
        <p className="text-mertha-subtext mb-4">Produk tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-mertha-primary font-bold">Kembali</button>
      </div>
    );
  }

  const price = product.price;
  const adminFee = 1000;
  const deliveryFee = deliveryMethod === 'delivery' ? 12000 : 0;
  const total = (price * qty) + adminFee + deliveryFee;

  const handleCheckout = () => {
    setIsProcessing(true);
    // Generate mock payment code
    setPayCode(`MR-PAY-${Math.floor(100000 + Math.random() * 900000)}`);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('payment');
    }, 800);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan login terlebih dahulu");

      // Generate Challenge Code (6 chars alphanumeric)
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let challengeCode = '';
      for (let i = 0; i < 6; i++) {
        challengeCode += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      // Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          merchant_id: product.merchants?.id || product.merchant_id,
          total_amount: total,
          admin_fee: adminFee,
          status: 'pending',
          pickup_code: challengeCode,
          delivery_method: deliveryMethod
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Order insert error:', JSON.stringify(orderError));
        throw new Error('Gagal membuat pesanan: ' + (orderError.message || orderError.code || JSON.stringify(orderError)));
      }

      // Insert Order Items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: product.id,
          quantity: qty,
          price_at_time: product.price
        });

      if (itemsError) {
        console.error('Order items error:', JSON.stringify(itemsError));
        throw new Error('Gagal menyimpan item pesanan: ' + (itemsError.message || itemsError.code));
      }

      // Update Stock — non-fatal, log if fails
      const newStock = Math.max(0, (product.stock || 0) - qty);
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (stockError) {
        console.warn('Stok gagal dikurangi (non-fatal):', JSON.stringify(stockError));
      }

      // Redirect to order detail
      router.replace(`/pesanan/${orderData.id}`);

    } catch (err) {
      console.error('Payment error:', err);
      alert("Gagal memproses pesanan: " + (err?.message || JSON.stringify(err)));
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(payCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'payment') {
    return (
      <div className="bg-mertha-bg min-h-screen flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-mertha-border sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.replace('/')} className="text-mertha-text hover:bg-mertha-bg p-1 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-mertha-text">Pembayaran</h1>
          </div>
        </header>

        <main className="flex-1 p-4 flex flex-col items-center mt-4 space-y-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-lg border border-mertha-border flex flex-col items-center">
            <h2 className="text-sm font-bold text-mertha-subtext mb-1 uppercase tracking-wider">Total Pembayaran</h2>
            <p className="text-3xl font-black text-mertha-primary mb-6">Rp {total.toLocaleString('id-ID')}</p>
            
            <div className="w-full border-t border-mertha-border/50 border-dashed mb-6"></div>
            
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-mertha-subtext">Metode: <strong className="text-mertha-text">{paymentMethod === 'qris' ? 'QRIS' : 'GoPay'}</strong></span>
                <span className="text-xs text-red-500 font-medium">Batas Waktu: 15:00</span>
              </div>
              <p className="text-xs text-mertha-subtext mb-2">Silakan transfer / bayar menggunakan kode berikut:</p>
              
              <div className="bg-mertha-bg border-2 border-mertha-border rounded-xl p-4 flex items-center justify-between group hover:border-mertha-primary transition-colors cursor-pointer" onClick={handleCopy}>
                <div>
                  <p className="text-[10px] text-mertha-muted font-semibold mb-1">KODE PEMBAYARAN</p>
                  <p className="font-mono text-lg font-bold text-mertha-text tracking-wider">{payCode}</p>
                </div>
                <button className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-white text-mertha-subtext group-hover:text-mertha-primary shadow-sm'}`}>
                  {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
            
            <div className="w-full mt-6 bg-blue-50 text-blue-800 text-xs p-3 rounded-xl flex gap-2 items-start">
              <span className="text-lg leading-none">💡</span>
              <p className="leading-relaxed">Ini adalah simulasi pembayaran. Cukup geser tombol di bawah untuk menyelesaikan pesanan.</p>
            </div>
          </div>
        </main>

        <div className="bg-white border-t border-mertha-border p-4 pb-safe animate-in slide-in-from-bottom duration-500">
          <SlideToConfirm 
            onConfirm={handlePaymentConfirm} 
            isLoading={isProcessing} 
            text="Geser jika Sudah Bayar"
          />
        </div>
      </div>
    );
  }

  const pickupTime = product.pickup_time_start ? `${product.pickup_time_start.substring(0,5)} - ${product.pickup_time_end?.substring(0,5)}` : 'Sesuai jam operasional';

  return (
    <div className="bg-mertha-bg min-h-screen flex flex-col animate-in fade-in duration-300">
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-mertha-border sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-mertha-text hover:bg-mertha-bg p-1 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-mertha-text">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        
        {/* Delivery Method Toggle */}
        <section className="bg-white p-1 rounded-2xl shadow-sm border border-mertha-border flex overflow-hidden">
          <button 
            onClick={() => setDeliveryMethod('pickup')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${deliveryMethod === 'pickup' ? 'bg-mertha-primary text-white shadow-md' : 'text-mertha-subtext hover:bg-mertha-bg'}`}
          >
            <MapPin size={18} />
            Ambil Sendiri
          </button>
          <button 
            onClick={() => setDeliveryMethod('delivery')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${deliveryMethod === 'delivery' ? 'bg-mertha-primary text-white shadow-md' : 'text-mertha-subtext hover:bg-mertha-bg'}`}
          >
            <Package size={18} />
            Diantar
          </button>
        </section>

        {/* Location Info */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-mertha-border transition-colors animate-in fade-in slide-in-from-bottom-2">
          <h2 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            {deliveryMethod === 'pickup' ? <MapPin size={18} className="text-mertha-primary" /> : <Navigation size={18} className="text-mertha-primary" />}
            {deliveryMethod === 'pickup' ? 'Lokasi Pengambilan' : 'Lokasi Pengiriman (Alamat Anda)'}
          </h2>
          <div className="pl-6 border-l-2 border-mertha-primary/20 ml-2 relative">
            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-mertha-primary animate-pulse"></div>
            <p className="font-bold text-sm text-mertha-text">
              {deliveryMethod === 'pickup' ? product.merchants?.name : "Rumah Saya"}
            </p>
            <p className="text-sm text-mertha-subtext mt-1 leading-relaxed">
              {deliveryMethod === 'pickup' ? product.merchants?.address : "Jl. Jendral Sudirman No. 45, Jakarta Pusat"}
            </p>
            {deliveryMethod === 'pickup' && (
              <div className="mt-2 inline-block bg-mertha-primary/10 text-mertha-primary text-xs font-bold px-2 py-1 rounded">
                Waktu: Hari ini, {pickupTime}
              </div>
            )}
          </div>
        </section>

        {/* Order Details */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-mertha-border transition-colors">
          <h2 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-mertha-primary" />
            Ringkasan Pesanan
          </h2>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-sm text-mertha-text">{product.name}</p>
              <p className="text-xs text-mertha-subtext mt-1 bg-mertha-bg inline-block px-2 py-0.5 rounded-md">{qty}x @ Rp {price.toLocaleString('id-ID')}</p>
            </div>
            <p className="font-bold text-sm text-mertha-text">Rp {(price * qty).toLocaleString('id-ID')}</p>
          </div>
          <div className="flex justify-between items-center text-sm text-mertha-subtext pt-3 border-t border-mertha-border border-dashed mb-2">
            <span>Biaya Layanan</span>
            <span>Rp {adminFee.toLocaleString('id-ID')}</span>
          </div>
          {deliveryMethod === 'delivery' && (
            <div className="flex justify-between items-center text-sm text-mertha-subtext border-b border-mertha-border border-dashed pb-3 animate-in slide-in-from-top-1 fade-in">
              <span>Ongkos Kirim</span>
              <span>Rp {deliveryFee.toLocaleString('id-ID')}</span>
            </div>
          )}
        </section>

        {/* Payment Method */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-mertha-border transition-colors">
          <h2 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-mertha-primary" />
            Metode Pembayaran
          </h2>
          <div className="space-y-3">
            <label className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'qris' ? 'border-mertha-primary bg-mertha-primary/5 shadow-sm scale-[1.01]' : 'border-mertha-border hover:bg-mertha-bg'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-6 bg-blue-100 rounded text-[10px] font-bold text-blue-800 flex items-center justify-center">QRIS</div>
                <span className="text-sm font-medium text-mertha-text">QRIS (Semua e-Wallet)</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'qris' ? 'border-mertha-primary' : 'border-mertha-muted'}`}>
                {paymentMethod === 'qris' && <div className="w-2.5 h-2.5 rounded-full bg-mertha-primary animate-in zoom-in duration-200"></div>}
              </div>
            </label>
            <label className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'gopay' ? 'border-mertha-primary bg-mertha-primary/5 shadow-sm scale-[1.01]' : 'border-mertha-border hover:bg-mertha-bg'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-6 bg-green-100 rounded text-[10px] font-bold text-green-700 flex items-center justify-center">GoPay</div>
                <span className="text-sm font-medium text-mertha-text">GoPay</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'gopay' ? 'border-mertha-primary' : 'border-mertha-muted'}`}>
                {paymentMethod === 'gopay' && <div className="w-2.5 h-2.5 rounded-full bg-mertha-primary animate-in zoom-in duration-200"></div>}
              </div>
            </label>
          </div>
        </section>
      </main>

      <div className="bg-white border-t border-mertha-border p-4 pb-safe animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-mertha-subtext">Total Pembayaran</span>
          <span className="text-xl font-black text-mertha-primary">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <SlideToConfirm 
          onConfirm={handleCheckout} 
          isLoading={isProcessing} 
          text="Geser untuk Lanjut"
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<GlobalLoading fullScreen={true} />}>
      <CheckoutContent />
    </Suspense>
  );
}

