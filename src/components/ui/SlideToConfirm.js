import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Check } from 'lucide-react';

export default function SlideToConfirm({ onConfirm, disabled, isLoading, text = "Geser untuk Konfirmasi", successText = "Berhasil!" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const isConfirmedRef = useRef(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const startDrag = (e) => {
    if (disabled || isLoading || isConfirmedRef.current) return;
    setIsDragging(true);
  };

  const onDrag = (e) => {
    if (!isDragging || !containerRef.current || isConfirmedRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(0, Math.min(clientX - containerRect.left, containerRect.width));
    setSlideWidth(newWidth);

    if (newWidth >= containerRect.width * 0.9) {
      if (isConfirmedRef.current) return;
      isConfirmedRef.current = true;
      setIsDragging(false);
      setIsConfirmed(true);
      setSlideWidth(containerRect.width);
      onConfirm();
    }
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!isConfirmed) setSlideWidth(0); // bounce back
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchmove', onDrag);
      window.addEventListener('touchend', endDrag);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-[52px] w-full rounded-xl overflow-hidden shadow-sm transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'} bg-mertha-bg border border-mertha-border`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 bg-mertha-primary/20 transition-all"
        style={{ width: isConfirmed ? '100%' : slideWidth + 'px', transitionDuration: isDragging ? '0ms' : '300ms' }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-sm font-bold transition-all ${isConfirmed ? 'text-mertha-primary opacity-0' : 'text-mertha-muted'}`}>
          {isConfirmed ? successText : text}
        </span>
      </div>
      <button
        ref={buttonRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className={`absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-white border border-mertha-border rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-transform ${isConfirmed ? 'border-mertha-primary' : ''}`}
        style={{ transform: `translateX(${isConfirmed ? containerRef.current?.getBoundingClientRect().width - 64 : slideWidth}px)`, transitionDuration: isDragging ? '0ms' : '300ms' }}
      >
        {isConfirmed ? (
          <Check size={20} className="text-mertha-primary" />
        ) : (
          <ChevronRight size={20} className="text-mertha-primary" />
        )}
      </button>
      
      {isConfirmed && isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-5 h-5 border-2 border-mertha-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
