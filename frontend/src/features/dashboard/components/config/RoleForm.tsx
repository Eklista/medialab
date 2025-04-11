// src/features/dashboard/components/config/RoleForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

interface RoleFormProps {
  initialData?: RoleFormData;
  onSubmit: (data: RoleFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const RoleForm: React.FC<RoleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof RoleFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handlePermissionChange = (permission: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      
      return { ...prev, permissions: newPermissions };
    });
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RoleFormData, string>> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // Available permissions
  const availablePermissions = [
    { id: 'admin_view', label: 'Ver administradores' },
    { id: 'admin_create', label: 'Crear administradores' },
    { id: 'admin_edit', label: 'Editar administradores' },
    { id: 'admin_delete', label: 'Eliminar administradores' },
    { id: 'service_view', label: 'Ver servicios' },
    { id: 'service_create', label: 'Crear servicios' },
    { id: 'service_edit', label: 'Editar servicios' },
    { id: 'service_delete', label: 'Eliminar servicios' },
  ];
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <DashboardTextInput
          id="role-name"
          name="name"
          label="Nombre del rol"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ingrese el nombre del rol"
          required
          error={errors.name}
        />
        
        <DashboardTextarea
          id="role-description"
          name="description"
          label="Descripción"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describa brevemente el propósito de este rol"
          rows={3}
        />
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permisos
          </label>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-center">
                  <input
                    id={`permission-${permission.id}`}
                    type="checkbox"
                    checked={formData.permissions.includes(permission.id)}
                    onChange={() => handlePermissionChange(permission.id)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`permission-${permission.id}`}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {permission.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
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
          disabled={isSubmitting}
        >
          {initialData ? 'Actualizar' : 'Crear'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default RoleForm;