// src/features/dashboard/pages/UsersPage.tsx - 🎯 VERSIÓN COMPLETAMENTE LIMPIA
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

import { useUserList } from '../../../services/users/hooks/useUserService';
import { useEnsuredSystemData } from '../../../context/AppDataContext';
import { userEditService } from '../../../services/users';
import { UserCreateRequest } from '../../../services/users/types/requests.types';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 🎯 HOOKS OPTIMIZADOS
  const { users, isLoading, error, refresh } = useUserList({ 
    formatType: 'with_roles',
    limit: 1000 
  });
  
  const { roles, areas } = useEnsuredSystemData(['roles', 'areas']);
  
  // Estados locales
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
  
  // 🔧 DEBUG: Log de datos para entender la estructura
  React.useEffect(() => {
    if (users.length > 0) {
      console.log('🔍 DEBUG - Primer usuario recibido:', users[0]);
      console.log('🔍 DEBUG - Campos disponibles:', Object.keys(users[0]));
      console.log('🔍 DEBUG - isActive valor:', users[0].isActive);
    }
  }, [users]);

  // 🎯 TRANSFORMAR DATOS PARA UserForm
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
  
  // 🔧 FUNCIONES HELPER SIMPLIFICADAS Y TIPADAS
  const getUserActiveStatus = (user: any): boolean => {
    if (user.isActive !== undefined) return user.isActive;
    if ((user as any).is_active !== undefined) return (user as any).is_active;
    return true; // Por defecto activo
  };

  const getUserFullName = (user: any): string => {
    if (user.fullName) return user.fullName;
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || lastName || user.email?.split('@')[0] || 'Usuario';
  };

  // ⭐ FUNCIÓN QUE SIEMPRE DEVUELVE string[]
  const getUserRoles = (user: any): string[] => {
    if (!user.roles || !Array.isArray(user.roles)) return [];
    return user.roles.map((role: any) => 
      typeof role === 'string' ? role : (role?.name || '')
    ).filter((role: string) => role.length > 0);
  };

  // ⭐ FUNCIÓN QUE SIEMPRE DEVUELVE string[]
  const getUserAreas = (user: any): string[] => {
    if (!user.areas || !Array.isArray(user.areas)) return [];
    return user.areas.map((area: any) => 
      typeof area === 'string' ? area : (area?.name || '')
    ).filter((area: string) => area.length > 0);
  };
  
  // 🎯 FILTRADO OPTIMIZADO con tipos explícitos
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = getUserFullName(user);
      const userRoles: string[] = getUserRoles(user);
      const isActive = getUserActiveStatus(user);
      
      const matchesSearch = 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || 
        userRoles.some((role: string) => role.includes(filterRole));
        
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && isActive) ||
        (filterStatus === 'inactive' && !isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);
  
  // 🎯 ESTADÍSTICAS COMPUTADAS
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => getUserActiveStatus(u)).length,
    inactive: users.filter(u => !getUserActiveStatus(u)).length,
    withRoles: users.filter(u => getUserRoles(u).length > 0).length
  }), [users]);
  
  // 🎯 OPCIONES DE FILTRO DINÁMICAS con tipos explícitos
  const roleFilterOptions = useMemo(() => {
    const allRoles = new Set<string>();
    users.forEach(user => {
      const userRoles: string[] = getUserRoles(user);
      userRoles.forEach((role: string) => {
        if (role) allRoles.add(role);
      });
    });
    return ['all', ...Array.from(allRoles)];
  }, [users]);
  
  // 🎯 HANDLERS
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
    console.log('🔍 Navegando a perfil del usuario:', user.id);
    navigate(`/ml-admin/dashboard/users/${user.id}`);
  };
  
  const handleDeleteClick = (user: any) => {
    setModalError(null);
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };
  
  // 🎯 CRUD OPERATIONS
  const handleAddSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      if (!data.email?.trim() || !data.firstName?.trim() || !data.lastName?.trim()) {
        throw new Error('Email, nombre y apellido son requeridos');
      }
      
      const userData: UserCreateRequest = {
        email: data.email.trim(),
        username: data.username?.trim() || data.email.split('@')[0],
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        password: data.password?.trim() || `Temp${Math.random().toString(36).slice(-8)}!`,
        ...(data.roleId && data.areaId && {
          roleId: data.roleId,
          areaId: data.areaId
        })
      };
      
      const newUser = await userEditService.createUser(userData);
      
      if (data.roleId && data.areaId) {
        try {
          await userEditService.assignRole(newUser.id, data.roleId, data.areaId);
        } catch (roleError) {
          console.warn('⚠️ Error asignando rol:', roleError);
        }
      }
      
      setIsAddModalOpen(false);
      await refresh();
      
    } catch (err) {
      console.error('💥 Error al crear usuario:', err);
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
      const updateData: any = {};
      
      const currentFullName = getUserFullName(currentUser);
      const [currentFirstName, currentLastName] = currentFullName.split(' ');
      
      if (data.firstName !== currentFirstName) updateData.firstName = data.firstName;
      if (data.lastName !== currentLastName) updateData.lastName = data.lastName;
      if (data.email !== currentUser.email) updateData.email = data.email;
      if (data.isActive !== getUserActiveStatus(currentUser)) updateData.isActive = data.isActive;
      
      if (Object.keys(updateData).length > 0) {
        await userEditService.updateUser(currentUser.id, updateData);
      }
      
      if (data.roleId && data.areaId && roles) {
        const currentRoles = getUserRoles(currentUser);
        const currentRoleId = roles.find(r => currentRoles.includes(r.name))?.id;
        
        if (parseInt(data.roleId) !== currentRoleId) {
          await userEditService.assignRole(currentUser.id, data.roleId, data.areaId);
        }
      }
      
      setIsEditModalOpen(false);
      setCurrentUser(null);
      await refresh();
      
    } catch (err) {
      console.error('💥 Error al actualizar usuario:', err);
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
      await refresh();
      
    } catch (error) {
      console.error('💥 Error al eliminar usuario:', error);
      setModalError(error instanceof Error ? error.message : 'Error al eliminar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 🎯 FORMATEO DE FECHA
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
  
  // 🎯 COLUMNAS DE TABLA con tipos explícitos
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
              {getUserFullName(user)}
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
      accessor: (user: any) => {
        const userRoles: string[] = getUserRoles(user);
        return (
          <div className="flex flex-wrap gap-1">
            {userRoles.length > 0 ? (
              userRoles.slice(0, 2).map((role: string, index: number) => (
                <Badge key={index} variant="primary" className="text-xs">
                  {role}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">Sin rol</Badge>
            )}
            {userRoles.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{userRoles.length - 2}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      header: 'Área',
      accessor: (user: any) => {
        const userAreas: string[] = getUserAreas(user);
        return (
          <div className="text-sm text-[var(--color-text-main)]">
            {userAreas.length > 0 ? userAreas.join(', ') : 'Sin área'}
          </div>
        );
      }
    },
    {
      header: 'Estado',
      accessor: (user: any) => {
        const isActive = getUserActiveStatus(user);
        return (
          <Badge variant={isActive ? "success" : "danger"}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      }
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
      
      {/* Modales */}
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
              firstName: getUserFullName(currentUser).split(' ')[0] || '',
              lastName: getUserFullName(currentUser).split(' ')[1] || '',
              email: currentUser.email,
              roleId: roles?.find(r => getUserRoles(currentUser).includes(r.name))?.id?.toString() || '',
              areaId: areas?.find((area: any) => getUserAreas(currentUser).includes(area.name))?.id?.toString() || '',
              isActive: getUserActiveStatus(currentUser)
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
                {currentUser && getUserFullName(currentUser)}
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