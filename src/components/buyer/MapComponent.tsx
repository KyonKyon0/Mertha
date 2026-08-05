"use client";

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Route } from 'lucide-react';
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
          <Marker key={merchant.id} position={[merchant.latitude, merchant.longitude]}>
            <Popup className="merchant-popup custom-popup">
              <div className="font-sans w-48 p-0 m-0">
                <div className="relative w-full h-24 rounded-t-lg overflow-hidden -mt-3 -mx-4 mb-2">
                  <Image 
                    src={merchant.imageUrl} 
                    alt={merchant.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
                <strong className="block text-mertha-text text-sm mb-0.5 leading-tight">{merchant.name}</strong>
                <span className="text-xs text-mertha-subtext line-clamp-1 block mb-1">{merchant.address}</span>
                {merchant.distance !== undefined && (
                  <div className="text-xs text-mertha-primary font-bold mb-2">
                    {formatDistance(merchant.distance)} dari Anda
                  </div>
                )}
                
                <div className="flex gap-2 w-full mt-2">
                  <button 
                    onClick={() => onGetRoute(merchant)}
                    className="flex-1 text-center bg-blue-50 text-blue-600 border border-blue-200 text-xs py-1.5 rounded-md font-bold transition-colors hover:bg-blue-100 flex items-center justify-center gap-1"
                  >
                    <Route size={12} /> Rute
                  </button>
                  <Link 
                    href={`/produk/${merchant.slug}`} // In a real app we might link to product, here we link to merchant or product
                    className="flex-1 text-center bg-mertha-primary text-white text-xs py-1.5 rounded-md font-bold transition-colors hover:bg-mertha-primary/90"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating UI Elements */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={onLocateClick}
          disabled={isLocating}
          className={`w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-mertha-border/50 text-mertha-primary transition-all active:scale-95 ${isLocating ? 'opacity-70' : ''}`}
          aria-label="Gunakan Lokasi Saya"
        >
          <Navigation size={20} className={isLocating ? "animate-pulse text-mertha-muted" : ""} />
        </button>
      </div>

      {routeCoordinates && (
        <div className="absolute top-20 left-4 right-4 z-[400]">
          <div className="bg-white p-3 rounded-lg shadow-lg border border-mertha-border flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-mertha-text">Petunjuk Arah</p>
              {routeDistance && routeDuration && (
                <p className="text-xs text-mertha-subtext">{routeDistance} • {routeDuration}</p>
              )}
            </div>
            <button 
              onClick={clearRoute}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md font-bold hover:bg-gray-200 transition-colors"
            >
              Hapus Rute
            </button>
          </div>
        </div>
      )}

      {locationError && (
        <div className="absolute top-20 left-4 right-4 z-[400]">
          <div className="bg-white p-3 rounded-lg shadow-lg border border-red-200 flex flex-col gap-2" role="alert">
            <p className="text-sm text-red-600 font-medium">{locationError.message}</p>
            {['timeout', 'denied'].includes(locationError.type) && (
              <button onClick={onLocateClick} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-md font-bold self-start">
                Coba Lagi
              </button>
            )}
            {locationError.type === 'denied' && (
              <p className="text-xs text-mertha-subtext">
                Izin lokasi ditolak. Aktifkan GPS perangkat, buka pengaturan izin situs pada browser, izinkan akses lokasi, lalu tekan Coba Lagi.
              </p>
            )}
            <div className="flex gap-2 mt-1">
              <button onClick={() => {}} className="text-xs bg-gray-100 px-3 py-1.5 rounded-md font-medium text-gray-700">Cari Alamat Manual</button>
              <button onClick={resetLocation} className="text-xs bg-gray-100 px-3 py-1.5 rounded-md font-medium text-gray-700">Tampilkan Semua Merchant</button>
            </div>
          </div>
        </div>
      )}

      {isLocating && !locationError && (
        <div className="absolute top-20 left-4 right-4 z-[400]" aria-live="polite">
          <div className="bg-white p-3 rounded-lg shadow-lg border border-mertha-border text-sm text-mertha-text font-medium flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
            Mencari lokasi Anda...
          </div>
        </div>
      )}
    </div>
  );
}
