"use client";

import React, { useEffect, useState } from 'react';
import { Store, User } from 'lucide-react';
import clsx from 'clsx';

export default function RoleSwitchLoader({ isVisible, toRole = 'merchant' }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setStage(1);
      const t1 = setTimeout(() => setStage(2), 500);
      const t2 = setTimeout(() => setStage(3), 1500);
      const t3 = setTimeout(() => setStage(4), 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setStage(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0A1A14]">
      {/* Background glowing effects */}
      <div 
        className={clsx(
          "absolute w-[500px] h-[500px] rounded-full blur-[100px] bg-[#12B76A]/20 transition-all duration-1000",
          stage >= 2 ? "scale-150 opacity-50" : "scale-50 opacity-0"
        )}
      />
      <div 
        className={clsx(
          "absolute w-[300px] h-[300px] rounded-full blur-[80px] bg-[#FDB022]/20 transition-all duration-1000 delay-300",
          stage >= 3 ? "scale-150 opacity-40" : "scale-50 opacity-0"
        )}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Icon morphing transition */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          <div 
            className={clsx(
              "absolute inset-0 rounded-full border-2 border-[#12B76A] border-t-transparent animate-spin transition-opacity duration-500",
              stage >= 1 && stage < 4 ? "opacity-100" : "opacity-0"
            )}
          />
          <div 
            className={clsx(
              "absolute transition-all duration-700 transform",
              stage < 2 ? "opacity-100 scale-100" : "opacity-0 scale-50 rotate-90"
            )}
          >
            {toRole === 'merchant' ? <User size={40} className="text-white" /> : <Store size={40} className="text-white" />}
          </div>
          <div 
            className={clsx(
              "absolute transition-all duration-700 transform",
              stage >= 2 ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
            )}
          >
            {toRole === 'merchant' ? <Store size={40} className="text-[#12B76A]" /> : <User size={40} className="text-[#12B76A]" />}
          </div>
        </div>

        {/* Text transition */}
        <div className="h-10 relative flex justify-center items-center overflow-hidden w-64">
          <h2 
            className={clsx(
              "absolute text-xl font-bold text-white transition-all duration-500 transform",
              stage < 2 ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
            )}
          >
            Menyimpan Profil...
          </h2>
          <h2 
            className={clsx(
              "absolute text-xl font-bold text-white transition-all duration-500 transform",
              stage >= 2 && stage < 3 ? "translate-y-0 opacity-100" : (stage < 2 ? "translate-y-10 opacity-0" : "-translate-y-10 opacity-0")
            )}
          >
            {toRole === 'merchant' ? 'Mengaktifkan Mode Merchant...' : 'Menonaktifkan Mode Merchant...'}
          </h2>
          <h2 
            className={clsx(
              "absolute text-xl font-bold text-[#12B76A] transition-all duration-500 transform",
              stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            )}
          >
            {toRole === 'merchant' ? 'Selamat Datang!' : 'Kembali ke Beranda!'}
          </h2>
        </div>
      </div>
    </div>
  );
}
