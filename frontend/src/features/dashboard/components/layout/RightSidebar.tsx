// frontend/src/features/dashboard/components/layout/RightSidebar.tsx - REFACTORIZADO

import React from 'react';
import { 
  XMarkIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/solid';

// Importar los componentes modulares
import { 
  TasksPanel, 
  NotificationsPanel, 
  OnlineUsersPanel,
  RightSidebarSection 
} from '../rightSidebar';

interface RightSidebarProps {
  activeSection?: RightSidebarSection;
  onClose?: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  activeSection = null,
  onClose
}) => {

  // Función para renderizar el contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'tasks':
        return <TasksPanel />;
      
      case 'notifications':
        return <NotificationsPanel />;
      
      case 'online-users':
        return <OnlineUsersPanel />;
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60">
              <div className="mb-4">
                <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-white/40" />
              </div>
              <p className="text-sm">Selecciona una opción</p>
            </div>
          </div>
        );
    }
  };

  // Función para obtener el título de la sección
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'tasks': return 'Mis Tareas';
      case 'notifications': return 'Actividad Reciente';
      case 'online-users': return 'Usuarios Online';
      default: return 'Panel de Control';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-text-main)]">
      {/* Header simple - solo mostrar botón X si se proporciona onClose */}
      {onClose && (
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {getSectionTitle()}
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

      {/* Contenido dinámico */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default RightSidebar;