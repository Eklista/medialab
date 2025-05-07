// src/features/service-request/Step3Services.tsx
import React, { useState, useEffect } from 'react';
import { CheckboxGroup, CheckboxOption } from './components';
import { MainService } from './data/services';
// Importar servicio de API público en lugar del que requiere autenticación
import { publicService } from '../../services';
import { Service } from '../../services/services.service';

// Importar iconos necesarios
import { 
  VideoCameraIcon, 
  AcademicCapIcon, 
  PhotoIcon, 
  DocumentIcon,
  CodeBracketIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  CubeIcon,
  GlobeAltIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
  CloudIcon,
  CommandLineIcon,
  MicrophoneIcon
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
  mainServices: defaultMainServices,
  selectedMainServices,
  selectedSubServices,
  onMainServiceChange,
  onSubServiceChange
}) => {
  // Estado para validación
  const [errors] = useState<Record<string, string>>({});
  
  // Estado para servicios cargados desde la API
  const [apiServices, setApiServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar servicios desde la API (usando el endpoint público)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        // Usar el método público en lugar del que requiere autenticación
        const services = await publicService.getPublicServices();
        setApiServices(services);
        setError(null);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setError('No se pudieron cargar los servicios. Usando datos predeterminados.');
        // En caso de error, no actualizamos apiServices para que use los valores por defecto
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServices();
  }, []);
  
  // Convertir servicios de la API al formato esperado por el componente
  const convertApiServiceToMainService = (apiService: Service): MainService => {
    return {
      id: apiService.id?.toString() || '',
      name: apiService.name,
      description: apiService.description || '',
      iconName: apiService.icon_name || 'document',
      subServices: apiService.sub_services.map(subService => ({
        id: subService.id?.toString() || '',
        name: subService.name,
        description: subService.description || '',
        serviceId: apiService.id?.toString() || ''
      }))
    };
  };
  
  // Determinar qué servicios usar: los de la API o los predeterminados
  const mainServices = apiServices.length > 0 
    ? apiServices.map(convertApiServiceToMainService)
    : defaultMainServices;
  
  // Función para obtener el icono correspondiente
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'video-camera':
        return <VideoCameraIcon className="h-6 w-6" />;
      case 'academic-cap':
        return <AcademicCapIcon className="h-6 w-6" />;
      case 'photo':
        return <PhotoIcon className="h-6 w-6" />;
      case 'code':
        return <CodeBracketIcon className="h-6 w-6" />;
      case 'chart-bar':
        return <ChartBarIcon className="h-6 w-6" />;
      case 'desktop-computer':
        return <ComputerDesktopIcon className="h-6 w-6" />;
      case 'cube':
        return <CubeIcon className="h-6 w-6" />;
      case 'globe':
        return <GlobeAltIcon className="h-6 w-6" />;
      case 'presentation-chart-line':
        return <PresentationChartLineIcon className="h-6 w-6" />;
      case 'template':
        return <DocumentTextIcon className="h-6 w-6" />;
      case 'cloud':
        return <CloudIcon className="h-6 w-6" />;
      case 'terminal':
        return <CommandLineIcon className="h-6 w-6" />;
      case 'microphone':
        return <MicrophoneIcon className="h-6 w-6" />;
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
        
        {subServiceOptions.length > 0 ? (
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
        ) : (
          <p className="text-gray-500 italic">No hay subservicios disponibles para esta categoría.</p>
        )}
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

      {/* Mensaje de error si no se pueden cargar los servicios */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default Step3Services;