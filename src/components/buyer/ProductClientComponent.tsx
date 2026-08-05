"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MapPin, Clock, Info, ShieldCheck, ChevronRight, Star, Minus, Plus } from 'lucide-react';
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
  allergens: string[];
  imageUrl: string;
  galleryUrls: string[];
}

export default function ProductClientComponent({ product }: { product: ProductData }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [distance, setDistance] = useState<string | null>(null);

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  useEffect(() => {
    // Only ask for location if the user clicks a button, but here we can just check if we already have permission or gracefully ask.
    // Wait, the prompt says "Map/Distance: panggil reverse geocoding atau hitung jarak HP ke lokasi toko hanya setelah mendapat izin lokasi".
    // We shouldn't ask for permission on mount. So distance is null initially.
    
    // Check if we can get location without prompting (e.g. if already granted)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(pos => {
            const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, product.latitude, product.longitude);
            setDistance(formatDistance(dist));
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, product.latitude, product.longitude);
          setDistance(formatDistance(dist));
        },
        err => {
          alert("Gagal mendapatkan lokasi: " + err.message);
        }
      );
    }
  };

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
      <div className="w-full aspect-[4/3] bg-mertha-bg relative overflow-hidden">
        <Image 
          src={product.imageUrl} 
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
          1/{Math.max(1, product.galleryUrls.length)}
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
            <span className="text-sm text-mertha-muted line-through mb-1">{formatCurrency(product.originalPrice)}</span>
            <span className="bg-mertha-error/10 text-mertha-error text-xs font-bold px-2 py-1 rounded-md mb-1 ml-auto">
              Hemat {discount}%
            </span>
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
              <Link href={`/jelajahi/peta?merchant=${product.merchantSlug}`} className="text-sm font-bold text-mertha-primary flex items-center gap-1 active:scale-95 transition-transform inline-flex">
                Lihat di Peta
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="p-4 border-b border-mertha-border">
          <h3 className="text-base font-bold text-mertha-text mb-2">Tentang Produk Ini</h3>
          <p className="text-sm text-mertha-subtext leading-relaxed mb-4">
            {product.description}
          </p>
          
          {product.allergens.length > 0 && (
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
          
          <Link href={`/checkout?productId=${product.id}&qty=${quantity}`} className="flex-1 bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-lg shadow-mertha-primary/30 active:scale-95 transition-transform">
            Pesan Sekarang
          </Link>
        </div>
        <p className="text-center text-[10px] text-mertha-muted mt-2">
          Sisa {product.stock} bag! Segera amankan sebelum kehabisan.
        </p>
      </div>
    </div>
  );
}
