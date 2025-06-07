// src/features/dashboard/components/ui/Calendar.tsx
import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SignalIcon,
  FilmIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import Badge from './Badge';
import { useCalendar } from '../../hooks/useCalendar';

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

interface CalendarProps {
  className?: string;
  compact?: boolean;
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
}

// Mapeo de iconos
const iconMap = {
  VideoCameraIcon,
  MicrophoneIcon,
  SignalIcon,
  FilmIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  StarIcon
};

// Configuración de colores por tipo de evento
const eventTypeColors = {
  recording: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    textColor: '#FFFFFF'
  },
  podcast: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    textColor: '#FFFFFF'
  },
  livestream: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    textColor: '#FFFFFF'
  },
  editing: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    textColor: '#FFFFFF'
  },
  meeting: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    textColor: '#FFFFFF'
  },
  workshop: {
    backgroundColor: '#6366F1',
    borderColor: '#4F46E5',
    textColor: '#FFFFFF'
  },
  delivery: {
    backgroundColor: '#14B8A6',
    borderColor: '#0D9488',
    textColor: '#FFFFFF'
  },
  photography: {
    backgroundColor: '#EC4899',
    borderColor: '#DB2777',
    textColor: '#FFFFFF'
  },
  maintenance: {
    backgroundColor: '#6B7280',
    borderColor: '#4B5563',
    textColor: '#FFFFFF'
  },
  event: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    textColor: '#FFFFFF'
  }
};

const Calendar: React.FC<CalendarProps> = ({ 
  className = '',
  compact = false,
  defaultView = 'dayGridMonth'
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState(defaultView);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Usar el hook personalizado para datos del calendario
  const { calendarData, loading, getUpcomingEvents } = useCalendar();

  // Convertir eventos a formato FullCalendar
  const formatEventsForFullCalendar = () => {
    if (!calendarData) return [];
    
    return calendarData.events.map(event => {
      const colors = eventTypeColors[event.type as keyof typeof eventTypeColors] || eventTypeColors.event;
      
      return {
        id: event.id.toString(),
        title: event.title,
        start: `${event.date}T${event.time}`,
        end: `${event.date}T${event.endTime}`,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        extendedProps: {
          description: event.description,
          type: event.type,
          faculty: event.faculty,
          location: event.location,
          priority: event.priority,
          status: event.status,
          originalEvent: event
        }
      };
    });
  };

  const getEventIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <CalendarDaysIcon className="h-4 w-4" />;
  };

  // Manejar clic en evento
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event.extendedProps.originalEvent;
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Cambiar vista del calendario
  const changeView = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(view);
        setCurrentView(view);
    }
  };

  // Navegación del calendario
  const navigateCalendar = (direction: 'prev' | 'next' | 'today') => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (direction === 'prev') {
        calendarApi.prev();
      } else if (direction === 'next') {
        calendarApi.next();
      } else {
        calendarApi.today();
      }
    }
  };

  // Configuración de FullCalendar
  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: currentView,
    events: formatEventsForFullCalendar(),
    eventClick: handleEventClick,
    height: compact ? 400 : 600,
    dayMaxEvents: compact ? 2 : 4,
    moreLinkClick: 'popover',
    eventDisplay: 'block',
    eventTimeFormat: {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
    } satisfies Intl.DateTimeFormatOptions,
    slotLabelFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false
    },
    locale: 'es',
    firstDay: 1, // Lunes como primer día
    weekends: true,
    selectable: true,
    selectMirror: true,
    dayHeaderFormat: { weekday: 'short' as const },
    eventContent: (arg: any) => {
      const event = arg.event;
      const eventType = calendarData?.eventTypes[event.extendedProps.type];
      
      return {
        html: `
          <div class="fc-event-content p-1">
            <div class="flex items-center gap-1 text-xs">
              ${eventType ? `<span class="text-white">${eventType.label}</span>` : ''}
            </div>
            <div class="font-medium text-xs truncate">${event.title}</div>
            <div class="text-xs opacity-90">${event.extendedProps.faculty}</div>
          </div>
        `
      };
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    // Versión compacta para el dashboard
    const upcomingEvents = getUpcomingEvents(3);

    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
          <p className="text-sm text-gray-600">Agenda de MediaLab</p>
        </div>
        
        <div className="p-6">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay eventos próximos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const eventType = calendarData?.eventTypes[event.type];
                const eventDate = new Date(event.date);
                const colors = eventTypeColors[event.type as keyof typeof eventTypeColors] || eventTypeColors.event;
                
                return (
                  <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-500 uppercase">
                          {eventDate.toLocaleDateString('es', { month: 'short' })}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {eventDate.getDate()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors.backgroundColor }}
                        />
                        <h4 className="font-medium text-gray-900 text-sm truncate">{event.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">{event.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{event.time}</span>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {event.faculty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header personalizado del calendario */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Calendario MediaLab</h3>
          
          {/* Controles de vista */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => changeView('dayGridMonth')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'dayGridMonth' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => changeView('timeGridWeek')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'timeGridWeek' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => changeView('timeGridDay')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'timeGridDay' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navegación y botones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateCalendar('today')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Hoy
            </button>
            <button
              onClick={() => navigateCalendar('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Leyenda de colores */}
          <div className="flex items-center gap-4">
            {Object.entries(eventTypeColors).slice(0, 4).map(([type, colors]) => {
              const eventType = calendarData?.eventTypes[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.backgroundColor }}
                  />
                  <span className="text-xs text-gray-600">
                    {eventType?.label || type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendario FullCalendar */}
      <div className="p-6">
        <FullCalendar
          ref={calendarRef}
          {...calendarOptions}
        />
      </div>

      {/* Modal de detalles del evento */}
      {showEventModal && selectedEvent && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowEventModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {calendarData?.eventTypes[selectedEvent.type] && (
                    <div className={`p-2 rounded-lg ${calendarData.eventTypes[selectedEvent.type].color}`}>
                      {getEventIcon(calendarData.eventTypes[selectedEvent.type].icon)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                    <p className="text-sm text-gray-600">{selectedEvent.faculty}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">{selectedEvent.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>{selectedEvent.time} - {selectedEvent.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge 
                    variant={
                      selectedEvent.priority === 'high' ? 'danger' : 
                      selectedEvent.priority === 'medium' ? 'warning' : 'success'
                    }
                  >
                    Prioridad {selectedEvent.priority === 'high' ? 'Alta' : selectedEvent.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                  <Badge variant="secondary">
                    {calendarData?.eventTypes[selectedEvent.type]?.label || selectedEvent.type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;