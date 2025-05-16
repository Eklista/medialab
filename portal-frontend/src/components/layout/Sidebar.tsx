import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  FolderIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  
  const navigation = [
    { name: 'Inicio', href: '/portal', icon: HomeIcon }, // Cambiado de / a /portal
    { name: 'Mis Solicitudes', href: '/portal/requests', icon: ClipboardDocumentListIcon }, // Cambiado de /requests a /portal/requests
    { name: 'Mis Proyectos', href: '/portal/projects', icon: FolderIcon }, // Cambiado de /projects a /portal/projects
    { name: 'Mi Perfil', href: '/portal/profile', icon: UserIcon }, // Cambiado de /profile a /portal/profile
  ];

  const handleLogout = () => {
    logout();
    navigate('/portal/login'); // Cambiado de /login a /portal/login
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="flex items-center h-16 px-4 bg-gray-900">
        <span className="text-xl font-bold text-white">MediaLab</span>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-700">
              <span className="text-sm font-medium text-white">
                {state.user?.name?.charAt(0) || 'U'}
              </span>
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">{state.user?.name || 'Usuario'}</p>
            <button 
              onClick={handleLogout}
              className="text-xs font-medium text-gray-400 hover:text-white cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;