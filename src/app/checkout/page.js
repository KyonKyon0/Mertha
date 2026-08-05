"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Receipt, Wallet, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qty = parseInt(searchParams.get('qty') || "1");
  
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [isProcessing, setIsProcessing] = useState(false);

  const price = 25000;
  const adminFee = 1000;
  const total = (price * qty) + adminFee;

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      router.push('/pesanan/berhasil');
    }, 1500);
  };

  return (
    <div className="bg-mertha-bg min-h-screen flex flex-col">
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-mertha-border sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-mertha-text">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-mertha-text">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Pickup Location */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-mertha-primary" />
            Lokasi Pengambilan
          </h2>
          <div className="pl-6 border-l-2 border-mertha-primary/20 ml-2">
            <p className="font-bold text-sm text-mertha-text">Toko Roti Makmur</p>
            <p className="text-sm text-mertha-subtext mt-1 leading-relaxed">Jl. Melati No. 12, Senayan, Jakarta Selatan</p>
            <div className="mt-2 inline-block bg-mertha-primary/10 text-mertha-primary text-xs font-bold px-2 py-1 rounded">
              Waktu: Hari ini, 19:00 - 21:00
            </div>
          </div>
        </section>

        {/* Order Details */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-mertha-primary" />
            Ringkasan Pesanan
          </h2>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-sm text-mertha-text">Surprise Bag - Pastry</p>
              <p className="text-xs text-mertha-subtext">{qty}x @ Rp {price.toLocaleString('id-ID')}</p>
            </div>
            <p className="font-bold text-sm text-mertha-text">Rp {(price * qty).toLocaleString('id-ID')}</p>
          </div>
          <div className="flex justify-between items-center text-sm text-mertha-subtext pt-3 border-t border-mertha-border border-dashed">
            <span>Biaya Layanan</span>
            <span>Rp {adminFee.toLocaleString('id-ID')}</span>
          </div>
        </section>

        {/* Payment Method */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-mertha-primary" />
            Metode Pembayaran
          </h2>
          <div className="space-y-2">
            <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'qris' ? 'border-mertha-primary bg-mertha-primary/5' : 'border-mertha-border'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-5 bg-blue-100 rounded text-[10px] font-bold text-blue-800 flex items-center justify-center">QRIS</div>
                <span className="text-sm font-medium">QRIS (Semua e-Wallet)</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'qris' ? 'border-mertha-primary' : 'border-mertha-border'}`}>
                {paymentMethod === 'qris' && <div className="w-2.5 h-2.5 rounded-full bg-mertha-primary"></div>}
              </div>
            </label>
            <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'gopay' ? 'border-mertha-primary bg-mertha-primary/5' : 'border-mertha-border'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-5 bg-green-100 rounded text-[10px] font-bold text-green-700 flex items-center justify-center">GoPay</div>
                <span className="text-sm font-medium">GoPay</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'gopay' ? 'border-mertha-primary' : 'border-mertha-border'}`}>
                {paymentMethod === 'gopay' && <div className="w-2.5 h-2.5 rounded-full bg-mertha-primary"></div>}
              </div>
            </label>
          </div>
        </section>
      </main>

      <div className="bg-white border-t border-mertha-border p-4 pb-safe">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-mertha-subtext">Total Pembayaran</span>
          <span className="text-lg font-bold text-mertha-primary">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <button 
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-transform active:scale-95"
        >
          {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
          {!isProcessing && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
