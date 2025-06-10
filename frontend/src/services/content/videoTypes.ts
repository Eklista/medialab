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
