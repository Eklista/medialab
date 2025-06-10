// frontend/src/services/content/videoTypes.ts
import apiClient, { handleApiError, createCacheKey, requestDeduplicator } from '../api';

// ==================== INTERFACES ====================

export interface VideoType {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoTypeCreate {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

export interface VideoTypeUpdate {
  name?: string;
  display_name?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

export interface StorageProvider {
  id: number;
  name: string;
  display_name: string;
  video_type_id: number;
  is_active: boolean;
  config?: Record<string, any>;
  max_file_size?: number;
  supported_formats?: string[];
  api_endpoint?: string;
  created_at: string;
  updated_at: string;
  video_type?: VideoType;
}

export interface StorageProviderCreate {
  name: string;
  display_name: string;
  video_type_id: number;
  is_active?: boolean;
  config?: Record<string, any>;
  max_file_size?: number;
  supported_formats?: string[];
  api_endpoint?: string;
}

export interface StorageProviderUpdate {
  name?: string;
  display_name?: string;
  video_type_id?: number;
  is_active?: boolean;
  config?: Record<string, any>;
  max_file_size?: number;
  supported_formats?: string[];
  api_endpoint?: string;
}

export interface VideoTypesResponse {
  success: boolean;
  message: string;
  data: {
    video_types: VideoType[];
    total: number;
    skip: number;
    limit: number;
    active_only?: boolean;
    search?: string;
  };
}

export interface VideoTypeResponse {
  success: boolean;
  message: string;
  data: VideoType;
}

export interface StorageProvidersResponse {
  success: boolean;
  message: string;
  data: {
    storage_providers: StorageProvider[];
    total: number;
    skip: number;
    limit: number;
    active_only?: boolean;
    video_type_id?: number;
    search?: string;
  };
}

export interface StorageProviderResponse {
  success: boolean;
  message: string;
  data: StorageProvider;
}

// ==================== SERVICE CLASS ====================

export class VideoTypesService {
  private static readonly VIDEO_TYPES_URL = '/content/video-types';
  private static readonly STORAGE_PROVIDERS_URL = '/content/storage-providers';
  private static readonly PUBLIC_VIDEO_TYPES_URL = '/public/content/video-types';
  private static readonly PUBLIC_STORAGE_PROVIDERS_URL = '/public/content/storage-providers';

  // ==================== CRUD VIDEO TYPES ====================

