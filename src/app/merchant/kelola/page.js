"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, Plus, Search, Edit2, Trash2, Camera, X, ChevronDown, ChevronUp, AlertTriangle, Image as ImageIcon, Recycle, HeartHandshake, Clock } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import SlideToConfirm from '@/components/ui/SlideToConfirm';

export default function KelolaListing() {
  const [products, setProducts] = useState([]);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    original_price: '',
    price: '',
    stock: '',
    pickup_start: '',
    pickup_end: '',
    image: null,
    gallery: [],
    advanceMode: false,
    unsoldAction: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: merchantData } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (merchantData) {
      setMerchant(merchantData);
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantData.id)
        .order('created_at', { ascending: false });

      if (productsData) setProducts(productsData);
    }
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image using canvas to avoid giant base64 strings crashing the db
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg
          setForm(prev => ({ ...prev, image: compressedBase64 }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + form.gallery.length > 5) {
      alert('Maksimal 5 foto tambahan diperbolehkan.');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setForm(prev => ({ ...prev, gallery: [...prev.gallery, compressedBase64] }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index) => {
    setForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleCurrencyChange = (e, field) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setForm({...form, [field]: ''});
      return;
    }
    const formatted = parseInt(rawValue, 10).toLocaleString('id-ID');
    setForm({...form, [field]: formatted});
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let finalDescription = form.description;
      if (form.advanceMode && form.unsoldAction) {
        const actionText = form.unsoldAction === 'panti' ? 'Diserahkan ke Lembaga ABDF (Panti/Yayasan)' : 'Dijual ke Pengepul (Pupuk/Maggot)';
        finalDescription += `\n\n[Advanced Mode: Jika tidak laku, barang akan ${actionText}]`;
      }
      
      // 1. Insert product
      const formatTimeAsTimestamp = (timeString) => {
        if (!timeString) return null;
        const [hours, minutes] = timeString.split(':');
        const d = new Date();
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        // Using local ISO string to prevent timezone offset issues for same day
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, -1);
        return localISOTime;
      };

      const generatedSlug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-5);
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          merchant_id: merchant.id,
          name: form.name,
          slug: generatedSlug,
          description: finalDescription,
          original_price: parseFloat(form.original_price.replace(/\./g, '')),
          price: parseFloat(form.price.replace(/\./g, '')),
          stock: parseInt(form.stock, 10),
          pickup_start: formatTimeAsTimestamp(form.pickup_start),
          pickup_end: formatTimeAsTimestamp(form.pickup_end),
          image_url: form.image || merchant?.logo_url || '/images/mertha-logo.png',
          gallery_urls: form.gallery,
          is_active: true
        }])
        .select()
        .single();

      if (productError) throw productError;

      setShowAddModal(false);
      setForm({ name: '', description: '', original_price: '', price: '', stock: '', pickup_start: '', pickup_end: '', image: null, gallery: [], advanceMode: false, unsoldAction: '' });
      fetchData();
    } catch (error) {
      alert('Gagal menambah produk: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        await supabase.from('products').delete().eq('id', id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus produk: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-xl font-black text-gray-900 mb-1">Kelola Listing</h1>
        <p className="text-sm text-gray-500">Atur ketersediaan dan tambah porsi baru</p>
      </div>

      <div className="px-6 mt-4">
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Cari produk..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-amber-500 text-sm"
          />
          <Search size={18} className="text-gray-400 absolute left-4 top-3.5" />
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 mb-6 shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
        >
          <Plus size={20} />
          Tambah Produk
        </button>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">Belum ada produk yang ditambahkan.</p>
            </div>
          ) : (
            products.map((product) => (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className={clsx("bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 transition-all cursor-pointer hover:shadow-md hover:border-amber-200", !product.is_active && "opacity-60")}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-400" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleActive(product.id, product.is_active); }}
                        className={clsx("w-10 h-5 rounded-full relative transition-colors", product.is_active ? 'bg-amber-500' : 'bg-gray-300')}
                      >
                        <div className={clsx("w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all", product.is_active ? 'right-0.5' : 'left-0.5')}></div>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-amber-600">Rp {product.price.toLocaleString('id-ID')}</span>
                      <span className="text-xs text-gray-400 line-through">Rp {product.original_price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md">Stok: {product.stock}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); alert("Fitur edit akan segera hadir!"); }} className="w-7 h-7 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white w-full h-[92vh] rounded-t-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
              <h3 className="font-black text-gray-900 text-xl tracking-tight">Tambah Produk Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <motion.form 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} 
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    "w-full h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300",
                    form.image ? "border-amber-500 bg-amber-50/50" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                  )}
                >
                  {form.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-gray-900">
                        <Camera size={26} />
                      </div>
                      <p className="text-base font-black text-gray-900">Unggah Tas atau Bungkus</p>
                      <p className="text-xs text-gray-500 mt-1 px-4 text-center">Opsional. Jika kosong akan menggunakan logo Mertha.</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Produk</label>
                <input required type="text" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none" placeholder="Contoh: Mystery Bag Bakery" />
              </motion.div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi Produk</label>
                <textarea required value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none" placeholder="Deskripsikan isi dan kondisi..."></textarea>
              </div>

              {/* Gallery Multi-Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Foto Isi Makanan (Opsional, Max 5)</label>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {form.gallery.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-200 snap-start">
                      <img src={img} alt="Isi Makanan" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><X size={14} /></button>
                    </div>
                  ))}
                  {form.gallery.length < 5 && (
                    <div 
                      onClick={() => document.getElementById('galleryInput').click()}
                      className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-amber-500 transition-colors snap-start"
                    >
                      <ImageIcon size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">Tambah</span>
                    </div>
                  )}
                  <input id="galleryInput" type="file" multiple onChange={handleGalleryChange} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Asli</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-bold text-gray-500">Rp</span>
                    <input required type="text" value={form.original_price} onChange={e => handleCurrencyChange(e, 'original_price')} className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 focus:outline-none" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Jual</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-bold text-amber-700">Rp</span>
                    <input required type="text" value={form.price} onChange={e => handleCurrencyChange(e, 'price')} className="w-full border border-amber-200 bg-amber-50/30 rounded-xl pl-12 pr-4 py-3 focus:border-amber-500 focus:outline-none text-amber-900 font-bold" placeholder="0" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stok Harian</label>
                <input required type="number" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none" placeholder="Jumlah porsi" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Waktu Ambil (Mulai)</label>
                  <input required type="time" value={form.pickup_start} onChange={e=>setForm({...form, pickup_start: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Waktu Ambil (Selesai)</label>
                  <input required type="time" value={form.pickup_end} onChange={e=>setForm({...form, pickup_end: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none" />
                </div>
              </div>

              {/* Advanced Mode Accordion */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <button 
                  type="button"
                  onClick={() => setForm({...form, advanceMode: !form.advanceMode})}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2">Advance Mode</span>
                  {form.advanceMode ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                <AnimatePresence>
                  {form.advanceMode && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 py-4 border-t border-gray-200 bg-white"
                    >
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3">Tindakan jika barang tidak laku:</p>
                      <div className="space-y-4">
                        <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${form.unsoldAction === 'pengepul' ? 'border-amber-500 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="mt-1">
                            <input 
                              type="radio" 
                              name="unsoldAction" 
                              value="pengepul" 
                              checked={form.unsoldAction === 'pengepul'}
                              onChange={() => setForm({...form, unsoldAction: 'pengepul'})}
                              className="w-5 h-5 text-amber-500 focus:ring-amber-500 border-gray-300 accent-amber-500" 
                            />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <Recycle size={20} />
                          </div>
                          <div>
                            <span className="text-sm font-black text-gray-900 block mb-1">Jual ke Pengepul (Pupuk / Maggot)</span>
                            <p className="text-xs text-gray-500 leading-relaxed">Sisa makanan akan dikonversi menjadi pakan atau pupuk kompos. Sangat ramah lingkungan.</p>
                          </div>
                        </label>
                        
                        <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${form.unsoldAction === 'panti' ? 'border-amber-500 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="mt-1">
                            <input 
                              type="radio" 
                              name="unsoldAction" 
                              value="panti" 
                              checked={form.unsoldAction === 'panti'}
                              onChange={() => setForm({...form, unsoldAction: 'panti'})}
                              className="w-5 h-5 text-amber-500 focus:ring-amber-500 border-gray-300 accent-amber-500" 
                            />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <HeartHandshake size={20} />
                          </div>
                          <div>
                            <span className="text-sm font-black text-gray-900 block mb-1">Serahkan ke Lembaga ABDF</span>
                            <p className="text-xs text-gray-500 leading-relaxed">Sisa makanan akan didonasikan ke lembaga sosial ABDF untuk diteruskan ke panti dan yang membutuhkan.</p>
                          </div>
                        </label>
                      </div>

                      {form.unsoldAction === 'panti' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-bold text-red-700 leading-tight">
                            Peringatan: Untuk donasi panti, makanan harus memiliki batas waktu minimal lebih dari satu hari sebelum kedaluwarsa.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>

            <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
              <SlideToConfirm 
                onConfirm={handleSubmit} 
                isLoading={isSubmitting} 
                text="Simpan Produk" 
                successText="Menyimpan..." 
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Product Overview Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-h-[92vh] rounded-t-[2rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
                <h3 className="font-black text-gray-900 text-xl tracking-tight">Detail Produk</h3>
                <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="w-full aspect-square bg-gray-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-amber-600">Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
                      <span className="text-sm text-gray-400 line-through">Rp {selectedProduct.original_price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {selectedProduct.gallery_urls && selectedProduct.gallery_urls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Kondisi Makanan</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                        {selectedProduct.gallery_urls.map((img, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden shrink-0 snap-start border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Waktu Pengambilan</p>
                      <p className="text-sm font-black text-gray-900">
                        {new Date(selectedProduct.pickup_start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedProduct.pickup_end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Deskripsi Produk</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
