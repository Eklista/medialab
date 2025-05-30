// src/features/dashboard/pages/UserProfilePage.tsx - 🎯 VERSIÓN CORREGIDA PARA DATOS DEL BACKEND
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardButton from '../components/ui/DashboardButton';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import Badge from '../components/ui/Badge';
import { 
  CalendarDaysIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CakeIcon, 
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';

import { useUserProfile } from '../../../services/users/hooks/useUserService';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';
import { formatFullDate, parseDate, formatBirthday } from '../utils/dateUtils';

// Importar imágenes
import heroBanner from '../../../assets/images/medialab-hero.jpg';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  // 🎯 HOOK OPTIMIZADO
  const { user, isLoading, error } = useUserProfile(userId ? parseInt(userId) : null);
  
  // 🔧 FUNCIÓN HELPERS PARA MANEJAR DATOS DEL BACKEND
  const getUserFullName = (userData: any): string => {
    if (!userData) return 'Usuario';
    
    if (userData.fullName) return userData.fullName;
    if (userData.full_name) return userData.full_name;
    
    const firstName = userData.firstName || userData.first_name || '';
    const lastName = userData.lastName || userData.last_name || '';
    
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    
    return userData.email?.split('@')[0] || 'Usuario';
  };

  const getUserActiveStatus = (userData: any): boolean => {
    if (!userData) return false;
    if (userData.isActive !== undefined) return userData.isActive;
    if (userData.is_active !== undefined) return userData.is_active;
    if (userData.active !== undefined) return userData.active;
    return true; // Por defecto activo
  };

  const getUserRoles = (userData: any): string[] => {
    if (!userData) return [];
    if (Array.isArray(userData.roles)) {
      // Convertir todo a strings
      return userData.roles.map(role => 
        typeof role === 'string' ? role : role?.name || ''
      ).filter(Boolean);
    }
    if (userData.role) return [userData.role];
    return [];
  };

  const getUserAreas = (userData: any): string[] => {
    if (!userData) return [];
    if (Array.isArray(userData.areas)) {
      // Convertir todo a strings
      return userData.areas.map((area: any) => 
        typeof area === 'string' ? area : area?.name || ''
      ).filter(Boolean);
    }
    if (userData.area) return [userData.area];
    return [];
  };

  const getUserPhone = (userData: any): string => {
    if (!userData) return '';
    return userData.phone || userData.phoneNumber || '';
  };

  const getUserBirthDate = (userData: any): string | null => {
    if (!userData) return null;
    return userData.birth_date || userData.birthDate || userData.birthdate || null;
  };

  const getUserJoinDate = (userData: any): string | null => {
    if (!userData) return null;
    return userData.joinDate || userData.join_date || userData.created_at || null;
  };

  const getUserLastLogin = (userData: any): string | null => {
    if (!userData) return null;
    return userData.lastLogin || userData.last_login || userData.last_seen || null;
  };
  
  // 🎯 FUNCIÓN SIMPLIFICADA PARA IR ATRÁS
  const handleGoBack = () => navigate(-1);
  
  // 🎯 FUNCIÓN SIMPLIFICADA PARA URL DE IMÁGENES
  const getFullImageUrl = (imagePath: string | undefined | null): string => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = import.meta.env.MODE === 'production' 
      ? window.location.origin 
      : 'http://localhost:8000';
    
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}`;
  };
  
  // 🔧 DEBUG: Log de datos para entender la estructura
  useEffect(() => {
    if (user) {
      console.log('🔍 DEBUG - Usuario recibido en ProfilePage:', user);
      console.log('🔍 DEBUG - Campos disponibles:', Object.keys(user));
      console.log('🔍 DEBUG - isActive:', getUserActiveStatus(user));
      console.log('🔍 DEBUG - fullName:', getUserFullName(user));
      console.log('🔍 DEBUG - roles:', getUserRoles(user));
      console.log('🔍 DEBUG - areas:', getUserAreas(user));
    }
  }, [user]);
  
  // 🎯 REDIRECCIÓN AUTOMÁTICA SI NO HAY userId
  useEffect(() => {
    if (!userId) {
      navigate('/ml-admin/dashboard/users');
    }
  }, [userId, navigate]);
  
  // 🎯 LOADING STATE SIMPLIFICADO
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // 🎯 ERROR STATE SIMPLIFICADO
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
  
  // 🎯 NOT FOUND STATE SIMPLIFICADO
  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-medium text-gray-900">Usuario no encontrado</h2>
          <p className="mt-2 text-gray-600">El usuario que buscas no existe.</p>
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

  // 🔧 VARIABLES COMPUTADAS CON HELPERS
  const fullName = getUserFullName(user);
  const isActive = getUserActiveStatus(user);
  const userRoles = getUserRoles(user);
  const userAreas = getUserAreas(user);
  const phone = getUserPhone(user);
  const birthDate = getUserBirthDate(user);
  const joinDate = getUserJoinDate(user);
  const lastLogin = getUserLastLogin(user);
  
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
            <p className="text-[var(--color-text-secondary)]">Información del miembro del equipo</p>
          </div>
        </div>

        {/* Banner y foto de perfil */}
        <div className="relative">
          <div className="h-48 w-full overflow-hidden rounded-xl shadow-sm">
            <img
              src={getFullImageUrl(user.bannerImage || user.banner_image) || heroBanner}
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
                user={user}
                size="2xl"
                className="border-4 border-white"
              />
            </div>
          </div>
        </div>
        
        {/* Información del usuario */}
        <div className="mt-16 space-y-6">
          {/* Información básica centrada */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
                {fullName}
              </h2>
              <p className="text-[var(--color-text-secondary)] mt-1">{user.email}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant={isActive ? "success" : "danger"}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                
                {/* Mostrar roles */}
                {userRoles.length > 0 ? (
                  userRoles.map((role, index) => (
                    <Badge key={index} variant="primary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">Sin rol</Badge>
                )}
                
                {/* Mostrar áreas */}
                {userAreas.length > 0 && userAreas.map((area, index) => (
                  <Badge key={index} variant="info">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Dos columnas simétricas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de contacto rápido */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6 h-full">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-6">
                Contacto Rápido
              </h3>
              
              <div className="space-y-4">
                <a 
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                >
                  <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <EnvelopeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">Enviar email</p>
                    <p className="text-xs text-blue-600 truncate">{user.email}</p>
                  </div>
                </a>
                
                {phone && (
                  <a 
                    href={`tel:${phone}`}
                    className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="p-3 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                      <PhoneIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">Llamar</p>
                      <p className="text-xs text-green-600">{phone}</p>
                    </div>
                  </a>
                )}
                
                {birthDate && (
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-pink-500 rounded-lg">
                        <CakeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-pink-900">Próximo cumpleaños</p>
                        <p className="text-xs text-pink-600 mt-1">
                          {(() => {
                            const parsedBirthDate = parseDate(birthDate);
                            if (parsedBirthDate) {
                              const today = new Date();
                              const thisYear = today.getFullYear();
                              const birthday = new Date(thisYear, parsedBirthDate.getMonth(), parsedBirthDate.getDate());
                              
                              if (birthday < today) {
                                birthday.setFullYear(thisYear + 1);
                              }
                              
                              const daysUntil = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              
                              return daysUntil === 0 ? '¡Hoy es su cumpleaños! 🎉' : 
                                     daysUntil === 1 ? '¡Mañana es su cumpleaños!' : 
                                     `Faltan ${daysUntil} días`;
                            }
                            return 'Información disponible';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Relleno para mantener altura consistente */}
                {!phone && !birthDate && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gray-300 rounded-lg">
                        <PhoneIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Información adicional</p>
                        <p className="text-xs text-gray-400">No disponible</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Información de contacto */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6 h-full">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-6">
                Información Personal
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Email</p>
                    <p className="text-base text-[var(--color-text-main)] truncate">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-3 bg-green-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Teléfono</p>
                    <p className="text-base text-[var(--color-text-main)]">
                      {phone || 'No registrado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-3 bg-purple-50 rounded-lg">
                    <BriefcaseIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Rol</p>
                    <p className="text-base text-[var(--color-text-main)]">
                      {userRoles.length > 0 
                        ? userRoles.join(', ')
                        : 'Sin rol asignado'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-3 bg-amber-50 rounded-lg">
                    <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Fecha de ingreso</p>
                    <p className="text-base text-[var(--color-text-main)]">
                      {joinDate ? formatFullDate(joinDate) : 'No disponible'}
                    </p>
                  </div>
                </div>

                {birthDate && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-3 bg-pink-50 rounded-lg">
                      <CakeIcon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">Fecha de nacimiento</p>
                      <p className="text-base text-[var(--color-text-main)]">
                        {formatBirthday(parseDate(birthDate)!)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Último acceso */}
                {lastLogin && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-lg">
                      <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">Último acceso</p>
                      <p className="text-base text-[var(--color-text-main)]">
                        {formatFullDate(lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Relleno para mantener altura */}
                {!birthDate && !lastLogin && (
                  <div className="flex items-start gap-3 opacity-60">
                    <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
                      <CakeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-400">Información adicional</p>
                      <p className="text-base text-gray-400">No disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfilePage;