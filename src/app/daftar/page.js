import React from 'react';
import Link from 'next/link';
import MerthaLogo from '@/components/ui/MerthaLogo';
import { signup } from '@/app/actions/auth';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function Daftar({ searchParams }) {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-white py-12">
      <div className="mb-8 flex justify-center">
        <MerthaLogo size="lg" />
      </div>
      <h1 className="text-2xl font-bold text-mertha-text mb-2 text-center">Buat Akun Baru</h1>
      <p className="text-sm text-mertha-subtext text-center mb-8">
        Bergabung dengan kami untuk menyelamatkan makanan lezat.
      </p>

      {searchParams?.message && (
        <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {searchParams.message}
        </div>
      )}

      {searchParams?.error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {searchParams.error}
        </div>
      )}

      <form action={signup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="name">Nama Lengkap</label>
          <input 
            id="name"
            name="name"
            type="text" 
            required
            placeholder="Carmen" 
            className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="phone">Nomor Telepon</label>
          <input 
            id="phone"
            name="phone"
            type="tel" 
            required
            placeholder="08123456789" 
            className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="email">Email</label>
          <input 
            id="email"
            name="email"
            type="email" 
            required
            placeholder="carmen@example.com" 
            className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mertha-text mb-1" htmlFor="password">Password</label>
          <input 
            id="password"
            name="password"
            type="password" 
            required
            placeholder="••••••••" 
            className="w-full border border-mertha-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mertha-primary/50" 
          />
        </div>

        <SubmitButton pendingText="Mendaftar...">Daftar</SubmitButton>
        
        <div className="mt-6 text-center text-sm text-mertha-subtext">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-mertha-primary font-semibold hover:underline">
            Masuk Sekarang
          </Link>
        </div>
      </form>
    </div>
  );
}
