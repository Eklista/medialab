// src/features/dashboard/components/users/UserForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import { EnvelopeIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  areaId: string;
  username?: string;
  password?: string;
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
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [passwordSet, setPasswordSet] = useState(false);
  
  // Poblar formulario con datos iniciales si se proporcionan
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);
  
  // Actualizar el nombre de usuario basado en el email si no está en modo edición
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
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    
    // Validar firstName
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    // Validar lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validar roleId
    if (!formData.roleId) {
      newErrors.roleId = 'El rol es requerido';
    }
    
    // Validar areaId
    if (!formData.areaId) {
      newErrors.areaId = 'El área es requerida';
    }
    
    // Validar contraseña solo si no estamos en modo edición
    if (!isEditMode && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const generateSecurePassword = (): string => {
    // Generar una contraseña más segura que la predeterminada
    const length = 12;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let password = '';
    
    // Asegurar que contenga al menos una mayúscula, minúscula, número y símbolo
    password += chars.charAt(Math.floor(Math.random() * 26)); // Mayúscula
    password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Minúscula
    password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Número
    password += chars.charAt(62 + Math.floor(Math.random() * (chars.length - 62))); // Símbolo
    
    // Completar el resto de la contraseña aleatoriamente
    for (let i = 4; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Mezclar la contraseña para evitar patrones predecibles
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si la contraseña no está definida y no estamos en modo edición, generar una aleatoria
    if (!isEditMode && !formData.password) {
      const generatedPassword = generateSecurePassword();
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }));
      
      // Para que la validación pase en esta iteración
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
  
  // Preparar opciones para los selects, asegurando que los IDs sean string
  const prepareSelectOptions = (items: Array<{ id: string | number, name: string }>) => {
    return items.map(item => ({
      value: String(item.id),
      label: item.name
    }));
  };
  
  // Verificar si tenemos roles y áreas válidos
  const hasValidRoles = Array.isArray(roles) && roles.length > 0;
  const hasValidAreas = Array.isArray(areas) && areas.length > 0;
  
  // Convertir roles y áreas al formato que espera el Select
  const roleOptions = hasValidRoles ? prepareSelectOptions(roles) : [];
  const areaOptions = hasValidAreas ? prepareSelectOptions(areas) : [];
  
  return (
    <form onSubmit={handleSubmit}>
      {(!hasValidRoles || !hasValidAreas) && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
          <p className="font-medium">Advertencia</p>
          <p>
            {!hasValidRoles && !hasValidAreas 
              ? 'No se pudieron cargar los roles y áreas. Algunos campos no estarán disponibles.' 
              : !hasValidRoles 
                ? 'No se pudieron cargar los roles. El campo de rol no estará disponible.'
                : 'No se pudieron cargar las áreas. El campo de área no estará disponible.'}
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        {!isEditMode && (
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
        )}
        
        {!isEditMode && formData.username && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nombre de usuario:</span> {formData.username}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Generado automáticamente a partir del correo electrónico. El usuario podrá cambiarlo más adelante.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <DashboardButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </DashboardButton>
        
        <DashboardButton
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || (!hasValidRoles || !hasValidAreas)}
        >
          {isEditMode ? 'Actualizar' : 'Crear'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default UserForm;