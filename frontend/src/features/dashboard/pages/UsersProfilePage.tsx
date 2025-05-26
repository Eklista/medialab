// src/features/dashboard/pages/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardModal from '../components/ui/DashboardModal';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import Badge from '../components/ui/Badge';
import { 
  CalendarDaysIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CakeIcon, 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { userService } from '../../../services';
import { UserUpdateRequest } from '../../../services/users.service';
import { getBaseUrl } from '../../../services/api';
import fileUploadService from '../../../services/fileUpload.service';
import { useAuth } from '../../auth/hooks/useAuth';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';
import { formatFullDate, parseDate, getDaysUntilBirthday, formatBirthday } from '../../../utils/dateUtils';

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

interface ActivityStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  useAuth();
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
  
  // Función para ir a la página anterior
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Calcular estadísticas del usuario
  const getUserStats = (user: UserProfile | null): ActivityStat[] => {
    if (!user) return [];
    
    // Calcular días desde que se unió
    const joinDate = new Date(user.joinDate);
    const today = new Date();
    const daysSinceJoin = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular días hasta cumpleaños si existe
    let birthdayInfo = null;
    if (user.birthday) {
      const birthDate = parseDate(user.birthday);
      if (birthDate) {
        const daysUntil = getDaysUntilBirthday(birthDate);
        birthdayInfo = daysUntil === 0 ? '¡Hoy!' : `${daysUntil} días`;
      }
    }
    
    // Calcular último acceso
    let lastLoginInfo = 'Nunca';
    if (user.lastLogin && user.lastLogin !== '-') {
      const lastLogin = new Date(user.lastLogin);
      const daysAgo = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      lastLoginInfo = daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo} días`;
    }
    
    const stats: ActivityStat[] = [
      {
        label: 'Tiempo en equipo',
        value: `${daysSinceJoin} días`,
        icon: <CalendarDaysIcon className="h-5 w-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        label: 'Estado',
        value: user.isActive ? 'Activo' : 'Inactivo',
        icon: user.isActive ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />,
        color: user.isActive ? 'text-green-600' : 'text-red-600',
        bgColor: user.isActive ? 'bg-green-50' : 'bg-red-50'
      },
      {
        label: 'Último acceso',
        value: lastLoginInfo,
        icon: <ClockIcon className="h-5 w-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    ];
    
    // Agregar información de cumpleaños si existe
    if (birthdayInfo) {
      stats.push({
        label: 'Próximo cumpleaños',
        value: birthdayInfo,
        icon: <CakeIcon className="h-5 w-5" />,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50'
      });
    }
    
    return stats;
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
      
      const updateData: Partial<UserUpdateRequest> = {};
      
      if (formData.phone !== user.phone) updateData.phone = formData.phone;
      
      if (formData.birthday) {
        if (formData.birthday !== user.birthday) {
          updateData.birthDate = formData.birthday;
        }
      } else if (user.birthday) {
        updateData.birthDate = "";
      }

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
      
      if (Object.keys(updateData).length > 0) {
        await userService.updateUser(parseInt(user.id), updateData);
        
        const refreshedUserData = await userService.getUserById(parseInt(user.id));
        
        let roleName = user.role;
        let areaName = user.area;
        
        if (refreshedUserData.roles && refreshedUserData.roles.length > 0) {
          roleName = refreshedUserData.roles.join(', ');
        }
        
        if (refreshedUserData.areas && refreshedUserData.areas.length > 0) {
          areaName = refreshedUserData.areas.map(area => area.name).join(', ');
        }
        
        setUser({
          ...user,
          phone: refreshedUserData.phone || '',
          birthday: refreshedUserData.birth_date,
          profileImage: refreshedUserData.profileImage || refreshedUserData.profile_image,
          bannerImage: refreshedUserData.bannerImage || refreshedUserData.banner_image,
          email: refreshedUserData.email,
          firstName: refreshedUserData.firstName || refreshedUserData.first_name || '',
          lastName: refreshedUserData.lastName || refreshedUserData.last_name || '',
          name: `${refreshedUserData.firstName || refreshedUserData.first_name || ''} ${refreshedUserData.lastName || refreshedUserData.last_name || ''}`.trim(),
          role: roleName,
          area: areaName,
          isActive: refreshedUserData.isActive || !!refreshedUserData.is_active,
        });
        
        setFormData({
          phone: refreshedUserData.phone || '',
          birthday: refreshedUserData.birth_date ? new Date(refreshedUserData.birth_date).toISOString().split('T')[0] : '',
          profileImage: refreshedUserData.profileImage || refreshedUserData.profile_image || '',
          bannerImage: refreshedUserData.bannerImage || refreshedUserData.banner_image || ''
        });
        
        setSelectedProfileImage(null);
        setSelectedBannerImage(null);
        if (previewProfileImage) URL.revokeObjectURL(previewProfileImage);
        if (previewBannerImage) URL.revokeObjectURL(previewBannerImage);
        setPreviewProfileImage(null);
        setPreviewBannerImage(null);
        
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
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = new URL(getBaseUrl()).origin;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${path}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.size > 1 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo es 1MB.');
        return;
      }
      
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
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-1)]"></div>
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
          <UserIcon className="mx-auto h-12 w-12 text-[var(--color-text-secondary)]" />
          <h2 className="mt-4 text-xl font-medium text-[var(--color-text-main)]">Usuario no encontrado</h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">El usuario que buscas no existe.</p>
          <DashboardButton 
            className="mt-4"
            onClick={handleGoBack}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          >
            Volver
          </DashboardButton>
        </div>
      </DashboardLayout>
    );
  }
  
  const userStats = getUserStats(user);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4">
          <DashboardButton
            variant="outline"
            onClick={handleGoBack}
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            className="flex-shrink-0"
          >
            Volver
          </DashboardButton>
          
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Perfil de Usuario</h1>
            <p className="text-[var(--color-text-secondary)]">Información detallada del miembro del equipo</p>
          </div>
        </div>

        {/* Banner y foto de perfil */}
        <div className="relative">
          <div className="h-48 w-full overflow-hidden rounded-xl shadow-sm">
            <img
              src={user.bannerImage ? getFullImageUrl(user.bannerImage) : heroBanner}
              alt="Banner del perfil"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = heroBanner;
              }}
            />
          </div>
          
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="bg-white p-1 rounded-full shadow-lg">
              <UserProfilePhoto
                user={{
                  id: parseInt(user.id),
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profileImage: user.profileImage
                }}
                size="2xl"
                className="border-4 border-white"
              />
            </div>
          </div>
        </div>
        
        {/* Información del usuario */}
        <div className="mt-16 space-y-6">
          {/* Primera fila - 2 tarjetas iguales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[var(--color-text-main)]">{user.name}</h2>
                  <p className="text-[var(--color-text-secondary)] mt-1">{user.email}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="primary">{user.role}</Badge>
                    <Badge variant="info">{user.area}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Estadísticas del usuario */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">
                Estadísticas del Usuario
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userStats.map((stat, index) => (
                  <div key={index} className={`${stat.bgColor} rounded-lg p-3 border border-white shadow-sm`}>
                    <div className="flex items-center">
                      <div className={`${stat.color} p-2 rounded-lg bg-white shadow-sm flex-shrink-0`}>
                        {stat.icon}
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                        <p className="text-sm font-bold text-[var(--color-text-main)] truncate">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Segunda fila - 2 tarjetas iguales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de contacto rápido */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">
                Contacto Rápido
              </h3>
              
              <div className="space-y-3">
                <a 
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <EnvelopeIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">Enviar email</p>
                    <p className="text-xs text-blue-600 truncate">{user.email}</p>
                  </div>
                </a>
                
                {user.phone && (
                  <a 
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                      <PhoneIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">Llamar</p>
                      <p className="text-xs text-green-600">{user.phone}</p>
                    </div>
                  </a>
                )}
                
                {user.birthday && (
                  <div className="p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-100">
                    <div className="flex items-center gap-2">
                      <CakeIcon className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium text-pink-700">Próximo cumpleaños</span>
                    </div>
                    <p className="text-sm text-pink-600 mt-1">
                      {(() => {
                        const birthDate = parseDate(user.birthday);
                        if (birthDate) {
                          const daysUntil = getDaysUntilBirthday(birthDate);
                          return daysUntil === 0 ? '¡Hoy es su cumpleaños! 🎉' : 
                                 daysUntil === 1 ? '¡Mañana es su cumpleaños!' : 
                                 `Faltan ${daysUntil} días`;
                        }
                        return 'Información de cumpleaños disponible';
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Información de contacto */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Email</p>
                    <p className="text-base text-[var(--color-text-main)] truncate">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-green-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Teléfono</p>
                    <p className="text-base text-[var(--color-text-main)]">
                      {user.phone || 'No registrado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-purple-50 rounded-lg">
                    <BriefcaseIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Área de trabajo</p>
                    <p className="text-base text-[var(--color-text-main)]">{user.area}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-amber-50 rounded-lg">
                    <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Fecha de ingreso</p>
                    <p className="text-base text-[var(--color-text-main)]">{formatFullDate(user.joinDate)}</p>
                  </div>
                </div>

                {user.birthday && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-pink-50 rounded-lg">
                      <CakeIcon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">Fecha de nacimiento</p>
                      <p className="text-base text-[var(--color-text-main)]">
                        {formatBirthday(parseDate(user.birthday)!)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal para editar perfil */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Actualizar información de perfil"
        size="md"
        error={modalError}
      >
        <div className="space-y-6">
          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-3">
              Foto de perfil
            </label>
            <div className="flex items-center gap-4">
              <UserProfilePhoto
                user={{
                  id: parseInt(user.id),
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profileImage: previewProfileImage || user.profileImage
                }}
                size="xl"
              />
              <div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg shadow-sm text-sm font-medium text-[var(--color-text-main)] hover:bg-gray-50 transition-colors">
                    Cambiar foto
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={(e) => handleFileChange(e, 'profile')}
                  />
                </label>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  JPG, PNG o GIF. Máximo 1MB
                </p>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-3">
              Imagen de banner
            </label>
            <div className="border border-[var(--color-border)] rounded-lg p-3">
              <div className="h-24 w-full rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={previewBannerImage || (user?.bannerImage ? getFullImageUrl(user.bannerImage) : heroBanner)}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg shadow-sm text-sm font-medium text-[var(--color-text-main)] hover:bg-gray-50 transition-colors">
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
            <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent-1)] focus:border-[var(--color-accent-1)] transition-colors"
              placeholder="+502 5555-1234"
            />
          </div>
          
          {/* Fecha de nacimiento */}
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={formData.birthday}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent-1)] focus:border-[var(--color-accent-1)] transition-colors"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
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