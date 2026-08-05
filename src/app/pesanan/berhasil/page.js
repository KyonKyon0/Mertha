"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Home, Receipt } from 'lucide-react';

export default function PesananBerhasil() {
  return (
    <div className="min-h-screen bg-mertha-primary flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center relative z-10 animate-fade-in-up">
        <div className="w-20 h-20 bg-mertha-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-mertha-success" />
        </div>
        
        <h1 className="text-2xl font-bold text-mertha-text mb-2">Hore, Pesanan Berhasil!</h1>
        <p className="text-sm text-mertha-subtext mb-6">
          Terima kasih telah ikut menyelamatkan makanan. Tunjukkan kode pesanan saat pengambilan.
        </p>

        <div className="bg-mertha-bg rounded-xl p-4 mb-8">
          <p className="text-xs text-mertha-subtext mb-1">KODE PENGAMBILAN</p>
          <p className="text-3xl font-black tracking-widest text-mertha-primary">MR-82X9</p>
        </div>

        <div className="space-y-3">
          <Link href="/pesanan/1" className="w-full bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-mertha-primary/90 transition-colors">
            <Receipt size={18} />
            Lihat Detail Pesanan
          </Link>
          <Link href="/" className="w-full bg-white border border-mertha-border text-mertha-text font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-mertha-bg transition-colors">
            <Home size={18} />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
