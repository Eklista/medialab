// src/features/dashboard/components/ui/DashboardPlaceholder.tsx
import React from 'react';
import DashboardButton from './DashboardButton';
import { 
  ExclamationTriangleIcon,
  LockClosedIcon,
  WifiIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ServerIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export type PlaceholderType = 
  | 'loading'
  | 'no-permission'
  | 'empty'
  | 'error'
  | 'offline'
  | 'not-found'
  | 'maintenance'
  | 'unauthorized'
  | 'forbidden'
  | 'server-error'
  | 'timeout'
  | 'custom';

export interface DashboardPlaceholderProps {
  type: PlaceholderType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  // Action buttons
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
  };
  // Additional content
  children?: React.ReactNode;
  showBackground?: boolean;
  animated?: boolean;
}

// Configuraciones predefinidas para cada tipo
const PLACEHOLDER_CONFIGS: Record<PlaceholderType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor: string;
  bgColor: string;
}> = {
  loading: {
    icon: <ArrowPathIcon className="h-12 w-12 animate-spin" />,
    title: 'Cargando...',
    description: 'Por favor espera mientras cargamos la información.',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  'no-permission': {
    icon: <LockClosedIcon className="h-12 w-12" />,
    title: 'Sin Permisos',
    description: 'No tienes permisos para acceder a esta sección. Contacta al administrador si necesitas acceso.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50'
  },
  empty: {
    icon: <DocumentIcon className="h-12 w-12" />,
    title: 'No hay datos',
    description: 'No se encontraron elementos para mostrar. Puedes comenzar creando el primer elemento.',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-50'
  },
  error: {
    icon: <ExclamationTriangleIcon className="h-12 w-12" />,
    title: 'Error Inesperado',
    description: 'Ocurrió un error al cargar la información. Por favor intenta de nuevo.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  offline: {
    icon: <WifiIcon className="h-12 w-12" />,
    title: 'Sin Conexión',
    description: 'No hay conexión a internet. Verifica tu conexión e intenta de nuevo.',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50'
  },
  'not-found': {
    icon: <MagnifyingGlassIcon className="h-12 w-12" />,
    title: 'No Encontrado',
    description: 'El contenido que buscas no existe o ha sido eliminado.',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50'
  },
  maintenance: {
    icon: <ServerIcon className="h-12 w-12" />,
    title: 'En Mantenimiento',
    description: 'El sistema está en mantenimiento programado. Volveremos pronto.',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  unauthorized: {
    icon: <UserGroupIcon className="h-12 w-12" />,
    title: 'Acceso No Autorizado',
    description: 'Necesitas iniciar sesión para acceder a esta sección.',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50'
  },
  forbidden: {
    icon: <ShieldExclamationIcon className="h-12 w-12" />,
    title: 'Acceso Prohibido',
    description: 'Tu nivel de acceso no permite ver este contenido.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  'server-error': {
    icon: <ServerIcon className="h-12 w-12" />,
    title: 'Error del Servidor',
    description: 'El servidor no pudo procesar la solicitud. Intenta más tarde.',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  timeout: {
    icon: <ClockIcon className="h-12 w-12" />,
    title: 'Tiempo Agotado',
    description: 'La operación tardó demasiado tiempo. Por favor intenta de nuevo.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50'
  },
  custom: {
    icon: <InformationCircleIcon className="h-12 w-12" />,
    title: 'Información',
    description: 'Contenido personalizado.',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50'
  }
};

const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({
  type,
  title,
  description,
  icon,
  className = '',
  size = 'md',
  primaryAction,
  secondaryAction,
  children,
  showBackground = true,
  animated = true
}) => {
  const config = PLACEHOLDER_CONFIGS[type];
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'py-8 px-6',
      icon: 'h-8 w-8',
      title: 'text-base',
      description: 'text-sm',
      maxWidth: 'max-w-sm'
    },
    md: {
      container: 'py-12 px-8',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-base',
      maxWidth: 'max-w-md'
    },
    lg: {
      container: 'py-16 px-10',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-lg',
      maxWidth: 'max-w-lg'
    }
  };

  const currentSize = sizeConfig[size];

  return (
    <div className={`
      flex items-center justify-center min-h-[400px] w-full
      ${showBackground ? config.bgColor : ''}
      ${className}
    `}>
      <div className={`
        text-center ${currentSize.maxWidth} mx-auto ${currentSize.container}
        ${animated && type === 'loading' ? 'animate-pulse' : ''}
      `}>
        {/* Icon */}
        <div className={`
          mx-auto flex items-center justify-center mb-6
          ${currentSize.icon} ${config.iconColor}
          ${showBackground ? 'bg-white rounded-full p-4 shadow-sm' : ''}
        `}>
          {icon || config.icon}
        </div>
        
        {/* Title */}
        <h3 className={`
          font-semibold text-gray-900 mb-3
          ${currentSize.title}
        `}>
          {title || config.title}
        </h3>
        
        {/* Description */}
        <p className={`
          text-gray-600 mb-6 leading-relaxed
          ${currentSize.description}
        `}>
          {description || config.description}
        </p>
        
        {/* Custom Children Content */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}
        
        {/* Action Buttons */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {primaryAction && (
              <DashboardButton
                variant={primaryAction.variant || 'primary'}
                onClick={primaryAction.onClick}
                loading={primaryAction.loading}
                leftIcon={primaryAction.icon}
                className="w-full sm:w-auto"
              >
                {primaryAction.label}
              </DashboardButton>
            )}
            
            {secondaryAction && (
              <DashboardButton
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
                leftIcon={secondaryAction.icon}
                className="w-full sm:w-auto"
              >
                {secondaryAction.label}
              </DashboardButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Componentes especializados para casos comunes
export const LoadingPlaceholder: React.FC<Omit<DashboardPlaceholderProps, 'type'>> = (props) => (
  <DashboardPlaceholder type="loading" {...props} />
);

export const NoPermissionPlaceholder: React.FC<Omit<DashboardPlaceholderProps, 'type'>> = (props) => (
  <DashboardPlaceholder 
    type="no-permission" 
    primaryAction={{
      label: 'Contactar Administrador',
      onClick: () => window.location.href = 'mailto:admin@medialab.com',
      icon: <EnvelopeIcon className="h-4 w-4" />
    }}
    {...props} 
  />
);

export const EmptyStatePlaceholder: React.FC<Omit<DashboardPlaceholderProps, 'type'>> = (props) => (
  <DashboardPlaceholder type="empty" {...props} />
);

export const ErrorPlaceholder: React.FC<Omit<DashboardPlaceholderProps, 'type'> & {
  onRetry?: () => void;
}> = ({ onRetry, ...props }) => (
  <DashboardPlaceholder 
    type="error" 
    primaryAction={onRetry ? {
      label: 'Intentar de Nuevo',
      onClick: onRetry,
      icon: <ArrowPathIcon className="h-4 w-4" />
    } : undefined}
    {...props} 
  />
);

export const OfflinePlaceholder: React.FC<Omit<DashboardPlaceholderProps, 'type'> & {
  onRefresh?: () => void;
}> = ({ onRefresh, ...props }) => (
  <DashboardPlaceholder 
    type="offline" 
    primaryAction={onRefresh ? {
      label: 'Verificar Conexión',
      onClick: onRefresh,
      icon: <WifiIcon className="h-4 w-4" />
    } : undefined}
    {...props} 
  />
);

export const MaintenancePlaceholder: React.FC<Omit<DashboardPlaceholderProps, 'type'>> = (props) => (
  <DashboardPlaceholder type="maintenance" {...props} />
);

// Hook para determinar automáticamente el tipo de placeholder
export const usePlaceholderType = (
  isLoading: boolean,
  hasError: boolean,
  hasPermission: boolean,
  isOnline: boolean = navigator.onLine,
  isEmpty: boolean = false
): PlaceholderType | null => {
  if (isLoading) return 'loading';
  if (!isOnline) return 'offline';
  if (hasError) return 'error';
  if (!hasPermission) return 'no-permission';
  if (isEmpty) return 'empty';
  return null;
};

export default DashboardPlaceholder;