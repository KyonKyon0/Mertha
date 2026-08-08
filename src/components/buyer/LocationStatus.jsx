"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Loader2, Home, Briefcase, Navigation, Check } from 'lucide-react';
import useLocationStore from '@/store/useLocationStore';

export default function LocationStatus() {
  const { activeLocation, savedLocations, gpsLocation, setActiveLocation, setGpsLocation, initDefaultLocation } = useLocationStore();
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize default location on first load
  useEffect(() => {
    initDefaultLocation();
  }, [initDefaultLocation]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUseLocation = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== "localhost") {
      const manualLocation = window.prompt("GPS otomatis diblokir browser. Masukkan kota atau area Anda (Contoh: Jakarta Selatan):");
      if (manualLocation && manualLocation.trim().length > 0) {
        setIsLocating(true);
        try {
          const res = await fetch(`/api/location/search?q=${encodeURIComponent(manualLocation.trim())}`);
          const data = await res.json();
          if (data && data.length > 0) {
            const newLoc = {
              id: 'gps',
              label: 'Lokasi Anda',
              address: data[0].displayName,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
            setGpsLocation(newLoc);
            setActiveLocation(newLoc);
            setIsOpen(false);
          } else {
            alert("Lokasi tidak ditemukan.");
          }
        } catch (e) {
          alert("Gagal mencari lokasi.");
        } finally {
          setIsLocating(false);
        }
      }
      return;
    }

    setIsLocating(true);
    try {
      const newLoc = await useLocationStore.getState().fetchGpsLocation();
      setActiveLocation(newLoc);
      setIsOpen(false);
    } catch (error) {
      console.error("GPS error handled in store", error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectLocation = (loc) => {
    if (loc.id === 'gps_trigger') {
      handleUseLocation();
    } else {
      setActiveLocation(loc);
      setIsOpen(false);
    }
  };

  if (!activeLocation) return null; // Prevents hydration mismatch before init

  const allOptions = [...savedLocations];
  if (gpsLocation) {
    // If gps is available, we add it to the list of choices
    if (!allOptions.find(o => o.id === 'gps')) {
      allOptions.push(gpsLocation);
    }
  }

  return (
    <div className="bg-primary/5 px-4 py-3 flex items-center justify-between border-b border-outline-variant/30 relative" ref={dropdownRef}>
      <div className="flex items-center gap-3 overflow-visible w-full">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLocating}
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 hover:bg-primary/20 transition-all active:scale-95"
        >
          {isLocating ? (
            <Loader2 size={16} className="text-primary animate-spin" />
          ) : (
            <MapPin size={16} className="text-primary" />
          )}
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{activeLocation.label || 'Lokasi'}</span>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            disabled={isLocating} 
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity w-full text-left"
          >
            <span className="text-sm font-bold text-on-surface truncate">
              {isLocating ? "Mencari lokasi..." : activeLocation.address}
            </span>
            <ChevronDown size={14} className={`text-primary shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      <div 
        className={`absolute left-4 right-4 top-14 bg-surface rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden z-50 transition-all duration-300 origin-top ${
          isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
        }`}
      >
        <div className="py-2 flex flex-col">
          {allOptions.map((loc) => {
            const isSelected = activeLocation.id === loc.id;
            return (
              <button 
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className={`flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-variant/30 ${isSelected ? 'bg-primary/5' : ''}`}
              >
                <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {loc.id === 'rumah' ? <Home size={18} /> : 
                   loc.id === 'kantor' ? <Briefcase size={18} /> : 
                   <MapPin size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{loc.label}</div>
                  <div className="text-xs text-on-surface-variant line-clamp-2 mt-0.5 leading-snug">{loc.address}</div>
                </div>
                {isSelected && (
                  <Check size={18} className="text-primary shrink-0 mt-2" />
                )}
              </button>
            )
          })}
          
          <div className="h-px bg-outline-variant/30 my-1 mx-4"></div>
          
          <button 
            onClick={() => handleSelectLocation({ id: 'gps_trigger' })}
            className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-variant/30 group"
          >
            <div className="mt-0.5 shrink-0 text-on-surface-variant group-hover:text-primary transition-colors">
              <Navigation size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Gunakan Lokasi Saat Ini</div>
              <div className="text-xs text-on-surface-variant truncate mt-0.5">Nyalakan GPS untuk mendeteksi lokasi</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
