import apiClient, { handleApiError, /* getBaseUrl */ } from './api';

// Interfaz para representar un usuario en la aplicación
export interface User {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  profileImage?: string;
  profile_image?: string;
  bannerImage?: string;
  banner_image?: string;
  isActive: boolean;
  is_active?: boolean;
  lastLogin?: string;
  last_login?: string;
  roles: string[];
  areas?: Array<{id: number, name: string}>;
  joinDate?: string;
  join_date?: string;
  phone?: string;
  birth_date?: string;
}

// Definir la estructura de la solicitud para crear un usuario
export interface UserCreateRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId?: string;
  areaId?: string;
  joinDate?: string;
}

// Definir la estructura para actualizar un usuario
export interface UserUpdateRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  areaId?: string;
  isActive?: boolean;
  // Edición de campos de usuario
  phone?: string;
  birthDate?: string;
  profileImage?: string;
  bannerImage?: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface ApiPermission {
  id: number;
  name: string;
  description?: string;
}

interface ApiRoleResponse {
  id: number | string;
  name: string;
  description?: string;
  permissions?: ApiPermission[] | string[];
}

export interface Area {
  id: string;
  name: string;
  description?: string;
}

// Areas

export interface AreaCreateRequest {
  name: string;
  description?: string;
}

export interface AreaUpdateRequest {
  name?: string;
  description?: string;
}

//Roles
export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

