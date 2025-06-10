// frontend/src/services/content/photos.ts
import apiClient, { handleApiError, createCacheKey, requestDeduplicator } from '../api';

// ==================== INTERFACES ====================

export interface Photo {
  id: string;
  content_id: string;
  photo_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  caption?: string;
  alt_text?: string;
  sort_order: number;
  is_featured: boolean;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PhotoCreate {
  content_id: string;
  photo_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  caption?: string;
  alt_text?: string;
  sort_order?: number;
  is_featured?: boolean;
  is_cover?: boolean;
}

export interface PhotoUpdate {
  photo_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  caption?: string;
  alt_text?: string;
  sort_order?: number;
  is_featured?: boolean;
  is_cover?: boolean;
}

export interface GalleryData {
  content_id: string;
  cover_photo?: Photo;
  featured_photos: Photo[];
  all_photos: Photo[];
  total_photos: number;
  has_cover: boolean;
  featured_count: number;
}

export interface UploadStatus {
  task_id: string;
  status: 'processing' | 'completed' | 'error';
  files_count: number;
  photos_count: number;
  photos: Array<{
    id: string;
    thumbnail_url?: string;
    photo_url: string;
  }>;
}

export interface PhotosResponse {
  success: boolean;
  message: string;
  data: {
    photos: Photo[];
    total: number;
    skip: number;
    limit: number;
    content_id?: string;
  };
}

export interface PhotoResponse {
  success: boolean;
  message: string;
  data: Photo;
}

export interface GalleryResponse {
  success: boolean;
  message: string;
  data: GalleryData;
}

// ==================== SERVICE CLASS ====================

export class PhotosService {
  private static readonly BASE_URL = '/content/photos';
  private static readonly PUBLIC_URL = '/public/content/photos';

  // ==================== CRUD BÁSICO ====================

