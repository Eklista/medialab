// frontend/src/services/content/categories.ts
import apiClient, { handleApiError, createCacheKey, requestDeduplicator } from '../api';

// ==================== INTERFACES ====================

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

export interface DepartmentWithCategories {
  id: number;
  name: string;
  abbreviation: string;
  categories: ContentCategory[];
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
    active_only?: boolean;
  };
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: ContentCategory;
}

export interface DepartmentsResponse {
  success: boolean;
  message: string;
  data: {
    departments: DepartmentWithCategories[];
    total: number;
  };
}

// ==================== SERVICE CLASS ====================

export class CategoriesService {
  private static readonly BASE_URL = '/content/categories';
  private static readonly PUBLIC_URL = '/public/content/categories';

  // ==================== CRUD ADMINISTRATIVO ====================

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

  // ==================== RELACIONES DEPARTAMENTO-CATEGORÍA ====================

  static async assignToDepart‌ment(
    departmentId: number, 
    categoryId: number
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      department_id: number;
      category_id: number;
      relation_id: number;
    };
  }> {
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

  static async removeFromDepartment(
    departmentId: number, 
    categoryId: number
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      department_id: number;
      category_id: number;
    };
  }> {
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

  static async getDepartmentsWithCategories(): Promise<DepartmentsResponse> {
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
      const cacheKey = createCacheKey(this.PUBLIC_URL, params);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(this.PUBLIC_URL, { params });
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicCategoryBySlug(slug: string): Promise<CategoryResponse> {
    try {
      const cacheKey = createCacheKey(`${this.PUBLIC_URL}/${slug}`);
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get(`${this.PUBLIC_URL}/${slug}`);
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async getPublicDepartmentsWithCategories(): Promise<DepartmentsResponse> {
    try {
      const cacheKey = createCacheKey('/public/content/departments-categories');
      
      return requestDeduplicator.deduplicate(cacheKey, async () => {
        const response = await apiClient.get('/public/content/departments-categories');
        return response.data;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== OPERACIONES BATCH ====================

  static async bulkUpdateCategories(updates: Array<{
    id: number;
    data: ContentCategoryUpdate;
  }>): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: number;
      failed: number;
      results: CategoryResponse[];
    };
  }> {
    try {
      const promises = updates.map(({ id, data }) =>
        this.updateCategory(id, data).catch(error => ({ error: error.message, id }))
      );
      
      const results = await Promise.all(promises);
      
      const successful = results.filter(result => !('error' in result)) as CategoryResponse[];
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

  static async reorderCategories(categoryOrders: Array<{
    id: number;
    sort_order: number;
  }>): Promise<{
    success: boolean;
    message: string;
    data: { reordered_count: number };
  }> {
    try {
      const updates = categoryOrders.map(({ id, sort_order }) => ({
        id,
        data: { sort_order }
      }));
      
      const result = await this.bulkUpdateCategories(updates);
      
      return {
        success: result.success,
        message: `${result.data.updated} categorías reordenadas`,
        data: { reordered_count: result.data.updated }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==================== UTILIDADES ====================

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno
      .replace(/^-|-$/g, ''); // Remover guiones al inicio/final
  }

  static validateCategoryData(data: ContentCategoryCreate | ContentCategoryUpdate): string[] {
    const errors: string[] = [];
    
    if ('name' in data && data.name) {
      if (data.name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      if (data.name.length > 100) {
        errors.push('El nombre no puede exceder 100 caracteres');
      }
    }
    
    if ('slug' in data && data.slug) {
      if (!/^[a-z0-9-]+$/.test(data.slug)) {
        errors.push('El slug solo puede contener letras minúsculas, números y guiones');
      }
      if (data.slug.length < 2) {
        errors.push('El slug debe tener al menos 2 caracteres');
      }
    }
    
    if ('color' in data && data.color) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
        errors.push('El color debe estar en formato hexadecimal (#FFFFFF)');
      }
    }
    
    if ('sort_order' in data && data.sort_order !== undefined) {
      if (data.sort_order < 0) {
        errors.push('El orden no puede ser negativo');
      }
    }
    
    return errors;
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