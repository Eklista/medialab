// frontend/src/features/dashboard/components/rightSidebar/OnlineUsersPanel.tsx - CORREGIDO

import React from 'react';
import { 
  UserIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useOnlineUsers } from '../../../../hooks/useOnlineUsers';

// Componente para mostrar un usuario individual
const OnlineUserItem: React.FC<{ user: any }> = ({ user }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500'; 
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'away': return 'Ausente';
      case 'busy': return 'Ocupado';
      default: return 'Desconectado';
    }
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return 'Nunca';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)}h`;
    return `Hace ${Math.floor(diffMinutes / 1440)}d`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.initials}
            </span>
          </div>
        )}
        
        {/* Indicador de estado */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-text-main)] ${getStatusColor(user.status)}`} />
      </div>

      {/* Información del usuario */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user.fullName}
        </p>
        <div className="flex items-center space-x-1 text-xs text-white/60">
          <span>{getStatusText(user.status)}</span>
          <span>•</span>
          <span>{formatLastSeen(user.lastSeen)}</span>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const OnlineUsersPanel: React.FC = () => {
  const { 
    users, 
    isLoading, 
    error, 
    totalOnline, 
    totalActive,
    lastUpdate,
    refresh 
  } = useOnlineUsers();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Usuarios Online
            </h3>
            <div className="animate-spin">
              <ArrowPathIcon className="h-5 w-5 text-white/60" />
            </div>
          </div>
        </div>

        {/* Loading content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/60">
            <UserIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Usuarios Online
            </h3>
            <button
              onClick={refresh}
              className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              title="Reintentar"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-white/60">
            <UserIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm mb-2">Error cargando usuarios</p>
            <p className="text-xs text-white/40">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Usuarios Online
          </h3>
          <button
            onClick={refresh}
            className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            title="Actualizar"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Estadísticas */}
        <div className="mt-3 flex items-center space-x-4 text-sm text-white/60">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{totalOnline} en línea</span>
          </div>
          <div className="flex items-center space-x-1">
            <UserIcon className="h-4 w-4" />
            <span>{totalActive} activos</span>
          </div>
        </div>
        
        {/* Última actualización */}
        {lastUpdate && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-white/40">
            <ClockIcon className="h-3 w-3" />
            <span>
              Actualizado: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Lista de usuarios */}
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-white/60">
              <UserIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No hay usuarios online</p>
              <p className="text-xs text-white/40 mt-1">
                Los usuarios aparecerán aquí cuando estén activos
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {users.map((user) => (
              <OnlineUserItem key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsersPanel;