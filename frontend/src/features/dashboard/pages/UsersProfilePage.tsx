// src/features/dashboard/pages/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import { CalendarDaysIcon, BriefcaseIcon, EnvelopeIcon, PhoneIcon, CakeIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { userService } from '../../../services';
import { UserUpdateRequest } from '../../../services/users.service';
import { getBaseUrl } from '../../../services/api';
import fileUploadService from '../../../services/fileUpload.service';
import { useAuth } from '../../auth/hooks/useAuth';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';
import { formatFullDate } from '../../../utils/dateUtils';

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
  bannerImage?: string;
  birthday?: string;
  phone?: string;
  location?: string;
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
    profileImage: '',
    bannerImage: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedBannerImage, setSelectedBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);

  // Verificar si el usuario actual es el dueño del perfil
  const isCurrentUser = state.user && userId === state.user.id?.toString();
  
  // Calcular el porcentaje de completitud del perfil
  const calculateProfileCompleteness = (user: UserProfile | null): number => {
    if (!user) return 0;
    
    let totalFields = 4; // Campos básicos que siempre están (nombre, email, rol, área)
    let completedFields = 4; // Estos campos son obligatorios
    
    // Verificar campos opcionales
    if (user.profileImage) completedFields += 1;
    if (user.phone) completedFields += 1;
    if (user.birthday) completedFields += 1;
    if (user.bannerImage) completedFields += 1;
    
    totalFields += 4; // Añadir los campos opcionales al total
    
    return Math.round((completedFields / totalFields) * 100);
  };
  
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
          bannerImage: userData.bannerImage || userData.banner_image,
          phone: userData.phone || '',
          birthday: userData.birth_date || undefined,
          location: '',
        };
        
        setUser(userProfile);
        
        // Inicializar los datos del formulario
        setFormData({
          phone: userData.phone || '',
          birthday: userData.birth_date ? new Date(userData.birth_date).toISOString().split('T')[0] : '',
          profileImage: userData.profileImage || userData.profile_image || '',
          bannerImage: userData.bannerImage || userData.banner_image || ''
        });
      } catch (err) {
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
  
  // Actualizar Usuario
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      setModalError(null);
      
      // Preparar los datos para actualizar
      const updateData: Partial<UserUpdateRequest> = {};
      
      // Procesar los campos de texto - solo añadir si hay cambios
      if (formData.phone !== user.phone) updateData.phone = formData.phone;
      
      if (formData.birthday) {
        // Si hay un valor y es diferente al actual, actualizarlo
        if (formData.birthday !== user.birthday) {
          updateData.birthDate = formData.birthday;
        }
      } else if (user.birthday) {
        updateData.birthDate = "";
      }

      // Subir imágenes si se han seleccionado
      if (selectedProfileImage) {
        try {
          const profileImageUrl = await fileUploadService.uploadImage(selectedProfileImage, 'profile');
          updateData.profileImage = profileImageUrl;
        } catch (imageError) {
          console.error('Error al subir la imagen de perfil:', imageError);
          setModalError('No se pudo subir la imagen de perfil. Por favor, inténtalo de nuevo.');
          setIsSubmitting(false);
          return;
        }
      }
      if (selectedBannerImage) {
        try {
          const bannerImageUrl = await fileUploadService.uploadImage(selectedBannerImage, 'banner');
          updateData.bannerImage = bannerImageUrl;
        } catch (imageError) {
          console.error('Error al subir la imagen de banner:', imageError);
          setModalError('No se pudo subir la imagen de banner. Por favor, inténtalo de nuevo.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Solo llamamos a la API si hay datos para actualizar
      if (Object.keys(updateData).length > 0) {
        // Llamar al servicio para actualizar
        await userService.updateUser(parseInt(user.id), updateData);
        
        // Recargar los datos completos del usuario después de la actualización
        const refreshedUserData = await userService.getUserById(parseInt(user.id));
        
        // Determinar rol y área del usuario nuevamente
        let roleName = user.role;
        let areaName = user.area;
        
        if (refreshedUserData.roles && refreshedUserData.roles.length > 0) {
          roleName = refreshedUserData.roles.join(', ');
        }
        
        if (refreshedUserData.areas && refreshedUserData.areas.length > 0) {
          areaName = refreshedUserData.areas.map(area => area.name).join(', ');
        }
        
        // Actualizar el estado local con los datos completos y actualizados
        setUser({
          ...user,
          phone: refreshedUserData.phone || '',
          birthday: refreshedUserData.birth_date,
          profileImage: refreshedUserData.profileImage || refreshedUserData.profile_image,
          bannerImage: refreshedUserData.bannerImage || refreshedUserData.banner_image,
          // Mantener el resto de campos actualizados
          email: refreshedUserData.email,
          firstName: refreshedUserData.firstName || refreshedUserData.first_name || '',
          lastName: refreshedUserData.lastName || refreshedUserData.last_name || '',
          name: `${refreshedUserData.firstName || refreshedUserData.first_name || ''} ${refreshedUserData.lastName || refreshedUserData.last_name || ''}`.trim(),
          role: roleName,
          area: areaName,
          isActive: refreshedUserData.isActive || !!refreshedUserData.is_active,
        });
        
        // Actualizar también el formulario con los nuevos datos
        setFormData({
          phone: refreshedUserData.phone || '',
          birthday: refreshedUserData.birth_date ? new Date(refreshedUserData.birth_date).toISOString().split('T')[0] : '',
          profileImage: refreshedUserData.profileImage || refreshedUserData.profile_image || '',
          bannerImage: refreshedUserData.bannerImage || refreshedUserData.banner_image || ''
        });
        
        // Limpiar las previsualizaciones y archivos seleccionados
        setSelectedProfileImage(null);
        setSelectedBannerImage(null);
        if (previewProfileImage) URL.revokeObjectURL(previewProfileImage);
        if (previewBannerImage) URL.revokeObjectURL(previewBannerImage);
        setPreviewProfileImage(null);
        setPreviewBannerImage(null);
        
        // Cerrar el modal
        setIsEditModalOpen(false);
        
        // Mostrar notificación de éxito
        alert('Perfil actualizado exitosamente');
      } else {
        setModalError('No se detectaron cambios en la información');
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFullImageUrl = (imagePath: string | undefined | null): string => {
    if (!imagePath) return defaultUserImage;
    
    // Si la ruta ya comienza con http:// o https://, asumimos que es una URL completa
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Obtener la URL base del API
    const baseUrl = new URL(getBaseUrl()).origin;
    // Asegurarnos de que la ruta de la imagen comience con /
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${path}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Verificar el tamaño del archivo (máximo 1MB)
      if (file.size > 1 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo es 1MB.');
        return;
      }
      
      // Crear una URL para previsualizar la imagen
      const previewUrl = URL.createObjectURL(file);
      
      if (type === 'profile') {
        setSelectedProfileImage(file);
        setPreviewProfileImage(previewUrl);
      } else {
        setSelectedBannerImage(file);
        setPreviewBannerImage(previewUrl);
      }
    }
  };
  
  // Generar iniciales para el avatar si no hay imagen de perfil
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  // Generar color de fondo para el avatar basado en las iniciales
  const getInitialBackgroundColor = (initials: string): string => {
    const colors = [
      'bg-gray-800', 'bg-blue-800', 'bg-green-800', 'bg-red-800', 
      'bg-purple-800', 'bg-pink-800', 'bg-indigo-800', 'bg-yellow-800'
    ];
    
    const charCode = initials.charCodeAt(0) || 65;
    return colors[charCode % colors.length];
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
        
        {/* Botón de completar perfil - visible para el propio usuario */}
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
            src={user.bannerImage ? getFullImageUrl(user.bannerImage) : heroBanner}
            alt="Perfil banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = heroBanner;
            }}
          />
        </div>
        
        <div className="absolute bottom-0 left-8 transform translate-y-1/2 bg-white p-1 rounded-full shadow-lg">
          {user.profileImage ? (
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white">
              <img 
                src={getFullImageUrl(user.profileImage)}
                alt={user.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultUserImage;
                }}
              />
            </div>
          ) : (
            <div className={`h-32 w-32 rounded-full overflow-hidden border-4 border-white flex items-center justify-center text-white font-bold text-3xl ${getInitialBackgroundColor(getInitials(user.name))}`}>
              {getInitials(user.name)}
            </div>
          )}
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
                    <p className="text-base text-gray-900">{formatFullDate(user.joinDate)}</p>
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
                    <p className="text-base text-gray-900">
                      {user.phone ? user.phone : 'No registrado'}
                    </p>
                  </div>
                </div>

                {user.birthday && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CakeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Fecha de nacimiento</p>
                      <p className="text-base text-gray-900">
                        {user.birthday ? formatFullDate(user.birthday) : 'No registrada'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
          
          {/* Columna derecha - Con contenido alternativo si no es el usuario actual */}
          <div className="lg:col-span-1 space-y-6">
            {isCurrentUser ? (
              /* Estado de completitud - Solo visible para el propio usuario */
              <DashboardCard
                title="Estado del perfil"
                subtitle="Información de completitud"
              >
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Completitud del perfil</span>
                      <span className="text-sm font-medium text-black">{calculateProfileCompleteness(user)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-black h-2 rounded-full" style={{ width: `${calculateProfileCompleteness(user)}%` }}></div>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mt-4">
                    <li className="flex items-center text-sm">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2 text-gray-700">Información básica</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <div className={`flex-shrink-0 h-5 w-5 ${user.profileImage ? 'text-green-500' : 'text-gray-400'}`}>
                        {user.profileImage ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-2 ${user.profileImage ? 'text-gray-700' : 'text-gray-400'}`}>Foto de perfil</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <div className={`flex-shrink-0 h-5 w-5 ${user.phone ? 'text-green-500' : 'text-gray-400'}`}>
                        {user.phone ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-2 ${user.phone ? 'text-gray-700' : 'text-gray-400'}`}>Teléfono</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <div className={`flex-shrink-0 h-5 w-5 ${user.bannerImage ? 'text-green-500' : 'text-gray-400'}`}>
                        {user.bannerImage ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-2 ${user.bannerImage ? 'text-gray-700' : 'text-gray-400'}`}>Imagen de banner</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <div className={`flex-shrink-0 h-5 w-5 ${user.birthday ? 'text-green-500' : 'text-gray-400'}`}>
                        {user.birthday ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-2 ${user.birthday ? 'text-gray-700' : 'text-gray-400'}`}>Fecha de nacimiento</span>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    <DashboardButton
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full"
                    >
                      Completar perfil
                    </DashboardButton>
                  </div>
                </div>
              </DashboardCard>
            ) : (
              /* Información alternativa para usuarios que no son el propietario del perfil */
              <DashboardCard
                title="Información del miembro"
              >
                <div className="p-4 bg-gray-50 rounded-lg mt-2">
                  <p className="text-gray-600">
                    {user.name} forma parte del equipo de <span className="font-medium text-black">{user.area}</span> desde el {formatFullDate(user.joinDate).split(',')[0]}.
                  </p>
                  
                  <p className="text-gray-500 text-sm mt-4">
                    {user.isActive 
                      ? 'Actualmente se encuentra activo en la plataforma.' 
                      : 'Actualmente no se encuentra activo en la plataforma.'}
                  </p>
                </div>
              </DashboardCard>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal para completar perfil */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Actualizar información de perfil"
        size="md"
        error={modalError}
      >
        <div className="space-y-4">
          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de perfil
            </label>
            <div className="flex items-center space-x-4">
              {previewProfileImage || user?.profileImage ? (
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white">
                  <img
                    src={previewProfileImage || (user?.profileImage ? getFullImageUrl(user.profileImage) : defaultUserImage)}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className={`h-32 w-32 rounded-full overflow-hidden border-4 border-white flex items-center justify-center text-white font-bold text-3xl ${getInitialBackgroundColor(getInitials(user?.name || ''))}`}>
                  {getInitials(user?.name || '')}
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cambiar foto
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={(e) => handleFileChange(e, 'profile')}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  JPG o PNG. Máximo 1MB
                </p>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de banner
            </label>
            <div className="border border-gray-300 rounded-lg p-2">
              <div className="h-24 w-full rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={previewBannerImage || (user?.bannerImage ? getFullImageUrl(user.bannerImage) : heroBanner)}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <label className="cursor-pointer">
                  <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cambiar banner
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={(e) => handleFileChange(e, 'banner')}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Teléfono */}
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
          
          {/* Fecha de nacimiento */}
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