"use client";

import React, { useState, useEffect, useRef } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import { User, Phone, ChevronRight, LogOut, Camera, Bell, HelpCircle, Info, Shield, ShieldCheck, Mail, Key, Star, X, Lock, Home as HomeIcon, Briefcase, Frown, Loader2, Ticket, Settings, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import GlobalLoading from '@/components/ui/GlobalLoading';
import useLocationStore from '@/store/useLocationStore';
import FloatingTools from '@/components/ui/FloatingTools';

export default function ProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    name: "Memuat...",
    email: "memuat...",
    phone: "-",
    address: "-",
    office_address: "-",
    avatar: null,
    id: null,
    is_email_verified: false,
    is_phone_verified: false,
    has_pin: false,
    is_mertha_plus: false
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showModalGlow, setShowModalGlow] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSlideValue, setDeleteSlideValue] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '', office_address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showGlow, setShowGlow] = useState(true);
  const [userCoupons, setUserCoupons] = useState([]);
  
  // PIN State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  
  const handleSavePin = async () => {
    if (pinInput.length !== 6) {
      alert("PIN harus 6 digit angka");
      return;
    }
    
    setPinLoading(true);
    // Hanya simpan pin_code, tidak perlu has_pin sebagai kolom db
    const { error } = await supabase.from('profiles').update({ pin_code: pinInput }).eq('id', profile.id);
    setPinLoading(false);
    
    if (error) {
      alert("Gagal menyimpan PIN. Error: " + error.message);
    } else {
      setProfile({...profile, has_pin: true});
      setShowPinModal(false);
      setPinInput('');
      alert("PIN Keamanan berhasil diatur!");
    }
  };
  
  const [devMode, setDevMode] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  useEffect(() => {
    setDevMode(localStorage.getItem('developer_mode') === 'true');
    if (typeof window !== 'undefined' && window.location.search.includes('devOpen=true')) {
      setDevOpen(true);
      // Clean up URL
      window.history.replaceState({}, '', '/profil');
    }
  }, []);
  
  const { savedLocations, activeLocation } = useLocationStore();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    // Matikan efek glow setelah 3 detik
    const timer = setTimeout(() => setShowGlow(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSafetyModal) {
      setShowModalGlow(true);
      const timer = setTimeout(() => setShowModalGlow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSafetyModal]);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          id: user.id,
          name: profileData.name || user.email.split('@')[0],
          email: user.email,
          phone: profileData.phone || "",
          address: profileData.address || "",
          office_address: profileData.office_address || "",
          avatar: profileData.avatar_url || null,
          is_email_verified: profileData.is_email_verified || false,
          is_phone_verified: profileData.is_phone_verified || false,
          has_pin: profileData.has_pin || false,
          is_mertha_plus: profileData.is_mertha_plus || false
        });
        setEditForm({ 
          phone: profileData.phone || "", 
          address: profileData.address || "",
          office_address: profileData.office_address || ""
        });

        // Sync with global location store using setState to avoid HMR cache issues
        const newSavedLocations = [
          { id: 'rumah', label: 'Rumah', address: profileData.address || '', lat: -6.225014, lng: 106.802223 },
          { id: 'kantor', label: 'Kantor', address: profileData.office_address || '', lat: -6.230784, lng: 106.818464 }
        ];
        
        const nextState = { savedLocations: newSavedLocations };
        
        // Update active location address if it's one of the saved ones
        if (activeLocation && (activeLocation.id === 'rumah' || activeLocation.id === 'kantor')) {
          const updatedActive = newSavedLocations.find(l => l.id === activeLocation.id);
          if (updatedActive) nextState.activeLocation = updatedActive;
        }
        
        useLocationStore.setState(nextState);
      }
      
      // Fetch coupons
      const { data: couponsData } = await supabase
        .from('user_coupons')
        .select('*, coupons(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (couponsData) {
        setUserCoupons(couponsData);
      }
      
      setLoading(false);
    }
    loadProfile();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (res.ok) {
        await supabase.auth.signOut();
        router.push('/login');
      } else {
        alert("Gagal menghapus akun. Silakan coba lagi.");
        setIsDeleting(false);
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
      setIsDeleting(false);
    }
  };

  const handleSlideDelete = (e) => {
    const val = parseInt(e.target.value);
    setDeleteSlideValue(val);
    if (val >= 99 && !isDeleting) {
      handleDeleteAccount();
    }
  };

  const resetSlideDelete = () => {
    if (deleteSlideValue < 99 && !isDeleting) {
      setDeleteSlideValue(0);
    }
  };

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > 400) { height *= 400 / width; width = 400; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setProfile(prev => ({ ...prev, avatar: compressedDataUrl }));
      if (profile.id) {
        await supabase.from('profiles').update({ avatar_url: compressedDataUrl }).eq('id', profile.id);
      }
    } catch (err) {
      alert("Gagal memperbarui foto profil");
    } finally {
      setUploading(false);
    }
  };

  // Demo Magic Toggle Function
  const toggleSafetyState = async (field) => {
    const newValue = !profile[field];
    setProfile(prev => ({ ...prev, [field]: newValue }));
    if (profile.id) {
      await supabase.from('profiles').update({ [field]: newValue }).eq('id', profile.id);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updates = { 
        phone: editForm.phone || null,
        address: editForm.address || null,
        office_address: editForm.office_address || null 
      };
      await supabase.from('profiles').update(updates).eq('id', profile.id);
      
      setProfile(prev => ({ 
        ...prev, 
        phone: editForm.phone || "",
        address: editForm.address || "",
        office_address: editForm.office_address || ""
      }));

      // Sync with global location store using setState
      const newSavedLocations = [
        { id: 'rumah', label: 'Rumah', address: editForm.address || '', lat: -6.225014, lng: 106.802223 },
        { id: 'kantor', label: 'Kantor', address: editForm.office_address || '', lat: -6.230784, lng: 106.818464 }
      ];
      
      const nextState = { savedLocations: newSavedLocations };
      
      if (activeLocation && (activeLocation.id === 'rumah' || activeLocation.id === 'kantor')) {
        const updatedActive = newSavedLocations.find(l => l.id === activeLocation.id);
        if (updatedActive) nextState.activeLocation = updatedActive;
      }
      
      useLocationStore.setState(nextState);

      setShowEditModal(false);
    } catch (err) {
      alert("Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const floatingItems = [
    {
      label: 'Toggle Email Verified',
      icon: <Mail size={18} className={profile.is_email_verified ? "text-green-500" : "text-mertha-primary"} />,
      onClick: () => toggleSafetyState('is_email_verified')
    },
    {
      label: 'Toggle Phone Verified',
      icon: <Phone size={18} className={profile.is_phone_verified ? "text-green-500" : "text-mertha-primary"} />,
      onClick: () => toggleSafetyState('is_phone_verified')
    },
    {
      label: 'Toggle Security PIN',
      icon: <Key size={18} className={profile.has_pin ? "text-green-500" : "text-mertha-primary"} />,
      onClick: () => toggleSafetyState('has_pin')
    },
    {
      label: 'Toggle Mertha Plus',
      icon: <Star size={18} className={profile.is_mertha_plus ? "text-green-500" : "text-mertha-primary"} />,
      onClick: () => toggleSafetyState('is_mertha_plus')
    }
  ];

  // Calculate Account Safety Score
  const safetyScore = (
    (profile.is_email_verified ? 25 : 0) +
    (profile.is_phone_verified ? 25 : 0) +
    (profile.has_pin ? 25 : 0) +
    (profile.is_mertha_plus ? 25 : 0)
  );

  let safetyColor = 'text-red-500';
  let safetyBg = 'bg-red-500';
  let safetyLightBg = 'bg-red-50';
  let safetyText = 'Bahaya';

  if (safetyScore >= 100) {
    safetyColor = 'text-green-500';
    safetyBg = 'bg-green-500';
    safetyLightBg = 'bg-green-50';
    safetyText = 'Aman';
  } else if (safetyScore >= 50) {
    safetyColor = 'text-yellow-500';
    safetyBg = 'bg-yellow-500';
    safetyLightBg = 'bg-yellow-50';
    safetyText = 'Sedang';
  }

  if (loading) return <GlobalLoading fullScreen={true} />;

  return (
    <>
      <BuyerHeader />
      
      <main className="flex-1 bg-mertha-bg pb-24 min-h-screen">
        {/* Profile Header */}
        <section className="bg-white p-6 border-b border-mertha-border mb-3 shadow-sm flex items-center gap-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <div 
            onClick={handleAvatarClick}
            className={`w-24 h-24 bg-mertha-primary/10 rounded-full flex items-center justify-center relative overflow-hidden shrink-0 border-4 border-mertha-primary/20 cursor-pointer group transition-transform ${uploading ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95'}`}
          >
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-mertha-primary" />
            )}
            
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white mb-1" />
              <span className="text-[10px] text-white font-bold tracking-wider">UBAH</span>
            </div>
            {uploading && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                 <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
               </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-mertha-text mb-1 line-clamp-1">{profile.name}</h1>
            <p className="text-sm text-mertha-subtext font-medium line-clamp-1">{profile.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-mertha-success/10 text-mertha-success rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-mertha-success rounded-full animate-pulse"></span>
              Akun Aktif
            </div>
          </div>
        </section>

        {/* Account Safety Card */}
        <section className="mb-4 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="relative p-[3px] overflow-hidden shadow-sm">
            {/* 3-second sweeping border animation - Using conic-gradient and opacity transition for max smoothness */}
            <div 
              className={`absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#10b981_50%,transparent_100%)] animate-[spin_3s_linear_infinite] origin-center transition-opacity duration-1000 ease-in-out ${showGlow ? 'opacity-80' : 'opacity-0'}`} 
            />
            
            <div 
              onClick={() => setShowSafetyModal(true)}
              className="relative bg-white overflow-hidden h-full flex flex-col z-10 border-y border-gray-100 cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition-all"
            >
              {/* Parent Card Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 py-2.5 flex items-center justify-center gap-1.5 border-b border-green-100">
                <Lock size={12} className="text-green-600" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Keamanan Dijamin oleh Mertha</span>
              </div>

              {/* Inner Card (Account Safety) */}
              <div className="p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${safetyLightBg} flex items-center justify-center shrink-0 relative`}>
                  {/* Ping animation for shield (only 1 second) */}
                  {showGlow && safetyScore < 100 && (
                    <span className={`absolute inline-flex h-full w-full rounded-full ${safetyBg} opacity-20 animate-ping`}></span>
                  )}
                  <Shield className={`${safetyColor} ${showGlow ? 'animate-bounce' : ''}`} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-mertha-text truncate">Keamanan Akun</h3>
                    <span className={`font-black shrink-0 ${safetyColor}`}>{safetyScore}%</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${safetyLightBg} ${safetyColor}`}>
                      {safetyText}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${safetyBg} transition-all duration-1000 ease-out`} 
                      style={{ width: `${safetyScore}%` }}
                    />
                  </div>
                </div>
                {/* Detail Chevron (Replaces Button) */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-mertha-muted">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kupon Anda */}
        <section className="bg-white border-y border-mertha-border mb-3 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <div className="flex items-center justify-between px-4 py-3 border-b border-mertha-border bg-mertha-primary/5">
            <h2 className="text-xs font-bold text-mertha-primary uppercase tracking-wider flex items-center gap-2">
              <Ticket size={16} /> Kupon Saya
            </h2>
          </div>
          <div className="p-4">
            {userCoupons.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {userCoupons.map((uc) => (
                  <div key={uc.id} className={`flex items-center justify-between p-3 border rounded-xl ${uc.is_used ? 'border-mertha-border bg-mertha-bg opacity-70' : 'border-mertha-primary/30 bg-mertha-primary/5'}`}>
                    <div>
                      <h4 className={`font-black text-sm ${uc.is_used ? 'text-mertha-subtext' : 'text-mertha-text'}`}>{uc.coupons.code}</h4>
                      <p className="text-xs text-mertha-subtext mt-0.5">{uc.coupons.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${uc.is_used ? 'bg-mertha-border text-mertha-subtext' : 'bg-mertha-primary text-white'}`}>
                      {uc.is_used ? 'Terpakai' : 'Tersedia'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mertha-subtext text-center py-2">Belum ada kupon yang diklaim.</p>
            )}
          </div>
        </section>

        {/* User Data */}
        <section className="bg-white border-y border-mertha-border mb-3 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <div className="flex items-center justify-between px-4 py-3 border-b border-mertha-border bg-mertha-primary/5">
            <h2 className="text-xs font-bold text-mertha-primary uppercase tracking-wider">Informasi Pribadi</h2>
            <button 
              onClick={() => setShowEditModal(true)}
              className="text-xs font-bold text-mertha-primary hover:underline px-3 py-1 bg-mertha-primary/10 rounded-full active:scale-95 transition-all"
            >
              Edit
            </button>
          </div>
          <div className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-mertha-border">
            <div className="w-10 h-10 rounded-full bg-mertha-primary/10 flex items-center justify-center shrink-0">
              <Phone size={18} className="text-mertha-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-mertha-subtext uppercase tracking-wider">Nomor Telepon</p>
              <p className="text-sm font-semibold text-mertha-text mt-0.5">{profile.phone || <span className="text-mertha-error italic">Kosong (Wajib disi)</span>}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-4 py-3.5 border-b border-mertha-border">
            <div className="w-10 h-10 rounded-full bg-mertha-primary/10 flex items-center justify-center shrink-0">
              <HomeIcon size={18} className="text-mertha-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-mertha-subtext uppercase tracking-wider">Alamat Rumah</p>
              <p className="text-sm font-semibold text-mertha-text mt-0.5 line-clamp-1">{profile.address || <span className="text-mertha-error italic">Kosong (Silakan atur alamat)</span>}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-10 h-10 rounded-full bg-mertha-primary/10 flex items-center justify-center shrink-0">
              <Briefcase size={18} className="text-mertha-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-mertha-subtext uppercase tracking-wider">Alamat Kantor</p>
              <p className="text-sm font-semibold text-mertha-text mt-0.5 line-clamp-1">{profile.office_address || <span className="text-mertha-error italic">Kosong (Silakan atur alamat)</span>}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border-y border-mertha-border mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <h2 className="text-xs font-bold text-mertha-primary px-4 py-3 border-b border-mertha-border bg-mertha-primary/5 uppercase tracking-wider">Pengaturan Aplikasi</h2>
          
          <button onClick={() => setShowPinModal(true)} className="w-full flex items-center justify-between px-4 py-4 border-b border-mertha-border hover:bg-mertha-bg transition-colors">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-mertha-subtext" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-mertha-text">PIN Keamanan (6 Digit)</span>
                <span className={`text-[10px] font-bold uppercase ${profile.has_pin ? 'text-mertha-success' : 'text-mertha-error'}`}>
                  {profile.has_pin ? 'Aktif' : 'Belum Diatur'}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-mertha-muted" />
          </button>
          
          <button onClick={() => {
            if (devMode) {
              setDevMode(false);
              localStorage.setItem('developer_mode', 'false');
            } else {
              router.push('/developer-mode');
            }
          }} className="w-full flex items-center justify-between px-4 py-4 border-b border-mertha-border hover:bg-mertha-bg transition-colors">
            <div className="flex items-center gap-3">
              <Settings size={18} className={devMode ? "text-mertha-primary" : "text-mertha-subtext"} />
              <span className={`text-sm font-semibold ${devMode ? 'text-mertha-primary' : 'text-mertha-text'}`}>Developer Mode</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${devMode ? 'bg-mertha-primary' : 'bg-mertha-border'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${devMode ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </button>
          
          <div className="w-full flex items-center justify-between px-4 py-4 border-b border-mertha-border bg-mertha-bg opacity-70">
            <div className="flex items-center gap-3">
              <Store size={18} className="text-mertha-muted" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-mertha-muted">Mode Merchant</span>
                <span className="text-[10px] font-bold text-mertha-subtext uppercase">Up Coming</span>
              </div>
            </div>
            <div className="w-11 h-6 bg-mertha-border/50 rounded-full relative shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>

          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-mertha-border hover:bg-mertha-bg transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-mertha-subtext" />
              <span className="text-sm font-semibold text-mertha-text">Notifikasi</span>
            </div>
            <div className="w-11 h-6 bg-mertha-primary rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-mertha-border hover:bg-mertha-bg transition-colors active:bg-mertha-border/50">
            <div className="flex items-center gap-3">
              <HelpCircle size={18} className="text-mertha-subtext" />
              <span className="text-sm font-semibold text-mertha-text">Bantuan & Pusat Dukungan</span>
            </div>
            <ChevronRight size={18} className="text-mertha-muted" />
          </button>
          
          <Link href="https://oscartambunan.dev/martha" target="_blank" className="flex items-center justify-between px-4 py-4 hover:bg-mertha-bg transition-colors active:bg-mertha-border/50">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-mertha-subtext" />
              <span className="text-sm font-semibold text-mertha-text">Tentang Mertha</span>
            </div>
            <ChevronRight size={18} className="text-mertha-muted" />
          </Link>
        </section>

        {/* Logout */}
        <div className="px-4 mb-2">
          <button onClick={handleLogout} className="w-full bg-white border border-mertha-error/30 rounded-xl px-4 py-4 flex items-center justify-center gap-2 text-mertha-error font-bold hover:bg-mertha-error/5 active:scale-95 transition-all shadow-sm">
            <LogOut size={18} />
            Keluar dari Akun
          </button>
        </div>

        {/* Hapus Akun */}
        <div className="px-4 mb-8">
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-transparent text-mertha-muted text-xs hover:text-mertha-error font-bold py-3 flex items-center justify-center transition-all active:scale-95"
          >
            Hapus Akun Secara Permanen
          </button>
        </div>

      </main>
      
      {/* Floating Magic Demos (Only in Dev Mode) */}
      {devMode && <FloatingTools items={floatingItems} defaultOpen={devOpen} />}

      {/* Safety Modal / Bottom Sheet */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-500 ease-out">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-12 sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-500 ease-out shadow-2xl relative">
            
            {/* Header section with specific glow */}
            <div className="relative border-b border-mertha-border overflow-hidden">
              {/* Soft Header Glow Animation (Smooth fade out) */}
              <div 
                className={`absolute inset-0 transition-opacity duration-[3000ms] ease-out pointer-events-none ${safetyScore >= 100 ? 'bg-green-500/30' : safetyScore >= 50 ? 'bg-yellow-500/30' : 'bg-red-500/30'} ${showModalGlow ? 'opacity-100' : 'opacity-0'}`}
              />
              
              <div className="p-5 flex items-center justify-between relative z-10">
                <h3 className="font-bold text-mertha-text text-lg flex items-center gap-2">
                  <ShieldCheck className={safetyColor} />
                  Detail Keamanan
                </h3>
                <button onClick={() => setShowSafetyModal(false)} className="w-8 h-8 bg-gray-100/80 rounded-full flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              {/* Overall Score */}
              <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gray-50 border border-mertha-border">
                <div>
                  <p className="text-xs font-bold text-mertha-subtext uppercase tracking-wider mb-1">Skor Keamanan</p>
                  <p className={`text-2xl font-black ${safetyColor}`}>{safetyScore}% <span className="text-sm font-semibold text-mertha-text">/ 100%</span></p>
                </div>
                <div className={`w-14 h-14 rounded-full ${safetyBg} flex flex-col items-center justify-center text-white font-bold text-[10px] uppercase shadow-lg shadow-${safetyBg}/30`}>
                  {safetyText}
                </div>
              </div>

              {/* Requirements List */}
              <div className="space-y-4">
                {[
                  { id: 'is_email_verified', label: 'Email Terverifikasi', desc: profile.email, icon: Mail },
                  { id: 'is_phone_verified', label: 'Nomor Telepon', desc: profile.phone, icon: Phone },
                  { id: 'has_pin', label: 'PIN Keamanan', desc: 'Lindungi transaksi Anda', icon: Key },
                  { id: 'is_mertha_plus', label: 'Mertha Plus', desc: 'Langganan fitur eksklusif', icon: Star }
                ].map((item) => {
                  const isDone = profile[item.id];
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <item.icon size={18} className={isDone ? "text-green-500" : "text-gray-400"} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${isDone ? 'text-mertha-text' : 'text-mertha-subtext'}`}>{item.label}</p>
                        <p className="text-xs text-mertha-subtext">{item.desc}</p>
                      </div>
                      <div className="shrink-0">
                        {isDone ? (
                          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Selesai</div>
                        ) : (
                          <button className="px-3 py-1 bg-mertha-primary text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-mertha-primary/90">Atur</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-5 bg-gray-50 border-t border-mertha-border">
              <button onClick={() => setShowSafetyModal(false)} className="w-full py-3.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-in fade-in duration-300 px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="p-5 border-b border-mertha-border flex items-center justify-between">
              <h3 className="font-bold text-mertha-text text-lg">Edit Profil</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 active:scale-95">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-xs font-bold text-mertha-subtext uppercase tracking-wider mb-2" htmlFor="phone">
                  Nomor Telepon (WhatsApp)
                </label>
                <input 
                  id="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Contoh: 08123456789"
                  className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all text-sm font-semibold text-mertha-text"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-mertha-subtext uppercase tracking-wider mb-2" htmlFor="address">
                  Alamat Rumah
                </label>
                <textarea 
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Contoh: Jl. Merpati No. 12, Jakarta Selatan"
                  rows={2}
                  className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all text-sm font-semibold text-mertha-text resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-mertha-subtext uppercase tracking-wider mb-2" htmlFor="office_address">
                  Alamat Kantor
                </label>
                <textarea 
                  id="office_address"
                  value={editForm.office_address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, office_address: e.target.value }))}
                  placeholder="Contoh: Gedung ABC, Jl. Sudirman..."
                  rows={2}
                  className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all text-sm font-semibold text-mertha-text resize-none"
                />
                <p className="text-[10px] text-mertha-subtext mt-1.5 leading-relaxed">
                  *Pilih salah satu alamat (Rumah/Kantor) yang akan digunakan secara default pada saat beranda atau pencarian.
                </p>
              </div>
            </div>
            
            <div className="p-5 bg-gray-50 border-t border-mertha-border flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm">
                Batal
              </button>
              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="flex-1 py-3 bg-mertha-primary text-white font-bold rounded-xl hover:bg-mertha-primary/90 active:scale-95 transition-all shadow-md shadow-mertha-primary/30 text-sm disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-2"
              >
                {isSaving ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Simpan...</>
                ) : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal / Bottom Sheet */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500 ease-out px-4 pb-4">
          <div className="bg-white w-full sm:w-[400px] rounded-3xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500 ease-out shadow-2xl relative text-center">
            
            <div className="p-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
                 <Frown size={40} />
              </div>
              <h3 className="font-bold text-mertha-text text-xl mb-2">Hapus Akun?</h3>
              <p className="text-sm text-mertha-subtext mb-8 leading-relaxed">
                Kami sangat sedih jika kehilangan Anda. <br/>
                <span className="font-bold text-red-500">Semua riwayat, alamat, dan data yang tersambung ke akun ini akan dihapus permanen.</span>
              </p>

              {/* Slider UI */}
              <div className="relative w-full h-14 bg-gray-50 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                {/* Track Background filling up */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-red-500 transition-all duration-75"
                  style={{ width: `${deleteSlideValue}%` }}
                />
                
                {/* Instruction Text */}
                <span className={`absolute inset-0 flex items-center justify-center font-bold text-sm pointer-events-none transition-opacity ${deleteSlideValue > 10 ? 'opacity-0' : 'text-gray-400'}`}>
                  Geser untuk menghapus
                </span>
                <span className={`absolute inset-0 flex items-center justify-center font-bold text-sm text-white pointer-events-none transition-opacity ${deleteSlideValue > 10 ? 'opacity-100' : 'opacity-0'}`}>
                  Lepaskan untuk Batal
                </span>

                {/* Range Input (invisible interaction layer) */}
                <input 
                  type="range"
                  min="0" max="100"
                  value={deleteSlideValue}
                  onChange={handleSlideDelete}
                  onMouseUp={resetSlideDelete}
                  onTouchEnd={resetSlideDelete}
                  disabled={isDeleting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />

                {/* Thumb Visual */}
                <div 
                  className="absolute top-1 bottom-1 w-12 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 pointer-events-none z-10"
                  style={{ left: `calc(${deleteSlideValue}% - (${deleteSlideValue} * 52px / 100) + 4px)` }}
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin text-red-500" /> : <ChevronRight size={24} />}
                </div>
              </div>
              
              <button 
                onClick={() => setShowDeleteModal(false)} 
                disabled={isDeleting} 
                className="w-full mt-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
              >
                Batal & Kembali
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pb-20 sm:pb-0 px-4">
          <div className="bg-white w-full sm:w-[400px] sm:rounded-3xl rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-300 relative flex flex-col p-8 text-center">
            <div className="w-16 h-16 bg-mertha-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-mertha-primary">
              <Lock size={32} />
            </div>
            <h3 className="font-bold text-mertha-text text-xl mb-2">
              {profile.has_pin ? 'Ubah PIN Keamanan' : 'Atur PIN Keamanan'}
            </h3>
            <p className="text-sm text-mertha-subtext mb-8">
              Masukkan 6 digit angka untuk melindungi akses fitur sensitif Anda.
            </p>
            
            <div className="space-y-6">
              <input 
                type="password" 
                maxLength="6"
                placeholder="••••••"
                className="w-full text-center text-4xl tracking-[0.5em] border-2 border-mertha-border rounded-2xl px-4 py-4 focus:outline-none focus:border-mertha-primary bg-gray-50 text-mertha-primary font-bold shadow-inner"
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinInput(val);
                }}
              />
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                  }} 
                  className="flex-1 bg-gray-100 text-mertha-text font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  disabled={pinLoading || pinInput.length !== 6}
                  onClick={handleSavePin}
                  className="flex-1 bg-mertha-primary text-white font-bold py-3.5 rounded-2xl hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  {pinLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </>
  );
}

