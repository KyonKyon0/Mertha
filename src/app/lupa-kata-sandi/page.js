import React from 'react';
import Link from 'next/link';
import MerthaLogo from '@/components/ui/MerthaLogo';
import { resetPassword } from '@/app/actions/auth';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function LupaKataSandi({ searchParams }) {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-white">
      <div className="mb-8 flex justify-center">
        <MerthaLogo size="lg" />
      </div>
      <h1 className="text-2xl font-bold text-mertha-text mb-2 text-center">Lupa Password</h1>
      <p className="text-sm text-mertha-subtext text-center mb-8">
        Masukkan email Anda untuk mereset password.
      </p>

      {searchParams?.success && (
        <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {searchParams.success}
        </div>
      )}

      {searchParams?.error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {searchParams.error}
        </div>
      )}

      <form action={resetPassword} className="space-y-4">
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

        <SubmitButton pendingText="Mengirim...">Kirim Link Reset</SubmitButton>
        
        <div className="mt-6 text-center text-sm text-mertha-subtext">
          Ingat password Anda?{' '}
          <Link href="/login" className="text-mertha-primary font-semibold hover:underline">
            Masuk Kembali
          </Link>
        </div>
      </form>
    </div>
  );
}
