// src/features/dashboard/components/config/RoleForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import { userService } from '../../../../services'; // Ajusta la ruta según tu estructura

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

// Interfaz para los permisos cargados del backend
interface PermissionItem {
  id: number;
  name: string;
  description?: string;
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
  
  // Estado para almacenar los permisos cargados desde el backend
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Cargar permisos al montar el componente
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true);
        setPermissionError(null);
        
        const permissionsData = await userService.getAllPermissions();
        console.log("Permisos cargados para el formulario:", permissionsData);
        
        setPermissions(permissionsData);
      } catch (error) {
        console.error("Error al cargar permisos:", error);
        setPermissionError("No se pudieron cargar los permisos. Por favor, intenta de nuevo más tarde.");
      } finally {
        setLoadingPermissions(false);
      }
    };
    
    fetchPermissions();
  }, []);
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      console.log('Inicializando formulario con:', initialData);
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        permissions: Array.isArray(initialData.permissions) ? initialData.permissions : []
      });
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
  
  // Agrupar permisos por categoría
  const groupPermissionsByCategory = () => {
    const grouped: Record<string, PermissionItem[]> = {};
    
    permissions.forEach(permission => {
      // Obtener la categoría del nombre del permiso (parte antes del "_")
      const category = permission.name.split('_')[0];
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(permission);
    });
    
    return grouped;
  };
  
  const groupedPermissions = groupPermissionsByCategory();
  
  // Para depuración - mostrar permisos del formulario
  useEffect(() => {
    console.log('Estado actual de permisos en formulario:', formData.permissions);
  }, [formData.permissions]);
  
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
          
          {loadingPermissions && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
              <span>Cargando permisos...</span>
            </div>
          )}
          
          {permissionError && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
              {permissionError}
            </div>
          )}
          
          {!loadingPermissions && !permissionError && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-2 capitalize">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-center">
                        <input
                          id={`permission-${permission.name}`}
                          type="checkbox"
                          checked={formData.permissions.includes(permission.name)}
                          onChange={() => handlePermissionChange(permission.name)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor={`permission-${permission.name}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {permission.description || permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <DashboardButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || loadingPermissions}
        >
          Cancelar
        </DashboardButton>
        
        <DashboardButton
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || loadingPermissions}
        >
          {initialData ? 'Actualizar' : 'Crear'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default RoleForm;