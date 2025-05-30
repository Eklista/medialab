// frontend/src/features/dashboard/components/rightSidebar/shared/utils.ts

import { TaskItem, NotificationItem } from './types';

export const getPriorityColor = (priority: TaskItem['priority']): string => {
  switch (priority) {
    case 'Alta': return 'bg-red-100 text-red-700';
    case 'Media': return 'bg-yellow-100 text-yellow-700';
    case 'Baja': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getNotificationIcon = (type: NotificationItem['type']): string => {
  switch (type) {
    case 'success': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'info': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  const nameParts = name.split(' ');
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export const formatRelativeTime = (timestamp: string): string => {
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