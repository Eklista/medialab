// src/features/dashboard/components/layout/Sidebar.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
import logo from '../../../../assets/images/logo-white.png';
import { 
  HomeIcon, 
  FilmIcon, 
  AcademicCapIcon, 
  MicrophoneIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/solid';

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  
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
      title: 'Configuración',
      path: '/dashboard/settings',
      icon: <Cog6ToothIcon className="h-5 w-5" />
    }
  ];
  
  return (
    <div className="h-screen bg-(--color-text-main) text-white flex flex-col w-64 fixed">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center">
          <img src={logo} alt="MediaLab Logo" className="h-8 w-auto mr-3" />
          <span className="text-xl font-semibold">MediaLab</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-2 px-2">
          {sidebarItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg hover:bg-white/10 transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-white/10 text-(--color-accent-1)' 
                    : 'text-white/80 hover:text-(--color-accent-1)'
                }`}
              >
                <span className={`mr-3 ${location.pathname === item.path ? 'text-(--color-accent-1)' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer */}
      <SidebarFooter />
    </div>
  );
};

export default Sidebar;