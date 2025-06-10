// frontend/src/services/content/index.ts - ARCHIVO PRINCIPAL DE EXPORTACIÓN

// ==================== EXPORTAR SERVICIOS ====================
export { CategoriesService } from './categories';
export { PhotosService } from './photos';
export { VideosService } from './videos';
export { VideoTypesService } from './videoTypes';

// ==================== EXPORTAR TIPOS DE CATEGORÍAS ====================
export type {
  ContentCategory,
  ContentCategoryCreate,
  ContentCategoryUpdate,
  DepartmentWithCategories,
  CategoriesResponse,
  CategoryResponse,
  DepartmentsResponse
} from './categories';

// ==================== EXPORTAR TIPOS DE FOTOS ====================
export type {
  Photo,
  PhotoCreate,
  PhotoUpdate,
  GalleryData,
  UploadStatus,
  PhotosResponse,
  PhotoResponse,
  GalleryResponse
} from './photos';

// ==================== EXPORTAR TIPOS DE VIDEOS ====================
export type {
  Video,
  VideoCreate,
  VideoUpdate,
  VideoFromYouTube,
  VideoFromVimeo,
  VideoFromUpload,
  VideosResponse,
  VideoResponse,
  VideoProcessingUpdate
} from './videos';

// ==================== EXPORTAR TIPOS DE VIDEO TYPES ====================
export type {
  VideoType,
  VideoTypeCreate,
  VideoTypeUpdate,
  StorageProvider,
  StorageProviderCreate,
  StorageProviderUpdate,
  VideoTypesResponse,
  VideoTypeResponse,
  StorageProvidersResponse,
  StorageProviderResponse
} from './videoTypes';

// ==================== IMPORTAR PARA USO EN LA CLASE ====================
import { CategoriesService } from './categories';
import { PhotosService } from './photos';
import { VideosService } from './videos';
import { VideoTypesService } from './videoTypes';

// ==================== CLASE PRINCIPAL UNIFICADA ====================

export class ContentServices {
  // Servicios de categorías
  static get categories() {
    return CategoriesService;
  }

  // Servicios de fotos
  static get photos() {
    return PhotosService;
  }

  // Servicios de videos
  static get videos() {
    return VideosService;
  }

  // Servicios de tipos de video
  static get videoTypes() {
    return VideoTypesService;
  }

  // ==================== MÉTODOS DE UTILIDAD GENERALES ====================

  /**
   * Limpiar todos los caches de contenido
   */
  static clearAllCaches(): void {
    CategoriesService.clearCache();
    PhotosService.clearCache();
    VideosService.clearCache();
    VideoTypesService.clearCache();
  }

  /**
   * Obtener estadísticas de todos los caches
   */
  static getAllCacheStats(): {
    categories: { pendingCount: number; pendingKeys: string[] };
    photos: { pendingCount: number; pendingKeys: string[] };
    videos: { pendingCount: number; pendingKeys: string[] };
    videoTypes: { pendingCount: number; pendingKeys: string[] };
    total: number;
  } {
    const categoriesStats = CategoriesService.getCacheStats();
    const photosStats = PhotosService.getCacheStats();
    const videosStats = VideosService.getCacheStats();
    const videoTypesStats = VideoTypesService.getCacheStats();

    return {
      categories: categoriesStats,
      photos: photosStats,
      videos: videosStats,
      videoTypes: videoTypesStats,
      total: categoriesStats.pendingCount + 
             photosStats.pendingCount + 
             videosStats.pendingCount + 
             videoTypesStats.pendingCount
    };
  }

