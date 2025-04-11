// src/features/dashboard/pages/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import DashboardButton from '../components/ui/DashboardButton';
import { CalendarDaysIcon, BriefcaseIcon, EnvelopeIcon, PhoneIcon, UserCircleIcon, CakeIcon, MapPinIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

// Importar imágenes
import heroBanner from '../../../assets/images/medialab-hero.jpg';
import defaultUserImage from '../../../assets/images/user.jpg';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  area: string;
  isActive: boolean;
  joinDate: string;
  lastLogin: string;
  profileImage?: string;
  birthday?: string;
  phone?: string;
  location?: string;
  recentActivity?: {
    date: string;
    action: string;
  }[];
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Simulamos una carga de datos
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      
      // En un caso real, aquí harías una petición a tu API
      setTimeout(() => {
        if (userId === '1') {
          setUser({
            id: '1',
            name: 'Pablo Lacan',
            email: 'placan@medialab.com',
            role: 'Super Admin',
            area: 'Producción Audiovisual',
            isActive: true,
            joinDate: '2023-01-15',
            lastLogin: '2025-04-10T08:30:00',
            birthday: '1988-05-15',
            phone: '+502 5555-1234',
            location: 'Ciudad de Guatemala',
            recentActivity: [
              { date: '2025-04-10T08:30:00', action: 'Inició sesión en el sistema' },
              { date: '2025-04-09T16:45:00', action: 'Actualizó la configuración del sistema' },
              { date: '2025-04-08T14:20:00', action: 'Creó un nuevo usuario' }
            ]
          });
        } else if (userId === '2') {
          setUser({
            id: '2',
            name: 'Christian Kohler',
            email: 'ckohler@medialab.com',
            role: 'Admin',
            area: 'Desarrollo Web',
            isActive: true,
            joinDate: '2023-03-20',
            lastLogin: '2025-04-09T14:15:00',
            birthday: '1990-03-28',
            phone: '+502 5555-6789',
            location: 'Ciudad de Guatemala',
            recentActivity: [
              { date: '2025-04-09T14:15:00', action: 'Inició sesión en el sistema' },
              { date: '2025-04-08T11:30:00', action: 'Actualizó la información de un curso' },
              { date: '2025-04-07T09:15:00', action: 'Creó un nuevo curso' }
            ]
          });
        } else {
          // Usuario no encontrado
          navigate('/dashboard/users');
        }
        
        setIsLoading(false);
      }, 800);
    };
    
    fetchUser();
  }, [userId, navigate]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900">Usuario no encontrado</h2>
          <p className="mt-2 text-gray-600">El usuario que buscas no existe.</p>
          <DashboardButton 
            className="mt-4"
            onClick={() => navigate('/dashboard/users')}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            Volver a la lista de usuarios
          </DashboardButton>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-4 flex justify-between items-center">
        <DashboardButton
          variant="outline"
          onClick={() => navigate('/dashboard/users')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
        >
          Volver a la lista
        </DashboardButton>
        
        <DashboardButton
          onClick={() => navigate(`/dashboard/users/edit/${user.id}`)}
          leftIcon={<PencilIcon className="h-5 w-5" />}
        >
          Editar perfil
        </DashboardButton>
      </div>
      
      {/* Banner y foto de perfil */}
      <div className="relative mb-8">
        <div className="h-48 w-full overflow-hidden rounded-t-xl">
          <img
            src={heroBanner}
            alt="Perfil banner"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute bottom-0 left-8 transform translate-y-1/2 bg-white p-1 rounded-full shadow-lg">
          <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white">
            <img 
              src={user.profileImage || defaultUserImage}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del perfil */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Área</p>
                    <p className="text-base text-gray-900">{user.area}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Fecha de ingreso</p>
                    <p className="text-base text-gray-900">{formatDate(user.joinDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-base text-gray-900">{user.phone || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CakeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Fecha de nacimiento</p>
                    <p className="text-base text-gray-900">{formatDate(user.birthday || '')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Ubicación</p>
                    <p className="text-base text-gray-900">{user.location || '-'}</p>
                  </div>
                </div>
              </div>
            </DashboardCard>
            
            {/* Actividad reciente */}
            <DashboardCard
              title="Actividad reciente"
              subtitle="Últimas acciones realizadas por el usuario"
            >
              {user.recentActivity && user.recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {user.recentActivity.map((activity, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== user.recentActivity!.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircleIcon className="h-5 w-5 text-gray-500" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {activity.action}
                                </p>
                              </div>
                              <div className="text-sm text-gray-500 whitespace-nowrap">
                                {formatDateTime(activity.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
              )}
            </DashboardCard>
          </div>
          
          {/* Información adicional */}
          <div className="lg:col-span-1 space-y-6">
            <DashboardCard
              title="Información de usuario"
              subtitle="Detalles del perfil"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Último acceso</p>
                  <p className="text-base text-gray-900">{formatDateTime(user.lastLogin)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Rol</p>
                  <p className="text-base text-gray-900">{user.role}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <p className="text-base text-gray-900">{user.isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">ID de usuario</p>
                  <p className="text-base text-gray-900">{user.id}</p>
                </div>
              </div>
            </DashboardCard>
            
            <DashboardCard
              title="Acciones"
              subtitle="Acciones disponibles para este usuario"
            >
              <div className="space-y-3">
                <DashboardButton
                  variant="outline"
                  fullWidth
                >
                  Restablecer contraseña
                </DashboardButton>
                
                <DashboardButton
                  variant={user.isActive ? 'danger' : 'primary'}
                  fullWidth
                >
                  {user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                </DashboardButton>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfilePage;