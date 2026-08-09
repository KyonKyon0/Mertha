"use client";

import React, { useState, useEffect, Suspense } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import LocationStatus from '@/components/buyer/LocationStatus';
import GlobalLoading from '@/components/ui/GlobalLoading';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import ProductCard from '@/components/buyer/ProductCard';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Map as MapIcon, SlidersHorizontal, ChevronDown, Store, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import FloatingTools from '@/components/ui/FloatingTools';
import HomeAdminModals from '@/components/admin/HomeAdminModals';

function JelajahiContent() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'Semua';
  
  const [searchQuery, setSearchQuery] = useState(q);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [devMode, setDevMode] = useState(false);
  const [activeAdminModal, setActiveAdminModal] = useState(null);

  useEffect(() => {
    setDevMode(typeof window !== 'undefined' && localStorage.getItem('developer_mode') === 'true');
  }, []);

  const categories = ["Semua", "Mystery Bag", "Roti & Pastry", "Nasi & Lauk", "Sayur & Buah", "Minuman"];
  const filters = ["Terdekat", "Harga Terendah", "Waktu Pengambilan", "Rating Tertinggi"];

  useEffect(() => {
    setTimeout(() => setSearchQuery(q), 0);
  }, [q]);

  useEffect(() => {
    setTimeout(() => setActiveCategory(searchParams.get('category') || 'Semua'), 0);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          merchants (name, logo_url, address),
          categories (name),
          product_images (image_url)
        `)
        .eq('is_active', true);

      const { data, error } = await query;
      
      if (data) {
        let filtered = data;
        
        if (q) {
          const lowerQ = q.toLowerCase();
          filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(lowerQ)) || 
            (p.merchants?.name && p.merchants.name.toLowerCase().includes(lowerQ))
          );
        }

        if (activeCategory !== 'Semua') {
           filtered = filtered.filter(p => p.categories?.name === activeCategory);
        }
        
        const formatTime = (isoString) => {
          if (!isoString) return '??:??';
          return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        };

        // Map to expected ProductCard format
        const formattedProducts = filtered.map(p => ({
           id: p.id,
           slug: p.slug || p.id, // Fallback to id if slug is missing
           product: p.name,
           merchant: p.merchants?.name,
           price: p.price,
           originalPrice: p.original_price,
           stock: p.stock,
           distance: 1.2, // Dummy distance for now
           pickupTime: p.pickup_start 
             ? `${formatTime(p.pickup_start)} - ${formatTime(p.pickup_end)} WIB`
             : `${p.pickup_time_start?.substring(0,5) || '??:??'} - ${p.pickup_time_end?.substring(0,5) || '??:??'} WIB`,
           imageUrl: p.product_images?.[0]?.image_url || p.image_url || "/images/logo/mertha-logo.png"
        }));
        setProducts(formattedProducts);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [q, activeCategory, activeAdminModal]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrl(searchQuery, activeCategory);
  };

  const handleCategoryClick = (cat) => {
    updateUrl(searchQuery, cat);
  };

  const updateUrl = (query, cat) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (cat && cat !== 'Semua') params.set('category', cat);
    router.push(`/jelajahi?${params.toString()}`);
  };

  const createMapUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    return `/jelajahi/peta?${params.toString()}`;
  };

  return (
    <>
      <BuyerHeader />
      <LocationStatus />
      
      <main className="flex-1 pb-24 flex flex-col min-h-screen">
        <div className="bg-white px-4 py-3 border-b border-mertha-border/50 space-y-3 z-10 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mertha-muted" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari makanan, tempat, atau kategori..." 
              className="w-full bg-mertha-bg rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-mertha-primary/50"
            />
          </form>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-mertha-primary text-white shadow-sm" 
                    : "bg-white border border-mertha-border text-mertha-subtext hover:bg-mertha-primary/5 hover:text-mertha-primary"
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
          {loading ? (
             <div className="flex flex-col items-center justify-center min-h-[50vh]"><GlobalLoading fullScreen={false} /></div>
          ) : products.length === 0 ? (
             <div className="p-8 text-center text-mertha-subtext">Tidak ada produk ditemukan.</div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              {products.map((product, index) => (
                <Link 
                  href={`/produk/${product.slug}`} 
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both hover:-translate-y-1 transition-transform"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard {...product} />
                </Link>
              ))}
            </div>
          )}
          
          {/* Map FAB */}
          <Link 
            href={createMapUrl()}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-mertha-text text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm z-30 transition-all hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-8 fade-in duration-500 delay-300 fill-mode-both hover:bg-mertha-primary"
          >
            <MapIcon size={18} />
            Peta
          </Link>
        </div>
      </main>

      <HomeAdminModals 
        activeModal={activeAdminModal} 
        setActiveModal={setActiveAdminModal}
        onSuccess={() => setActiveAdminModal(null)}
      />
      
      {devMode && (
        <FloatingTools 
          items={[
            { label: 'Tambah Produk', icon: <Store size={18} />, onClick: () => setActiveAdminModal('add_product') },
            { label: 'Hapus Produk', icon: <Trash2 size={18} />, onClick: () => setActiveAdminModal('delete_product'), danger: true },
          ]} 
        />
      )}

      <BottomNavigation />
    </>
  );
}

export default function Jelajahi() {
  return (
    <Suspense fallback={<GlobalLoading fullScreen={true} />}>
      <JelajahiContent />
    </Suspense>
  );
}
