// frontend/src/services/content/categories.ts
import apiClient, { handleApiError, createCacheKey, requestDeduplicator } from '../api';

export interface ContentCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentCategoryCreate {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ContentCategoryUpdate {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    categories: ContentCategory[];
    total: number;
    skip: number;
    limit: number;
    search?: string;
  };
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: ContentCategory;
}

export class CategoriesService {
  private static readonly BASE_URL = '/content/categories';

  // ==================== CRUD BÁSICO ====================

  static async getCategories(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    search?: string;
  }): Promise<CategoriesResponse> {
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

  static async getCategoryById(id: number): Promise<CategoryResponse> {
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

  static async getCategoryBySlug(slug: string): Promise<CategoryResponse> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/slug/${slug}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/slug/${slug}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createCategory(data: ContentCategoryCreate): Promise<CategoryResponse> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      
      // Limpiar cache después de crear
      requestDeduplicator.clear();
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateCategory(id: number, data: ContentCategoryUpdate): Promise<CategoryResponse> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      
      // Limpiar cache después de actualizar
      requestDeduplicator.clear();
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/${id}`);
      
      // Limpiar cache después de eliminar
      requestDeduplicator.clear();
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES ESPECÍFICAS ====================

  static async assignToDepart‌ment(departmentId: number, categoryId: number): Promise<any> {
    try {
      const response = await apiClient.post(
        `${this.BASE_URL}/departments/${departmentId}/assign/${categoryId}`
      );
      
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async removeFromDepartment(departmentId: number, categoryId: number): Promise<any> {
    try {
      const response = await apiClient.delete(
        `${this.BASE_URL}/departments/${departmentId}/remove/${categoryId}`
      );
      
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getDepartmentsWithCategories(): Promise<any> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/departments/with-categories`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/departments/with-categories`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  static async getPublicCategories(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<CategoriesResponse> {
    try {
      const cacheKey = createCacheKey('/public/content/categories', params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/public/content/categories', { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicCategoryBySlug(slug: string): Promise<CategoryResponse> {
    try {
      const cacheKey = createCacheKey(`/public/content/categories/${slug}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/public/content/categories/${slug}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// ==================================================================================
// frontend/src/services/content/videoTypes.ts

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

export class VideoTypesService {
  private static readonly BASE_URL = '/content/video-types';

  // ==================== VIDEO TYPES ====================

  static async getVideoTypes(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    search?: string;
  }): Promise<any> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/list`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/`, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getVideoTypeById(id: number): Promise<any> {
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

  static async createVideoType(data: VideoTypeCreate): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateVideoType(id: number, data: VideoTypeUpdate): Promise<any> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteVideoType(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/${id}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== STORAGE PROVIDERS ====================

  static async getStorageProviders(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    video_type_id?: number;
    search?: string;
  }): Promise<any> {
    try {
      const cacheKey = createCacheKey('/content/storage-providers', params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/content/storage-providers/', { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getStorageProviderById(id: number): Promise<any> {
    try {
      const cacheKey = createCacheKey(`/content/storage-providers/${id}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/content/storage-providers/${id}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createStorageProvider(data: StorageProviderCreate): Promise<any> {
    try {
      const response = await apiClient.post('/content/storage-providers/', data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateStorageProvider(id: number, data: StorageProviderUpdate): Promise<any> {
    try {
      const response = await apiClient.put(`/content/storage-providers/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteStorageProvider(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/content/storage-providers/${id}`);
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
  }): Promise<any> {
    try {
      const cacheKey = createCacheKey('/public/content/video-types', params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/public/content/video-types', { params });
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
  }): Promise<any> {
    try {
      const cacheKey = createCacheKey('/public/content/storage-providers', params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/public/content/storage-providers', { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// ==================================================================================
// frontend/src/services/content/photos.ts

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
  photos_count: number;
  photos: Array<{
    id: string;
    thumbnail_url?: string;
    photo_url: string;
  }>;
}

export class PhotosService {
  private static readonly BASE_URL = '/content/photos';

  // ==================== CRUD BÁSICO ====================

  static async getPhotos(params?: {
    skip?: number;
    limit?: number;
    content_id?: string;
  }): Promise<any> {
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

  static async getPhotoById(id: string): Promise<any> {
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

  static async createPhoto(data: PhotoCreate): Promise<any> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updatePhoto(id: string, data: PhotoUpdate): Promise<any> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deletePhoto(id: string): Promise<any> {
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
  ): Promise<any> {
    try {
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

  static async getGallery(contentId: string): Promise<GalleryData> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/gallery/${contentId}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/gallery/${contentId}`);
        return response.data.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async reorderPhotos(contentId: string, photoOrders: Array<{photo_id: string, sort_order: number}>): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/gallery/${contentId}/reorder`, photoOrders);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async generateThumbnail(photoId: string, size: number = 300): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/${photoId}/generate-thumbnail?size=${size}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  static async getPublicGallery(contentId: string): Promise<GalleryData> {
    try {
      const cacheKey = createCacheKey(`/public/content/${contentId}/gallery`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/public/content/${contentId}/gallery`);
        return response.data.data;
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
  }): Promise<any> {
    try {
      const cacheKey = createCacheKey('/public/content/photos', params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/public/content/photos', { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}