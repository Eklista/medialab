// src/features/dashboard/components/layout/Sidebar.tsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
import UserProfilePhoto from '../ui/UserProfilePhoto';
import { useAuth } from '../../../auth/hooks/useAuth';
import { usePermissions } from '../../../../hooks/usePermissions';
import { UserRole } from '../../../auth/types/auth.types';
import { 
  HomeIcon, 
  FilmIcon, 
  AcademicCapIcon, 
  MicrophoneIcon, 
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  WrenchIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/solid';

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Interfaz para elementos del sidebar
interface SidebarItemConfig {
  title: string;
  path?: string;
  icon: React.ReactNode;
  children?: SidebarItemConfig[];
  isOpen?: boolean;
  // 🆕 Verificaciones de permisos según tus especificaciones
  permissionCheck?: () => boolean;
  alwaysVisible?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, collapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const { state, hasPermission, hasAnyPermission } = useAuth();
  const { hasPermission: permHasPermission } = usePermissions();
  
  // Estado para manejar la apertura/cierre del menú de administración
  const [menuState, setMenuState] = useState({
    adminOpen: false
  });

  // Estado para expansión temporal cuando se hace clic en administración
  const [tempExpanded, setTempExpanded] = useState(false);
  
  // Función para alternar el menú de administración
  const toggleAdminMenu = () => {
    setMenuState(prev => ({
      ...prev,
      adminOpen: !prev.adminOpen
    }));
  };

  // Función para manejar clic en administración cuando está colapsado
  const handleAdminClickCollapsed = () => {
    console.log('🔍 Admin icon clicked in collapsed mode');
    setTempExpanded(true);
    setMenuState({ adminOpen: true });
  };

  // Función para cerrar la expansión temporal
  const closeTempExpansion = () => {
    setTempExpanded(false);
    setMenuState({ adminOpen: false });
  };
  
  // Función para verificar si hay items activos en administración
  const hasActiveAdminItem = () => {
    const adminPaths = ['/dashboard/users', '/dashboard/app-settings'];
    return adminPaths.some(path => location.pathname.startsWith(path));
  };
  
  // Auto-abrir menú de administración si hay un item activo
  useEffect(() => {
    if (hasActiveAdminItem() && !menuState.adminOpen) {
      setMenuState(prev => ({ ...prev, adminOpen: true }));
    }
  }, [location.pathname, menuState.adminOpen]);

  // 🆕 Funciones de verificación de permisos según tus especificaciones
  const canViewProduction = () => {
    // Placeholder para cuando implementes la lógica de project
    return hasPermission('project_view') || state.user?.role === UserRole.ADMIN;
  };

  const canViewCourses = () => {
    return hasPermission('courses_view') || state.user?.role === UserRole.ADMIN;
  };

  const canViewPodcast = () => {
    return hasPermission('podcast_view') || state.user?.role === UserRole.ADMIN;
  };

  const canViewRequests = () => {
    return hasPermission('requests_view') || state.user?.role === UserRole.ADMIN;
  };

  const canViewGeneral = () => {
    return hasPermission('profile_edit') || state.user?.role === UserRole.ADMIN;
  };

  const canViewAdministration = () => {
    if (state.user?.role === UserRole.ADMIN) return true;
    
    // Verificar si tiene permisos administrativos
    const adminPermissions = [
      'user_view', 'user_create', 'user_edit', 'user_delete',
      'role_view', 'role_create', 'role_edit', 'role_delete',
      'area_view', 'area_create', 'area_edit', 'area_delete',
      'service_view', 'service_create', 'service_edit', 'service_delete',
      'template_view', 'template_create', 'template_edit', 'template_delete',
      'department_view', 'department_create', 'department_edit', 'department_delete',
      'smtp_config_view', 'smtp_config_create', 'smtp_config_edit', 'smtp_config_delete',
      'email_template_view', 'email_template_create', 'email_template_edit', 'email_template_delete'
    ];
    
    return hasAnyPermission(adminPermissions);
  };

  const canViewUsers = () => {
    return hasPermission('user_view') || state.user?.role === UserRole.ADMIN;
  };

  const canViewAppSettings = () => {
    if (state.user?.role === UserRole.ADMIN) return true;
    
    const settingsPermissions = [
      'role_view', 'area_view', 'service_view', 'template_view',
      'department_view', 'smtp_config_view', 'email_template_view'
    ];
    
    return hasAnyPermission(settingsPermissions);
  };
  
  // 🆕 Configuración del sidebar CON TUS VERIFICACIONES DE PERMISOS
  const sidebarItems: SidebarItemConfig[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <HomeIcon className="h-5 w-5" />,
      alwaysVisible: true // Dashboard siempre visible
    },
    {
      title: 'Producción',
      path: '/dashboard/production',
      icon: <FilmIcon className="h-5 w-5" />,
      permissionCheck: canViewProduction
    },
    {
      title: 'Cursos',
      path: '/dashboard/courses',
      icon: <AcademicCapIcon className="h-5 w-5" />,
      permissionCheck: canViewCourses
    },
    {
      title: 'Podcasts',
      path: '/dashboard/podcast',
      icon: <MicrophoneIcon className="h-5 w-5" />,
      permissionCheck: canViewPodcast
    },
    {
      title: 'Solicitudes',
      path: '/dashboard/requests',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      permissionCheck: canViewRequests
    },
    {
      title: 'Configuración General',
      path: '/dashboard/settings',
      icon: <UserIcon className="h-5 w-5" />,
      permissionCheck: canViewGeneral
    },
    // Administración con hijos (TU ESTRUCTURA ORIGINAL)
    {
      title: 'Administración',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      isOpen: menuState.adminOpen,
      permissionCheck: canViewAdministration,
      children: [
        {
          title: 'Usuarios',
          path: '/dashboard/users',
          icon: <UserIcon className="h-5 w-5" />,
          permissionCheck: canViewUsers
        },
        {
          title: 'Configuración de App',
          path: '/dashboard/app-settings',
          icon: <WrenchIcon className="h-5 w-5" />,
          permissionCheck: canViewAppSettings
        }
      ]
    }
  ];
  
  // 🆕 Filtrar los items según los permisos
  const filteredSidebarItems = sidebarItems.filter(item => {
    if (item.alwaysVisible) return true;
    if (item.permissionCheck) return item.permissionCheck();
    return true;
  }).map(item => {
    // Si tiene hijos, filtrar también los hijos
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        if (child.permissionCheck) return child.permissionCheck();
        return true;
      });
      
      // Si no tiene hijos visibles, no mostrar el padre
      if (filteredChildren.length === 0) return null;
      
      return { ...item, children: filteredChildren };
    }
    return item;
  }).filter(Boolean) as SidebarItemConfig[];
  
  // Función para manejar el clic en un ítem de menú
  const handleMenuItemClick = () => {
    if (onClose) {
      onClose();
    }
    // Cerrar expansión temporal si está activa
    if (tempExpanded) {
      closeTempExpansion();
    }
  };

  // Función para obtener el nombre completo
  const getFullName = () => {
    if (!state.user) return 'Usuario';
    
    const firstName = state.user.firstName || '';
    const lastName = state.user.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return state.user.email?.split('@')[0] || 'Usuario';
  };
  
  // Determinar si debe mostrar el sidebar expandido
  const shouldShowExpanded = !collapsed || tempExpanded;
  
  // Renderizar un ítem de menú (TU LÓGICA ORIGINAL)
  const renderMenuItem = (item: SidebarItemConfig, isCollapsed: boolean = false) => {
    if (item.children) {
      const isActiveParent = hasActiveAdminItem();
      
      // En modo colapsado, mostrar solo el ícono que abre temporalmente
      if (isCollapsed && !tempExpanded) {
        return (
          <li key={item.title}>
            <button
              onClick={handleAdminClickCollapsed}
              className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 w-full relative overflow-hidden group ${
                isActiveParent ? 'text-[var(--color-accent-1)] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              title={item.title}
            >
              <span className={`text-lg relative z-10 transition-transform duration-200 group-hover:scale-110 ${
                isActiveParent ? 'text-[var(--color-accent-1)]' : 'text-white/70'
              }`}>
                {item.icon}
              </span>
              
              {/* Efecto gota */}
              <span className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></span>
            </button>
          </li>
        );
      }
      
      // Modo expandido (normal o temporal)
      return (
        <li key={item.title}>
          <button
            onClick={toggleAdminMenu}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
              isActiveParent ? 'text-[var(--color-accent-1)] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center relative z-10">
              <span className={`mr-3 text-sm transition-transform group-hover:scale-105 ${
                isActiveParent ? 'text-[var(--color-accent-1)]' : 'text-white/60 group-hover:text-white/80'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.title}</span>
            </div>
            <div className="flex items-center relative z-10">
              <span className={`transition-all duration-200 ${
                isActiveParent ? 'text-[var(--color-accent-1)]' : 'text-white/40 group-hover:text-white/60'
              } ${item.isOpen ? 'rotate-180' : ''}`}>
                <ChevronDownIcon className="h-4 w-4" />
              </span>
            </div>
            
            {/* Efecto gota */}
            <span className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></span>
          </button>
          
          {item.isOpen && item.children && (
            <ul className="pl-9 mt-1 space-y-1">
              {item.children.map((child) => (
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
    
    // Items regulares (TU LÓGICA ORIGINAL)
    if (isCollapsed && !tempExpanded) {
      return (
        <li key={item.path}>
          <Link
            to={item.path || '#'}
            className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
              location.pathname === item.path 
                ? 'bg-white/10 text-[var(--color-accent-1)]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            onClick={handleMenuItemClick}
            title={item.title}
          >
            <span className={`text-lg transition-transform group-hover:scale-110 relative z-10 ${
              location.pathname === item.path 
                ? 'text-[var(--color-accent-1)]' 
                : 'text-white/70'
            }`}>
              {item.icon}
            </span>
            
            {/* Efecto gota */}
            <span className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></span>
          </Link>
        </li>
      );
    }
    
    return (
      <li key={item.path}>
        <Link
          to={item.path || '#'}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
            location.pathname === item.path 
              ? 'bg-white/10 text-[var(--color-accent-1)] font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          onClick={handleMenuItemClick}
        >
          <div className="flex items-center relative z-10">
            <span className={`mr-3 text-sm transition-transform group-hover:scale-105 ${
              location.pathname === item.path 
                ? 'text-[var(--color-accent-1)]' 
                : 'text-white/60 group-hover:text-white/80'
            }`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.title}</span>
          </div>
          <ArrowUpRightIcon className={`h-4 w-4 transition-all duration-200 relative z-10 ${
            location.pathname === item.path 
              ? 'opacity-100 text-[var(--color-accent-1)]' 
              : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-white/50'
          }`} />
          
          {/* Efecto gota */}
          <span className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></span>
        </Link>
      </li>
    );
  };
  
  return (
    <div className={`h-full flex flex-col bg-[var(--color-text-main)] relative transition-all duration-300 ${
      tempExpanded ? 'w-72' : shouldShowExpanded ? 'w-full' : 'w-full'
    }`}>
      {/* Header con logo, texto y botón de colapsar integrado (TU DISEÑO ORIGINAL) */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 relative">
        {shouldShowExpanded ? (
          <>
            <span className="text-2xl font-bold text-white text-center flex-1">MediaLab</span>
            
            {/* Botones según el contexto */}
            {tempExpanded ? (
              // Botón para cerrar expansión temporal
              <button
                onClick={closeTempExpansion}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white/70 hover:text-white relative overflow-hidden group"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-4 w-4 relative z-10" />
                <span className="absolute inset-0 bg-white/30 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 ease-out"></span>
              </button>
            ) : (
              // Botón normal de colapsar
              onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white/70 hover:text-white relative overflow-hidden group"
                  aria-label="Colapsar sidebar"
                >
                  <ChevronLeftIcon className="h-4 w-4 relative z-10" />
                  <span className="absolute inset-0 bg-white/30 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 ease-out"></span>
                </button>
              )
            )}
          </>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Logo pequeño en modo colapsado */}
            <span className="text-lg font-bold text-white mb-2">ML</span>
            {/* Botón de expandir integrado - SOLO desktop */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white/70 hover:text-white relative overflow-hidden group"
                aria-label="Expandir sidebar"
              >
                <ChevronRightIcon className="h-4 w-4 relative z-10" />
                <span className="absolute inset-0 bg-white/30 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 ease-out"></span>
              </button>
            )}
          </div>
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

      {/* Tarjeta de usuario - mostrar solo avatar si está colapsado (TU DISEÑO ORIGINAL) */}
      {shouldShowExpanded ? (
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
        <ul className={`space-y-1 ${shouldShowExpanded ? 'px-3' : 'px-2'}`}>
          {filteredSidebarItems.map(item => renderMenuItem(item, !shouldShowExpanded))}
        </ul>
      </nav>
      
      {/* Footer (TU COMPONENTE ORIGINAL) */}
      <SidebarFooter collapsed={!shouldShowExpanded} />
    </div>
  );
};

export default Sidebar;