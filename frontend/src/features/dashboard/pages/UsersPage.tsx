// src/features/dashboard/pages/UsersPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardDataTable from '../components/ui/DashboardDataTable';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import DashboardCard from '../components/ui/DashboardCard';
import UserForm, { UserFormData } from '../components/users/UserForm';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Definición de tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  area: string;
  isActive: boolean;
  joinDate: string;
  lastLogin: string;
  profileImage?: string;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estado para los usuarios
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Pablo Lacan',
      email: 'placan@medialab.com',
      role: 'Super Admin',
      area: 'Producción Audiovisual',
      isActive: true,
      joinDate: '2023-01-15',
      lastLogin: '2025-04-10T08:30:00'
    },
    {
      id: '2',
      name: 'Christian Kohler',
      email: 'ckohler@medialab.com',
      role: 'Admin',
      area: 'Desarrollo Web',
      isActive: true,
      joinDate: '2023-03-20',
      lastLogin: '2025-04-09T14:15:00'
    }
  ]);

  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  
  // Funciones de manejo
  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleViewUser = (user: User) => {
    // Navegar al perfil del usuario
    navigate(`/dashboard/users/${user.id}`);
  };
  
  const handleDeleteClick = (user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteUser = () => {
    if (currentUser) {
      // Aquí iría la lógica de eliminación
      setUsers(users.filter(user => user.id !== currentUser.id));
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
    }
  };
  
  const handleAddSubmit = (data: UserFormData) => {
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      const newUser: User = {
        id: Date.now().toString(),
        ...data,
        isActive: true,
        lastLogin: '-'
      };
      
      setUsers([...users, newUser]);
      setIsAddModalOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const handleEditSubmit = (data: UserFormData) => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      setUsers(users.map(user => 
        user.id === currentUser.id
          ? { ...user, ...data }
          : user
      ));
      
      setIsEditModalOpen(false);
      setCurrentUser(null);
      setIsSubmitting(false);
    }, 500);
  };
  
  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatJoinDate = (dateString: string) => {
    if (dateString === '-') return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Obtener lista única de áreas para el filtro
  const areaOptions = ['all', ...new Set(users.map(user => user.area))];
  
  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesArea = filterArea === 'all' || user.area === filterArea;
    
    return matchesSearch && matchesRole && matchesArea;
  });
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Nombre',
      accessor: (user: User) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-600 font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Área',
      accessor: (user: User) => (
        <span className="text-sm text-gray-900">{user.area}</span>
      )
    },
    {
      header: 'Rol',
      accessor: (user: User) => (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {user.role}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: (user: User) => (
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
      accessor: (user: User) => formatDate(user.lastLogin)
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
          
          <div className="flex flex-wrap gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Visualizador</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="all">Todas las áreas</option>
              {areaOptions.filter(area => area !== 'all').map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </DashboardCard>
      
      {/* Tabla de usuarios */}
      <DashboardDataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteClick}
        actionColumn={true}
        emptyMessage="No se encontraron usuarios"
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
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              area: currentUser.area,
              joinDate: currentUser.joinDate
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentUser(null);
            }}
            isSubmitting={isSubmitting}
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
            ¿Estás seguro de que deseas eliminar al usuario <span className="font-medium">{currentUser?.name}</span>?
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
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </DashboardLayout>
  );
};

export default UsersPage;