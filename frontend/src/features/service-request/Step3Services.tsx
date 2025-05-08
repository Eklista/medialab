// src/features/service-request/Step3Services.tsx
import React, { useState, useEffect } from 'react';
import { CheckboxGroup, CheckboxOption } from './components';
import { MainService } from './data/services';
// Importar servicios
import { publicService } from '../../services';
import { Service } from '../../services/services.service';
import { ServiceTemplate } from '../../services/service-templates.service';

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
  MicrophoneIcon,
  BookmarkIcon
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
  // Estado para plantillas cargadas desde la API
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar servicios y plantillas desde la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Cargar servicios y plantillas en paralelo
        const [services, templates] = await Promise.all([
          publicService.getPublicServices(),
          publicService.getPublicTemplates()
        ]);
        
        setApiServices(services);
        setTemplates(templates);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los servicios o plantillas. Usando datos predeterminados.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
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

  // Manejar cambio de plantilla
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    // Si se selecciona "ninguna", limpiar la selección
    if (!templateId) {
      onMainServiceChange([]);
      return;
    }
    
    try {
      //console.log("Templates disponibles:", templates);
      
      // Encontrar la plantilla seleccionada
      const template = templates.find(t => t.id?.toString() === templateId);
      
      if (!template) {
        console.error("No se encontró la plantilla con ID:", templateId);
        setError("No se pudo encontrar la plantilla seleccionada");
        return;
      }
      
      //console.log("Plantilla seleccionada:", template);
      
      // Extraer los IDs de los servicios de la plantilla
      const serviceIds: string[] = [];
      
      if (template.services && template.services.length > 0) {
        template.services.forEach(service => {
          if (service.id) {
            serviceIds.push(service.id.toString());
          }
        });
      }
      
      //console.log("Servicios seleccionados:", serviceIds);
      
      // Actualizar servicios seleccionados
      onMainServiceChange(serviceIds);
      
      // Preparar el objeto para los subservicios seleccionados
      const newSelectedSubServices: Record<string, string[]> = {};
      
      // Inicializar cada servicio con un array vacío de subservicios
      serviceIds.forEach(serviceId => {
        newSelectedSubServices[serviceId] = [];
      });
      
      // Verificar si la plantilla contiene service_selections
      if (template.service_selections && Array.isArray(template.service_selections)) {
        //console.log("Usando service_selections para determinar subservicios:", template.service_selections);
        
        // Para cada service_selection, obtener los subservicios seleccionados
        template.service_selections.forEach(selection => {
          if (selection.service_id && selection.sub_service_ids) {
            const serviceId = selection.service_id.toString();
            
            // Extraer los IDs de subservicios y filtrar valores inválidos
            const subServiceIds = selection.sub_service_ids
              .map(id => id.toString())
              .filter(Boolean);
            
            //console.log(`Servicio ${serviceId}: subservicios seleccionados =`, subServiceIds);
            
            // Asignar subservicios al servicio correspondiente
            if (serviceIds.includes(serviceId)) {
              newSelectedSubServices[serviceId] = subServiceIds;
            }
          }
        });
      }
      // Verificar si la plantilla contiene subservices directamente
      else if (template.subservices && Array.isArray(template.subservices)) {
        //console.log("Usando subservices para determinar selecciones:", template.subservices);
        
        // Agrupar subservicios por service_id
        serviceIds.forEach(serviceId => {
          const serviceSubservices = template.subservices!
            .filter(sub => sub.service_id?.toString() === serviceId)
            .map(sub => sub.id?.toString() || '')
            .filter(id => id !== '');
          
          //console.log(`Servicio ${serviceId}: subservicios filtrados =`, serviceSubservices);
          
          if (serviceSubservices.length > 0) {
            newSelectedSubServices[serviceId] = serviceSubservices;
          }
        });
      }
      // Si no hay información específica, dejamos los arrays vacíos
      else {
        //console.log("No se encontró información específica de subservicios seleccionados");
      }
      
      //console.log("Subservicios finalmente seleccionados:", newSelectedSubServices);
      
      // Actualizar subservicios seleccionados para cada servicio
      Object.entries(newSelectedSubServices).forEach(([svcId, subSvcIds]) => {
        onSubServiceChange(svcId, subSvcIds);
      });
      
    } catch (error) {
      console.error("Error al procesar la plantilla:", error);
      setError("No se pudieron cargar los detalles de la plantilla seleccionada.");
    }
  };

  // Renderizar sección de subservicios para un servicio principal seleccionado
  const renderSubServiceSection = (mainService: MainService) => {
    // Convertir subservicios a formato de opciones para CheckboxGroup
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
          {/* Sidebar - Plantillas y Servicios principales */}
          <div className="lg:w-1/3">
            {/* Selector de plantillas */}
            {templates.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <BookmarkIcon className="h-6 w-6 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold">Plantillas disponibles</h3>
                    <p className="text-gray-600 text-sm">
                      Seleccione una plantilla predefinida o personalice su selección manualmente.
                    </p>
                  </div>
                </div>
                
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black rounded-md"
                >
                  <option value="">Seleccione una plantilla</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                
                {selectedTemplate && (
                  <p className="mt-3 text-sm text-gray-500">
                    {templates.find(t => t.id?.toString() === selectedTemplate)?.description || 
                    'Plantilla seleccionada. Puede personalizar los servicios a continuación.'}
                  </p>
                )}
              </div>
            )}
            
            {/* Servicios principales */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Servicios Principales</h3>
              <p className="text-gray-600 mb-4">
                {selectedTemplate 
                  ? 'Personalice su selección marcando o desmarcando servicios.'
                  : 'Seleccione los servicios principales que necesita para su actividad.'}
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
                  {templates.length > 0
                    ? 'Para continuar, seleccione una plantilla predefinida o marque los servicios manualmente.'
                    : 'Para continuar, seleccione al menos un servicio principal del panel izquierdo.'}
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