// src/features/dashboard/components/layout/Sidebar.tsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
import logo from '../../../../assets/images/logo-white.png';
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

interface SidebarItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  
  // Estado para controlar qué menús están expandidos
  const [menuState, setMenuState] = useState({
    adminOpen: false
  });
  
  // Toggle para expandir/contraer el menú de administración
  const toggleAdminMenu = () => {
    setMenuState(prev => ({
      ...prev,
      adminOpen: !prev.adminOpen
    }));
  };
  
  const sidebarItems: SidebarItem[] = [
    {
      title: 'Inicio',
      path: '/dashboard',
      icon: <HomeIcon className="h-5 w-5" />
    },
    {
      title: 'Producción',
      path: '/dashboard/production',
      icon: <FilmIcon className="h-5 w-5" />
    },
    {
      title: 'Cursos',
      path: '/dashboard/courses',
      icon: <AcademicCapIcon className="h-5 w-5" />
    },
    {
      title: 'Podcast',
      path: '/dashboard/podcast',
      icon: <MicrophoneIcon className="h-5 w-5" />
    },
    {
      title: 'Solicitudes',
      path: '/dashboard/requests',
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />
    },
    {
      title: 'Administración',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      isOpen: menuState.adminOpen,
      children: [
        {
          title: 'Usuarios',
          path: '/dashboard/users',
          icon: <UserGroupIcon className="h-5 w-5" />
        },
        {
          title: 'Configuración de App',
          path: '/dashboard/app-settings',
          icon: <WrenchIcon className="h-5 w-5" />
        }
      ]
    },
    {
      title: 'Configuración General',
      path: '/dashboard/settings',
      icon: <UserIcon className="h-5 w-5" />
    }
  ];
  
  // Manejador para los elementos del menú en móviles
  const handleMenuItemClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Renderizar un ítem de menú
  const renderMenuItem = (item: SidebarItem) => {
    // Si el ítem tiene hijos (es un dropdown)
    if (item.children) {
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
              {item.children.map((child) => (
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
    
    // Para ítems regulares (sin hijos)
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
          {sidebarItems.map(renderMenuItem)}
        </ul>
      </nav>
      
      {/* Footer */}
      <SidebarFooter />
    </div>
  );
};

export default Sidebar;