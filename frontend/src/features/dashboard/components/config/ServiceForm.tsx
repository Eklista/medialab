import React, { useState } from 'react';
import DashboardButton from '../ui/DashboardButton';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextArea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import Badge from '../ui/Badge';
import { 
  PlusIcon, 
  TrashIcon,
  CubeIcon,
  DocumentTextIcon,
  SparklesIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PhotoIcon,
  CodeBracketIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  PresentationChartLineIcon,
  CloudIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

// Definimos el tipo para un sub-servicio
export interface SubService {
  id?: number;
  name: string;
  description: string;
}

// Definimos la estructura de datos para el formulario
export interface ServiceFormData {
  name: string;
  description: string;
  iconName: string;
  subServices: SubService[];
}

// Propiedades para el componente
interface ServiceFormProps {
  initialData?: ServiceFormData;
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Lista de opciones de iconos disponibles con iconos reales
const ICON_OPTIONS = [
  { value: 'video-camera', label: 'Cámara de Video', icon: <VideoCameraIcon className="h-4 w-4" /> },
  { value: 'microphone', label: 'Micrófono', icon: <MicrophoneIcon className="h-4 w-4" /> },
  { value: 'photo', label: 'Fotografía', icon: <PhotoIcon className="h-4 w-4" /> },
  { value: 'code', label: 'Código', icon: <CodeBracketIcon className="h-4 w-4" /> },
  { value: 'chart-bar', label: 'Gráfico', icon: <ChartBarIcon className="h-4 w-4" /> },
  { value: 'document', label: 'Documento', icon: <DocumentTextIcon className="h-4 w-4" /> },
  { value: 'academic-cap', label: 'Académico', icon: <AcademicCapIcon className="h-4 w-4" /> },
  { value: 'desktop-computer', label: 'Computadora', icon: <ComputerDesktopIcon className="h-4 w-4" /> },
  { value: 'cube', label: 'Cubo 3D', icon: <CubeIcon className="h-4 w-4" /> },
  { value: 'globe', label: 'Globo', icon: <GlobeAltIcon className="h-4 w-4" /> },
  { value: 'presentation-chart-line', label: 'Presentación', icon: <PresentationChartLineIcon className="h-4 w-4" /> },
  { value: 'cloud', label: 'Nube', icon: <CloudIcon className="h-4 w-4" /> },
  { value: 'terminal', label: 'Terminal', icon: <CommandLineIcon className="h-4 w-4" /> },
];

const ServiceForm: React.FC<ServiceFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting = false
}) => {
  // Inicializar estado con valores por defecto o datos iniciales
  const [formData, setFormData] = useState<ServiceFormData>(initialData || {
    name: '',
    description: '',
    iconName: ICON_OPTIONS[0].value,
    subServices: []
  });
  
  // Estado para manejar errores de validación
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    iconName?: string;
    subServices?: (string | undefined)[];
  }>({});
  
  // Manejar cambios en los campos del formulario principal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando se modifica el campo
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Manejar cambios en los campos de sub-servicios
  const handleSubServiceChange = (index: number, field: keyof SubService, value: string) => {
    const updatedSubServices = [...formData.subServices];
    updatedSubServices[index] = { ...updatedSubServices[index], [field]: value };
    setFormData(prev => ({ ...prev, subServices: updatedSubServices }));
    
    // Limpiar errores de sub-servicios específicos
    if (errors.subServices && errors.subServices[index]) {
      const newSubServiceErrors = [...(errors.subServices || [])];
      newSubServiceErrors[index] = undefined;
      setErrors(prev => ({ ...prev, subServices: newSubServiceErrors }));
    }
  };
  
  // Añadir un nuevo sub-servicio
  const handleAddSubService = () => {
    setFormData(prev => ({
      ...prev,
      subServices: [...prev.subServices, { name: '', description: '' }]
    }));
  };
  
  // Eliminar un sub-servicio
  const handleRemoveSubService = (index: number) => {
    const updatedSubServices = [...formData.subServices];
    updatedSubServices.splice(index, 1);
    setFormData(prev => ({ ...prev, subServices: updatedSubServices }));
    
    // Limpiar errores relacionados
    if (errors.subServices) {
      const newSubServiceErrors = [...errors.subServices];
      newSubServiceErrors.splice(index, 1);
      setErrors(prev => ({ ...prev, subServices: newSubServiceErrors }));
    }
  };
  
  // Validar el formulario antes de enviar
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servicio es obligatorio';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.iconName) {
      newErrors.iconName = 'Debe seleccionar un icono';
    }
    
    // Validar sub-servicios
    const subServiceErrors: (string | undefined)[] = [];
    formData.subServices.forEach((subService, index) => {
      if (!subService.name.trim()) {
        subServiceErrors[index] = 'El nombre del sub-servicio es obligatorio';
      } else {
        subServiceErrors[index] = undefined;
      }
    });
    
    if (subServiceErrors.some(error => error !== undefined)) {
      newErrors.subServices = subServiceErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && (!newErrors.subServices || !newErrors.subServices.some(error => error !== undefined));
  };
  
  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Obtener el icono seleccionado
  const getSelectedIcon = () => {
    const selectedOption = ICON_OPTIONS.find(option => option.value === formData.iconName);
    return selectedOption ? selectedOption.icon : <CubeIcon className="h-4 w-4" />;
  };

  // Preparar opciones para el select
  const iconSelectOptions = ICON_OPTIONS.map(option => ({
    value: option.value,
    label: option.label
  }));
  
  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Summary */}
        {(Object.keys(errors).length > 0 || errors.subServices?.some(error => error !== undefined)) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Por favor, corrige los siguientes errores:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc space-y-1 pl-5">
                    {Object.entries(errors).map(([field, message]) => {
                      if (field === 'subServices' && Array.isArray(message)) {
                        return message.map((subError, index) => 
                          subError ? <li key={`${field}-${index}`}>Sub-servicio {index + 1}: {subError}</li> : null
                        ).filter(Boolean);
                      }
                      return message ? <li key={field}>{message}</li> : null;
                    }).filter(Boolean)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Note */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <InformationCircleIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Acerca de los Servicios</h3>
              <p className="mt-1 text-sm text-blue-700">
                Los servicios representan las diferentes categorías de trabajo que ofrece MediaLab. 
                Cada servicio puede tener múltiples sub-servicios para una mejor organización.
              </p>
            </div>
          </div>
        </div>
        
        {/* Basic Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <CubeIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información del Servicio</h3>
              <p className="text-sm text-gray-500">Datos principales del servicio</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="name"
              name="name"
              label="Nombre"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Producción Audiovisual, Desarrollo Web"
              required
              disabled={isSubmitting}
              error={errors.name}
              icon={<DocumentTextIcon className="h-5 w-5" />}
              maxLength={100}
              showCharCount
              helperText="Nombre descriptivo del servicio"
            />
            
            <div className="space-y-2">
              <label htmlFor="iconName" className="block text-sm font-medium text-gray-700">
                Icono <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                  {getSelectedIcon()}
                </div>
                <DashboardSelect
                  id="iconName"
                  name="iconName"
                  value={formData.iconName}
                  onChange={handleChange}
                  options={iconSelectOptions}
                  required
                  disabled={isSubmitting}
                  error={errors.iconName}
                  className="mb-0 flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Icono que representará visualmente este servicio
              </p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <DocumentTextIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Descripción del Servicio</h3>
              <p className="text-sm text-gray-500">Información detallada sobre el servicio</p>
            </div>
          </div>
          
          <DashboardTextArea
            id="description"
            name="description"
            label="Descripción (Opcional)"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describa qué incluye este servicio, sus características principales, el tipo de trabajos que abarca, etc."
            rows={4}
            disabled={isSubmitting}
            maxLength={500}
            showCharCount
            helperText="Información que ayudará a los usuarios a entender qué incluye este servicio"
          />
        </div>
        
        {/* Sub-services Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <SparklesIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sub-servicios
                  <Badge variant="secondary" className="ml-2">
                    {formData.subServices.length}
                  </Badge>
                </h3>
                <p className="text-sm text-gray-500">Servicios específicos dentro de esta categoría</p>
              </div>
            </div>
            <DashboardButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubService}
              leftIcon={<PlusIcon className="h-4 w-4" />}
              disabled={isSubmitting}
            >
              Añadir Sub-servicio
            </DashboardButton>
          </div>
          
          {formData.subServices.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                <SparklesIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">No hay sub-servicios definidos</h4>
              <p className="text-sm text-gray-500 mb-4">
                Los sub-servicios ayudan a organizar mejor los diferentes tipos de trabajo dentro de este servicio.
              </p>
              <DashboardButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubService}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                disabled={isSubmitting}
              >
                Añadir el primer sub-servicio
              </DashboardButton>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.subServices.map((subService, index) => (
                <div key={index} className="border border-gray-200 p-6 rounded-xl bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Sub-servicio {index + 1}</h4>
                        <p className="text-xs text-gray-500">Complete la información requerida</p>
                      </div>
                    </div>
                    <DashboardButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSubService(index)}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                    >
                      Eliminar
                    </DashboardButton>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <DashboardTextInput
                      id={`subservice-name-${index}`}
                      name={`subservice-name-${index}`}
                      label="Nombre"
                      value={subService.name}
                      onChange={(e) => handleSubServiceChange(index, 'name', e.target.value)}
                      placeholder="Ej: Edición de Video, Streaming en Vivo"
                      required
                      disabled={isSubmitting}
                      size="sm"
                      error={errors.subServices?.[index]}
                      maxLength={100}
                      showCharCount
                    />
                    
                    <DashboardTextInput
                      id={`subservice-description-${index}`}
                      name={`subservice-description-${index}`}
                      label="Descripción"
                      value={subService.description}
                      onChange={(e) => handleSubServiceChange(index, 'description', e.target.value)}
                      placeholder="Descripción breve del sub-servicio"
                      disabled={isSubmitting}
                      size="sm"
                      maxLength={200}
                      showCharCount
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Section */}
        {formData.name && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-2">Vista previa del servicio</h4>
                <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                      {getSelectedIcon()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-lg font-semibold text-gray-900">{formData.name}</h5>
                        <Badge variant="info" size="sm">
                          {ICON_OPTIONS.find(opt => opt.value === formData.iconName)?.label}
                        </Badge>
                      </div>
                      
                      {formData.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {formData.description}
                        </p>
                      )}
                      
                      {formData.subServices.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Sub-servicios ({formData.subServices.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formData.subServices.slice(0, 5).map((subService, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                size="sm"
                                className="text-xs"
                              >
                                {subService.name || `Sub-servicio ${index + 1}`}
                              </Badge>
                            ))}
                            {formData.subServices.length > 5 && (
                              <Badge variant="secondary" size="sm" className="text-xs">
                                +{formData.subServices.length - 5} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Así aparecerá el servicio en las listas y formularios del sistema.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          <DashboardButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {initialData ? 'Actualizar Servicio' : 'Crear Servicio'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;