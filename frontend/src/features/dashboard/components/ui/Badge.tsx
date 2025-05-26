// src/features/dashboard/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  pulse?: boolean;
  closable?: boolean;
  onClose?: () => void;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'left',
  rounded = 'full',
  pulse = false,
  closable = false,
  onClose,
  dot = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'secondary':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'success':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'danger':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'info':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
      case 'neutral':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'gradient':
        return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'text-xs px-2 py-0.5 gap-1';
      case 'sm':
        return 'text-xs px-2.5 py-1 gap-1.5';
      case 'md':
        return 'text-sm px-3 py-1.5 gap-2';
      case 'lg':
        return 'text-base px-4 py-2 gap-2.5';
      default:
        return 'text-sm px-3 py-1.5 gap-2';
    }
  };

  const getRoundedClasses = () => {
    switch (rounded) {
      case 'sm':
        return 'rounded-sm';
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      case 'full':
        return 'rounded-full';
      default:
        return 'rounded-full';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs':
        return 'h-3 w-3';
      case 'sm':
        return 'h-3.5 w-3.5';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const renderIcon = (iconElement: React.ReactNode) => {
    if (!iconElement) return null;
    
    return (
      <span className={`${getIconSize()} flex items-center justify-center flex-shrink-0`}>
        {iconElement}
      </span>
    );
  };

  const renderCloseButton = () => {
    if (!closable) return null;

    return (
      <button
        type="button"
        onClick={onClose}
        className={`
          ${getIconSize()} 
          flex items-center justify-center flex-shrink-0
          hover:bg-black hover:bg-opacity-20 rounded-full
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current
        `}
        aria-label="Cerrar"
      >
        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    );
  };

  // Dot badge (just a small circle)
  if (dot) {
    return (
      <span 
        className={`
          inline-block w-2 h-2 rounded-full
          ${getVariantClasses().split(' ').slice(0, 1).join(' ')} // Only background color
          ${pulse ? 'animate-pulse' : ''}
          ${className}
        `}
      />
    );
  }

  return (
    <span 
      className={`
        inline-flex items-center font-medium
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${getRoundedClasses()}
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-200 ease-in-out
        ${className}
      `}
    >
      {icon && iconPosition === 'left' && renderIcon(icon)}
      
      <span className={children ? 'truncate' : ''}>{children}</span>
      
      {icon && iconPosition === 'right' && renderIcon(icon)}
      
      {renderCloseButton()}
    </span>
  );
};

// Badge Group component for displaying multiple badges
interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
  showMore?: boolean;
  spacing?: 'tight' | 'normal' | 'loose';
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  children,
  className = '',
  max,
  showMore = true,
  spacing = 'normal'
}) => {
  const badges = React.Children.toArray(children);
  const visibleBadges = max ? badges.slice(0, max) : badges;
  const hiddenCount = max ? badges.length - max : 0;

  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3'
  };

  return (
    <div className={`flex flex-wrap items-center ${spacingClasses[spacing]} ${className}`}>
      {visibleBadges}
      {hiddenCount > 0 && showMore && (
        <Badge variant="secondary" size="sm">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
};

// Status Badge with predefined status styles
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'draft';
  size?: BadgeProps['size'];
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  showIcon = true
}) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      label: 'Activo',
      icon: (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    inactive: {
      variant: 'secondary' as const,
      label: 'Inactivo',
      icon: (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    pending: {
      variant: 'warning' as const,
      label: 'Pendiente',
      icon: (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    completed: {
      variant: 'success' as const,
      label: 'Completado',
      icon: (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    cancelled: {
      variant: 'danger' as const,
      label: 'Cancelado',
      icon: (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    draft: {
      variant: 'neutral' as const,
      label: 'Borrador',
      icon: (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      )
    }
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
      icon={showIcon ? config.icon : undefined}
    >
      {config.label}
    </Badge>
  );
};

export default Badge;