"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MapPin, Clock, Info, ShieldCheck, ChevronRight, Star, Minus, Plus, HeartHandshake, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { calculateDistance, formatDistance } from '@/lib/geo';

interface ProductData {
  id: string;
  name: string;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  rating: number;
  reviews: number;
  address: string;
  latitude: number;
  longitude: number;
  pickupTime: string;
  price: number;
  originalPrice: number;
  stock: number;
  description: string;
  advanceModeText?: string | null;
  allergens: string[];
  imageUrl: string;
  galleryUrls: string[];
  merchantIsActive?: boolean;
}

export default function ProductClientComponent({ product }: { product: ProductData }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [distance, setDistance] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const discount = product.originalPrice > 0 ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  useEffect(() => {
    // Check if we can get location without prompting (e.g. if already granted)
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== "localhost") {
       // Do nothing automatically on HTTP, wait for user to click "Hitung Jarak"
       return;
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(pos => {
            const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, product.latitude, product.longitude);
            setDistance(formatDistance(dist));
          }, () => {
            // Silently fail if unable to get location despite permission
          });
        }
      });
    }
  }, [product.latitude, product.longitude]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - ${product.merchantName}`,
          text: `Cek ${product.name} dari ${product.merchantName} di Too Good To Be Waste!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan disalin ke clipboard!');
    }
  };

  const handleGetDistance = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== "localhost") {
      const manualLocation = window.prompt("GPS otomatis diblokir browser. Masukkan kota atau area Anda untuk menghitung jarak:");
      if (manualLocation && manualLocation.trim().length > 0) {
        fetch(`/api/location/search?q=${encodeURIComponent(manualLocation.trim())}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const result = data[0];
              const dist = calculateDistance(result.latitude, result.longitude, product.latitude, product.longitude);
              setDistance(formatDistance(dist));
            } else {
              alert("Lokasi tidak ditemukan.");
            }
          })
          .catch(e => {
            alert("Gagal mencari lokasi.");
          });
      }
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, product.latitude, product.longitude);
          setDistance(formatDistance(dist));
        },
        err => {
          let errorMsg = "Gagal mendapatkan lokasi.";
          if (err.code === err.PERMISSION_DENIED) errorMsg = "Izin lokasi ditolak. Silakan izinkan di pengaturan browser.";
          else if (err.code === err.POSITION_UNAVAILABLE) errorMsg = "Informasi lokasi tidak tersedia saat ini.";
          else if (err.code === err.TIMEOUT) errorMsg = "Waktu permintaan lokasi habis.";
          alert(errorMsg);
        }
      );
    } else {
      alert("Browser Anda tidak mendukung Geolocation.");
    }
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${product.latitude},${product.longitude}`;

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24 relative">
      {/* Header Actions */}
      <div className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pt-safe">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <ArrowLeft size={24} />
        </button>
        <button onClick={handleShare} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
          <Share2 size={20} />
        </button>
      </div>

      {/* Image Gallery */}
      <div className="w-full relative bg-gray-100">
        <div 
          className="w-full aspect-[4/3] bg-cover bg-center"
          style={{ backgroundImage: `url('${product.imageUrl}')` }}
        />
        {product.galleryUrls && product.galleryUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto p-3 snap-x bg-white">
            {product.galleryUrls.map((img, idx) => (
              <div key={idx} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden snap-start shadow-sm border border-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Kondisi Makanan ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
          1/{1 + (product.galleryUrls?.length || 0)} Foto
        </div>
      </div>

      <main className="flex-1">
        {/* Title & Price */}
        <section className="p-4 border-b border-mertha-border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-xl font-bold text-mertha-text mb-1">{product.name}</h1>
              <div className="flex items-center gap-1 text-mertha-subtext text-sm">
                <span className="font-semibold text-mertha-primary">{product.merchantName}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-mertha-accent fill-mertha-accent" />
                  <span>{product.rating}</span>
                  <span className="text-mertha-muted">({product.reviews})</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-end gap-2 mt-4">
            <span className="text-2xl font-bold text-mertha-primary">{formatCurrency(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-mertha-muted line-through mb-1">{formatCurrency(product.originalPrice)}</span>
            )}
            {discount > 0 && (
              <span className="bg-mertha-error/10 text-mertha-error text-xs font-bold px-2 py-1 rounded-md mb-1 ml-auto">
                Hemat {discount}%
              </span>
            )}
          </div>
        </section>

        {/* Pickup Info */}
        <section className="p-4 border-b border-mertha-border space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-mertha-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Clock size={20} className="text-mertha-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-mertha-text mb-1">Waktu Pengambilan</h3>
              <p className="text-sm text-mertha-subtext">Hari ini, {product.pickupTime} WIB</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-mertha-primary/10 rounded-full flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-mertha-primary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-bold text-mertha-text">Lokasi Pengambilan</h3>
                {distance ? (
                  <span className="text-xs font-semibold text-mertha-primary bg-mertha-primary/10 px-2 py-0.5 rounded">
                    {distance}
                  </span>
                ) : (
                  <button onClick={handleGetDistance} className="text-xs font-semibold text-mertha-primary bg-mertha-primary/10 px-2 py-0.5 rounded active:bg-mertha-primary/20">
                    Hitung Jarak
                  </button>
                )}
              </div>
              <p className="text-sm text-mertha-subtext mb-2 leading-relaxed">{product.address}</p>
              <div className="flex gap-4 mt-2">
                <a href={`https://www.google.com/maps/search/?api=1&query=${product.latitude},${product.longitude}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-mertha-primary flex items-center gap-1 active:scale-95 transition-transform inline-flex">
                  Buka Peta
                  <ChevronRight size={16} />
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${product.latitude},${product.longitude}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-mertha-primary flex items-center gap-1 active:scale-95 transition-transform inline-flex">
                  Petunjuk Arah
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="p-4 border-b border-mertha-border">
          <h3 className="text-base font-bold text-mertha-text mb-3">Tentang Produk Ini</h3>
          <p className="text-sm text-mertha-subtext leading-relaxed mb-4 whitespace-pre-wrap">
            {product.description || "Tidak ada deskripsi tersedia."}
          </p>

          {product.advanceModeText && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900 mb-1">Dukung Misi Sosial</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Jika tidak laku, barang ini akan {product.advanceModeText.toLowerCase()}
                </p>
              </div>
            </div>
          )}

          {product.allergens && product.allergens.length > 0 && (
            <div className="bg-mertha-bg rounded-xl p-3 flex gap-3">
              <Info size={20} className="text-mertha-subtext shrink-0" />
              <div>
                <p className="text-xs font-bold text-mertha-text mb-1">Informasi Alergi</p>
                <p className="text-xs text-mertha-subtext">Mengandung: {product.allergens.join(", ")}</p>
              </div>
            </div>
          )}
        </section>

        {/* Guarantee */}
        <section className="p-4 bg-mertha-success/5 flex gap-3 items-center">
          <ShieldCheck size={24} className="text-mertha-success shrink-0" />
          <p className="text-xs text-mertha-subtext">
            Kualitas terjamin! Klaim refund mudah jika makanan tidak layak konsumsi saat diambil.
          </p>
        </section>
        {/* FAQs */}
        <section className="p-5 bg-gray-50 border-t border-gray-100 pb-8">
          <h3 className="text-base font-bold text-mertha-text mb-4">Pertanyaan Sering Diajukan</h3>
          <div className="space-y-3">
            {[
              { q: "Apa isi Mystery Bag ini?", a: "Isi tas ini adalah kejutan! Berisi makanan berkualitas dari toko ini yang belum terjual hari ini." },
              { q: "Apakah makanannya masih layak?", a: "Tentu saja. Semua makanan dijamin masih sangat layak konsumsi dan enak." },
              { q: "Bagaimana jika kualitas buruk?", a: "Mertha memiliki garansi refund penuh jika makanan terbukti basi atau tidak layak saat Anda ambil." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between font-bold text-sm text-gray-800 focus:outline-none"
                >
                  {faq.q}
                  <motion.div animate={{ rotate: activeFaq === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} className="text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-4 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Checkout Bar */}
      <div className="fixed bottom-0 w-full max-w-md mx-auto bg-white border-t border-mertha-border p-4 pb-safe z-40">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 border border-mertha-border rounded-xl px-2 py-2">
            <button 
              className="w-8 h-8 flex items-center justify-center text-mertha-text bg-mertha-bg rounded-lg disabled:opacity-50"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="font-bold w-4 text-center">{quantity}</span>
            <button 
              className="w-8 h-8 flex items-center justify-center text-mertha-text bg-mertha-bg rounded-lg disabled:opacity-50"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
            >
              <Plus size={16} />
            </button>
          </div>
          
          {(!product.merchantIsActive) ? (
            <button disabled className="flex-1 bg-gray-300 text-gray-500 font-bold py-3.5 rounded-xl flex items-center justify-center cursor-not-allowed">
              Toko Tutup
            </button>
          ) : product.stock > 0 ? (
            <Link href={`/checkout?productId=${product.id}&qty=${quantity}`} className="flex-1 bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-lg shadow-mertha-primary/30 active:scale-95 transition-transform">
              Pesan Sekarang
            </Link>
          ) : (
            <button disabled className="flex-1 bg-gray-300 text-gray-500 font-bold py-3.5 rounded-xl flex items-center justify-center cursor-not-allowed">
              Habis Terjual
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-mertha-muted mt-2">
          {product.stock > 0 ? `Sisa ${product.stock} bag! Segera amankan sebelum kehabisan.` : "Nantikan stok selanjutnya!"}
        </p>
      </div>
    </div>
  );
}
