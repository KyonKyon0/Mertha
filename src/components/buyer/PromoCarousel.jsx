"use client";

import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Pause, Play } from 'lucide-react';

export default function PromoCarousel() {
  const autoplayOptions = { delay: 5000, stopOnInteraction: true, rootNode: (emblaRoot) => emblaRoot.parentElement };
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay(autoplayOptions)]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const slides = [
    {
      id: 1,
      title: "Makanan Baik Tidak Seharusnya Terbuang",
      subtitle: "Temukan buah, sayur, makanan surplus, dan Mystery Bag yang masih layak dengan harga lebih hemat di dekatmu.",
      image: "/images/carousel/hero1.jpg"
    },
    {
      id: 2,
      title: "Hemat Lebih Banyak Hari Ini",
      subtitle: "Temukan promo makanan dari toko di dekatmu.",
      image: "/images/carousel/hero2.jpg"
    },
    {
      id: 3,
      title: "Baik Untukmu, Baik Untuk Bumi",
      subtitle: "Setiap pesanan membantu mengurangi sampah pangan.",
      image: "/images/carousel/hero3.jpg"
    }
  ];

  const onSelect = useCallback((emblaApi) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  const togglePlay = useCallback(() => {
    const autoplay = emblaApi?.plugins()?.autoplay;
    if (!autoplay) return;

    if (autoplay.isPlaying()) {
      autoplay.stop();
      setIsPlaying(false);
    } else {
      autoplay.play();
      setIsPlaying(true);
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    const autoplay = emblaApi?.plugins()?.autoplay;
    if (autoplay) {
      setIsPlaying(autoplay.isPlaying());
    }
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full h-[320px] bg-mertha-bg relative overflow-hidden group" aria-roledescription="carousel">
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full touch-pan-y">
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className="flex-[0_0_100%] min-w-0 w-full h-full relative"
              aria-hidden={index !== selectedIndex}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority={slide.id === 1}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-16 left-0 right-0 px-5">
                <h1 className="text-[28px] leading-[34px] font-bold text-white mb-2">{slide.title}</h1>
                <p className="text-[16px] leading-[24px] font-medium text-gray-200">{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex px-5 items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"} 
            className="w-11 h-11 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" className="text-white border-0" /> : <Play size={24} fill="currentColor" className="text-white border-0" />}
          </button>
          <div className="flex gap-1.5 ml-2">
            {slides.map((_, index) => (
              <span 
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selectedIndex === index ? 'w-6 bg-green-200' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
