// src/components/ui/HeroSlider.tsx - Versión corregida con tu paleta CSS
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
      <div className="relative h-[600px] bg-gray-200 flex items-center justify-center w-full">
        <p className="text-gray-500">No hay slides disponibles</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative h-[600px] w-full overflow-hidden group">
      {/* Main slide */}
      <div className="relative h-full w-full">
        <img
          src={currentSlideData.image}
          alt={currentSlideData.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay - SOLO desde la izquierda */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        
        {/* Content - CONTENEDOR MÁS ANCHO */}
        <div className="absolute inset-0 flex items-center w-full">
          <div className="w-full max-w-7xl mx-auto px-8 lg:px-12">
            <div className="max-w-4xl">
              {/* Category badge - USANDO TUS COLORES */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span 
                  className="px-3 py-1.5 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--color-accent-1)', color: 'var(--color-text-main)' }}
                >
                  {currentSlideData.category}
                </span>
                {currentSlideData.faculty && (
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    {currentSlideData.faculty}
                  </span>
                )}
              </div>
              
              {/* Title - TEXTO MÁS PEQUEÑO */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white">
                {currentSlideData.title}
              </h1>
              
              {/* Description - TEXTO MÁS PEQUEÑO Y LIMITADO */}
              <div className="mb-6 max-h-24 overflow-hidden">
                <p className="text-base md:text-lg text-white/90 leading-relaxed">
                  {currentSlideData.description}
                </p>
              </div>
              
              {/* Actions - BOTONES MÁS PEQUEÑOS */}
              <div className="flex flex-col sm:flex-row gap-3">
                {currentSlideData.video && (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<PlayIcon className="h-4 w-4" />}
                    onClick={() => handleVideoPlay(currentSlideData.video!.id)}
                    className="font-semibold px-5 py-2.5 text-sm"
                    style={{ 
                      backgroundColor: 'var(--color-accent-1)', 
                      color: 'var(--color-text-main)',
                      border: 'none'
                    }}
                  >
                    Ver Video
                  </Button>
                )}
                
                {currentSlideData.cta && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={currentSlideData.cta.action}
                    className="border-2 border-white text-white hover:bg-white hover:text-black font-semibold px-5 py-2.5 text-sm"
                  >
                    {currentSlideData.cta.text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Video thumbnail overlay - MÁS PEQUEÑO Y CONTROLADO */}
        {currentSlideData.video && (
          <div className="absolute bottom-6 right-6 hidden lg:block">
            <div 
              className="relative w-48 h-28 rounded-lg overflow-hidden cursor-pointer group/video bg-black/50 backdrop-blur-sm border border-white/20"
              onClick={() => handleVideoPlay(currentSlideData.video!.id)}
            >
              <img
                src={currentSlideData.video.thumbnail}
                alt="Video thumbnail"
                className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="rounded-full p-2"
                  style={{ backgroundColor: 'var(--color-accent-1)' }}
                >
                  <PlayIcon className="h-5 w-5" style={{ color: 'var(--color-text-main)' }} />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-medium">
                {currentSlideData.video.duration}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation arrows - USANDO TUS COLORES */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-white/20"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-white/20"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </>
      )}
      
      {/* Dots indicator - EN LA IZQUIERDA USANDO TUS COLORES */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-8 lg:left-12 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide 
                  ? 'scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              style={{
                backgroundColor: index === currentSlide ? 'var(--color-accent-1)' : undefined
              }}
            />
          ))}
        </div>
      )}
      
      {/* Progress bar - USANDO TUS COLORES */}
      {isPlaying && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30">
          <div 
            className="h-full transition-all duration-100 ease-linear"
            style={{
              backgroundColor: 'var(--color-accent-1)',
              width: `${((currentSlide + 1) / slides.length) * 100}%`
            }}
          />
        </div>
      )}
      
      {/* Slide counter */}
      <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium border border-white/20">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};