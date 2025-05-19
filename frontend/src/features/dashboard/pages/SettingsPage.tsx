// src/features/dashboard/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardCard from '../components/ui/DashboardCard';
import DashboardButton from '../components/ui/DashboardButton';
import DashboardTextInput from '../components/ui/DashboardTextInput';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import ApiErrorHandler from '../../../components/common/ApiErrorHandler';
import { useAuth } from '../../auth/hooks/useAuth';
import { authService, userService } from '../../../services';
import { getBaseUrl } from '../../../services/api';
import { 
  UserIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  EnvelopeIcon, 
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { formatFullDate, formatDateTime } from '../../../utils/dateUtils';

const SettingsPage: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;
  
  // Estado para formularios - solo el teléfono es editable
  const [profileData, setProfileData] = useState({
    phone: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
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
  
  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      if (user && user.id) {
        try {
          // Obtener datos completos directamente del API
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          const userData = await userService.getUserById(userId);
          console.log("Datos completos del usuario:", userData);
          
          // Actualizar el estado con el teléfono del usuario
          setProfileData({
            phone: userData.phone || ''
          });
          
          // Determinar el rol del usuario - puede ser un string o un array
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
  
  // Manejar cambios en el formulario de perfil (solo teléfono)
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Manejar envío del formulario de perfil (solo teléfono)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return;
    
    setIsLoadingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    
    try {
      // Actualizar usuario - solo el teléfono es editable
      const userData = {
        phone: profileData.phone
      };
      
      // Convertimos el ID según sea necesario
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      await userService.updateUser(userId, userData);
      
      setProfileSuccess('Información actualizada correctamente');
      
      // Recargar la página después de 2 segundos para mostrar la información actualizada
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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
      // Validaciones
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }
      
      if (passwordData.newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      
      // Cambiar contraseña usando el servicio existente
      await authService.changePassword(
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      
      // Limpiar formulario
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
    
    // Ejemplo: mostrar mensaje sobre funcionalidad futura
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
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configuración de Cuenta</h1>
        <p className="text-gray-600">Administra tus datos personales y preferencias de seguridad</p>
      </div>
      
      {/* Mensaje de notificación para opciones de seguridad */}
      <div id="security-message" className="hidden mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna lateral con tarjetas de información */}
        <div className="md:col-span-1 space-y-6">
          {/* Tarjeta de Perfil */}
          <DashboardCard>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img 
                    src={getFullImageUrl(user.profileImage)} 
                    alt={`${readOnlyFields.firstName} ${readOnlyFields.lastName}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-400 text-white text-xl font-semibold">${readOnlyFields.firstName?.charAt(0) || ''}${readOnlyFields.lastName?.charAt(0) || ''}</div>`;
                    }}
                  />
                ) : (
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-1">
                {readOnlyFields.firstName} {readOnlyFields.lastName}
              </h3>
              <p className="text-gray-500 text-sm mb-2">{readOnlyFields.email}</p>
              
              <Badge 
                variant={readOnlyFields.isActive ? 'success' : 'secondary'}
                className="mt-2"
              >
                {readOnlyFields.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              
              <div className="mt-4 w-full text-left">
                <div className="text-sm text-gray-500 border-t pt-3 mt-3">
                  <div className="flex justify-between my-2">
                    <span>Usuario:</span>
                    <span className="font-medium text-gray-700">{readOnlyFields.username}</span>
                  </div>
                  <div className="flex justify-between my-2">
                    <span>Rol:</span>
                    <span className="font-medium text-gray-700">{readOnlyFields.role}</span>
                  </div>
                  <div className="flex justify-between my-2">
                    <span>Fecha de ingreso:</span>
                    <span className="font-medium text-gray-700">{readOnlyFields.joinDate}</span>
                  </div>
                  <div className="flex justify-between my-2">
                    <span>Último acceso:</span>
                    <span className="font-medium text-gray-700">{readOnlyFields.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>
          
          {/* Tarjeta de Opciones de Seguridad */}
          <DashboardCard
            title="Opciones de Seguridad"
            subtitle="Configura tus preferencias de seguridad"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Autenticación de dos factores</p>
                  <p className="text-xs text-gray-500">Aumenta la seguridad de tu cuenta</p>
                </div>
                <Switch 
                  checked={securityOptions.twoFactorEnabled}
                  onChange={(checked) => handleSecurityOptionChange('twoFactorEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Notificaciones por email</p>
                  <p className="text-xs text-gray-500">Recibe alertas importantes</p>
                </div>
                <Switch 
                  checked={securityOptions.emailNotifications}
                  onChange={(checked) => handleSecurityOptionChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Alertas de inicio de sesión</p>
                  <p className="text-xs text-gray-500">Notificaciones de nuevos accesos</p>
                </div>
                <Switch 
                  checked={securityOptions.loginAlerts}
                  onChange={(checked) => handleSecurityOptionChange('loginAlerts', checked)}
                />
              </div>
            </div>
          </DashboardCard>
        </div>
        
        {/* Columna principal con formularios */}
        <div className="md:col-span-2 space-y-6">
          {/* Información Personal - Solo lectura */}
          <DashboardCard
            title="Información Personal"
            subtitle="Tus datos de contacto y perfil"
            headerAction={
              <Badge variant="info">
                Información Privada
              </Badge>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {readOnlyFields.firstName || 'No especificado'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {readOnlyFields.lastName || 'No especificado'}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                {readOnlyFields.email || 'No especificado'}
              </div>
            </div>
            
            {profileError && (
              <ApiErrorHandler
                error={profileError}
                onRetry={() => setProfileError(null)}
                resourceName="tu información personal"
              />
            )}
            
            {profileSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                <p className="font-medium">{profileSuccess}</p>
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit}>
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
              
              <div className="mt-6 flex justify-end">
                <DashboardButton
                  type="submit"
                  loading={isLoadingProfile}
                  disabled={isLoadingProfile}
                  leftIcon={<UserIcon className="h-5 w-5" />}
                >
                  Actualizar Teléfono
                </DashboardButton>
              </div>
            </form>
          </DashboardCard>
          
          {/* Formulario de Cambio de Contraseña */}
          <DashboardCard
            title="Cambiar Contraseña"
            subtitle="Actualiza tu contraseña regularmente para mantener tu cuenta segura"
            headerAction={
              <Badge variant="warning">
                Seguridad
              </Badge>
            }
          >
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
              
              <div className="pt-2 text-sm text-gray-600">
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
          </DashboardCard>
          
          {/* Actividad de la Cuenta */}
          <DashboardCard
            title="Actividad de la Cuenta"
            subtitle="Revisa la actividad reciente en tu cuenta"
            headerAction={
              <Badge variant="secondary">
                Informativo
              </Badge>
            }
          >
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Último inicio de sesión</h4>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{readOnlyFields.lastLogin}</p>
                    <p className="text-xs text-gray-500">Esta información ayuda a mantener segura tu cuenta</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Sesiones activas</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Dispositivo actual</p>
                        <p className="text-xs text-gray-500">Guatemala City, Guatemala • Hace unos minutos</p>
                      </div>
                    </div>
                    <Badge variant="success">Activa</Badge>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <DashboardButton
                    variant="secondary"
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
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;