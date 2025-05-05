// src/features/dashboard/pages/settings/RolesAreasSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import RoleForm, { RoleFormData } from '../../components/config/RoleForm';
import AreaForm, { AreaFormData } from '../../components/config/AreaForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { userService } from '../../../../services';
import { RoleCreateRequest, RoleUpdateRequest } from '../../../../services/users.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Tipos adaptados para ser compatibles con la API y el componente
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Area {
  id: string;
  name: string;
  description: string; // Debe ser string para AreaForm
}

const RolesAreasSettings: React.FC = () => {
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'roles' | 'areas'>('roles');
  
  // Estado para roles y áreas
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  // Estado para carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para modales
  const [modalError, setModalError] = useState<string | null>(null);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [isDeleteAreaModalOpen, setIsDeleteAreaModalOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState<Area | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRoles();
    } else {
      fetchAreas();
    }
  }, [activeTab]);
  
  // Función para cargar roles desde la API
  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.getRoles();
      // Convertir los datos de la API al formato local
      const formattedRoles: Role[] = data.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: [] // Añadir arreglo vacío de permisos ya que la API no los devuelve
      }));
      setRoles(formattedRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los roles');
      console.error('Error al cargar roles:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar áreas desde la API
  const fetchAreas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.getAreas();
      // Convertir los datos de la API al formato local - asegurarse que description siempre sea string
      const formattedAreas: Area[] = data.map(area => ({
        id: area.id,
        name: area.name,
        description: area.description || '' // Convertir undefined a string vacío
      }));
      setAreas(formattedAreas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las áreas');
      console.error('Error al cargar áreas:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers para roles
  const handleAddRole = () => {
    setModalError(null);
    setIsAddRoleModalOpen(true);
  };
  
  const handleEditRole = (role: Role) => {
    setModalError(null);
    setCurrentRole(role);
    setIsEditRoleModalOpen(true);
  };
  
  const handleDeleteRoleClick = (role: Role) => {
    setModalError(null);
    setCurrentRole(role);
    setIsDeleteRoleModalOpen(true);
  };
  
  const handleDeleteRole = async () => {
    if (!currentRole || !currentRole.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const roleId = parseInt(currentRole.id);
      
      await userService.deleteRole(roleId);
      
      setRoles(roles.filter(role => role.id !== currentRole.id));
      setIsDeleteRoleModalOpen(false);
      setCurrentRole(null);
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
      const roleRequest: RoleCreateRequest = {
        name: data.name,
        description: data.description
      };
      
      const newRole = await userService.createRole(roleRequest);
      
      const formattedRole: Role = {
        id: newRole.id.toString(),
        name: newRole.name,
        description: newRole.description || '',
        permissions: data.permissions || []
      };
      
      setRoles([...roles, formattedRole]);
      setIsAddRoleModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear el rol');
      console.error('Error al crear rol:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditRoleSubmit = async (data: RoleFormData) => {
    if (!currentRole || !currentRole.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const roleId = parseInt(currentRole.id);
      
      const roleRequest: RoleUpdateRequest = {
        name: data.name,
        description: data.description
      };
      
      const updatedRole = await userService.updateRole(roleId, roleRequest);
      
      if (data.permissions && data.permissions.length > 0) {
        try {
          // Este paso es opcional, depende de si tu API soporta esta operación
          console.log("Asignación de permisos no implementada en la API");
        } catch (permError) {
          console.warn("No se pudieron asignar permisos:", permError);
        }
      }
      
      const formattedRole: Role = {
        id: updatedRole.id.toString(),
        name: updatedRole.name,
        description: updatedRole.description || '',
        permissions: data.permissions || currentRole.permissions || []
      };
      
      setRoles(roles.map(role => 
        role.id === currentRole.id ? formattedRole : role
      ));
      
      setIsEditRoleModalOpen(false);
      setCurrentRole(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el rol');
      console.error('Error al actualizar rol:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddArea = () => {
    setModalError(null);
    setIsAddAreaModalOpen(true);
  };
  
  const handleEditArea = (area: Area) => {
    setModalError(null);
    setCurrentArea(area);
    setIsEditAreaModalOpen(true);
  };
  
  const handleDeleteAreaClick = (area: Area) => {
    setModalError(null);
    setCurrentArea(area);
    setIsDeleteAreaModalOpen(true);
  };
  
  const handleDeleteArea = async () => {
    if (!currentArea || !currentArea.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const areaId = parseInt(currentArea.id);
      
      await userService.deleteArea(areaId);
      
      setAreas(areas.filter(area => area.id !== currentArea.id));
      setIsDeleteAreaModalOpen(false);
      setCurrentArea(null);
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
      const newArea = await userService.createArea(data);
      
      const formattedArea: Area = {
        id: newArea.id.toString(),
        name: newArea.name,
        description: newArea.description || ''
      };
      
      setAreas([...areas, formattedArea]);
      setIsAddAreaModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear el área');
      console.error('Error al crear área:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditAreaSubmit = async (data: AreaFormData) => {
    if (!currentArea || !currentArea.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const areaId = parseInt(currentArea.id);
      
      const updatedArea = await userService.updateArea(areaId, data);
      
      const formattedArea: Area = {
        id: updatedArea.id.toString(),
        name: updatedArea.name,
        description: updatedArea.description || ''
      };
      
      setAreas(areas.map(area => 
        area.id === currentArea.id ? formattedArea : area
      ));
      
      setIsEditAreaModalOpen(false);
      setCurrentArea(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el área');
      console.error('Error al actualizar área:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Columnas para la tabla de roles
  const roleColumns = [
    {
      header: 'Nombre',
      accessor: (role: Role) => role.name
    },
    {
      header: 'Descripción',
      accessor: (role: Role) => role.description
    },
    {
      header: 'Permisos',
      accessor: (role: Role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions && role.permissions.slice(0, 3).map((permission, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {permission}
            </span>
          ))}
          {role.permissions && role.permissions.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              +{role.permissions.length - 3} más
            </span>
          )}
        </div>
      )
    }
  ];
  
  // Columnas para la tabla de áreas
  const areaColumns = [
    {
      header: 'Nombre',
      accessor: (area: Area) => area.name
    },
    {
      header: 'Descripción',
      accessor: (area: Area) => area.description || '-'
    }
  ];
  
  return (
    <div>
      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 border-b-2 text-sm font-medium ${
              activeTab === 'roles'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('roles')}
          >
            Roles
          </button>
          <button
            className={`py-4 px-6 border-b-2 text-sm font-medium ${
              activeTab === 'areas'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('areas')}
          >
            Áreas
          </button>
        </nav>
      </div>
      
      {/* Contenido */}
      <div className="p-6">
        {error && (
          <ApiErrorHandler 
            error={error} 
            onRetry={activeTab === 'roles' ? fetchRoles : fetchAreas} 
            resourceName={activeTab === 'roles' ? "los roles" : "las áreas"}
          />
        )}
        
        {activeTab === 'roles' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Gestión de Roles</h2>
              <DashboardButton
                onClick={handleAddRole}
                leftIcon={<PlusIcon className="w-5 h-5" />}
              >
                Agregar Rol
              </DashboardButton>
            </div>
            
            <DashboardDataTable
              columns={roleColumns}
              data={roles}
              keyExtractor={(role) => role.id}
              onEdit={handleEditRole}
              onDelete={handleDeleteRoleClick}
              actionColumn={true}
              emptyMessage={isLoading ? "Cargando roles..." : "No hay roles configurados"}
              isLoading={isLoading}
            />
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Gestión de Áreas</h2>
              <DashboardButton
                onClick={handleAddArea}
                leftIcon={<PlusIcon className="w-5 h-5" />}
              >
                Agregar Área
              </DashboardButton>
            </div>
            
            <DashboardDataTable
              columns={areaColumns}
              data={areas}
              keyExtractor={(area) => area.id}
              onEdit={handleEditArea}
              onDelete={handleDeleteAreaClick}
              actionColumn={true}
              emptyMessage={isLoading ? "Cargando áreas..." : "No hay áreas configuradas"}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
      
      {/* Modales para Roles */}
      <DashboardModal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Agregar Rol"
        size="lg"
        error={modalError}
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
        }}
        title="Editar Rol"
        size="lg"
        error={modalError}
      >
        {currentRole && (
          <RoleForm
            initialData={currentRole}
            onSubmit={handleEditRoleSubmit}
            onCancel={() => {
              setIsEditRoleModalOpen(false);
              setCurrentRole(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>
      
      <DashboardModal
        isOpen={isDeleteRoleModalOpen}
        onClose={() => {
          setIsDeleteRoleModalOpen(false);
          setCurrentRole(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el rol <span className="font-medium">{currentRole?.name}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
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
            variant="danger"
            onClick={handleDeleteRole}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
      
      {/* Modales para Áreas */}
      <DashboardModal
        isOpen={isAddAreaModalOpen}
        onClose={() => setIsAddAreaModalOpen(false)}
        title="Agregar Área"
        error={modalError}
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
        }}
        title="Editar Área"
        error={modalError}
      >
        {currentArea && (
          <AreaForm
            initialData={{
              name: currentArea.name,
              description: currentArea.description
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

      <DashboardModal
        isOpen={isDeleteAreaModalOpen}
        onClose={() => {
          setIsDeleteAreaModalOpen(false);
          setCurrentArea(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el área <span className="font-medium">{currentArea?.name}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
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
            variant="danger"
            onClick={handleDeleteArea}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default RolesAreasSettings;