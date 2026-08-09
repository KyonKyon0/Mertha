"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import BuyerHeader from '@/components/buyer/BuyerHeader';
import GlobalLoading from '@/components/ui/GlobalLoading';
import BottomNavigation from '@/components/buyer/BottomNavigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, List, SlidersHorizontal, ChevronDown, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { calculateDistance } from '@/lib/geo';
import { Merchant, LocationError, Coordinates, GeocodingResult } from '@/types';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/buyer/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
      <span className="text-mertha-subtext font-medium text-sm">Memuat peta...</span>
    </div>
  )
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
  }
});

type RadiusFilter = '1km' | '3km' | '5km' | '10km' | 'Semua';
type SortFilter = 'Terdekat' | 'Tersedia' | 'Rating Tertinggi';

function JelajahiPetaContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const merchantQuery = searchParams.get('merchant'); // used from mini map
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoadingMerchants, setIsLoadingMerchants] = useState(true);
  const [rawDebugData, setRawDebugData] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState(q);
  const [debouncedQuery, setDebouncedQuery] = useState(q);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(null);

  const [activeRadius, setActiveRadius] = useState<RadiusFilter>('Semua');
  const [activeSort, setActiveSort] = useState<SortFilter>('Terdekat');

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | undefined>(undefined);
  const [routeDuration, setRouteDuration] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
    if (typeof window !== 'undefined') {
      console.log('HOSTNAME', window.location.hostname);
      console.log('origin', window.location.origin);
    }
  }, []);

  useEffect(() => {
    console.log('USER LOCATION', userLocation);
    console.log('isLoadingMerchants', isLoadingMerchants);
  }, [userLocation, isLoadingMerchants]);

  useEffect(() => {
    async function loadMerchants() {
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('*');

        // EXPOSE TO UI FOR DEBUGGING
        setRawDebugData({ data, error });

        console.log("MERCHANTS RAW", data);
        console.log("Supabase Fetch Error:", error);

        if (data) {
          // Filter di sisi client untuk menghindari isu cache pada URL dengan query string
          const activeMerchants = data.filter(d => d.active === true || d.is_active === true);
          console.log("FILTERED", activeMerchants);

          const parsed: Merchant[] = activeMerchants.map(d => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            description: d.description,
            address: d.address,
            postalCode: d.postal_code,
            latitude: d.lat ?? d.latitude,
            longitude: d.lng ?? d.longitude,
            imageUrl: d.image_url,
            rating: d.rating
          }));
          setMerchants(parsed);
          console.log("MERCHANTS STATE", parsed);
        }
      } catch (err) {
        console.error("Error loading merchants:", err);
      } finally {
        setIsLoadingMerchants(false);
      }
    }
    loadMerchants();
  }, [supabase]);

  // Center on merchant if passed via query param
  useEffect(() => {
    if (merchantQuery && merchants.length > 0) {
      const target = merchants.find(m => m.id === merchantQuery || m.slug === merchantQuery);
      if (target) {
        setTimeout(() => {
          setUserLocation({ lat: target.latitude, lng: target.longitude });
        }, 0);
      }
    }
  }, [merchantQuery, merchants]);

  useEffect(() => {
    if (q && q !== searchQuery) {
      setTimeout(() => setSearchQuery(q), 0);
    }
  }, [q, searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 3) {
      setTimeout(() => {
        setSearchResults([]);
        setSearchError(null);
      }, 0);
      return;
    }

    const fetchGeocode = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setIsSearching(true);
      setSearchError(null);

      try {
        const res = await fetch(`/api/location/autocomplete?q=${encodeURIComponent(debouncedQuery.trim())}`, {
          signal: abortControllerRef.current.signal
        });

        if (!res.ok) throw new Error('Gagal memuat hasil pencarian');
        const data = await res.json();
        setSearchResults(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSearchError('Terjadi kesalahan saat mencari alamat');
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    fetchGeocode();

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [debouncedQuery]);

  const handleLocateClick = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== "localhost") {
      const manualLocation = window.prompt("GPS otomatis diblokir browser. Masukkan kota atau area Anda (Contoh: Jakarta Selatan):");
      if (manualLocation && manualLocation.trim().length > 0) {
        setIsLocating(true);
        fetch(`/api/location/search?q=${encodeURIComponent(manualLocation.trim())}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const result = data[0];
              setUserLocation({ lat: result.latitude, lng: result.longitude });
              setAccuracy(100);
              setUserAddress(result.displayName);
            } else {
              alert("Lokasi tidak ditemukan. Silakan coba kata kunci lain.");
            }
          })
          .catch(e => {
            alert("Gagal mencari lokasi.");
          })
          .finally(() => setIsLocating(false));
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationError({
        type: 'unsupported',
        message: 'Browser Anda tidak mendukung fitur lokasi.'
      });
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        setAccuracy(position.coords.accuracy);
        setIsLocating(false);

        try {
          const res = await fetch(`/api/location/reverse?lat=${coords.lat}&lon=${coords.lng}`);
          if (res.ok) {
            const data = await res.json();
            setUserAddress(data.displayName);
          }
        } catch (e) {
          // ignore reverse geocoding errors silently to user
        }
      },
      (error) => {
        setIsLocating(false);
        console.error("Geolocation Error callback:", error);

        let errorData: LocationError = { type: 'unknown', message: 'Terjadi kesalahan saat mengambil lokasi.' };

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorData = { type: 'denied', message: 'Izin lokasi ditolak.' };
            break;
          case error.POSITION_UNAVAILABLE:
            errorData = { type: 'unavailable', message: 'Lokasi Anda tidak dapat ditemukan saat ini.' };
            break;
          case error.TIMEOUT:
            errorData = { type: 'timeout', message: 'Waktu permintaan lokasi habis.' };
            break;
        }

        setLocationError(errorData);
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000
      }
    );
  };

  const handleResultClick = (result: GeocodingResult) => {
    setUserLocation({ lat: result.latitude, lng: result.longitude });
    setSearchQuery('');
    setSearchResults([]);
    setUserAddress(result.displayName);
  };

  const handleGetRoute = async (merchant: Merchant) => {
    if (!userLocation) {
      handleLocateClick();
      return;
    }

    try {
      const res = await fetch(`/api/location/directions?fromLat=${userLocation.lat}&fromLon=${userLocation.lng}&toLat=${merchant.latitude}&toLon=${merchant.longitude}`);
      if (res.ok) {
        const data = await res.json();
        const route = data.routes[0];
        if (route) {
          const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
          setRouteCoordinates(coords);
          const distKm = (route.distance / 1000).toFixed(1);
          setRouteDistance(`${distKm} km`);
          const durMin = Math.round(route.duration / 60);
          setRouteDuration(`${durMin} mnt`);
        }
      }
    } catch (e) {
      console.error("Failed to fetch directions", e);
    }
  };

  const resetLocation = () => {
    setUserLocation(null);
    setLocationError(null);
    setUserAddress(null);
    setRouteCoordinates(null);
  };

  const displayMerchants = useMemo(() => {
    let filtered = [...merchants];
    
    // Calculate distance for each merchant
    if (userLocation) {
      filtered = filtered.map(m => ({
        ...m,
        distance: calculateDistance(userLocation.lat, userLocation.lng, m.latitude, m.longitude)
      }));
    }

    // Apply Radius Filter if userLocation is known
    if (userLocation && activeRadius !== 'Semua') {
      const radiusKm = parseInt(activeRadius.replace('km', ''));
      filtered = filtered.filter(m => {
        return m.distance !== undefined && m.distance <= radiusKm;
      });
    }

    // Apply Sort
    if (activeSort === 'Terdekat' && userLocation) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (activeSort === 'Rating Tertinggi') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return filtered;
  }, [merchants, userLocation, activeRadius, activeSort]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      <BuyerHeader />

      <main className="flex-1 pb-24 flex flex-col h-[calc(100vh-64px)] relative">
        {/* Modern Floating UI for Search & Filters */}
        <div className="absolute top-0 left-0 w-full z-[500] pointer-events-none flex flex-col gap-3 p-4">
          
          {/* Search Bar Container */}
          <div className="relative pointer-events-auto w-full transition-all duration-300">
            <div className="flex items-center bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-1 border border-mertha-border/50">
              <div className="pl-3 pr-2 text-mertha-primary">
                {isSearching ? (
                  <div className="w-5 h-5 border-[2.5px] border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search size={20} />
                )}
              </div>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={userAddress ? userAddress : "Mau cari di daerah mana?"}
                className="w-full bg-transparent py-2.5 pr-4 text-sm font-medium text-mertha-text focus:outline-none placeholder:text-mertha-muted truncate"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && searchQuery.length >= 3 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden border border-mertha-border max-h-60 overflow-y-auto animate-slide-down">
                {searchResults.map((result, idx) => (
                  <button
                    key={result.placeId}
                    onClick={() => handleResultClick(result)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-mertha-bg flex items-start gap-3 transition-colors ${idx !== searchResults.length - 1 ? 'border-b border-mertha-border/50' : ''}`}
                  >
                    <MapPin className="shrink-0 text-mertha-primary mt-0.5" size={18} />
                    <span className="text-sm font-medium text-mertha-text line-clamp-2">
                      {result.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {searchError && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl p-4 border border-red-200 animate-slide-down">
                <span className="text-sm font-medium text-red-600">{searchError}</span>
              </div>
            )}
          </div>

          {/* Filters Container */}
          <div className="pointer-events-auto w-full overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            <div className="flex items-center gap-2 w-max">

              {/* Radius Pills Only */}
              <div className="flex items-center bg-white/90 backdrop-blur-md shadow-sm border border-mertha-border rounded-xl p-1 shrink-0">
                <div className="px-3 py-1.5 text-xs font-bold text-mertha-muted border-r border-mertha-border/50">
                  Jarak
                </div>
                <div className="flex items-center gap-1 pl-1">
                  {(['1km', '3km', '5km', '10km', 'Semua'] as RadiusFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveRadius(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                        activeRadius === filter 
                          ? 'bg-mertha-primary text-white shadow-md scale-100' 
                          : 'text-mertha-subtext hover:bg-mertha-bg scale-95 hover:scale-100'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full min-h-[400px] relative z-0">
          <div className="absolute inset-0">
            {isMounted ? (
              <MapComponent
                userLocation={userLocation}
                merchants={displayMerchants}
                onLocateClick={handleLocateClick}
                isLocating={isLocating}
                locationError={locationError}
                resetLocation={resetLocation}
                routeCoordinates={routeCoordinates}
                onGetRoute={handleGetRoute}
                clearRoute={() => setRouteCoordinates(null)}
                routeDistance={routeDistance}
                routeDuration={routeDuration}
                accuracy={accuracy}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                <span className="text-mertha-subtext font-medium text-sm">Menyiapkan peta...</span>
              </div>
            )}
          </div>
        </div>

        <Link
          href="/jelajahi"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-mertha-text text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm z-[500] transition-transform active:scale-95 pointer-events-auto"
        >
          <List size={18} />
          Daftar
        </Link>
      </main>

      <BottomNavigation />
    </>
  );
}

export default function JelajahiPeta() {
  return (
    <Suspense fallback={<GlobalLoading fullScreen={true} />}>
      <JelajahiPetaContent />
    </Suspense>
  );
}
