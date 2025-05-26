// src/features/dashboard/components/users/UserForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import { EnvelopeIcon, UserIcon, KeyIcon, ShieldCheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  areaId: string;
  username?: string;
  password?: string;
  isActive?: boolean;
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  roles: Array<{ id: string, name: string }>;
  areas: Array<{ id: string, name: string }>;
  isEditMode?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  roles,
  areas,
  isEditMode = false
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    areaId: '',
    username: '',
    password: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [passwordSet, setPasswordSet] = useState(false);
  
  // Poblar formulario con datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);
  
  // Generar username automáticamente basado en email
  useEffect(() => {
    if (!isEditMode && formData.email) {
      const suggestedUsername = formData.email.split('@')[0];
      setFormData(prev => ({
        ...prev,
        username: suggestedUsername
      }));
    }
  }, [formData.email, isEditMode]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'password' && value) {
      setPasswordSet(true);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando se edita el campo
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleToggleActive = () => {
    setFormData(prev => ({ 
      ...prev, 
      isActive: !prev.isActive 
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.roleId) {
      newErrors.roleId = 'El rol es requerido';
    }
    
    if (!formData.areaId) {
      newErrors.areaId = 'El área es requerida';
    }
    
    if (!isEditMode && formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
    } else if (!isEditMode && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const generateSecurePassword = (): string => {
    const length = Math.max(12, 8);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let password = '';
    
    password += chars.charAt(Math.floor(Math.random() * 26)); // Mayúscula
    password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Minúscula
    password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Número
    password += chars.charAt(62 + Math.floor(Math.random() * (chars.length - 62))); // Símbolo
    
    for (let i = 4; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && !formData.password) {
      const generatedPassword = generateSecurePassword();
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }));
      
      setTimeout(() => {
        if (validateForm()) {
          onSubmit({
            ...formData,
            password: generatedPassword
          });
        }
      }, 0);
      return;
    }
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const prepareSelectOptions = (items: Array<{ id: string | number, name: string }>) => {
    return items.map(item => ({
      value: String(item.id),
      label: item.name
    }));
  };
  
  const hasValidRoles = Array.isArray(roles) && roles.length > 0;
  const hasValidAreas = Array.isArray(areas) && areas.length > 0;
  
  const roleOptions = hasValidRoles ? prepareSelectOptions(roles) : [];
  const areaOptions = hasValidAreas ? prepareSelectOptions(areas) : [];
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Summary - Mejorado */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Por favor, corrige los siguientes errores:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc space-y-1 pl-5">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning for missing data */}
        {(!hasValidRoles || !hasValidAreas) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Advertencia</h3>
                <p className="mt-1 text-sm text-amber-700">
                  {!hasValidRoles && !hasValidAreas 
                    ? 'No se pudieron cargar los roles y áreas. Algunos campos no estarán disponibles.' 
                    : !hasValidRoles 
                      ? 'No se pudieron cargar los roles. El campo de rol no estará disponible.'
                      : 'No se pudieron cargar las áreas. El campo de área no estará disponible.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Personal Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
              <p className="text-sm text-gray-500">Datos básicos del usuario</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="user-firstName"
              name="firstName"
              label="Nombre"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Nombre"
              required
              error={errors.firstName}
              icon={<UserIcon className="h-5 w-5" />}
            />
            
            <DashboardTextInput
              id="user-lastName"
              name="lastName"
              label="Apellido"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Apellido"
              required
              error={errors.lastName}
              icon={<UserIcon className="h-5 w-5" />}
            />
          </div>
          
          <div className="mt-6">
            <DashboardTextInput
              id="user-email"
              name="email"
              label="Correo electrónico"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com"
              required
              error={errors.email}
              icon={<EnvelopeIcon className="h-5 w-5" />}
            />
          </div>
        </div>
        
        {/* Role and Area Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Asignaciones</h3>
              <p className="text-sm text-gray-500">Rol y área de trabajo</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {hasValidRoles && (
              <DashboardSelect
                id="user-roleId"
                name="roleId"
                label="Rol"
                value={formData.roleId}
                onChange={handleInputChange}
                options={roleOptions}
                placeholder="Seleccione un rol"
                required
                error={errors.roleId}
              />
            )}
            
            {hasValidAreas && (
              <DashboardSelect
                id="user-areaId"
                name="areaId"
                label="Área"
                value={formData.areaId}
                onChange={handleInputChange}
                options={areaOptions}
                placeholder="Seleccione un área"
                required
                error={errors.areaId}
              />
            )}
          </div>
        </div>
        
        {/* Security Section - Only for new users */}
        {!isEditMode && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <ShieldCheckIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
                <p className="text-sm text-gray-500">Configuración de acceso</p>
              </div>
            </div>
            
            <DashboardTextInput
              id="user-password"
              name="password"
              label="Contraseña"
              type="password"
              value={formData.password || ''}
              onChange={handleInputChange}
              placeholder="Contraseña del usuario"
              helperText={passwordSet ? undefined : "Se generará una contraseña aleatoria si deja este campo vacío"}
              error={errors.password}
              icon={<KeyIcon className="h-5 w-5" />}
            />
            
            {formData.password && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Fuerza de la contraseña:</span>
                  <div className="flex h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        formData.password.length < 8 ? 'bg-red-500' :
                        formData.password.length < 10 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (formData.password.length / 12) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {formData.password.length < 8 ? 'Débil - Mínimo 8 caracteres requeridos' :
                  formData.password.length < 10 ? 'Media - Añade más caracteres para mayor seguridad' :
                  'Fuerte - Buena elección'}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Status Section - Only for edit mode */}
        {isEditMode && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estado del Usuario</h3>
                <p className="text-sm text-gray-500">Gestión de actividad</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Estado de actividad</h4>
                <p className="text-sm text-gray-500">
                  {formData.isActive ? 'El usuario está activo en el sistema' : 'El usuario está inactivo en el sistema'}
                </p>
              </div>
              <DashboardButton
                type="button"
                variant={formData.isActive ? "danger" : "primary"}
                size="sm"
                onClick={handleToggleActive}
              >
                {formData.isActive ? 'Desactivar' : 'Activar'}
              </DashboardButton>
            </div>
          </div>
        )}
        
        {/* Username Preview - Only for new users */}
        {!isEditMode && formData.username && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <UserIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Nombre de usuario generado</h4>
                <p className="mt-1 text-sm text-blue-700">
                  <span className="font-mono font-medium">{formData.username}</span>
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Se generó automáticamente a partir del correo electrónico. El usuario podrá cambiarlo más adelante.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          <DashboardButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || (!hasValidRoles || !hasValidAreas)}
            className="w-full sm:w-auto"
          >
            {isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default UserForm;