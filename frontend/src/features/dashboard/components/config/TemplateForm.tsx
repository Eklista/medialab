// src/features/dashboard/components/config/TemplateForm.tsx
import React, { useState } from 'react';
import DashboardButton from '../ui/DashboardButton';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextArea from '../ui/DashboardTextArea';
import DashboardCheckbox from '../ui/DashboardCheckbox';
import Switch from '../ui/Switch';
import Badge from '../ui/Badge';
import { Service } from '../../../../services/organization/services.service';
import { 
  DocumentTextIcon,
  SparklesIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Definimos la estructura de datos para el formulario
export interface TemplateFormData {
  name: string;
  description: string;
  isPublic: boolean;
  serviceSelections: {
    serviceId: number;
    subServiceIds: number[];
  }[];
}

// Propiedades para el componente
interface TemplateFormProps {
  services: Service[];
  initialData?: TemplateFormData;
  onSubmit: (data: TemplateFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ 
  services,
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting = false
}) => {
  // Inicializar estado con valores por defecto o datos iniciales
  const [formData, setFormData] = useState<TemplateFormData>(initialData || {
    name: '',
    description: '',
    isPublic: false,
    serviceSelections: []
  });
  
  // Estado para manejar errores de validación
  const [errors, setErrors] = useState<{
    name?: string;
    serviceSelections?: string;
  }>({});

  // Estado para controlar qué servicios están expandidos
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error cuando se modifica el campo
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Manejar cambio en el switch de público/privado
  const handlePublicToggle = () => {
    setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }));
  };
  
  // Manejar cambios en la selección de servicios
  const handleServiceToggle = (serviceId: number) => {
    setFormData(prev => {
      // Verificar si ya está seleccionado
      const isSelected = prev.serviceSelections.some(sel => sel.serviceId === serviceId);
      
      if (isSelected) {
        // Eliminar de la selección
        return {
          ...prev,
          serviceSelections: prev.serviceSelections.filter(sel => sel.serviceId !== serviceId)
        };
      } else {
        // Añadir a la selección con subservicios vacíos
        return {
          ...prev,
          serviceSelections: [
            ...prev.serviceSelections,
            { serviceId, subServiceIds: [] }
          ]
        };
      }
    });
    
    // Limpiar error de servicios
    if (errors.serviceSelections) {
      setErrors(prev => ({ ...prev, serviceSelections: undefined }));
    }
  };

  // Función para manejar la selección de subservicios
  const handleSubServiceToggle = (serviceId: number, subServiceId: number) => {
    setFormData(prev => {
      // Encontrar el índice del servicio
      const serviceIndex = prev.serviceSelections.findIndex(
        sel => sel.serviceId === serviceId
      );
      
      if (serviceIndex === -1) return prev; // No debería ocurrir
      
      const serviceSelection = prev.serviceSelections[serviceIndex];
      const subServiceIds = serviceSelection.subServiceIds.includes(subServiceId)
        ? serviceSelection.subServiceIds.filter(id => id !== subServiceId) // Eliminar
        : [...serviceSelection.subServiceIds, subServiceId]; // Añadir
      
      // Crear nueva lista de selecciones de servicios
      const newServiceSelections = [...prev.serviceSelections];
      newServiceSelections[serviceIndex] = {
        ...serviceSelection,
        subServiceIds
      };
      
      return {
        ...prev,
        serviceSelections: newServiceSelections
      };
    });
  };

  // Función para seleccionar/deseleccionar todos los subservicios de un servicio
  const handleSelectAllSubServices = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service || !service.sub_services) return;

    const serviceSelection = formData.serviceSelections.find(sel => sel.serviceId === serviceId);
    if (!serviceSelection) return;

    const allSubServiceIds = service.sub_services.map(sub => sub.id!);
    const allSelected = allSubServiceIds.every(id => serviceSelection.subServiceIds.includes(id));

    setFormData(prev => {
      const serviceIndex = prev.serviceSelections.findIndex(sel => sel.serviceId === serviceId);
      const newServiceSelections = [...prev.serviceSelections];
      
      newServiceSelections[serviceIndex] = {
        ...serviceSelection,
        subServiceIds: allSelected ? [] : allSubServiceIds
      };
      
      return {
        ...prev,
        serviceSelections: newServiceSelections
      };
    });
  };

  // Función para expandir/colapsar servicios
  const toggleServiceExpansion = (serviceId: number) => {
    setExpandedServices(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(serviceId)) {
        newExpanded.delete(serviceId);
      } else {
        newExpanded.add(serviceId);
      }
      return newExpanded;
    });
  };
  
  // Validar el formulario antes de enviar
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la plantilla es obligatorio';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (formData.serviceSelections.length === 0) {
      newErrors.serviceSelections = 'Debe seleccionar al menos un servicio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Obtener estadísticas de la plantilla
  const getTemplateStats = () => {
    const totalServices = formData.serviceSelections.length;
    const totalSubServices = formData.serviceSelections.reduce(
      (acc, sel) => acc + sel.subServiceIds.length, 0
    );
    return { totalServices, totalSubServices };
  };

  const { totalServices, totalSubServices } = getTemplateStats();
  
  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
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
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
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
              <h3 className="text-sm font-medium text-blue-800">Acerca de las Plantillas</h3>
              <p className="mt-1 text-sm text-blue-700">
                Las plantillas permiten crear configuraciones predefinidas de servicios y sub-servicios 
                que pueden ser reutilizadas en diferentes proyectos o solicitudes.
              </p>
            </div>
          </div>
        </div>
        
        {/* Basic Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información de la Plantilla</h3>
              <p className="text-sm text-gray-500">Datos básicos de identificación</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="name"
              name="name"
              label="Nombre"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Producción Básica, Paquete Premium"
              required
              disabled={isSubmitting}
              error={errors.name}
              icon={<SparklesIcon className="h-5 w-5" />}
              maxLength={100}
              showCharCount
              helperText="Nombre descriptivo para identificar la plantilla"
            />

            <div className="flex items-end">
              <div className={`p-4 rounded-lg w-full ${
                formData.isPublic 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {formData.isPublic ? (
                        <GlobeAltIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <LockClosedIcon className="h-5 w-5 text-amber-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        formData.isPublic ? 'text-green-900' : 'text-amber-900'
                      }`}>
                        {formData.isPublic ? 'Plantilla Pública' : 'Plantilla Privada'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      formData.isPublic ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      {formData.isPublic 
                        ? 'Visible para todos los usuarios'
                        : 'Solo visible para ti'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onChange={handlePublicToggle}
                    disabled={isSubmitting}
                    size="sm"
                  />
                </div>
              </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Descripción</h3>
              <p className="text-sm text-gray-500">Información detallada sobre la plantilla</p>
            </div>
          </div>
          
          <DashboardTextArea
            id="description"
            name="description"
            label="Descripción (Opcional)"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describa el propósito de esta plantilla, qué tipo de proyectos abarca, características principales, etc."
            rows={4}
            disabled={isSubmitting}
            maxLength={500}
            showCharCount
            helperText="Una descripción clara ayudará a otros usuarios a entender cuándo usar esta plantilla"
          />
        </div>
        
        {/* Services Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CubeIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Servicios Incluidos
                  <Badge variant="info" className="ml-2">
                    {totalServices} servicios, {totalSubServices} sub-servicios
                  </Badge>
                </h3>
                <p className="text-sm text-gray-500">Selecciona los servicios y sub-servicios específicos</p>
              </div>
            </div>

            {formData.serviceSelections.length > 0 && (
              <DashboardButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Expandir todos los servicios seleccionados
                  const selectedServiceIds = formData.serviceSelections.map(sel => sel.serviceId);
                  setExpandedServices(new Set(selectedServiceIds));
                }}
                leftIcon={<EyeIcon className="h-4 w-4" />}
              >
                Expandir Seleccionados
              </DashboardButton>
            )}
          </div>

          {errors.serviceSelections && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.serviceSelections}</p>
            </div>
          )}
          
          {services.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                <CubeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">No hay servicios disponibles</h4>
              <p className="text-sm text-gray-500">
                Primero debe crear algunos servicios antes de poder crear plantillas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map(service => {
                // Verificar si el servicio está seleccionado
                const serviceSelection = formData.serviceSelections.find(
                  sel => sel.serviceId === service.id
                );
                const isSelected = !!serviceSelection;
                const isExpanded = expandedServices.has(service.id!);
                const hasSubServices = service.sub_services && service.sub_services.length > 0;
                
                return (
                  <div key={service.id} className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}>
                    {/* Service Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <DashboardCheckbox
                            id={`service-${service.id}`}
                            checked={isSelected}
                            onChange={() => service.id && handleServiceToggle(service.id)}
                            disabled={isSubmitting}
                            size="md"
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-semibold text-gray-900">
                                {service.name}
                              </h4>
                              {hasSubServices && (
                                <Badge variant="secondary" size="sm">
                                  {service.sub_services?.length} sub-servicios
                                </Badge>
                              )}
                              {isSelected && serviceSelection && (
                                <Badge variant="success" size="sm">
                                  {serviceSelection.subServiceIds.length} seleccionados
                                </Badge>
                              )}
                            </div>
                            
                            {service.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {service.description}
                              </p>
                            )}

                            {/* Sub-services preview when collapsed */}
                            {isSelected && hasSubServices && !isExpanded && (
                              <div className="flex flex-wrap gap-1">
                                {service.sub_services?.slice(0, 3).map((subService) => (
                                  <Badge 
                                    key={subService.id} 
                                    variant={serviceSelection?.subServiceIds.includes(subService.id!) ? "success" : "secondary"}
                                    size="sm"
                                    className="text-xs"
                                  >
                                    {subService.name}
                                  </Badge>
                                ))}
                                {service.sub_services && service.sub_services.length > 3 && (
                                  <Badge variant="secondary" size="sm" className="text-xs">
                                    +{service.sub_services.length - 3} más
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Expand/Collapse button */}
                        {isSelected && hasSubServices && (
                          <DashboardButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => service.id && toggleServiceExpansion(service.id)}
                            disabled={isSubmitting}
                            leftIcon={isExpanded ? 
                              <ChevronUpIcon className="h-4 w-4" /> : 
                              <ChevronDownIcon className="h-4 w-4" />
                            }
                          >
                            {isExpanded ? 'Colapsar' : 'Expandir'}
                          </DashboardButton>
                        )}
                      </div>
                    </div>
                    
                    {/* Sub-services (expanded view) */}
                    {isSelected && hasSubServices && isExpanded && (
                      <div className="border-t border-blue-200 bg-blue-25 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-medium text-gray-900">
                            Sub-servicios disponibles
                          </h5>
                          <DashboardButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => service.id && handleSelectAllSubServices(service.id)}
                            disabled={isSubmitting}
                            leftIcon={<PlusIcon className="h-4 w-4" />}
                          >
                            {service.sub_services?.every(sub => 
                              serviceSelection?.subServiceIds.includes(sub.id!)
                            ) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                          </DashboardButton>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {service.sub_services?.map((subService) => {
                            const isSubSelected = serviceSelection?.subServiceIds.includes(subService.id!);
                            
                            return (
                              <DashboardCheckbox
                                key={subService.id}
                                id={`subservice-${subService.id}`}
                                checked={!!isSubSelected}
                                onChange={() => service.id && subService.id && 
                                  handleSubServiceToggle(service.id, subService.id)}
                                label={subService.name}
                                description={subService.description}
                                disabled={isSubmitting}
                                size="sm"
                                className={`p-3 rounded-lg border transition-colors ${
                                  isSubSelected 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Summary */}
        {(formData.name || formData.serviceSelections.length > 0) && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-2">Resumen de la Plantilla</h4>
                <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 flex-shrink-0">
                      <SparklesIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-semibold text-gray-900">
                          {formData.name || 'Nombre de plantilla no especificado'}
                        </h5>
                        <Badge variant={formData.isPublic ? "success" : "warning"} size="sm">
                          {formData.isPublic ? 'Pública' : 'Privada'}
                        </Badge>
                      </div>
                      
                      {formData.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {formData.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CubeIcon className="h-4 w-4" />
                          <span>{totalServices} servicios</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SparklesIcon className="h-4 w-4" />
                          <span>{totalSubServices} sub-servicios</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Vista previa de cómo aparecerá la plantilla en el sistema.
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
            disabled={isSubmitting || services.length === 0}
            className="w-full sm:w-auto"
          >
            {initialData ? 'Actualizar Plantilla' : 'Crear Plantilla'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;