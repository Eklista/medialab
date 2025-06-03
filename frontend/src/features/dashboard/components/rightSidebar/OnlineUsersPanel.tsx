// frontend/src/features/dashboard/components/rightSidebar/OnlineUsersPanel.tsx - 🔧 VERSIÓN CORREGIDA

import React from 'react';
import { 
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
// ✅ IMPORT CORREGIDO - usar el hook principal
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
    
    try {
      const date = new Date(lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Ahora';
      if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
      if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)}h`;
      return `Hace ${Math.floor(diffMinutes / 1440)}d`;
    } catch {
      return 'Hace un tiempo';
    }
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

// Componente principal con debug
const OnlineUsersPanel: React.FC = () => {
  // ✅ USAR EL HOOK PRINCIPAL con configuración personalizada
  const { 
    users, 
    isLoading, 
    error, 
    totalOnline, 
    totalActive,
    lastUpdate,
    refresh
  } = useOnlineUsers({
    refreshInterval: 30000,
    enabled: true
  });

  // 🧪 Estado para mostrar/ocultar debug
  const [showDebug, setShowDebug] = React.useState(false);

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
            <p className="text-xs text-white/40 mt-1">Endpoint: /public/online-users</p>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="p-1 text-white/60 hover:text-white transition-colors rounded"
                title="Debug"
              >
                <WrenchScrewdriverIcon className="h-4 w-4" />
              </button>
              <button
                onClick={refresh}
                className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title="Reintentar"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Debug panel */}
        {showDebug && (
          <div className="p-3 bg-red-900/20 border-b border-red-500/20">
            <div className="text-xs text-white/80 space-y-2">
              <div>
                <span className="font-medium">Endpoint:</span> /public/online-users
              </div>
              <div>
                <span className="font-medium">Error:</span> {error}
              </div>
            </div>
          </div>
        )}

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-white/60">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm mb-2">Error cargando usuarios</p>
            <p className="text-xs text-white/40 mb-3">{error}</p>
            <p className="text-xs text-white/40 mb-3">Endpoint: /public/online-users</p>
            <div className="space-y-2">
              <button
                onClick={refresh}
                className="block mx-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
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
          <div className="flex items-center space-x-2">
            {/* 🧪 Debug toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="p-1 text-white/60 hover:text-white transition-colors rounded"
              title="Debug"
            >
              <WrenchScrewdriverIcon className="h-4 w-4" />
            </button>
            <button
              onClick={refresh}
              className="p-1.5 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              title="Actualizar"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* 🧪 Debug panel */}
        {showDebug && (
          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-white/10">
            <div className="text-xs text-white/80 space-y-2">
              <div>
                <span className="font-medium">Endpoint:</span> /public/online-users
              </div>
              <div>
                <span className="font-medium">Estado:</span> {error ? 'Error' : 'OK'}
              </div>
              <div>
                <span className="font-medium">Última actualización:</span> {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        )}
        
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
              <p className="text-xs text-blue-400 mt-2">
                Usando endpoint público: /public/online-users
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