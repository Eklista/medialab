// frontend/src/features/dashboard/components/rightSidebar/NotificationsPanel.tsx

import React from 'react';
import { BellIcon } from '@heroicons/react/24/solid';
import { NotificationItem, PanelProps } from './shared/types';
import { getNotificationIcon, getInitials } from './shared/utils';

interface NotificationsPanelProps extends PanelProps {
  notifications?: NotificationItem[];
}

// Datos de muestra - puedes moverlos a un servicio o context
const defaultNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    user: { name: "Carlos Ramírez" },
    action: "completó la transmisión en vivo de",
    target: "Conferencia de Bienvenida",
    timestamp: "2025-05-30T14:00:00Z",
    type: "success"
  },
  {
    id: "notif-2",
    user: { name: "María Fernández" },
    action: "actualizó el estado del proyecto",
    target: "Video institucional",
    timestamp: "2025-05-30T12:00:00Z",
    type: "info"
  },
  {
    id: "notif-3",
    user: { name: "Juan López" },
    action: "asignó un nuevo recurso a",
    target: "Podcast semanal",
    timestamp: "2025-05-30T11:00:00Z",
    type: "info"
  },
  {
    id: "notif-4",
    user: { name: "Sistema" },
    action: "recordatorio: mantenimiento programado",
    timestamp: "2025-05-30T10:00:00Z",
    type: "warning"
  },
  {
    id: "notif-5",
    user: { name: "Lucía Méndez" },
    action: "creó una nueva solicitud de servicio",
    timestamp: "2025-05-29T16:00:00Z",
    type: "info"
  }
];

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
  notifications = defaultNotifications,
  className = ''
}) => {
  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Notificaciones</h3>
        <p className="text-white/70 text-sm">{notifications.length} notificaciones recientes</p>
      </div>
      
      {/* Notifications List */}
      <div className="p-4 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200 cursor-pointer group"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {notif.user.name === "Sistema" ? (
                    <div className={`w-8 h-8 rounded-full ${getNotificationIcon(notif.type)} flex items-center justify-center`}>
                      <BellIcon className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${getNotificationIcon(notif.type)} flex items-center justify-center text-white font-medium text-xs`}>
                      {getInitials(notif.user.name)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white group-hover:text-white/90">
                    <span className="font-medium">{notif.user.name}</span>
                    {" "}
                    <span className="text-white/80">{notif.action}</span>
                    {notif.target && (
                      <span>
                        {" "}
                        <span className="font-medium text-[var(--color-accent-1)] group-hover:text-[var(--color-hover)]">
                          {notif.target}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    {formatTimeAgo(notif.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-white/40 mb-2">
              <BellIcon className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-white/60 text-sm">No hay notificaciones</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <button className="w-full text-center text-[var(--color-accent-1)] hover:text-[var(--color-hover)] font-medium text-sm transition-colors">
            Ver todas las notificaciones →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;