// frontend/src/features/dashboard/components/rightSidebar/shared/types.ts

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  status: 'Pendiente' | 'En progreso' | 'Completada';
  priority: 'Baja' | 'Media' | 'Alta';
}

export interface NotificationItem {
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

export interface OnlineUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  lastSeen: string;
  isOnline: boolean;
  status?: 'available' | 'busy' | 'away';
}

export interface PanelProps {
  onClose?: () => void;
  className?: string;
}

export type RightSidebarSection = 'tasks' | 'notifications' | 'online-users' | null;