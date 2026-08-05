import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

export default function LocationStatus() {
  return (
    <div className="bg-mertha-primary/5 px-4 py-3 flex items-center justify-between border-b border-mertha-border/30">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-mertha-primary/10 flex items-center justify-center shrink-0">
          <MapPin size={16} className="text-mertha-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-mertha-subtext font-medium">Lokasi Anda</span>
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-sm font-bold text-mertha-text truncate">Jl. Sudirman No. 45, Jakarta</span>
            <ChevronDown size={14} className="text-mertha-primary shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
