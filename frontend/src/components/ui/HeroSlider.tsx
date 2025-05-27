// src/components/ui/HeroSlider.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/solid';
import { Button } from './Button';

interface HeroSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  video?: {
    id: string;
    thumbnail: string;
    duration: string;
  };
  category: string;
  faculty?: string;
  cta?: {
    text: string;
    action: () => void;
  };
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  onSlideChange?: (index: number) => void;
  onVideoPlay?: (videoId: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  onSlideChange,
  onVideoPlay
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length, autoPlayInterval]);

  useEffect(() => {
    onSlideChange?.(currentSlide);
  }, [currentSlide, onSlideChange]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(autoPlay), 1000);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleVideoPlay = (videoId: string) => {
    setIsPlaying(false);
    onVideoPlay?.(videoId);
  };

  if (slides.length === 0) {
    return (
      <div className="relative h-[600px] bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No hay slides disponibles</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative h-[600px] overflow-hidden rounded-xl group">
      {/* Main slide */}
      <div className="relative h-full w-full">
        <img
          src={currentSlideData.image}
          alt={currentSlideData.title}
          className="w-full h-full object-cover transition-transform duration-700"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              {/* Category badge */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="bg-(--color-accent-1) text-(--color-text-main) px-3 py-1 rounded-full text-sm font-medium">
                  {currentSlideData.category}
                </span>
                {currentSlideData.faculty && (
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                    {currentSlideData.faculty}
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {currentSlideData.title}
              </h1>
              
              {/* Description */}
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                {currentSlideData.description}
              </p>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                {currentSlideData.video && (
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<PlayIcon className="h-5 w-5" />}
                    onClick={() => handleVideoPlay(currentSlideData.video!.id)}
                  >
                    Ver Video
                  </Button>
                )}
                
                {currentSlideData.cta && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={currentSlideData.cta.action}
                    className="border-white text-white hover:bg-white hover:text-(--color-text-main)"
                  >
                    {currentSlideData.cta.text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Video thumbnail overlay */}
        {currentSlideData.video && (
          <div className="absolute bottom-6 right-6 hidden lg:block">
            <div 
              className="relative w-48 h-28 rounded-lg overflow-hidden cursor-pointer group/video bg-black/50 backdrop-blur-sm"
              onClick={() => handleVideoPlay(currentSlideData.video!.id)}
            >
              <img
                src={currentSlideData.video.thumbnail}
                alt="Video thumbnail"
                className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayIcon className="h-8 w-8 text-white" />
              </div>
              <div className="absolute bottom-1 right-1 bg-black/75 text-white px-2 py-1 rounded text-xs">
                {currentSlideData.video.duration}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}
      
      {/* Dots indicator */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-(--color-accent-1) scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Progress bar */}
      {isPlaying && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30">
          <div 
            className="h-full bg-(--color-accent-1) transition-all duration-100 ease-linear"
            style={{
              width: `${((currentSlide + 1) / slides.length) * 100}%`
            }}
          />
        </div>
      )}
      
      {/* Slide counter */}
      <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

// Mini slider for related content
interface MiniSliderProps {
  items: Array<{
    id: string;
    title: string;
    thumbnail: string;
    category: string;
  }>;
  onItemClick: (item: any) => void;
  title?: string;
}

export const MiniSlider: React.FC<MiniSliderProps> = ({
  items,
  onItemClick,
  title = "Contenido relacionado"
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsToShow = 4;
  
  const canGoNext = startIndex < items.length - itemsToShow;
  const canGoPrev = startIndex > 0;
  
  const next = () => {
    if (canGoNext) setStartIndex(prev => prev + 1);
  };
  
  const prev = () => {
    if (canGoPrev) setStartIndex(prev => prev - 1);
  };
  
  const visibleItems = items.slice(startIndex, startIndex + itemsToShow);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-(--color-text-main) dark:text-white">
          {title}
        </h3>
        
        {items.length > itemsToShow && (
          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={!canGoPrev}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              disabled={!canGoNext}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleItems.map(item => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="cursor-pointer group"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute top-2 left-2 bg-(--color-accent-1) text-(--color-text-main) px-2 py-1 rounded text-xs font-medium">
                {item.category}
              </div>
            </div>
            <h4 className="text-sm font-medium text-(--color-text-main) dark:text-white line-clamp-2 group-hover:text-(--color-accent-1) transition-colors">
              {item.title}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
};