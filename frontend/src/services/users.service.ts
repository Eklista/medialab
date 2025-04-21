import apiClient, { handleApiError } from './api';

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
  isActive: boolean;
  is_active?: boolean;
  lastLogin?: string;
  last_login?: string;
  roles: string[];
  joinDate?: string;
  join_date?: string;
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
}

// Interfaces para Roles y Áreas
export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
}

// Implementación del servicio de usuarios
class UserService {
  // Obtener todos los usuarios
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      
      // Asegurarse de que los usuarios tienen un formato consistente
      return response.data.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error(handleApiError(error));
    }
  }
  
  // Normalizar el formato del usuario para manejar las diferentes formas de nombrar propiedades
  private normalizeUser(apiUser: any): User {
    return {
      id: apiUser.id,
      email: apiUser.email || '',
      username: apiUser.username || '',
      firstName: apiUser.firstName || apiUser.first_name || '',
      lastName: apiUser.lastName || apiUser.last_name || '',
      profileImage: apiUser.profileImage || apiUser.profile_image || null,
      isActive: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active || false),
      lastLogin: apiUser.lastLogin || apiUser.last_login || null,
      roles: Array.isArray(apiUser.roles) ? apiUser.roles : []
    };
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
      // Log de los datos recibidos
      console.log('Datos recibidos en createUser:', userData);
      
      // Estructura de datos que espera el backend (snake_case)
      const apiData: any = {};
      
      // Copiar y convertir campos de camelCase a snake_case si es necesario
      if (userData.email) apiData.email = userData.email;
      if (userData.username) apiData.username = userData.username;
      if (userData.password) apiData.password = userData.password;
      
      // Manejar first_name/firstName
      if (userData.first_name) apiData.first_name = userData.first_name;
      else if (userData.firstName) apiData.first_name = userData.firstName;
      
      // Manejar last_name/lastName
      if (userData.last_name) apiData.last_name = userData.last_name;
      else if (userData.lastName) apiData.last_name = userData.lastName;
      
      // Manejar join_date/joinDate
      if (userData.join_date) apiData.join_date = userData.join_date;
      else if (userData.joinDate) apiData.join_date = userData.joinDate;
      
      // Manejar role_id/roleId
      if (userData.role_id) apiData.role_id = userData.role_id;
      else if (userData.roleId) apiData.role_id = userData.roleId;
      
      // Manejar area_id/areaId
      if (userData.area_id) apiData.area_id = userData.area_id;
      else if (userData.areaId) apiData.area_id = userData.areaId;
      
      // Comprobar que tenemos todos los campos obligatorios
      const requiredFields = ['email', 'username', 'password', 'first_name', 'last_name', 'join_date'];
      const missingFields = requiredFields.filter(field => !apiData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
      }
      
      console.log('Datos enviados a la API:', apiData);
      
      // Hacer la solicitud al API
      const response = await apiClient.post<User>('/users', apiData);
      return this.normalizeUser(response.data);
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      // Manejar errores específicos de validación de la API
      if (error.response?.data?.detail) {
        const detailData = error.response.data.detail;
        if (Array.isArray(detailData)) {
          const errorMessages = detailData.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`;
            return JSON.stringify(err);
          });
          throw new Error(errorMessages.join(', '));
        } else {
          throw new Error(typeof detailData === 'string' ? detailData : JSON.stringify(detailData));
        }
      }
      
      throw new Error(handleApiError(error));
    }
  }
  
  // Actualizar un usuario existente
  async updateUser(userId: number, userData: UserUpdateRequest): Promise<User> {
    try {
      // Convertir los nombres de propiedades a snake_case para el backend
      const apiData: any = {};
      
      if (userData.email !== undefined) apiData.email = userData.email;
      if (userData.username !== undefined) apiData.username = userData.username;
      if (userData.firstName !== undefined) apiData.first_name = userData.firstName;
      if (userData.lastName !== undefined) apiData.last_name = userData.lastName;
      if (userData.roleId !== undefined) apiData.role_id = userData.roleId;
      if (userData.areaId !== undefined) apiData.area_id = userData.areaId;
      if (userData.isActive !== undefined) apiData.is_active = userData.isActive;
      
      const response = await apiClient.patch<User>(`/users/${userId}`, apiData);
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
      const response = await apiClient.get<Role[]>('/roles');
      return response.data.map(role => ({
        ...role,
        id: role.id.toString() // Asegurar que el ID sea string
      }));
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw new Error(`No se pudieron obtener los roles: ${handleApiError(error)}`);
    }
  }
  
  // Obtener todas las áreas
  async getAreas(): Promise<Area[]> {
    try {
      const response = await apiClient.get<Area[]>('/areas');
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
      console.log(`Asignando rol ${roleId} con área ${areaId} al usuario ${userId}`);
      
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
}

export default new UserService();