// src/features/dashboard/pages/UsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardDataTable from '../components/ui/DashboardDataTable';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import DashboardCard from '../components/ui/DashboardCard';
import UserForm, { UserFormData } from '../components/users/UserForm';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  
  // Estado para carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
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

  const getFullImageUrl = (imagePath: string | undefined | null): string => {
    if (!imagePath) return '';
    
    // Si la ruta ya comienza con http:// o https://, asumimos que es una URL completa
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Obtener la URL base del API
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.replace('/api/v1', '');
    // Asegurarnos de que la ruta de la imagen comience con /
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${path}`;
  };

  // Manejadores para CRUD de usuarios
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditUser = (user: LocalUser) => {
    setCurrentUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleViewUser = (user: LocalUser) => {
    // Navegar al perfil del usuario
    navigate(`/dashboard/users/${user.id}`);
  };
  
  const handleDeleteClick = (user: LocalUser) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      // Llamar a la API para eliminar el usuario
      await userService.deleteUser(parseInt(currentUser.id));
      
      // Actualizar la lista local de usuarios
      setUsers(users.filter(user => user.id !== currentUser.id));
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Preparar los datos para la API
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
      
      console.log('Enviando datos para crear usuario:', userData);
      
      // Crear el usuario
      const newApiUser = await userService.createUser(userData);
      console.log('Usuario creado:', newApiUser);
      
      // Asignar rol si se proporcionaron roleId y areaId
      if (data.roleId && data.areaId) {
        try {
          console.log(`Asignando rol ${data.roleId} y área ${data.areaId} al usuario ${newApiUser.id}`);
          await userService.assignRole(newApiUser.id, data.roleId, data.areaId);
          console.log("Rol asignado exitosamente");
          
          // Recargar todos los usuarios para obtener la información actualizada
          await loadInitialData();
        } catch (roleError) {
          console.error('Error al asignar rol:', roleError);
        }
      } else {
        // Si no hay rol que asignar, solo actualizar la lista con el nuevo usuario
        const newLocalUser: LocalUser = {
          id: newApiUser.id.toString(),
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.email,
          role: 'Sin rol',
          area: 'Sin área',
          isActive: true,
          lastLogin: '-'
        };
        
        setUsers(prevUsers => [...prevUsers, newLocalUser]);
      }
      
      // Cerrar el modal después de todo el proceso
      setIsAddModalOpen(false);
      
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: UserFormData) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Preparar los datos para la API usando snake_case para el backend
      const userData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email
      };
      
      // Llamar a la API para actualizar el usuario
      const updatedApiUser = await userService.updateUser(parseInt(currentUser.id), userData);
      
      // Si se proporcionaron roleId y areaId y son diferentes a los actuales, actualizar rol
      if (data.roleId && data.areaId) {
        const currentRoleId = roles.find(r => r.name === currentUser.role)?.id;
        const currentAreaId = areas.find(a => a.name === currentUser.area)?.id;
        
        if (data.roleId !== currentRoleId || data.areaId !== currentAreaId) {
          try {
            console.log(`Actualizando rol a ${data.roleId} y área a ${data.areaId} para usuario ${currentUser.id}`);
            await userService.assignRole(updatedApiUser.id, data.roleId, data.areaId);
          } catch (roleError) {
            console.error('Error al actualizar rol:', roleError);
            // Continuamos aunque falle la actualización de rol
          }
        }
      }
      
      // Encontrar los nombres del rol y área según sus IDs
      const roleName = roles.find(r => r.id === data.roleId)?.name || currentUser.role;
      const areaName = areas.find(a => a.id === data.areaId)?.name || currentUser.area;
      
      // Actualizar el usuario en la lista local
      setUsers(users.map(user => 
        user.id === currentUser.id 
          ? {
              ...user,
              fullName: `${data.firstName} ${data.lastName}`,
              email: data.email,
              role: roleName,
              area: areaName,
              isActive: updatedApiUser.isActive || updatedApiUser.is_active || user.isActive
            }
          : user
      ));
      
      setIsEditModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Formatear fecha para mostrar en un formato legible
  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
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
  
  // Filtrar usuarios según términos de búsqueda y filtros seleccionados
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });
  
  // Determinar las opciones de filtrado para roles
  const roleFilterOptions = ['all', ...new Set(users.map(user => user.role))].filter(Boolean);
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Nombre',
      accessor: (user: LocalUser) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.profileImage ? (
              <img 
                src={getFullImageUrl(user.profileImage)} 
                alt={user.fullName} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Si la imagen falla, mostrar las iniciales
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const initials = user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
                    parent.innerHTML = `<span class="text-gray-600 font-medium">${initials}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Área',
      accessor: (user: LocalUser) => (
        <span className="text-sm text-gray-900">{user.area}</span>
      )
    },
    {
      header: 'Rol',
      accessor: (user: LocalUser) => (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {user.role}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: (user: LocalUser) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Último acceso',
      accessor: (user: LocalUser) => formatDate(user.lastLogin)
    }
  ];
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <p className="text-gray-600">Gestiona los usuarios del sistema</p>
      </div>
      
      {/* Panel de filtros y acciones */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
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
          
          {roleFilterOptions.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Todos los roles</option>
                {roleFilterOptions.filter(role => role !== 'all').map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </DashboardCard>
      
      {/* Usar el componente ApiErrorHandler */}
      <ApiErrorHandler 
        error={error} 
        onRetry={loadInitialData} 
        resourceName="los usuarios"
      />
      
      {/* Tabla de usuarios */}
      <DashboardDataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteClick}
        actionColumn={true}
        emptyMessage={isLoading ? "Cargando usuarios..." : "No se encontraron usuarios"}
        isLoading={isLoading}
      />
      
      {/* Modal para agregar usuario */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Usuario"
        size="lg"
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
      >
        {currentUser && (
          <UserForm
            initialData={{
              // Separar el nombre completo en nombre y apellidos
              firstName: currentUser.fullName.split(' ')[0] || '',
              lastName: currentUser.fullName.split(' ').slice(1).join(' ') || '',
              email: currentUser.email,
              // Encontrar los IDs correspondientes
              roleId: roles.find(r => r.name === currentUser.role)?.id || '',
              areaId: areas.find(a => a.name === currentUser.area)?.id || ''
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
      
      {/* Modal para confirmar eliminación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentUser(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar al usuario <span className="font-medium">{currentUser?.fullName}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
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
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </DashboardLayout>
  );
};

export default UsersPage;