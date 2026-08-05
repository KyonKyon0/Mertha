"use client";

import React, { useState, useEffect, Suspense } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import LocationStatus from '@/components/buyer/LocationStatus';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import ProductCard from '@/components/buyer/ProductCard';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Map as MapIcon, SlidersHorizontal, ChevronDown } from 'lucide-react';

function JelajahiContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(q);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery(q);
  }, [q]);

  const categories = ["Semua", "Roti & Pastry", "Nasi & Lauk", "Minuman", "Sayur & Buah"];

  const dummyProducts = [
    { id: "1", product: "Surprise Bag - Pastry Sisa Hari Hari", merchant: "Toko Roti Makmur", price: 25000, originalPrice: 75000, stock: 2, distance: 1.2, pickupTime: "19:00 - 21:00", imageUrl: "/images/carousel/hero2.jpg" },
    { id: "2", product: "Nasi Campur Ayam (Porsi Besar)", merchant: "Warung Bu Nani", price: 15000, originalPrice: 35000, stock: 5, distance: 2.5, pickupTime: "20:00 - 22:00", imageUrl: "/images/carousel/hero3.jpg" },
    { id: "3", product: "Aneka Buah Potong Segar", merchant: "Supermarket Segar", price: 20000, originalPrice: 40000, stock: 1, distance: 3.1, pickupTime: "18:00 - 20:00", imageUrl: "/images/carousel/hero1.jpg" },
    { id: "4", product: "Paket Sayur Organik", merchant: "Tani Lokal", price: 30000, originalPrice: 60000, stock: 4, distance: 4.0, pickupTime: "17:00 - 19:00", imageUrl: "/images/carousel/hero1.jpg" },
    { id: "5", product: "Donat Sisa (1 Kotak isi 6)", merchant: "Donat Lezat", price: 20000, originalPrice: 50000, stock: 3, distance: 4.5, pickupTime: "21:00 - 22:30", imageUrl: "/images/carousel/hero2.jpg" },
    { id: "6", product: "Sushi Platter", merchant: "Sushi Enak", price: 40000, originalPrice: 100000, stock: 2, distance: 5.2, pickupTime: "20:30 - 22:00", imageUrl: "/images/carousel/hero3.jpg" },
  ];

  const filters = ["Terdekat", "Harga Terendah", "Waktu Pengambilan", "Rating Tertinggi"];

  const createMapUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    return `/jelajahi/peta?${params.toString()}`;
  };

  return (
    <>
      <BuyerHeader showLogo={false} title="Jelajahi" />
      <LocationStatus />
      
      <main className="flex-1 pb-24 flex flex-col min-h-screen">
        <div className="bg-white px-4 py-3 border-b border-mertha-border/50 space-y-3 z-10 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mertha-muted" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari makanan, tempat, atau kategori..." 
              className="w-full bg-mertha-bg rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-mertha-primary/50"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  idx === 0 
                    ? "bg-mertha-primary text-white" 
                    : "bg-white border border-mertha-border text-mertha-subtext hover:bg-mertha-bg"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button className="flex items-center gap-1.5 shrink-0 bg-mertha-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium">
              <SlidersHorizontal size={14} />
              Filter
            </button>
            {filters.map((filter, idx) => (
              <button key={idx} className="flex items-center gap-1 shrink-0 bg-white border border-mertha-border px-3 py-1.5 rounded-lg text-sm font-medium text-mertha-subtext hover:bg-mertha-bg">
                {filter}
                <ChevronDown size={14} className="text-mertha-muted" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative bg-mertha-bg pb-12">
          <div className="p-4 grid grid-cols-2 gap-3">
            {dummyProducts.map((product) => (
              <Link href={`/produk/${product.id}`} key={product.id}>
                <ProductCard {...product} />
              </Link>
            ))}
          </div>
          
          {/* Map FAB */}
          <Link 
            href={createMapUrl()}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-mertha-text text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm z-30 transition-transform active:scale-95"
          >
            <MapIcon size={18} />
            Peta
          </Link>
        </div>
      </main>

      <BottomNavigation />
    </>
  );
}

export default function Jelajahi() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Memuat daftar...</div>}>
      <JelajahiContent />
    </Suspense>
  );
}
