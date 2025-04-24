// src/features/dashboard/components/requests/types.ts

// Definición de estados de solicitud
export type RequestStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

// Tipos de actividad
export type ActivityType = 'single' | 'recurrent' | 'podcast' | 'course';

// Interfaz para los servicios solicitados
export interface RequestedService {
  id: string;
  name: string;
  description?: string;
  subServices?: {
    id: string;
    name: string;
  }[];
}

// Interfaz para el solicitante
export interface Requester {
  name: string;
  email: string;
  department: string;
  phone?: string;
  requestDate: string;
}

// Interfaz para ubicación
export interface Location {
  type: 'university' | 'external' | 'virtual';
  details?: string;
  tower?: string;
  classroom?: string;
  address?: string;
}

// Interfaz base para detalles específicos
export interface BaseActivityDetails {
  location: Location;
  additionalNotes?: string;
}

// Detalles para actividad única
export interface SingleActivityDetails extends BaseActivityDetails {
  activityDate: string;
  startTime: string;
  endTime: string;
}

// Detalles para actividad recurrente
export interface RecurrentActivityDetails extends BaseActivityDetails {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'manual';
  weekDays?: string[];
  specificDates?: string[];
}

// Detalles para podcast
export interface PodcastDetails extends BaseActivityDetails {
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  isRecurrent: boolean;
  episodes?: {
    id: string;
    name: string;
    topic: string;
    recordingDate?: string;
  }[];
  moderators?: {
    id: string;
    name: string;
    position: string;
    role: string;
  }[];
}

// Detalles para curso
export interface CourseDetails extends BaseActivityDetails {
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  isRecurrent: boolean;
  courses?: {
    id: string;
    name: string;
    professor: string;
    faculty: string;
    duration: string;
    recordingDates?: string[];
  }[];
}

// Unión de todos los tipos de detalles
export type ActivityDetails = 
  | SingleActivityDetails
  | RecurrentActivityDetails
  | PodcastDetails
  | CourseDetails;

// Interfaz principal para una solicitud de servicio
export interface ServiceRequest {
  id: string;
  title: string;
  type: ActivityType;
  typeLabel: string;
  typeClass: string;
  status: RequestStatus;
  statusLabel: string;
  statusClass: string;
  dateLabel: string;
  createDate: string;
  updateDate: string;
  daysInProgress?: number;
  requester: Requester;
  services: RequestedService[];
  details?: Record<string, any>;
  additionalNotes?: string;
  files?: {
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
    uploadDate: string;
  }[];
}

// Interfaces auxiliares para los filtros
export interface RequestFilter {
  status?: RequestStatus | 'all';
  type?: ActivityType | 'all';
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}