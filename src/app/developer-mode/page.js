"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function DeveloperModePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [correctPin, setCorrectPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    checkPin();
  }, []);

  const checkPin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: profile } = await supabase.from('profiles').select('pin_code, role').eq('id', user.id).single();
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      alert("Akses Ditolak: Anda tidak memiliki otorisasi untuk mode ini.");
      router.push('/profil');
      return;
    }

    if (profile.pin_code) {
      setCorrectPin(profile.pin_code);
    }
    setLoading(false);
  };

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPinInput(val);
    setPinError('');
    
    if (val.length === 6) {
      if (val === correctPin) {
        activateDeveloperMode();
      } else {
        setPinError('PIN yang Anda masukkan salah.');
        setPinInput('');
      }
    }
  };

  const activateDeveloperMode = () => {
    localStorage.setItem('developer_mode', 'true');
    // Redirect back to profile with a query param to auto-open gear
    setTimeout(() => {
      router.push('/profil?devOpen=true');
    }, 500);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <ShieldAlert size={48} className="text-red-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Warning Background Elements */}
      <div className="absolute inset-0 bg-red-900/20 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 p-6">
        <div className="mt-8 mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center animate-pulse">
            <ShieldAlert size={48} className="text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center text-red-500 mb-2 uppercase tracking-tighter">
          Peringatan Sistem
        </h1>
        <h2 className="text-xl font-bold text-center text-white mb-8">
          Akses Developer Mode
        </h2>

        <div className="space-y-4 bg-red-950/40 p-5 rounded-2xl border border-red-900/50">
          <div className="flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-gray-300">
              <strong className="text-white block mb-1">Akses Langsung Database</strong>
              Mode ini memberikan akses frontend administrator. Perubahan yang Anda lakukan akan langsung mengubah data produksi di Supabase.
            </p>
          </div>
          <div className="flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-gray-300">
              <strong className="text-white block mb-1">Verifikasi Identitas</strong>
              Untuk melanjutkan dan mengaktifkan mode ini, Anda diwajibkan memasukkan 6 digit PIN Keamanan akun Anda.
            </p>
          </div>
        </div>

        <div className="mt-auto pb-10">
          {!correctPin ? (
            <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-2xl text-center">
              <Lock size={32} className="text-red-500 mx-auto mb-3" />
              <p className="text-white font-bold mb-2">Akses Terkunci</p>
              <p className="text-sm text-gray-400 mb-6">Anda belum mengatur PIN Keamanan. Silakan atur terlebih dahulu di menu Pengaturan Aplikasi pada halaman Profil.</p>
              <button 
                onClick={handleCancel}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-500 transition-colors"
              >
                Kembali ke Profil
              </button>
            </div>
          ) : (
            <>
              <p className="text-center text-xs text-red-400 mb-4 font-bold uppercase tracking-widest">
                Masukkan PIN untuk Setuju & Aktifkan
              </p>
              
              <input 
                type="password"
                maxLength="6"
                placeholder="••••••"
                value={pinInput}
                onChange={handlePinChange}
                className="w-full text-center text-4xl tracking-[0.5em] border-2 border-red-900/50 rounded-2xl px-4 py-4 bg-black text-red-500 font-bold focus:outline-none focus:border-red-500 transition-colors shadow-inner"
              />
              {pinError && <p className="text-center text-red-500 text-sm mt-3 font-bold animate-pulse">{pinError}</p>}
              
              <button 
                onClick={handleCancel}
                className="w-full mt-6 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors"
              >
                Batal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
