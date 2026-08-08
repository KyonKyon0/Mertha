"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MerthaLogo from '@/components/ui/MerthaLogo';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Daftar() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Panggil API internal kita yang menggunakan Supabase Admin (Bypass Rate Limit & Auto Confirm)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMsg = data.error || "Gagal mendaftar.";
        // Translate pesan error Supabase ke Bahasa Indonesia yang ramah pengguna
        if (errorMsg.includes("Email rate limit exceeded") || errorMsg.includes("rate limit")) {
          errorMsg = "Sistem sedang sibuk. Terlalu banyak percobaan pendaftaran, silakan coba beberapa saat lagi.";
        } else if (errorMsg.includes("already registered") || errorMsg.includes("already exists")) {
          errorMsg = "Email ini sudah digunakan. Silakan gunakan email lain atau masuk ke akun Anda.";
        } else if (errorMsg.includes("Password should be at least")) {
          errorMsg = "Kata sandi terlalu pendek. Gunakan minimal 6 karakter.";
        } else if (errorMsg.includes("invalid email")) {
          errorMsg = "Format email tidak valid. Periksa kembali email Anda.";
        }
        throw new Error(errorMsg);
      }

      // Success! Show small animated toast
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login?message=Pendaftaran berhasil, silakan masuk.');
      }, 3000);

    } catch (err) {
      setError(err.message || "Gagal mendaftar. Silakan periksa kembali data Anda.");
      // Sembunyikan error setelah 4 detik
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-white py-12 relative overflow-hidden">
      {/* Top Toast Notification (Success / Error) */}
      {(success || error) && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border ${success ? 'bg-white border-mertha-success/30' : 'bg-white border-mertha-error/30'}`}>
            {success ? (
              <CheckCircle2 size={24} className="text-mertha-success animate-bounce" />
            ) : (
              <XCircle size={24} className="text-mertha-error animate-pulse" />
            )}
            <span className={`text-sm font-bold max-w-[250px] line-clamp-2 ${success ? 'text-mertha-success' : 'text-mertha-error'}`}>
              {success ? "Pendaftaran Berhasil!" : error}
            </span>
            {success && (
              <Loader2 size={16} className="text-mertha-subtext animate-spin ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className={`transition-all duration-700 ${success ? 'opacity-50 pointer-events-none blur-[2px]' : 'opacity-100'}`}>
        <div className="mb-8 flex justify-center">
          <MerthaLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-mertha-text mb-2 text-center">Buat Akun Baru</h1>
        <p className="text-sm text-mertha-subtext text-center mb-8">
          Bergabung dengan kami untuk menyelamatkan makanan lezat.
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="name">Nama Lengkap</label>
            <input 
              id="name"
              name="name"
              type="text" 
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Carmen" 
              className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="phone">Nomor Telepon</label>
            <input 
              id="phone"
              name="phone"
              type="tel" 
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="08123456789" 
              className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="email">Email</label>
            <input 
              id="email"
              name="email"
              type="email" 
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="carmen@example.com" 
              className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="password">Password</label>
            <input 
              id="password"
              name="password"
              type="password" 
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
              className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50 transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-mertha-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-mertha-primary/90 active:scale-95 transition-all shadow-md shadow-mertha-primary/30 disabled:opacity-70 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Memproses...
              </>
            ) : "Daftar"}
          </button>
          
          <div className="mt-6 text-center text-sm text-mertha-subtext">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-mertha-primary font-semibold hover:underline">
              Masuk Sekarang
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