// Implementación del servicio de usuarios
class UserService {
  // Obtener todos los usuarios
  async getUsers(): Promise<User[]> {
    try {
      //console.log('Obteniendo usuarios desde:', `${getBaseUrl()}/users`);
      const response = await apiClient.get<User[]>('/users/');
      
      // Asegurarse de que los usuarios tienen un formato consistente
      return response.data.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Normalizar el formato del usuario para manejar las diferentes formas de nombrar propiedades
  private normalizeUser(apiUser: any): User {
    //console.log('Normalizando usuario desde API:', apiUser);
    
    const normalized = {
      id: apiUser.id,
      email: apiUser.email || '',
      username: apiUser.username || '',
      firstName: apiUser.firstName || apiUser.first_name || '',
      lastName: apiUser.lastName || apiUser.last_name || '',
      profileImage: apiUser.profileImage || apiUser.profile_image || null,
      bannerImage: apiUser.bannerImage || apiUser.banner_image || null,
      isActive: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active || false),
      lastLogin: apiUser.lastLogin || apiUser.last_login || null,
      roles: Array.isArray(apiUser.roles) ? apiUser.roles : [],
      areas: Array.isArray(apiUser.areas) ? apiUser.areas : [],
      phone: apiUser.phone || '',
      birth_date: apiUser.birth_date || null
    };
    
    //console.log('Usuario normalizado:', normalized);
    return normalized;
  }
  
  // Obtener un usuario por ID
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${userId}`);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Crear un nuevo usuario
  async createUser(userData: any): Promise<User> {
    try {
      //console.log('Datos recibidos en createUser:', userData);
      
      const apiData: any = {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        first_name: userData.firstName || userData.first_name || '',
        last_name: userData.lastName || userData.last_name || '',
        join_date: userData.joinDate || userData.join_date || new Date().toISOString().split('T')[0]
      };
      
      // Añadir roleId y areaId si existen (enviándolos directamente, sin cambio de nombre)
      if (userData.roleId) apiData.roleId = userData.roleId;
      if (userData.areaId) apiData.areaId = userData.areaId;
      
      //console.log('Datos enviados a la API:', apiData);
      
      const response = await apiClient.post<User>('/users/', apiData);
      return this.normalizeUser(response.data);
    } catch (error) {
      // Manejo de errores como lo tenías antes
      //console.error('Error al crear usuario:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  async updateUser(userId: number, userData: UserUpdateRequest): Promise<User> {
    try {
      // Convertir los nombres de propiedades a snake_case para el backend
      const apiData: any = {};
      
      if (userData.email !== undefined) apiData.email = userData.email;
      if (userData.username !== undefined) apiData.username = userData.username;
      if (userData.firstName !== undefined) apiData.first_name = userData.firstName;
      if (userData.lastName !== undefined) apiData.last_name = userData.lastName;
      if (userData.isActive !== undefined) apiData.is_active = userData.isActive;
      if (userData.phone !== undefined) apiData.phone = userData.phone;
      if (userData.birthDate !== undefined) apiData.birth_date = userData.birthDate;
      if (userData.profileImage !== undefined) apiData.profile_image = userData.profileImage;
      if (userData.bannerImage !== undefined) apiData.banner_image = userData.bannerImage;
      
      //console.log('Llamada a updateUser con datos:', userData);
      //console.log('Datos convertidos para la API:', apiData);
      
      const response = await apiClient.patch<User>(`/users/${userId}`, apiData);
      //console.log('Respuesta del servidor:', response.data);
      
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error(`Error al actualizar usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Actualizar el usuario actual
  async updateCurrentUser(userData: UserUpdateRequest): Promise<User> {
    try {
      // Convertir los nombres de propiedades a snake_case para el backend
      const apiData: any = {};
      
      if (userData.email !== undefined) apiData.email = userData.email;
      if (userData.username !== undefined) apiData.username = userData.username;
      if (userData.firstName !== undefined) apiData.first_name = userData.firstName;
      if (userData.lastName !== undefined) apiData.last_name = userData.lastName;
      if (userData.isActive !== undefined) apiData.is_active = userData.isActive;
      
      const response = await apiClient.patch<User>('/users/me', apiData);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error('Error al actualizar usuario actual:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Eliminar un usuario
  async deleteUser(userId: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      console.error(`Error al eliminar usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Obtener todos los roles
  async getRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>('/roles/');
      return response.data.map(role => ({
        ...role,
        id: role.id.toString(), // Asegurar que el ID sea string
        permissions: role.permissions || [] // Asegurar que permissions siempre existe
      }));
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw new Error(`No se pudieron obtener los roles: ${handleApiError(error)}`);
    }
  }

  async getRoleWithPermissions(roleId: number): Promise<Role> {
    try {
      console.log(`Obteniendo rol ${roleId} con permisos`);
      const response = await apiClient.get<ApiRoleResponse>(`/roles/${roleId}`);
      
      console.log('Respuesta original de la API:', response.data);
      
      // Extraer y transformar los permisos según el tipo de datos que recibimos
      let permissionNames: string[] = [];
      
      if (Array.isArray(response.data.permissions)) {
        permissionNames = response.data.permissions.map(p => {
          // Si es un objeto con propiedad name, extraer el nombre
          if (typeof p === 'object' && p !== null && 'name' in p) {
            return p.name.toString();
          }
          // Si ya es un string, usarlo directamente
          else if (typeof p === 'string') {
            return p;
          }
          // Si es otro tipo, convertirlo a string
          return String(p);
        });
      }
      
      console.log('Permisos transformados a nombres:', permissionNames);
      
      // Formatear el rol para el frontend
      const formattedRole: Role = {
        id: response.data.id.toString(),
        name: response.data.name,
        description: response.data.description || '',
        permissions: permissionNames
      };
      
      console.log('Rol formateado final:', formattedRole);
      
      return formattedRole;
    } catch (error) {
      console.error(`Error al obtener rol con permisos, ID ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Obtener todas las áreas
  async getAreas(): Promise<Area[]> {
    try {
      const response = await apiClient.get<Area[]>('/areas/');
      return response.data.map(area => ({
        ...area,
        id: area.id.toString() // Asegurar que el ID sea string
      }));
    } catch (error) {
      console.error('Error al obtener áreas:', error);
      throw new Error(`No se pudieron obtener las áreas: ${handleApiError(error)}`);
    }
  }
  
  // Asignar un rol a un usuario
  async assignRole(userId: number, roleId: string, areaId: string): Promise<void> {
    try {
      //console.log(`Asignando rol ${roleId} con área ${areaId} al usuario ${userId}`);
      
      const apiData = {
        roleId: roleId.toString(),
        areaId: areaId.toString()
      };
      
      await apiClient.post(`/users/${userId}/roles`, apiData);
    } catch (error) {
      console.error(`Error al asignar rol al usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // Métodos para áreas
  // Crear un área
  async createArea(areaData: AreaCreateRequest): Promise<Area> {
    try {
      const response = await apiClient.post<Area>('/areas/', areaData);
      return {
        ...response.data,
        id: response.data.id.toString() // Asegurar que el ID sea string
      };
    } catch (error) {
      console.error('Error al crear área:', error);
      throw new Error(handleApiError(error));
    }
  }

  // Actualizar un área
  async updateArea(areaId: number, areaData: AreaUpdateRequest): Promise<Area> {
    try {
      const response = await apiClient.patch<Area>(`/areas/${areaId}`, areaData);
      return {
        ...response.data,
        id: response.data.id.toString() // Asegurar que el ID sea string
      };
    } catch (error) {
      console.error(`Error al actualizar área con ID ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // Eliminar un área
  async deleteArea(areaId: number): Promise<void> {
    try {
      await apiClient.delete(`/areas/${areaId}`);
    } catch (error) {
      console.error(`Error al eliminar área con ID ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // Métodos para roles
  // Crear un rol
  async createRole(roleData: RoleCreateRequest): Promise<Role> {
    try {
      const response = await apiClient.post<Role>('/roles/', roleData);
      return {
        ...response.data,
        id: response.data.id.toString() // Asegurar que el ID sea string
      };
    } catch (error) {
      console.error('Error al crear rol:', error);
      throw new Error(handleApiError(error));
    }
  }

  // Actualizar un rol
  async updateRole(roleId: number, roleData: RoleUpdateRequest): Promise<Role> {
    try {
      const response = await apiClient.patch<Role>(`/roles/${roleId}`, roleData);
      return {
        ...response.data,
        id: response.data.id.toString() // Asegurar que el ID sea string
      };
    } catch (error) {
      console.error(`Error al actualizar rol con ID ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // Eliminar un rol
  async deleteRole(roleId: number): Promise<void> {
    try {
      await apiClient.delete(`/roles/${roleId}`);
    } catch (error) {
      console.error(`Error al eliminar rol con ID ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtiene todos los permisos disponibles en el sistema
   * @returns Array de objetos Permission
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      // Intenta obtener los permisos desde el backend
      console.log("Obteniendo permisos desde la API...");
      const response = await apiClient.get<Permission[]>('/permissions/');
      console.log("Permisos obtenidos correctamente:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Asigna permisos a un rol específico
   * @param roleId ID del rol
   * @param permissionNames Nombres de los permisos a asignar
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  async assignPermissionsToRole(roleId: number, permissionNames: string[]): Promise<boolean> {
    try {
      console.log(`Asignando permisos al rol ${roleId}. Permisos seleccionados:`, permissionNames);

      // Obtener todos los permisos disponibles
      const allPermissions = await this.getAllPermissions();
      
      // Mapear nombres de permisos a IDs
      const permissionIdsMapping = permissionNames.map(name => {
        const permission = allPermissions.find(p => p.name === name);
        
        if (!permission) {
          console.warn(`No se encontró ID para el permiso: "${name}"`);
          return null;
        }
        
        return permission.id;
      }).filter(id => id !== null) as number[];
      
      console.log('IDs de permisos a asignar:', permissionIdsMapping);
      
      // Llamar al endpoint para asignar permisos
      const response = await apiClient.post(`/roles/${roleId}/permissions`, permissionIdsMapping);
      
      console.log("Respuesta del servidor:", response.data);
      
      return response.status === 200;
    } catch (error) {
      console.error(`Error al asignar permisos al rol ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

}


export default new UserService();