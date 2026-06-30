import React, { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  title: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, title }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center">
      <div 
        id="before-after-slider-container"
        ref={containerRef}
        className="relative w-full aspect-video md:aspect-[4/3] rounded-xl overflow-hidden select-none cursor-ew-resize shadow-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-900"
        onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); handleMove(e.clientX); }}
        onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
      >
        {/* AFTER IMAGE (Background) */}
        <img 
          id="slider-after-image"
          src={afterUrl} 
          alt="After professional edit" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute right-4 bottom-4 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium tracking-wide flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          AFTER EDIT
        </div>

        {/* BEFORE IMAGE (Clip Path overlay) */}
        <div 
          id="slider-before-overlay"
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img 
            id="slider-before-image"
            src={beforeUrl} 
            alt="Before raw edit" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            style={{ width: containerRef.current?.getBoundingClientRect().width }}
          />
          <div className="absolute left-4 bottom-4 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-medium tracking-wide">
            BEFORE RAW
          </div>
        </div>

        {/* DRAG HANDLE BAR */}
        <div 
          id="slider-handle"
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-xl flex items-center justify-center pointer-events-auto">
            <span className="text-xs font-bold tracking-tight">↔</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono tracking-wider">
        Drag slider handle to compare Raw & Edited
      </p>
    </div>
  );
}
