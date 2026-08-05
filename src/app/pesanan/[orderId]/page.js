"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Receipt, HelpCircle, Store } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetail({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;

  // Mock data based on orderId
  const order = {
    id: orderId,
    status: orderId === "1" ? "Menunggu Pengambilan" : "Selesai",
    pickupCode: "MR-82X9",
    merchant: "Toko Roti Makmur",
    address: "Jl. Melati No. 12, Senayan, Jakarta",
    time: "19:00 - 21:00",
    date: "Hari ini",
    product: "Surprise Bag - Pastry",
    qty: 1,
    price: 25000,
    adminFee: 1000,
    total: 26000
  };

  return (
    <div className="bg-mertha-bg min-h-screen flex flex-col pb-safe">
      <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-mertha-border sticky top-0 z-40">
        <button onClick={() => router.back()} className="text-mertha-text">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-mertha-text">Detail Pesanan</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white p-5 rounded-xl border border-mertha-border text-center shadow-sm">
          <h2 className="text-sm font-medium text-mertha-subtext mb-1">Status Pesanan</h2>
          <p className="text-lg font-bold text-mertha-primary mb-4">{order.status}</p>
          
          {order.status === "Menunggu Pengambilan" && (
            <div className="bg-mertha-bg rounded-lg p-4 inline-block min-w-[200px]">
              <p className="text-xs text-mertha-subtext mb-1">KODE PENGAMBILAN</p>
              <p className="text-2xl font-black tracking-widest text-mertha-primary">{order.pickupCode}</p>
            </div>
          )}
          {order.status === "Menunggu Pengambilan" && (
            <p className="text-xs text-mertha-subtext mt-3">
              Tunjukkan kode ini kepada kasir saat mengambil pesanan.
            </p>
          )}
        </div>

        {/* Location & Time */}
        <div className="bg-white p-4 rounded-xl border border-mertha-border shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <Store size={20} className="text-mertha-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-mertha-text">{order.merchant}</p>
              <p className="text-sm text-mertha-subtext mt-1">{order.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pt-3 border-t border-mertha-border/50">
            <Clock size={20} className="text-mertha-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-mertha-text">Waktu Pengambilan</p>
              <p className="text-sm text-mertha-subtext mt-1">{order.date}, {order.time}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white p-4 rounded-xl border border-mertha-border shadow-sm">
          <h3 className="text-sm font-bold text-mertha-text mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-mertha-primary" />
            Rincian Pembayaran
          </h3>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium text-sm text-mertha-text">{order.product}</p>
              <p className="text-xs text-mertha-subtext">{order.qty}x</p>
            </div>
            <p className="font-medium text-sm text-mertha-text">Rp {(order.price * order.qty).toLocaleString('id-ID')}</p>
          </div>
          <div className="flex justify-between items-center text-sm text-mertha-subtext py-2 border-b border-mertha-border border-dashed mb-2">
            <span>Biaya Layanan</span>
            <span>Rp {order.adminFee.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-mertha-text">
            <span>Total Pembayaran</span>
            <span className="text-mertha-primary">Rp {order.total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {order.status === "Selesai" && (
            <Link href={`/refund/${order.id}`} className="w-full bg-white border border-mertha-error text-mertha-error font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-mertha-error/5 transition-colors">
              <HelpCircle size={18} />
              Ajukan Pengembalian Dana (Refund)
            </Link>
          )}
          <button className="w-full bg-white border border-mertha-border text-mertha-text font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-mertha-bg transition-colors">
            Hubungi Bantuan
          </button>
        </div>
      </main>
    </div>
  );
}
