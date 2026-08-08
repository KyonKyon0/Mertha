"use client";
// Force Recompile

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ShieldAlert, Users, Store, Package, Activity, MapPin, X, Laptop, Clock, Globe, Monitor, Trash2 } from 'lucide-react';
import FloatingTools from '@/components/ui/FloatingTools';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // PIN Lock State
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [correctPin, setCorrectPin] = useState(null);

  // Data states
  const [logs, setLogs] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (isDesktopMode) {
      document.body.classList.remove('max-w-md');
      document.body.classList.add('max-w-full');
    } else {
      document.body.classList.add('max-w-md');
      document.body.classList.remove('max-w-full');
    }
    return () => {
       document.body.classList.add('max-w-md');
       document.body.classList.remove('max-w-full');
    };
  }, [isDesktopMode]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'admin@gmail.com') {
      router.push('/');
      return;
    }
    
    // Check PIN in profiles
    const { data: profile } = await supabase.from('profiles').select('pin_code').eq('id', user.id).single();
    if (profile && profile.pin_code) {
       setCorrectPin(profile.pin_code);
    } else {
       // If no PIN set up, let them in but warn them
       setIsLocked(false);
    }
    
    setIsAdmin(true);
    fetchData();
  };

  const handleUnlock = () => {
    if (pinInput === correctPin) {
      setIsLocked(false);
    } else {
      setPinError('PIN Salah. Coba lagi.');
      setPinInput('');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/data', {
        headers: {
          'x-admin-email': 'admin@gmail.com'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setUsers(data.profiles || []);
        setMerchants(data.merchants || []);
        setProducts(data.products || []);
      } else {
        console.error("Failed to fetch admin data:", await res.text());
      }
    } catch(e) {
      console.error(e);
    }

    setLoading(false);
  };

  const fetchUserLogs = async (userId) => {
    setLoadingUserLogs(true);
    const userSpecificLogs = logs.filter(log => log.user_id === userId);
    setUserLogs(userSpecificLogs);
    setLoadingUserLogs(false);
  };

  const openUserDetail = (u) => {
    setSelectedUser(u);
    fetchUserLogs(u.id);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 animate-pulse font-mono">Verifying credentials...</div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="bg-[#111] border border-[#333] p-8 rounded-3xl w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
          <ShieldAlert size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Peringatan Sistem</h2>
          
          {!correctPin ? (
            <>
              <p className="text-red-400 text-sm mb-6 font-bold">AKSES DITOLAK: PIN BELUM DIATUR</p>
              <p className="text-gray-400 text-xs mb-8">Demi keamanan tingkat tinggi, Anda diwajibkan mengatur PIN 6 Digit di halaman Profil sebelum mengakses dasbor ini.</p>
              <button onClick={() => router.push('/profil')} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors">
                Kembali ke Profil
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-8">Masukkan 6 Digit PIN Keamanan</p>
              
              <input 
                type="password"
                maxLength="6"
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinInput(val);
                  setPinError('');
                }}
                className="w-full text-center text-3xl tracking-[0.5em] border border-[#333] rounded-xl px-4 py-4 bg-[#1a1a1a] text-yellow-500 font-bold focus:outline-none focus:border-yellow-500 transition-colors mb-2"
              />
              {pinError && <p className="text-red-500 text-xs mb-4">{pinError}</p>}
              
              <button 
                onClick={handleUnlock}
                disabled={pinInput.length !== 6}
                className="w-full mt-6 bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-colors"
              >
                Buka Akses
              </button>
              
              <button onClick={() => router.push('/')} className="mt-4 text-xs text-gray-500 hover:text-white">Batal</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleDeleteMerchant = async (id) => {
    if(!confirm("Yakin ingin menghapus Toko ini?")) return;
    await supabase.from('merchants').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteProduct = async (id) => {
    if(!confirm("Yakin ingin menghapus Produk ini?")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (selectedUser?.email === 'admin@gmail.com' && newRole !== 'super_admin') {
      alert("Super Admin utama (admin@gmail.com) tidak bisa diubah rolenya!");
      return;
    }
    
    if (newRole === 'super_admin' && selectedUser?.email !== 'admin@gmail.com') {
      alert("Hanya admin@gmail.com yang bisa menjadi Super Admin!");
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', userId, role: newRole, adminEmail: 'admin@gmail.com' })
      });
      if (res.ok) {
        alert("Role berhasil diubah!");
        fetchData();
        setSelectedUser({...selectedUser, role: newRole});
      } else {
        const err = await res.json();
        alert("Gagal mengubah role: " + err.error);
      }
    } catch(e) {
      alert("Terjadi kesalahan.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (selectedUser?.email === 'admin@gmail.com') {
      alert("Super Admin utama tidak bisa dihapus!");
      return;
    }
    
    if(!confirm(`PERINGATAN KERAS! Anda yakin ingin menghapus permanen akun ${selectedUser?.name}? Seluruh data terkait akun ini akan hilang dan tidak bisa dikembalikan!`)) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', userId, adminEmail: 'admin@gmail.com' })
      });
      if (res.ok) {
        alert("Akun berhasil dihapus permanen!");
        setSelectedUser(null);
        fetchData();
      } else {
        const err = await res.json();
        alert("Gagal menghapus akun: " + err.error);
      }
    } catch(e) {
      alert("Terjadi kesalahan.");
    }
  };

  const renderDeviceMeta = (metaStr) => {
    try {
      const meta = JSON.parse(metaStr);
      return (
        <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded"><Globe size={10}/> {meta.language}</span>
          <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded"><Laptop size={10}/> {meta.screen}</span>
          <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded"><Clock size={10}/> {meta.timezone}</span>
          {meta.connection !== 'unknown' && <span className="bg-[#222] px-1.5 py-0.5 rounded">{meta.connection}</span>}
        </div>
      );
    } catch(e) {
      return <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{metaStr}</div>;
    }
  };


  const toolItems = [
    { label: 'Analitik Pengguna', icon: <Users size={18} />, onClick: () => setActiveTab('users') },
    { label: 'Live Login Logs', icon: <Activity size={18} />, onClick: () => setActiveTab('logs') },
    { label: 'Database Toko', icon: <Store size={18} />, onClick: () => setActiveTab('merchants') },
    { label: 'Database Produk', icon: <Package size={18} />, onClick: () => setActiveTab('products') },
    { label: 'Kembali ke Beranda', icon: <ShieldAlert size={18} />, onClick: () => router.push('/'), isSpecial: true }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono w-full">
      
      {/* Header */}
      <div className="border-b border-[#333] p-6 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-40 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 text-yellow-500 font-bold text-xl md:text-2xl">
            <ShieldAlert size={32} className="animate-pulse" />
            <span>SUPER ADMIN DASHBOARD</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Akses mutlak ke seluruh inti data aplikasi.</p>
        </div>
        
        <button 
          onClick={() => setIsDesktopMode(!isDesktopMode)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isDesktopMode ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}
          title="Toggle Desktop Mode"
        >
          <Monitor size={20} className="mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{isDesktopMode ? 'Desktop' : 'Mobile'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-yellow-500 animate-pulse">
             <ShieldAlert size={48} className="mb-4 opacity-50" />
             Loading intel...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl text-white font-bold mb-6 flex items-center gap-2"><Users size={20} className="text-yellow-500"/> Analitik Intelijen Pengguna</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(u => {
                    const userLogins = logs.filter(l => l.user_id === u.id);
                    const lastLogin = userLogins[0];
                    return (
                      <button 
                        key={u.id} 
                        onClick={() => openUserDetail(u)}
                        className="bg-[#111] border border-[#333] p-5 rounded-2xl text-left hover:border-yellow-500/50 hover:bg-[#1a1a1a] transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>
                        <div className="font-bold text-white text-lg">{u.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{u.phone || 'No phone'}</div>
                        
                        <div className="mt-4 pt-4 border-t border-[#222] space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Total Akses</span>
                            <span className="font-bold text-yellow-500">{userLogins.length} kali</span>
                          </div>
                          {lastLogin && (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">IP Terakhir</span>
                                <span className="text-blue-400 font-mono">{lastLogin.ip_address}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Waktu Terakhir</span>
                                <span className="text-gray-300">{new Date(lastLogin.created_at).toLocaleDateString('id-ID')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl text-white font-bold mb-6 flex items-center gap-2"><Activity size={20} className="text-yellow-500"/> Live System Logs</h2>
                <div className="bg-[#111] border border-[#333] rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
                        <tr>
                          <th className="p-4 font-semibold">Waktu</th>
                          <th className="p-4 font-semibold">Email / User</th>
                          <th className="p-4 font-semibold">IP Address</th>
                          <th className="p-4 font-semibold">Lokasi</th>
                          <th className="p-4 font-semibold">Device Metadata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222]">
                        {logs.map(log => (
                          <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                            <td className="p-4 text-green-400 font-medium">{log.email}</td>
                            <td className="p-4 text-blue-400">{log.ip_address}</td>
                            <td className="p-4">
                              {log.location_lat ? (
                                <a href={`https://www.google.com/maps?q=${log.location_lat},${log.location_lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-yellow-500 hover:underline">
                                  <MapPin size={14}/> GPS Aktif
                                </a>
                              ) : (
                                <span className="text-gray-600">Denied</span>
                              )}
                            </td>
                            <td className="p-4">
                               {renderDeviceMeta(log.device_meta)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MERCHANTS TAB */}
            {activeTab === 'merchants' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl text-white font-bold mb-6 flex items-center gap-2"><Store size={20} className="text-yellow-500"/> Master Data: Toko</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {merchants.map(m => (
                    <div key={m.id} className="bg-[#111] border border-[#333] p-5 rounded-2xl flex items-start gap-4 hover:border-[#555] transition-colors">
                      {m.logo_url ? <img src={m.logo_url} className="w-14 h-14 rounded-xl object-cover bg-[#222]" /> : <div className="w-14 h-14 rounded-xl bg-[#222]"></div>}
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg">{m.name}</div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{m.address}</div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-[#222]">
                           <button onClick={() => handleDeleteMerchant(m.id)} className="text-xs text-red-500 hover:text-red-400 font-bold">HAPUS TOKO</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl text-white font-bold mb-6 flex items-center gap-2"><Package size={20} className="text-yellow-500"/> Master Data: Produk</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-[#111] border border-[#333] p-5 rounded-2xl hover:border-[#555] transition-colors flex flex-col">
                      <div className="text-xs text-yellow-500 mb-2 border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 rounded w-fit">{p.merchants?.name}</div>
                      <div className="font-bold text-white text-lg flex-1">{p.name}</div>
                      <div className="flex items-center gap-3 mt-3 bg-[#1a1a1a] p-2 rounded-lg">
                        <span className="text-red-400 line-through text-xs">Rp{p.original_price}</span>
                        <span className="text-green-400 font-bold">Rp{p.price}</span>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#222]">
                        <span className="text-xs text-gray-500">Sisa Stok: <strong className="text-white">{p.stock}</strong></span>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-500 hover:text-red-400 font-bold">HAPUS</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Floating Menu */}
      <FloatingTools items={toolItems} defaultOpen={true} />

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-[#111] border border-[#333] w-full max-w-5xl h-[85vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#0a0a0a]">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users size={24} className="text-yellow-500"/> Buku Riwayat: {selectedUser.name}
                </h2>
                <div className="text-gray-400 text-sm mt-3 flex flex-wrap gap-4 items-center">
                  <span className="bg-[#111] px-2 py-1 rounded border border-[#222]">📧 {selectedUser.email || (userLogs[0] ? userLogs[0].email : 'Tidak ada email')}</span>
                  <span className="bg-[#111] px-2 py-1 rounded border border-[#222]">📱 {selectedUser.phone || 'Tidak ada nomor HP'}</span>
                  <span className="bg-[#111] px-2 py-1 rounded border border-[#222] font-mono text-xs">ID: {selectedUser.id}</span>
                  
                  <div className="flex items-center gap-2 bg-[#222] px-2 py-1 rounded border border-[#333]">
                    <span className="text-xs font-bold text-gray-400 uppercase">Role:</span>
                    <select 
                      value={selectedUser.role || 'user'}
                      onChange={(e) => handleUpdateRole(selectedUser.id, e.target.value)}
                      className="bg-transparent text-yellow-500 font-bold text-xs outline-none cursor-pointer"
                    >
                      <option value="user" className="bg-[#111]">User Biasa</option>
                      <option value="merchant" className="bg-[#111]">Merchant</option>
                      <option value="admin" className="bg-[#111]">Admin</option>
                      <option value="super_admin" className="bg-[#111]">Super Admin</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="flex items-center gap-1 bg-red-900/30 text-red-500 px-2 py-1 rounded border border-red-900 hover:bg-red-900/50 transition-colors text-xs font-bold"
                  >
                    <Trash2 size={12} /> Hapus Akun
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-500 hover:text-white bg-[#222] rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {loadingUserLogs ? (
                <div className="flex items-center justify-center h-full text-yellow-500 animate-pulse">Memuat riwayat...</div>
              ) : (
                <div className="space-y-4">
                  {userLogs.map((log, index) => {
                    let ipLoc = null;
                    try {
                      if (log.device_meta) {
                        const meta = JSON.parse(log.device_meta);
                        if (meta.ip_location) ipLoc = meta.ip_location;
                      }
                    } catch(e) {}

                    return (
                      <div key={log.id} className="bg-[#1a1a1a] border border-[#333] p-5 rounded-2xl flex flex-col md:flex-row gap-6 hover:border-yellow-500/30 transition-colors">
                        <div className="shrink-0 flex flex-col items-center md:items-start">
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Login #{userLogs.length - index}</div>
                          <div className="text-lg font-bold text-white mt-1">{new Date(log.created_at).toLocaleDateString('id-ID')}</div>
                          <div className="text-sm text-yellow-500">{new Date(log.created_at).toLocaleTimeString('id-ID')}</div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* GPS Location */}
                          <div className="space-y-2 border-l border-[#333] pl-4">
                             <div className="text-xs text-gray-500 font-bold tracking-wider">📍 LOKASI GPS (AKURAT)</div>
                             {log.location_lat ? (
                               <a href={`https://www.google.com/maps?q=${log.location_lat},${log.location_lng}`} target="_blank" rel="noreferrer" className="flex flex-col gap-1 text-green-400 bg-green-900/10 border border-green-900/30 px-3 py-2 rounded-lg w-full hover:bg-green-900/20 transition-colors">
                                 <span className="font-bold">Terdeteksi</span>
                                 <span className="text-xs text-green-500 font-mono">{log.location_lat.toFixed(4)}, {log.location_lng.toFixed(4)}</span>
                               </a>
                             ) : (
                               <div className="text-gray-600 bg-[#222] px-3 py-2 rounded-lg w-full text-sm">Akses Ditolak / Tidak Tersedia</div>
                             )}
                          </div>
                          
                          {/* IP Location */}
                          <div className="space-y-2 border-l border-[#333] pl-4">
                             <div className="text-xs text-gray-500 font-bold tracking-wider">🌐 LOKASI JARINGAN / IP</div>
                             <div className="bg-blue-900/10 border border-blue-900/30 px-3 py-2 rounded-lg w-full">
                               <div className="font-mono text-blue-400 font-bold mb-1">{log.ip_address}</div>
                               {ipLoc ? (
                                 <div className="text-xs text-blue-300">
                                   {ipLoc.city}, {ipLoc.region}, {ipLoc.country}<br/>
                                   <span className="text-blue-500/70">{ipLoc.org}</span>
                                 </div>
                               ) : (
                                 <div className="text-xs text-gray-500">Data Lokasi IP Tidak Tersedia</div>
                               )}
                             </div>
                          </div>
                        </div>

                        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-[#333] pt-4 md:pt-0 md:pl-4">
                          <div className="text-xs text-gray-500 mb-2 font-bold tracking-wider">METADATA PERANGKAT</div>
                          {renderDeviceMeta(log.device_meta)}
                        </div>
                      </div>
                    )
                  })}
                  {userLogs.length === 0 && <div className="text-center text-gray-500 py-10">Belum ada riwayat tercatat.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
