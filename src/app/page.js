"use client";

import React, { useState } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import PromoCarousel from '@/components/buyer/PromoCarousel';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Navigation, Map, Gift, Apple, Sprout, Croissant, Utensils, Store, Clock, ShoppingBag, PiggyBank, Recycle, ShoppingCart, Footprints } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jelajahi?q=${encodeURIComponent(searchQuery)}&sort=nearest`);
    } else {
      router.push(`/jelajahi`);
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsLocating(false);
          router.push(`/jelajahi`);
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    }
  };

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen">
      <BuyerHeader showLogo={true} />
      
      {/* Location pill below header */}
      <div className="bg-surface pt-2 pb-3 px-5">
        <div className="bg-surface-container-lowest rounded-full py-1.5 px-3 inline-flex items-center gap-2 border border-outline-variant/30">
           <MapPin size={16} className="text-primary" />
           <span className="text-xs font-bold text-on-surface">Jl. Sudirman No. 12, Jakarta</span>
        </div>
      </div>

      <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))] overflow-y-auto">
        <div className="relative">
          <PromoCarousel />
          
          <div className="px-5 relative -mt-6 z-20">
            <div className="bg-surface-container-lowest rounded-xl shadow-lg p-4 border border-outline-variant/30 flex flex-col gap-4">
              
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari makanan atau merchant" 
                  className="w-full h-12 bg-surface rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/50 text-on-surface"
                />
              </form>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleSearch}
                  className="flex-1 bg-primary text-on-primary h-12 rounded-lg font-bold flex justify-center items-center gap-2 text-sm shadow-sm active:bg-primary-container transition-colors"
                >
                  Cari di Sekitarku
                </button>
                <button 
                  onClick={handleUseLocation}
                  aria-label="Gunakan Lokasiku"
                  className="w-12 h-12 rounded-lg border border-primary text-primary flex justify-center items-center hover:bg-primary-fixed-dim transition-colors"
                  disabled={isLocating}
                >
                  <Navigation size={20} className={isLocating ? "animate-pulse" : ""} />
                </button>
              </div>

              <div className="pt-2 border-t border-outline-variant/30">
                <Link 
                  href="/jelajahi/peta"
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface h-12 rounded-lg font-bold flex items-center justify-center gap-2 text-sm hover:bg-surface-container transition-colors"
                >
                  <Map size={18} />
                  Lihat Peta
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Kategori */}
        <section className="px-5 mt-8 overflow-hidden">
            <h2 className="text-[24px] leading-[32px] font-semibold mb-4 text-on-surface">Kategori</h2>
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-secondary-container/50 text-primary flex items-center justify-center mb-1">
                        <MapPin size={24} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] leading-tight font-bold text-center break-words w-full">Terdekat</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-tertiary-fixed/50 text-tertiary-container flex items-center justify-center mb-1">
                        <Gift size={24} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] leading-tight font-bold text-center break-words w-full">Mystery Bag</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-primary-fixed/50 text-primary flex items-center justify-center mb-1">
                        <Apple size={24} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] leading-tight font-bold text-center break-words w-full">Buah</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-primary-fixed/50 text-primary flex items-center justify-center mb-1">
                        <Sprout size={24} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] leading-tight font-bold text-center break-words w-full">Sayur</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-tertiary-fixed/50 text-tertiary-container flex items-center justify-center mb-1">
                        <Croissant size={24} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] leading-tight font-bold text-center break-words w-full">Bakery</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-1.5 sm:p-2 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center gap-1 min-h-[96px]">
                    <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-secondary-container/50 text-primary flex items-center justify-center mb-1">
                        <Utensils size={24} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] sm:text-[12px] leading-tight font-bold text-center break-words w-full">Siap Saji</span>
                </div>
            </div>
        </section>

        {/* Pilihan Hemat di Dekatmu */}
        <section className="pl-5 mt-8">
            <h2 className="text-[24px] leading-[32px] font-semibold mb-4 pr-5 text-on-surface">Pilihan Hemat di Dekatmu</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 pr-5 snap-x">
                
                <div className="min-w-[240px] w-[240px] snap-start bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <div className="h-[140px] w-full relative bg-cover bg-center" style={{backgroundImage: "url('/images/carousel/hero3.jpg')"}}>
                        <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur text-primary px-2 py-1 rounded text-[10px] font-bold tracking-wide">
                            TERSEDIA
                        </div>
                        <div className="absolute bottom-2 right-2 bg-tertiary-container text-on-tertiary px-2 py-1 rounded-full text-[12px] flex items-center gap-1">
                            <Clock size={14} className="shrink-0" aria-hidden="true" /> 19:00 - 21:00
                        </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-2">
                        <div>
                            <p className="text-[12px] font-bold text-on-surface-variant flex items-center gap-1">
                                <Store size={14} className="shrink-0" aria-hidden="true" /> Bakery Makmur
                            </p>
                            <h3 className="text-[18px] leading-[28px] font-semibold mt-1 line-clamp-1">Mystery Bag Bakery</h3>
                        </div>
                        <div className="flex items-end justify-between mt-auto pt-2 border-t border-surface-variant">
                            <div>
                                <p className="text-on-surface-variant text-[12px] line-through">Rp 50.000</p>
                                <p className="text-[18px] font-bold text-primary">Rp 20.000</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[12px] font-bold text-tertiary-container bg-tertiary-fixed/30 px-2 py-0.5 rounded-full mb-1">Sisa 3</span>
                                <span className="text-[12px] font-bold text-on-surface-variant flex items-center"><MapPin size={14} className="mr-1 shrink-0" aria-hidden="true" />1.2 km</span>
                            </div>
                        </div>
                        <Link href="/produk/m-1" className="w-full mt-2 py-2 border border-primary text-primary rounded-lg text-[14px] font-semibold hover:bg-primary/5 transition-colors flex justify-center items-center">
                            Lihat Detail
                        </Link>
                    </div>
                </div>

                <div className="min-w-[240px] w-[240px] snap-start bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <div className="h-[140px] w-full relative bg-cover bg-center" style={{backgroundImage: "url('/images/carousel/hero1.jpg')"}}>
                        <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur text-primary px-2 py-1 rounded text-[10px] font-bold tracking-wide">
                            TERSEDIA
                        </div>
                        <div className="absolute bottom-2 right-2 bg-tertiary-container text-on-tertiary px-2 py-1 rounded-full text-[12px] flex items-center gap-1">
                            <Clock size={14} className="shrink-0" aria-hidden="true" /> 18:00 - 20:00
                        </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-2">
                        <div>
                            <p className="text-[12px] font-bold text-on-surface-variant flex items-center gap-1">
                                <Store size={14} className="shrink-0" aria-hidden="true" /> Sayur Segar Jaya
                            </p>
                            <h3 className="text-[18px] leading-[28px] font-semibold mt-1 line-clamp-1">Paket Sayur Mix</h3>
                        </div>
                        <div className="flex items-end justify-between mt-auto pt-2 border-t border-surface-variant">
                            <div>
                                <p className="text-on-surface-variant text-[12px] line-through">Rp 45.000</p>
                                <p className="text-[18px] font-bold text-primary">Rp 15.000</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[12px] font-bold text-tertiary-container bg-tertiary-fixed/30 px-2 py-0.5 rounded-full mb-1">Sisa 5</span>
                                <span className="text-[12px] font-bold text-on-surface-variant flex items-center"><MapPin size={14} className="mr-1 shrink-0" aria-hidden="true" />2.5 km</span>
                            </div>
                        </div>
                        <Link href="/produk/m-2" className="w-full mt-2 py-2 border border-primary text-primary rounded-lg text-[14px] font-semibold hover:bg-primary/5 transition-colors flex justify-center items-center">
                            Lihat Detail
                        </Link>
                    </div>
                </div>

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
                <Image src="/images/logo/mertha-logo.png" alt="Mertha" width={120} height={40} className="h-10 object-contain mb-2" />
                <p className="text-[16px] font-medium text-on-surface-variant max-w-xs">Menyelamatkan makanan, melestarikan bumi.</p>
                <div className="flex gap-4 flex-wrap justify-center">
                    <Link href="/tentang" className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Tentang</Link>
                    <Link href="/bantuan" className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Bantuan</Link>
                    <Link href="/merchant" className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Merchant</Link>
                    <Link href="/privasi" className="text-[12px] font-bold text-on-surface-variant hover:underline hover:text-primary transition-opacity">Privasi</Link>
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
