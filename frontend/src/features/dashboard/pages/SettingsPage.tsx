// src/features/dashboard/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardTextInput from '../components/ui/DashboardTextInput';
import UserProfilePhoto from '../components/ui/UserProfilePhoto';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import { useAuth } from '../../auth/hooks/useAuth';
import { authService, userService } from '../../../services';
import { UserUpdateRequest } from '../../../services/users.service';
import { getBaseUrl } from '../../../services/api';
import fileUploadService from '../../../services/fileUpload.service';
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
import { formatFullDate, formatDateTime } from '../../../utils/dateUtils';

// Importar imágenes
import heroBanner from '../../../assets/images/medialab-hero.jpg';

// Interfaz extendida del usuario con campos adicionales
interface ExtendedUser {
  id: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string | null;    
  bannerImage?: string | null;     
  phone?: string;
  birth_date?: string | null;
  roles?: string[];
  areas?: Array<{id: number, name: string}>;
  isActive?: boolean;
  joinDate?: string | null;         
  lastLogin?: string | null;       
  username?: string;
}

const SettingsPage: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;
  
  // Estado para datos completos del usuario
  const [extendedUser, setExtendedUser] = useState<ExtendedUser | null>(null);
  
  // Estado para formularios
  const [profileData, setProfileData] = useState({
    phone: '',
    birthday: '',
    profileImage: '',
    bannerImage: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estado para manejo de imágenes
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedBannerImage, setSelectedBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);
  
  // Estado para campos de solo lectura
  const [readOnlyFields, setReadOnlyFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    joinDate: '',
    lastLogin: '',
    isActive: false,
    role: ''
  });
  
  // Estado para controlar el progreso
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
  
  // Calcular completitud del perfil
  const calculateProfileCompleteness = (): number => {
    if (!extendedUser) return 0;
    
    let totalFields = 4; // Campos básicos (nombre, email, rol, área)
    let completedFields = 4; // Estos campos son obligatorios
    
    // Verificar campos opcionales
    if (extendedUser.profileImage || previewProfileImage) completedFields += 1;
    if (profileData.phone) completedFields += 1;
    if (profileData.birthday) completedFields += 1;
    if (extendedUser.bannerImage || previewBannerImage) completedFields += 1;
    
    totalFields += 4; // Añadir los campos opcionales al total
    
    return Math.round((completedFields / totalFields) * 100);
  };
  
  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      if (user && user.id) {
        try {
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          const userData = await userService.getUserById(userId);
          
          // Crear usuario extendido con todos los campos
          const extendedUserData: ExtendedUser = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName || userData.first_name,
            lastName: userData.lastName || userData.last_name,
            profileImage: userData.profileImage || userData.profile_image,
            bannerImage: userData.bannerImage || userData.banner_image,
            phone: userData.phone,
            birth_date: userData.birth_date,
            roles: userData.roles,
            areas: userData.areas,
            isActive: userData.isActive || userData.is_active,
            joinDate: userData.joinDate || userData.join_date,
            lastLogin: userData.lastLogin || userData.last_login,
            username: userData.username
          };
          
          setExtendedUser(extendedUserData);
          
          // Actualizar el estado con los datos del usuario
          setProfileData({
            phone: userData.phone || '',
            birthday: userData.birth_date ? new Date(userData.birth_date).toISOString().split('T')[0] : '',
            profileImage: userData.profileImage || userData.profile_image || '',
            bannerImage: userData.bannerImage || userData.banner_image || ''
          });
          
          // Determinar el rol del usuario
          let roleDisplay = 'Usuario';
          if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
            roleDisplay = userData.roles.join(', ');
          }
          
          // Campos de solo lectura
          setReadOnlyFields({
            firstName: userData.firstName || userData.first_name || '',
            lastName: userData.lastName || userData.last_name || '',
            email: userData.email || '',
            username: userData.username || userData.email?.split('@')[0] || '',
            joinDate: userData.joinDate || userData.join_date ? 
              formatFullDate(userData.joinDate || userData.join_date) : 
              formatFullDate(new Date().toISOString()),
            lastLogin: userData.lastLogin || userData.last_login ? 
              formatDateTime(userData.lastLogin || userData.last_login) : 
              formatDateTime(new Date().toISOString()),
            isActive: !!userData.isActive || !!userData.is_active,
            role: roleDisplay
          });
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error);
        }
      }
    };
    
    loadUserData();
  }, [user]);
  
  // Manejar cambios en el formulario de perfil
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambio de archivos
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
  
  // Manejar envío del formulario de perfil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id || !extendedUser) return;
    
    setIsLoadingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    
    try {
      const updateData: Partial<UserUpdateRequest> = {};
      
      // Campos básicos
      if (profileData.phone !== (extendedUser.phone || '')) updateData.phone = profileData.phone;
      
      if (profileData.birthday) {
        if (profileData.birthday !== extendedUser.birth_date) {
          updateData.birthDate = profileData.birthday;
        }
      } else if (extendedUser.birth_date) {
        updateData.birthDate = "";
      }

      // Subir imagen de perfil si se seleccionó
      if (selectedProfileImage) {
        try {
          const profileImageUrl = await fileUploadService.uploadImage(selectedProfileImage, 'profile');
          updateData.profileImage = profileImageUrl;
        } catch (imageError) {
          console.error('Error al subir la imagen de perfil:', imageError);
          setProfileError('No se pudo subir la imagen de perfil. Por favor, inténtalo de nuevo.');
          setIsLoadingProfile(false);
          return;
        }
      }
      
      // Subir imagen de banner si se seleccionó
      if (selectedBannerImage) {
        try {
          const bannerImageUrl = await fileUploadService.uploadImage(selectedBannerImage, 'banner');
          updateData.bannerImage = bannerImageUrl;
        } catch (imageError) {
          console.error('Error al subir la imagen de banner:', imageError);
          setProfileError('No se pudo subir la imagen de banner. Por favor, inténtalo de nuevo.');
          setIsLoadingProfile(false);
          return;
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        await userService.updateUser(userId, updateData);
        
        // Limpiar archivos seleccionados
        setSelectedProfileImage(null);
        setSelectedBannerImage(null);
        if (previewProfileImage) URL.revokeObjectURL(previewProfileImage);
        if (previewBannerImage) URL.revokeObjectURL(previewBannerImage);
        setPreviewProfileImage(null);
        setPreviewBannerImage(null);
        
        setProfileSuccess('Perfil actualizado correctamente');
        
        // Recargar después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setProfileError('No se detectaron cambios en la información');
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  // Manejar envío del formulario de cambio de contraseña
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setIsLoadingPassword(false);
    }
  };
  
  // Manejar cambios en opciones de seguridad
  const handleSecurityOptionChange = (option: keyof typeof securityOptions, value: boolean) => {
    setSecurityOptions((prev) => ({ ...prev, [option]: value }));
    
    const message = document.getElementById('security-message');
    if (message) {
      message.textContent = value 
        ? `${option === 'twoFactorEnabled' ? 'La autenticación de dos factores' : 'Esta opción'} estará disponible próximamente. Se ha registrado tu preferencia.`
        : `Has desactivado ${option === 'twoFactorEnabled' ? 'la autenticación de dos factores' : 'esta opción'}.`;
      message.style.display = 'block';
      
      setTimeout(() => {
        message.style.display = 'none';
      }, 3000);
    }
  };

  // Obtener URL completa para imágenes
  const getFullImageUrl = (imagePath: string | undefined | null): string => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = new URL(getBaseUrl()).origin;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${path}`;
  };
  
  const completeness = calculateProfileCompleteness();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Configuración de Cuenta</h1>
          <p className="text-[var(--color-text-secondary)]">Administra tus datos personales y preferencias de seguridad</p>
        </div>
        
        {/* Mensaje de notificación */}
        <div id="security-message" className="hidden p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna lateral con tarjetas de información */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de Perfil */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <UserProfilePhoto
                    user={{
                      id: typeof user?.id === 'string' ? parseInt(user.id) : user?.id || 0,
                      firstName: readOnlyFields.firstName,
                      lastName: readOnlyFields.lastName,
                      profileImage: previewProfileImage || extendedUser?.profileImage || undefined
                    }}
                    size="2xl"
                  />
                </div>
                
                <h3 className="text-xl font-semibold text-[var(--color-text-main)] mb-1">
                  {readOnlyFields.firstName} {readOnlyFields.lastName}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-2">{readOnlyFields.email}</p>
                
                <Badge 
                  variant={readOnlyFields.isActive ? 'success' : 'secondary'}
                  className="mt-2"
                >
                  {readOnlyFields.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                
                <div className="mt-4 w-full text-left">
                  <div className="text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3 mt-3">
                    <div className="flex justify-between my-2">
                      <span>Usuario:</span>
                      <span className="font-medium text-[var(--color-text-main)]">{readOnlyFields.username}</span>
                    </div>
                    <div className="flex justify-between my-2">
                      <span>Rol:</span>
                      <span className="font-medium text-[var(--color-text-main)]">{readOnlyFields.role}</span>
                    </div>
                    <div className="flex justify-between my-2">
                      <span>Fecha de ingreso:</span>
                      <span className="font-medium text-[var(--color-text-main)] text-xs">{readOnlyFields.joinDate}</span>
                    </div>
                    <div className="flex justify-between my-2">
                      <span>Último acceso:</span>
                      <span className="font-medium text-[var(--color-text-main)] text-xs">{readOnlyFields.lastLogin}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Panel de completitud del perfil */}
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
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Progreso general</span>
                    <span className="text-sm font-bold text-[var(--color-text-main)]">{completeness}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[var(--color-accent-1)] to-[var(--color-hover)] h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${completeness}%` }}
                    ></div>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="ml-2 text-[var(--color-text-main)]">Información básica</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${(extendedUser?.profileImage || previewProfileImage) ? 'text-green-500' : 'text-gray-400'}`}>
                      {(extendedUser?.profileImage || previewProfileImage) ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
                    </div>
                    <span className={`ml-2 ${(extendedUser?.profileImage || previewProfileImage) ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Foto de perfil
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${profileData.phone ? 'text-green-500' : 'text-gray-400'}`}>
                      {profileData.phone ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
                    </div>
                    <span className={`ml-2 ${profileData.phone ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Teléfono
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${profileData.birthday ? 'text-green-500' : 'text-gray-400'}`}>
                      {profileData.birthday ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
                    </div>
                    <span className={`ml-2 ${profileData.birthday ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Fecha de nacimiento
                    </span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className={`h-5 w-5 flex-shrink-0 ${(extendedUser?.bannerImage || previewBannerImage) ? 'text-green-500' : 'text-gray-400'}`}>
                      {(extendedUser?.bannerImage || previewBannerImage) ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
                    </div>
                    <span className={`ml-2 ${(extendedUser?.bannerImage || previewBannerImage) ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}>
                      Imagen de banner
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Tarjeta de Opciones de Seguridad */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">Opciones de Seguridad</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Configura tus preferencias de seguridad</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">Autenticación de dos factores</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Aumenta la seguridad de tu cuenta</p>
                  </div>
                  <Switch 
                    checked={securityOptions.twoFactorEnabled}
                    onChange={(checked) => handleSecurityOptionChange('twoFactorEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">Notificaciones por email</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Recibe alertas importantes</p>
                  </div>
                  <Switch 
                    checked={securityOptions.emailNotifications}
                    onChange={(checked) => handleSecurityOptionChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">Alertas de inicio de sesión</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Notificaciones de nuevos accesos</p>
                  </div>
                  <Switch 
                    checked={securityOptions.loginAlerts}
                    onChange={(checked) => handleSecurityOptionChange('loginAlerts', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna principal con formularios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal Editable */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">Información Personal</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Actualiza tu información de perfil</p>
                </div>
                <Badge variant="primary">Editable</Badge>
              </div>
              
              {/* Imágenes de perfil y banner */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-3">
                  Imagen de banner
                </label>
                <div className="border border-[var(--color-border)] rounded-lg p-3 mb-4">
                  <div className="h-32 w-full rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={previewBannerImage || (extendedUser?.bannerImage ? getFullImageUrl(extendedUser.bannerImage) : heroBanner)}
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
                        accept="image/jpeg, image/png, image/gif"
                        onChange={(e) => handleFileChange(e, 'banner')}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-3">
                  Foto de perfil
                </label>
                <div className="flex items-center gap-4">
                  <UserProfilePhoto
                    user={{
                      id: typeof user?.id === 'string' ? parseInt(user.id) : user?.id || 0,
                      firstName: readOnlyFields.firstName,
                      lastName: readOnlyFields.lastName,
                      profileImage: previewProfileImage || extendedUser?.profileImage || undefined
                    }}
                    size="xl"
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
              
              {/* Campos de solo lectura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Nombre
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {readOnlyFields.firstName || 'No especificado'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Apellido
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {readOnlyFields.lastName || 'No especificado'}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Correo electrónico
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)] flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-[var(--color-text-secondary)] mr-2" />
                  {readOnlyFields.email || 'No especificado'}
                </div>
              </div>
              
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
                    helperText="Este número se utilizará solo para notificaciones importantes"
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
            
            {/* Información de solo lectura */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">Información de la Cuenta</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Datos de la cuenta administrados por el sistema</p>
                </div>
                <Badge variant="secondary">Solo lectura</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Nombre de usuario
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {readOnlyFields.username}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Rol asignado
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {readOnlyFields.role}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Fecha de ingreso
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {readOnlyFields.joinDate}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Estado de la cuenta
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--color-text-main)]">
                    {readOnlyFields.isActive ? 'Activa' : 'Inactiva'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Formulario de Cambio de Contraseña */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">Cambiar Contraseña</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
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
                    <li>Al menos un caracter especial</li>
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
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">Actividad de la Cuenta</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Revisa la actividad reciente en tu cuenta</p>
                </div>
                <Badge variant="info">Informativo</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-[var(--color-border)] pb-4">
                  <h4 className="text-sm font-medium text-[var(--color-text-main)] mb-2">Último inicio de sesión</h4>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <ClockIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-main)]">{readOnlyFields.lastLogin}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Esta información ayuda a mantener segura tu cuenta</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text-main)] mb-2">Sesiones activas</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-main)]">Dispositivo actual</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Guatemala City, Guatemala • Hace unos minutos</p>
                        </div>
                      </div>
                      <Badge variant="success">Activa</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <DashboardButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const message = document.getElementById('security-message');
                        if (message) {
                          message.textContent = "Esta función estará disponible próximamente";
                          message.style.display = 'block';
                          
                          setTimeout(() => {
                            message.style.display = 'none';
                          }, 3000);
                        }
                      }}
                    >
                      Ver todas las sesiones
                    </DashboardButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;