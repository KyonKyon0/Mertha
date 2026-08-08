"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapEvents({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    }
  });
  return position ? <Marker position={position} icon={customIcon} /> : null;
}

function LocateControl({ setPosition }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(latlng);
          map.flyTo(latlng, 15, { animate: true, duration: 1.5 });
          setLocating(false);
        },
        () => {
          alert("Gagal mendapatkan lokasi. Pastikan GPS/Location aktif.");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Browser tidak mendukung geolokasi.");
    }
  };

  return (
    <div className="absolute bottom-6 right-4 z-[400]">
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLocate(); }}
        className="w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center text-mertha-primary hover:bg-gray-50 active:scale-95 transition-all"
        title="Lokasi Saat Ini"
      >
        <Navigation size={24} className={locating ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}

export default function MapPicker({ initialPosition, onConfirm, onCancel }) {
  // Default to Jakarta if no initial position
  const [position, setPosition] = useState(initialPosition || null);
  const defaultCenter = initialPosition || { lat: -6.2088, lng: 106.8456 };

  // Attempt to get user's current location if no initial position is set (Silent fallback)
  useEffect(() => {
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Silent fallback to defaultCenter
        }
      );
    }
  }, [initialPosition]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-[80vh] sm:w-[600px] flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-mertha-bg border-b border-mertha-border flex justify-between items-center z-10">
          <h2 className="font-bold text-mertha-text">Pilih Lokasi Toko</h2>
          <button onClick={onCancel} className="text-mertha-subtext font-bold text-sm bg-gray-200 px-3 py-1 rounded-lg">Batal</button>
        </div>

        <div className="flex-1 relative z-0">
          <MapContainer 
            center={position || defaultCenter} 
            zoom={13} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents position={position} setPosition={setPosition} />
            <LocateControl setPosition={setPosition} />
          </MapContainer>
          
          {!position && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 px-4 py-2 rounded-full shadow-lg font-bold text-sm text-mertha-primary pointer-events-none">
              Ketuk peta untuk menandai lokasi
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-mertha-border z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button 
            disabled={!position}
            onClick={() => onConfirm(position)}
            className={`w-full font-bold py-3 rounded-xl transition-all ${
              position 
                ? 'bg-mertha-primary text-white hover:scale-[1.02] active:scale-95 shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {position ? `Konfirmasi Lokasi (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})` : 'Pilih Lokasi Terlebih Dahulu'}
          </button>
        </div>
      </div>
    </div>
  );
}
