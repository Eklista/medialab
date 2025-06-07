// src/features/dashboard/hooks/useCalendar.ts
import { useState, useEffect } from 'react';

// Interfaces
interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  type: string;
  faculty: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface CalendarData {
  events: CalendarEvent[];
  eventTypes: Record<string, {
    label: string;
    color: string;
    icon: string;
  }>;
  priorities: Record<string, {
    label: string;
    color: string;
    border: string;
  }>;
}

// Mock data para desarrollo
const mockCalendarData: CalendarData = {
  events: [
    {
      id: 1,
      title: "Grabación Conferencia FISICC",
      description: "Conferencia magistral sobre Inteligencia Artificial en la educación",
      date: "2025-06-03",
      time: "09:00",
      endTime: "11:00",
      type: "recording",
      faculty: "FISICC",
      location: "Auditorio Principal",
      priority: "high",
      status: "scheduled"
    },
    {
      id: 2,
      title: "Entrevista Podcast - Dr. García",
      description: "Episodio especial sobre innovación en medicina",
      date: "2025-06-03",
      time: "14:00",
      endTime: "15:30",
      type: "podcast",
      faculty: "FACIMED",
      location: "Estudio A",
      priority: "medium",
      status: "scheduled"
    },
    {
      id: 3,
      title: "Transmisión en Vivo - Graduación",
      description: "Ceremonia de graduación FCEA promoción 2025",
      date: "2025-06-04",
      time: "16:00",
      endTime: "19:00",
      type: "livestream",
      faculty: "FCEA",
      location: "Teatro Universidad",
      priority: "high",
      status: "scheduled"
    },
    {
      id: 4,
      title: "Post-producción Video Institucional",
      description: "Edición final del video promocional 2025",
      date: "2025-06-05",
      time: "08:00",
      endTime: "17:00",
      type: "editing",
      faculty: "MediaLab",
      location: "Sala de Edición",
      priority: "medium",
      status: "in_progress"
    },
    {
      id: 5,
      title: "Reunión Planificación Mensual",
      description: "Revisión de proyectos y planificación de junio",
      date: "2025-06-06",
      time: "10:00",
      endTime: "12:00",
      type: "meeting",
      faculty: "MediaLab",
      location: "Sala de Juntas",
      priority: "high",
      status: "scheduled"
    },
    {
      id: 6,
      title: "Grabación Documental IDEA",
      description: "Sesión de grabación para documental educativo",
      date: "2025-06-06",
      time: "14:00",
      endTime: "17:00",
      type: "recording",
      faculty: "IDEA",
      location: "Estudio B",
      priority: "medium",
      status: "scheduled"
    },
    {
      id: 7,
      title: "Workshop Técnico",
      description: "Capacitación en nuevas técnicas de iluminación",
      date: "2025-06-07",
      time: "09:00",
      endTime: "12:00",
      type: "workshop",
      faculty: "MediaLab",
      location: "Estudio Principal",
      priority: "low",
      status: "scheduled"
    },
    {
      id: 8,
      title: "Entrega Final - Proyecto FACOM",
      description: "Presentación de campaña publicitaria estudiantil",
      date: "2025-06-09",
      time: "15:00",
      endTime: "16:30",
      type: "delivery",
      faculty: "FACOM",
      location: "Sala de Presentaciones",
      priority: "high",
      status: "scheduled"
    }
  ],
  eventTypes: {
    recording: {
      label: "Grabación",
      color: "bg-blue-100 text-blue-800",
      icon: "VideoCameraIcon"
    },
    podcast: {
      label: "Podcast",
      color: "bg-purple-100 text-purple-800",
      icon: "MicrophoneIcon"
    },
    livestream: {
      label: "Transmisión",
      color: "bg-red-100 text-red-800",
      icon: "SignalIcon"
    },
    editing: {
      label: "Edición",
      color: "bg-green-100 text-green-800",
      icon: "FilmIcon"
    },
    meeting: {
      label: "Reunión",
      color: "bg-orange-100 text-orange-800",
      icon: "UserGroupIcon"
    },
    workshop: {
      label: "Taller",
      color: "bg-indigo-100 text-indigo-800",
      icon: "AcademicCapIcon"
    },
    delivery: {
      label: "Entrega",
      color: "bg-teal-100 text-teal-800",
      icon: "CheckCircleIcon"
    },
    photography: {
      label: "Fotografía",
      color: "bg-pink-100 text-pink-800",
      icon: "PhotoIcon"
    },
    maintenance: {
      label: "Mantenimiento",
      color: "bg-gray-100 text-gray-800",
      icon: "WrenchScrewdriverIcon"
    },
    event: {
      label: "Evento",
      color: "bg-yellow-100 text-yellow-800",
      icon: "StarIcon"
    }
  },
  priorities: {
    high: {
      label: "Alta",
      color: "bg-red-100 text-red-800",
      border: "border-red-200"
    },
    medium: {
      label: "Media",
      color: "bg-orange-100 text-orange-800",
      border: "border-orange-200"
    },
    low: {
      label: "Baja",
      color: "bg-green-100 text-green-800",
      border: "border-green-200"
    }
  }
};

export const useCalendar = () => {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Por ahora usamos mock data, pero esto se puede cambiar fácilmente por una llamada a API
        setCalendarData(mockCalendarData);
        
      } catch (err) {
        console.error('Error loading calendar data:', err);
        setError('Error al cargar los eventos del calendario');
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, []);

  // Utilidades para trabajar con los eventos
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!calendarData) return [];
    const dateKey = date.toISOString().split('T')[0];
    return calendarData.events.filter(event => event.date === dateKey);
  };

  const getUpcomingEvents = (limit: number = 5): CalendarEvent[] => {
    if (!calendarData) return [];
    const today = new Date();
    return calendarData.events
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  };

  const getTodayEvents = (): CalendarEvent[] => {
    return getEventsForDate(new Date());
  };

  const getEventsByFaculty = (faculty: string): CalendarEvent[] => {
    if (!calendarData) return [];
    return calendarData.events.filter(event => event.faculty === faculty);
  };

  const getEventsByType = (type: string): CalendarEvent[] => {
    if (!calendarData) return [];
    return calendarData.events.filter(event => event.type === type);
  };

  return {
    calendarData,
    loading,
    error,
    // Métodos útiles
    getEventsForDate,
    getUpcomingEvents,
    getTodayEvents,
    getEventsByFaculty,
    getEventsByType
  };
};