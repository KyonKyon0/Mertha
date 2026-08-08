"use client";

import React, { useState } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import { User, Mail, Phone, MapPin, ChevronRight, Settings, LogOut, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "Carmen",
    email: "carmen@example.com",
    phone: "0812-3456-7890",
    avatar: null
  });

  const handleLogout = () => {
    // Mock logout
    router.push('/login');
  };

  return (
    <>
      <BuyerHeader />
      
      <main className="flex-1 bg-mertha-bg pb-24">
        {/* Profile Header */}
        <section className="bg-white p-6 border-b border-mertha-border mb-2 flex items-center gap-4">
          <div className="w-20 h-20 bg-mertha-primary/10 rounded-full flex items-center justify-center relative overflow-hidden shrink-0">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-mertha-primary" />
            )}
            <div className="absolute bottom-0 w-full h-6 bg-black/40 flex items-center justify-center text-[10px] text-white cursor-pointer">
              Ubah
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-mertha-text">{profile.name}</h1>
            <p className="text-sm text-mertha-subtext">{profile.email}</p>
          </div>
        </section>

        {/* User Data */}
        <section className="bg-white border-y border-mertha-border mb-2">
          <h2 className="text-sm font-bold text-mertha-text px-4 py-3 border-b border-mertha-border bg-mertha-bg">Informasi Pribadi</h2>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-mertha-border">
            <Phone size={20} className="text-mertha-muted shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-mertha-subtext">Nomor Telepon</p>
              <p className="text-sm font-medium text-mertha-text">{profile.phone}</p>
            </div>
            <ChevronRight size={16} className="text-mertha-muted" />
          </div>
          <Link href="/profil/alamat" className="flex items-center gap-3 px-4 py-3 border-b border-mertha-border">
            <MapPin size={20} className="text-mertha-muted shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-mertha-subtext">Alamat Pengiriman/Pencarian</p>
              <p className="text-sm font-medium text-mertha-text">Jl. Sudirman No. 45, Jakarta</p>
            </div>
            <ChevronRight size={16} className="text-mertha-muted" />
          </Link>
        </section>

        {/* Preferences */}
        <section className="bg-white border-y border-mertha-border mb-6">
          <h2 className="text-sm font-bold text-mertha-text px-4 py-3 border-b border-mertha-border bg-mertha-bg">Pengaturan Aplikasi</h2>
          <div className="flex items-center justify-between px-4 py-3 border-b border-mertha-border">
            <span className="text-sm font-medium text-mertha-text">Notifikasi</span>
            <div className="w-10 h-6 bg-mertha-primary rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-mertha-border cursor-pointer">
            <span className="text-sm font-medium text-mertha-text">Bantuan & Pusat Dukungan</span>
            <ChevronRight size={16} className="text-mertha-muted" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer">
            <span className="text-sm font-medium text-mertha-text">Tentang Mertha</span>
            <ChevronRight size={16} className="text-mertha-muted" />
          </div>
        </section>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full bg-white border-y border-mertha-border px-4 py-4 flex items-center justify-center gap-2 text-mertha-error font-bold hover:bg-mertha-error/5 transition-colors">
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </main>

      <BottomNavigation />
    </>
  );
}
