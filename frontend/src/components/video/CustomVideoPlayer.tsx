// src/components/video/CustomVideoPlayer.tsx - Responsive con iconos SVG inline
import { useState, useRef, useEffect } from 'react';
import { VideoData } from '../../types/video';

// Iconos SVG inline para evitar problemas de dependencias
const PlayIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const VolumeIcon = ({ muted }: { muted: boolean }) => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    {muted ? (
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    ) : (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    )}
  </svg>
);

const FullscreenIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);

// Declarar tipos para YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface CustomVideoPlayerProps {
  video: VideoData;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<number | null>(null);

  // Detectar dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extraer YouTube ID
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = video.videoId || extractYouTubeId(video.videoUrl);

  // Cargar YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    
    window.onYouTubeIframeAPIReady = () => {
      console.log('✅ YouTube API cargada');
      setApiReady(true);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Crear player cuando API esté lista
  useEffect(() => {
    if (!apiReady || !videoId || !playerContainerRef.current) return;

    console.log('🎬 Creando YouTube player...');

    try {
      youtubePlayerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          autoplay: 0,
          mute: 0,
          playsinline: 1,
          autohide: 1,
          cc_load_policy: 0,
          color: 'white',
          enablejsapi: 1
        },
        events: {
          onReady: (_event: any) => {
            console.log('✅ Player ready');
            setIsLoading(false);
            setError(null);
            
            setTimeout(() => {
              updateVideoInfo();
            }, 500);
          },
          onStateChange: (event: any) => {
            console.log('🎬 State change:', event.data);
            handleStateChange(event.data);
          },
          onError: (event: any) => {
            console.error('❌ YouTube error:', event.data);
            setError(`Error de YouTube: ${event.data}`);
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('❌ Error creando player:', error);
      setError('Error al crear el reproductor');
      setIsLoading(false);
    }

    return () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, [apiReady, videoId]);

  // Actualizar información del video
  const updateVideoInfo = () => {
    if (!youtubePlayerRef.current) return;

    try {
      const videoDuration = youtubePlayerRef.current.getDuration();
      if (videoDuration && videoDuration > 0) {
        setDuration(videoDuration);
      }

      const currentVideoTime = youtubePlayerRef.current.getCurrentTime();
      if (typeof currentVideoTime === 'number') {
        setCurrentTime(currentVideoTime);
        onTimeUpdate?.(currentVideoTime);
      }

      const videoVolume = youtubePlayerRef.current.getVolume();
      if (typeof videoVolume === 'number') {
        setVolume(videoVolume);
      }

      const mutedState = youtubePlayerRef.current.isMuted();
      if (typeof mutedState === 'boolean') {
        setIsMuted(mutedState);
      }

      const loadedFraction = youtubePlayerRef.current.getVideoLoadedFraction();
      if (typeof loadedFraction === 'number' && videoDuration) {
        setBufferedTime(loadedFraction * videoDuration);
      }

    } catch (error) {
      console.log('Info update error:', error);
    }
  };

  // Manejar cambios de estado
  const handleStateChange = (state: number) => {
    switch (state) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        onPlay?.();
        break;
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        onPause?.();
        break;
      case window.YT.PlayerState.ENDED:
        setIsPlaying(false);
        onEnded?.();
        break;
      case window.YT.PlayerState.BUFFERING:
        setTimeout(updateVideoInfo, 100);
        break;
    }
  };

  // Actualización periódica durante reproducción
  useEffect(() => {
    if (isPlaying && youtubePlayerRef.current) {
      updateIntervalRef.current = window.setInterval(() => {
        updateVideoInfo();
      }, 1000);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Auto-hide controles
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isMobile) {
      setShowControls(false);
    }
  };

  // Funciones de control
  const handlePlayPause = () => {
    if (!youtubePlayerRef.current) return;

    try {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const handleMuteToggle = () => {
    if (!youtubePlayerRef.current) return;

    try {
      if (isMuted) {
        youtubePlayerRef.current.unMute();
      } else {
        youtubePlayerRef.current.mute();
      }
      setTimeout(updateVideoInfo, 100);
    } catch (error) {
      console.error('Mute toggle error:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!youtubePlayerRef.current) return;

    try {
      youtubePlayerRef.current.setVolume(newVolume);
      setVolume(newVolume);
      
      if (newVolume > 0 && isMuted) {
        youtubePlayerRef.current.unMute();
        setIsMuted(false);
      }
    } catch (error) {
      console.error('Volume change error:', error);
    }
  };

  const handleSeek = (seekPercentage: number) => {
    if (!youtubePlayerRef.current || duration <= 0) return;

    try {
      const seekSeconds = (seekPercentage / 100) * duration;
      youtubePlayerRef.current.seekTo(seekSeconds, true);
      setCurrentTime(seekSeconds);
      onTimeUpdate?.(seekSeconds);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!youtubePlayerRef.current) return;

    try {
      youtubePlayerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Playback rate error:', error);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!youtubePlayerRef.current) return;

    try {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      youtubePlayerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    } catch (error) {
      console.error('Skip error:', error);
    }
  };

  // Fullscreen handlers
  const handleFullscreen = () => {
    if (!isFullscreen && playerRef.current) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoId) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center text-white">
          <div className="text-center p-4">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-lg font-medium">Video no disponible</p>
            <p className="text-sm opacity-75 break-all">URL: {video.videoUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={playerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Aspect Ratio Container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        
        {/* YouTube Player Container */}
        <div
          ref={playerContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* OVERLAY PERSONALIZADO */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* Loading Overlay */}
          {(isLoading || !apiReady) && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center pointer-events-auto">
              <div className="text-center text-white p-4">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-sm">
                  {!apiReady ? 'Cargando YouTube API...' : 'Cargando video...'}
                </p>
                <p className="text-xs opacity-50 mt-2">ID: {videoId}</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center pointer-events-auto">
              <div className="text-center text-white p-4">
                <div className="text-2xl sm:text-4xl mb-4">⚠️</div>
                <p className="text-base sm:text-lg font-medium mb-2">Error</p>
                <p className="text-xs sm:text-sm opacity-75 mb-4">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    window.location.reload();
                  }}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                >
                  Recargar página
                </button>
              </div>
            </div>
          )}

          {/* CONTROLES PERSONALIZADOS */}
          {!isLoading && !error && (
            <div 
              className={`absolute inset-0 transition-opacity duration-300 pointer-events-auto ${
                showControls || isMobile ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              
              {/* Top info bar */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between text-white z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="bg-accent-1 text-black px-2 py-1 rounded text-xs sm:text-sm font-medium">
                    {video.category}
                  </span>
                  {video.faculty && !isMobile && (
                    <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs sm:text-sm">
                      {video.faculty}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-medium">
                  {duration > 0 ? formatTime(duration) : (video.duration || '---')}
                </div>
              </div>

              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                {!isPlaying && (
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-1 bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-105"
                  >
                    <div className="text-black ml-1">
                      <PlayIcon />
                    </div>
                  </button>
                )}
                
                {isPlaying && (
                  <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 w-full h-full bg-transparent"
                  />
                )}
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 text-white z-10">
                
                {/* Progress bar */}
                <div className="mb-2 sm:mb-3">
                  <div 
                    className="w-full h-1 sm:h-2 bg-white bg-opacity-30 rounded-full cursor-pointer hover:h-2 sm:hover:h-3 transition-all relative"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = (clickX / rect.width) * 100;
                      handleSeek(percentage);
                    }}
                  >
                    {/* Buffer bar */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-white bg-opacity-50 rounded-full"
                      style={{ width: `${duration > 0 ? (bufferedTime / duration) * 100 : 0}%` }}
                    />
                    
                    {/* Progress bar */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-accent-1 rounded-full transition-all duration-200"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-accent-1 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Skip buttons */}
                    <button
                      onClick={() => handleSkip(-10)}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                      title="Retroceder 10 segundos"
                    >
                      <span className="text-xs sm:text-sm font-bold">-10</span>
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={handlePlayPause}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    >
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>

                    <button
                      onClick={() => handleSkip(10)}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                      title="Adelantar 10 segundos"
                    >
                      <span className="text-xs sm:text-sm font-bold">+10</span>
                    </button>

                    {/* Volume controls - hidden on mobile */}
                    {!isMobile && (
                      <>
                        <button
                          onClick={handleMuteToggle}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                        >
                          <VolumeIcon muted={isMuted} />
                        </button>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="w-16 sm:w-20 h-1 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #cbe81a 0%, #cbe81a ${volume}%, rgba(255,255,255,0.3) ${volume}%, rgba(255,255,255,0.3) 100%)`
                            }}
                          />
                          <span className="text-xs font-mono w-6 sm:w-8 text-center">{Math.round(volume)}</span>
                        </div>
                      </>
                    )}

                    {/* Time display */}
                    <div className="text-xs sm:text-sm font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Speed control - hidden on mobile */}
                    {!isMobile && (
                      <select
                        value={playbackRate}
                        onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                        className="bg-black bg-opacity-50 text-white text-xs sm:text-sm rounded px-1 sm:px-2 py-1 border border-white border-opacity-30"
                      >
                        <option value={0.25}>0.25x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    )}
                    
                    {/* Fullscreen */}
                    <button
                      onClick={handleFullscreen}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                      title={isFullscreen ? "Salir de pantalla completa (ESC)" : "Pantalla completa"}
                    >
                      <FullscreenIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Click overlay para mostrar controles */}
          {!showControls && !isLoading && !error && !isMobile && (
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setShowControls(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};