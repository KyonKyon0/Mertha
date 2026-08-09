"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/app/actions/auth';
import { SubmitButton } from '@/components/auth/SubmitButton';

function LoginForm() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error');
  const successMessage = searchParams.get('message');
  
  const [ipAddress, setIpAddress] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [deviceMeta, setDeviceMeta] = useState('');

  useEffect(() => {
    // Fetch IP
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(err => console.error("Failed to fetch IP", err));

    // Get Device Meta
    setDeviceMeta(navigator.userAgent);

    // Get Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          });
        },
        (error) => {
          console.warn("Geolocation denied or failed", error);
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-white">
      <div className="mb-8 flex justify-center">
        <Image src="/mertha.png" alt="Mertha Logo" width={240} height={240} className="object-contain" priority />
      </div>
      <h1 className="text-2xl font-bold text-mertha-text mb-2 text-center">Masuk ke Akun Anda</h1>
      <p className="text-sm text-mertha-subtext text-center mb-8">
        Masuk untuk melanjutkan pesanan dan menyelamatkan makanan.
      </p>

      {successMessage && (
        <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-10 duration-500 ease-out drop-shadow-xl">
          <div className="bg-red-50 text-red-600 border border-red-200 px-5 py-3 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm">
            <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600">!</span>
            {errorMessage === "Invalid login credentials" ? "Email atau password salah." : errorMessage}
          </div>
        </div>
      )}

      <form action={login} className="space-y-4">
        {/* Hidden inputs for tracking */}
        <input type="hidden" name="ip_address" value={ipAddress} />
        <input type="hidden" name="location_lat" value={location.lat} />
        <input type="hidden" name="location_lng" value={location.lng} />
        <input type="hidden" name="device_meta" value={deviceMeta} />

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

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
