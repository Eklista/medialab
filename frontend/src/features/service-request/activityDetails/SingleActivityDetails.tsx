// src/features/service-request/activityDetails/SingleActivityDetails.tsx
import React, { useState, useEffect } from 'react';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import RadioButtonOption from '../components/RadioButtonOption';
import Textarea from '../components/TextArea';
// Import departments data y servicio público
import { departments } from '../data/faculties';
import { publicService } from '../../../services';
import { PublicDepartment } from '../../../services/public.service';
import { SelectOption } from '../components';
import { BuildingOfficeIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

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

const SingleActivityDetails: React.FC = () => {
  // State for form fields
  const [activityName, setActivityName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [locationType, setLocationType] = useState('');

  // Estado para los departamentos cargados desde la API
  const [departmentsFromDB, setDepartmentsFromDB] = useState<SelectOption[]>([]);
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
        setDepartmentsFromDB(formattedDepartments);
        setDepartmentsError(null);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
        setDepartmentsError('No se pudieron cargar los departamentos.');
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);
  
  // Location details based on location type
  const [tower, setTower] = useState('');
  const [classroom, setClassroom] = useState('');
  const [externalAddress, setExternalAddress] = useState('');
  
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Handle location type change
  const handleLocationTypeChange = (value: string) => {
    setLocationType(value);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
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
          id="single-activity-name"
          name="single-activity-name"
          label="Nombre de actividad"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="Ej. Conferencia de Ingeniería"
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
            id="single-activity-faculty"
            name="single-activity-faculty"
            label="Facultad"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            options={departmentsFromDB.length > 0 ? departmentsFromDB : departments}
            placeholder="Seleccione una facultad"
            required
          />
        )}
      </div>
      
      {/* 2. Fecha y Horarios (segunda fila) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Fecha de la actividad */}
        <DatePicker
          id="single-activity-date"
          name="single-activity-date"
          label="Fecha de la actividad"
          selectedDate={activityDate}
          onChange={setActivityDate}
          required
        />
        
        {/* Hora inicio */}
        <TimePicker
          id="single-activity-start-time"
          name="single-activity-start-time"
          label="Hora inicio"
          selectedTime={startTime}
          onChange={setStartTime}
          required
        />
        
        {/* Hora fin */}
        <TimePicker
          id="single-activity-end-time"
          name="single-activity-end-time"
          label="Hora fin"
          selectedTime={endTime}
          onChange={setEndTime}
          required
        />
      </div>
      
      {/* 3. Tipo de ubicación (ancho completo) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">
          Tipo de ubicación<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {locationTypeOptions.map(option => (
            <RadioButtonOption
              key={option.id}
              id={`location-type-${option.id}`}
              name="single-activity-location-type"
              label={option.label}
              value={option.value}
              checked={locationType === option.value}
              onChange={handleLocationTypeChange}
              icon={option.icon}
            />
          ))}
        </div>
      </div>
      
      {/* 4. Detalles de ubicación (ancho completo) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">
          Detalles de ubicación<span className="text-red-500 ml-1">*</span>
        </label>
        
        {locationType === 'university' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              id="single-activity-tower"
              name="single-activity-tower"
              label="Torre"
              value={tower}
              onChange={(e) => setTower(e.target.value)}
              placeholder="Ej. Torre A"
              required
            />
            <TextInput
              id="single-activity-classroom"
              name="single-activity-classroom"
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
            id="single-activity-external-address"
            name="single-activity-external-address"
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
      
      {/* 5. Detalles adicionales (ancho completo) */}
      <div>
        <Textarea
          id="single-activity-additional-details"
          name="single-activity-additional-details"
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

export default SingleActivityDetails;