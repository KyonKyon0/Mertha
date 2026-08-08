"use client";

import React, { useState, useEffect } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import LocationStatus from '@/components/buyer/LocationStatus';
import PromoCarousel from '@/components/buyer/PromoCarousel';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import useLocationStore from '@/store/useLocationStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Navigation, Map, Gift, Apple, Sprout, Croissant, Utensils, Store, Clock, ShoppingBag, PiggyBank, Recycle, ShoppingCart, Footprints, Users, Newspaper, Ticket } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [topProducts, setTopProducts] = useState([]);
  
  useEffect(() => {
    async function fetchTopProducts() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          merchants (name, logo_url, address),
          product_images (image_url)
        `)
        .eq('is_active', true)
        .limit(2);
      
      if (data) {
        setTopProducts(data);
      }
    }
    fetchTopProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jelajahi?q=${encodeURIComponent(searchQuery)}&sort=nearest`);
    } else {
      router.push(`/jelajahi`);
    }
  };

  const handleCategoryClick = (category) => {
    router.push(`/jelajahi?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen">
      <BuyerHeader />
      
      <LocationStatus />

      <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))] overflow-y-auto">
        <div className="relative">
          <PromoCarousel />
          
          <div className="px-5 relative -mt-6 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
            <div className="bg-surface-container-lowest rounded-full shadow-lg border border-outline-variant/30 flex items-center px-4 py-2 transition-all hover:shadow-xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-primary/20">
              <button 
                onClick={async () => {
                  try {
                    await useLocationStore.getState().fetchGpsLocation();
                    router.push('/jelajahi?sort=nearest');
                  } catch (e) {
                    // error handled in store
                  }
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors shrink-0"
                aria-label="GPS Location"
              >
                <Navigation size={20} />
              </button>
              
              <form onSubmit={handleSearch} className="flex-1 mx-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari makanan di sekitarku..." 
                  className="w-full h-10 bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-on-surface-variant/70"
                />
              </form>

              <div className="flex items-center gap-2 shrink-0 border-l border-outline-variant/50 pl-3">
                <button 
                  onClick={handleSearch}
                  className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                >
                  <Search size={20} />
                </button>
                <Link 
                  href="/jelajahi/peta"
                  className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-colors"
                >
                  <Map size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Kategori */}
        <section className="px-5 mt-10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
            <h2 className="text-lg font-bold mb-4 text-on-surface tracking-tight">Kategori Terpopuler</h2>
            <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleCategoryClick('Semua')} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-primary/30 hover:-translate-y-1 active:scale-95 transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-secondary-container/30 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <MapPin size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-center text-on-surface-variant group-hover:text-primary transition-colors">Terdekat</span>
                </button>
                <button onClick={() => handleCategoryClick('Mystery Bag')} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-tertiary-container/30 hover:-translate-y-1 active:scale-95 transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-tertiary-fixed/30 text-tertiary-container flex items-center justify-center group-hover:bg-tertiary-container group-hover:text-white transition-colors">
                        <Gift size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-center text-on-surface-variant group-hover:text-tertiary-container transition-colors">Mystery Bag</span>
                </button>
                <button onClick={() => handleCategoryClick('Sayur & Buah')} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-primary/30 hover:-translate-y-1 active:scale-95 transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary-fixed/30 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Apple size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-center text-on-surface-variant group-hover:text-primary transition-colors">Sayur & Buah</span>
                </button>
                <button onClick={() => handleCategoryClick('Roti & Pastry')} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-tertiary-container/30 hover:-translate-y-1 active:scale-95 transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-tertiary-fixed/30 text-tertiary-container flex items-center justify-center group-hover:bg-tertiary-container group-hover:text-white transition-colors">
                        <Croissant size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-center text-on-surface-variant group-hover:text-tertiary-container transition-colors">Bakery</span>
                </button>
                <button onClick={() => handleCategoryClick('Nasi & Lauk')} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-primary/30 hover:-translate-y-1 active:scale-95 transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-secondary-container/30 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Utensils size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-center text-on-surface-variant group-hover:text-primary transition-colors">Siap Saji</span>
                </button>
                <a href="https://oscartambunan.dev/martha" target="_blank" rel="noopener noreferrer" className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-error/30 hover:-translate-y-1 active:scale-95 transition-all group">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-error-container/30 text-error flex items-center justify-center group-hover:bg-error group-hover:text-white transition-colors">
                        <Users size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-center text-on-surface-variant group-hover:text-error transition-colors">Upcoming</span>
                </a>
            </div>
        </section>

        {/* Berita & Edukasi Impact */}
        <section className="px-5 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            <h2 className="text-lg font-bold mb-4 text-on-surface tracking-tight flex items-center gap-2">
              <Newspaper className="text-primary" size={20} /> Kabar Impact
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                <div className="min-w-[280px] snap-center bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-3">
                    <div className="w-full h-32 bg-primary/10 rounded-xl flex items-center justify-center text-primary relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                       <Sprout size={48} className="opacity-80" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase mb-1 block">Climate Action</span>
                        <h3 className="font-bold text-sm leading-tight text-on-surface">Mengurangi Jejak Karbon dari Piring Kita</h3>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">Pelajari bagaimana menyelamatkan makanan dapat menurunkan emisi gas rumah kaca secara drastis.</p>
                    </div>
                </div>
                <div className="min-w-[280px] snap-center bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-3">
                    <div className="w-full h-32 bg-tertiary-container/20 rounded-xl flex items-center justify-center text-tertiary-container relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-tertiary-container/20 to-transparent"></div>
                       <Recycle size={48} className="opacity-80" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-tertiary-container tracking-wider uppercase mb-1 block">Zero Waste</span>
                        <h3 className="font-bold text-sm leading-tight text-on-surface">Ubah Sisa Sayur Menjadi Kaldu Lezat</h3>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">Tips dan trik mengolah bahan makanan berlebih di dapur Anda agar tidak terbuang sia-sia.</p>
                    </div>
                </div>
            </div>

            {/* Kupon Promo */}
            <div className="mt-4 relative bg-primary text-on-primary rounded-2xl p-4 shadow-lg overflow-hidden">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface rounded-full"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface rounded-full"></div>
                
                <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-2xl m-2 pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center justify-between pl-4 pr-2">
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <Ticket size={16} className="text-tertiary-container" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-container">Promo Spesial</span>
                        </div>
                        <h3 className="font-black text-xl leading-tight">Diskon 50%</h3>
                        <p className="text-xs text-primary-container mt-1">Untuk transaksi pertamamu!</p>
                    </div>
                    <button className="bg-tertiary-container text-on-tertiary px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform active:scale-95">
                        Klaim
                    </button>
                </div>
            </div>
        </section>

        <section className="pl-5 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            <div className="flex justify-between items-end pr-5 mb-4">
              <h2 className="text-lg font-bold text-on-surface tracking-tight">Pilihan Hemat di Dekatmu</h2>
              <button onClick={() => router.push('/jelajahi')} className="text-xs font-bold text-primary hover:underline">Lihat Semua</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 pr-5 snap-x">
                {topProducts.length > 0 ? topProducts.map(product => (
                  <div key={product.id} className="min-w-[240px] w-[240px] snap-start bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all group">
                      <div className="h-[140px] w-full relative bg-cover bg-center overflow-hidden" style={{backgroundImage: `url('${product.product_images?.[0]?.image_url || '/images/placeholder.jpg'}')`}}>
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-primary px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-sm">
                              TERSEDIA
                          </div>
                          <div className="absolute bottom-3 right-3 bg-tertiary-container/95 backdrop-blur text-on-tertiary px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                              <Clock size={12} className="shrink-0" aria-hidden="true" /> {product.pickup_time_start?.substring(0,5)} - {product.pickup_time_end?.substring(0,5)}
                          </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 gap-2">
                          <div>
                              <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1 mb-1">
                                  <Store size={12} className="shrink-0" aria-hidden="true" /> {product.merchants?.name}
                              </p>
                              <h3 className="text-[15px] leading-snug font-bold line-clamp-2 text-on-surface group-hover:text-primary transition-colors">{product.name}</h3>
                          </div>
                          <div className="flex items-end justify-between mt-auto pt-3 border-t border-outline-variant/20">
                              <div>
                                  <p className="text-on-surface-variant text-[11px] line-through decoration-on-surface-variant/50">Rp {product.original_price?.toLocaleString('id-ID')}</p>
                                  <p className="text-[16px] font-black text-primary">Rp {product.price?.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-tertiary-container bg-tertiary-fixed/30 px-2 py-0.5 rounded-full mb-1">Sisa {product.stock}</span>
                              </div>
                          </div>
                          <Link href={`/produk/${product.slug}`} className="w-full mt-3 py-2 bg-primary/5 border border-primary/20 text-primary rounded-xl text-[13px] font-bold hover:bg-primary hover:text-white transition-colors flex justify-center items-center">
                              Lihat Detail
                          </Link>
                      </div>
                  </div>
                )) : (
                  <p className="text-sm text-on-surface-variant">Memuat pilihan hemat...</p>
                )}
            </div>
        </section>

        {/* Belanja Hemat, Dampak Baik */}
        <section className="px-5 py-8 bg-surface-container-low mt-4 overflow-hidden">
            <h2 className="text-[24px] leading-[32px] font-semibold mb-6 text-center text-on-surface">Belanja Hemat, Dampak Baik</h2>
            <div className="flex flex-col gap-2">
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 shadow-sm border border-outline-variant/10">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                        <ShoppingBag size={24} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-[18px] font-semibold text-primary truncate">Makanan terselamatkan</h4>
                        <p className="text-[16px] font-medium text-on-surface-variant truncate">2.540 kg bulan ini</p>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 shadow-sm border border-outline-variant/10">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
                        <PiggyBank size={24} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-[18px] font-semibold text-tertiary-container truncate">Pengeluaran hemat</h4>
                        <p className="text-[16px] font-medium text-on-surface-variant truncate">Rp 150+ Juta oleh pengguna</p>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 shadow-sm border border-outline-variant/10">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                        <Recycle size={24} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-[18px] font-semibold text-primary truncate">Sampah pangan berkurang</h4>
                        <p className="text-[16px] font-medium text-on-surface-variant truncate">Berkontribusi ke bumi bersih</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Cara Kerja */}
        <section className="px-5 py-8 pb-12 overflow-hidden">
            <h2 className="text-[24px] leading-[32px] font-semibold mb-6 text-center text-on-surface">Cara Kerja</h2>
            <div className="flex flex-col gap-6 relative">
                <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-outline-variant/30"></div>
                
                <div className="flex gap-4 relative z-10 w-full">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                        <Search size={24} aria-hidden="true" />
                    </div>
                    <div className="pt-2 min-w-0 flex-1 pr-4">
                        <h3 className="text-[18px] font-semibold text-on-surface">1. Temukan Makanan</h3>
                        <p className="text-[16px] font-medium text-on-surface-variant mt-1 break-words">Cari mystery bag atau makanan diskon dari toko terdekat.</p>
                    </div>
                </div>
                
                <div className="flex gap-4 relative z-10 w-full">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                        <ShoppingCart size={24} aria-hidden="true" />
                    </div>
                    <div className="pt-2 min-w-0 flex-1 pr-4">
                        <h3 className="text-[18px] font-semibold text-on-surface">2. Pesan &amp; Bayar</h3>
                        <p className="text-[16px] font-medium text-on-surface-variant mt-1 break-words">Lakukan pemesanan langsung melalui aplikasi dengan aman.</p>
                    </div>
                </div>
                
                <div className="flex gap-4 relative z-10 w-full">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                        <Footprints size={24} aria-hidden="true" />
                    </div>
                    <div className="pt-2 min-w-0 flex-1 pr-4">
                        <h3 className="text-[18px] font-semibold text-on-surface">3. Ambil Pesanan</h3>
                        <p className="text-[16px] font-medium text-on-surface-variant mt-1 break-words">Kunjungi toko pada waktu yang ditentukan untuk mengambil pesananmu.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface-container mt-12 w-full p-8 pb-8">
            <div className="flex flex-col items-center text-center gap-6 w-full max-w-7xl mx-auto">
                <Image src="/logo.png" alt="Martha Official Store" width={180} height={180} className="h-24 object-contain mb-4" />
                <p className="text-[16px] font-medium text-on-surface-variant max-w-xs">Menyelamatkan makanan, melestarikan bumi.</p>
                <div className="flex gap-4 flex-wrap justify-center">
                    <button onClick={() => alert("Fitur Tentang segera hadir!")} className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Tentang</button>
                    <button onClick={() => alert("Fitur Bantuan segera hadir!")} className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Bantuan</button>
                    <button onClick={() => alert("Pendaftaran Merchant segera hadir!")} className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Merchant</button>
                    <button onClick={() => alert("Kebijakan Privasi segera hadir!")} className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Privasi</button>
                </div>
                <div className="text-[12px] font-bold text-on-surface-variant mt-4">
                    © 2026 Mertha
                </div>
            </div>
        </footer>

      </main>

      <BottomNavigation />
    </div>
  );
}
