// src/components/ui/CardSlider.tsx - Limpio y corregido
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
  itemsPerView?: number;
  className?: string;
}

export const CardSlider: React.FC<CardSliderProps> = ({
  title,
  items,
  onItemClick,
  onViewAll,
  itemsPerView = 4,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, items.length - itemsPerView);
  
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
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-center py-12 text-gray-500">
          No hay contenido disponible
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        
        <div className="flex items-center gap-3">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Ver todos
            </button>
          )}
          
          {/* Navigation arrows */}
          {items.length > itemsPerView && (
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className={`p-2 rounded-full border transition-all ${
                  currentIndex === 0
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className={`p-2 rounded-full border transition-all ${
                  currentIndex >= maxIndex
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slider container */}
      <div className="relative overflow-hidden">
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
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
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
                  <div className="absolute top-2 left-2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium">
                    {item.category}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
                    {item.title}
                  </h4>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Faculty */}
                  {item.faculty && (
                    <p className="text-gray-700 font-medium text-sm mb-2">
                      {item.faculty}
                    </p>
                  )}
                  
                  {/* Meta info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
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

      {/* Progress indicator */}
      {items.length > itemsPerView && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-gray-900'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>
      
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
              <div className="absolute top-1 left-1 bg-gray-900 text-white px-1 py-0.5 rounded text-xs">
                {item.category}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
                {item.title}
              </h5>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.publishedAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};