// src/features/dashboard/components/layout/Sidebar.tsx - UI mejorada según imagen

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
import UserProfilePhoto from '../ui/UserProfilePhoto';
import { useAuth } from '../../../auth/hooks/useAuth';
import { UserRole } from '../../../auth/types/auth.types';
import { 
  HomeIcon, 
  FilmIcon, 
  AcademicCapIcon, 
  MicrophoneIcon, 
  Cog6ToothIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  WrenchIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/solid';

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
}

// Interfaz para elementos del sidebar (mantener original)
interface SidebarItemConfig {
  title: string;
  path?: string;
  icon: React.ReactNode;
  children?: SidebarItemConfig[];
  isOpen?: boolean;
  requiredPermission?: string | null;
  requiredPermissions?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, collapsed = false }) => {
  const location = useLocation();
  const { state, hasPermission, hasAnyPermission } = useAuth();
  
  // Estado para manejar la apertura/cierre del menú de administración
  const [menuState, setMenuState] = useState({
    adminOpen: false
  });
  
  // Función para alternar el menú de administración
  const toggleAdminMenu = () => {
    setMenuState(prev => ({
      ...prev,
      adminOpen: !prev.adminOpen
    }));
  };
  
  // Función para verificar si hay items activos en administración
  const hasActiveAdminItem = () => {
    const adminPaths = ['/dashboard/users', '/dashboard/app-settings'];
    return adminPaths.some(path => location.pathname.startsWith(path));
  };
  
  // Auto-abrir menú de administración si hay un item activo
  React.useEffect(() => {
    if (hasActiveAdminItem() && !menuState.adminOpen) {
      setMenuState(prev => ({ ...prev, adminOpen: true }));
    }
  }, [location.pathname]);
  
  // Configuración del sidebar con permisos - ADMINISTRACIÓN MOVIDA AL FINAL
  const sidebarItems: SidebarItemConfig[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <HomeIcon className="h-5 w-5" />,
      requiredPermission: null // Siempre visible
    },
    {
      title: 'Producción',
      path: '/dashboard/production',
      icon: <FilmIcon className="h-5 w-5" />,
      requiredPermission: 'request_view'
    },
    {
      title: 'Cursos',
      path: '/dashboard/courses',
      icon: <AcademicCapIcon className="h-5 w-5" />,
      requiredPermission: 'request_view'
    },
    {
      title: 'Podcasts',
      path: '/dashboard/podcast',
      icon: <MicrophoneIcon className="h-5 w-5" />,
      requiredPermission: 'request_view'
    },
    {
      title: 'Solicitudes',
      path: '/dashboard/requests',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      requiredPermission: 'request_view'
    },
    {
      title: 'Configuración General',
      path: '/dashboard/settings',
      icon: <UserIcon className="h-5 w-5" />,
      requiredPermission: 'profile_edit'
    },
    // Administración movida al final
    {
      title: 'Administración',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      isOpen: menuState.adminOpen,
      requiredPermissions: ['user_view', 'role_view', 'area_view', 'department_view', 'service_view'],
      children: [
        {
          title: 'Usuarios',
          path: '/dashboard/users',
          icon: <UserGroupIcon className="h-5 w-5" />,
          requiredPermission: 'user_view'
        },
        {
          title: 'Configuración de App',
          path: '/dashboard/app-settings',
          icon: <WrenchIcon className="h-5 w-5" />,
          requiredPermissions: ['role_view', 'area_view', 'service_view']
        }
      ]
    }
  ];
  
  // Filtrar los items según los permisos (MANTENER ORIGINAL)
  const filteredSidebarItems = sidebarItems.filter(item => {
    if (!item.requiredPermission && !item.requiredPermissions) {
      return true;
    }
    
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    
    if (item.requiredPermission) {
      if (item.requiredPermission === null) return true;
      return hasPermission(item.requiredPermission);
    }
    
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return hasAnyPermission(item.requiredPermissions);
    }
    
    return false;
  });
  
  // Función para manejar el clic en un ítem de menú (mantener original)
  const handleMenuItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // Función para obtener el nombre completo (para la tarjeta de usuario)
  const getFullName = () => {
    if (!state.user) return 'Usuario';
    
    const firstName = state.user.firstName || '';
    const lastName = state.user.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return state.user.email?.split('@')[0] || 'Usuario';
  };
  
  // Renderizar un ítem de menú con iconos de redirección y modo colapsado
  const renderMenuItem = (item: SidebarItemConfig, isCollapsed: boolean = false) => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        if (state.user?.role === UserRole.ADMIN) {
          return true;
        }
        
        if (child.requiredPermission) {
          if (child.requiredPermission === null) return true;
          return hasPermission(child.requiredPermission);
        }
        
        if (child.requiredPermissions && child.requiredPermissions.length > 0) {
          return hasAnyPermission(child.requiredPermissions);
        }
        
        return true;
      });
      
      if (filteredChildren.length === 0) {
        return null;
      }
      
      const isActiveParent = hasActiveAdminItem();
      
      // En modo colapsado, los items con hijos muestran solo el icono
      if (isCollapsed) {
        return (
          <li key={item.title}>
            <div
              className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                isActiveParent ? 'text-[var(--color-accent-1)] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              title={item.title}
            >
              <span className={`text-lg ${
                isActiveParent ? 'text-[var(--color-accent-1)]' : 'text-white/70'
              }`}>
                {item.icon}
              </span>
            </div>
          </li>
        );
      }
      
      return (
        <li key={item.title}>
          <button
            onClick={toggleAdminMenu}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 group ${
              isActiveParent ? 'text-[var(--color-accent-1)] bg-white/10' : 'text-white/70 hover:text-white'
            }`}
          >
            <div className="flex items-center">
              <span className={`mr-3 text-sm ${
                isActiveParent ? 'text-[var(--color-accent-1)]' : 'text-white/60 group-hover:text-white/80'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.title}</span>
            </div>
            <div className="flex items-center">
              <span className={`transition-colors duration-200 ${
                isActiveParent ? 'text-[var(--color-accent-1)]' : 'text-white/40 group-hover:text-white/60'
              }`}>
                {item.isOpen ? 
                  <ChevronUpIcon className="h-4 w-4" /> : 
                  <ChevronDownIcon className="h-4 w-4" />
                }
              </span>
            </div>
          </button>
          
          {item.isOpen && (
            <ul className="pl-9 mt-1 space-y-1">
              {filteredChildren.map((child) => (
                <li key={child.path}>
                  <Link
                    to={child.path || '#'}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm group ${
                      location.pathname === child.path 
                        ? 'text-[var(--color-accent-1)] bg-white/10 font-medium' 
                        : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                    }`}
                    onClick={handleMenuItemClick}
                  >
                    <div className="flex items-center">
                      <span className={`mr-3 ${location.pathname === child.path ? 'text-[var(--color-accent-1)]' : 'text-white/50'}`}>
                        {child.icon}
                      </span>
                      <span>{child.title}</span>
                    </div>
                    <ArrowUpRightIcon className={`h-3 w-3 transition-opacity duration-200 ${
                      location.pathname === child.path 
                        ? 'opacity-100 text-[var(--color-accent-1)]' 
                        : 'opacity-0 group-hover:opacity-100 text-white/50'
                    }`} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }
    
    // Items regulares
    if (isCollapsed) {
      return (
        <li key={item.path}>
          <Link
            to={item.path || '#'}
            className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 group ${
              location.pathname === item.path 
                ? 'bg-white/10 text-[var(--color-accent-1)]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            onClick={handleMenuItemClick}
            title={item.title}
          >
            <span className={`text-lg ${
              location.pathname === item.path 
                ? 'text-[var(--color-accent-1)]' 
                : 'text-white/70'
            }`}>
              {item.icon}
            </span>
          </Link>
        </li>
      );
    }
    
    return (
      <li key={item.path}>
        <Link
          to={item.path || '#'}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            location.pathname === item.path 
              ? 'bg-white/10 text-[var(--color-accent-1)] font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          onClick={handleMenuItemClick}
        >
          <div className="flex items-center">
            <span className={`mr-3 text-sm ${
              location.pathname === item.path 
                ? 'text-[var(--color-accent-1)]' 
                : 'text-white/60 group-hover:text-white/80'
            }`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.title}</span>
          </div>
          <ArrowUpRightIcon className={`h-4 w-4 transition-opacity duration-200 ${
            location.pathname === item.path 
              ? 'opacity-100 text-[var(--color-accent-1)]' 
              : 'opacity-0 group-hover:opacity-100 text-white/50'
          }`} />
        </Link>
      </li>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-[var(--color-text-main)] relative">
      {/* Header con logo y texto */}
      <div className="p-4 flex items-center justify-center border-b border-white/10 relative">
        {!collapsed && (
          <span className="text-2xl font-bold text-white text-center flex-1">MediaLab</span>
        )}
        
        {/* Botón de cerrar móvil */}
        {onClose && (
          <button 
            className="lg:hidden text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tarjeta de usuario - mostrar solo avatar si está colapsado */}
      {!collapsed ? (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center">
            <UserProfilePhoto 
              size="lg"
              clickable={false}
              className="mr-3"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {getFullName()}
              </p>
              <p className="text-white/50 text-xs truncate">
                {state.user?.email}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-white/10 flex justify-center">
          <UserProfilePhoto 
            size="md"
            clickable={false}
          />
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin dark-scrollbar">
        <ul className={`space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {filteredSidebarItems.map(item => renderMenuItem(item, collapsed))}
        </ul>
      </nav>
      
      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />
    </div>
  );
};

export default Sidebar;