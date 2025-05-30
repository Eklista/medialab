// frontend/src/features/dashboard/components/rightSidebar/OnlineUsersPanel.tsx

import React from 'react';
import { 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/solid';
import { PanelProps } from './shared/types';
import UserProfilePhoto from '../ui/UserProfilePhoto';
import { useOnlineUsers } from '../../../../services/users/hooks/useUserService';

interface OnlineUsersPanelProps extends PanelProps {
  className?: string;
}

const OnlineUsersPanel: React.FC<OnlineUsersPanelProps> = ({ 
  className = ''
}) => {
  // 🔌 Obtener datos reales del backend
  const { users: realUsers, isLoading, error, refresh } = useOnlineUsers();
  const users = realUsers || [];
  
  // Filtrar usuarios online y offline
  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);
  
  // 🔄 Mostrar loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/60">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-1)] mx-auto mb-2"></div>
          <p className="text-sm">Cargando usuarios online...</p>
        </div>
      </div>
    );
  }

  // ❌ Mostrar error con opción de reintentar
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-400 p-4">
          <p className="text-sm mb-2">❌ {error}</p>
          <button 
            onClick={refresh}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // 🎨 Funciones de estilo
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente';
      default: return 'Sin estado';
    }
  };

  const formatLastSeen = (lastSeen?: string): string => {
    if (!lastSeen) return 'Nunca';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 5) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  // 👤 Componente de tarjeta de usuario
  const UserCard: React.FC<{ 
    user: {
      id: number;
      fullName: string;
      email: string;
      profileImage?: string;
      isOnline: boolean;
      lastSeen?: string;
      onlineStatus?: 'available' | 'busy' | 'away';
    }
  }> = ({ user }) => (
    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200 cursor-pointer group">
      <div className="flex items-center">
        <div className="relative">
          <UserProfilePhoto
            user={{
              id: user.id,
              firstName: user.fullName.split(' ')[0] || '',
              lastName: user.fullName.split(' ').slice(1).join(' ') || '',
              email: user.email,
              profileImage: user.profileImage
            }}
            size="md"
            showOnlineStatus={false}
          />
          {/* Indicador de estado personalizado */}
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.onlineStatus)} border-2 border-[var(--color-text-main)] rounded-full`}
            title={getStatusText(user.onlineStatus)}
          />
        </div>
        
        <div className="flex-1 ml-3 min-w-0">
          <p className="text-white font-medium text-sm truncate group-hover:text-[var(--color-accent-1)] transition-colors">
            {user.fullName}
          </p>
          <p className="text-white/60 text-xs truncate">
            {user.isOnline ? getStatusText(user.onlineStatus) : formatLastSeen(user.lastSeen)}
          </p>
        </div>
        
        {/* Botones de acción - solo para usuarios online */}
        {user.isOnline && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
              title="Enviar mensaje"
              onClick={() => console.log('Mensaje a:', user.fullName)}
            >
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
            </button>
            <button 
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
              title="Llamar"
              onClick={() => console.log('Llamar a:', user.fullName)}
            >
              <PhoneIcon className="h-3.5 w-3.5" />
            </button>
            <button 
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
              title="Videollamada"
              onClick={() => console.log('Video con:', user.fullName)}
            >
              <VideoCameraIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Usuarios Online</h3>
          <button 
            onClick={refresh}
            className="text-white/60 hover:text-white text-xs transition-colors"
            title="Actualizar"
          >
            🔄
          </button>
        </div>
        <p className="text-white/70 text-sm">
          {onlineUsers.length} en línea • {users.length} total
        </p>
      </div>
      
      {/* Usuarios Online */}
      {onlineUsers.length > 0 && (
        <div className="p-4 space-y-3">
          <div className="flex items-center text-green-400 text-xs font-medium mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            EN LÍNEA ({onlineUsers.length})
          </div>
          {onlineUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
      
      {/* Usuarios Offline (máximo 5) */}
      {offlineUsers.length > 0 && (
        <div className="p-4 space-y-3 border-t border-white/5">
          <div className="flex items-center text-white/40 text-xs font-medium mb-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            RECIENTES ({Math.min(offlineUsers.length, 5)})
          </div>
          {offlineUsers.slice(0, 5).map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
          {offlineUsers.length > 5 && (
            <button 
              className="w-full text-center text-white/50 hover:text-white/70 text-xs transition-colors py-2"
              onClick={() => console.log('Ver más usuarios offline')}
            >
              Ver {offlineUsers.length - 5} más...
            </button>
          )}
        </div>
      )}
      
      {/* Estado vacío */}
      {users.length === 0 && (
        <div className="text-center py-8">
          <div className="text-white/40 mb-2">
            <UserGroupIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-white/60 text-sm mb-2">No hay usuarios conectados</p>
          <button 
            onClick={refresh}
            className="text-[var(--color-accent-1)] hover:text-[var(--color-hover)] text-xs transition-colors"
          >
            Actualizar lista
          </button>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button 
          className="w-full text-center text-[var(--color-accent-1)] hover:text-[var(--color-hover)] font-medium text-sm transition-colors py-2 rounded-lg hover:bg-white/5"
          onClick={() => console.log('Ver todos los usuarios')}
        >
          Ver todos los usuarios →
        </button>
      </div>
    </div>
  );
};

export default OnlineUsersPanel;