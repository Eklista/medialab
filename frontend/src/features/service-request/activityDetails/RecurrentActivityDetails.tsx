// src/features/service-request/activityDetails/RecurrentActivityDetails.tsx
import React, { useState, useEffect } from 'react';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import RadioButtonOption from '../components/RadioButtonOption';
import Textarea from '../components/TextArea';
import Checkbox from '../components/Checkbox';
import MultiDayPicker from '../components/MultiDayPicker';
import { publicService } from '../../../services';
import { PublicDepartment } from '../../../services/public.service';
import { SelectOption } from '../components';
import { ClockIcon, CalendarDaysIcon, ArrowPathIcon, CalendarIcon, BuildingOfficeIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

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

// Location type options
const locationTypeOptions = [
  { 
    id: 'university', 
    value: 'university', 
    label: 'Universidad',
    icon: <BuildingOfficeIcon className="h-6 w-6" />
  },
  { 
    id: 'external', 
    value: 'external', 
    label: 'Ubicación externa',
    icon: <MapPinIcon className="h-6 w-6" />
  },
  { 
    id: 'virtual', 
    value: 'virtual', 
    label: 'Virtual',
    icon: <GlobeAltIcon className="h-6 w-6" />
  }
];

const RecurrentActivityDetails: React.FC = () => {
  // State for form fields
  const [activityName, setActivityName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Estado para los departamentos cargados desde la API
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  
  // useEffect para cargar departamentos
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const departments = await publicService.getPublicDepartments();
        const formattedDepartments = departments.map((dept: PublicDepartment) => ({
          value: dept.id.toString(),
          label: dept.abbreviation
        }));
        setDepartments(formattedDepartments);
        setDepartmentsError(''); // Usar string vacía en lugar de null
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
        setDepartmentsError('No se pudieron cargar los departamentos.');
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);  
  
  
  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [weekOfMonth, setWeekOfMonth] = useState('');
  const [monthlyOption, setMonthlyOption] = useState('week'); // 'week', 'dayOfMonth' o 'manual'
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  
  // Location states
  const [locationType, setLocationType] = useState('');
  const [tower, setTower] = useState('');
  const [classroom, setClassroom] = useState('');
  const [externalAddress, setExternalAddress] = useState('');
  
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Handle recurrence type change
  const handleRecurrenceTypeChange = (value: string) => {
    setRecurrenceType(value);
  };

  // Handle location type change
  const handleLocationTypeChange = (value: string) => {
    setLocationType(value);
  };

  // Toggle day selection for weekly recurrence
  const handleDayToggle = (day: string) => {
    if (selectedWeekDays.includes(day)) {
      setSelectedWeekDays(selectedWeekDays.filter(d => d !== day));
    } else {
      setSelectedWeekDays([...selectedWeekDays, day]);
    }
  };

  // Get recurrence pattern text
  const getRecurrencePatternText = () => {
    if (!recurrenceType) return "Seleccione un tipo de recurrencia";
    
    if (recurrenceType === 'daily') {
      return "Esta actividad se repetirá todos los días desde la fecha de inicio hasta la fecha de fin.";
    }
    
    if (recurrenceType === 'weekly') {
      if (selectedWeekDays.length === 0) return "Seleccione al menos un día de la semana.";
      
      const dayNames = selectedWeekDays.map(day => {
        const dayObj = weekDays.find(d => d.id === day);
        return dayObj ? dayObj.label : '';
      }).join(', ');
      
      return `Esta actividad se repetirá los días: ${dayNames}, desde la fecha de inicio hasta la fecha de fin.`;
    }
    
    if (recurrenceType === 'monthly') {
      if (monthlyOption === 'week') {
        if (!weekOfMonth) return "Seleccione una semana del mes.";
        
        const weekLabel = weekOfMonthOptions.find(w => w.value === weekOfMonth)?.label || '';
        if (selectedWeekDays.length === 0) return `Esta actividad se repetirá en la ${weekLabel.toLowerCase()} de cada mes, desde la fecha de inicio hasta la fecha de fin.`;
        
        const dayNames = selectedWeekDays.map(day => {
          const dayObj = weekDays.find(d => d.id === day);
          return dayObj ? dayObj.label : '';
        }).join(', ');
        
        return `Esta actividad se repetirá en la ${weekLabel.toLowerCase()} de cada mes, los días ${dayNames}, desde la fecha de inicio hasta la fecha de fin.`;
      } else if (monthlyOption === 'dayOfMonth') {
        if (!dayOfMonth) return "Seleccione un día del mes.";
        
        return `Esta actividad se repetirá el día ${dayOfMonth} de cada mes, desde la fecha de inicio hasta la fecha de fin.`;
      }
    }
    
    if (recurrenceType === 'manual') {
      if (selectedDates.length === 0) return "Seleccione al menos una fecha específica.";
      
      return `Esta actividad se repetirá en las fechas específicas seleccionadas, desde la fecha de inicio hasta la fecha de fin.`;
    }
    
    return "Patrón de recurrencia no definido.";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Contenedor principal */}
      
      {/* Mensaje de error si no se pueden cargar los departamentos */}
      {departmentsError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{departmentsError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Nombre y Facultad (primera fila) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Nombre de la actividad */}
        <TextInput
          id="recurrent-activity-name"
          name="recurrent-activity-name"
          label="Nombre de actividad"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="Ej. Conferencia Semanal"
          required
        />
        
        {/* Facultad - Con estado de carga */}
        {isLoadingDepartments ? (
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-black mb-1">
              Facultad<span className="text-red-500 ml-1">*</span>
            </label>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ) : (
          <Select
            id="recurrent-activity-faculty"
            name="recurrent-activity-faculty"
            label="Facultad"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            options={departments}
            placeholder="Seleccione una facultad"
            required
            error={departmentsError || undefined}
          />
        )}
      </div>
      
      {/* 2. Fechas de inicio y fin (segunda fila) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Fecha de inicio */}
        <DatePicker
          id="recurrent-activity-start-date"
          name="recurrent-activity-start-date"
          label="Fecha de inicio"
          selectedDate={startDate}
          onChange={setStartDate}
          required
        />
        
        {/* Fecha de fin */}
        <DatePicker
          id="recurrent-activity-end-date"
          name="recurrent-activity-end-date"
          label="Fecha de fin"
          selectedDate={endDate}
          onChange={setEndDate}
          required
        />
      </div>
      
      {/* 3. Horas de inicio y fin (tercera fila) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Hora inicio */}
        <TimePicker
          id="recurrent-activity-start-time"
          name="recurrent-activity-start-time"
          label="Hora inicio"
          selectedTime={startTime}
          onChange={setStartTime}
          required
        />
        
        {/* Hora fin */}
        <TimePicker
          id="recurrent-activity-end-time"
          name="recurrent-activity-end-time"
          label="Hora fin"
          selectedTime={endTime}
          onChange={setEndTime}
          required
        />
      </div>
      
      {/* 4. Tipo de recurrencia (ancho completo) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">
          Tipo de recurrencia<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recurrenceTypeOptions.map(option => (
            <RadioButtonOption
              key={option.id}
              id={`recurrence-type-${option.id}`}
              name="recurrent-activity-recurrence-type"
              label={option.label}
              value={option.value}
              checked={recurrenceType === option.value}
              onChange={handleRecurrenceTypeChange}
              icon={option.icon}
            />
          ))}
        </div>
      </div>
      
      {/* 5. Detalles de recurrencia según el tipo seleccionado */}
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
                    id={`day-${day.id}`}
                    name={`day-${day.id}`}
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
                    id="monthly-option-week"
                    name="monthly-option"
                    label="Por semana del mes"
                    value="week"
                    checked={monthlyOption === 'week'}
                    onChange={setMonthlyOption}
                    icon={<CalendarDaysIcon className="h-5 w-5" />}
                  />
                  <RadioButtonOption
                    id="monthly-option-day"
                    name="monthly-option"
                    label="Por día del mes"
                    value="dayOfMonth"
                    checked={monthlyOption === 'dayOfMonth'}
                    onChange={setMonthlyOption}
                    icon={<CalendarIcon className="h-5 w-5" />}
                  />
                </div>
              </div>
              
              {monthlyOption === 'week' && (
                <>
                  <div className="mb-4">
                    <Select
                      id="week-of-month"
                      name="week-of-month"
                      label="Semana del mes"
                      value={weekOfMonth}
                      onChange={(e) => setWeekOfMonth(e.target.value)}
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
                        id={`monthly-day-${day.id}`}
                        name={`monthly-day-${day.id}`}
                        label={day.label}
                        checked={selectedWeekDays.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {monthlyOption === 'dayOfMonth' && (
                <div className="mb-4">
                  <Select
                    id="day-of-month"
                    name="day-of-month"
                    label="Día del mes"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
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
                Seleccione las fechas específicas en las que se repetirá la actividad.
              </p>
              <MultiDayPicker
                id="manual-dates"
                name="manual-dates"
                selectedDates={selectedDates}
                onChange={setSelectedDates}
                helperText="Seleccione las fechas específicas para esta actividad."
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
      
      {/* 6. Tipo de ubicación (ancho completo) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">
          Tipo de ubicación<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locationTypeOptions.map(option => (
            <RadioButtonOption
              key={option.id}
              id={`location-type-${option.id}`}
              name="recurrent-activity-location-type"
              label={option.label}
              value={option.value}
              checked={locationType === option.value}
              onChange={handleLocationTypeChange}
              icon={option.icon}
            />
          ))}
        </div>
      </div>
      
      {/* 7. Detalles de ubicación (ancho completo) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">
          Detalles de ubicación<span className="text-red-500 ml-1">*</span>
        </label>
        
        {locationType === 'university' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              id="recurrent-activity-tower"
              name="recurrent-activity-tower"
              label="Torre"
              value={tower}
              onChange={(e) => setTower(e.target.value)}
              placeholder="Ej. Torre A"
              required
            />
            <TextInput
              id="recurrent-activity-classroom"
              name="recurrent-activity-classroom"
              label="Salón"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              placeholder="Ej. 101"
              required
            />
          </div>
        )}
        
        {locationType === 'external' && (
          <TextInput
            id="recurrent-activity-external-address"
            name="recurrent-activity-external-address"
            label="Dirección"
            value={externalAddress}
            onChange={(e) => setExternalAddress(e.target.value)}
            placeholder="Ingrese la dirección completa"
            required
          />
        )}
        
        {locationType === 'virtual' && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">Los enlaces de la producción serán enviados por MediaLab.</p>
          </div>
        )}
        
        {!locationType && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">Seleccione un tipo de ubicación primero.</p>
          </div>
        )}
      </div>
      
      {/* 8. Detalles adicionales (ancho completo) */}
      <div>
        <Textarea
          id="recurrent-activity-additional-details"
          name="recurrent-activity-additional-details"
          label="Detalles adicionales"
          value={additionalDetails}
          onChange={(e) => setAdditionalDetails(e.target.value)}
          placeholder="Ingrese cualquier detalle adicional relevante para la actividad"
          rows={4}
          helperText="Opcional. Máximo 500 caracteres."
          maxLength={500}
          showCharCount
        />
      </div>
    </div>
  );
};

export default RecurrentActivityDetails;