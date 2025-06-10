// frontend/src/services/content/videos.ts

export interface Video {
  id: string;
  content_id: string;
  video_url: string;
  video_id?: string;
  thumbnail_url?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  duration_formatted?: string;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  video_type_id: number;
  storage_provider_id: number;
  is_processed: boolean;
  processing_status: string;
  error_message?: string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  video_type?: VideoType;
  storage_provider?: StorageProvider;
}

export interface VideoCreate {
  content_id: string;
  video_url: string;
  video_id?: string;
  thumbnail_url?: string;
  original_filename?: string;
  video_type_id: number;
  storage_provider_id: number;
  is_main?: boolean;
  sort_order?: number;
}

export interface VideoFromYouTube {
  content_id: string;
  youtube_url: string;
  is_main?: boolean;
  sort_order?: number;
}

export interface VideoFromVimeo {
  content_id: string;
  vimeo_url: string;
  is_main?: boolean;
  sort_order?: number;
}

export class VideosService {
  private static readonly BASE_URL = '/content/videos';

  // ==================== CRUD BÁSICO ====================

  static async getVideos(params?: {
    skip?: number;
    limit?: number;
    content_id?: string;
    video_type_id?: number;
    processing_status?: string;
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

  static async getVideoById(id: string): Promise<any> {
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

  static async createVideo(data: VideoCreate): Promise<any> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createVideoFromYouTube(data: VideoFromYouTube): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/from-youtube`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createVideoFromVimeo(data: VideoFromVimeo): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/from-vimeo`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateVideo(id: string, data: Partial<VideoCreate>): Promise<any> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteVideo(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/${id}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES ESPECÍFICAS ====================

  static async getMainVideo(contentId: string): Promise<any> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/content/${contentId}/main`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/content/${contentId}/main`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async setMainVideo(contentId: string, videoId: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/content/${contentId}/set-main/${videoId}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async reorderVideos(contentId: string, videoOrders: Array<{video_id: string, sort_order: number}>): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/content/${contentId}/reorder`, videoOrders);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  static async getPublicVideos(params?: {
    skip?: number;
    limit?: number;
    content_id?: string;
    video_type_id?: number;
  }): Promise<any> {
    try {
      const cacheKey = createCacheKey('/public/content/videos', params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/public/content/videos', { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicMainVideo(contentId: string): Promise<any> {
    try {
      const cacheKey = createCacheKey(`/public/content/${contentId}/main-video`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/public/content/${contentId}/main-video`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}