  static async getPhotos(params?: {
    skip?: number;
    limit?: number;
    content_id?: string;
  }): Promise<PhotosResponse> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/list`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(this.BASE_URL, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPhotoById(id: string): Promise<PhotoResponse> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/${id}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/${id}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createPhoto(data: PhotoCreate): Promise<PhotoResponse> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updatePhoto(id: string, data: PhotoUpdate): Promise<PhotoResponse> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deletePhoto(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/${id}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== SUBIDA MASIVA ====================

  static async bulkUploadGallery(
    files: File[],
    contentId: string,
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      task_id: string;
      files_count: number;
      status: string;
    };
  }> {
    try {
      if (files.length === 0) {
        throw new Error('No se han seleccionado archivos');
      }

      if (files.length > 50) {
        throw new Error('Máximo 50 archivos por lote');
      }

      // Validar tipos de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const invalidFiles = files.filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        throw new Error(`Archivos con formato inválido: ${invalidFiles.map(f => f.name).join(', ')}`);
      }

      const formData = new FormData();
      
      // Agregar archivos
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await apiClient.post(
        `${this.BASE_URL}/bulk-upload-gallery?content_id=${contentId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        }
      );
      
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getUploadStatus(taskId: string): Promise<UploadStatus> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/upload-status/${taskId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES DE GALERÍA ====================

  static async getGallery(contentId: string): Promise<GalleryResponse> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/gallery/${contentId}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/gallery/${contentId}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async setCoverPhoto(contentId: string, photoId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      content_id: string;
      photo_id: string;
    };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/content/${contentId}/set-cover/${photoId}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async toggleFeatured(photoId: string): Promise<{
    success: boolean;
    message: string;
    data: { photo_id: string };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/${photoId}/toggle-featured`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async reorderPhotos(
    contentId: string, 
    photoOrders: Array<{ photo_id: string; sort_order: number }>
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      content_id: string;
      reordered_count: number;
    };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/content/${contentId}/reorder`, photoOrders);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  static async getPublicGallery(contentId: string): Promise<GalleryResponse> {
    try {
      const cacheKey = createCacheKey(`/public/content/${contentId}/gallery`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/public/content/${contentId}/gallery`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicPhotos(params?: {
    skip?: number;
    limit?: number;
    content_id?: string;
    featured_only?: boolean;
  }): Promise<PhotosResponse> {
    try {
      const cacheKey = createCacheKey(this.PUBLIC_URL, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(this.PUBLIC_URL, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicPhotosByContent(
    contentId: string,
    params?: {
      skip?: number;
      limit?: number;
      featured_only?: boolean;
    }
  ): Promise<PhotosResponse> {
    try {
      const cacheKey = createCacheKey(`/public/content/${contentId}/photos`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/public/content/${contentId}/photos`, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicPhotoById(id: string): Promise<PhotoResponse> {
    try {
      const cacheKey = createCacheKey(`${this.PUBLIC_URL}/${id}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.PUBLIC_URL}/${id}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES BATCH ====================

  static async bulkUpdatePhotos(updates: Array<{
    id: string;
    data: PhotoUpdate;
  }>): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: number;
      failed: number;
      results: PhotoResponse[];
    };
  }> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.updatePhoto(id, data).catch(error => ({ error: error.message, id }))
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(result => !('error' in result)) as PhotoResponse[];
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

  static async bulkDeletePhotos(photoIds: string[]): Promise<{
    success: boolean;
    message: string;
    data: {
      deleted: number;
      failed: number;
    };
  }> {
    try {
      const promises = photoIds.map(id =>
        this.deletePhoto(id).catch(error => ({ error: error.message, id }))
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(result => !('error' in result));
      const failed = results.filter(result => 'error' in result);
      
      return {
        success: true,
        message: `Eliminación batch completada: ${successful.length} exitosas, ${failed.length} fallidas`,
        data: {
          deleted: successful.length,
          failed: failed.length
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== ESTADÍSTICAS Y ADMIN ====================

  static async getPhotosStats(): Promise<{
    success: boolean;
    message: string;
    data: {
      total_photos: number;
      featured_photos: number;
      cover_photos: number;
      total_size_bytes: number;
      average_width: number;
      average_height: number;
    };
  }> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/admin/stats`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/admin/stats`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async cleanupOrphanedPhotos(daysOld: number = 30): Promise<{
    success: boolean;
    message: string;
    data: {
      cleaned_count: number;
      days_old: number;
    };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/admin/cleanup-orphaned?days_old=${daysOld}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== UTILIDADES ====================

  static validatePhotoData(data: PhotoCreate | PhotoUpdate): string[] {
    const errors: string[] = [];
    
    if ('photo_url' in data && data.photo_url) {
      try {
        new URL(data.photo_url);
      } catch {
        errors.push('La URL de la foto no es válida');
      }
    }
    
    if ('file_size' in data && data.file_size !== undefined) {
      if (data.file_size < 0) {
        errors.push('El tamaño del archivo no puede ser negativo');
      }
      if (data.file_size > 50 * 1024 * 1024) { // 50MB
        errors.push('El archivo es demasiado grande (máximo 50MB)');
      }
    }
    
    if ('width' in data && data.width !== undefined && data.width < 0) {
      errors.push('El ancho no puede ser negativo');
    }
    
    if ('height' in data && data.height !== undefined && data.height < 0) {
      errors.push('El alto no puede ser negativo');
    }
    
    if ('sort_order' in data && data.sort_order !== undefined && data.sort_order < 0) {
      errors.push('El orden no puede ser negativo');
    }
    
    return errors;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static generateOptimizedSizes(width: number, height: number): {
    thumbnail: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
  } {
    const aspectRatio = width / height;
    
    return {
      thumbnail: {
        width: Math.min(300, width),
        height: Math.min(300, height)
      },
      medium: {
        width: Math.min(800, width),
        height: Math.min(Math.round(800 / aspectRatio), height)
      },
      large: {
        width: Math.min(1200, width),
        height: Math.min(Math.round(1200 / aspectRatio), height)
      }
    };
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