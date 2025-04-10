// src/features/service-request/activityDetails/SingleActivityDetails.tsx
import React, { useState } from 'react';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import RadioButtonOption from '../components/RadioButtonOption';
import Textarea from '../components/TextArea';
// Import departments data
import { departments } from '../data/faculties';
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
      {/* Contenedor principal */}
      
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
        
        {/* Facultad */}
        <Select
          id="single-activity-faculty"
          name="single-activity-faculty"
          label="Facultad"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          options={departments}
          placeholder="Seleccione una facultad"
          required
        />
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