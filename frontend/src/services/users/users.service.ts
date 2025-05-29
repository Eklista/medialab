// frontend/src/services/users.service.ts (Reestructurado)
import apiClient, { handleApiError } from '../api';
import permissionsService from '../security/permissions.service';

// ===== INTERFACES DE USUARIO =====
export interface User {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  profileImage?: string | null;
  profile_image?: string;
  bannerImage?: string | null;
  banner_image?: string;
  isActive: boolean;
  is_active?: boolean;
  lastLogin?: string | null;
  last_login?: string;
  roles: string[];
  areas?: Array<{id: number, name: string}>;
  joinDate?: string;
  join_date?: string | null;     
  phone?: string;
  birth_date?: string | null;    
}

export interface UserCreateRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId?: string;
  areaId?: string;
  joinDate?: string;
  first_name?: string;
  last_name?: string;
  join_date?: string;
}


export interface UserUpdateRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  areaId?: string;
  isActive?: boolean;
  phone?: string;
  birthDate?: string;
  profileImage?: string;
  bannerImage?: string;
}

// ===== INTERFACES DE ROLES (sin permisos) =====
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Solo nombres de permisos para el frontend
}

export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissions?: string[]; // Nombres de permisos
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
  permissions?: string[]; // Nombres de permisos
}

// ===== INTERFACES DE AREAS =====
export interface Area {
  id: string;
  name: string;
  description?: string;
}

export interface AreaCreateRequest {
  name: string;
  description?: string;
}

export interface AreaUpdateRequest {
  name?: string;
  description?: string;
}

// ===== INTERFACES INTERNAS PARA LA API =====
interface ApiRoleResponse {
  id: number | string;
  name: string;
  description?: string;
  permissions?: Array<{name: string} | string> | string[];
}

interface ApiCurrentUserUpdateData {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

// Para normalizar datos de usuario de la API (línea 121)
interface ApiUserResponse {
  id: number;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  profileImage?: string | null;      
  profile_image?: string | null;     
  bannerImage?: string | null;       
  banner_image?: string | null;      
  isActive?: boolean;
  is_active?: boolean;
  lastLogin?: string | null;         
  last_login?: string | null;        
  roles?: string[];
  areas?: Array<{id: number, name: string}>;
  joinDate?: string;
  join_date?: string | null;         
  phone?: string;
  birth_date?: string | null;        
}

// Para datos de creación de usuario (línea 155)
interface ApiUserCreateData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  join_date: string;
  roleId?: string;
  areaId?: string;
}

// Para datos de actualización de usuario (líneas 182 y 207)
interface ApiUserUpdateData {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  phone?: string;
  birth_date?: string;
  profile_image?: string;
  banner_image?: string;
}

// ===== IMPLEMENTACIÓN DEL SERVICIO =====
class UserService {
  
  // ===== MÉTODOS DE USUARIOS =====
  
