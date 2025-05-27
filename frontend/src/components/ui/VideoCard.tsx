// src/components/ui/VideoCard.tsx
import React from 'react';
import { PlayIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/solid';

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: string;
  views?: number;
  category: string;
  faculty?: string;
  publishedAt: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
}

export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  description,
  thumbnail,
  duration,
  views,
  category,
  faculty,
  publishedAt,
  onClick,
  size = 'md',
  layout = 'vertical'
}) => {
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

  const sizes = {
    sm: {
      container: layout === 'vertical' ? 'w-full max-w-xs' : 'w-full',
      image: layout === 'vertical' ? 'h-32' : 'h-20 w-32',
      title: 'text-sm font-medium',
      description: 'text-xs',
      meta: 'text-xs'
    },
    md: {
      container: layout === 'vertical' ? 'w-full max-w-sm' : 'w-full',
      image: layout === 'vertical' ? 'h-40' : 'h-24 w-40',
      title: 'text-base font-semibold',
      description: 'text-sm',
      meta: 'text-sm'
    },
    lg: {
      container: layout === 'vertical' ? 'w-full max-w-md' : 'w-full',
      image: layout === 'vertical' ? 'h-48' : 'h-32 w-48',
      title: 'text-lg font-bold',
      description: 'text-base',
      meta: 'text-sm'
    }
  };

  const currentSize = sizes[size];
  const isVertical = layout === 'vertical';

  return (
    <div 
      className={`
        ${currentSize.container} cursor-pointer group transition-all duration-200 
        hover:scale-105 hover:shadow-lg bg-white dark:bg-gray-800 rounded-lg overflow-hidden
      `}
      onClick={onClick}
    >
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-row gap-3'}`}>
        {/* Thumbnail */}
        <div className={`relative ${currentSize.image} flex-shrink-0 overflow-hidden ${isVertical ? 'w-full' : ''}`}>
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <PlayIcon className="h-12 w-12 text-white" />
          </div>
          
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
              {duration}
            </div>
          )}
          
          {/* Category badge */}
          <div className="absolute top-2 left-2 bg-(--color-accent-1) text-(--color-text-main) px-2 py-1 rounded text-xs font-medium">
            {category}
          </div>
        </div>
        
        {/* Content */}
        <div className={`${isVertical ? 'p-4' : 'flex-1 py-2'} space-y-2`}>
          <h3 className={`${currentSize.title} text-(--color-text-main) dark:text-white line-clamp-2 group-hover:text-(--color-accent-1) transition-colors`}>
            {title}
          </h3>
          
          {description && (
            <p className={`${currentSize.description} text-(--color-text-secondary) dark:text-gray-300 line-clamp-2`}>
              {description}
            </p>
          )}
          
          {/* Faculty */}
          {faculty && (
            <p className={`${currentSize.meta} text-(--color-accent-1) font-medium`}>
              {faculty}
            </p>
          )}
          
          {/* Meta info */}
          <div className={`flex items-center gap-3 ${currentSize.meta} text-(--color-text-secondary) dark:text-gray-400`}>
            {views && (
              <div className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <span>{formatViews(views)} vistas</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDate(publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Grid component for video cards
interface VideoGridProps {
  videos: Array<{
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
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  onVideoClick?: (video: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  columns = 3,
  gap = 'md',
  onVideoClick,
  loading = false,
  emptyMessage = 'No hay videos disponibles'
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
  };

  const gaps = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} ${gaps[gap]}`}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Sin videos</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} ${gaps[gap]}`}>
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          {...video}
          onClick={() => onVideoClick?.(video)}
        />
      ))}
    </div>
  );
};