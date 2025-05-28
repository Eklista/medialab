// src/features/dashboard/pages/UsersPage.tsx (actualizado)

import React, { useState, useEffect } from 'react';
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
import { userService } from '../../../services';
import { Role, Area } from '../../../services/users.service';

// Definimos una interfaz para nuestro modelo de usuario local
interface LocalUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  area: string;
  isActive: boolean;
  lastLogin: string;
  profileImage?: string;
  firstName: string;
  lastName: string;
}

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estado para usuarios
  const [users, setUsers] = useState<LocalUser[]>([]);
  
  // Estado para roles y áreas
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalError, setModalError] = useState<string | null>(null);
  
  // Estado para carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Función para cargar los datos iniciales
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar usuarios, roles y áreas en paralelo con mejor manejo de errores
      const [apiUsers, apiRoles, apiAreas] = await Promise.all([
        userService.getUsers().catch(err => {
          console.error('Error al obtener usuarios:', err);
          throw new Error(`No se pudieron cargar los usuarios: ${err.message}`);
        }),
        userService.getRoles().catch(err => {
          console.error('Error al obtener roles:', err);
          throw new Error(`No se pudieron cargar los roles: ${err.message}`);
        }),
        userService.getAreas().catch(err => {
          console.error('Error al obtener áreas:', err);
          throw new Error(`No se pudieron cargar las áreas: ${err.message}`);
        })
      ]);
      
      // Guardar roles y áreas
      setRoles(apiRoles);
      setAreas(apiAreas);
      
      // Convertir los usuarios de la API al formato local
      const transformedUsers: LocalUser[] = apiUsers.map(apiUser => {
        // Obtener los nombres de los roles del usuario
        let roleNames: string[] = [];
        if (apiUser.roles && Array.isArray(apiUser.roles)) {
          roleNames = apiUser.roles;
        }
        let roleName = roleNames.join(', ');
        if (!roleName) roleName = 'Sin rol asignado';
        
        // Obtener el nombre del área del usuario
        let areaName = 'Sin área asignada';
        if (apiUser.areas && Array.isArray(apiUser.areas) && apiUser.areas.length > 0) {
          // Tomar la primera área (normalmente un usuario está asignado a una sola área con un rol)
          areaName = apiUser.areas.map(area => area.name).join(', ');
        }
        
        // Asegurarnos que firstName y lastName existen
        const firstName = apiUser.firstName || apiUser.first_name || '';
        const lastName = apiUser.lastName || apiUser.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        return {
          id: apiUser.id.toString(),
          fullName: fullName || 'Usuario sin nombre',
          firstName: firstName,
          lastName: lastName,
          email: apiUser.email || 'Sin email',
          role: roleName,
          area: areaName,
          isActive: !!apiUser.isActive || !!apiUser.is_active,
          lastLogin: apiUser.lastLogin || apiUser.last_login || '-',
          profileImage: apiUser.profileImage || apiUser.profile_image
        };
      });
      
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejadores para CRUD de usuarios
  const handleAddUser = () => {
    setModalError(null);
    setIsAddModalOpen(true);
  };
  
  const handleEditUser = (user: LocalUser) => {
    setModalError(null);
    setCurrentUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleViewUser = (user: LocalUser) => {
    // Navegar al perfil del usuario
    navigate(`/dashboard/users/${user.id}`);
  };
  
  const handleDeleteClick = (user: LocalUser) => {
    setModalError(null);
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await userService.deleteUser(parseInt(currentUser.id));
      setUsers(users.filter(user => user.id !== currentUser.id));
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setModalError(error instanceof Error ? error.message : 'Error al eliminar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const userData = {
        email: data.email,
        username: data.username || data.email.split('@')[0],
        password: data.password || 'TemporalPassword123',
        firstName: data.firstName,
        lastName: data.lastName,
        join_date: new Date().toISOString().split('T')[0],
        roleId: data.roleId,
        areaId: data.areaId
      };
      
      const newApiUser = await userService.createUser(userData);
      setIsAddModalOpen(false);
      
      setTimeout(async () => {
        try {
          if (data.roleId && data.areaId) {
            await userService.assignRole(newApiUser.id, data.roleId, data.areaId);
          }
          setTimeout(() => {
            loadInitialData();
          }, 100);
        } catch (innerError) {
          console.error('Error en operaciones post-creación:', innerError);
        }
      }, 200);
      
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setModalError(err instanceof Error ? err.message : 'Error al crear usuario');
      setIsSubmitting(false);
    }
    
    setTimeout(() => {
      setIsSubmitting(false);
    }, 300);
  };

  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    
    try {
      const date = new Date(dateString);
      const guatemalaDate = new Date(date.getTime() - (6 * 60 * 60 * 1000));
      
      return guatemalaDate.toLocaleDateString('es-GT', {
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
  
  const handleEditSubmit = async (data: UserFormData) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setModalError(null);

    try {
      const userData: UserUpdateData = {};
      
      const currentFirstName = currentUser.firstName || '';
      const currentLastName = currentUser.lastName || '';
      
      if (data.firstName !== currentFirstName) userData.firstName = data.firstName;
      if (data.lastName !== currentLastName) userData.lastName = data.lastName;
      if (data.email !== currentUser.email) userData.email = data.email;
      if (data.isActive !== currentUser.isActive) userData.isActive = data.isActive;
      
      if (Object.keys(userData).length > 0) {
        await userService.updateUser(parseInt(currentUser.id), userData);
      }
      
      if (data.roleId && data.areaId) {
        const currentRoleId = roles.find(r => r.name === currentUser.role)?.id;
        const currentAreaId = areas.find(a => a.name === currentUser.area)?.id;
        
        if (data.roleId !== currentRoleId || data.areaId !== currentAreaId) {
          try {
            await userService.assignRole(parseInt(currentUser.id), data.roleId, data.areaId);
          } catch (roleError) {
            console.error('Error al actualizar rol:', roleError);
          }
        }
      }
      
      const roleName = roles.find(r => r.id === data.roleId)?.name || currentUser.role;
      const areaName = areas.find(a => a.id === data.areaId)?.name || currentUser.area;
      
      setUsers(users.map(user => 
        user.id === currentUser.id 
          ? {
              ...user,
              fullName: `${data.firstName} ${data.lastName}`,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              role: roleName,
              area: areaName,
              isActive: data.isActive !== undefined ? data.isActive : user.isActive
            }
          : user
      ));
      
      setIsEditModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setModalError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filtrar usuarios según términos de búsqueda y filtros seleccionados
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Determinar las opciones de filtrado
  const roleFilterOptions = ['all', ...new Set(users.map(user => user.role))].filter(Boolean);
  
  // Estadísticas rápidas
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    withRoles: users.filter(u => u.role !== 'Sin rol asignado').length
  };
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Usuario',
      accessor: (user: LocalUser) => (
        <div className="flex items-center gap-3">
          <UserProfilePhoto 
            user={{
              id: parseInt(user.id),
              firstName: user.firstName,
              lastName: user.lastName,
              profileImage: user.profileImage
            }}
            size="md"
            clickable={true}
            onClick={() => handleViewUser(user)}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--color-text-main)] truncate">
              {user.fullName}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] truncate">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Área',
      accessor: (user: LocalUser) => (
        <div className="text-sm text-[var(--color-text-main)]">
          {user.area}
        </div>
      )
    },
    {
      header: 'Rol',
      accessor: (user: LocalUser) => (
        <Badge variant="primary">
          {user.role}
        </Badge>
      )
    },
    {
      header: 'Estado',
      accessor: (user: LocalUser) => (
        <Badge variant={user.isActive ? "success" : "danger"}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      header: 'Último acceso',
      accessor: (user: LocalUser) => (
        <div className="text-sm text-[var(--color-text-secondary)]">
          {formatDate(user.lastLogin)}
        </div>
      )
    }
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-6 w-6 text-[var(--color-accent-1)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Usuarios</h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">Gestiona los usuarios del sistema</p>
        </div>

        {/* Estadísticas rápidas */}
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
        
        {/* Panel de filtros y acciones */}
        <DashboardCard>
          <div className="space-y-4">
            {/* Primera fila: Búsqueda y botón agregar */}
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
            
            {/* Segunda fila: Filtros */}
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
              
              {/* Contador de resultados */}
              <div className="flex items-center text-sm text-[var(--color-text-secondary)]">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </div>
            </div>
          </div>
        </DashboardCard>
        
        {/* Manejo de errores */}
        <ApiErrorHandler 
          error={error} 
          onRetry={loadInitialData} 
          resourceName="los usuarios"
        />
        
        {/* Tabla de usuarios */}
        <DashboardCard>
          <DashboardDataTable
            columns={columns}
            data={filteredUsers}
            keyExtractor={(user) => user.id}
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
      
      {/* Modal para agregar usuario */}
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
          roles={roles}
          areas={areas}
        />
      </DashboardModal>

      {/* Modal para editar usuario */}
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
              roleId: roles.find(r => r.name === currentUser.role)?.id || '',
              areaId: areas.find(a => a.name === currentUser.area)?.id || '',
              isActive: currentUser.isActive
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentUser(null);
            }}
            isSubmitting={isSubmitting}
            roles={roles}
            areas={areas}
            isEditMode={true}
          />
        )}
      </DashboardModal>

      {/* Modal para eliminar usuario */}
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
                user={{
                  id: parseInt(currentUser.id),
                  firstName: currentUser.firstName,
                  lastName: currentUser.lastName,
                  profileImage: currentUser.profileImage
                }}
                size="lg"
              />
            )}
            <div>
              <p className="text-[var(--color-text-main)] font-medium">
                {currentUser?.fullName}
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