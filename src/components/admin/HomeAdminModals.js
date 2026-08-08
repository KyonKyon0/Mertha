import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X, Trash2, Store, Ticket, Newspaper, MapPin, Image as ImageIcon, UploadCloud } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false });

export default function HomeAdminModals({
  activeModal,
  setActiveModal,
  onSuccess
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState([]);

  // Map state
  const [showMap, setShowMap] = useState(false);

  // Kupon State
  const [kuponForm, setKuponForm] = useState({ code: '', title: '', description: '', discount_percent: 10 });

  // Produk State
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({ 
    merchantId: '', 
    newMerchantName: '',
    merchantLogoFile: null, // FILE OBJECT
    lat: null, 
    lng: null,
    productName: '', 
    productImageFile: null, // FILE OBJECT
    description: 'Pilihan hemat lezat dan segar.', 
    originalPrice: 20000, 
    discountPrice: 10000, 
    pickupStart: '15:00', 
    pickupEnd: '17:00',
    stock: 5
  });

  // Preview state for UI
  const [previewMerchantLogo, setPreviewMerchantLogo] = useState('');
  const [previewProductImage, setPreviewProductImage] = useState('');

  // Impact State
  const [impactNews, setImpactNews] = useState([]);
  const [impactForm, setImpactForm] = useState({ id: null, title: '', category: '', description: '', icon_type: 'Sprout' });

  useEffect(() => {
    if (activeModal === 'add_product') {
      fetchMerchants();
    }
    if (activeModal === 'delete_product') {
      fetchProducts();
    }
    if (activeModal === 'edit_impact') {
      fetchImpacts();
    }
  }, [activeModal]);

  const fetchMerchants = async () => {
    const { data } = await supabase.from('merchants').select('id, name').order('name');
    if (data) setMerchants(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, merchants(name)')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchImpacts = async () => {
    const { data } = await supabase.from('impact_news').select('*').order('created_at', { ascending: false });
    if (data) setImpactNews(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setKuponForm({ code: '', title: '', description: '', discount_percent: 10 });
    setProductForm({ 
      merchantId: '', newMerchantName: '', merchantLogoFile: null, lat: null, lng: null, productName: '', productImageFile: null, description: 'Pilihan hemat lezat dan segar.', originalPrice: 20000, discountPrice: 10000, pickupStart: '15:00', pickupEnd: '17:00', stock: 5
    });
    setPreviewMerchantLogo('');
    setPreviewProductImage('');
    setImpactForm({ id: null, title: '', category: '', description: '', icon_type: 'Sprout' });
  };

  // Upload helper
  const uploadImageToSupabase = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
    if (error) {
      console.error("Upload error:", error);
      throw new Error("Gagal mengunggah gambar: " + error.message);
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  };

  const handleAddKupon = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('coupons').insert({
        code: kuponForm.code.toUpperCase(),
        title: kuponForm.title,
        description: kuponForm.description,
        discount_percent: parseInt(kuponForm.discount_percent)
      });
      if (error) throw error;
      alert("Kupon berhasil ditambahkan!");
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Gagal menambah kupon: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!productForm.merchantId) {
        throw new Error("Silakan pilih toko atau buat toko baru.");
      }

      // 1. Upload Images to Supabase Storage if files exist
      let finalMerchantLogoUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop';
      let finalProductImageUrl = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop';

      if (productForm.merchantId === 'new' && productForm.merchantLogoFile) {
         const uploadedUrl = await uploadImageToSupabase(productForm.merchantLogoFile);
         if (uploadedUrl) finalMerchantLogoUrl = uploadedUrl;
      }

      if (productForm.productImageFile) {
         const uploadedUrl = await uploadImageToSupabase(productForm.productImageFile);
         if (uploadedUrl) finalProductImageUrl = uploadedUrl;
      }

      // 2. Create Merchant if 'new'
      let finalMerchantId = productForm.merchantId;
      
      if (productForm.merchantId === 'new') {
        const { data: newMerchant, error: merchantErr } = await supabase
          .from('merchants')
          .insert({
            name: productForm.newMerchantName,
            address: productForm.lat ? `Lokasi Peta (${productForm.lat.toFixed(2)}, ${productForm.lng.toFixed(2)})` : 'Alamat Belum Diatur',
            lat: productForm.lat || null,
            lng: productForm.lng || null,
            latitude: productForm.lat || null,
            longitude: productForm.lng || null,
            is_active: true,
            logo_url: finalMerchantLogoUrl
          })
          .select('id')
          .single();
          
        if (merchantErr) throw merchantErr;
        finalMerchantId = newMerchant.id;
      }

      // 3. Get random category (just for demo purposes)
      const { data: categories } = await supabase.from('categories').select('id').limit(1);
      const categoryId = categories && categories.length > 0 ? categories[0].id : null;

      // 4. Create Product
      const { data: newProd, error: productErr } = await supabase
        .from('products')
        .insert({
          merchant_id: finalMerchantId,
          category_id: categoryId,
          name: productForm.productName,
          description: productForm.description,
          price: productForm.discountPrice, // Using 'price' column for actual price
          original_price: productForm.originalPrice,
          sale_price: productForm.discountPrice, // Fallback if schema uses sale_price
          stock: productForm.stock,
          initial_stock: productForm.stock,
          pickup_time_start: productForm.pickupStart + ':00',
          pickup_time_end: productForm.pickupEnd + ':00',
          is_active: true,
          image_url: finalProductImageUrl
        })
        .select('id')
        .single();

      if (productErr) throw productErr;

      // 5. Create Product Image mapping
      await supabase.from('product_images').insert({
          product_id: newProd.id,
          image_url: finalProductImageUrl,
          is_primary: true
      });

      alert("Produk berhasil ditambahkan!");
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Gagal menambah produk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    setLoading(true);
    try {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Gagal menghapus produk");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImpact = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (impactForm.id) {
        await supabase.from('impact_news').update({
          title: impactForm.title,
          category: impactForm.category,
          description: impactForm.description,
          icon_type: impactForm.icon_type
        }).eq('id', impactForm.id);
      } else {
        await supabase.from('impact_news').insert({
          title: impactForm.title,
          category: impactForm.category,
          description: impactForm.description,
          icon_type: impactForm.icon_type
        });
      }
      fetchImpacts();
      setImpactForm({ id: null, title: '', category: '', description: '', icon_type: 'Sprout' });
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Gagal menyimpan kabar impact");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImpact = async (id) => {
    if (!confirm("Hapus kabar ini?")) return;
    try {
      await supabase.from('impact_news').delete().eq('id', id);
      fetchImpacts();
      if (onSuccess) onSuccess();
    } catch (err) {}
  };

  if (!activeModal) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full sm:w-[450px] sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-mertha-border flex justify-between items-center bg-mertha-bg shrink-0">
            <h2 className="font-bold text-mertha-text flex items-center gap-2">
              {activeModal === 'add_kupon' && <><Ticket size={18} /> Tambah Kupon</>}
              {activeModal === 'add_product' && <><Store size={18} /> Tambah Produk</>}
              {activeModal === 'delete_product' && <><Trash2 size={18} /> Hapus Produk</>}
              {activeModal === 'edit_impact' && <><Newspaper size={18} /> Edit Kabar Impact</>}
            </h2>
            <button onClick={closeModal} className="p-1 rounded-full hover:bg-black/5 text-mertha-muted">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            {/* Add Kupon */}
            {activeModal === 'add_kupon' && (
              <form onSubmit={handleAddKupon} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-mertha-subtext">Kode Kupon</label>
                  <input required type="text" value={kuponForm.code} onChange={e=>setKuponForm({...kuponForm, code: e.target.value})} className="w-full border p-2 rounded-lg mt-1 uppercase" placeholder="Contoh: MERTHA50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-mertha-subtext">Judul</label>
                  <input required type="text" value={kuponForm.title} onChange={e=>setKuponForm({...kuponForm, title: e.target.value})} className="w-full border p-2 rounded-lg mt-1" placeholder="Contoh: Diskon 50%" />
                </div>
                <div>
                  <label className="text-xs font-bold text-mertha-subtext">Deskripsi</label>
                  <textarea required value={kuponForm.description} onChange={e=>setKuponForm({...kuponForm, description: e.target.value})} className="w-full border p-2 rounded-lg mt-1" rows="2" placeholder="Contoh: Khusus pengguna baru" />
                </div>
                <div>
                  <label className="text-xs font-bold text-mertha-subtext">Diskon (%)</label>
                  <input required type="number" value={kuponForm.discount_percent} onChange={e=>setKuponForm({...kuponForm, discount_percent: e.target.value})} className="w-full border p-2 rounded-lg mt-1" min="1" max="100" />
                </div>
                <button disabled={loading} type="submit" className="w-full bg-mertha-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90">{loading ? 'Menyimpan...' : 'Simpan Kupon'}</button>
              </form>
            )}

            {/* Add Product */}
            {activeModal === 'add_product' && (
              <form onSubmit={handleAddProduct} className="space-y-4">
                {/* Store Section */}
                <div className="p-4 bg-mertha-bg rounded-xl border border-mertha-border mb-4 shadow-inner">
                  <label className="text-xs font-bold text-mertha-subtext block mb-2">1. Pilih Toko (Merchant)</label>
                  <select 
                    required 
                    value={productForm.merchantId} 
                    onChange={e => setProductForm({...productForm, merchantId: e.target.value})}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    <option value="" disabled>-- Pilih Toko yang Terdaftar --</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    <option value="new" className="font-bold text-mertha-primary">[+] Tambah Toko Baru...</option>
                  </select>

                  {/* New Store Fields */}
                  {productForm.merchantId === 'new' && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase">Nama Toko Baru</label>
                        <input required type="text" value={productForm.newMerchantName} onChange={e=>setProductForm({...productForm, newMerchantName: e.target.value})} className="w-full border p-2 rounded-lg text-sm mt-1" placeholder="Nama Toko" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase flex items-center gap-1 mb-1"><ImageIcon size={12}/> Unggah Logo Toko (Opsional)</label>
                        <div className="flex items-center gap-3">
                          {previewMerchantLogo ? (
                            <img src={previewMerchantLogo} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-400">
                              <ImageIcon size={20} />
                            </div>
                          )}
                          <label className="flex-1 cursor-pointer bg-white border border-mertha-border p-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                            <UploadCloud size={16} className="text-mertha-primary" />
                            <span className="text-xs font-bold text-mertha-text">{productForm.merchantLogoFile ? 'Ganti Foto' : 'Pilih dari Galeri'}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => {
                                const file = e.target.files[0];
                                if(file) {
                                  setProductForm({...productForm, merchantLogoFile: file});
                                  setPreviewMerchantLogo(URL.createObjectURL(file));
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <button type="button" onClick={() => setShowMap(true)} className="w-full flex items-center justify-center gap-2 bg-white border border-mertha-primary text-mertha-primary text-xs font-bold py-2.5 rounded-lg hover:bg-mertha-primary/5 transition-colors shadow-sm mt-2">
                          <MapPin size={16} /> 
                          {productForm.lat ? 'Ubah Lokasi di Peta' : 'Atur Lokasi di Peta'}
                        </button>
                        {productForm.lat && (
                          <p className="text-[10px] text-mertha-success text-center mt-1.5 font-semibold">📍 Lokasi Terpilih ({productForm.lat.toFixed(4)}, {productForm.lng.toFixed(4)})</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Section */}
                <div className="pt-2 border-t border-mertha-border">
                  <label className="text-xs font-bold text-mertha-subtext block mb-2">2. Detail Produk</label>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-mertha-subtext uppercase">Nama Barang</label>
                      <input required type="text" value={productForm.productName} onChange={e=>setProductForm({...productForm, productName: e.target.value})} className="w-full border p-2 rounded-lg text-sm mt-1" placeholder="Contoh: Roti Keju Sisa" />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-mertha-subtext uppercase flex items-center gap-1 mb-1"><ImageIcon size={12}/> Unggah Foto Produk (Opsional)</label>
                      <div className="flex items-center gap-3">
                        {previewProductImage ? (
                          <img src={previewProductImage} alt="Product" className="w-16 h-12 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-dashed border-gray-300 text-gray-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer bg-white border border-mertha-border p-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                          <UploadCloud size={16} className="text-mertha-primary" />
                          <span className="text-xs font-bold text-mertha-text">{productForm.productImageFile ? 'Ganti Foto' : 'Pilih dari Galeri'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files[0];
                              if(file) {
                                setProductForm({...productForm, productImageFile: file});
                                setPreviewProductImage(URL.createObjectURL(file));
                              }
                            }} 
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase">Harga Asli (Rp)</label>
                        <input required type="number" value={productForm.originalPrice} onChange={e=>setProductForm({...productForm, originalPrice: e.target.value})} className="w-full border p-2 rounded-lg text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase text-mertha-primary">Harga Diskon (Rp)</label>
                        <input required type="number" value={productForm.discountPrice} onChange={e=>setProductForm({...productForm, discountPrice: e.target.value})} className="w-full border-2 border-mertha-primary/30 bg-mertha-primary/5 p-2 rounded-lg text-sm mt-1 font-bold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase">Stok</label>
                        <input required type="number" value={productForm.stock} onChange={e=>setProductForm({...productForm, stock: e.target.value})} className="w-full border p-2 rounded-lg text-sm mt-1" min="1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase">Jam Mulai</label>
                        <input required type="time" value={productForm.pickupStart} onChange={e=>setProductForm({...productForm, pickupStart: e.target.value})} className="w-full border p-2 rounded-lg text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-mertha-subtext uppercase">Jam Akhir</label>
                        <input required type="time" value={productForm.pickupEnd} onChange={e=>setProductForm({...productForm, pickupEnd: e.target.value})} className="w-full border p-2 rounded-lg text-sm mt-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-mertha-primary text-white font-bold py-3.5 rounded-xl hover:bg-opacity-90 mt-4 shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Mengunggah & Menyimpan...' : 'Simpan Produk'}
                </button>
              </form>
            )}

            {/* Delete Product */}
            {activeModal === 'delete_product' && (
              <div className="space-y-3">
                {products.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-mertha-bg transition-colors">
                    <div>
                      <h4 className="font-bold text-sm text-mertha-text line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-mertha-subtext">Toko: {p.merchants?.name}</p>
                    </div>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-mertha-error hover:bg-mertha-error/10 rounded-lg shrink-0 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {products.length === 0 && <p className="text-center text-sm text-mertha-subtext py-4">Tidak ada produk ditemukan.</p>}
              </div>
            )}

            {/* Edit Impact */}
            {activeModal === 'edit_impact' && (
              <div className="space-y-6">
                <form onSubmit={handleSaveImpact} className="space-y-4 border p-4 rounded-xl bg-mertha-bg">
                  <h3 className="font-bold text-sm text-mertha-text">{impactForm.id ? 'Edit Kabar' : 'Tambah Kabar Baru'}</h3>
                  <div>
                    <label className="text-xs font-bold text-mertha-subtext">Kategori</label>
                    <input required type="text" value={impactForm.category} onChange={e=>setImpactForm({...impactForm, category: e.target.value})} className="w-full border p-2 rounded-lg mt-1" placeholder="Contoh: Climate Action" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-mertha-subtext">Judul</label>
                    <input required type="text" value={impactForm.title} onChange={e=>setImpactForm({...impactForm, title: e.target.value})} className="w-full border p-2 rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-mertha-subtext">Deskripsi</label>
                    <textarea required value={impactForm.description} onChange={e=>setImpactForm({...impactForm, description: e.target.value})} className="w-full border p-2 rounded-lg mt-1" rows="2" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-mertha-subtext">Ikon</label>
                    <select value={impactForm.icon_type} onChange={e=>setImpactForm({...impactForm, icon_type: e.target.value})} className="w-full border p-2 rounded-lg mt-1 bg-white">
                      <option value="Sprout">Sprout (Daun)</option>
                      <option value="Recycle">Recycle (Daur Ulang)</option>
                      <option value="Apple">Apple (Apel)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {impactForm.id && <button type="button" onClick={() => setImpactForm({ id: null, title: '', category: '', description: '', icon_type: 'Sprout' })} className="flex-1 bg-gray-200 font-bold py-2 rounded-xl text-sm">Batal</button>}
                    <button disabled={loading} type="submit" className="flex-1 bg-mertha-primary text-white font-bold py-2 rounded-xl text-sm">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-mertha-text">Daftar Kabar</h3>
                  {impactNews.map(n => (
                    <div key={n.id} className="flex items-start justify-between p-3 border rounded-xl hover:bg-mertha-bg transition-colors">
                      <div>
                        <span className="text-[10px] font-bold text-mertha-primary">{n.category}</span>
                        <h4 className="font-bold text-sm text-mertha-text leading-tight">{n.title}</h4>
                      </div>
                      <div className="flex gap-2 shrink-0 items-center h-full">
                        <button onClick={() => setImpactForm(n)} className="text-xs font-bold text-mertha-primary hover:underline">Edit</button>
                        <button onClick={() => handleDeleteImpact(n.id)} className="text-xs font-bold text-mertha-error hover:underline">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMap && (
        <MapPicker 
          initialPosition={productForm.lat ? { lat: productForm.lat, lng: productForm.lng } : null}
          onConfirm={(pos) => {
            setProductForm({ ...productForm, lat: pos.lat, lng: pos.lng });
            setShowMap(false);
          }}
          onCancel={() => setShowMap(false)}
        />
      )}
    </>
  );
}
