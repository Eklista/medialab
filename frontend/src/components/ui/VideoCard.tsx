// src/components/ui/VideoCard.tsx - VERSION CONECTADA CON SERVICIOS
import React, { useState, useCallback } from 'react';
import { PlayIcon, ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { VideosService, type Video } from '../../services/content';

// ==================== INTERFACES ====================

interface VideoCardProps {
  video: Video; // Usar el tipo Video de tus servicios
  onClick?: (video: Video) => void;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  onSetMain?: (video: Video) => void;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
  showActions?: boolean;
  showStatus?: boolean;
  isAdmin?: boolean;
}

// ==================== UTILIDADES ====================

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

const getStatusColor = (status: string) => {
  const colors = {
    'completed': 'bg-green-500',
    'processing': 'bg-blue-500',
    'pending': 'bg-yellow-500',
    'error': 'bg-red-500',
    'cancelled': 'bg-gray-500'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

const getStatusLabel = (status: string) => {
  const labels = {
    'completed': 'Completado',
    'processing': 'Procesando',
    'pending': 'Pendiente',
    'error': 'Error',
    'cancelled': 'Cancelado'
  };
  return labels[status as keyof typeof labels] || status;
};

// ==================== COMPONENTE PRINCIPAL ====================

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onClick,
  onEdit,
  onDelete,
  onSetMain,
  size = 'md',
  layout = 'vertical',
  showActions = false,
  showStatus = false,
  isAdmin = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingMain, setIsSettingMain] = useState(false);

  // ==================== HANDLERS ====================

  const handleClick = useCallback(() => {
    onClick?.(video);
  }, [onClick, video]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(video);
  }, [onEdit, video]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) return;

    setIsDeleting(true);
    try {
      await VideosService.deleteVideo(video.id);
      onDelete?.(video);
    } catch (error) {
      console.error('Error eliminando video:', error);
      alert('Error al eliminar el video');
    } finally {
      setIsDeleting(false);
    }
  }, [video, onDelete]);

  const handleSetMain = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingMain(true);
    try {
      await VideosService.setMainVideo(video.content_id, video.id);
      onSetMain?.(video);
    } catch (error) {
      console.error('Error estableciendo video principal:', error);
      alert('Error al establecer como video principal');
    } finally {
      setIsSettingMain(false);
    }
  }, [video, onSetMain]);

  // ==================== ESTILOS RESPONSIVOS ====================

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

  // ==================== RENDER ====================

  return (
    <div 
      className={`
        ${currentSize.container} cursor-pointer group transition-all duration-200 
        hover:scale-105 hover:shadow-lg bg-white rounded-lg overflow-hidden
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        ${video.is_main ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={handleClick}
    >
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-row gap-3'}`}>
        {/* ==================== THUMBNAIL ==================== */}
        <div className={`relative ${currentSize.image} flex-shrink-0 overflow-hidden ${isVertical ? 'w-full' : ''}`}>
          <img 
            src={video.thumbnail_url || '/placeholder-video.jpg'} 
            alt={video.video_id || 'Video thumbnail'}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-video.jpg';
            }}
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <PlayIcon className="h-12 w-12 text-white" />
          </div>
          
          {/* Duration badge */}
          {video.duration_formatted && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
              {video.duration_formatted}
            </div>
          )}
          
          {/* Video Type badge */}
          {video.video_type && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
              {video.video_type.display_name}
            </div>
          )}

          {/* Main Video badge */}
          {video.is_main && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
              PRINCIPAL
            </div>
          )}

          {/* Processing Status */}
          {showStatus && (
            <div className={`absolute bottom-2 left-2 ${getStatusColor(video.processing_status)} text-white px-2 py-1 rounded text-xs font-medium`}>
              {getStatusLabel(video.processing_status)}
            </div>
          )}

          {/* Actions Overlay */}
          {showActions && isAdmin && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              <button
                onClick={handleEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                title="Editar video"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded disabled:opacity-50"
                title="Eliminar video"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* ==================== CONTENT ==================== */}
        <div className={`${isVertical ? 'p-4' : 'flex-1 py-2'} space-y-2`}>
          {/* Video ID/Title */}
          <h3 className={`${currentSize.title} text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors`}>
            {video.video_id || `Video ${video.id.substring(0, 8)}`}
          </h3>
          
          {/* Original filename como descripción */}
          {video.original_filename && (
            <p className={`${currentSize.description} text-gray-600 line-clamp-2`}>
              {video.original_filename}
            </p>
          )}
          
          {/* Storage Provider */}
          {video.storage_provider && (
            <p className={`${currentSize.meta} text-blue-600 font-medium`}>
              {video.storage_provider.display_name}
            </p>
          )}
          
          {/* Meta info */}
          <div className={`flex items-center gap-3 ${currentSize.meta} text-gray-500`}>
            {/* File Size */}
            {video.file_size && (
              <div className="flex items-center gap-1">
                <span>{formatFileSize(video.file_size)}</span>
              </div>
            )}
            
            {/* Created Date */}
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDate(video.created_at)}</span>
            </div>

            {/* Dimensions */}
            {video.width && video.height && (
              <span>{video.width}x{video.height}</span>
            )}
          </div>

          {/* Admin Actions */}
          {showActions && isAdmin && !video.is_main && (
            <div className="pt-2">
              <button
                onClick={handleSetMain}
                disabled={isSettingMain}
                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded disabled:opacity-50"
              >
                {isSettingMain ? 'Estableciendo...' : 'Hacer Principal'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== UTILIDAD PARA FORMATEAR TAMAÑOS ====================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==================== VIDEO GRID CONECTADO ====================

interface VideoGridProps {
  videos: Video[];
  contentId?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  onVideoClick?: (video: Video) => void;
  onVideoEdit?: (video: Video) => void;
  onVideoDelete?: (video: Video) => void;
  onVideoSetMain?: (video: Video) => void;
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  showStatus?: boolean;
  isAdmin?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  columns = 3,
  gap = 'md',
  onVideoClick,
  onVideoEdit,
  onVideoDelete,
  onVideoSetMain,
  loading = false,
  emptyMessage = 'No hay videos disponibles',
  showActions = false,
  showStatus = false,
  isAdmin = false
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
            <div className="bg-gray-200 rounded-lg h-40 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sin videos</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} ${gaps[gap]}`}>
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onClick={onVideoClick}
          onEdit={onVideoEdit}
          onDelete={onVideoDelete}
          onSetMain={onVideoSetMain}
          showActions={showActions}
          showStatus={showStatus}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};