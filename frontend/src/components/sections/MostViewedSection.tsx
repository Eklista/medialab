// src/components/sections/MostViewedSection.tsx
import React from 'react';
import { CardSlider } from '../ui/CardSlider';
import { EyeIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: string;
  views?: number;
  category: string;
  faculty?: string;
  publishedAt: string;
}

interface MostViewedSectionProps {
  items: ContentItem[];
  onItemClick?: (item: ContentItem) => void;
  onViewAllClick?: () => void;
  className?: string;
}

export const MostViewedSection: React.FC<MostViewedSectionProps> = ({
  items,
  onItemClick,
  onViewAllClick,
  className = ''
}) => {
  // Ordenar por vistas y tomar los top items
  const topViewedItems = [...items]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);

  const formatViews = (views?: number) => {
    if (!views) return '0';
    if (views > 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views > 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrophyIcon className="h-4 w-4" />
            <span>Lo Más Visto</span>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Videos Más Populares
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre el contenido más visto por nuestra comunidad. Desde graduaciones emocionantes 
            hasta conferencias inspiradoras que han capturado la atención de miles.
          </p>
        </div>

        {/* Top 3 Destacados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {topViewedItems.slice(0, 3).map((item, index) => (
            <div 
              key={item.id}
              className="group cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              <div className="relative">
                {/* Ranking Badge */}
                <div className={`absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg z-10 ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                }`}>
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  {item.duration && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium">
                      {item.duration}
                    </div>
                  )}

                  {/* Category */}
                  <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
                    {item.title}
                  </h3>
                  
                  {item.faculty && (
                    <p className="text-sm font-medium text-gray-600 mt-1">
                      {item.faculty}
                    </p>
                  )}

                  {/* Views and Date */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="h-4 w-4" />
                      <span className="font-medium">{formatViews(item.views)} vistas</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(item.publishedAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rest of Videos Slider */}
        {topViewedItems.length > 3 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <EyeIcon className="h-6 w-6" />
              También Populares
            </h3>
            
            <CardSlider
              title=""
              items={topViewedItems.slice(3)}
              onItemClick={onItemClick}
            />
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={onViewAllClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <EyeIcon className="h-5 w-5" />
            Ver Todo el Contenido Popular
          </button>
        </div>
      </div>
    </section>
  );
};