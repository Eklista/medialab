// src/components/ui/CardSlider.tsx - Versión con mejor responsive y flechas
import React, { useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CardSliderProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnail: string;
    duration?: string;
    views?: number;
    category: string;
    faculty?: string;
    publishedAt: string;
  }>;
  onItemClick?: (item: any) => void;
  onViewAll?: () => void;
  className?: string;
}

export const CardSlider: React.FC<CardSliderProps> = ({
  title,
  items,
  onItemClick,
  onViewAll,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1.5; // Mobile: 1 completo + mitad del siguiente
      if (window.innerWidth < 1024) return 2; // Tablet: 2 completos
      if (window.innerWidth < 1280) return 3; // Desktop pequeño: 3 completos
      return 4; // Desktop grande: 4 completos
    }
    return 4;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  // Update items per view on resize
  React.useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, items.length - Math.floor(itemsPerView));
  
  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const formatViews = (views?: number) => {
    if (!views) return '';
    if (views > 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views > 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'hace 1 día';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.ceil(diffDays / 7)} semanas`;
    return `hace ${Math.ceil(diffDays / 30)} meses`;
  };

  if (items.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
            {title}
          </h3>
        </div>
        <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
          No hay contenido disponible
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl lg:text-2xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
            {title}
          </h3>
          
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--color-accent-1)' }}
            >
              Ver todos →
            </button>
          )}
        </div>
      )}

      {/* Slider container */}
      <div className="relative group">
        {/* Navigation arrows - SIEMPRE VISIBLES */}
        {items.length > itemsPerView && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-white shadow-lg border border-gray-200 rounded-full transition-all hover:shadow-xl ${
                currentIndex === 0
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:scale-110'
              }`}
              style={{
                color: 'var(--color-text-main)'
              }}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-white shadow-lg border border-gray-200 rounded-full transition-all hover:shadow-xl ${
                currentIndex >= maxIndex
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:scale-110'
              }`}
              style={{
                color: 'var(--color-text-main)'
              }}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Slider overflow container */}
        <div className="overflow-hidden px-4">
          <div 
            ref={sliderRef}
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 px-2"
                style={{ 
                  width: `${100 / itemsPerView}%`
                }}
              >
                <div 
                  className="rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group h-full"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)'
                  }}
                  onClick={() => onItemClick?.(item)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <PlayIcon className="h-12 w-12 text-white" />
                    </div>
                    
                    {/* Duration badge */}
                    {item.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                        {item.duration}
                      </div>
                    )}
                    
                    {/* Category badge */}
                    <div 
                      className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: 'var(--color-accent-1)', 
                        color: 'var(--color-text-main)' 
                      }}
                    >
                      {item.category}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1">
                    <h4 
                      className="font-semibold line-clamp-2 mb-2 group-hover:opacity-75 transition-colors text-sm lg:text-base"
                      style={{ color: 'var(--color-text-main)' }}
                    >
                      {item.title}
                    </h4>
                    
                    {item.description && (
                      <p 
                        className="text-xs lg:text-sm line-clamp-2 mb-3"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {item.description}
                      </p>
                    )}
                    
                    {/* Faculty */}
                    {item.faculty && (
                      <p 
                        className="font-medium text-xs lg:text-sm mb-2"
                        style={{ color: 'var(--color-accent-1)' }}
                      >
                        {item.faculty}
                      </p>
                    )}
                    
                    {/* Meta info */}
                    <div 
                      className="flex items-center justify-between text-xs"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <div className="flex items-center gap-3">
                        {item.views && (
                          <div className="flex items-center gap-1">
                            <EyeIcon className="h-3 w-3" />
                            <span>{formatViews(item.views)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDate(item.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress indicator dots - Solo en desktop */}
      {items.length > itemsPerView && (
        <div className="hidden lg:flex justify-center mt-4 gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: index === currentIndex 
                  ? 'var(--color-accent-1)' 
                  : 'var(--color-border)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Variante compacta para sidebars
interface CompactCardSliderProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    thumbnail: string;
    category: string;
    publishedAt: string;
  }>;
  onItemClick?: (item: any) => void;
  maxItems?: number;
}

export const CompactCardSlider: React.FC<CompactCardSliderProps> = ({
  title,
  items,
  onItemClick,
  maxItems = 5
}) => {
  const displayItems = items.slice(0, maxItems);

  return (
    <div 
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)'
      }}
    >
      <h4 
        className="font-semibold mb-4"
        style={{ color: 'var(--color-text-main)' }}
      >
        {title}
      </h4>
      
      <div className="space-y-3">
        {displayItems.map((item) => (
          <div 
            key={item.id}
            className="flex gap-3 cursor-pointer group"
            onClick={() => onItemClick?.(item)}
          >
            <div className="relative w-20 h-14 rounded overflow-hidden flex-shrink-0">
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div 
                className="absolute top-1 left-1 px-1 py-0.5 rounded text-xs"
                style={{ 
                  backgroundColor: 'var(--color-accent-1)', 
                  color: 'var(--color-text-main)' 
                }}
              >
                {item.category}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h5 
                className="text-sm font-medium line-clamp-2 group-hover:opacity-75 transition-colors"
                style={{ color: 'var(--color-text-main)' }}
              >
                {item.title}
              </h5>
              <p 
                className="text-xs mt-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {new Date(item.publishedAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};