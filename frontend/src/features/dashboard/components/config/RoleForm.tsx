// src/features/dashboard/components/config/RoleForm.tsx (Actualizado)
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import DashboardCheckbox from '../ui/DashboardCheckbox';
import Badge from '../ui/Badge';
import permissionsService, { Permission } from '../../../../services/security/permissions.service';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  LockClosedIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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
  
  // ✅ Usar el servicio de permisos dedicado
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // ✅ Cargar permisos usando el servicio dedicado
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true);
        setPermissionError(null);
        
        console.log('🔄 Cargando permisos usando permissionsService...');
        const permissionsData = await permissionsService.getAllPermissions();
        console.log('✅ Permisos cargados:', permissionsData);
        
        setPermissions(permissionsData);
      } catch (error) {
        console.error('❌ Error al cargar permisos:', error);
        setPermissionError('No se pudieron cargar los permisos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoadingPermissions(false);
      }
    };
    
    fetchPermissions();
  }, []);
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      console.log('🔄 Inicializando formulario con:', initialData);
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
      
      console.log('🔄 Permisos actualizados:', newPermissions);
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSelectAllInCategory = (categoryPermissions: Permission[]) => {
    const categoryPermissionNames = categoryPermissions.map(p => p.name);
    const allSelected = categoryPermissionNames.every(perm => formData.permissions.includes(perm));
    
    setFormData(prev => {
      if (allSelected) {
        // Deselect all in this category
        const newPermissions = prev.permissions.filter(p => !categoryPermissionNames.includes(p));
        console.log('🔄 Deseleccionando categoría completa:', newPermissions);
        return { ...prev, permissions: newPermissions };
      } else {
        // Select all in this category
        const newPermissions = [...prev.permissions];
        categoryPermissionNames.forEach(perm => {
          if (!newPermissions.includes(perm)) {
            newPermissions.push(perm);
          }
        });
        console.log('🔄 Seleccionando categoría completa:', newPermissions);
        return { ...prev, permissions: newPermissions };
      }
    });
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RoleFormData, string>> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del rol es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres';
    }

    // Validate description
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('📤 Enviando datos del formulario:', formData);
      onSubmit(formData);
    }
  };
  
  // ✅ Agrupar permisos por categoría usando el servicio
  const groupPermissionsByCategory = () => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const category = permissionsService.extractCategory(permission.name);
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(permission);
    });
    
    return grouped;
  };
  
  const groupedPermissions = groupPermissionsByCategory();

  // ✅ Usar el método del servicio para nombres de categorías
  const getCategoryDisplayName = (category: string) => {
    return permissionsService.getCategoryDisplayName(category);
  };

  // Obtener icono de la categoría
  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, React.ReactNode> = {
      'user': <UserGroupIcon className="h-4 w-4" />,
      'role': <ShieldCheckIcon className="h-4 w-4" />,
      'area': <DocumentTextIcon className="h-4 w-4" />,
      'service': <LockClosedIcon className="h-4 w-4" />,
      'template': <DocumentTextIcon className="h-4 w-4" />,
      'config': <LockClosedIcon className="h-4 w-4" />,
      'system': <LockClosedIcon className="h-4 w-4" />,
      'report': <DocumentTextIcon className="h-4 w-4" />,
      'dashboard': <DocumentTextIcon className="h-4 w-4" />,
      'admin': <ShieldCheckIcon className="h-4 w-4" />
    };
    
    return categoryIcons[category] || <LockClosedIcon className="h-4 w-4" />;
  };
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Estado actual del formulario:', {
      permisos: formData.permissions,
      totalPermisosDisponibles: permissions.length,
      categorias: Object.keys(groupedPermissions).length
    });
  }, [formData.permissions, permissions.length, groupedPermissions]);
  
  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
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

        {/* Information Note */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <InformationCircleIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Acerca de los Roles</h3>
              <p className="mt-1 text-sm text-blue-700">
                Los roles definen qué acciones pueden realizar los usuarios en el sistema. 
                Selecciona cuidadosamente los permisos según las responsabilidades del rol.
              </p>
            </div>
          </div>
        </div>
        
        {/* Basic Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información del Rol</h3>
              <p className="text-sm text-gray-500">Datos básicos del rol de usuario</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="role-name"
              name="name"
              label="Nombre del rol"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: Administrador, Editor, Coordinador"
              required
              error={errors.name}
              icon={<UserGroupIcon className="h-5 w-5" />}
              maxLength={50}
              showCharCount
              helperText="Nombre descriptivo que identifique el rol"
            />
            
            <div className="flex items-end">
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Permisos seleccionados
                  </span>
                  <Badge variant="secondary">
                    {formData.permissions.length}
                  </Badge>
                </div>
                <p className="text-xs text-purple-700">
                  {formData.permissions.length === 0 
                    ? 'Ningún permiso seleccionado'
                    : `${formData.permissions.length} permiso${formData.permissions.length > 1 ? 's' : ''} asignado${formData.permissions.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <DocumentTextIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Descripción del Rol</h3>
              <p className="text-sm text-gray-500">Información sobre las responsabilidades y alcance</p>
            </div>
          </div>
          
          <DashboardTextarea
            id="role-description"
            name="description"
            label="Descripción (Opcional)"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describa las responsabilidades, objetivos y alcance de este rol dentro del sistema..."
            rows={4}
            maxLength={500}
            showCharCount
            helperText="Una descripción clara ayudará a entender el propósito del rol"
          />
        </div>
        
        {/* Permissions Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <LockClosedIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Permisos del Sistema
                <Badge variant="info" className="ml-2">
                  {permissions.length} disponibles
                </Badge>
              </h3>
              <p className="text-sm text-gray-500">Selecciona qué acciones puede realizar este rol</p>
            </div>
          </div>
          
          {loadingPermissions && (
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="text-gray-600">Cargando permisos del sistema...</span>
              </div>
            </div>
          )}
          
          {permissionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error al cargar permisos</h3>
                  <p className="mt-1 text-sm text-red-700">{permissionError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                  >
                    Recargar página
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!loadingPermissions && !permissionError && (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => {
                const selectedInCategory = perms.filter(p => formData.permissions.includes(p.name)).length;
                const allSelected = selectedInCategory === perms.length;
                const someSelected = selectedInCategory > 0 && selectedInCategory < perms.length;
                
                return (
                  <div key={category} className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="bg-white border-b border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                            {getCategoryIcon(category)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {getCategoryDisplayName(category)}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {selectedInCategory} de {perms.length} seleccionados
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={allSelected ? "success" : someSelected ? "warning" : "secondary"}
                            size="sm"
                          >
                            {selectedInCategory}/{perms.length}
                          </Badge>
                          
                          <DashboardButton
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectAllInCategory(perms)}
                            className="text-xs"
                            disabled={isSubmitting}
                          >
                            {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                          </DashboardButton>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perms.map((permission) => {
                          const isChecked = formData.permissions.includes(permission.name);
                          
                          return (
                            <DashboardCheckbox
                              key={permission.id}
                              id={`permission-${permission.id}`}
                              checked={isChecked}
                              onChange={() => handlePermissionChange(permission.name)}
                              label={permission.description || permission.name}
                              description={permission.name}
                              disabled={isSubmitting}
                              size="sm"
                              variant="default"
                              className={`
                                p-3 rounded-lg border transition-all duration-200
                                ${isChecked 
                                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(groupedPermissions).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <LockClosedIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay permisos disponibles en el sistema.</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    Recargar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Section */}
        {formData.permissions.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-2">Resumen del Rol</h4>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">
                        {formData.name || 'Nombre del rol no especificado'}
                      </h5>
                      {formData.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {formData.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="success" size="sm">
                          {formData.permissions.length} permisos
                        </Badge>
                        <span className="text-xs text-gray-500">
                          de {permissions.length} disponibles
                        </span>
                      </div>
                      
                      {/* ✅ Mostrar categorías con permisos seleccionados */}
                      {formData.permissions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Categorías con permisos:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(groupedPermissions)
                              .filter(([_, perms]) => perms.some(p => formData.permissions.includes(p.name)))
                              .map(([category, perms]) => {
                                const selectedCount = perms.filter(p => formData.permissions.includes(p.name)).length;
                                return (
                                  <Badge key={category} variant="secondary" size="sm">
                                    {getCategoryDisplayName(category)} ({selectedCount})
                                  </Badge>
                                );
                              })
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Vista previa de cómo aparecerá el rol en el sistema.
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
            disabled={isSubmitting || loadingPermissions}
            className="w-full sm:w-auto"
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || loadingPermissions || !formData.name.trim()}
            className="w-full sm:w-auto"
          >
            {initialData ? 'Actualizar Rol' : 'Crear Rol'}
          </DashboardButton>
        </div>
        
        {/* ✅ Debug Info en desarrollo */}
        {import.meta.env.DEV && (
          <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600">
            <h4 className="font-medium mb-2">🔍 Debug Info:</h4>
            <div className="space-y-1">
              <div>Permisos seleccionados: {formData.permissions.length}</div>
              <div>Permisos disponibles: {permissions.length}</div>
              <div>Categorías: {Object.keys(groupedPermissions).length}</div>
              <div>Loading: {loadingPermissions ? 'Sí' : 'No'}</div>
              <div>Error: {permissionError ? 'Sí' : 'No'}</div>
            </div>
            {formData.permissions.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">Ver permisos seleccionados</summary>
                <div className="mt-1 bg-white p-2 rounded text-xs">
                  {formData.permissions.join(', ')}
                </div>
              </details>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default RoleForm;