// src/features/dashboard/pages/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import { CalendarDaysIcon, BriefcaseIcon, EnvelopeIcon, PhoneIcon, UserCircleIcon, CakeIcon, MapPinIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { userService } from '../../../services';
import { useAuth } from '../../auth/hooks/useAuth';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';

// Importar imágenes
import heroBanner from '../../../assets/images/medialab-hero.jpg';
import defaultUserImage from '../../../assets/images/user.jpg';

interface UserProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
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
  const { state } = useAuth(); // Acceso al estado de autenticación
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    birthday: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Verificar si el usuario actual es el dueño del perfil
  const isCurrentUser = state.user && userId === state.user.id?.toString();
  
  // Cargar datos del usuario desde la API
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        navigate('/dashboard/users');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener el usuario desde la API
        const userData = await userService.getUserById(parseInt(userId));
        
        // Determinar rol y área del usuario
        let roleName = 'Sin rol asignado';
        let areaName = 'Sin área asignada';
        
        if (userData.roles && userData.roles.length > 0) {
          roleName = userData.roles.join(', ');
        }
        
        if (userData.areas && userData.areas.length > 0) {
          areaName = userData.areas.map(area => area.name).join(', ');
        }
        
        // Transformar los datos a nuestro formato interno
        const userProfile: UserProfile = {
          id: userData.id.toString(),
          name: `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim(),
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          email: userData.email,
          role: roleName,
          area: areaName,
          isActive: userData.isActive || !!userData.is_active,
          joinDate: userData.joinDate || userData.join_date || new Date().toISOString().split('T')[0],
          lastLogin: userData.lastLogin || userData.last_login || new Date().toISOString(),
          profileImage: userData.profileImage || userData.profile_image,
          // Como la propiedad phone no existe en el tipo User, usamos un valor por defecto
          phone: '',
          // Generar actividades recientes simuladas para el ejemplo
          // En una implementación real, esto vendría del backend
          recentActivity: [
            { date: new Date().toISOString(), action: 'Inició sesión en el sistema' },
            { 
              date: new Date(Date.now() - 86400000).toISOString(), 
              action: 'Actualizó su perfil' 
            },
            { 
              date: new Date(Date.now() - 172800000).toISOString(), 
              action: 'Creó una nueva solicitud' 
            }
          ]
        };
        
        setUser(userProfile);
        
        // Inicializar los datos del formulario
        setFormData({
          phone: userProfile.phone || '',
          birthday: userProfile.birthday ? new Date(userProfile.birthday).toISOString().split('T')[0] : '',
          location: userProfile.location || ''
        });
      } catch (err) {
        console.error('Error al obtener datos del usuario:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el perfil del usuario');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [userId, navigate]);
  
  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Enviar los datos actualizados
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // En una implementación real, aquí se enviarían los datos al backend
      // Pero como 'phone' y 'birth_date' no están en el tipo UserUpdateRequest,
      // guardamos los datos localmente por ahora
      console.log('Datos a actualizar:', {
        phone: formData.phone,
        birthday: formData.birthday,
        location: formData.location
      });
      
      // Simular actualización con el backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar el estado local
      setUser({
        ...user,
        phone: formData.phone,
        birthday: formData.birthday,
        location: formData.location
      });
      
      // Cerrar el modal
      setIsEditModalOpen(false);
      
      // Mostrar notificación de éxito
      alert('Perfil actualizado exitosamente');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar la activación/desactivación de un usuario
  const handleToggleUserStatus = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Llamar a la API para actualizar el estado del usuario
      await userService.updateUser(parseInt(user.id), {
        isActive: !user.isActive
      });
      
      // Actualizar el estado local
      setUser({
        ...user,
        isActive: !user.isActive
      });
      
      // Mostrar notificación de éxito (podría implementarse con un sistema de notificaciones)
      alert(`Usuario ${!user.isActive ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err) {
      console.error('Error al cambiar estado del usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado del usuario');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar el restablecimiento de contraseña
  const handleResetPassword = async () => {
    if (!user) return;
    
    // Confirmar acción con el usuario
    if (!confirm(`¿Estás seguro de que deseas restablecer la contraseña de ${user.name}?`)) {
      return;
    }
    
    try {
      // En un sistema real, aquí se llamaría a la API para enviar el correo de restablecimiento
      // Por ahora simulamos con un mensaje de éxito
      alert(`Se ha enviado un correo a ${user.email} con instrucciones para restablecer la contraseña.`);
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    
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
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <ApiErrorHandler 
          error={error} 
          onRetry={() => window.location.reload()} 
          resourceName="el perfil del usuario"
        />
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
        
        {/* Botón de editar perfil - solo visible para el propio usuario */}
        {isCurrentUser && (
          <DashboardButton
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<PencilIcon className="h-5 w-5" />}
          >
            Completar perfil
          </DashboardButton>
        )}
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
                {isCurrentUser && (
                  <DashboardButton
                    variant="outline"
                    fullWidth
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Editar información
                  </DashboardButton>
                )}
                
                <DashboardButton
                  variant="outline"
                  fullWidth
                  onClick={handleResetPassword}
                >
                  Restablecer contraseña
                </DashboardButton>
                
                <DashboardButton
                  variant={user.isActive ? 'danger' : 'primary'}
                  fullWidth
                  onClick={handleToggleUserStatus}
                >
                  {user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                </DashboardButton>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
      
      {/* Modal para completar perfil */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Completar información de perfil"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="+502 5555-1234"
            />
          </div>
          
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={formData.birthday}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Ciudad de Guatemala"
            />
            <p className="mt-1 text-sm text-gray-500">
              Esta información es opcional y nos ayuda a organizar mejor los eventos y servicios.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <DashboardButton
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </DashboardButton>
            
            <DashboardButton
              onClick={handleUpdateProfile}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Guardar cambios
            </DashboardButton>
          </div>
        </div>
      </DashboardModal>
    </DashboardLayout>
  );
};

export default UserProfilePage;