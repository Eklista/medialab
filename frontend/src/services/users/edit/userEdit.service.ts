// ===================================================================
// frontend/src/services/users/edit/userEdit.service.ts - 🔧 CORREGIDO
// ===================================================================
import apiClient, { handleApiError } from '../../api';
import { UserProfile } from '../types/user.types';
import { UserUpdateRequest } from '../types/requests.types';
import { userTransforms } from '../utils/userTransforms';
import { userValidations } from '../utils/userValidations';

class UserEditService {
  /**
   * ✏️ Actualiza el perfil del usuario actual
   */
  async updateCurrentProfile(data: UserUpdateRequest): Promise<UserProfile> {
    try {
      console.log('✏️ Actualizando perfil actual...');
      
      // Validar datos antes de enviar
      const validationResult = userValidations.validateUpdateData(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }
      
      // Convertir a formato API
      const apiData = userTransforms.toApiUpdateFormat(data);
      
      const response = await apiClient.patch<UserProfile>('/users/me', apiData);
      return userTransforms.normalizeUser(response.data);
    } catch (error) {
      console.error('❌ Error actualizando perfil actual:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ✏️ Actualiza usuario por ID (admin)
   */
  async updateUser(userId: number, data: UserUpdateRequest): Promise<UserProfile> {
    try {
      console.log(`✏️ Actualizando usuario ${userId}...`);
      
      // Validar datos
      const validationResult = userValidations.validateUpdateData(data);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }
      
      const apiData = userTransforms.toApiUpdateFormat(data);
      
      const response = await apiClient.patch<UserProfile>(`/users/${userId}`, apiData);
      return userTransforms.normalizeUser(response.data);
    } catch (error) {
      console.error(`❌ Error actualizando usuario ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🆕 Crea un nuevo usuario
   */
  async createUser(userData: any): Promise<UserProfile> {
    try {
      console.log('👤 Creando nuevo usuario...');
      
      const response = await apiClient.post<UserProfile>('/users/', userData);
      return userTransforms.normalizeUser(response.data);
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔒 Cambia contraseña del usuario actual
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{message: string}> {
    try {
      console.log('🔒 Cambiando contraseña...');
      
      // Validar contraseñas
      if (!userValidations.validatePassword(newPassword)) {
        throw new Error('La nueva contraseña no cumple con los requisitos de seguridad');
      }
      
      const response = await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🗑️ Elimina usuario (admin)
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando usuario ${userId}...`);
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      console.error(`❌ Error eliminando usuario ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ✅ Activa/desactiva usuario
   */
  async toggleUserStatus(userId: number, isActive: boolean): Promise<UserProfile> {
    try {
      console.log(`✅ ${isActive ? 'Activando' : 'Desactivando'} usuario ${userId}...`);
      return await this.updateUser(userId, { isActive });
    } catch (error) {
      console.error(`❌ Error cambiando estado del usuario ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 👥 Asigna rol a usuario
   */
  async assignRole(userId: number, roleId: string, areaId: string): Promise<void> {
    try {
      console.log(`👥 Asignando rol al usuario ${userId}...`);
      
      await apiClient.post(`/users/${userId}/roles`, {
        roleId: roleId.toString(),
        areaId: areaId.toString()
      });
    } catch (error) {
      console.error(`❌ Error asignando rol al usuario ${userId}:`, error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new UserEditService();