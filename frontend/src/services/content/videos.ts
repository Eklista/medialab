// frontend/src/services/content/videos.ts
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
  processing_status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  error_message?: string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
}

export interface VideoUpdate {
  video_url?: string;
  video_id?: string;
  thumbnail_url?: string;
  original_filename?: string;
  video_type_id?: number;
  storage_provider_id?: number;
  is_main?: boolean;
  sort_order?: number;
  processing_status?: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  error_message?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
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

export interface VideoFromUpload {
  content_id: string;
  file: File;
  is_main?: boolean;
  sort_order?: number;
}

export interface VideosResponse {
  success: boolean;
  message: string;
  data: {
    videos: Video[];
    total: number;
    skip: number;
    limit: number;
    content_id?: string;
    video_type_id?: number;
    processing_status?: string;
  };
}

export interface VideoResponse {
  success: boolean;
  message: string;
  data: Video;
}

export interface VideoProcessingUpdate {
  processing_status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  error_message?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  thumbnail_url?: string;
  is_processed?: boolean;
}

// ==================== SERVICE CLASS ====================

export class VideosService {
  private static readonly BASE_URL = '/content/videos';
  private static readonly PUBLIC_URL = '/public/content/videos';

  // ==================== CRUD BÁSICO ====================

  static async getVideos(params?: {
    skip?: number;
    limit?: number;
    content_id?: string;
    video_type_id?: number;
    processing_status?: string;
    storage_provider_id?: number;
    search?: string;
  }): Promise<VideosResponse> {
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

  static async getVideoById(id: string): Promise<VideoResponse> {
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

  static async createVideo(data: VideoCreate): Promise<VideoResponse> {
    try {
      const response = await apiClient.post(this.BASE_URL, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateVideo(id: string, data: VideoUpdate): Promise<VideoResponse> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deleteVideo(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/${id}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== CREACIÓN DESDE PLATAFORMAS ====================

  static async createVideoFromYouTube(data: VideoFromYouTube): Promise<VideoResponse> {
    try {
      // Validar URL de YouTube
      if (!this.isValidYouTubeUrl(data.youtube_url)) {
        throw new Error('URL de YouTube inválida');
      }

      const response = await apiClient.post(`${this.BASE_URL}/from-youtube`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async createVideoFromVimeo(data: VideoFromVimeo): Promise<VideoResponse> {
    try {
      // Validar URL de Vimeo
      if (!this.isValidVimeoUrl(data.vimeo_url)) {
        throw new Error('URL de Vimeo inválida');
      }

      const response = await apiClient.post(`${this.BASE_URL}/from-vimeo`, data);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async uploadVideo(
    data: VideoFromUpload,
    onProgress?: (progress: number) => void
  ): Promise<VideoResponse> {
    try {
      // Validar archivo
      if (!this.isValidVideoFile(data.file)) {
        throw new Error('Archivo de video inválido');
      }

      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('content_id', data.content_id);
      formData.append('is_main', String(data.is_main || false));
      formData.append('sort_order', String(data.sort_order || 0));

      const response = await apiClient.post(`${this.BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES ESPECÍFICAS ====================

  static async getVideosByContent(
    contentId: string,
    params?: {
      skip?: number;
      limit?: number;
    }
  ): Promise<VideosResponse> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/content/${contentId}`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/content/${contentId}`, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getMainVideo(contentId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      main_video?: Video;
      content_id: string;
    };
  }> {
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

  static async setMainVideo(contentId: string, videoId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      content_id: string;
      video_id: string;
      is_main: boolean;
    };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/content/${contentId}/set-main/${videoId}`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updateProcessingStatus(
    videoId: string, 
    statusData: VideoProcessingUpdate
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      video_id: string;
      processing_status: string;
    };
  }> {
    try {
      const response = await apiClient.put(`${this.BASE_URL}/${videoId}/processing`, statusData);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async reorderVideos(
    contentId: string, 
    videoOrders: Array<{ video_id: string; sort_order: number }>
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      content_id: string;
      reordered_count: number;
    };
  }> {
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
  }): Promise<VideosResponse> {
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

  static async getPublicVideoById(id: string): Promise<VideoResponse> {
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

  static async getPublicVideosByContent(
    contentId: string,
    params?: {
      skip?: number;
      limit?: number;
    }
  ): Promise<VideosResponse> {
    try {
      const cacheKey = createCacheKey(`/public/content/${contentId}/videos`, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`/public/content/${contentId}/videos`, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicMainVideo(contentId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      main_video?: Video;
      content_id: string;
    };
  }> {
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

  // ==================== ADMINISTRACIÓN Y MONITOREO ====================

  static async getVideosStats(): Promise<{
    success: boolean;
    message: string;
    data: {
      total_videos: number;
      processed_videos: number;
      pending_videos: number;
      failed_videos: number;
      total_size_bytes: number;
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

  static async getPendingProcessing(limit: number = 50): Promise<{
    success: boolean;
    message: string;
    data: {
      pending_videos: Video[];
      total: number;
      limit: number;
    };
  }> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/admin/pending-processing`, { limit });
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/admin/pending-processing?limit=${limit}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getFailedProcessing(limit: number = 50): Promise<{
    success: boolean;
    message: string;
    data: {
      failed_videos: Video[];
      total: number;
      limit: number;
    };
  }> {
    try {
      const cacheKey = createCacheKey(`${this.BASE_URL}/admin/failed-processing`, { limit });
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.BASE_URL}/admin/failed-processing?limit=${limit}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async retryFailedProcessing(videoId: string): Promise<{
    success: boolean;
    message: string;
    data: { video_id: string };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/${videoId}/retry-processing`);
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES BATCH ====================

  static async bulkCreateVideos(videos: VideoCreate[]): Promise<{
    success: boolean;
    message: string;
    data: {
      videos: Video[];
      created_count: number;
      requested_count: number;
    };
  }> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/bulk`, {
        content_id: videos[0]?.content_id,
        videos
      });
      requestDeduplicator.clear();
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async bulkUpdateVideos(updates: Array<{
    id: string;
    data: VideoUpdate;
  }>): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: number;
      failed: number;
      results: VideoResponse[];
    };
  }> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.updateVideo(id, data).catch(error => ({ error: error.message, id }))
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(result => !('error' in result)) as VideoResponse[];
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

  static async bulkDeleteVideos(videoIds: string[]): Promise<{
    success: boolean;
    message: string;
    data: {
      deleted: number;
      failed: number;
    };
  }> {
    try {
      const promises = videoIds.map(id =>
        this.deleteVideo(id).catch(error => ({ error: error.message, id }))
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

  // ==================== UTILIDADES DE VALIDACIÓN ====================

  static isValidYouTubeUrl(url: string): boolean {
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/
    ];
    
    return youtubePatterns.some(pattern => pattern.test(url));
  }

  static isValidVimeoUrl(url: string): boolean {
    const vimeoPattern = /^https?:\/\/(www\.)?vimeo\.com\/\d+/;
    return vimeoPattern.test(url);
  }

  static isValidVideoFile(file: File): boolean {
    const validTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo', // AVI
      'video/x-ms-wmv'   // WMV
    ];
    
    const maxSize = 500 * 1024 * 1024; // 500MB
    
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  static extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  static extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  static formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getProcessingStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'completed': 'Completado',
      'error': 'Error',
      'cancelled': 'Cancelado'
    };
    
    return labels[status] || status;
  }

  static getProcessingStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'processing': 'blue',
      'completed': 'green',
      'error': 'red',
      'cancelled': 'gray'
    };
    
    return colors[status] || 'gray';
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