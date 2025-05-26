// src/services/permissions.service.ts
import apiClient from './api';

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface PermissionCategory {
  name: string;
  displayName: string;
  permissions: Permission[];
  icon?: string;
}

class PermissionsService {
  private permissionsCache: Permission[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Limpia el cache de permisos
   */
  clearCache(): void {
    this.permissionsCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Obtiene todos los permisos del sistema (con cache)
   */
  async getAllPermissions(): Promise<Permission[]> {
    const now = Date.now();
    
    if (this.permissionsCache && now < this.cacheExpiry) {
      return this.permissionsCache;
    }

    try {
      const response = await apiClient.get<Permission[]>('/permissions/');
      this.permissionsCache = response.data;
      this.cacheExpiry = now + this.CACHE_DURATION;
      return response.data;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      // Si falla, devolver array vacío en lugar de throw
      return [];
    }
  }

  /**
   * Extrae la categoría de un nombre de permiso (ej: "user_view" -> "user")
   */
  extractCategory(permissionName: string): string {
    const parts = permissionName.split('_');
    return parts[0] || 'other';
  }

  /**
   * Construye un nombre de permiso (útil para verificaciones dinámicas)
   */
  buildPermissionName(category: string, action: string): string {
    return `${category}_${action}`;
  }

  /**
   * Obtiene permisos de una categoría específica
   */
  async getPermissionsByCategory(categoryName: string): Promise<Permission[]> {
    const allPermissions = await this.getAllPermissions();
    return allPermissions.filter(permission => 
      this.extractCategory(permission.name) === categoryName
    );
  }

  /**
   * Verifica si un permiso específico existe
   */
  async hasPermission(permissionName: string): Promise<boolean> {
    const allPermissions = await this.getAllPermissions();
    return allPermissions.some(p => p.name === permissionName);
  }

  /**
   * Obtiene permisos agrupados por categoría automáticamente
   */
  async getPermissionsByCategories(): Promise<PermissionCategory[]> {
    const allPermissions = await this.getAllPermissions();
    const categoriesMap = new Map<string, Permission[]>();

    // Agrupar permisos por categoría automáticamente
    allPermissions.forEach(permission => {
      const category = this.extractCategory(permission.name);
      
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      
      categoriesMap.get(category)!.push(permission);
    });

    // Convertir a array de categorías
    const categories: PermissionCategory[] = Array.from(categoriesMap.entries())
      .map(([categoryName, permissions]) => ({
        name: categoryName,
        displayName: this.getCategoryDisplayName(categoryName),
        permissions: permissions.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return categories;
  }

  /**
   * Genera nombre amigable para categoría
   */
  private getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      'user': 'Usuarios',
      'role': 'Roles',
      'area': 'Áreas',
      'service': 'Servicios',
      'template': 'Plantillas',
      'request': 'Solicitudes',
      'department': 'Departamentos',
      'smtp': 'SMTP',
      'email': 'Plantillas Email',
      'config': 'Configuración',
      'system': 'Sistema',
      'report': 'Reportes',
      'dashboard': 'Dashboard',
      'admin': 'Administración',
      'profile': 'Perfil'
    };
    
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }
}

const permissionsService = new PermissionsService();
export default permissionsService;
