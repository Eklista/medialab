// src/features/dashboard/components/ui/Calendar.tsx
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
  view?: 'day' | 'mini' | 'full' | 'mobile';
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface TimeSlot {
  hour: number;
  time: string;
  events: any[];
}

// Colores por tipo de evento - Cards con fondos vibrantes como la imagen
const eventColors: Record<string, { bg: string, text: string, dot: string }> = {
  recording: { bg: 'bg-purple-500', text: 'text-white', dot: 'bg-purple-300' },
  podcast: { bg: 'bg-lime-400', text: 'text-gray-900', dot: 'bg-lime-200' },
  livestream: { bg: 'bg-red-500', text: 'text-white', dot: 'bg-red-300' },
  editing: { bg: 'bg-emerald-500', text: 'text-white', dot: 'bg-emerald-300' },
  meeting: { bg: 'bg-amber-400', text: 'text-gray-900', dot: 'bg-amber-200' },
  workshop: { bg: 'bg-indigo-500', text: 'text-white', dot: 'bg-indigo-300' },
  delivery: { bg: 'bg-teal-500', text: 'text-white', dot: 'bg-teal-300' },
  photography: { bg: 'bg-pink-500', text: 'text-white', dot: 'bg-pink-300' },
  maintenance: { bg: 'bg-gray-700', text: 'text-white', dot: 'bg-gray-400' },
  event: { bg: 'bg-lime-400', text: 'text-gray-900', dot: 'bg-lime-200' }
};

// Para dots pequeños (mini calendar y calendario completo)
const eventDotColors: Record<string, string> = {
  recording: 'bg-purple-500',
  podcast: 'bg-lime-400', 
  livestream: 'bg-red-500',
  editing: 'bg-emerald-500',
  meeting: 'bg-amber-400',
  workshop: 'bg-indigo-500',
  delivery: 'bg-teal-500',
  photography: 'bg-pink-500',
  maintenance: 'bg-gray-500',
  event: 'bg-lime-400'
};

