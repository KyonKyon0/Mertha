"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MapPin, Clock, Info, ShieldCheck, ChevronRight, Star, Minus, Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function ProductDetail({ params }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.productId; // This is actually the slug
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          merchants (name, logo_url, address, rating, reviews_count),
          product_images (image_url)
        `)
        .eq('slug', productId)
        .single();

      if (data) {
        setProduct({
          id: data.id,
          slug: data.slug,
          name: data.name,
          merchant: data.merchants?.name,
          rating: data.merchants?.rating || 0,
          reviews: data.merchants?.reviews_count || 0,
          distance: "1.2 km",
          address: data.merchants?.address,
          pickupTime: `${data.pickup_time_start?.substring(0,5)} - ${data.pickup_time_end?.substring(0,5)}`,
          price: data.price,
          originalPrice: data.original_price,
          stock: data.stock,
          description: data.description,
          allergens: data.allergens || [],
          images: data.product_images?.map(img => img.image_url) || []
        });
      }
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat produk...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-mertha-text mb-2">Produk Tidak Ditemukan</h1>
        <p className="text-mertha-subtext mb-6">Maaf, produk yang Anda cari tidak tersedia atau tautan tidak valid.</p>
        <button onClick={() => router.push('/jelajahi')} className="bg-mertha-primary text-white font-bold py-3 px-6 rounded-xl">
          Kembali ke Jelajahi
        </button>
      </div>
    );
  }

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const mainImage = product.images.length > 0 ? product.images[0] : "/images/placeholder.jpg";

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24 relative animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pt-safe">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <ArrowLeft size={24} />
        </button>
        <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <Share2 size={20} />
        </button>
      </div>

      {/* Image Gallery */}
      <div 
        className="w-full aspect-[4/3] bg-mertha-bg relative bg-cover bg-center"
        style={{ backgroundImage: `url('${mainImage}')` }}
      >
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
          1/{Math.max(1, product.images.length)}
        </div>
      </div>

      <main className="flex-1">
        {/* Title & Price */}
        <section className="p-4 border-b border-mertha-border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-xl font-bold text-mertha-text mb-1">{product.name}</h1>
              <div className="flex items-center gap-1 text-mertha-subtext text-sm">
                <span className="font-semibold text-mertha-primary">{product.merchant}</span>
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
            <span className="text-2xl font-bold text-mertha-primary">Rp {product.price.toLocaleString('id-ID')}</span>
            <span className="text-sm text-mertha-muted line-through mb-1">Rp {product.originalPrice.toLocaleString('id-ID')}</span>
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
              <p className="text-sm text-mertha-subtext">Hari ini, {product.pickupTime}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-mertha-primary/10 rounded-full flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-mertha-primary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-bold text-mertha-text">Lokasi Pengambilan</h3>
                <span className="text-xs font-semibold text-mertha-primary bg-mertha-primary/10 px-2 py-0.5 rounded">
                  {product.distance}
                </span>
              </div>
              <p className="text-sm text-mertha-subtext mb-2 leading-relaxed">{product.address}</p>
              <Link href={`/jelajahi/peta?q=${encodeURIComponent(product.address)}`} className="text-sm font-bold text-mertha-primary flex items-center gap-1 hover:underline transition-all active:scale-95 origin-left">
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
            {product.description || "Tidak ada deskripsi tersedia."}
          </p>
          
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
          
          {product.stock > 0 ? (
            <Link href={`/checkout?productId=${product.id}&qty=${quantity}`} className="flex-1 bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-lg shadow-mertha-primary/30 active:scale-95 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">
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
