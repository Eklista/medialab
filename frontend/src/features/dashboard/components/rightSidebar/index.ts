// frontend/src/features/dashboard/components/rightSidebar/index.ts

export { default as TasksPanel } from './TasksPanel';
export { default as NotificationsPanel } from './NotificationsPanel';
export { default as OnlineUsersPanel } from './OnlineUsersPanel';

// Types
export type { 
  TaskItem, 
  NotificationItem, 
  OnlineUser, 
  PanelProps, 
  RightSidebarSection 
} from './shared/types';

// Utils
export { 
  getPriorityColor, 
  getNotificationIcon, 
  getInitials, 
  formatRelativeTime 
} from './shared/utils';