const Calendar: React.FC<CalendarProps> = ({ 
  className = '',
  view = 'full',
  selectedDate: propSelectedDate,
  onDateChange
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showEventPanel, setShowEventPanel] = useState(false);
  
  const { loading, getEventsForDate } = useCalendar();
  
  const selectedDate = propSelectedDate || internalSelectedDate;
  
  const handleDateChange = (date: Date) => {
    setInternalSelectedDate(date);
    onDateChange?.(date);
  };

  // VISTA DE DÍA - Para Dashboard Home (Sidebar derecho)
  if (view === 'day') {
    const timeSlots: TimeSlot[] = useMemo(() => {
      const slots: TimeSlot[] = [];
      
      for (let hour = 5; hour <= 23; hour++) { // 5 AM a 11 PM
        const time12 = hour === 0 ? '12 AM' 
          : hour < 12 ? `${hour} AM`
          : hour === 12 ? '12 PM'
          : `${hour - 12} PM`;
        
        const events = getEventsForDate(selectedDate).filter(event => {
          const eventHour = parseInt(event.time.split(':')[0]);
          const eventPeriod = event.time.includes('PM') ? 'PM' : 'AM';
          const event24Hour = eventPeriod === 'PM' && eventHour !== 12 
            ? eventHour + 12 
            : eventPeriod === 'AM' && eventHour === 12 
            ? 0 
            : eventHour;
          
          return event24Hour === hour;
        });
        
        slots.push({
          hour,
          time: time12,
          events
        });
      }
      
      return slots;
    }, [selectedDate, getEventsForDate]);

    const navigateDay = (direction: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + direction);
      handleDateChange(newDate);
    };

    const goToToday = () => {
      handleDateChange(new Date());
    };

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentHour = new Date().getHours();

    if (loading) {
      return (
        <div className={`w-[350px] bg-white border-l border-zinc-200 ${className}`}>
          <div className="p-4 animate-pulse">
            <div className="h-6 bg-zinc-200 rounded w-2/3 mb-4"></div>
            <div className="space-y-3" style={{ maxHeight: '60vh' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-[350px] bg-white border-l border-zinc-200 flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Agenda del día
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-medium text-gray-900 bg-lime-400 rounded-lg hover:bg-lime-300 transition-colors shadow-sm"
            >
              Hoy
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {selectedDate.toLocaleDateString('es', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              {isToday && (
                <p className="text-sm text-lime-600 font-bold">Hoy</p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDay(-1)}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => navigateDay(1)}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: '80vh' }}>
          <div className="space-y-2">
            {timeSlots.map(slot => {
              const isCurrentHour = isToday && slot.hour === currentHour;
              
              return (
                <div key={slot.hour} className="relative">
                  {/* Hora */}
                  <div className="flex items-start gap-3">
                    <div className={`text-xs font-medium w-12 text-right pt-1 ${
                      isCurrentHour ? 'text-lime-600' : 'text-zinc-500'
                    }`}>
                      {slot.time}
                    </div>
                    
                    <div className="flex-1 min-h-[2.5rem]">
                      {/* Línea de hora */}
                      <div className={`h-px w-full mt-1.5 ${
                        isCurrentHour ? 'bg-lime-400 shadow-sm' : 'bg-gray-200'
                      }`} />
                      
                      {/* Eventos */}
                      {slot.events.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {slot.events.map(event => {
                            const eventStyle = eventColors[event.type] || { bg: 'bg-gray-700', text: 'text-white', dot: 'bg-gray-400' };
                            return (
                              <div
                                key={event.id}
                                className={`${eventStyle.bg} rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-[1.02] border-0`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold ${eventStyle.text} text-sm truncate mb-1`}>
                                      {event.title}
                                    </h4>
                                    <p className={`text-xs ${eventStyle.text} opacity-80 mb-3 line-clamp-2`}>
                                      {event.description}
                                    </p>
                                    <div className={`flex items-center gap-3 text-xs ${eventStyle.text} opacity-75`}>
                                      <div className="flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        <span className="font-medium">{event.time} - {event.endTime}</span>
                                      </div>
                                    </div>
                                    {event.location && (
                                      <div className={`flex items-center gap-1 mt-1 text-xs ${eventStyle.text} opacity-75`}>
                                        <MapPinIcon className="h-3 w-3" />
                                        <span className="truncate font-medium">{event.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${eventStyle.dot} flex-shrink-0 ml-2`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // VISTA MOBILE - Para Right Sidebar en móviles
  if (view === 'mobile') {
    const today = new Date();
    const eventsToday = getEventsForDate(selectedDate);
    
    const navigateDay = (direction: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + direction);
      handleDateChange(newDate);
    };

    const goToToday = () => {
      handleDateChange(new Date());
    };

    const isToday = selectedDate.toDateString() === today.toDateString();

    if (loading) {
      return (
        <div className={`bg-[var(--color-text-main)] h-full ${className}`}>
          <div className="p-4 animate-pulse">
            <div className="h-6 bg-white/20 rounded w-2/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-[var(--color-text-main)] h-full flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">
              Mi Agenda
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-medium text-[var(--color-text-main)] bg-[var(--color-accent-1)] rounded-lg hover:bg-[var(--color-hover)] transition-colors"
            >
              Hoy
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-medium text-white">
                {selectedDate.toLocaleDateString('es', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h4>
              {isToday && (
                <p className="text-sm text-[var(--color-accent-1)] font-medium">Hoy</p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDay(-1)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 text-white/60" />
              </button>
              <button
                onClick={() => navigateDay(1)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 text-white/60" />
              </button>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-white/60">
            {eventsToday.length} eventos programados
          </div>
        </div>

        {/* Eventos del día */}
        <div className="flex-1 overflow-y-auto p-4">
          {eventsToday.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white/60">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-sm font-medium mb-1">No hay eventos</p>
                <p className="text-xs text-white/40">
                  {isToday ? 'Disfruta tu día libre' : 'Día sin eventos programados'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {eventsToday.map(event => {
                const eventStyle = eventColors[event.type] || { bg: 'bg-gray-700', text: 'text-white', dot: 'bg-gray-400' };
                return (
                  <div
                    key={event.id}
                    className={`${eventStyle.bg} rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-bold ${eventStyle.text} text-sm mb-2 line-clamp-2`}>
                          {event.title}
                        </h5>
                        
                        {event.description && (
                          <p className={`text-xs ${eventStyle.text} opacity-80 mb-3 line-clamp-2`}>
                            {event.description}
                          </p>
                        )}
                        
                        <div className={`flex items-center gap-3 text-xs ${eventStyle.text} opacity-75`}>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span className="font-medium">{event.time} - {event.endTime}</span>
                          </div>
                        </div>
                        
                        {event.location && (
                          <div className={`flex items-center gap-1 mt-1 text-xs ${eventStyle.text} opacity-75`}>
                            <MapPinIcon className="h-3 w-3" />
                            <span className="truncate font-medium">{event.location}</span>
                          </div>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${eventStyle.dot} flex-shrink-0 ml-2`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con acción */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full text-center text-[var(--color-accent-1)] hover:text-[var(--color-hover)] font-medium text-sm transition-colors">
            Ver calendario completo →
          </button>
        </div>
      </div>
    );
  }
  if (view === 'mini') {
    const today = new Date();
    const miniCalendarDays = useMemo((): DayInfo[] => {
      const year = today.getFullYear();
      const month = today.getMonth();
      
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
        const isToday = date.toDateString() === today.toDateString();
        
        days.push({
          date,
          isCurrentMonth: true,
          isToday
        });
      }
      
      // Días del mes siguiente
      const remaining = 35 - days.length;
      for (let day = 1; day <= remaining; day++) {
        days.push({
          date: new Date(year, month + 1, day),
          isCurrentMonth: false,
          isToday: false
        });
      }
      
      return days;
    }, []);

    return (
      <div className={`bg-white rounded-lg border border-zinc-200 ${className}`}>
        <div className="p-3">
          {/* Header mini */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-950">
              {today.toLocaleDateString('es', { month: 'short' })}
            </h3>
            <CalendarDaysIcon className="h-4 w-4 text-zinc-400" />
          </div>
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
              <div key={day} className="text-center text-xs text-zinc-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1">
            {miniCalendarDays.map((dayInfo, index) => {
              const dayEvents = getEventsForDate(dayInfo.date);
              
              return (
                <button
                  key={index}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center text-xs rounded transition-colors
                    ${!dayInfo.isCurrentMonth 
                      ? 'text-zinc-300' 
                      : 'text-zinc-700 hover:bg-zinc-100'
                    }
                    ${dayInfo.isToday 
                      ? 'bg-lime-100 text-lime-800 font-medium' 
                      : ''
                    }
                  `}
                  onClick={() => handleDateChange(dayInfo.date)}
                >
                  <span className="mb-0.5">{dayInfo.date.getDate()}</span>
                  
                  {/* Dots para eventos */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 justify-center">
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`w-1 h-1 rounded-full ${eventDotColors[event.type] || 'bg-gray-400'}`}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="w-1 h-1 rounded-full bg-amber-400" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // VISTA COMPLETA - Para CalendarPage
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

  const handleDayClick = (dayInfo: DayInfo) => {
    handleDateChange(dayInfo.date);
    setShowEventPanel(true);
  };

  const selectedDayEvents = getEventsForDate(selectedDate);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-zinc-200 shadow-sm ${className}`}>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-zinc-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-950">
            {currentDate.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-zinc-100"
            >
              <ChevronLeftIcon className="h-5 w-5 text-zinc-600" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-lime-100 rounded-lg hover:bg-lime-200"
            >
              Hoy
            </button>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-zinc-100"
            >
              <ChevronRightIcon className="h-5 w-5 text-zinc-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-zinc-500 py-2">
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
                    ? 'text-zinc-300 hover:bg-zinc-50' 
                    : 'text-zinc-900 hover:bg-lime-50'
                  }
                  ${dayInfo.isToday 
                    ? 'bg-lime-100 ring-2 ring-lime-200 font-semibold' 
                    : ''
                  }
                  ${isSelected 
                    ? 'bg-lime-200 ring-2 ring-lime-300' 
                    : ''
                  }
                `}
              >
                <span className={`text-sm ${dayInfo.isToday ? 'text-lime-800' : ''}`}>
                  {dayInfo.date.getDate()}
                </span>
                
                {/* Eventos como dots */}
                {dayEvents.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`w-1.5 h-1.5 rounded-full ${eventDotColors[event.type] || 'bg-gray-400'}`}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-zinc-500 font-medium">
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
        <div className="hidden lg:block fixed right-4 top-20 w-80 bg-white rounded-xl border border-zinc-200 shadow-xl z-50">
          <div className="p-4 border-b border-zinc-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-950">
                {selectedDate.toLocaleDateString('es', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <button
                onClick={() => setShowEventPanel(false)}
                className="p-1 rounded-lg hover:bg-zinc-100"
              >
                <XMarkIcon className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm">No hay eventos para este día</p>
              </div>
            ) : (
              selectedDayEvents.map(event => (
                <div key={event.id} className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${eventDotColors[event.type] || 'bg-zinc-400'}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-950 text-sm">{event.title}</h4>
                      <p className="text-xs text-zinc-600 mt-1">{event.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{event.time} - {event.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
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