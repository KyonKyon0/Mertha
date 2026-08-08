"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, AlertTriangle, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// --- Slide to Confirm Component ---
function SlideToConfirm({ onConfirm, disabled, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const startDrag = (e) => {
    if (disabled || isLoading || isConfirmed) return;
    setIsDragging(true);
  };

  const onDrag = (e) => {
    if (!isDragging || !containerRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(0, Math.min(clientX - containerRect.left, containerRect.width));
    setSlideWidth(newWidth);

    if (newWidth >= containerRect.width * 0.9) {
      setIsDragging(false);
      setIsConfirmed(true);
      setSlideWidth(containerRect.width);
      onConfirm();
    }
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!isConfirmed) setSlideWidth(0); // bounce back
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchmove', onDrag);
      window.addEventListener('touchend', endDrag);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-14 w-full rounded-xl overflow-hidden shadow-sm transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'} bg-mertha-bg border border-mertha-border`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 bg-mertha-success/20 transition-all"
        style={{ width: isConfirmed ? '100%' : slideWidth + 'px', transitionDuration: isDragging ? '0ms' : '300ms' }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-sm font-bold transition-all ${isConfirmed ? 'text-mertha-success opacity-0' : 'text-mertha-muted'}`}>
          Geser untuk Kirim Komplain
        </span>
      </div>
      <button
        ref={buttonRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className={`absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-white border border-mertha-border rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-transform ${isConfirmed ? 'border-mertha-success' : ''}`}
        style={{ transform: `translateX(${isConfirmed ? containerRef.current?.getBoundingClientRect().width - 64 : slideWidth}px)`, transitionDuration: isDragging ? '0ms' : '300ms' }}
      >
        {isConfirmed ? (
          <Check size={20} className="text-mertha-success" />
        ) : (
          <ChevronRight size={20} className="text-mertha-primary" />
        )}
      </button>
      
      {isConfirmed && isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-5 h-5 border-2 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

export default function RefundPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;
  
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [base64Images, setBase64Images] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkExistingRefund = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('refunds')
          .select('id')
          .eq('order_id', orderId)
          .eq('user_id', user.id)
          .single();

        if (data && data.id) {
          // Refund already submitted, redirect to review page
          router.replace(`/refund/${orderId}/review`);
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        // If no row found, it will throw an error, which is fine (means not submitted yet)
        setIsChecking(false);
      }
    };
    checkExistingRefund();
  }, [orderId, router, supabase]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3 - files.length);
      
      // Keep object URLs for preview
      const newFileUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setFiles(prev => [...prev, ...newFileUrls]);

      // Convert to Base64 for the API
      const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 512;
            const MAX_HEIGHT = 512;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height *= MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width *= MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Compress heavily to avoid 413 Payload Too Large
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          };
          img.onerror = reject;
          img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newBase64s = await Promise.all(selectedFiles.map(file => toBase64(file)));
      setBase64Images(prev => [...prev, ...newBase64s]);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Send all data to API — server handles AI call + DB writes with service role
      const res = await fetch('/api/ai/food-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user.id,
          reason,
          // Images are now heavily compressed (max ~30-50KB each) so they can safely be sent
          images: base64Images
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "API responded with error");
      }

      // Success! Redirect directly to the order details page to see the AI result inline
      router.replace(`/pesanan/${orderId}`);
      
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan: " + err.message);
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col pb-safe">
      {/* FULL SCREEN AI LOADING ANIMATION */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-mertha-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-mertha-primary/10 rounded-full animate-pulse flex items-center justify-center">
              <ShieldCheck size={40} className="text-mertha-primary" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-mertha-text mb-2 tracking-wide">AI Sedang Memeriksa</h2>
          <p className="text-sm text-mertha-subtext text-center max-w-[280px]">
            Sistem kami sedang menganalisis foto dan keluhan Anda. Mohon tunggu...
          </p>
        </div>
      )}

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
            Refund hanya berlaku jika makanan basi, berjamur, atau sangat tidak layak. AI akan memverifikasi keaslian bukti foto secara otomatis.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-mertha-text mb-2">
              Apa masalah pada makanan ini?
            </label>
            <textarea 
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Roti sudah berjamur hijau di bagian bawah..."
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

          <div className="pt-6 border-t border-mertha-border">
            <SlideToConfirm 
              onConfirm={handleConfirmSubmit} 
              disabled={reason.length < 5 || files.length === 0}
              isLoading={isSubmitting}
            />
            <p className="text-[11px] text-center text-mertha-subtext mt-3 font-medium">
              Saya menyatakan bahwa informasi yang saya berikan adalah benar. Laporan palsu dapat menyebabkan pemblokiran akun.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
