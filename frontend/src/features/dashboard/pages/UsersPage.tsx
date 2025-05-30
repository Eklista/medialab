// src/features/dashboard/pages/UsersPage.tsx - 🎯 VERSIÓN FINAL SIN ERRORES
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardDataTable from '../components/ui/DashboardDataTable';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import DashboardCard from '../components/ui/DashboardCard';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import UserForm, { UserFormData } from '../components/users/UserForm';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';
import Badge from '../components/ui/Badge';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';

// 🎯 NUEVA ARQUITECTURA - Solo hooks optimizados
import { useUserList } from '../../../services/users/hooks/useUserService';
import { useEnsuredSystemData } from '../../../context/AppDataContext';
import { userEditService } from '../../../services/users';
import { UserCreateRequest } from '../../../services/users/types/requests.types';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 🎯 HOOKS OPTIMIZADOS - Reemplazan toda la lógica de carga manual
  const { users, isLoading, error, refresh } = useUserList({ 
    formatType: 'with_roles',
    limit: 1000 
  });
  
  const { roles, areas } = useEnsuredSystemData(['roles', 'areas']);
  
  // 🎯 ESTADOS SIMPLIFICADOS - Solo lo esencial
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // 🎯 TRANSFORMAR DATOS PARA UserForm - Convertir number IDs a string
  const transformedRoles = useMemo(() => {
    if (!roles) return [];
    return roles.map(role => ({
      id: role.id.toString(),
      name: role.name
    }));
  }, [roles]);

  const transformedAreas = useMemo(() => {
    if (!areas) return [];
    return areas.map(area => ({
      id: area.id.toString(),
      name: area.name
    }));
  }, [areas]);
  
  // 🎯 FILTRADO OPTIMIZADO - Solo cálculo, sin side effects
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || 
        user.roles?.includes(filterRole) ||
        user.roleDisplay?.includes(filterRole);
        
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);
  
  // 🎯 ESTADÍSTICAS COMPUTADAS - Sin estado innecesario
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    withRoles: users.filter(u => u.roles && u.roles.length > 0).length
  }), [users]);
  
  // 🎯 OPCIONES DE FILTRO DINÁMICAS
  const roleFilterOptions = useMemo(() => {
    const allRoles = new Set<string>();
    users.forEach(user => {
      if (user.roles) {
        user.roles.forEach(role => allRoles.add(role));
      }
    });
    return ['all', ...Array.from(allRoles)];
  }, [users]);
  
  // 🎯 HANDLERS SIMPLIFICADOS
  const handleAddUser = () => {
    setModalError(null);
    setIsAddModalOpen(true);
  };
  
  const handleEditUser = (user: any) => {
    setModalError(null);
    setCurrentUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleViewUser = (user: any) => {
    navigate(`/ml-admin/dashboard/users/${user.id}`);
  };
  
  const handleDeleteClick = (user: any) => {
    setModalError(null);
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };
  
  // 🎯 CRUD OPERATIONS - Usando servicios modulares
  const handleAddSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const userData: UserCreateRequest = {
        email: data.email,
        username: data.username || data.email.split('@')[0],
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password || 'TemporalPassword123',
        roleId: data.roleId,
        areaId: data.areaId
      };
      
      const newUser = await userEditService.createUser(userData);
      
      // Asignar rol si se especificó
      if (data.roleId && data.areaId) {
        await userEditService.assignRole(newUser.id, data.roleId, data.areaId);
      }
      
      setIsAddModalOpen(false);
      await refresh(); // Refrescar la lista
      
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setModalError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: UserFormData) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setModalError(null);

    try {
      // Preparar datos de actualización
      const updateData: any = {};
      
      if (data.firstName !== currentUser.firstName) updateData.firstName = data.firstName;
      if (data.lastName !== currentUser.lastName) updateData.lastName = data.lastName;
      if (data.email !== currentUser.email) updateData.email = data.email;
      if (data.isActive !== currentUser.isActive) updateData.isActive = data.isActive;
      
      // Actualizar datos básicos si hay cambios
      if (Object.keys(updateData).length > 0) {
        await userEditService.updateUser(currentUser.id, updateData);
      }
      
      // Actualizar rol si cambió
      if (data.roleId && data.areaId && roles && areas) {
        const currentRoleId = roles.find(r => currentUser.roles?.includes(r.name))?.id;
        const currentAreaId = areas.find((area: any) => currentUser.areas?.some((userArea: any) => userArea.name === area.name))?.id;
        
        if (parseInt(data.roleId) !== currentRoleId || parseInt(data.areaId) !== currentAreaId) {
          await userEditService.assignRole(currentUser.id, data.roleId, data.areaId);
        }
      }
      
      setIsEditModalOpen(false);
      setCurrentUser(null);
      await refresh(); // Refrescar la lista
      
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setModalError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await userEditService.deleteUser(currentUser.id);
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
      await refresh(); // Refrescar la lista
      
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setModalError(error instanceof Error ? error.message : 'Error al eliminar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 🎯 FORMATEO DE FECHA SIMPLIFICADO
  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === '-') return '-';
    
    try {
      return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // 🎯 COLUMNAS DE TABLA OPTIMIZADAS
  const columns = [
    {
      header: 'Usuario',
      accessor: (user: any) => (
        <div className="flex items-center gap-3">
          <UserProfilePhoto 
            user={user}
            size="md"
            clickable={true}
            onClick={() => handleViewUser(user)}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--color-text-main)] truncate">
              {user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.email}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] truncate">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Rol',
      accessor: (user: any) => (
        <div className="flex flex-wrap gap-1">
          {user.roles && user.roles.length > 0 ? (
            user.roles.slice(0, 2).map((role: string, index: number) => (
              <Badge key={index} variant="primary" className="text-xs">
                {role}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary" className="text-xs">Sin rol</Badge>
          )}
          {user.roles && user.roles.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{user.roles.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      header: 'Área',
      accessor: (user: any) => (
        <div className="text-sm text-[var(--color-text-main)]">
          {user.areas && user.areas.length > 0 
            ? user.areas.map((area: any) => area.name).join(', ')
            : 'Sin área'
          }
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: (user: any) => (
        <Badge variant={user.isActive ? "success" : "danger"}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      header: 'Último acceso',
      accessor: (user: any) => (
        <div className="text-sm text-[var(--color-text-secondary)]">
          {formatDate(user.lastLogin || user.last_login)}
        </div>
      )
    }
  ];
  
  // 🎯 RENDER PRINCIPAL
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-6 w-6 text-[var(--color-accent-1)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Usuarios</h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">Gestiona los usuarios del sistema</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
            <div className="text-2xl font-bold text-[var(--color-text-main)]">{stats.total}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Total usuarios</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Usuarios activos</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Usuarios inactivos</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.withRoles}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Con roles asignados</div>
          </div>
        </div>
        
        {/* Panel de filtros */}
        <DashboardCard>
          <div className="space-y-4">
            {/* Búsqueda y botón agregar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    className="w-full px-4 py-2 pl-10 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent-1)] focus:border-[var(--color-accent-1)] transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  </div>
                </div>
              </div>
              
              <DashboardButton
                onClick={handleAddUser}
                leftIcon={<PlusIcon className="w-5 h-5" />}
              >
                Agregar Usuario
              </DashboardButton>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <select
                  className="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent-1)] focus:border-[var(--color-accent-1)] bg-white transition-colors"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">Todos los roles</option>
                  {roleFilterOptions.filter(role => role !== 'all').map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                
                <select
                  className="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent-1)] focus:border-[var(--color-accent-1)] bg-white transition-colors"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                </select>
              </div>
              
              {/* Contador */}
              <div className="flex items-center text-sm text-[var(--color-text-secondary)]">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </div>
            </div>
          </div>
        </DashboardCard>
        
        {/* Manejo de errores */}
        {error && (
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="los usuarios"
          />
        )}
        
        {/* Tabla */}
        <DashboardCard>
          <DashboardDataTable
            columns={columns}
            data={filteredUsers}
            keyExtractor={(user) => user.id.toString()}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteClick}
            actionColumn={true}
            emptyMessage={
              isLoading ? "Cargando usuarios..." : 
              searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                ? "No se encontraron usuarios con los filtros aplicados" 
                : "No hay usuarios registrados"
            }
            isLoading={isLoading}
          />
        </DashboardCard>
      </div>
      
      {/* Modal agregar */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Usuario"
        size="lg"
        error={modalError}
      >
        <UserForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
          roles={transformedRoles}
          areas={transformedAreas}
        />
      </DashboardModal>

      {/* Modal editar */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentUser(null);
        }}
        title="Editar Usuario"
        size="lg"
        error={modalError}
      >
        {currentUser && (
          <UserForm
            initialData={{
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              email: currentUser.email,
              roleId: roles?.find(r => currentUser.roles?.includes(r.name))?.id?.toString() || '',
              areaId: areas?.find((area: any) => currentUser.areas?.some((userArea: any) => userArea.name === area.name))?.id?.toString() || '',
              isActive: currentUser.isActive
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentUser(null);
            }}
            isSubmitting={isSubmitting}
            roles={transformedRoles}
            areas={transformedAreas}
            isEditMode={true}
          />
        )}
      </DashboardModal>

      {/* Modal eliminar */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentUser(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
      >
        <div className="py-3">
          <div className="flex items-center gap-4 mb-4">
            {currentUser && (
              <UserProfilePhoto 
                user={currentUser}
                size="lg"
              />
            )}
            <div>
              <p className="text-[var(--color-text-main)] font-medium">
                {currentUser?.fullName || `${currentUser?.firstName} ${currentUser?.lastName}`.trim()}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {currentUser?.email}
              </p>
            </div>
          </div>
          
          <p className="text-[var(--color-text-main)]">
            ¿Estás seguro de que deseas eliminar este usuario?
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">
            Esta acción no se puede deshacer y se perderán todos los datos asociados.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setCurrentUser(null);
            }}
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteUser}
            loading={isSubmitting}
          >
            Eliminar Usuario
          </DashboardButton>
        </div>
      </DashboardModal>
    </DashboardLayout>
  );
};

export default UsersPage;