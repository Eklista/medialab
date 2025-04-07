// src/features/service-request/Step3Services.tsx
import React, { useState } from 'react';
import { CheckboxGroup, CheckboxOption } from './components';
import { MainService } from './data/services';
// Importar iconos necesarios
import { 
  VideoCameraIcon, 
  AcademicCapIcon, 
  PhotoIcon, 
  DocumentIcon 
} from '@heroicons/react/24/outline';

// Props del componente Step3Services
interface Step3ServicesProps {
  mainServices: MainService[];
  selectedMainServices: string[];
  selectedSubServices: Record<string, string[]>;
  onMainServiceChange: (serviceIds: string[]) => void;
  onSubServiceChange: (mainServiceId: string, subServiceIds: string[]) => void;
}

const Step3Services: React.FC<Step3ServicesProps> = ({
  mainServices,
  selectedMainServices,
  selectedSubServices,
  onMainServiceChange,
  onSubServiceChange
}) => {
  // Estado para validación
  const [errors] = useState<Record<string, string>>({});
  
  // Función para obtener el icono correspondiente
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'video-camera':
        return <VideoCameraIcon className="h-6 w-6" />;
      case 'academic-cap':
        return <AcademicCapIcon className="h-6 w-6" />;
      case 'photo':
        return <PhotoIcon className="h-6 w-6" />;
      default:
        return <DocumentIcon className="h-6 w-6" />;
    }
  };
  
  // Transformar MainServices para el CheckboxGroup
  const mainServiceOptions: CheckboxOption[] = mainServices.map(service => ({
    id: service.id,
    label: service.name,
    value: service.id,
    description: service.description
  }));

  // Renderizar sección de subservicios para un servicio principal seleccionado
  const renderSubServiceSection = (mainService: MainService) => {
    // Convertir subservicios a formato de opciones para CheckboxGroup
    // Incluir la descripción para los tooltips
    const subServiceOptions: CheckboxOption[] = mainService.subServices.map(subService => ({
      id: subService.id,
      label: subService.name,
      value: subService.id,
      description: subService.description
    }));

    return (
      <div key={mainService.id} className="p-6 mb-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2 text-gray-700">
            {getIconComponent(mainService.iconName)}
          </span>
          {mainService.name}
        </h3>
        
        <CheckboxGroup
          name={`subServices_${mainService.id}`}
          label="Seleccione los subservicios requeridos:"
          options={subServiceOptions}
          selectedValues={selectedSubServices[mainService.id] || []}
          onChange={(values) => onSubServiceChange(mainService.id, values)}
          columns={2}
          required
          error={errors[`subServices_${mainService.id}`]}
        />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Título y descripción estandarizados */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Paso 3: Selección de Servicios</h2>
        <div className="h-1 w-32 bg-black rounded-full mb-4"></div>
        <p className="text-base text-gray-600">
          Seleccione los servicios que necesita para su actividad
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Servicios principales */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Servicios Principales</h3>
            <p className="text-gray-600 mb-4">
              Seleccione los servicios principales que necesita para su actividad.
            </p>
            
            <CheckboxGroup
              name="mainServices"
              options={mainServiceOptions}
              selectedValues={selectedMainServices}
              onChange={onMainServiceChange}
              required
              error={errors.mainServices}
            />
          </div>
        </div>

        {/* Main Content - Subservicios */}
        <div className="lg:w-2/3">
          {selectedMainServices.length > 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-4">Detalle de Servicios</h3>
              {/* Renderizar secciones de subservicios para cada servicio principal seleccionado */}
              {mainServices
                .filter(service => selectedMainServices.includes(service.id))
                .map(renderSubServiceSection)}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Ningún servicio seleccionado</h3>
              <p className="text-gray-500">
                Para continuar, seleccione al menos un servicio principal del panel izquierdo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3Services;