  /**
   * Obtiene todos los usuarios
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users/');
      return response.data.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Normaliza el formato del usuario
   */
  private normalizeUser(apiUser: ApiUserResponse): User {
    return {
      id: apiUser.id,
      email: apiUser.email || '',
      username: apiUser.username || '',
      firstName: apiUser.firstName || apiUser.first_name || '',
      lastName: apiUser.lastName || apiUser.last_name || '',
      profileImage: apiUser.profileImage || apiUser.profile_image || null,  // ← Cambiar || null
      bannerImage: apiUser.bannerImage || apiUser.banner_image || null,     // ← Cambiar || null
      isActive: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active || false),
      lastLogin: apiUser.lastLogin || apiUser.last_login || null,           // ← Cambiar || null
      roles: Array.isArray(apiUser.roles) ? apiUser.roles : [],
      areas: Array.isArray(apiUser.areas) ? apiUser.areas : [],
      phone: apiUser.phone || '',
      birth_date: apiUser.birth_date || null                                // ← Cambiar || null
    };
  }
  
  /**
   * Obtiene un usuario por ID
   */
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${userId}`);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error(`❌ Error al obtener usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Crea un nuevo usuario
   */
  async createUser(userData: UserCreateRequest): Promise<User> {
    try {
      const apiData: ApiUserCreateData = {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        first_name: userData.firstName || userData.first_name || '',
        last_name: userData.lastName || userData.last_name || '',
        join_date: userData.joinDate || userData.join_date || new Date().toISOString().split('T')[0]
      };
      
      if (userData.roleId) apiData.roleId = userData.roleId;
      if (userData.areaId) apiData.areaId = userData.areaId;
      
      const response = await apiClient.post<User>('/users/', apiData);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Actualiza un usuario
   */
  async updateUser(userId: number, userData: UserUpdateRequest): Promise<User> {
    try {
      const apiData: Partial<ApiUserUpdateData> = {};
      
      if (userData.email !== undefined) apiData.email = userData.email;
      if (userData.username !== undefined) apiData.username = userData.username;
      if (userData.firstName !== undefined) apiData.first_name = userData.firstName;
      if (userData.lastName !== undefined) apiData.last_name = userData.lastName;
      if (userData.isActive !== undefined) apiData.is_active = userData.isActive;
      if (userData.phone !== undefined) apiData.phone = userData.phone;
      if (userData.birthDate !== undefined) apiData.birth_date = userData.birthDate;
      if (userData.profileImage !== undefined) apiData.profile_image = userData.profileImage;
      if (userData.bannerImage !== undefined) apiData.banner_image = userData.bannerImage;
      
      const response = await apiClient.patch<User>(`/users/${userId}`, apiData);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error(`❌ Error al actualizar usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Actualiza el usuario actual
   */
  async updateCurrentUser(userData: UserUpdateRequest): Promise<User> {
    try {
      const apiData: Partial<ApiCurrentUserUpdateData> = {};  // ← Cambiar aquí
    
      if (userData.email !== undefined) apiData.email = userData.email;
      if (userData.username !== undefined) apiData.username = userData.username;
      if (userData.firstName !== undefined) apiData.first_name = userData.firstName;
      if (userData.lastName !== undefined) apiData.last_name = userData.lastName;
      if (userData.isActive !== undefined) apiData.is_active = userData.isActive;
    
      const response = await apiClient.patch<User>('/users/me', apiData);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error('❌ Error al actualizar usuario actual:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Elimina un usuario
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      console.error(`❌ Error al eliminar usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Asigna un rol a un usuario
   */
  async assignRole(userId: number, roleId: string, areaId: string): Promise<void> {
    try {
      const apiData = {
        roleId: roleId.toString(),
        areaId: areaId.toString()
      };
      
      await apiClient.post(`/users/${userId}/roles`, apiData);
    } catch (error) {
      console.error(`❌ Error al asignar rol al usuario con ID ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // ===== MÉTODOS DE ROLES (usando servicio de permisos) =====
  
  /**
   * Obtiene todos los roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>('/roles/');
      return response.data.map(role => ({
        ...role,
        id: role.id.toString(),
        permissions: role.permissions || []
      }));
    } catch (error) {
      console.error('❌ Error al obtener roles:', error);
      throw new Error(`No se pudieron obtener los roles: ${handleApiError(error)}`);
    }
  }

  /**
   * Obtiene un rol con sus permisos
   */
  async getRoleWithPermissions(roleId: number): Promise<Role> {
    try {
      console.log(`🔍 Obteniendo rol ${roleId} con permisos`);
      const response = await apiClient.get<ApiRoleResponse>(`/roles/${roleId}`);
      
      // Extraer nombres de permisos
      let permissionNames: string[] = [];
      
      if (Array.isArray(response.data.permissions)) {
        permissionNames = response.data.permissions.map(p => {
          if (typeof p === 'object' && p !== null && 'name' in p) {
            return p.name.toString();
          } else if (typeof p === 'string') {
            return p;
          }
          return String(p);
        });
      }
      
      const formattedRole: Role = {
        id: response.data.id.toString(),
        name: response.data.name,
        description: response.data.description || '',
        permissions: permissionNames
      };
      
      console.log('✅ Rol obtenido:', formattedRole);
      return formattedRole;
    } catch (error) {
      console.error(`❌ Error al obtener rol con permisos, ID ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
  
  /**
   * Crea un rol CON permisos (usando el servicio de permisos)
   */
  async createRole(roleData: RoleCreateRequest): Promise<Role> {
    try {
      console.log('🚀 Creando rol:', roleData);
      
      // 1. Crear el rol básico (sin permisos)
      const { permissions, ...basicRoleData } = roleData;
      const response = await apiClient.post<Role>('/roles/', basicRoleData);
      
      const createdRole: Role = {
        ...response.data,
        id: response.data.id.toString(),
        permissions: []
      };
      
      console.log('✅ Rol creado:', createdRole);
      
      // 2. Asignar permisos usando el servicio dedicado
      if (permissions && permissions.length > 0) {
        console.log('🔧 Asignando permisos usando permissionsService...');
        
        // Obtener IDs de permisos usando el servicio de permisos
        const allPermissions = await permissionsService.getAllPermissions();
        const permissionIds = permissions.map(permName => {
          const perm = allPermissions.find(p => p.name === permName);
          return perm?.id;
        }).filter(id => id !== undefined) as number[];
        
        if (permissionIds.length > 0) {
          await apiClient.post(`/roles/${createdRole.id}/permissions`, permissionIds);
          console.log('✅ Permisos asignados correctamente');
          
          // Actualizar el rol con los permisos asignados
          createdRole.permissions = permissions;
        } else {
          console.warn('⚠️ No se encontraron IDs válidos para los permisos');
        }
      }
      
      return createdRole;
    } catch (error) {
      console.error('❌ Error al crear rol:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza un rol CON permisos (usando el servicio de permisos)
   */
  async updateRole(roleId: number, roleData: RoleUpdateRequest): Promise<Role> {
    try {
      console.log(`🔄 Actualizando rol ${roleId}:`, roleData);
      
      // 1. Actualizar información básica del rol (sin permisos)
      const { permissions, ...basicRoleData } = roleData;
      const response = await apiClient.patch<Role>(`/roles/${roleId}`, basicRoleData);
      
      const updatedRole: Role = {
        ...response.data,
        id: response.data.id.toString(),
        permissions: permissions || []
      };
      
      console.log('✅ Información básica del rol actualizada');
      
      // 2. Actualizar permisos si se proporcionaron
      if (permissions !== undefined) {
        console.log('🔧 Actualizando permisos usando permissionsService...');
        
        if (permissions.length > 0) {
          // Obtener IDs de permisos usando el servicio de permisos
          const allPermissions = await permissionsService.getAllPermissions();
          const permissionIds = permissions.map(permName => {
            const perm = allPermissions.find(p => p.name === permName);
            return perm?.id;
          }).filter(id => id !== undefined) as number[];
          
          if (permissionIds.length > 0) {
            await apiClient.post(`/roles/${roleId}/permissions`, permissionIds);
            console.log('✅ Permisos actualizados correctamente');
          } else {
            console.warn('⚠️ No se encontraron IDs válidos para los permisos');
          }
        } else {
          // Si permissions es array vacío, remover todos los permisos
          console.log('🗑️ Removiendo todos los permisos del rol');
          await apiClient.post(`/roles/${roleId}/permissions`, []);
        }
      }
      
      return updatedRole;
    } catch (error) {
      console.error(`❌ Error al actualizar rol con ID ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina un rol
   */
  async deleteRole(roleId: number): Promise<void> {
    try {
      await apiClient.delete(`/roles/${roleId}`);
    } catch (error) {
      console.error(`❌ Error al eliminar rol con ID ${roleId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // ===== MÉTODOS DE ÁREAS =====
  
  /**
   * Obtiene todas las áreas
   */
  async getAreas(): Promise<Area[]> {
    try {
      const response = await apiClient.get<Area[]>('/areas/');
      return response.data.map(area => ({
        ...area,
        id: area.id.toString()
      }));
    } catch (error) {
      console.error('❌ Error al obtener áreas:', error);
      throw new Error(`No se pudieron obtener las áreas: ${handleApiError(error)}`);
    }
  }
  
  /**
   * Crea un área
   */
  async createArea(areaData: AreaCreateRequest): Promise<Area> {
    try {
      const response = await apiClient.post<Area>('/areas/', areaData);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.error('❌ Error al crear área:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Actualiza un área
   */
  async updateArea(areaId: number, areaData: AreaUpdateRequest): Promise<Area> {
    try {
      const response = await apiClient.patch<Area>(`/areas/${areaId}`, areaData);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.error(`❌ Error al actualizar área con ID ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Elimina un área
   */
  async deleteArea(areaId: number): Promise<void> {
    try {
      await apiClient.delete(`/areas/${areaId}`);
    } catch (error) {
      console.error(`❌ Error al eliminar área con ID ${areaId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  // ===== MÉTODO DELEGADO PARA PERMISOS =====
  
  /**
   * Obtiene todos los permisos (delegado al servicio de permisos)
   * @deprecated Usar permissionsService.getAllPermissions() directamente
   */
  async getAllPermissions() {
    console.warn('⚠️ userService.getAllPermissions() está deprecated. Usa permissionsService.getAllPermissions()');
    return permissionsService.getAllPermissions();
  }
}

export default new UserService();