  static async getVideoTypes(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    search?: string;
  }): Promise<VideoTypesResponse> {
    try {
      const cacheKey = createCacheKey(`${this.VIDEO_TYPES_URL}/list`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.VIDEO_TYPES_URL}/`, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getVideoTypeById(id: number): Promise<VideoTypeResponse> {
    try {
      const cacheKey = createCacheKey(`${this.VIDEO_TYPES_URL}/${id}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.VIDEO_TYPES_URL}/${id}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createVideoType(data: VideoTypeCreate): Promise<VideoTypeResponse> {
    try {
      const response = await apiClient.post(`${this.VIDEO_TYPES_URL}/`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateVideoType(id: number, data: VideoTypeUpdate): Promise<VideoTypeResponse> {
    try {
      const response = await apiClient.put(`${this.VIDEO_TYPES_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteVideoType(id: number): Promise<{
    success: boolean;
    message: string;
    data: { type_id: number };
  }> {
    try {
      const response = await apiClient.delete(`${this.VIDEO_TYPES_URL}/${id}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== CRUD STORAGE PROVIDERS ====================

  static async getStorageProviders(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    video_type_id?: number;
    search?: string;
  }): Promise<StorageProvidersResponse> {
    try {
      const cacheKey = createCacheKey(`${this.STORAGE_PROVIDERS_URL}/list`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.STORAGE_PROVIDERS_URL}/`, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getStorageProviderById(id: number): Promise<StorageProviderResponse> {
    try {
      const cacheKey = createCacheKey(`${this.STORAGE_PROVIDERS_URL}/${id}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.STORAGE_PROVIDERS_URL}/${id}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createStorageProvider(data: StorageProviderCreate): Promise<StorageProviderResponse> {
    try {
      const response = await apiClient.post(`${this.STORAGE_PROVIDERS_URL}/`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateStorageProvider(id: number, data: StorageProviderUpdate): Promise<StorageProviderResponse> {
    try {
      const response = await apiClient.put(`${this.STORAGE_PROVIDERS_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteStorageProvider(id: number): Promise<{
    success: boolean;
    message: string;
    data: { provider_id: number };
  }> {
    try {
      const response = await apiClient.delete(`${this.STORAGE_PROVIDERS_URL}/${id}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  static async getPublicVideoTypes(params?: {
    skip?: number;
    limit?: number;
  }): Promise<VideoTypesResponse> {
    try {
      const cacheKey = createCacheKey(this.PUBLIC_VIDEO_TYPES_URL, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(this.PUBLIC_VIDEO_TYPES_URL, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicStorageProviders(params?: {
    skip?: number;
    limit?: number;
    video_type_id?: number;
  }): Promise<StorageProvidersResponse> {
    try {
      const cacheKey = createCacheKey(this.PUBLIC_STORAGE_PROVIDERS_URL, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(this.PUBLIC_STORAGE_PROVIDERS_URL, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES ESPECIALIZADAS ====================

  static async getProvidersByVideoType(videoTypeId: number): Promise<StorageProvidersResponse> {
    try {
      const cacheKey = createCacheKey(`${this.STORAGE_PROVIDERS_URL}/by-type/${videoTypeId}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.STORAGE_PROVIDERS_URL}/`, {
          params: { video_type_id: videoTypeId, active_only: true }
        });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getVideoTypesWithProviders(): Promise<{
    success: boolean;
    message: string;
    data: Array<VideoType & { providers: StorageProvider[] }>;
  }> {
    try {
      const cacheKey = createCacheKey(`${this.VIDEO_TYPES_URL}/with-providers`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        // Obtener tipos de video y proveedores por separado
        const [typesResponse, providersResponse] = await Promise.all([
          this.getVideoTypes({ active_only: true }),
          this.getStorageProviders({ active_only: true })
        ]);

        if (!typesResponse.success || !providersResponse.success) {
          throw new Error('Error obteniendo datos');
        }

        // Combinar datos
        const typesWithProviders = typesResponse.data.video_types.map(type => ({
          ...type,
          providers: providersResponse.data.storage_providers.filter(
            provider => provider.video_type_id === type.id
          )
        }));

        return {
          success: true,
          message: 'Tipos de video con proveedores obtenidos exitosamente',
          data: typesWithProviders
        };
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES BATCH ====================

  static async bulkUpdateVideoTypes(updates: Array<{
    id: number;
    data: VideoTypeUpdate;
  }>): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: number;
      failed: number;
      results: VideoTypeResponse[];
    };
  }> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.updateVideoType(id, data).catch(error => ({ error: error.message, id }))
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(result => !('error' in result)) as VideoTypeResponse[];
      const failed = results.filter(result => 'error' in result);
      
      return {
        success: true,
        message: `Actualización batch completada: ${successful.length} exitosas, ${failed.length} fallidas`,
        data: {
          updated: successful.length,
          failed: failed.length,
          results: successful
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async bulkUpdateStorageProviders(updates: Array<{
    id: number;
    data: StorageProviderUpdate;
  }>): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: number;
      failed: number;
      results: StorageProviderResponse[];
    };
  }> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.updateStorageProvider(id, data).catch(error => ({ error: error.message, id }))
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(result => !('error' in result)) as StorageProviderResponse[];
      const failed = results.filter(result => 'error' in result);
      
      return {
        success: true,
        message: `Actualización batch completada: ${successful.length} exitosas, ${failed.length} fallidas`,
        data: {
          updated: successful.length,
          failed: failed.length,
          results: successful
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== UTILIDADES DE VALIDACIÓN ====================

  static validateVideoTypeData(data: VideoTypeCreate | VideoTypeUpdate): string[] {
    const errors: string[] = [];
    
    if ('name' in data && data.name) {
      if (data.name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      if (data.name.length > 50) {
        errors.push('El nombre no puede exceder 50 caracteres');
      }
      if (!/^[a-z0-9_-]+$/.test(data.name)) {
        errors.push('El nombre solo puede contener letras minúsculas, números, guiones y guiones bajos');
      }
    }
    
    if ('display_name' in data && data.display_name) {
      if (data.display_name.length < 2) {
        errors.push('El nombre para mostrar debe tener al menos 2 caracteres');
      }
      if (data.display_name.length > 100) {
        errors.push('El nombre para mostrar no puede exceder 100 caracteres');
      }
    }
    
    return errors;
  }

  static validateStorageProviderData(data: StorageProviderCreate | StorageProviderUpdate): string[] {
    const errors: string[] = [];
    
    if ('name' in data && data.name) {
      if (data.name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      if (data.name.length > 50) {
        errors.push('El nombre no puede exceder 50 caracteres');
      }
      if (!/^[a-z0-9_-]+$/.test(data.name)) {
        errors.push('El nombre solo puede contener letras minúsculas, números, guiones y guiones bajos');
      }
    }
    
    if ('display_name' in data && data.display_name) {
      if (data.display_name.length < 2) {
        errors.push('El nombre para mostrar debe tener al menos 2 caracteres');
      }
      if (data.display_name.length > 100) {
        errors.push('El nombre para mostrar no puede exceder 100 caracteres');
      }
    }
    
    if ('max_file_size' in data && data.max_file_size !== undefined) {
      if (data.max_file_size < 0) {
        errors.push('El tamaño máximo de archivo no puede ser negativo');
      }
      if (data.max_file_size > 5 * 1024 * 1024 * 1024) { // 5GB
        errors.push('El tamaño máximo de archivo no puede exceder 5GB');
      }
    }
    
    if ('api_endpoint' in data && data.api_endpoint) {
      try {
        new URL(data.api_endpoint);
      } catch {
        errors.push('El endpoint de API debe ser una URL válida');
      }
    }
    
    if ('supported_formats' in data && data.supported_formats) {
      const validFormats = [
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'mpg', 'mpeg'
      ];
      const invalidFormats = data.supported_formats.filter(
        format => !validFormats.includes(format.toLowerCase())
      );
      if (invalidFormats.length > 0) {
        errors.push(`Formatos no válidos: ${invalidFormats.join(', ')}`);
      }
    }
    
    return errors;
  }

  // ==================== UTILIDADES DE CONFIGURACIÓN ====================

  static getDefaultVideoTypeConfig(typeName: string): Record<string, any> {
    const configs: Record<string, Record<string, any>> = {
      'youtube': {
        api_key_required: true,
        quality_options: ['720p', '1080p', '1440p', '2160p'],
        auto_captions: false
      },
      'vimeo': {
        api_key_required: true,
        quality_options: ['720p', '1080p', '1440p', '4K'],
        privacy_settings: ['public', 'unlisted', 'private']
      },
      'local': {
        max_concurrent_uploads: 3,
        auto_transcode: true,
        generate_thumbnails: true,
        supported_codecs: ['h264', 'h265', 'vp8', 'vp9']
      },
      's3': {
        bucket_required: true,
        region_required: true,
        access_key_required: true,
        secret_key_required: true,
        storage_class: 'STANDARD'
      }
    };
    
    return configs[typeName] || {};
  }

  static getDefaultStorageProviderConfig(providerName: string): Record<string, any> {
    const configs: Record<string, Record<string, any>> = {
      'aws_s3': {
        region: 'us-east-1',
        storage_class: 'STANDARD',
        encryption: 'AES256',
        versioning: false
      },
      'google_cloud': {
        region: 'us-central1',
        storage_class: 'STANDARD',
        encryption: true
      },
      'azure_blob': {
        tier: 'Hot',
        encryption: true,
        redundancy: 'LRS'
      },
      'youtube_api': {
        privacy: 'unlisted',
        category: '22', // People & Blogs
        auto_captions: false
      },
      'vimeo_api': {
        privacy: 'anybody',
        embed_privacy: 'public'
      }
    };
    
    return configs[providerName] || {};
  }

  // ==================== UTILIDADES DE FORMATO ====================

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getProviderTypeIcon(providerName: string): string {
    const icons: Record<string, string> = {
      'youtube': '📺',
      'vimeo': '🎬',
      'local': '💾',
      'aws_s3': '☁️',
      'google_cloud': '🌐',
      'azure_blob': '🔷'
    };
    
    return icons[providerName] || '📁';
  }

  static getProviderTypeName(providerName: string): string {
    const names: Record<string, string> = {
      'youtube': 'YouTube',
      'vimeo': 'Vimeo',
      'local': 'Almacenamiento Local',
      'aws_s3': 'Amazon S3',
      'google_cloud': 'Google Cloud Storage',
      'azure_blob': 'Azure Blob Storage'
    };
    
    return names[providerName] || providerName;
  }

  // ==================== CACHE MANAGEMENT ====================

  static clearCache(): void {
    requestDeduplicator.clear();
  }

  static getCacheStats(): {
    pendingCount: number;
    pendingKeys: string[];
  } {
    return requestDeduplicator.getStats();
  }
}