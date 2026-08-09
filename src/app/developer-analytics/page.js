"use client";
// Force Recompile

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ShieldAlert, Users, Store, Package, Activity, MapPin, X, Laptop, Clock, Globe, Terminal, Trash2, Database } from 'lucide-react';
import FloatingTools from '@/components/ui/FloatingTools';
import TradingChart from '@/components/ui/TradingChart';
import NetworkTopologyMap from '@/components/ui/NetworkTopologyMap';
import RoleBadge from '@/components/ui/RoleBadge';

const Skeleton = ({ className }) => <div className={`animate-pulse bg-yellow-500/10 rounded-xl ${className}`}></div>;

const AnalyticsCard = ({ children, className = "", noPadding = false }) => (
  <div className={`relative rounded-3xl overflow-hidden border border-[#333] shadow-xl bg-[#050505] ${className}`}>
    <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 pointer-events-none" style={{backgroundImage: "url('/images/analytics/bg_analytics.jpg')"}}></div>
    <div className="absolute inset-0 z-0 bg-[#050505]/70 pointer-events-none backdrop-blur-[2px]"></div>
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#050505]/90 pointer-events-none"></div>
    <div className={`relative z-10 h-full flex flex-col ${noPadding ? '' : 'p-6'}`}>
      {children}
    </div>
  </div>
);

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // PIN Lock State
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [correctPin, setCorrectPin] = useState(null);

  // Data states
  const [logs, setLogs] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('activeUsers');

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    document.body.classList.remove('max-w-md');
    document.body.classList.add('w-full', 'max-w-full');
    
    return () => {
       document.body.classList.add('max-w-md');
       document.body.classList.remove('w-full', 'max-w-full');
    };
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.email !== 'oss.tam1137@gmail.com') {
      router.push('/');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('admin_pin').eq('id', user.id).single();
    if (profile?.admin_pin) {
       setCorrectPin(profile.admin_pin);
    } else {
       setIsLocked(false);
    }
    
    setIsAdmin(true);
    fetchData(user.email);
  };

  const handleUnlock = () => {
    if (pinInput === correctPin) {
      setIsLocked(false);
    } else {
      setPinError('PIN Salah. Coba lagi.');
      setPinInput('');
    }
  };

  const fetchData = async (email = 'oss.tam1137@gmail.com') => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-email': email }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setUsers(data.profiles || []);
        setMerchants(data.merchants || []);
        setProducts(data.products || []);
        setOrders(data.orders || []);
        setApiLogs(data.api_logs || []);
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
    try {
      const { data, error } = await supabase
        .from('login_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (!error) setUserLogs(data);
    } catch(e) {
      console.error(e);
    }
    setLoadingUserLogs(false);
  };

  const openUserDetail = (u) => {
    setSelectedUser(u);
    fetchUserLogs(u.id);
  };

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
    if (selectedUser?.email === 'oss.tam1137@gmail.com' && newRole !== 'super_admin') {
      alert("Super Admin utama tidak bisa diubah rolenya!");
      return;
    }
    if (newRole === 'super_admin' && selectedUser?.email !== 'oss.tam1137@gmail.com') {
      alert("Hanya oss.tam1137@gmail.com yang bisa menjadi Super Admin!");
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', userId, role: newRole, adminEmail: 'oss.tam1137@gmail.com' })
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
    if (selectedUser?.email === 'oss.tam1137@gmail.com') {
      alert("Super Admin utama tidak bisa dihapus!");
      return;
    }
    if(!confirm(`PERINGATAN KERAS! Anda yakin ingin menghapus permanen akun ${selectedUser?.name}? Seluruh data terkait akun ini akan hilang dan tidak bisa dikembalikan!`)) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', userId, adminEmail: 'oss.tam1137@gmail.com' })
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

  const formattedApiLogs = apiLogs.map(l => {
    let color = 'text-blue-400';
    if (l.method === 'POST') color = 'text-green-400';
    if (l.method === 'PUT' || l.method === 'PATCH') color = 'text-yellow-500';
    if (l.method === 'DELETE') color = 'text-red-500';

    const totalMs = l.duration_ms;
    const nextjsMs = Math.floor(Math.random() * 5) + 2;
    const proxyMs = Math.floor(Math.random() * 150) + 10;
    const appCodeMs = Math.max(1, totalMs - nextjsMs - proxyMs);

    return {
      id: l.id,
      time: new Date(l.created_at),
      method: l.method,
      endpoint: l.endpoint,
      desc: `${l.method} ${l.endpoint} ${l.status_code} in ${totalMs}ms (next.js: ${nextjsMs}ms, proxy.ts: ${proxyMs}ms, application-code: ${appCodeMs}ms)`,
      color: color
    };
  });

  const getChartData = () => {
    const countsByDate = {};
    if (selectedMetric === 'activeUsers') {
      logs.forEach(log => {
        const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      });
    } else {
      orders.forEach(order => {
        const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      });
    }

    let data = Object.keys(countsByDate)
      .map(date => ({ name: date, value: countsByDate[date] }))
      .reverse();

    if (data.length < 15) {
      let base = selectedMetric === 'activeUsers' ? 50 : 10;
      const dummyData = [];
      for (let i = 0; i < 30; i++) {
        base = base + (Math.random() * (selectedMetric === 'activeUsers' ? 20 : 5) - (selectedMetric === 'activeUsers' ? 10 : 2));
        dummyData.push({ name: `08/${i+1}`, value: Math.max(0, Math.floor(base)) });
      }
      data = [...dummyData, ...data];
    }
    return data;
  };
  
  const chartData = getChartData();
  const metricOptions = [
    { value: 'activeUsers', label: 'Active Users' },
    { value: 'transactions', label: 'Total Transaksi' }
  ];

  const renderDeviceMeta = (metaStr) => {
    try {
      const meta = JSON.parse(metaStr);
      return (
        <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded border border-[#333]"><Globe size={10}/> {meta.language}</span>
          <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded border border-[#333]"><Laptop size={10}/> {meta.screen}</span>
          <span className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded border border-[#333]"><Clock size={10}/> {meta.timezone}</span>
          {meta.connection !== 'unknown' && <span className="bg-[#222] px-1.5 py-0.5 rounded border border-[#333]">{meta.connection}</span>}
        </div>
      );
    } catch(e) {
      return <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{metaStr}</div>;
    }
  };

  const toolItems = [
    { label: 'Overview', icon: <Activity size={18} />, onClick: () => setActiveTab('overview') },
    { label: 'Analitik Pengguna', icon: <Users size={18} />, onClick: () => setActiveTab('users') },
    { label: 'Database Toko', icon: <Store size={18} />, onClick: () => setActiveTab('merchants') },
    { label: 'Database Produk', icon: <Package size={18} />, onClick: () => setActiveTab('products') },
    { label: 'Kembali ke Beranda', icon: <ShieldAlert size={18} />, onClick: () => router.push('/'), isSpecial: true }
  ];

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

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-gray-300 font-mono w-full overflow-x-hidden md:h-screen md:overflow-hidden md:flex">
      {/* Global Dotted Background */}
      <div className="absolute inset-0 z-0 bg-dotted-dark opacity-50 pointer-events-none" />

      {/* SIDEBAR (Desktop Only) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#111]/90 backdrop-blur-2xl border-r border-[#333] z-10 p-6 shadow-2xl h-full relative">
        <h1 className="text-2xl font-black text-white flex items-center gap-3 mb-8">
          <ShieldAlert className="text-yellow-500 shrink-0" size={32} />
          <span className="leading-tight">Dev<br/>Analytics</span>
        </h1>
        
        <nav className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {toolItems.map(item => (
            <button 
              key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                (activeTab === 'overview' && item.label === 'Overview') ||
                (activeTab === 'users' && item.label === 'Analitik Pengguna') ||
                (activeTab === 'merchants' && item.label === 'Database Toko') ||
                (activeTab === 'products' && item.label === 'Database Produk')
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-inner' 
                  : item.isSpecial 
                    ? 'mt-auto bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30' 
                    : 'hover:bg-[#222] text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col z-10 h-full overflow-y-auto custom-scrollbar">
        {/* Header Mobile */}
        <div className="md:hidden border-b border-[#333] p-4 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-40">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="text-yellow-500" size={24} /> Dev Analytics
            </h1>
            <button onClick={() => router.push('/')} className="p-2 bg-[#222] rounded-lg text-gray-400">
              <X size={20} />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-2 mt-4 pb-2 custom-scrollbar">
            {toolItems.filter(i => !i.isSpecial).map(item => (
              <button 
                key={item.label} onClick={item.onClick} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  (activeTab === 'overview' && item.label === 'Overview') ||
                  (activeTab === 'users' && item.label === 'Analitik Pengguna') ||
                  (activeTab === 'merchants' && item.label === 'Database Toko') ||
                  (activeTab === 'products' && item.label === 'Database Produk')
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                    : 'bg-[#222] text-gray-400'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto pb-32 md:pb-8">
          <div className="space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* TRADING CHART CARD */}
                <AnalyticsCard noPadding>
                  {loading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <TradingChart 
                      data={chartData} 
                      title={selectedMetric === 'activeUsers' ? "Active Users Detected" : "Total Transactions"} 
                      dataKey="value" 
                      xAxisKey="name" 
                      metricOptions={metricOptions}
                      selectedMetric={selectedMetric}
                      onMetricChange={setSelectedMetric}
                    />
                  )}
                </AnalyticsCard>

                {/* 4 INFO CARDS & TOPOLOGY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* ECOSYSTEM CARDS */}
                  <AnalyticsCard>
                    <h3 className="text-gray-300 font-bold mb-4 flex items-center gap-2 drop-shadow-md"><Database size={16} className="text-yellow-500"/> Platform Ecosystem</h3>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="bg-[#111]/80 backdrop-blur-md p-5 rounded-2xl border border-[#333] flex flex-col justify-center shadow-lg">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={12}/> Users</span>
                        {loading ? <Skeleton className="h-10 w-16 mt-1" /> : <span className="text-3xl lg:text-4xl font-black text-blue-400 drop-shadow-md">{users.filter(u => u.role === 'user').length}</span>}
                      </div>
                      <div className="bg-[#111]/80 backdrop-blur-md p-5 rounded-2xl border border-[#333] flex flex-col justify-center shadow-lg">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Store size={12}/> Merchants</span>
                        {loading ? <Skeleton className="h-10 w-16 mt-1" /> : <span className="text-3xl lg:text-4xl font-black text-yellow-500 drop-shadow-md">{merchants.length}</span>}
                      </div>
                      <div className="bg-[#111]/80 backdrop-blur-md p-5 rounded-2xl border border-[#333] flex flex-col justify-center shadow-lg">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldAlert size={12}/> Juri</span>
                        {loading ? <Skeleton className="h-10 w-16 mt-1" /> : <span className="text-3xl lg:text-4xl font-black text-purple-400 drop-shadow-md">{users.filter(u => u.role === 'juri').length}</span>}
                      </div>
                      <div className="bg-[#111]/80 backdrop-blur-md p-5 rounded-2xl border border-[#333] flex flex-col justify-center shadow-lg">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Activity size={12}/> Super Admin</span>
                        {loading ? <Skeleton className="h-10 w-16 mt-1" /> : <span className="text-3xl lg:text-4xl font-black text-red-500 drop-shadow-md">{users.filter(u => u.role === 'super_admin').length}</span>}
                      </div>
                    </div>
                  </AnalyticsCard>

                  {/* NETWORK TOPOLOGY MAP */}
                  <AnalyticsCard>
                    <h3 className="text-gray-300 font-bold mb-4 flex items-center gap-2 shrink-0 drop-shadow-md"><Terminal size={16} className="text-green-500"/> Developer API Topology</h3>
                    <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-inner bg-black/50 border border-[#333]">
                      {loading ? (
                         <Skeleton className="h-full w-full" />
                      ) : (
                         <NetworkTopologyMap logs={formattedApiLogs} />
                      )}
                    </div>
                  </AnalyticsCard>

                </div>

                {/* LIVE LOGIN LOGS */}
                <AnalyticsCard noPadding className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="p-5 border-b border-[#333] bg-[#050505]/80 backdrop-blur-md">
                    <h3 className="text-gray-300 font-bold flex items-center gap-2 drop-shadow-md"><Globe size={16} className="text-blue-500"/> Live System Access Logs</h3>
                  </div>
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 custom-scrollbar bg-black/40 backdrop-blur-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="text-gray-400 border-b border-[#333] sticky top-0 z-10 bg-[#111]/90 backdrop-blur-md">
                          <tr>
                            <th className="p-4 font-semibold">Timestamp</th>
                            <th className="p-4 font-semibold">Identity</th>
                            <th className="p-4 font-semibold">Network IP</th>
                            <th className="p-4 font-semibold">Location</th>
                            <th className="p-4 font-semibold">Device Meta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]/50">
                          {logs.slice(0, 20).map(log => (
                            <tr key={log.id} className="hover:bg-yellow-500/10 transition-colors">
                              <td className="p-4 text-gray-400 whitespace-nowrap text-xs">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                              <td className="p-4 text-green-400 font-medium text-xs">{log.email}</td>
                              <td className="p-4 text-blue-400 font-mono text-xs">{log.ip_address}</td>
                              <td className="p-4">
                                {log.location_lat ? (
                                  <a href={`https://www.google.com/maps?q=${log.location_lat},${log.location_lng}`} target="_blank" rel="noreferrer" className="text-yellow-500 hover:underline flex items-center gap-1 text-xs">
                                    <MapPin size={12}/> View Map
                                  </a>
                                ) : (
                                  <span className="text-gray-600 text-xs">Denied</span>
                                )}
                              </td>
                              <td className="p-4 min-w-[200px]">
                                {renderDeviceMeta(log.device_meta)}
                              </td>
                            </tr>
                          ))}
                          {logs.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No recent logs found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </AnalyticsCard>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl text-white font-black mb-6 flex items-center gap-2 drop-shadow-lg"><Users size={24} className="text-yellow-500"/> Analitik Intelijen Pengguna</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array(6).fill(0).map((_, i) => <AnalyticsCard key={i}><Skeleton className="h-32 w-full" /></AnalyticsCard>)
                  ) : users.map(u => {
                    const userLogins = logs.filter(l => l.user_id === u.id);
                    const lastLogin = userLogins[0];
                    return (
                      <AnalyticsCard key={u.id} className="hover:border-yellow-500/50 hover:shadow-yellow-500/10 transition-all group relative cursor-pointer" noPadding>
                        <button onClick={() => openUserDetail(u)} className="w-full text-left p-5 flex flex-col h-full z-20 relative">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-bl-full pointer-events-none"></div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-white text-lg drop-shadow-md">{u.name}</div>
                            <RoleBadge role={u.role} />
                          </div>
                          <div className="text-sm text-gray-400 mt-1">{u.phone || 'No phone'}</div>
                          
                          <div className="mt-4 pt-4 border-t border-[#333] space-y-2 flex-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Total Akses</span>
                              <span className="font-bold text-yellow-500">{userLogins.length} kali</span>
                            </div>
                            {lastLogin && (
                              <>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">IP Terakhir</span>
                                  <span className="text-blue-400 font-mono">{lastLogin.ip_address}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Waktu Terakhir</span>
                                  <span className="text-gray-300">{new Date(lastLogin.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </button>
                      </AnalyticsCard>
                    )
                  })}
                </div>
              </div>
            )}

            {/* MERCHANTS TAB */}
            {activeTab === 'merchants' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl text-white font-black mb-6 flex items-center gap-2 drop-shadow-lg"><Store size={24} className="text-yellow-500"/> Database Toko Merchant</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array(6).fill(0).map((_, i) => <AnalyticsCard key={i}><Skeleton className="h-24 w-full" /></AnalyticsCard>)
                  ) : merchants.map(m => (
                    <AnalyticsCard key={m.id} className="relative overflow-hidden" noPadding>
                      <div className="p-5 flex gap-4 items-start relative z-20 h-full">
                        <div className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shrink-0 border border-[#444] shadow-lg">
                          {m.logo_url ? (
                             // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-full h-full p-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col h-full">
                          <h3 className="font-bold text-white text-lg leading-tight drop-shadow-md">{m.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.address}</p>
                          <div className="mt-2 inline-block px-2 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded-lg border border-yellow-500/30 self-start backdrop-blur-sm">
                            {m.phone}
                          </div>
                          <div className="mt-auto pt-4 border-t border-[#333]">
                            <button onClick={() => handleDeleteMerchant(m.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold tracking-widest transition-colors flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md">
                              <Trash2 size={12} /> HAPUS TOKO
                            </button>
                          </div>
                        </div>
                      </div>
                    </AnalyticsCard>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl text-white font-black mb-6 flex items-center gap-2 drop-shadow-lg"><Package size={24} className="text-yellow-500"/> Database Produk</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {loading ? (
                    Array(8).fill(0).map((_, i) => <AnalyticsCard key={i}><Skeleton className="h-24 w-full" /></AnalyticsCard>)
                  ) : products.map(p => (
                    <AnalyticsCard key={p.id} className="flex gap-4" noPadding>
                      <div className="p-4 flex gap-4 w-full relative z-20">
                        <div className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shrink-0 border border-[#444] shadow-lg">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <h4 className="font-bold text-white leading-tight drop-shadow-md">{p.name}</h4>
                          <span className="text-[10px] text-gray-400 mb-1">{p.merchants?.name || 'Unknown Store'}</span>
                          <div className="flex gap-2 items-center mb-2">
                            <span className="text-yellow-500 font-black text-sm">Rp {p.price.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] text-gray-500 line-through">Rp {p.original_price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#333]">
                            <span className="text-[10px] text-gray-400">Stok: <strong className="text-white">{p.stock}</strong></span>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold flex items-center gap-1 transition-colors bg-red-500/10 px-2 py-1 rounded-md">
                              <Trash2 size={12} /> HAPUS
                            </button>
                          </div>
                        </div>
                      </div>
                    </AnalyticsCard>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#222] flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                <p className="text-gray-400 mt-1">{selectedUser.email}</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 border-r border-[#333] pr-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Ubah Role</span>
                    <select 
                      className="bg-transparent text-yellow-500 font-bold outline-none cursor-pointer text-sm"
                      value={selectedUser.role}
                      onChange={(e) => handleUpdateRole(selectedUser.id, e.target.value)}
                    >
                      <option value="user" className="bg-[#111]">User Biasa</option>
                      <option value="merchant" className="bg-[#111]">Merchant</option>
                      <option value="admin" className="bg-[#111]">Admin</option>
                      <option value="super_admin" className="bg-[#111]">Super Admin</option>
                      <option value="juri" className="bg-[#111]">Juri</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="flex items-center gap-1 bg-red-900/30 text-red-500 px-2 py-1 rounded border border-red-900 hover:bg-red-900/50 transition-colors text-xs font-bold"
                  >
                    <Trash2 size={12} /> Hapus Akun
                  </button>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-500 hover:text-white bg-[#222] rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
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
                          <div className="space-y-2 border-l border-[#333] pl-4">
                             <div className="text-xs text-gray-500 font-bold tracking-wider">📍 LOKASI GPS (AKURAT)</div>
                             {log.location_lat ? (
                               <a href={`https://www.google.com/maps?q=${log.location_lat},${log.location_lng}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-400 hover:underline flex items-center gap-1">
                                  {log.location_lat.toFixed(4)}, {log.location_lng.toFixed(4)}
                               </a>
                             ) : (
                               <div className="text-sm text-gray-600">Izin ditolak pengguna</div>
                             )}
                          </div>
                          
                          <div className="space-y-2 border-l border-[#333] pl-4">
                             <div className="text-xs text-gray-500 font-bold tracking-wider">🌐 LOKASI IP (PERKIRAAN)</div>
                             {ipLoc ? (
                               <div>
                                 <div className="text-sm font-bold text-white">{ipLoc.city}, {ipLoc.country_name}</div>
                                 <div className="text-xs text-gray-400">IP: {log.ip_address} ({ipLoc.org})</div>
                               </div>
                             ) : (
                               <div className="text-sm font-mono text-gray-400">IP: {log.ip_address}</div>
                             )}
                          </div>
                          
                          <div className="space-y-2 border-l border-[#333] pl-4 md:col-span-2">
                             <div className="text-xs text-gray-500 font-bold tracking-wider">💻 DEVICE METADATA</div>
                             <div className="text-sm text-gray-300">{renderDeviceMeta(log.device_meta)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {userLogs.length === 0 && (
                    <div className="text-center text-gray-500 py-10">Belum ada riwayat aktivitas yang tercatat untuk pengguna ini.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Tools */}
      <div className="md:hidden">
         <FloatingTools items={toolItems} />
      </div>
    </div>
  );
}
