"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';

export default function RefundPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;
  
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, we would upload to Supabase Storage here or keep references
      const newFiles = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // MOCK API CALL for AI Analysis
      const res = await fetch('/api/ai/food-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          reason,
          // We'd send real images to Gemini, but here we just mock
          images: files.length > 0 ? files : ["dummy_base64_image_data"]
        })
      });

      const data = await res.json();
      console.log("AI Analysis Result:", data);
      
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses komplain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-mertha-bg min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-mertha-success/10 rounded-full flex items-center justify-center mb-4">
          <FileCheck size={32} className="text-mertha-success" />
        </div>
        <h1 className="text-xl font-bold text-mertha-text mb-2">Komplain Terkirim</h1>
        <p className="text-sm text-mertha-subtext mb-8">
          Sistem AI kami sedang menganalisis bukti yang Anda kirimkan. Anda akan menerima notifikasi hasil review dalam waktu maksimal 1x24 jam.
        </p>
        <button 
          onClick={() => router.push(`/pesanan/${orderId}`)}
          className="w-full bg-mertha-primary text-white font-bold py-3.5 rounded-xl"
        >
          Kembali ke Detail Pesanan
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col pb-safe">
      <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-mertha-border sticky top-0 z-40">
        <button onClick={() => router.back()} className="text-mertha-text">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-mertha-text">Pengajuan Refund</h1>
      </header>

      <main className="flex-1 p-4">
        <div className="bg-mertha-error/5 border border-mertha-error/20 p-3 rounded-xl flex items-start gap-3 mb-6">
          <AlertTriangle size={20} className="text-mertha-error shrink-0 mt-0.5" />
          <p className="text-xs text-mertha-error leading-relaxed">
            Refund hanya berlaku jika makanan yang diterima basi, berjamur, atau tidak sesuai deskripsi. AI kami akan memverifikasi bukti foto Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-mertha-text mb-2">
              Apa masalah pada makanan ini?
            </label>
            <textarea 
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Roti sudah berjamur di bagian bawah..."
              className="w-full bg-mertha-bg border border-mertha-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 min-h-[100px]"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-mertha-text mb-2">
              Unggah Bukti Foto (Wajib)
            </label>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              {files.map((file, i) => (
                <div key={i} className="aspect-square bg-mertha-bg rounded-lg overflow-hidden relative border border-mertha-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file} alt="Bukti" className="w-full h-full object-cover" />
                </div>
              ))}
              {files.length < 3 && (
                <label className="aspect-square bg-mertha-bg border border-mertha-border border-dashed rounded-lg flex flex-col items-center justify-center text-mertha-muted cursor-pointer hover:bg-mertha-bg/80 transition-colors">
                  <UploadCloud size={24} className="mb-1" />
                  <span className="text-[10px] font-medium">Tambah Foto</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-mertha-subtext">Maksimal 3 foto. Pastikan foto terang dan jelas.</p>
          </div>

          <div className="pt-4 border-t border-mertha-border">
            <button 
              type="submit" 
              disabled={isSubmitting || reason.length < 5 || files.length === 0}
              className="w-full bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95 shadow-lg shadow-mertha-primary/30"
            >
              <ShieldCheck size={18} />
              {isSubmitting ? 'Menganalisis...' : 'Kirim Komplain'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
