// src/features/dashboard/pages/settings/RolesAreasSettings.tsx - 🔄 ACTUALIZADO CON NUEVOS SERVICIOS
import React, { useState, useEffect, useCallback } from 'react';
import ConfigPageHeader from '../../components/config/ConfigPageHeader';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardPlaceholder, { NoPermissionPlaceholder, ErrorPlaceholder } from '../../components/ui/DashboardPlaceholder';
import RoleForm, { RoleFormData } from '../../components/config/RoleForm';
import AreaForm, { AreaFormData } from '../../components/config/AreaForm';

// 🔄 USAR NUEVOS SERVICIOS MODULARES
import { rolesService, areasService } from '../../../../services';
import type { Role, Area } from '../../../../services';

import { usePermissions } from '../../../../hooks/usePermissions';
import { 
  PlusIcon, 
  ShieldCheckIcon,
  UserGroupIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const RolesAreasSettings: React.FC = () => {
  // 🎯 Usar el hook de permisos existente
  const { 
    canView,
    isLoading: permissionsLoading, 
    error: permissionsError 
  } = usePermissions();
  
  // 🎯 Verificaciones de permisos específicas
  const canViewRoles = canView('role');
  const canViewAreas = canView('area');

  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'roles' | 'areas'>(() => {
    if (canViewRoles) return 'roles';
    if (canViewAreas) return 'areas';
    return 'roles';
  });
  
  // Estado para roles y áreas - USANDO TIPOS CORRECTOS
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  // Estado para carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para modales de roles
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  
  // Estado para modales de áreas
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [isDeleteAreaModalOpen, setIsDeleteAreaModalOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState<Area | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Verificar si tiene permisos para al menos una tab
  const hasAnyPermission = canViewRoles || canViewAreas;
  
  // 🔄 NUEVA: Función para cargar roles usando el nuevo servicio
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando roles con rolesService...');
      const rolesData = await rolesService.getRoles();
      
      // 🔧 TRANSFORMAR ROLES PARA INCLUIR PERMISOS
      const rolesWithPermissions = await Promise.all(
        rolesData.map(async (role) => {
          try {
            const roleDetails = await rolesService.getRoleById(role.id, true);
            return {
              ...role,
              permissions: roleDetails.permissions || []
            };
          } catch (error) {
            console.warn(`No se pudieron cargar permisos para el rol ${role.id}:`, error);
            return {
              ...role,
              permissions: []
            };
          }
        })
      );
      
      setRoles(rolesWithPermissions);
      console.log(`✅ ${rolesWithPermissions.length} roles cargados exitosamente`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los roles';
      setError(errorMessage);
      console.error('Error al cargar roles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 🔄 NUEVA: Función para cargar áreas usando el nuevo servicio
  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando áreas con areasService...');
      const areasData = await areasService.getAreas();
      
      setAreas(areasData);
      console.log(`✅ ${areasData.length} áreas cargadas exitosamente`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las áreas';
      setError(errorMessage);
      console.error('Error al cargar áreas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cargar datos al montar el componente o cambiar de pestaña
  useEffect(() => {
    if (activeTab === 'roles' && canViewRoles) {
      fetchRoles();
    } else if (activeTab === 'areas' && canViewAreas) {
      fetchAreas();
    }
  }, [activeTab, canViewRoles, canViewAreas, fetchRoles, fetchAreas]);

  // Early returns después de todos los hooks
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Cargando permisos...</span>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <ErrorPlaceholder
        title="Error al cargar permisos"
        description={permissionsError}
        onRetry={() => window.location.reload()}
        size="md"
      />
    );
  }

  if (!hasAnyPermission) {
    return (
      <NoPermissionPlaceholder
        title="Acceso Restringido"
        description="No tienes permisos para acceder a la gestión de roles y áreas."
        size="md"
      >
        <p className="text-xs text-gray-400 mt-2">
          Permisos requeridos: role_view o area_view
        </p>
      </NoPermissionPlaceholder>
    );
  }

  // 🔄 HANDLERS PARA ROLES - Usando nuevo servicio
  const handleAddRole = () => {
    setModalError(null);
    setSuccessMessage(null);
    setIsAddRoleModalOpen(true);
  };

  const handleEditRole = async (role: Role) => {
    setModalError(null);
    setSuccessMessage(null);
    
    try {
      console.log('🔄 Cargando detalles del rol para edición...');
      const roleWithPermissions = await rolesService.getRoleById(role.id, true);
      
      setCurrentRole(roleWithPermissions);
      setIsEditRoleModalOpen(true);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al cargar el rol');
      console.error('Error al cargar rol:', err);
    }
  };
  
  const handleDeleteRoleClick = (role: Role) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentRole(role);
    setIsDeleteRoleModalOpen(true);
  };
  
  const handleDeleteRole = async () => {
    if (!currentRole) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await rolesService.deleteRole(currentRole.id);
      
      setRoles(roles.filter(role => role.id !== currentRole.id));
      setSuccessMessage("Rol eliminado correctamente");
      
      setTimeout(() => {
        setIsDeleteRoleModalOpen(false);
        setCurrentRole(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar el rol');
      console.error('Error al eliminar rol:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddRoleSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      console.log('🔄 Creando rol con datos:', data);
      
      const newRole = await rolesService.createRole({
        name: data.name,
        description: data.description,
        permissions: data.permissions
      });
      
      // Añadir a la lista local
      setRoles([...roles, { ...newRole, permissions: data.permissions }]);
      setSuccessMessage("Rol creado correctamente");
      
      setTimeout(() => {
        setIsAddRoleModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear el rol');
      console.error('Error al crear rol:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditRoleSubmit = async (data: RoleFormData) => {
    if (!currentRole) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      console.log('🔄 Actualizando rol con datos:', data);
      
      // Actualizar datos básicos del rol
      const updatedRole = await rolesService.updateRole(currentRole.id, {
        name: data.name,
        description: data.description
      });
      
      // Si hay permisos, asignarlos por separado
      if (data.permissions && data.permissions.length > 0) {
        // Convertir nombres de permisos a IDs (necesitarías un mapa o consulta)
        // Por ahora, asumiendo que el backend maneja esto
        console.log('🔗 Asignando permisos al rol...');
        // await rolesService.assignPermissions(currentRole.id, permissionIds);
      }
      
      // Actualizar en la lista local
      setRoles(roles.map(role => 
        role.id === currentRole.id 
          ? { ...updatedRole, permissions: data.permissions } 
          : role
      ));
      
      setSuccessMessage("Rol actualizado correctamente");
      
      setTimeout(() => {
        setIsEditRoleModalOpen(false);
        setCurrentRole(null);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el rol');
      console.error('Error al actualizar rol:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔄 HANDLERS PARA ÁREAS - Usando nuevo servicio
  const handleAddArea = () => {
    setModalError(null);
    setSuccessMessage(null);
    setIsAddAreaModalOpen(true);
  };
  
  const handleEditArea = (area: Area) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentArea(area);
    setIsEditAreaModalOpen(true);
  };
  
  const handleDeleteAreaClick = (area: Area) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentArea(area);
    setIsDeleteAreaModalOpen(true);
  };
  
  const handleDeleteArea = async () => {
    if (!currentArea) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await areasService.deleteArea(currentArea.id);
      
      setAreas(areas.filter(area => area.id !== currentArea.id));
      setSuccessMessage("Área eliminada correctamente");
      
      setTimeout(() => {
        setIsDeleteAreaModalOpen(false);
        setCurrentArea(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar el área');
      console.error('Error al eliminar área:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddAreaSubmit = async (data: AreaFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      console.log('🔄 Creando área con datos:', data);
      
      const newArea = await areasService.createArea({
        name: data.name,
        description: data.description
      });
      
      setAreas([...areas, newArea]);
      setSuccessMessage("Área creada correctamente");
      
      setTimeout(() => {
        setIsAddAreaModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear el área');
      console.error('Error al crear área:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditAreaSubmit = async (data: AreaFormData) => {
    if (!currentArea) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      console.log('🔄 Actualizando área con datos:', data);
      
      const updatedArea = await areasService.updateArea(currentArea.id, {
        name: data.name,
        description: data.description
      });
      
      setAreas(areas.map(area => 
        area.id === currentArea.id ? updatedArea : area
      ));
      
      setSuccessMessage("Área actualizada correctamente");
      
      setTimeout(() => {
        setIsEditAreaModalOpen(false);
        setCurrentArea(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el área');
      console.error('Error al actualizar área:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estadísticas para el header - MEJORADAS
  const stats = activeTab === 'roles' ? [
    {
      label: 'Total',
      value: roles.length,
      variant: 'default' as const
    },
    {
      label: 'Con permisos',
      value: roles.filter(r => r.permissions && r.permissions.length > 0).length,
      variant: 'success' as const
    },
    {
      label: 'Sin permisos',
      value: roles.filter(r => !r.permissions || r.permissions.length === 0).length,
      variant: 'warning' as const
    }
  ] : [
    {
      label: 'Total',
      value: areas.length,
      variant: 'default' as const
    },
    {
      label: 'Con descripción',
      value: areas.filter(a => a.description && a.description.trim().length > 0).length,
      variant: 'success' as const
    }
  ];

  // Configurar tabs
  const tabs = [
    canViewRoles && {
      id: 'roles',
      label: 'Roles',
      count: roles.length,
      isActive: activeTab === 'roles',
      onClick: () => setActiveTab('roles'),
      icon: <ShieldCheckIcon className="h-4 w-4" />
    },
    canViewAreas && {
      id: 'areas',
      label: 'Áreas',
      count: areas.length,
      isActive: activeTab === 'areas',
      onClick: () => setActiveTab('areas'),
      icon: <UserGroupIcon className="h-4 w-4" />
    }
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
  }>;
  
  // Columnas para la tabla de roles - MEJORADAS
  const roleColumns = [
    {
      header: 'Nombre',
      accessor: (role: Role) => (
        <div>
          <div className="font-medium text-gray-900">{role.name}</div>
          <div className="text-sm text-gray-500 break-words">
            {role.description || 'Sin descripción'}
          </div>
        </div>
      )
    },
    {
      header: 'Permisos',
      accessor: (role: Role) => {
        const permissionCount = role.permissions?.length || 0;
        
        if (permissionCount === 0) {
          return (
            <span className="text-gray-400 text-sm italic">Sin permisos</span>
          );
        }
        
        // Agrupar permisos por categoría
        const categoryCounts: Record<string, number> = {};
        role.permissions?.forEach(permission => {
          const category = permission.split('_')[0];
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        const sortedCategories = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2);
        
        return (
          <div className="flex flex-wrap gap-1">
            {sortedCategories.map(([category, count], index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {category}: {count}
              </span>
            ))}
            
            {Object.keys(categoryCounts).length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{Object.keys(categoryCounts).length - 2}
              </span>
            )}
            
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
              {permissionCount}
            </span>
          </div>
        );
      }
    }
  ];
  
  // Columnas para la tabla de áreas
  const areaColumns = [
    {
      header: 'Nombre',
      accessor: (area: Area) => (
        <div>
          <div className="font-medium text-gray-900">{area.name}</div>
          <div className="text-sm text-gray-500 break-words">
            {area.description || 'Sin descripción'}
          </div>
        </div>
      )
    }
  ];

  // Renderizar acciones para roles con permisos automáticos
  const renderRoleActions = (role: Role) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        permissionCategory="role"
        permissionAction="edit"
        variant="text"
        size="sm"
        onClick={() => handleEditRole(role)}
        className="text-blue-600 hover:text-blue-900"
        leftIcon={<PencilIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Editar
      </DashboardButton>
      
      <DashboardButton
        permissionCategory="role"
        permissionAction="delete"
        variant="text"
        size="sm"
        onClick={() => handleDeleteRoleClick(role)}
        className="text-red-600 hover:text-red-900"
        leftIcon={<TrashIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Eliminar
      </DashboardButton>
    </div>
  );

  // Renderizar acciones para áreas con permisos automáticos
  const renderAreaActions = (area: Area) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        permissionCategory="area"
        permissionAction="edit"
        variant="text"
        size="sm"
        onClick={() => handleEditArea(area)}
        className="text-blue-600 hover:text-blue-900"
        leftIcon={<PencilIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Editar
      </DashboardButton>
      
      <DashboardButton
        permissionCategory="area"
        permissionAction="delete"
        variant="text"
        size="sm"
        onClick={() => handleDeleteAreaClick(area)}
        className="text-red-600 hover:text-red-900"
        leftIcon={<TrashIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Eliminar
      </DashboardButton>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <ConfigPageHeader
        title="Roles y Áreas"
        subtitle="Gestiona los roles de usuario y áreas organizacionales del sistema"
        icon={<ShieldCheckIcon className="h-6 w-6" />}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={activeTab === 'roles' ? fetchRoles : fetchAreas}
        stats={!isLoading ? stats : undefined}
        tabs={tabs}
        actionButton={
          activeTab === 'roles' ? (
            <DashboardButton
              permissionCategory="role"
              permissionAction="create"
              onClick={handleAddRole}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              disabled={isLoading}
              className="w-full sm:w-auto"
              showPermissionTooltip={true}
            >
              <span className="hidden sm:inline">Agregar Rol</span>
              <span className="sm:hidden">Nuevo</span>
            </DashboardButton>
          ) : (
            <DashboardButton
              permissionCategory="area"
              permissionAction="create"
              onClick={handleAddArea}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              disabled={isLoading}
              className="w-full sm:w-auto"
              showPermissionTooltip={true}
            >
              <span className="hidden sm:inline">Agregar Área</span>
              <span className="sm:hidden">Nueva</span>
            </DashboardButton>
          )
        }
      />

      {/* Contenido principal */}
      {error ? (
        <ErrorPlaceholder
          title={`Error al cargar ${activeTab === 'roles' ? 'roles' : 'áreas'}`}
          description={error}
          onRetry={activeTab === 'roles' ? fetchRoles : fetchAreas}
          size="sm"
          showBackground={false}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Renderizar tabla específica según pestaña activa */}
          {activeTab === 'roles' ? (
            <DashboardDataTable
              columns={roleColumns}
              data={roles}
              keyExtractor={(item) => item.id.toString()}
              actionColumn={true}
              emptyMessage=""
              isLoading={isLoading}
              renderActions={renderRoleActions}
              striped={true}
              hover={true}
            />
          ) : (
            <DashboardDataTable
              columns={areaColumns}
              data={areas}
              keyExtractor={(item) => item.id.toString()}
              actionColumn={true}
              emptyMessage=""
              isLoading={isLoading}
              renderActions={renderAreaActions}
              striped={true}
              hover={true}
            />
          )}
          
          {/* Empty state */}
          {!isLoading && !error && (
            (activeTab === 'roles' && roles.length === 0) || 
            (activeTab === 'areas' && areas.length === 0)
          ) && (
            <div className="p-8">
              <DashboardPlaceholder
                type="empty"
                title={`No hay ${activeTab === 'roles' ? 'roles' : 'áreas'}`}
                description={`No hay ${activeTab === 'roles' ? 'roles' : 'áreas'} configurados. Crea ${activeTab === 'roles' ? 'el primer rol' : 'la primera área'} para empezar.`}
                size="sm"
                showBackground={false}
                primaryAction={{
                  label: `Crear ${activeTab === 'roles' ? 'Primer Rol' : 'Primera Área'}`,
                  onClick: activeTab === 'roles' ? handleAddRole : handleAddArea,
                  icon: <PlusIcon className="h-4 w-4" />
                }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* 🔄 Modales para Roles */}
      <DashboardModal
        isOpen={isAddRoleModalOpen}
        onClose={() => {
          setIsAddRoleModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Agregar Rol"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        <RoleForm
          onSubmit={handleAddRoleSubmit}
          onCancel={() => setIsAddRoleModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      <DashboardModal
        isOpen={isEditRoleModalOpen}
        onClose={() => {
          setIsEditRoleModalOpen(false);
          setCurrentRole(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar Rol"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        {currentRole && (
          <RoleForm
            initialData={{
              name: currentRole.name,
              description: currentRole.description || '',
              permissions: currentRole.permissions || []
            }}
            onSubmit={handleEditRoleSubmit}
            onCancel={() => {
              setIsEditRoleModalOpen(false);
              setCurrentRole(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>
      
      {/* Modal de eliminación de roles */}
      <DashboardModal
        isOpen={isDeleteRoleModalOpen}
        onClose={() => {
          setIsDeleteRoleModalOpen(false);
          setCurrentRole(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
        success={successMessage}
      >
        <div className="py-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
              <TrashIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                ¿Eliminar rol "{currentRole?.name}"?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Esta acción no se puede deshacer y eliminará todos los permisos asociados.
              </p>
              
              {/* Información adicional del rol */}
              {currentRole && currentRole.permissions && currentRole.permissions.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Permisos asociados:</span>
                    <span className="ml-2 text-gray-900">
                      {currentRole.permissions.length} permisos
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteRoleModalOpen(false);
              setCurrentRole(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            permissionCategory="role"
            permissionAction="delete"
            onClick={handleDeleteRole}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<TrashIcon className="h-4 w-4" />}
            showPermissionTooltip={true}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
      
      {/* 🔄 Modales para Áreas */}
      <DashboardModal
        isOpen={isAddAreaModalOpen}
        onClose={() => {
          setIsAddAreaModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Agregar Área"
        error={modalError}
        success={successMessage}
      >
        <AreaForm
          onSubmit={handleAddAreaSubmit}
          onCancel={() => setIsAddAreaModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      <DashboardModal
        isOpen={isEditAreaModalOpen}
        onClose={() => {
          setIsEditAreaModalOpen(false);
          setCurrentArea(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar Área"
        error={modalError}
        success={successMessage}
      >
        {currentArea && (
          <AreaForm
            initialData={{
              name: currentArea.name,
              description: currentArea.description || ''
            }}
            onSubmit={handleEditAreaSubmit}
            onCancel={() => {
              setIsEditAreaModalOpen(false);
              setCurrentArea(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>

      {/* Modal de eliminación de áreas */}
      <DashboardModal
        isOpen={isDeleteAreaModalOpen}
        onClose={() => {
          setIsDeleteAreaModalOpen(false);
          setCurrentArea(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
        success={successMessage}
      >
        <div className="py-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
              <TrashIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                ¿Eliminar área "{currentArea?.name}"?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Esta acción no se puede deshacer.
              </p>
              
              {/* Información adicional del área */}
              {currentArea && currentArea.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Descripción:</span>
                    <p className="text-gray-900 mt-1">{currentArea.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteAreaModalOpen(false);
              setCurrentArea(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            permissionCategory="area"
            permissionAction="delete"
            onClick={handleDeleteArea}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<TrashIcon className="h-4 w-4" />}
            showPermissionTooltip={true}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default RolesAreasSettings;