// src/features/dashboard/pages/settings/RolesAreasSettings.tsx
import React, { useState } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import RoleForm, { RoleFormData } from '../../components/config/RoleForm';
import AreaForm, { AreaFormData } from '../../components/config/AreaForm';
import { PlusIcon } from '@heroicons/react/24/outline';

// Tipos
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Area {
  id: string;
  name: string;
  description: string;
}

const RolesAreasSettings: React.FC = () => {
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'roles' | 'areas'>('roles');
  
  // Estado para roles
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Admin',
      description: 'Acceso completo a todas las funcionalidades del sistema',
      permissions: ['admin_view', 'admin_create', 'admin_edit', 'admin_delete', 'service_view', 'service_create', 'service_edit', 'service_delete']
    },
    {
      id: '2',
      name: 'Admin',
      description: 'Administración del sistema con limitaciones de permisos',
      permissions: ['admin_view', 'service_view', 'service_create', 'service_edit']
    }
  ]);
  
  // Estado para áreas
  const [areas, setAreas] = useState<Area[]>([
    {
      id: '1',
      name: 'Producción Audiovisual',
      description: 'Equipo encargado de la grabación y edición de contenido audiovisual'
    },
    {
      id: '2',
      name: 'Desarrollo Web',
      description: 'Equipo responsable del desarrollo y mantenimiento de sitios web'
    }
  ]);
  
  // Estado para modales
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [isDeleteAreaModalOpen, setIsDeleteAreaModalOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState<Area | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handlers para roles
  const handleAddRole = () => {
    setIsAddRoleModalOpen(true);
  };
  
  const handleEditRole = (role: Role) => {
    setCurrentRole(role);
    setIsEditRoleModalOpen(true);
  };
  
  const handleDeleteRoleClick = (role: Role) => {
    setCurrentRole(role);
    setIsDeleteRoleModalOpen(true);
  };
  
  const handleDeleteRole = () => {
    if (currentRole) {
      setRoles(roles.filter(role => role.id !== currentRole.id));
      setIsDeleteRoleModalOpen(false);
      setCurrentRole(null);
    }
  };
  
  const handleAddRoleSubmit = (data: RoleFormData) => {
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      const newRole: Role = {
        id: Date.now().toString(),
        ...data
      };
      
      setRoles([...roles, newRole]);
      setIsAddRoleModalOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const handleEditRoleSubmit = (data: RoleFormData) => {
    if (!currentRole) return;
    
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      setRoles(roles.map(role => 
        role.id === currentRole.id
          ? { ...role, ...data }
          : role
      ));
      
      setIsEditRoleModalOpen(false);
      setCurrentRole(null);
      setIsSubmitting(false);
    }, 500);
  };
  
  // Handlers para áreas
  const handleAddArea = () => {
    setIsAddAreaModalOpen(true);
  };
  
  const handleEditArea = (area: Area) => {
    setCurrentArea(area);
    setIsEditAreaModalOpen(true);
  };
  
  const handleDeleteAreaClick = (area: Area) => {
    setCurrentArea(area);
    setIsDeleteAreaModalOpen(true);
  };
  
  const handleDeleteArea = () => {
    if (currentArea) {
      setAreas(areas.filter(area => area.id !== currentArea.id));
      setIsDeleteAreaModalOpen(false);
      setCurrentArea(null);
    }
  };
  
  const handleAddAreaSubmit = (data: AreaFormData) => {
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      const newArea: Area = {
        id: Date.now().toString(),
        ...data
      };
      
      setAreas([...areas, newArea]);
      setIsAddAreaModalOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const handleEditAreaSubmit = (data: AreaFormData) => {
    if (!currentArea) return;
    
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      setAreas(areas.map(area => 
        area.id === currentArea.id
          ? { ...area, ...data }
          : area
      ));
      
      setIsEditAreaModalOpen(false);
      setCurrentArea(null);
      setIsSubmitting(false);
    }, 500);
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
          {role.permissions.slice(0, 3).map((permission, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {permission}
            </span>
          ))}
          {role.permissions.length > 3 && (
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
      accessor: (area: Area) => area.description
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
              emptyMessage="No hay roles configurados"
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
              emptyMessage="No hay áreas configuradas"
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
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteRole}
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
      >
        {currentArea && (
          <AreaForm
            initialData={currentArea}
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
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteArea}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default RolesAreasSettings;