"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Camera, Keyboard, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

let isScannerStarting = false;

export default function MerchantScanPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('scan'); // 'scan' | 'manual'
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [merchantId, setMerchantId] = useState(null);
  const merchantIdRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  const scannerRef = useRef(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function checkMerchant() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (data) {
        setMerchantId(data.id);
        merchantIdRef.current = data.id;
      }
    }
    checkMerchant();
  }, [supabase, router]);

  useEffect(() => {
    let isComponentMounted = true;
    let html5QrCode = null;

    if (mode === 'scan' && status === 'idle') {
      if (isScannerStarting) return;
      isScannerStarting = true;

      const readerEl = document.getElementById("reader");
      if (readerEl) readerEl.innerHTML = "";

      html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 280, height: 150 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A
          ]
        },
        (decodedText) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              handleVerifyCode(decodedText);
            }).catch(err => {
              console.error("Failed to stop scanner", err);
              handleVerifyCode(decodedText);
            });
          } else {
            handleVerifyCode(decodedText);
          }
        },
        (error) => {}
      ).then(() => {
        isScannerStarting = false;
        if (!isComponentMounted && html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error(err));
        }
      }).catch((err) => {
        isScannerStarting = false;
        console.error("Failed to start scanner", err);
        if (isComponentMounted) {
          if (html5QrCode) {
            html5QrCode.clear().catch(e => console.error("Error clearing UI", e));
          }
          setMode('manual');
          setMessage('Kamera tidak didukung atau terhalang. Silakan ketik manual.');
          setStatus('idle');
        }
      });

      return () => {
        isComponentMounted = false;
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error(err));
        }
      };
    }
  }, [mode, status]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        setMode('manual'); // Switch to manual mode when cancelled
        isProcessingRef.current = false;
      }).catch(err => console.error(err));
    } else {
      setMode('manual');
      isProcessingRef.current = false;
    }
  };

  const handleVerifyCode = async (codeStr) => {
    const currentMerchantId = merchantIdRef.current || merchantId;
    if (!codeStr || !currentMerchantId) return;
    setStatus('loading');
    
    try {
      const response = await fetch('/api/merchant/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codeStr, merchantId: currentMerchantId })
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Terjadi kesalahan saat verifikasi kode.');
        isProcessingRef.current = false;
        return;
      }

      setStatus('success');
      setMessage(data.message);
      
      // Reset the scanner flag so they can scan again if they want, but redirect after 2 seconds
      setTimeout(() => {
        router.refresh();
        router.push('/merchant');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Gagal memproses kode. Coba lagi.');
      isProcessingRef.current = false;
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode && !isProcessingRef.current) {
      isProcessingRef.current = true;
      handleVerifyCode(manualCode);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm relative z-20">
        <button onClick={() => router.back()} className="text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-900">Verifikasi Pickup</h1>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center">
        {/* Toggle Mode Segmented Control */}
        <div className="bg-gray-100 rounded-full p-1.5 flex mb-8 w-full max-w-sm relative shadow-inner">
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm transition-transform duration-500 ease-out ${mode === 'manual' ? 'translate-x-full left-[6px]' : 'translate-x-0 left-[6px]'}`}
          ></div>
          <button 
            onClick={() => { setMode('scan'); setStatus('idle'); }}
            className={`flex-1 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 z-10 transition-colors duration-300 ${mode === 'scan' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Camera size={18} /> Kamera
          </button>
          <button 
            onClick={() => stopScanner()}
            className={`flex-1 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 z-10 transition-colors duration-300 ${mode === 'manual' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Keyboard size={18} /> Manual
          </button>
        </div>

        {/* Content */}
        <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden">
          <AnimatePresence mode="wait">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-gray-900">Memverifikasi kode...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Kode Valid!</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
              <button onClick={() => { setStatus('idle'); setManualCode(''); if(mode==='scan') setMode('scan'); }} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold active:scale-95 transition-all">
                Scan Kode Lain
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Gagal</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
              <button onClick={() => setStatus('idle')} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold active:scale-95 transition-all">
                Coba Lagi
              </button>
            </div>
          )}

          {status === 'idle' && mode === 'scan' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6 text-center">
                <p className="text-sm font-bold text-gray-900">Arahkan Kamera ke Barcode</p>
                <p className="text-xs text-gray-500 mt-1">Sistem akan memindai secara otomatis.</p>
              </div>
              <div className="relative rounded-2xl overflow-hidden border-4 border-gray-900 bg-black min-h-[250px] shadow-2xl">
                {/* Slow pulsing scan line effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent w-full h-[50px] animate-[scan_3s_ease-in-out_infinite] z-10 pointer-events-none"></div>
                <div id="reader" className="w-full h-full object-cover"></div>
              </div>
            </motion.div>
          )}

          {status === 'idle' && mode === 'manual' && (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onSubmit={handleManualSubmit} 
              className="py-2"
            >
              <div className="mb-6 text-center">
                <p className="text-sm font-bold text-gray-900">Masukkan Kode Pengambilan</p>
                <p className="text-xs text-gray-500 mt-1">Kode unik alfanumerik (6 digit).</p>
              </div>
              
              <input 
                type="text" 
                maxLength="6"
                placeholder="CONTOH"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="w-full text-center text-3xl font-black tracking-widest border-2 border-gray-200 rounded-2xl py-4 focus:outline-none focus:border-amber-500 uppercase bg-gray-50"
              />
              
              <button 
                type="submit" 
                disabled={!manualCode || manualCode.length < 6}
                className="w-full bg-amber-500 text-gray-900 font-bold py-4 rounded-xl mt-6 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Verifikasi Kode
              </button>
            </motion.form>
          )}
          </AnimatePresence>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-50px); }
          50% { transform: translateY(200px); }
          100% { transform: translateY(-50px); }
        }
      `}} />
    </div>
  );
}
