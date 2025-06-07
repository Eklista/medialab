// src/features/dashboard/components/ui/Calendar.tsx - FRESH START
import React, { useState, useMemo } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../hooks/useCalendar';

// Interfaces
interface CalendarProps {
  className?: string;
  compact?: boolean;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Colores por tipo de evento
const eventColors: Record<string, string> = {
  recording: 'bg-blue-500',
  podcast: 'bg-purple-500',
  livestream: 'bg-red-500',
  editing: 'bg-green-500',
  meeting: 'bg-orange-500',
  workshop: 'bg-indigo-500',
  delivery: 'bg-teal-500',
  photography: 'bg-pink-500',
  maintenance: 'bg-gray-500',
  event: 'bg-yellow-500'
};

const Calendar: React.FC<CalendarProps> = ({ 
  className = '',
  compact = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventPanel, setShowEventPanel] = useState(false);
  
  const { loading, getEventsForDate } = useCalendar();

  // Generar días para el mini calendario
  const miniCalendarDays = useMemo((): DayInfo[] => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0
    
    const days: DayInfo[] = [];
    
    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday
      });
    }
    
    // Días del mes siguiente
    const remaining = 35 - days.length; // 5 semanas
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  }, []);

  const handleDayClick = (dayInfo: DayInfo) => {
    setSelectedDate(dayInfo.date);
    setShowEventPanel(true);
  };

  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    // MINI CALENDARIO VISUAL
    const today = new Date();

    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {today.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-sm text-gray-600">Agenda MediaLab</p>
            </div>
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {/* Calendario mini */}
        <div className="p-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1">
            {miniCalendarDays.map((dayInfo, index) => {
              const dayEvents = getEventsForDate(dayInfo.date);
              
              return (
                <div
                  key={index}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center text-xs rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50
                    ${!dayInfo.isCurrentMonth 
                      ? 'text-gray-300' 
                      : 'text-gray-700'
                    }
                    ${dayInfo.isToday 
                      ? 'bg-blue-100 text-blue-800 font-semibold ring-1 ring-blue-200' 
                      : ''
                    }
                  `}
                  onClick={() => handleDayClick(dayInfo)}
                >
                  <span className="mb-0.5">{dayInfo.date.getDate()}</span>
                  
                  {/* Dots para eventos */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 justify-center">
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`w-1 h-1 rounded-full ${eventColors[event.type] || 'bg-gray-400'}`}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="w-1 h-1 rounded-full bg-gray-400" title={`+${dayEvents.length - 2} más`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{getEventsForDate(today).length} eventos hoy</span>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Ver calendario →
              </button>
            </div>
          </div>
        </div>

        {/* Modal para eventos móvil */}
        {showEventPanel && selectedDate && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-black bg-opacity-50">
            <div className="bg-white rounded-t-xl w-full max-h-[70vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('es', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </h3>
                  <button
                    onClick={() => setShowEventPanel(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto max-h-80">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No hay eventos para este día</p>
                  </div>
                ) : (
                  selectedDayEvents.map(event => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${eventColors[event.type] || 'bg-gray-400'}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>{event.time} - {event.endTime}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CALENDARIO COMPLETO (versión original pero simplificada)
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const fullCalendarDays = useMemo((): DayInfo[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days: DayInfo[] = [];
    
    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday
      });
    }
    
    // Días del mes siguiente
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  }, [currentDate]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hoy
            </button>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-2">
          {fullCalendarDays.map((dayInfo, index) => {
            const dayEvents = getEventsForDate(dayInfo.date);
            const isSelected = selectedDate && dayInfo.date.toDateString() === selectedDate.toDateString();
            
            return (
              <button
                key={index}
                onClick={() => handleDayClick(dayInfo)}
                className={`
                  relative p-2 min-h-[3rem] rounded-lg transition-all duration-200 text-left
                  ${!dayInfo.isCurrentMonth 
                    ? 'text-gray-300 hover:bg-gray-50' 
                    : 'text-gray-900 hover:bg-blue-50'
                  }
                  ${dayInfo.isToday 
                    ? 'bg-blue-100 ring-2 ring-blue-200 font-semibold' 
                    : ''
                  }
                  ${isSelected 
                    ? 'bg-blue-200 ring-2 ring-blue-300' 
                    : ''
                  }
                `}
              >
                <span className={`text-sm ${dayInfo.isToday ? 'text-blue-800' : ''}`}>
                  {dayInfo.date.getDate()}
                </span>
                
                {/* Eventos como dots */}
                {dayEvents.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`w-1.5 h-1.5 rounded-full ${eventColors[event.type] || 'bg-gray-400'}`}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel lateral de eventos desktop */}
      {showEventPanel && selectedDate && (
        <div className="hidden lg:block fixed right-4 top-20 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('es', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <button
                onClick={() => setShowEventPanel(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay eventos para este día</p>
              </div>
            ) : (
              selectedDayEvents.map(event => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${eventColors[event.type] || 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{event.time} - {event.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MapPinIcon className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;