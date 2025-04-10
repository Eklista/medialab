// src/features/service-request/activityDetails/components/CourseRecurrenceSettings.tsx
import React from 'react';
import {
  Checkbox,
  DatePicker,
  TimePicker,
  MultiDayPicker,
  RadioButtonOption,
  Select
} from '../../components';
import { CalendarDaysIcon, ArrowPathIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

// Días de la semana para opción semanal
const weekDays = [
  { id: 'monday', label: 'Lunes' },
  { id: 'tuesday', label: 'Martes' },
  { id: 'wednesday', label: 'Miércoles' },
  { id: 'thursday', label: 'Jueves' },
  { id: 'friday', label: 'Viernes' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
];

// Opciones para semana del mes
const weekOfMonthOptions = [
  { value: 'first', label: 'Primera semana' },
  { value: 'second', label: 'Segunda semana' },
  { value: 'third', label: 'Tercera semana' },
  { value: 'fourth', label: 'Cuarta semana' },
  { value: 'last', label: 'Última semana' }
];

// Opciones para día del mes
const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Día ${i + 1}`
}));

// Recurrence type options
const recurrenceTypeOptions = [
  { 
    id: 'daily', 
    value: 'daily', 
    label: 'Diario',
    icon: <CalendarDaysIcon className="h-6 w-6" />
  },
  { 
    id: 'weekly', 
    value: 'weekly', 
    label: 'Semanal',
    icon: <ArrowPathIcon className="h-6 w-6" />
  },
  { 
    id: 'monthly', 
    value: 'monthly', 
    label: 'Mensual',
    icon: <CalendarIcon className="h-6 w-6" />
  },
  {
    id: 'manual',
    value: 'manual',
    label: 'Manual',
    icon: <ClockIcon className="h-6 w-6" />
  }
];

export interface RecurrenceData {
  isRecurrent: boolean;
  startDate: Date | null;
  endDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  recurrenceType: string;
  selectedWeekDays: string[];
  weekOfMonth: string;
  dayOfMonth: string;
  selectedDates: Date[];
}

interface CourseRecurrenceSettingsProps {
  recurrenceData: RecurrenceData;
  onRecurrenceChange: (data: Partial<RecurrenceData>) => void;
}

const CourseRecurrenceSettings: React.FC<CourseRecurrenceSettingsProps> = ({
  recurrenceData,
  onRecurrenceChange
}) => {
  const {
    isRecurrent,
    startDate,
    endDate,
    startTime,
    endTime,
    recurrenceType,
    selectedWeekDays,
    weekOfMonth,
    dayOfMonth,
    selectedDates
  } = recurrenceData;

  // Toggle day selection for weekly recurrence
  const handleDayToggle = (day: string) => {
    let newSelectedDays;
    if (selectedWeekDays.includes(day)) {
      newSelectedDays = selectedWeekDays.filter(d => d !== day);
    } else {
      newSelectedDays = [...selectedWeekDays, day];
    }
    onRecurrenceChange({ selectedWeekDays: newSelectedDays });
  };

  // Get recurrence pattern text
  const getRecurrencePatternText = () => {
    if (!recurrenceType) return "Seleccione un tipo de recurrencia";
    
    if (recurrenceType === 'daily') {
      return "Este curso se impartirá todos los días desde la fecha de inicio hasta la fecha de fin.";
    }
    
    if (recurrenceType === 'weekly') {
      if (selectedWeekDays.length === 0) return "Seleccione al menos un día de la semana.";
      
      const dayNames = selectedWeekDays.map(day => {
        const dayObj = weekDays.find(d => d.id === day);
        return dayObj ? dayObj.label : '';
      }).join(', ');
      
      return `Este curso se impartirá los días: ${dayNames}, desde la fecha de inicio hasta la fecha de fin.`;
    }
    
    if (recurrenceType === 'monthly') {
      if (recurrenceType === 'monthly') {
        if (weekOfMonth) {
          const weekLabel = weekOfMonthOptions.find(w => w.value === weekOfMonth)?.label || '';
          if (selectedWeekDays.length === 0) return `Este curso se impartirá en la ${weekLabel.toLowerCase()} de cada mes, desde la fecha de inicio hasta la fecha de fin.`;
          
          const dayNames = selectedWeekDays.map(day => {
            const dayObj = weekDays.find(d => d.id === day);
            return dayObj ? dayObj.label : '';
          }).join(', ');
          
          return `Este curso se impartirá en la ${weekLabel.toLowerCase()} de cada mes, los días ${dayNames}, desde la fecha de inicio hasta la fecha de fin.`;
        } else if (dayOfMonth) {
          return `Este curso se impartirá el día ${dayOfMonth} de cada mes, desde la fecha de inicio hasta la fecha de fin.`;
        }
      }
    }
    
    if (recurrenceType === 'manual') {
      if (selectedDates.length === 0) return "Seleccione al menos una fecha específica.";
      
      return `Este curso se impartirá en las fechas específicas seleccionadas, desde la fecha de inicio hasta la fecha de fin.`;
    }
    
    return "Patrón de recurrencia no definido.";
  };

  // Si no es recurrente, mostrar solo DatePicker y TimePicker
  if (!isRecurrent) {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DatePicker
            id="course-date"
            name="course-date"
            label="Fecha"
            selectedDate={startDate}
            onChange={(date) => onRecurrenceChange({ startDate: date })}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <TimePicker
              id="course-start-time"
              name="course-start-time"
              label="Hora inicio"
              selectedTime={startTime}
              onChange={(time) => onRecurrenceChange({ startTime: time })}
              required
            />
            
            <TimePicker
              id="course-end-time"
              name="course-end-time"
              label="Hora fin"
              selectedTime={endTime}
              onChange={(time) => onRecurrenceChange({ endTime: time })}
              required
            />
          </div>
        </div>
      </div>
    );
  }

  // Si es recurrente, mostrar opciones de recurrencia
  return (
    <div className="mt-6">
      {/* Fechas de inicio y fin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <DatePicker
          id="course-start-date"
          name="course-start-date"
          label="Fecha de inicio"
          selectedDate={startDate}
          onChange={(date) => onRecurrenceChange({ startDate: date })}
          required
        />
        
        <DatePicker
          id="course-end-date"
          name="course-end-date"
          label="Fecha de fin"
          selectedDate={endDate}
          onChange={(date) => onRecurrenceChange({ endDate: date })}
          required
        />
      </div>
      
      {/* Horas de inicio y fin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TimePicker
          id="course-start-time"
          name="course-start-time"
          label="Hora inicio"
          selectedTime={startTime}
          onChange={(time) => onRecurrenceChange({ startTime: time })}
          required
        />
        
        <TimePicker
          id="course-end-time"
          name="course-end-time"
          label="Hora fin"
          selectedTime={endTime}
          onChange={(time) => onRecurrenceChange({ endTime: time })}
          required
        />
      </div>
      
      {/* Tipo de recurrencia */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">
          Tipo de recurrencia<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recurrenceTypeOptions.map(option => (
            <RadioButtonOption
              key={option.id}
              id={`course-recurrence-type-${option.id}`}
              name="course-recurrence-type"
              label={option.label}
              value={option.value}
              checked={recurrenceType === option.value}
              onChange={(value) => onRecurrenceChange({ recurrenceType: value })}
              icon={option.icon}
            />
          ))}
        </div>
      </div>
      
      {/* Detalles de recurrencia según el tipo seleccionado */}
      {recurrenceType && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-black mb-2">
            Detalles de recurrencia
          </label>
          
          {/* Para recurrencia semanal */}
          {recurrenceType === 'weekly' && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-black mb-2">
                Días de repetición<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weekDays.map(day => (
                  <Checkbox
                    key={day.id}
                    id={`course-day-${day.id}`}
                    name={`course-day-${day.id}`}
                    label={day.label}
                    checked={selectedWeekDays.includes(day.id)}
                    onChange={() => handleDayToggle(day.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Para recurrencia mensual */}
          {recurrenceType === 'monthly' && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  Tipo de selección mensual
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <RadioButtonOption
                    id="course-monthly-option-week"
                    name="course-monthly-option"
                    label="Por semana del mes"
                    value="week"
                    checked={Boolean(weekOfMonth)}
                    onChange={() => {
                      onRecurrenceChange({ 
                        weekOfMonth: weekOfMonth || 'first',
                        dayOfMonth: ''
                      });
                    }}
                    icon={<CalendarDaysIcon className="h-5 w-5" />}
                  />
                  <RadioButtonOption
                    id="course-monthly-option-day"
                    name="course-monthly-option"
                    label="Por día del mes"
                    value="dayOfMonth"
                    checked={Boolean(dayOfMonth)}
                    onChange={() => {
                      onRecurrenceChange({ 
                        dayOfMonth: dayOfMonth || '1',
                        weekOfMonth: ''
                      });
                    }}
                    icon={<CalendarIcon className="h-5 w-5" />}
                  />
                </div>
              </div>
              
              {weekOfMonth && (
                <>
                  <div className="mb-4">
                    <Select
                      id="course-week-of-month"
                      name="course-week-of-month"
                      label="Semana del mes"
                      value={weekOfMonth}
                      onChange={(e) => onRecurrenceChange({ weekOfMonth: e.target.value })}
                      options={weekOfMonthOptions}
                      placeholder="Seleccione la semana del mes"
                      required
                    />
                  </div>
                  
                  <label className="block text-sm font-medium text-black mb-2">
                    Días de repetición<span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {weekDays.map(day => (
                      <Checkbox
                        key={day.id}
                        id={`course-monthly-day-${day.id}`}
                        name={`course-monthly-day-${day.id}`}
                        label={day.label}
                        checked={selectedWeekDays.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {dayOfMonth && (
                <div className="mb-4">
                  <Select
                    id="course-day-of-month"
                    name="course-day-of-month"
                    label="Día del mes"
                    value={dayOfMonth}
                    onChange={(e) => onRecurrenceChange({ dayOfMonth: e.target.value })}
                    options={dayOfMonthOptions}
                    placeholder="Seleccione el día del mes"
                    required
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Para selección manual */}
          {recurrenceType === 'manual' && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-black mb-2">
                Selección manual de fechas<span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Seleccione las fechas específicas en las que se impartirá este curso.
              </p>
              <MultiDayPicker
                id="course-manual-dates"
                name="course-manual-dates"
                selectedDates={selectedDates}
                onChange={(dates) => onRecurrenceChange({ selectedDates: dates })}
                helperText="Seleccione las fechas específicas para este curso."
                required
              />
            </div>
          )}
          
          {/* Patrón de recurrencia */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Patrón de recurrencia:</span> {getRecurrencePatternText()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRecurrenceSettings;