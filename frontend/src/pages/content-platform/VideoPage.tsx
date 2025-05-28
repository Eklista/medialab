// src/pages/ContentPlatform.tsx - Versión simplificada
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components';
import { UniversalVideoPlayer } from '../../components/video/UniversalVideoPlayer';
import { VideoData } from '../../types/video';
import { CardSlider } from '../../components/ui/CardSlider';
import { 
  EyeIcon, 
  CalendarIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';

// Ejemplo de datos que vendrían de tu API
const sampleVideo: VideoData = {
  id: '1',
  title: 'Graduación Medicina 2024 - Universidad Galileo',
  description: `Ceremonia de graduación de la promoción 2024 de la Facultad de Ciencias de la Salud (FACIMED). 
  
En esta emotiva ceremonia, celebramos el logro de nuestros nuevos médicos que se integran al servicio de la salud en Guatemala.

Momentos destacados:
• Discurso del Decano de FACIMED
• Juramentación Hipocrática
• Entrega de diplomas
• Palabras del mejor graduado`,
  thumbnail: '/api/placeholder/800/450',
  duration: '1:20:45',
  views: 25600,
  category: 'Graduaciones',
  faculty: 'FACIMED',
  publishedAt: '2024-02-28',
  tags: ['graduación', 'medicina', 'facimed', 'ceremonia', '2024'],
  instructor: 'Dr. Roberto Méndez',
  event: 'Graduación FACIMED 2024',
  location: 'Auditorio Principal - Universidad Galileo',
  academicYear: '2024',
  
  // Video source - esto viene del backend
  videoType: 'youtube',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  videoId: 'dQw4w9WgXcQ' // Opcional si ya está en la URL
};

// Ejemplos de diferentes tipos de video para testing
const videoExamples: VideoData[] = [
  {
    ...sampleVideo,
    id: 'youtube-1',
    title: 'Video de YouTube (con API)',
    videoType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    ...sampleVideo,
    id: 'vimeo-1',
    title: 'Video de Vimeo',
    videoType: 'vimeo',
    videoUrl: 'https://vimeo.com/123456789'
  },
  {
    ...sampleVideo,
    id: 's3-1',
    title: 'Video en S3 (futuro)',
    videoType: 's3',
    videoUrl: 'https://medialab-bucket.s3.amazonaws.com/videos/graduacion-2024.mp4'
  },
  {
    ...sampleVideo,
    id: 'external-1',
    title: 'Video externo/servidor propio',
    videoType: 'external',
    videoUrl: 'https://servidor-medialab.ug.edu.gt/videos/conferencia.mp4'
  }
];

// Videos relacionados simplificados
const relatedVideos = [
  {
    id: '2',
    title: 'Graduación Ingeniería en Sistemas 2024',
    thumbnail: '/api/placeholder/400/225',
    duration: '1:15:20',
    views: 19800,
    category: 'Graduaciones',
    faculty: 'FISICC',
    publishedAt: '2024-02-25'
  },
  {
    id: '3',
    title: 'Conferencia: Avances en Medicina Digital',
    thumbnail: '/api/placeholder/400/225',
    duration: '45:30',
    views: 12400,
    category: 'Conferencias',
    faculty: 'FACIMED',
    publishedAt: '2024-02-20'
  }
];

export const VideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos desde API
    // En producción: fetchVideo(id)
    setTimeout(() => {
      // Para testing, rotar entre diferentes tipos de video
      const videoIndex = parseInt(id || '0') % videoExamples.length;
      const selectedVideo = videoExamples[videoIndex] || sampleVideo;
      
      setVideo({
        ...selectedVideo,
        id: id || '1'
      });
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handleVideoClick = (clickedVideo: any) => {
    navigate(`/video/${clickedVideo.id}`);
  };

  const handleShare = async () => {
    if (navigator.share && video) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description?.substring(0, 100) + '...',
          url: window.location.href
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const formatViews = (views: number) => {
    if (views > 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views > 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-300 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!video) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Video no encontrado</h1>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Debug Info - Remover en producción */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>Debug:</strong> Tipo: {video.videoType} | ID: {video.id} | 
          URL: {video.videoUrl.substring(0, 50)}...
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Principal - Video y Detalles */}
          <div className="lg:col-span-2">
            {/* Video Player Universal */}
            <div className="mb-6">
              <UniversalVideoPlayer
                video={video}
                autoplay={false}
                onPlay={() => console.log('Video iniciado')}
                onPause={() => console.log('Video pausado')}
                onEnded={() => console.log('Video terminado')}
                onTimeUpdate={(time) => console.log('Tiempo:', time)}
                className="w-full"
              />
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Título y Estadísticas */}
              <div className="mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {video.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="h-4 w-4" />
                    <span>{formatViews(video.views || 0)} visualizaciones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    <span>{video.faculty}</span>
                  </div>
                  <div className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {video.videoType.toUpperCase()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      isLiked 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isLiked ? <HeartIconSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                    <span className="text-sm font-medium">{isLiked ? 'Te gusta' : 'Me gusta'}</span>
                  </button>

                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      isSaved 
                        ? 'bg-blue-50 border-blue-200 text-blue-600' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isSaved ? <BookmarkIconSolid className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
                    <span className="text-sm font-medium">{isSaved ? 'Guardado' : 'Guardar'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShareIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Compartir</span>
                  </button>
                </div>
              </div>

              {/* Description y detalles */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {video.description?.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
                  ))}
                </div>

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Videos Relacionados */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Videos Relacionados</h3>
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo.id}
                    onClick={() => handleVideoClick(relatedVideo)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <img 
                        src={relatedVideo.thumbnail} 
                        alt={relatedVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
                        {relatedVideo.duration}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors text-sm mb-2">
                        {relatedVideo.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-1">{relatedVideo.faculty}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatViews(relatedVideo.views)} vistas</span>
                        <span>•</span>
                        <span>{formatDate(relatedVideo.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Videos Relacionados - Mobile */}
        <div className="lg:hidden mt-12">
          <CardSlider
            title="Videos Relacionados"
            items={relatedVideos}
            onItemClick={handleVideoClick}
          />
        </div>
      </div>
    </PublicLayout>
  );
};