import Link from 'next/link';
import MerthaLogo from '@/components/ui/MerthaLogo';
import { login } from '@/app/actions/auth';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default async function Login({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-white">
      <div className="mb-8 flex justify-center">
        <MerthaLogo size="lg" />
      </div>
      <h1 className="text-2xl font-bold text-mertha-text mb-2 text-center">Masuk ke Akun Anda</h1>
      <p className="text-sm text-mertha-subtext text-center mb-8">
        Masuk untuk melanjutkan pesanan dan menyelamatkan makanan.
      </p>

      {resolvedSearchParams?.message && (
        <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {resolvedSearchParams.message}
        </div>
      )}

      {resolvedSearchParams?.error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {resolvedSearchParams.error}
        </div>
      )}

      <form action={login} className="space-y-4">
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
          <div className="mt-2 text-right">
             <Link href="/lupa-kata-sandi" className="text-sm text-mertha-primary hover:underline">
               Lupa Password?
             </Link>
          </div>
        </div>

        <SubmitButton pendingText="Masuk...">Masuk</SubmitButton>
        
        <div className="mt-6 text-center text-sm text-mertha-subtext">
          Belum punya akun?{' '}
          <Link href="/daftar" className="text-mertha-primary font-semibold hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </form>
    </div>
  );
}
