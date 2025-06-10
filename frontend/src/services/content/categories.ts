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