  /**
   * Obtener un resumen completo del contenido (dashboard)
   */
  static async getContentOverview(): Promise<{
    success: boolean;
    message: string;
    data: {
      categories: {
        total: number;
        active: number;
      };
      photos: {
        total_photos: number;
        featured_photos: number;
        total_size_bytes: number;
      };
      videos: {
        total_videos: number;
        processed_videos: number;
        pending_videos: number;
        failed_videos: number;
      };
      video_types: {
        total: number;
        active: number;
      };
      storage_providers: {
        total: number;
        active: number;
      };
    };
  }> {
    try {
      // Ejecutar todas las consultas en paralelo
      const [
        categoriesResponse,
        photosStatsResponse,
        videosStatsResponse,
        videoTypesResponse,
        providersResponse
      ] = await Promise.all([
        CategoriesService.getCategories({ limit: 1 }).catch(() => null),
        PhotosService.getPhotosStats().catch(() => null),
        VideosService.getVideosStats().catch(() => null),
        VideoTypesService.getVideoTypes({ limit: 1 }).catch(() => null),
        VideoTypesService.getStorageProviders({ limit: 1 }).catch(() => null)
      ]);

      return {
        success: true,
        message: 'Resumen de contenido obtenido exitosamente',
        data: {
          categories: {
            total: categoriesResponse?.data?.total || 0,
            active: categoriesResponse?.data?.categories?.filter((c: any) => c.is_active)?.length || 0
          },
          photos: {
            total_photos: photosStatsResponse?.data?.total_photos || 0,
            featured_photos: photosStatsResponse?.data?.featured_photos || 0,
            total_size_bytes: photosStatsResponse?.data?.total_size_bytes || 0
          },
          videos: {
            total_videos: videosStatsResponse?.data?.total_videos || 0,
            processed_videos: videosStatsResponse?.data?.processed_videos || 0,
            pending_videos: videosStatsResponse?.data?.pending_videos || 0,
            failed_videos: videosStatsResponse?.data?.failed_videos || 0
          },
          video_types: {
            total: videoTypesResponse?.data?.total || 0,
            active: videoTypesResponse?.data?.video_types?.filter((vt: any) => vt.is_active)?.length || 0
          },
          storage_providers: {
            total: providersResponse?.data?.total || 0,
            active: providersResponse?.data?.storage_providers?.filter((sp: any) => sp.is_active)?.length || 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error obteniendo resumen de contenido',
        data: {
          categories: { total: 0, active: 0 },
          photos: { total_photos: 0, featured_photos: 0, total_size_bytes: 0 },
          videos: { total_videos: 0, processed_videos: 0, pending_videos: 0, failed_videos: 0 },
          video_types: { total: 0, active: 0 },
          storage_providers: { total: 0, active: 0 }
        }
      };
    }
  }

  /**
   * Buscar en todo el contenido
   */
  static async searchAll(query: string, options?: {
    includeCategories?: boolean;
    includePhotos?: boolean;
    includeVideos?: boolean;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      categories: any[];
      photos: any[];
      videos: any[];
      total_results: number;
    };
  }> {
    try {
      const {
        includeCategories = true,
        includePhotos = true,
        includeVideos = true,
        limit = 50
      } = options || {};

      const promises: Promise<any>[] = [];

      if (includeCategories) {
        promises.push(
          CategoriesService.getCategories({ search: query, limit }).catch(() => ({ data: { categories: [] } }))
        );
      } else {
        promises.push(Promise.resolve({ data: { categories: [] } }));
      }

      if (includePhotos) {
        promises.push(
          PhotosService.getPhotos({ skip: 0, limit }).catch(() => ({ data: { photos: [] } }))
        );
      } else {
        promises.push(Promise.resolve({ data: { photos: [] } }));
      }

      if (includeVideos) {
        promises.push(
          VideosService.getVideos({ search: query, limit }).catch(() => ({ data: { videos: [] } }))
        );
      } else {
        promises.push(Promise.resolve({ data: { videos: [] } }));
      }

      const [categoriesResult, photosResult, videosResult] = await Promise.all(promises);

      const categories = categoriesResult.data?.categories || [];
      const photos = photosResult.data?.photos || [];
      const videos = videosResult.data?.videos || [];

      return {
        success: true,
        message: `Búsqueda completada: encontrados ${categories.length + photos.length + videos.length} resultados`,
        data: {
          categories,
          photos,
          videos,
          total_results: categories.length + photos.length + videos.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en la búsqueda',
        data: {
          categories: [],
          photos: [],
          videos: [],
          total_results: 0
        }
      };
    }
  }

  /**
   * Validar configuración del CMS
   */
  static async validateConfiguration(): Promise<{
    success: boolean;
    message: string;
    data: {
      categories_configured: boolean;
      video_types_configured: boolean;
      storage_providers_configured: boolean;
      issues: string[];
      recommendations: string[];
    };
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Verificar tipos de video
      const videoTypesResponse = await VideoTypesService.getVideoTypes({ active_only: true });
      const videoTypes = videoTypesResponse.data?.video_types || [];

      if (videoTypes.length === 0) {
        issues.push('No hay tipos de video configurados');
        recommendations.push('Crear al menos un tipo de video (YouTube, Vimeo, o Local)');
      }

      // Verificar proveedores de almacenamiento
      const providersResponse = await VideoTypesService.getStorageProviders({ active_only: true });
      const providers = providersResponse.data?.storage_providers || [];

      if (providers.length === 0) {
        issues.push('No hay proveedores de almacenamiento configurados');
        recommendations.push('Configurar al menos un proveedor de almacenamiento');
      }

      // Verificar que cada tipo de video tenga al menos un proveedor
      for (const videoType of videoTypes) {
        const typeProviders = providers.filter((p: any) => p.video_type_id === videoType.id);
        if (typeProviders.length === 0) {
          issues.push(`El tipo de video "${videoType.display_name}" no tiene proveedores configurados`);
          recommendations.push(`Configurar un proveedor para el tipo "${videoType.display_name}"`);
        }
      }

      // Verificar categorías
      const categoriesResponse = await CategoriesService.getCategories({ active_only: true, limit: 1 });
      const hasCategories = (categoriesResponse.data?.total || 0) > 0;

      if (!hasCategories) {
        recommendations.push('Crear categorías para organizar el contenido');
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 ? 'Configuración del CMS válida' : 'Se encontraron problemas de configuración',
        data: {
          categories_configured: hasCategories,
          video_types_configured: videoTypes.length > 0,
          storage_providers_configured: providers.length > 0,
          issues,
          recommendations
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error validando configuración del CMS',
        data: {
          categories_configured: false,
          video_types_configured: false,
          storage_providers_configured: false,
          issues: ['Error de conexión al validar configuración'],
          recommendations: ['Verificar conectividad con el servidor']
        }
      };
    }
  }

  /**
   * Obtener configuración inicial recomendada
   */
  static getRecommendedInitialSetup(): {
    videoTypes: any[];
    storageProviders: any[];
    categories: any[];
  } {
    return {
      videoTypes: [
        {
          name: 'youtube',
          display_name: 'YouTube',
          description: 'Videos embebidos desde YouTube',
          icon: 'youtube',
          is_active: true
        },
        {
          name: 'vimeo',
          display_name: 'Vimeo',
          description: 'Videos embebidos desde Vimeo',
          icon: 'vimeo',
          is_active: true
        },
        {
          name: 'local',
          display_name: 'Almacenamiento Local',
          description: 'Videos subidos directamente al servidor',
          icon: 'upload',
          is_active: true
        }
      ],
      storageProviders: [
        {
          name: 'youtube_embed',
          display_name: 'YouTube Embed',
          is_active: true,
          supported_formats: ['youtube'],
          config: {
            privacy: 'unlisted',
            auto_captions: false
          }
        },
        {
          name: 'vimeo_embed',
          display_name: 'Vimeo Embed',
          is_active: true,
          supported_formats: ['vimeo'],
          config: {
            privacy: 'anybody',
            embed_privacy: 'public'
          }
        },
        {
          name: 'local_storage',
          display_name: 'Servidor Local',
          is_active: true,
          max_file_size: 500 * 1024 * 1024, // 500MB
          supported_formats: ['mp4', 'webm', 'avi', 'mov'],
          config: {
            auto_transcode: true,
            generate_thumbnails: true
          }
        }
      ],
      categories: [
        {
          name: 'Graduaciones',
          slug: 'graduaciones',
          description: 'Contenido de ceremonias de graduación',
          icon: 'graduation-cap',
          color: '#3B82F6',
          sort_order: 1,
          is_active: true
        },
        {
          name: 'Eventos',
          slug: 'eventos',
          description: 'Eventos especiales y celebraciones',
          icon: 'calendar',
          color: '#10B981',
          sort_order: 2,
          is_active: true
        },
        {
          name: 'Conferencias',
          slug: 'conferencias',
          description: 'Charlas y presentaciones académicas',
          icon: 'microphone',
          color: '#F59E0B',
          sort_order: 3,
          is_active: true
        }
      ]
    };
  }
}

// Export por defecto
export default ContentServices;