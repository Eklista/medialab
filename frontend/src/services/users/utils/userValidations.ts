// ===================================================================
// frontend/src/services/users/utils/userValidations.ts - 🔧 CORREGIDO
// ===================================================================
import { UserUpdateRequest } from '../types/requests.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class UserValidations {
  /**
   * ✅ Valida datos de actualización de usuario
   */
  validateUpdateData(data: UserUpdateRequest): ValidationResult {
    const errors: string[] = [];

    // Validar email
    if (data.email !== undefined) {
      if (!this.isValidEmail(data.email)) {
        errors.push('Email no válido');
      }
    }

    // Validar nombres
    if (data.firstName !== undefined) {
      if (!data.firstName.trim()) {
        errors.push('El nombre es requerido');
      }
      if (data.firstName.length > 50) {
        errors.push('El nombre es demasiado largo');
      }
    }

    if (data.lastName !== undefined) {
      if (!data.lastName.trim()) {
        errors.push('El apellido es requerido');
      }
      if (data.lastName.length > 50) {
        errors.push('El apellido es demasiado largo');
      }
    }

    // Validar teléfono
    if (data.phone !== undefined && data.phone.trim()) {
      if (!this.isValidPhone(data.phone)) {
        errors.push('Formato de teléfono no válido');
      }
    }

    // Validar fecha de nacimiento
    if (data.birthDate !== undefined && data.birthDate.trim()) {
      if (!this.isValidBirthDate(data.birthDate)) {
        errors.push('Fecha de nacimiento no válida');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 🔒 Valida contraseña
   */
  validatePassword(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    
    return true;
  }

  /**
   * 📧 Valida email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 📞 Valida teléfono
   */
  private isValidPhone(phone: string): boolean {
    // Acepta formatos: +502 1234-5678, 1234-5678, 12345678
    const phoneRegex = /^(\+\d{1,3}\s?)?\d{4,4}[-\s]?\d{4,4}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * 📅 Valida fecha de nacimiento
   */
  private isValidBirthDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) return false;
    
    // Verificar que no sea en el futuro
    if (date > now) return false;
    
    // Verificar que sea realista (mayor a 1900)
    if (date.getFullYear() < 1900) return false;
    
    return true;
  }
}

export const userValidations = new UserValidations();