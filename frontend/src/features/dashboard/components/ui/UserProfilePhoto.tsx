// src/features/dashboard/components/ui/UserProfilePhoto.tsx
import React from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getBaseUrl } from '../../../../services/api';

export interface UserProfilePhotoProps {
  /** Tamaño del avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Usuario específico */
  user?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    profile_image?: string;
  };
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
}

const UserProfilePhoto: React.FC<UserProfilePhotoProps> = ({
  size = 'md',
  user,
  className = '',
  clickable = false,
  onClick,
  showOnlineStatus = false,
  isOnline = false
}) => {
  const { state } = useAuth();
  
  // Usar el usuario pasado como prop o el usuario actual
  const currentUser = user || state.user;
  
  // Función para obtener la URL completa de la imagen (copiada de tu código)
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
  
  // Función para obtener las iniciales
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
  const profileImage = currentUser?.profileImage || currentUser?.profile_image;
  const imageUrl = getFullImageUrl(profileImage);
  
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
  
  return (
    <div 
      className={baseClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${currentUser?.firstName || 'Usuario'} ${currentUser?.lastName || ''}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Si falla la carga de la imagen, ocultar y mostrar iniciales
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.className = 'text-[var(--color-text-main)] select-none';
              span.textContent = getInitials();
              parent.appendChild(span);
            }
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