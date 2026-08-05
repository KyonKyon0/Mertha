"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Clock, MapPin, Tag } from 'lucide-react';
import clsx from 'clsx';

export default function ProductCard({ 
  product, 
  merchant, 
  price, 
  originalPrice, 
  stock, 
  distance, 
  pickupTime,
  imageUrl
}) {
  const discount = Math.round((1 - price / originalPrice) * 100);

  return (
    <div className="bg-white rounded-xl border border-mertha-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] w-full bg-mertha-bg">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mertha-muted">
            No Image
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-mertha-error text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
          <Tag size={12} />
          Diskon {discount}%
        </div>
        
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-mertha-text text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
          <Clock size={12} className="text-mertha-accent" />
          {pickupTime}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-mertha-text text-sm mb-1 line-clamp-1">{product}</h3>
        <p className="text-xs text-mertha-subtext mb-2 line-clamp-1">{merchant}</p>
        
        <div className="flex items-center gap-1 text-xs text-mertha-subtext mb-3">
          <MapPin size={12} />
          <span>{distance} km</span>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-mertha-muted line-through">Rp {originalPrice.toLocaleString('id-ID')}</p>
            <p className="text-sm font-bold text-mertha-primary">Rp {price.toLocaleString('id-ID')}</p>
          </div>
          
          <div className={clsx(
            "text-[10px] font-bold px-2 py-1 rounded-md",
            stock <= 3 ? "bg-mertha-error/10 text-mertha-error" : "bg-mertha-success/10 text-mertha-success"
          )}>
            Sisa {stock}
          </div>
        </div>
      </div>
    </div>
  );
}
