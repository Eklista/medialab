// src/features/dashboard/components/layout/Sidebar.tsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
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

// Interfaz para elementos del sidebar
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
  const { state, hasPermission, hasAnyPermission } = useAuth(); // Usar hasPermission desde useAuth
  
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
  
  // Configuración del sidebar con permisos
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
      requiredPermission: 'profile_edit' // Solo necesita permiso para editar su perfil
    }
  ];
  
  // Filtrar los items según los permisos
  const filteredSidebarItems = sidebarItems.filter(item => {
    // Si no requiere permisos, siempre mostrar
    if (!item.requiredPermission && !item.requiredPermissions) {
      return true;
    }
    
    // Si es administrador, siempre mostrar
    if (state.user?.role === UserRole.ADMIN) {
      return true;
    }
    
    // Si requiere un permiso específico
    if (item.requiredPermission) {
      if (item.requiredPermission === null) return true; // Sin restricción
      return hasPermission(item.requiredPermission);
    }
    
    // Si requiere alguno de varios permisos
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return hasAnyPermission(item.requiredPermissions);
    }
    
    return false;
  });
  
  // Función para manejar el clic en un ítem de menú
  const handleMenuItemClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Renderizar un ítem de menú
  const renderMenuItem = (item: SidebarItemConfig) => {
    // Si el ítem tiene hijos, renderizar un botón para expandir/contraer
    if (item.children) {
      // Filtrar los hijos según los permisos
      const filteredChildren = item.children.filter(child => {
        // Si es administrador, siempre mostrar
        if (state.user?.role === UserRole.ADMIN) {
          return true;
        }
        
        if (child.requiredPermission) {
          if (child.requiredPermission === null) return true; // Sin restricción
          return hasPermission(child.requiredPermission);
        }
        
        if (child.requiredPermissions && child.requiredPermissions.length > 0) {
          return hasAnyPermission(child.requiredPermissions);
        }
        
        return true;
      });
      
      // Si no hay hijos con permisos, no mostrar este ítem
      if (filteredChildren.length === 0) {
        return null;
      }
      
      return (
        <li key={item.title}>
          <button
            onClick={toggleAdminMenu}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-(--color-accent-1)"
          >
            <div className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              <span>{item.title}</span>
            </div>
            <span>
              {item.isOpen ? 
                <ChevronUpIcon className="h-4 w-4" /> : 
                <ChevronDownIcon className="h-4 w-4" />
              }
            </span>
          </button>
          
          {/* Submenú */}
          {item.isOpen && (
            <ul className="pl-10 mt-1 space-y-1">
              {filteredChildren.map((child) => (
                <li key={child.path}>
                  <Link
                    to={child.path || '#'}
                    className={`flex items-center px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${
                      location.pathname === child.path 
                        ? 'text-(--color-accent-1)' 
                        : 'text-white/70 hover:text-(--color-accent-1)'
                    }`}
                    onClick={handleMenuItemClick}
                  >
                    <span className={`mr-3 ${location.pathname === child.path ? 'text-(--color-accent-1)' : ''}`}>
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
    
    // Si el ítem no tiene hijos, renderizar un enlace normal
    return (
      <li key={item.path}>
        <Link
          to={item.path || '#'}
          className={`flex items-center px-4 py-3 rounded-lg hover:bg-white/10 transition-colors ${
            location.pathname === item.path 
              ? 'bg-white/10 text-(--color-accent-1)' 
              : 'text-white/80 hover:text-(--color-accent-1)'
          }`}
          onClick={handleMenuItemClick}
        >
          <span className={`mr-3 ${location.pathname === item.path ? 'text-(--color-accent-1)' : ''}`}>
            {item.icon}
          </span>
          <span>{item.title}</span>
        </Link>
      </li>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Logo y botón de cierre (solo en móviles) */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center">
          <img src={logo} alt="MediaLab Logo" className="h-8 w-auto mr-3" />
          <span className="text-xl font-semibold text-white">MediaLab</span>
        </div>
        
        {onClose && (
          <button 
            className="lg:hidden text-white/80 hover:text-white"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredSidebarItems.map(renderMenuItem)}
        </ul>
      </nav>
      
      {/* Footer */}
      <SidebarFooter />
    </div>
  );
};

export default Sidebar;