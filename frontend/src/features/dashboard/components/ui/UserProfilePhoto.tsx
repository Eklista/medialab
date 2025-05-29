// src/features/dashboard/components/ui/UserProfilePhoto.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useAppData } from '../../../../context/AppDataContext'; // 🆕 AGREGADO
import { userService } from '../../../../services';
import type { User } from '../../../../services/users/users.service';

export interface UserProfilePhotoProps {
  /** Tamaño del avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Usuario específico con datos completos */
  user?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    profile_image?: string;
  };
  /** ID del usuario - si se proporciona, buscará los datos del backend */
  userId?: number;
  /** Clase CSS adicional */
  className?: string;
  /** Si debe ser clickeable */
  clickable?: boolean;
  /** Función onClick personalizada */
  onClick?: () => void;
  /** Mostrar indicador online */
  showOnlineStatus?: boolean;
  /** Estado online personalizado */
  isOnline?: boolean;
  /** Mostrar loading placeholder mientras carga */
  showLoading?: boolean;
}

// Cache simple para usuarios ya consultados
const userCache = new Map<number, User>();

const UserProfilePhoto: React.FC<UserProfilePhotoProps> = ({
  size = 'md',
  user,
  userId,
  className = '',
  clickable = false,
  onClick,
  showOnlineStatus = false,
  isOnline = false,
  showLoading = true
}) => {
  const { state } = useAuth();
  const { user: appDataUser } = useAppData(); // 🆕 AGREGADO
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Función para obtener usuario desde el backend
  useEffect(() => {
    // Solo buscar si tenemos userId pero no user
    if (userId && !user) {
      // Verificar cache primero
      if (userCache.has(userId)) {
        setFetchedUser(userCache.get(userId)!);
        return;
      }
      
      // Buscar desde backend
      const fetchUser = async () => {
        try {
          setIsLoading(true);
          setHasError(false);
          
          const userData = await userService.getUserById(userId);
          
          // Guardar en cache
          userCache.set(userId, userData);
          setFetchedUser(userData);
        } catch (error) {
          console.error(`Error al cargar usuario con ID ${userId}:`, error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUser();
    }
  }, [userId, user]);
  
  // 🆕 FIXED: Priorizar AppDataContext sobre AuthContext
  const currentUser = user || fetchedUser || appDataUser || state.user;
  
  // Función para obtener la URL completa de la imagen - CORREGIDA
  const getFullImageUrl = (imagePath: string | undefined | null): string => {
    if (!imagePath || imagePath.trim() === '') return '';
    
    // Si la ruta ya comienza con http:// o https://, asumimos que es una URL completa
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // 🔧 CORREGIDO: Construir URL según el entorno
    let baseUrl: string;
    
    if (import.meta.env.MODE === 'production') {
      // En producción, usar el dominio actual
      baseUrl = window.location.origin;
    } else {
      // En desarrollo, usar la URL del backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      baseUrl = apiUrl.replace('/api/v1', '');
    }
    
    // Asegurar que la ruta comience con '/'
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${path}`;
  };
  
  // Función para obtener las iniciales del usuario
  const getInitials = () => {
    if (!currentUser) return 'U';
    
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };
  
  // Configuración de tamaños
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl'
  };
  
  // Configuración de tamaño del indicador online
  const indicatorSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4'
  };
  
  // Obtener la imagen del usuario
  const profileImage = currentUser?.profileImage || (currentUser as any)?.profile_image || null;
  const imageUrl = getFullImageUrl(profileImage);
  
  // 🔇 DEBUG: Console.log comentado
  // React.useEffect(() => {
  //   console.log('🖼️ UserProfilePhoto Debug - ALWAYS:', {
  //     hasUser: !!currentUser,
  //     profileImage: profileImage,
  //     constructedUrl: imageUrl,
  //     environment: import.meta.env.MODE,
  //     windowOrigin: window.location.origin,
  //     apiUrl: import.meta.env.VITE_API_URL,
  //     userObject: currentUser,
  //     userId: userId,
  //     isLoading: isLoading,
  //     hasError: hasError
  //   });
  // }, [currentUser, profileImage, imageUrl, userId, isLoading, hasError]);
  
  // 🆕 DEBUG TEMPORAL - para ver qué datos llegan
  React.useEffect(() => {
    console.log('🖼️ UserProfilePhoto Debug Sources:', {
      propUser: user,
      fetchedUser: fetchedUser,
      appDataUser: appDataUser,
      authUser: state.user,
      finalCurrentUser: currentUser,
      profileImage: profileImage,
      imageUrl: imageUrl
    });
  }, [user, fetchedUser, appDataUser, state.user, currentUser, profileImage, imageUrl]);
  
  // Clases base
  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-full
    flex items-center justify-center font-semibold
    relative overflow-hidden
    bg-[var(--color-accent-1)]
    ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `;
  
  // Indicador de estado online
  const renderOnlineIndicator = () => {
    if (!showOnlineStatus) return null;
    
    return (
      <div 
        className={`
          absolute bottom-0 right-0 
          ${indicatorSizes[size]}
          ${isOnline ? 'bg-green-400' : 'bg-gray-400'}
          border-2 border-white rounded-full
        `}
      />
    );
  };
  
  // 🔧 MEJORADO: Manejo de errores de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.warn('🚫 Error cargando imagen:', target.src);
    target.style.display = 'none';
    
    const parent = target.parentElement;
    if (parent && !parent.querySelector('.fallback-initials')) {
      const span = document.createElement('span');
      span.className = 'text-[var(--color-text-main)] select-none fallback-initials';
      span.textContent = getInitials();
      parent.appendChild(span);
    }
  };
  
  // Loading placeholder
  if (isLoading && showLoading && !currentUser) {
    return (
      <div 
        className={`${baseClasses} bg-gray-200 animate-pulse`}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        <div className="w-full h-full bg-gray-300 rounded-full"></div>
        {renderOnlineIndicator()}
      </div>
    );
  }
  
  // Error state - mostrar iniciales genéricas
  if (hasError || (!currentUser && userId)) {
    return (
      <div 
        className={`${baseClasses} bg-gray-400`}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        title={hasError ? 'Error al cargar usuario' : 'Usuario no encontrado'}
      >
        <span className="text-white select-none">?</span>
        {renderOnlineIndicator()}
      </div>
    );
  }

  return (
    <div 
      className={baseClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : undefined}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${currentUser?.firstName || 'Usuario'} ${currentUser?.lastName || ''}`}
          className="h-full w-full object-cover"
          onError={handleImageError}
          onLoad={() => {
            console.log('✅ Imagen cargada exitosamente:', imageUrl);
          }}
        />
      ) : (
        <span className="text-[var(--color-text-main)] select-none">
          {getInitials()}
        </span>
      )}
      
      {renderOnlineIndicator()}
    </div>
  );
};

export default UserProfilePhoto;