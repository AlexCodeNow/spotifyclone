'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CarouselProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  children: React.ReactNode;
  itemWidth?: number;
  gap?: number;
}

export default function Carousel({
  title,
  subtitle,
  viewAllHref,
  children,
  itemWidth = 200,
  gap = 16
}: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', checkScrollability);
    window.addEventListener('resize', checkScrollability);
    
    checkScrollability();
    
    return () => {
      container.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, []);
  
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = itemWidth + gap;
    container.scrollBy({ left: -scrollAmount * 2, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = itemWidth + gap;
    container.scrollBy({ left: scrollAmount * 2, behavior: 'smooth' });
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
        </div>
        
        {viewAllHref && (
          <Link 
            href={viewAllHref}
            className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-wide"
          >
            Ver todo
          </Link>
        )}
      </div>
      
      <div className="relative group">
        <button
          onClick={scrollLeft}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black bg-opacity-70 flex items-center justify-center transition-opacity ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } focus:outline-none`}
          aria-label="Scroll left"
          disabled={!canScrollLeft}
          style={{ left: '-20px' }}
        >
          <FaChevronLeft className="text-white" />
        </button>
        
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-scroll scrollbar-hide -mx-4 px-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex" style={{ gap: `${gap}px` }}>
            {children}
          </div>
        </div>
        
        <button
          onClick={scrollRight}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black bg-opacity-70 flex items-center justify-center transition-opacity ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } focus:outline-none`}
          aria-label="Scroll right"
          disabled={!canScrollRight}
          style={{ right: '-20px' }}
        >
          <FaChevronRight className="text-white" />
        </button>
        
        {canScrollRight && (
          <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" style={{ right: '-20px' }}></div>
        )}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black to-transparent pointer-events-none" style={{ left: '-20px' }}></div>
        )}
      </div>
    </div>
  );
}