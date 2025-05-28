// src/components/video/UniversalVideoPlayer.tsx - Con reproductor personalizado
import { useState, useRef } from 'react';
import { VideoData } from '../../types/video';

// Importar el reproductor personalizado
import { CustomVideoPlayer } from './CustomVideoPlayer';

interface UniversalVideoPlayerProps {
  video: VideoData;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
  useCustomPlayer?: boolean; // Nueva prop para elegir reproductor
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  video,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  className = '',
  useCustomPlayer = true // Por defecto usar el personalizado
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Si es YouTube y queremos usar el reproductor personalizado
  if (video.videoType === 'youtube' && useCustomPlayer) {
    return (
      <CustomVideoPlayer
        video={video}
        autoplay={autoplay}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        className={className}
      />
    );
  }

  // Función para extraer IDs de video
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
    return match ? match[1] : null;
  };

  // Obtener URL embed para reproductor estándar
  const getEmbedUrl = (): string | null => {
    let videoId: string | null = null;
    
    switch (video.videoType) {
      case 'youtube': {
        videoId = video.videoId || extractYouTubeId(video.videoUrl);
        if (!videoId) return null;
        
        // Configuración estándar de YouTube
        const youtubeParams = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          controls: '1',
          modestbranding: '1',
          rel: '0',
          showinfo: '0',
          iv_load_policy: '3',
          disablekb: '1',
          fs: '1',
          cc_load_policy: '0',
          color: 'white',
          playsinline: '1',
          autohide: '1',
          theme: 'light',
          origin: window.location.origin
        });
        
        return `https://www.youtube.com/embed/${videoId}?${youtubeParams.toString()}`;
      }
      
      case 'vimeo': {
        videoId = video.videoId || extractVimeoId(video.videoUrl);
        if (!videoId) return null;
        
        const vimeoParams = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          title: '0',
          byline: '0',
          portrait: '0',
          color: 'ffffff',
          background: '1',
          muted: autoplay ? '1' : '0',
          transparent: '0',
          pip: '0',
          speed: '0',
          keyboard: '0',
          dnt: '1'
        });
        
        return `https://player.vimeo.com/video/${videoId}?${vimeoParams.toString()}`;
      }
      
      case 's3':
      case 'external':
        return null;
      
      default:
        return null;
    }
  };

  const embedUrl = getEmbedUrl();

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Error al cargar el video');
    setIsLoading(false);
  };

  // Render del contenido para reproductores estándar
  const renderVideoContent = () => {
    // Para YouTube y Vimeo usamos iframe estándar
    if ((video.videoType === 'youtube' || video.videoType === 'vimeo') && embedUrl) {
      return (
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="absolute inset-0 w-full h-full"
          title={video.title}
          style={{
            border: 'none',
            outline: 'none'
          }}
        />
      );
    }

    // Para S3 y external URLs usamos video HTML5
    if (video.videoType === 's3' || video.videoType === 'external') {
      return (
        <video
          controls
          autoPlay={autoplay}
          onPlay={() => {
            onPlay?.();
          }}
          onPause={() => {
            onPause?.();
          }}
          onEnded={onEnded}
          onTimeUpdate={(e) => {
            const video = e.target as HTMLVideoElement;
            onTimeUpdate?.(video.currentTime);
          }}
          onLoadedMetadata={() => setIsLoading(false)}
          onError={() => {
            setError('Error al cargar el video');
            setIsLoading(false);
          }}
          className="absolute inset-0 w-full h-full object-contain"
          poster={video.thumbnail}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
        >
          <source src={video.videoUrl} type="video/mp4" />
          <p className="text-white p-4">
            Tu navegador no soporta la reproducción de video.
            <a href={video.videoUrl} className="underline ml-2">
              Descargar video
            </a>
          </p>
        </video>
      );
    }

    // Fallback
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📹</div>
          <h3 className="text-lg font-medium mb-2">Video no disponible</h3>
          <p className="text-sm opacity-75">
            Tipo: {video.videoType} | URL: {video.videoUrl}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div ref={playerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Aspect Ratio Container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        
        {/* Video Content */}
        {video.videoType === 's3' && !video.videoUrl.startsWith('http') ? (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">☁️</div>
              <h3 className="text-lg font-medium mb-2">AWS S3 Player</h3>
              <p className="text-sm opacity-75">Disponible cuando tengamos presupuesto</p>
              <p className="text-xs opacity-50 mt-2">URL: {video.videoUrl}</p>
            </div>
          </div>
        ) : (
          renderVideoContent()
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-sm">Cargando video...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-lg font-medium mb-2">Error al cargar el video</p>
              <p className="text-sm opacity-75">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                }}
                className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Overlays solo para reproductores no-iframe */}
        {!(video.videoType === 'youtube' || video.videoType === 'vimeo') && (
          <>
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
              {video.category}
            </div>

            {video.duration && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                {video.duration}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};