// frontend/src/services/users/edit/userEdit.service.ts - 🔧 FIX COMPLETO para Error 422
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
   * 🆕 Crea un nuevo usuario - COMPLETAMENTE CORREGIDO PARA 422
   */
  async createUser(userData: any): Promise<UserProfile> {
    try {
      console.log('👤 Iniciando creación de usuario...');
      console.log('📝 Datos originales recibidos:', userData);
      
      // 🔧 PASO 1: VALIDAR CAMPOS REQUERIDOS FRONTEND
      const requiredFields = ['email', 'firstName', 'lastName'];
      const missingFields = requiredFields.filter(field => 
        !userData[field] || userData[field].toString().trim() === ''
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // 🔧 PASO 2: VALIDAR EMAIL
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Formato de email inválido');
      }

      // 🔧 PASO 3: PREPARAR DATOS SEGÚN LO QUE ESPERA EL BACKEND
      // Basado en tu código backend, necesita estos campos exactos:
      const backendData = {
        // ⭐ CAMPOS REQUERIDOS (según el backend)
        email: userData.email.toString().trim(),
        username: (userData.username?.toString().trim()) || userData.email.split('@')[0],
        first_name: userData.firstName.toString().trim(),
        last_name: userData.lastName.toString().trim(),
        password: this.generateSecurePassword(), // Generar password si no se proporciona
        
        // ⭐ CAMPOS OPCIONALES PERO CON VALORES DEFAULT SEGUROS
        phone: userData.phone?.toString().trim() || '',
        birth_date: this.formatDateForBackend(userData.birthDate) || null,
        join_date: this.formatDateForBackend(userData.joinDate) || new Date().toISOString().split('T')[0],
        
        // ⭐ CAMPOS BOOLEANOS CON DEFAULTS SEGUROS
        is_active: userData.isActive !== undefined ? Boolean(userData.isActive) : true,
        
        // ⭐ ROLES - Solo si están presentes Y son válidos
        ...(this.validateAndFormatRoles(userData.roleId, userData.areaId))
      };
      
      console.log('📤 Datos preparados para el backend:', {
        ...backendData,
        password: '[HIDDEN]' // No mostrar password en logs
      });

      // 🔧 PASO 4: ENVIAR AL BACKEND CON MANEJO DE ERRORES ESPECÍFICO
      let response;
      try {
        response = await apiClient.post<UserProfile>('/users/', backendData);
        console.log('✅ Usuario creado exitosamente en el backend');
      } catch (createError: any) {
        console.error('💥 Error específico de creación:', createError);
        
        // Manejar errores específicos del backend
        if (createError.response?.status === 422) {
          const validationErrors = this.parseValidationErrors(createError.response.data);
          throw new Error(`Error de validación: ${validationErrors}`);
        }
        
        if (createError.response?.status === 400) {
          throw new Error(createError.response.data?.detail || 'Datos inválidos');
        }
        
        if (createError.response?.status === 409) {
          throw new Error('Ya existe un usuario con este email');
        }
        
        throw new Error(handleApiError(createError));
      }
      
      console.log('📋 Respuesta del backend:', response.data);
      
      // 🔧 PASO 5: NORMALIZAR RESPUESTA
      const normalizedUser = userTransforms.normalizeUser(response.data);
      console.log('✅ Usuario normalizado:', normalizedUser);
      
      return normalizedUser;
      
    } catch (error) {
      console.error('💥 Error en createUser:', error);
      throw error; // Re-lanzar el error para que lo maneje el componente
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

  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  /**
   * 🔐 Genera contraseña segura
   */
  private generateSecurePassword(): string {
    // Generar contraseña que cumpla con requisitos de seguridad
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    
    // Asegurar al menos 1 de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar hasta 12 caracteres
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * 📅 Formatea fecha para el backend
   */
  private formatDateForBackend(dateInput: any): string | null {
    if (!dateInput) return null;
    
    try {
      // Si ya es string en formato correcto, devolverlo
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        return dateInput.split('T')[0]; // Solo la parte de fecha
      }
      
      // Si es Date object
      if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
      }
      
      // Intentar parsear
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Error formateando fecha:', error);
      return null;
    }
  }

  /**
   * 👥 Valida y formatea roles
   */
  private validateAndFormatRoles(roleId: any, areaId: any): object {
    // Solo incluir roles si ambos están presentes y son válidos
    if (!roleId || !areaId) {
      console.log('🔄 No se proporcionaron roleId/areaId, omitiendo...');
      return {};
    }
    
    // Validar que sean números o strings que se puedan convertir
    const roleIdNum = parseInt(roleId.toString());
    const areaIdNum = parseInt(areaId.toString());
    
    if (isNaN(roleIdNum) || isNaN(areaIdNum)) {
      console.warn('⚠️ roleId o areaId no son números válidos, omitiendo...');
      return {};
    }
    
    console.log(`✅ Incluyendo roles: roleId=${roleIdNum}, areaId=${areaIdNum}`);
    return {
      roleId: roleIdNum.toString(),
      areaId: areaIdNum.toString()
    };
  }

  /**
   * 🔍 Parsea errores de validación del backend
   */
  private parseValidationErrors(errorData: any): string {
    try {
      // Manejar diferentes formatos de error de FastAPI
      if (errorData.detail) {
        // Si detail es un array (errores de Pydantic)
        if (Array.isArray(errorData.detail)) {
          return errorData.detail
            .map((error: any) => {
              if (typeof error === 'string') return error;
              if (error.msg && error.loc) {
                const field = error.loc[error.loc.length - 1];
                return `${field}: ${error.msg}`;
              }
              return error.msg || JSON.stringify(error);
            })
            .join(', ');
        }
        
        // Si detail es string
        if (typeof errorData.detail === 'string') {
          return errorData.detail;
        }
      }
      
      // Fallback
      return JSON.stringify(errorData);
      
    } catch (parseError) {
      console.error('Error parseando errores de validación:', parseError);
      return 'Error de validación (no se pudo parsear)';
    }
  }
}

export default new UserEditService();