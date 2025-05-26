// src/features/dashboard/components/layout/RightSidebar.tsx

import React from 'react';
import { 
  XMarkIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

interface RightSidebarProps {
  activeSection?: 'tasks' | 'notifications' | null;
  onClose?: () => void;
}

// Interfaces para datos
interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  status: 'Pendiente' | 'En progreso' | 'Completada';
  priority: 'Baja' | 'Media' | 'Alta';
}

interface NotificationItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  timestamp: string;
  target?: string;
  type: 'info' | 'success' | 'warning';
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  activeSection = null,
  onClose
}) => {
  
  // Función para obtener iniciales
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Datos de muestra para tareas
  const pendingTasks: TaskItem[] = [
    { 
      id: "task-1", 
      title: "Revisar guión para programa semanal", 
      dueDate: "2025-05-26", 
      status: "Pendiente", 
      priority: "Alta" 
    },
    { 
      id: "task-2", 
      title: "Preparar equipos para transmisión", 
      dueDate: "2025-05-27", 
      status: "En progreso", 
      priority: "Media" 
    },
    { 
      id: "task-3", 
      title: "Editar podcast episodio #45", 
      dueDate: "2025-05-28", 
      status: "Pendiente", 
      priority: "Media" 
    },
    { 
      id: "task-4", 
      title: "Actualizar inventario de equipo", 
      dueDate: "2025-05-30", 
      status: "Pendiente", 
      priority: "Baja" 
    },
    { 
      id: "task-5", 
      title: "Coordinación reunión semanal", 
      dueDate: "2025-05-29", 
      status: "Completada", 
      priority: "Media" 
    }
  ];

  // Datos de muestra para notificaciones
  const notifications: NotificationItem[] = [
    {
      id: "notif-1",
      user: { name: "Carlos Ramírez" },
      action: "completó la transmisión en vivo de",
      target: "Conferencia de Bienvenida",
      timestamp: "Hace 2 horas",
      type: "success"
    },
    {
      id: "notif-2",
      user: { name: "María Fernández" },
      action: "actualizó el estado del proyecto",
      target: "Video institucional",
      timestamp: "Hace 4 horas",
      type: "info"
    },
    {
      id: "notif-3",
      user: { name: "Juan López" },
      action: "asignó un nuevo recurso a",
      target: "Podcast semanal",
      timestamp: "Hace 5 horas",
      type: "info"
    },
    {
      id: "notif-4",
      user: { name: "Sistema" },
      action: "recordatorio: mantenimiento programado",
      timestamp: "Hace 6 horas",
      type: "warning"
    },
    {
      id: "notif-5",
      user: { name: "Lucía Méndez" },
      action: "creó una nueva solicitud de servicio",
      timestamp: "Hace 1 día",
      type: "info"
    }
  ];

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-700';
      case 'Media': return 'bg-yellow-100 text-yellow-700';
      case 'Baja': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'Completada': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'En progreso': return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'Pendiente': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTasks = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Mis Tareas</h3>
        <p className="text-white/70 text-sm">{pendingTasks.filter(t => t.status !== 'Completada').length} tareas pendientes</p>
      </div>
      
      <div className="p-4 space-y-3">
        {pendingTasks.map((task) => (
          <div key={task.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-white font-medium text-sm leading-snug">{task.title}</h4>
              {getStatusIcon(task.status)}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white/60 text-xs">
                <CalendarDaysIcon className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/10">
        <button className="w-full text-center text-[var(--color-accent-1)] hover:text-[var(--color-hover)] font-medium text-sm transition-colors">
          Ver todas las tareas →
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Notificaciones</h3>
        <p className="text-white/70 text-sm">{notifications.length} notificaciones recientes</p>
      </div>
      
      <div className="p-4 space-y-3">
        {notifications.map((notif) => (
          <div key={notif.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200">
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
                <div className="text-sm text-white">
                  <span className="font-medium">{notif.user.name}</span>
                  {" "}
                  <span className="text-white/80">{notif.action}</span>
                  {notif.target && (
                    <span>
                      {" "}
                      <span className="font-medium text-[var(--color-accent-1)]">{notif.target}</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {notif.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/10">
        <button className="w-full text-center text-[var(--color-accent-1)] hover:text-[var(--color-hover)] font-medium text-sm transition-colors">
          Ver todas las notificaciones →
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--color-text-main)]">
      {/* Header simple - solo mostrar botón X si se proporciona onClose */}
      {onClose && (
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {activeSection === 'tasks' ? 'Mis Tareas' : 
             activeSection === 'notifications' ? 'Actividad Reciente' : 'Panel de Control'}
          </h2>
          
          <button 
            className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Contenido según la sección activa */}
      <div className="flex-1 overflow-hidden">
        {activeSection === 'tasks' ? renderTasks() : 
         activeSection === 'notifications' ? renderNotifications() :
         (
           <div className="flex-1 flex items-center justify-center">
             <div className="text-center text-white/60">
               <div className="mb-4">
                 <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-white/40" />
               </div>
               <p className="text-sm">Selecciona una opción</p>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default RightSidebar;