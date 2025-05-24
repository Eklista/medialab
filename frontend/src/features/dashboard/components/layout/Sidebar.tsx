// src/features/dashboard/components/layout/Sidebar.tsx - Solo cambios de UI, mantiene funcionalidad original

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
import UserProfilePhoto from '../ui/UserProfilePhoto';
import logo from '../../../../assets/images/logo-white.png';
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
  WrenchIcon
} from '@heroicons/react/24/solid';

interface SidebarProps {
  onClose?: () => void;
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

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { state, hasPermission, hasAnyPermission } = useAuth();
  
  // Estado para manejar la apertura/cierre del menú de administración (mantener original)
  const [menuState, setMenuState] = useState({
    adminOpen: false
  });
  
  // Función para alternar el menú de administración (mantener original)
  const toggleAdminMenu = () => {
    setMenuState(prev => ({
      ...prev,
      adminOpen: !prev.adminOpen
    }));
  };
  
  // Configuración del sidebar con permisos (MANTENER ORIGINAL)
  const sidebarItems: SidebarItemConfig[] = [
    {
      title: 'Inicio',
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
      title: 'Podcast',
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
    },
    {
      title: 'Configuración General',
      path: '/dashboard/settings',
      icon: <UserIcon className="h-5 w-5" />,
      requiredPermission: 'profile_edit'
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
  
  // Renderizar un ítem de menú (MANTENER LÓGICA ORIGINAL)
  const renderMenuItem = (item: SidebarItemConfig) => {
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
      
      return (
        <li key={item.title}>
          <button
            onClick={toggleAdminMenu}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          >
            <div className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.title}</span>
            </div>
            <span>
              {item.isOpen ? 
                <ChevronUpIcon className="h-4 w-4" /> : 
                <ChevronDownIcon className="h-4 w-4" />
              }
            </span>
          </button>
          
          {item.isOpen && (
            <ul className="pl-12 mt-2 space-y-1">
              {filteredChildren.map((child) => (
                <li key={child.path}>
                  <Link
                    to={child.path || '#'}
                    className={`flex items-center px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${
                      location.pathname === child.path 
                        ? 'text-[var(--color-accent-1)] bg-white/10' 
                        : 'text-white/70 hover:text-white'
                    }`}
                    onClick={handleMenuItemClick}
                  >
                    <span className={`mr-3 ${location.pathname === child.path ? 'text-[var(--color-accent-1)]' : ''}`}>
                      {child.icon}
                    </span>
                    <span>{child.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }
    
    return (
      <li key={item.path}>
        <Link
          to={item.path || '#'}
          className={`flex items-center px-4 py-3 rounded-lg hover:bg-white/10 transition-colors ${
            location.pathname === item.path 
              ? 'bg-white/10 text-[var(--color-accent-1)]' 
              : 'text-white/80 hover:text-white'
          }`}
          onClick={handleMenuItemClick}
        >
          <span className={`mr-3 ${location.pathname === item.path ? 'text-[var(--color-accent-1)]' : ''}`}>
            {item.icon}
          </span>
          <span className="font-medium">{item.title}</span>
        </Link>
      </li>
    );
  };
  
  return (
    <div className="h-full flex flex-col p-2">
      {/* Contenedor flotante con bordes muy sutiles */}
      <div className="h-full flex flex-col bg-[var(--color-text-main)] rounded-lg border border-white/5 shadow-md overflow-hidden">
        {/* Logo simple */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="MediaLab Logo" className="h-8 w-auto mr-3" />
            <span className="text-xl font-semibold text-white">MediaLab</span>
          </div>
          
          {onClose && (
            <button 
              className="lg:hidden text-white/80 hover:text-white transition-colors p-2"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Tarjeta de usuario simple y elegante */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center">
            <UserProfilePhoto 
              size="lg"
              clickable={false}
              className="mr-4"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-base truncate">
                {getFullName()}
              </p>
              <p className="text-white/60 text-sm truncate mt-1">
                {state.user?.email}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation simple como en la imagen */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2 px-4">
            {filteredSidebarItems.map(renderMenuItem)}
          </ul>
        </nav>
        
        {/* Footer (MANTENER ORIGINAL) */}
        <SidebarFooter />
      </div>
    </div>
  );
};

export default Sidebar;