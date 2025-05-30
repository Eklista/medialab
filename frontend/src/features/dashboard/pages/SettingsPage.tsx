// src/features/dashboard/pages/SettingsPage.tsx - 🎯 VERSIÓN LIMPIA CON NUEVA ARQUITECTURA
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardTextInput from '../components/ui/DashboardTextInput';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';

// 🎯 NUEVA ARQUITECTURA - Solo usar userService y hooks optimizados
import { useAppData } from '../../../context/AppDataContext';
import { authService } from '../../../services';
import { UserUpdateRequest } from '../../../services/users/types/requests.types';

// 🆕 HOOK OPTIMIZADO - Reemplaza toda la lógica de carga manual
import { useCurrentUserProfile } from '../../../services/users/hooks/useUserService';

// 🎯 HELPERS SIMPLIFICADOS
import { isAdmin, getRoleDisplayText } from '../../../utils/userTypeHelpers';

// 🎯 UTILIDADES DE FECHA SIMPLIFICADAS
const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('es-GT', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatFullDate(date);
};

// Iconos
import { 
  UserIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  EnvelopeIcon, 
  ClockIcon,
  CakeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

// Importar imágenes
import heroBanner from '../../../assets/images/medialab-hero.jpg';

const SettingsPage: React.FC = () => {
  // 🎯 HOOKS OPTIMIZADOS - Una sola fuente de verdad
  const { refreshUser } = useAppData();
  const { user: currentUser, isLoading, error, refresh } = useCurrentUserProfile(true);
  
  // 🎯 ESTADOS SIMPLIFICADOS
  const [profileData, setProfileData] = useState({
    phone: '',
    birthday: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estados para manejo de imágenes
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedBannerImage, setSelectedBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);
  
  // Estados de carga y mensajes
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  // Estado para opciones de seguridad
  const [securityOptions, setSecurityOptions] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true
  });
  
  // 🎯 DATOS COMPUTADOS OPTIMIZADOS - Manejo seguro de tipos
  const userIsAdmin = useMemo(() => {
    return currentUser ? isAdmin(currentUser) : false;
  }, [currentUser]);
  
  const userDisplayData = useMemo(() => {
    if (!currentUser) return null;
    
    // 🔧 Manejo seguro de fullName - puede existir o no dependiendo del tipo
    const fullName = ('fullName' in currentUser && currentUser.fullName) 
      ? currentUser.fullName 
      : `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email;
    
    // 🔧 Manejo seguro de username - puede existir o no
    const username = ('username' in currentUser && currentUser.username) 
      ? currentUser.username 
      : currentUser.email?.split('@')[0] || 'usuario';
    
    // 🔧 Manejo seguro de joinDate - puede existir o no
    const joinDate = ('joinDate' in currentUser && currentUser.joinDate)
      ? formatFullDate(new Date(currentUser.joinDate))
      : formatFullDate(new Date());
    
    // 🔧 Manejo seguro de lastLogin - puede existir o no
    const lastLogin = ('lastLogin' in currentUser && currentUser.lastLogin)
      ? formatRelativeTime(new Date(currentUser.lastLogin))
      : 'Primera vez';
    
    return {
      fullName,
      email: currentUser.email,
      role: getRoleDisplayText(currentUser) || 'Usuario',
      isActive: currentUser.isActive,
      joinDate,
      lastLogin,
      username
    };
  }, [currentUser]);
  
  // 🎯 FUNCIÓN PARA OBTENER URL COMPLETA DE IMAGEN - Simplificada
  const getFullImageUrl = useCallback((imagePath: string | undefined | null): string => {
    if (!imagePath || imagePath.trim() === '') return '';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = import.meta.env.MODE === 'production' 
      ? window.location.origin 
      : 'http://localhost:8000';
    
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}`;
  }, []);
  
  // 🎯 CARGAR DATOS DEL USUARIO (SIMPLIFICADO)
  useEffect(() => {
    if (currentUser && currentUser.id) {
      console.log('🔄 Inicializando datos del perfil desde usuario actual');
      
      // 🔧 Manejo seguro de phone - puede existir o no dependiendo del tipo
      const phone = ('phone' in currentUser && currentUser.phone) ? currentUser.phone : '';
      
      // 🔧 Manejo seguro de birth_date - puede existir o no dependiendo del tipo
      const birthDate = ('birth_date' in currentUser && currentUser.birth_date) 
        ? new Date(currentUser.birth_date).toISOString().split('T')[0]
        : '';
      
      setProfileData({
        phone,
        birthday: birthDate
      });
    }
  }, [currentUser?.id]);
  
  // 🎯 CALCULAR COMPLETITUD DEL PERFIL
  const profileCompleteness = useMemo(() => {
    if (!currentUser) return 0;
    
    let totalFields = 8;
    let completedFields = 4; // Básicos siempre completos (email, username, firstName, lastName)
    
    if (currentUser.profileImage || previewProfileImage) completedFields += 1;
    if (profileData.phone) completedFields += 1;
    if (profileData.birthday) completedFields += 1;
    if (currentUser.bannerImage || previewBannerImage) completedFields += 1;
    
    return Math.round((completedFields / totalFields) * 100);
  }, [currentUser, profileData, previewProfileImage, previewBannerImage]);
  
  // 🎯 HANDLERS OPTIMIZADOS
  const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) { // 5MB límite
        alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
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
  }, []);
  
  // 🎯 SUBMIT OPTIMIZADO DEL PERFIL - Usando nueva arquitectura
  const handleProfileSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setProfileError('No hay usuario autenticado');
      return;
    }
    
    setIsLoadingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    
    try {
      const updateData: Partial<UserUpdateRequest> = {};
      
      // 🎯 COMPARACIÓN SIMPLIFICADA - Manejo seguro de tipos
      const currentPhone = ('phone' in currentUser && currentUser.phone) ? currentUser.phone : '';
      const currentBirthday = ('birth_date' in currentUser && currentUser.birth_date) ? 
        new Date(currentUser.birth_date).toISOString().split('T')[0] : '';
      
      if (profileData.phone !== currentPhone) {
        updateData.phone = profileData.phone;
      }
      
      if (profileData.birthday !== currentBirthday) {
        updateData.birthDate = profileData.birthday || undefined;
      }
      
      // 🎯 SUBIR IMÁGENES - Usando authService (ya que es parte del perfil de auth)
      if (selectedProfileImage) {
        try {
          const profileImageUrl = await authService.uploadProfileImage(selectedProfileImage, 'profile');
          updateData.profileImage = profileImageUrl;
        } catch (imageError) {
          setProfileError('No se pudo subir la imagen de perfil');
          setIsLoadingProfile(false);
          return;
        }
      }
      
      if (selectedBannerImage) {
        try {
          const bannerImageUrl = await authService.uploadProfileImage(selectedBannerImage, 'banner');
          updateData.bannerImage = bannerImageUrl;
        } catch (imageError) {
          setProfileError('No se pudo subir la imagen de banner');
          setIsLoadingProfile(false);
          return;
        }
      }
      
      // 🎯 ACTUALIZAR CON authService (mantiene coherencia con autenticación)
      if (Object.keys(updateData).length > 0) {
        await authService.updateProfile(updateData);
        
        // Limpiar archivos seleccionados
        setSelectedProfileImage(null);
        setSelectedBannerImage(null);
        if (previewProfileImage) URL.revokeObjectURL(previewProfileImage);
        if (previewBannerImage) URL.revokeObjectURL(previewBannerImage);
        setPreviewProfileImage(null);
        setPreviewBannerImage(null);
        
        setProfileSuccess('Perfil actualizado correctamente');
        
        // 🎯 REFRESCAR CON HOOK OPTIMIZADO
        await refresh();
        await refreshUser();
        
      } else {
        setProfileError('No se detectaron cambios para actualizar');
      }
    } catch (err) {
      console.error('💥 Error actualizando perfil:', err);
      setProfileError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [currentUser, profileData, selectedProfileImage, selectedBannerImage, previewProfileImage, previewBannerImage, refresh, refreshUser]);
  
  // 🎯 SUBMIT DE CONTRASEÑA - Sin cambios (ya usa authService correctamente)
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoadingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }
      
      if (passwordData.newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      
      await authService.changePassword(
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordSuccess('Contraseña actualizada correctamente');
    } catch (err) {
      console.error('💥 Error cambiando contraseña:', err);
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setIsLoadingPassword(false);
    }
  }, [passwordData]);
  
  // 🎯 MANEJO DE OPCIONES DE SEGURIDAD - Simplificado
  const handleSecurityOptionChange = useCallback((option: keyof typeof securityOptions, value: boolean) => {
    setSecurityOptions(prev => ({ ...prev, [option]: value }));
    
    // TODO: Implementar cuando el backend esté listo
    console.log(`${option} ${value ? 'activado' : 'desactivado'} (función pendiente)`);
  }, []);
  
  // 🎯 LOADING STATE OPTIMIZADO
  if (isLoading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración...</p>
            {error && (
              <p className="text-red-600 text-sm mt-2">Error: {error}</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Configuración de Cuenta</h1>
          <p className="text-[var(--color-text-secondary)]">
            Administra tus datos personales y preferencias de seguridad
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna lateral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de Perfil */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <UserProfilePhoto
                    user={currentUser}
                    size="2xl"
                    enableCache={true}
                  />
                </div>
                
                <h3 className="text-xl font-semibold text-[var(--color-text-main)] mb-1">
                  {userDisplayData?.fullName}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-2">
                  {userDisplayData?.email}
                </p>
                
                <Badge 
                  variant={userDisplayData?.isActive ? 'success' : 'secondary'}
                  className="mt-2"
                >
                  {userDisplayData?.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                
                <div className="mt-4 w-full text-left">
                  <div className="text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3 mt-3">
                    <div className="flex justify-between my-2">
                      <span>Usuario:</span>
                      <span className="font-medium text-[var(--color-text-main)]">
                        {userDisplayData?.username}
                      </span>
                    </div>
                    <div className="flex justify-between my-2">
                      <span>Rol:</span>
                      <span className="font-medium text-[var(--color-text-main)]">
                        {userDisplayData?.role}
                      </span>
                    </div>
                    <div className="flex justify-between my-2">
                      <span>Miembro desde:</span>
                      <span className="font-medium text-[var(--color-text-main)] text-xs">
                        {userDisplayData?.joinDate}
                      </span>
                    </div>
                    <div className="flex justify-between my-2">
                      <span>Último acceso:</span>
                      <span className="font-medium text-[var(--color-text-main)] text-xs">
                        {userDisplayData?.lastLogin}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Panel de completitud */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-[var(--color-accent-1)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                  Completitud del Perfil
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Progreso general
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-main)]">
                      {profileCompleteness}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[var(--color-accent-1)] to-[var(--color-hover)] h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${profileCompleteness}%` }}
                    ></div>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="ml-2 text-[var(--color-text-main)]">Información básica</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${(currentUser.profileImage || previewProfileImage) ? 'text-green-500' : 'text-gray-400'}`}>
                      {(currentUser.profileImage || previewProfileImage) ? 
                        <CheckCircleIcon className="h-5 w-5" /> : 
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      }
                    </div>
                    <span className={`ml-2 ${(currentUser.profileImage || previewProfileImage) ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Foto de perfil
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${profileData.phone ? 'text-green-500' : 'text-gray-400'}`}>
                      {profileData.phone ? 
                        <CheckCircleIcon className="h-5 w-5" /> : 
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      }
                    </div>
                    <span className={`ml-2 ${profileData.phone ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Teléfono
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${profileData.birthday ? 'text-green-500' : 'text-gray-400'}`}>
                      {profileData.birthday ? 
                        <CheckCircleIcon className="h-5 w-5" /> : 
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      }
                    </div>
                    <span className={`ml-2 ${profileData.birthday ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Fecha de nacimiento
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${(('bannerImage' in currentUser && currentUser.bannerImage) || previewBannerImage) ? 'text-green-500' : 'text-gray-400'}`}>
                      {(('bannerImage' in currentUser && currentUser.bannerImage) || previewBannerImage) ? 
                        <CheckCircleIcon className="h-5 w-5" /> : 
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      }
                    </div>
                    <span className={`ml-2 ${(('bannerImage' in currentUser && currentUser.bannerImage) || previewBannerImage) ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Imagen de banner
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Opciones de Seguridad */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">
                Opciones de Seguridad
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Configura tus preferencias de seguridad
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">
                      Autenticación de dos factores
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Aumenta la seguridad de tu cuenta
                    </p>
                  </div>
                  <Switch 
                    checked={securityOptions.twoFactorEnabled}
                    onChange={(checked) => handleSecurityOptionChange('twoFactorEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">
                      Notificaciones por email
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Recibe alertas importantes
                    </p>
                  </div>
                  <Switch 
                    checked={securityOptions.emailNotifications}
                    onChange={(checked) => handleSecurityOptionChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">
                      Alertas de inicio de sesión
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Notificaciones de nuevos accesos
                    </p>
                  </div>
                  <Switch 
                    checked={securityOptions.loginAlerts}
                    onChange={(checked) => handleSecurityOptionChange('loginAlerts', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulario de Información Personal */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Información Personal
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Actualiza tu información de perfil
                  </p>
                </div>
                <Badge variant="primary">Editable</Badge>
              </div>
              
              {/* Banner Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-3">
                  Imagen de banner
                </label>
                <div className="border border-[var(--color-border)] rounded-lg p-3 mb-4">
                  <div className="h-32 w-full rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={previewBannerImage || getFullImageUrl(('bannerImage' in currentUser && currentUser.bannerImage) ? currentUser.bannerImage : null) || heroBanner}
                      alt="Banner"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg shadow-sm text-sm font-medium text-[var(--color-text-main)] hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                        <PhotoIcon className="h-4 w-4" />
                        Cambiar banner
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        onChange={(e) => handleFileChange(e, 'banner')}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Profile Photo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-3">
                  Foto de perfil
                </label>
                <div className="flex items-center gap-4">
                  <UserProfilePhoto
                    user={currentUser}
                    size="xl"
                    enableCache={true}
                  />
                  <div>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg shadow-sm text-sm font-medium text-[var(--color-text-main)] hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                        <PhotoIcon className="h-4 w-4" />
                        Cambiar foto
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        onChange={(e) => handleFileChange(e, 'profile')}
                      />
                    </label>
                    <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      JPG, PNG, GIF o WebP. Máximo 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Campos de solo lectura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Nombre completo
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {userDisplayData?.fullName || 'No especificado'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Correo electrónico
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)] flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-[var(--color-text-secondary)] mr-2" />
                    {userDisplayData?.email || 'No especificado'}
                  </div>
                </div>
              </div>
              
              {/* Mensajes de estado */}
              {profileError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{profileError}</p>
                </div>
              )}
              
              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  <p className="font-medium">{profileSuccess}</p>
                </div>
              )}
              
              {/* Formulario editable */}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DashboardTextInput
                    id="phone"
                    name="phone"
                    label="Teléfono"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Tu número de teléfono"
                    type="tel"
                    icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
                    helperText="Para notificaciones importantes"
                  />
                  
                  <DashboardTextInput
                    id="birthday"
                    name="birthday"
                    label="Fecha de nacimiento"
                    value={profileData.birthday}
                    onChange={handleProfileChange}
                    type="date"
                    icon={<CakeIcon className="h-5 w-5" />}
                    helperText="Esta información es privada y opcional"
                  />
                </div>
                
                <div className="mt-6 flex justify-end">
                  <DashboardButton
                    type="submit"
                    loading={isLoadingProfile}
                    disabled={isLoadingProfile}
                    leftIcon={<UserIcon className="h-5 w-5" />}
                  >
                    Actualizar Perfil
                  </DashboardButton>
                </div>
              </form>
            </div>
            
            {/* Información de la Cuenta (Solo lectura) */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Información de la Cuenta
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Datos administrados por el sistema
                  </p>
                </div>
                <Badge variant="secondary">Solo lectura</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Nombre de usuario
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {userDisplayData?.username}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Rol asignado
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)] flex items-center">
                    {userDisplayData?.role}
                    {userIsAdmin && (
                      <Badge variant="success" className="ml-2 text-xs">
                        Administrador
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Fecha de ingreso
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {userDisplayData?.joinDate}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Estado de la cuenta
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${userDisplayData?.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {userDisplayData?.isActive ? 'Activa' : 'Inactiva'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Formulario de Cambio de Contraseña */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Cambiar Contraseña
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Actualiza tu contraseña regularmente para mantener tu cuenta segura
                  </p>
                </div>
                <Badge variant="warning">Seguridad</Badge>
              </div>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{passwordError}</p>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  <p className="font-medium">{passwordSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <DashboardTextInput
                  id="currentPassword"
                  name="currentPassword"
                  label="Contraseña actual"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Ingresa tu contraseña actual"
                  type="password"
                  required
                  icon={<KeyIcon className="h-5 w-5" />}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DashboardTextInput
                    id="newPassword"
                    name="newPassword"
                    label="Nueva contraseña"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Ingresa tu nueva contraseña"
                    type="password"
                    required
                    icon={<KeyIcon className="h-5 w-5" />}
                    helperText="Mínimo 8 caracteres"
                  />
                  
                  <DashboardTextInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirma tu nueva contraseña"
                    type="password"
                    required
                    icon={<KeyIcon className="h-5 w-5" />}
                    error={
                      passwordData.newPassword !== passwordData.confirmPassword && 
                      passwordData.confirmPassword.length > 0
                        ? "Las contraseñas no coinciden"
                        : undefined
                    }
                  />
                </div>
                
                <div className="pt-2 text-sm text-[var(--color-text-secondary)]">
                  <p className="mb-1 font-medium">Tu contraseña debe contener:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Al menos 8 caracteres de longitud</li>
                    <li>Letras mayúsculas y minúsculas</li>
                    <li>Al menos un número</li>
                    <li>Al menos un caracter especial (recomendado)</li>
                  </ul>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <DashboardButton
                    type="submit"
                    loading={isLoadingPassword}
                    disabled={
                      isLoadingPassword || 
                      !passwordData.currentPassword || 
                      !passwordData.newPassword || 
                      !passwordData.confirmPassword ||
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    leftIcon={<KeyIcon className="h-5 w-5" />}
                  >
                    Cambiar Contraseña
                  </DashboardButton>
                </div>
              </form>
            </div>
            
            {/* Actividad de la Cuenta */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Actividad de la Cuenta
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Revisa la actividad reciente en tu cuenta
                  </p>
                </div>
                <Badge variant="info">Informativo</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-[var(--color-border)] pb-4">
                  <h4 className="text-sm font-medium text-[var(--color-text-main)] mb-2">
                    Último inicio de sesión
                  </h4>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <ClockIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-main)]">
                        {userDisplayData?.lastLogin}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Esta información ayuda a mantener segura tu cuenta
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text-main)] mb-2">
                    Sesión actual
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-main)]">
                            Dispositivo actual
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            Guatemala City, Guatemala • Activo ahora
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Activa</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <DashboardButton
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('Ver historial (función pendiente)')}
                    >
                      Ver historial de sesiones
                    </DashboardButton>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 🎯 PANEL DE ADMINISTRADOR - Simplificado */}
            {userIsAdmin && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900">
                      Panel de Administrador
                    </h3>
                    <p className="text-sm text-purple-700">
                      Opciones avanzadas disponibles para tu rol
                    </p>
                  </div>
                  <Badge variant="success">Admin</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">
                      Gestión de Usuarios
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Administra usuarios, roles y permisos del sistema
                    </p>
                    <DashboardButton 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/ml-admin/dashboard/users'}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Ir a Usuarios
                    </DashboardButton>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">
                      Configuración del Sistema
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Ajustes generales y configuración avanzada
                    </p>
                    <DashboardButton 
                      size="sm" 
                      variant="outline"
                      onClick={() => console.log('Configuración (función pendiente)')}
                    >
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Configuración
                    </DashboardButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;