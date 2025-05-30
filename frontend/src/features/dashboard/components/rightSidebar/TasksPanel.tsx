// frontend/src/features/dashboard/components/rightSidebar/TasksPanel.tsx

import React from 'react';
import { 
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { TaskItem, PanelProps } from './shared/types';
import { getPriorityColor } from './shared/utils';

interface TasksPanelProps extends PanelProps {
  tasks?: TaskItem[];
}

// Datos de muestra - puedes moverlos a un servicio o context
const defaultTasks: TaskItem[] = [
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

const TasksPanel: React.FC<TasksPanelProps> = ({ 
  tasks = defaultTasks,
  className = ''
}) => {
  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'Completada': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'En progreso': return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'Pendiente': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const pendingTasksCount = tasks.filter(task => task.status !== 'Completada').length;

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Mis Tareas</h3>
        <p className="text-white/70 text-sm">{pendingTasksCount} tareas pendientes</p>
      </div>
      
      {/* Task List */}
      <div className="p-4 space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-medium text-sm leading-snug group-hover:text-[var(--color-accent-1)] transition-colors">
                  {task.title}
                </h4>
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
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-white/40 mb-2">
              <CheckCircleIcon className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-white/60 text-sm">No hay tareas pendientes</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {tasks.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <button className="w-full text-center text-[var(--color-accent-1)] hover:text-[var(--color-hover)] font-medium text-sm transition-colors">
            Ver todas las tareas →
          </button>
        </div>
      )}
    </div>
  );
};

export default TasksPanel;