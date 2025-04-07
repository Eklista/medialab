// src/features/service-request/Step4ActivityRequester.tsx
import React, { useEffect } from 'react';
import { 
  TextInput, 
  Select,
  Textarea,
  SelectOption
} from './components';
import { UserIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

// Interface para los datos del solicitante
export interface RequesterData {
  name: string;
  department: string;
  email: string;
  phone: string;
  requestDate: Date | null;
  additionalNotes: string;
}

// Props del componente Step4ActivityRequester
interface Step4ActivityRequesterProps {
  requesterData: RequesterData;
  onRequesterDataChange: (data: Partial<RequesterData>) => void;
  departments: SelectOption[];
  errors?: Record<string, string>;
}

const Step4ActivityRequester: React.FC<Step4ActivityRequesterProps> = ({
  requesterData,
  onRequesterDataChange,
  departments,
  errors = {}
}) => {
  // Establecer fecha actual en UTC-6 (Guatemala, Centroamérica)
  useEffect(() => {
    if (!requesterData.requestDate) {
      const now = new Date();
      // Ajustar a UTC-6 (Guatemala, América Central)
      const utcMinus6Date = new Date(now.getTime());
      onRequesterDataChange({ requestDate: utcMinus6Date });
    }
  }, []);

  // Función para actualizar un campo específico
  const handleFieldChange = (field: keyof RequesterData, value: any) => {
    onRequesterDataChange({ [field]: value });
  };

  // Formatear fecha para mostrar (DD/MM/YYYY)
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Guatemala'
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 border-b pb-3">Datos del Solicitante</h2>
        {/* Fecha de solicitud */}
        <div className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-1">
              Fecha de solicitud
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-700">
              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span>{formatDate(requesterData.requestDate)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Nombre del solicitante */}
          <TextInput
            id="requester-name"
            name="requester-name"
            label="Nombre completo"
            value={requesterData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Ingrese su nombre completo"
            required
            error={errors.name}
            icon={<UserIcon className="h-5 w-5" />}
          />
          
          {/* Departamento/Facultad */}
          <Select
            id="department"
            name="department"
            label="Departamento/Facultad"
            value={requesterData.department}
            onChange={(e) => handleFieldChange('department', e.target.value)}
            options={departments}
            placeholder="Seleccione su departamento o facultad"
            required
            error={errors.department}
          />
          
          {/* Email */}
          <TextInput
            id="requester-email"
            name="requester-email"
            label="Correo electrónico"
            value={requesterData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="ejemplo@galileo.edu"
            type="email"
            required
            error={errors.email}
            icon={<EnvelopeIcon className="h-5 w-5" />}
          />
          
          {/* Teléfono de contacto */}
          <TextInput
            id="requester-phone"
            name="requester-phone"
            label="Teléfono de contacto"
            value={requesterData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="Extensión o número de teléfono"
            type="tel"
            error={errors.phone}
            helperText="Opcional. Solo números, sin guiones ni espacios."
            icon={<PhoneIcon className="h-5 w-5" />}
          />
        </div>
        
        {/* Notas adicionales */}
        <div className="mt-6">
          <Textarea
            id="additional-notes"
            name="additional-notes"
            label="Notas adicionales"
            value={requesterData.additionalNotes}
            onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
            placeholder="Si tiene información adicional relevante para su solicitud, ingrésela aquí"
            rows={4}
            helperText="Opcional. Máximo 500 caracteres."
            maxLength={500}
            showCharCount
          />
        </div>
      </div>
      
      {/* Información de privacidad */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-600" />
          Información de privacidad
        </h3>
        <p className="text-sm text-gray-600">
          Los datos proporcionados serán utilizados exclusivamente para procesar su solicitud de servicio.
          No compartiremos su información con terceros sin su consentimiento.
        </p>
      </div>
    </div>
  );
};

export default Step4ActivityRequester;