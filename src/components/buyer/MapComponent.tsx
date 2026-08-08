"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Route, X } from 'lucide-react';
import { Merchant, LocationError, Coordinates } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistance } from '@/lib/geo';

// Fix Leaflet's default icon path issues with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ center, zoom, bounds }: { center?: [number, number]; zoom?: number, bounds?: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    } else if (center && zoom) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

interface MapComponentProps {
  userLocation: Coordinates | null;
  merchants: Merchant[];
  onLocateClick: () => void;
  isLocating: boolean;
  locationError: LocationError | null;
  resetLocation: () => void;
  routeCoordinates: [number, number][] | null;
  onGetRoute: (merchant: Merchant) => void;
  clearRoute: () => void;
  routeDistance?: string;
  routeDuration?: string;
  accuracy?: number;
}

export default function MapComponent({ 
  userLocation, 
  merchants, 
  onLocateClick, 
  isLocating, 
  locationError,
  resetLocation,
  routeCoordinates,
  onGetRoute,
  clearRoute,
  routeDistance,
  routeDuration,
  accuracy
}: MapComponentProps) {
  const defaultCenter: [number, number] = [-6.3475, 106.8230]; // Srengseng Sawah
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;
  const zoom = userLocation ? 16 : 14;

  const bounds = routeCoordinates && routeCoordinates.length > 0 ? routeCoordinates : null;
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={bounds ? undefined : center} zoom={bounds ? undefined : zoom} bounds={bounds} />

        {/* Map Click Handler to deselect merchant */}
        <div className="hidden">
          <Marker position={[0,0]} eventHandlers={{ add: (e) => { e.target._map.on('click', () => setSelectedMerchant(null)); } }} opacity={0} />
        </div>

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <strong>Lokasi Anda</strong>
            </Popup>
          </Marker>
        )}

        {/* Render accuracy circle if available */}
        {userLocation && accuracy && (
          <div className="hidden" /* we normally render a Circle here, but skip for simplicity if not strictly required */></div>
        )}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#2563eb" weight={5} opacity={0.7} />
        )}

        {merchants.map(merchant => (
          <Marker 
            key={merchant.id} 
            position={[merchant.latitude, merchant.longitude]}
            eventHandlers={{
              click: () => setSelectedMerchant(merchant),
            }}
          >
          </Marker>
        ))}
      </MapContainer>

      {/* Modern Bottom Sheet for Selected Merchant */}
      {selectedMerchant && (
        <>
          {/* Dim Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-[900] animate-fade-in"
            onClick={() => setSelectedMerchant(null)}
          ></div>
          
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-slide-up overflow-hidden border border-mertha-border/50">
            <div className="relative w-full h-[160px]">
              <Image 
                src={selectedMerchant.imageUrl} 
                alt={selectedMerchant.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <button 
                onClick={() => setSelectedMerchant(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="text-lg font-bold text-mertha-text leading-tight">{selectedMerchant.name}</h3>
                {selectedMerchant.distance !== undefined && (
                  <div className="inline-flex shrink-0 items-center gap-1 bg-mertha-primary/10 text-mertha-primary px-2.5 py-1 rounded-lg text-[11px] font-bold">
                    <Navigation size={12} />
                    {formatDistance(selectedMerchant.distance)}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-mertha-subtext line-clamp-2 leading-relaxed mb-5">
                {selectedMerchant.address}
              </p>
              
              <div className="flex gap-3 w-full">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMerchant.latitude},${selectedMerchant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-blue-50 text-blue-600 border border-blue-100 text-sm py-3 rounded-xl font-bold transition-all duration-300 hover:bg-blue-100 hover:shadow-sm active:scale-95 flex items-center justify-center gap-2"
                >
                  <Route size={18} /> Rute Jalan
                </a>
                <Link 
                  href={`/jelajahi?q=${encodeURIComponent(selectedMerchant.name)}`} 
                  className="flex-1 text-center bg-mertha-primary text-white text-sm py-3 rounded-xl font-bold transition-all duration-300 hover:bg-mertha-primary/90 hover:shadow-lg hover:shadow-mertha-primary/30 active:scale-95"
                >
                  Lihat Menu
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating UI Elements */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={onLocateClick}
          disabled={isLocating}
          className={`w-[52px] h-[52px] bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-mertha-border/50 text-mertha-primary transition-all duration-300 active:scale-90 hover:bg-mertha-bg flex items-center justify-center ${isLocating ? 'opacity-50 scale-90 pointer-events-none' : 'hover:-translate-y-1'}`}
          aria-label="Gunakan Lokasi Saya"
        >
          <Navigation size={22} className={isLocating ? "animate-pulse" : ""} />
        </button>
      </div>

      {routeCoordinates && (
        <div className="absolute top-[140px] left-4 right-4 z-[400] animate-slide-down">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-mertha-border flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-bold text-mertha-text flex items-center gap-1.5">
                <Route size={16} className="text-blue-600" />
                Petunjuk Arah
              </p>
              {routeDistance && routeDuration && (
                <p className="text-xs text-mertha-subtext font-medium mt-0.5 ml-5">{routeDistance} • {routeDuration}</p>
              )}
            </div>
            <button 
              onClick={clearRoute}
              className="text-xs bg-gray-100 text-gray-700 px-3.5 py-2 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all duration-300"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {locationError && (
        <div className="absolute top-[140px] left-4 right-4 z-[400] animate-slide-down">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-red-200/50 flex flex-col gap-3" role="alert">
            <p className="text-sm text-red-600 font-bold leading-snug">{locationError.message}</p>
            {locationError.type === 'denied' && (
              <p className="text-[11px] text-mertha-subtext leading-relaxed">
                Izin lokasi ditolak. Aktifkan GPS perangkat, izinkan akses lokasi pada browser, lalu coba lagi.
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {['timeout', 'denied'].includes(locationError.type) && (
                <button onClick={onLocateClick} className="flex-1 min-w-[100px] text-xs bg-red-50 text-red-700 px-3 py-2 rounded-xl font-bold hover:bg-red-100 active:scale-95 transition-all duration-300 text-center">
                  Coba Lagi
                </button>
              )}
              <button onClick={() => {}} className="flex-1 min-w-[120px] text-xs bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-300 text-center">Cari Manual</button>
              <button onClick={resetLocation} className="w-full text-xs bg-gray-800 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-gray-700 active:scale-95 transition-all duration-300 text-center">Tampilkan Semua Area</button>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`absolute left-1/2 -translate-x-1/2 z-[400] transition-all duration-500 ease-out flex justify-center w-full max-w-[280px] ${
          isLocating && !locationError ? 'bottom-28 opacity-100 scale-100' : 'bottom-10 opacity-0 scale-95 pointer-events-none'
        }`} 
        aria-live="polite"
      >
        <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-mertha-border text-sm text-mertha-text font-bold flex items-center gap-3">
          <div className="w-5 h-5 border-[2.5px] border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
          Mencari lokasi Anda...
        </div>
      </div>
    </div>
  );
}
