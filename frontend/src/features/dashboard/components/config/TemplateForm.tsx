// src/features/dashboard/components/config/TemplateForm.tsx
import React, { useState } from 'react';
import DashboardButton from '../ui/DashboardButton';
import { Service } from '../../../../services/services.service';

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

  // Nueva función para manejar la selección de subservicios
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
  
  // Validar el formulario antes de enviar
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la plantilla es obligatorio';
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Campo Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm`}
            disabled={isSubmitting}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        
        {/* Campo Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Campo Público */}
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-sm font-medium text-gray-700">Plantilla Pública</span>
            <p className="text-sm text-gray-500">
              Las plantillas públicas estarán disponibles para todos los usuarios.
            </p>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              id="isPublic" 
              name="isPublic"
              checked={formData.isPublic}
              onChange={handlePublicToggle}
              className="checked:bg-black outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              disabled={isSubmitting}
            />
            <label 
              htmlFor="isPublic" 
              className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${formData.isPublic ? 'bg-black' : ''}`}
            />
          </div>
        </div>
      </div>
      
      {/* Sección Servicios */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900">Servicios incluidos</h3>
          <p className="text-sm text-gray-500">
            Seleccione los servicios y subservicios específicos que formarán parte de esta plantilla.
          </p>
          {errors.serviceSelections && (
            <p className="mt-1 text-sm text-red-600">{errors.serviceSelections}</p>
          )}
        </div>
        
        {services.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">
              No hay servicios disponibles. Primero debe crear algunos servicios.
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
              
              return (
                <div key={service.id} className="border rounded-md overflow-hidden">
                  {/* Cabecera del servicio */}
                  <div 
                    className={`p-4 cursor-pointer ${
                      isSelected ? 'bg-gray-50 border-black' : 'bg-white'
                    }`}
                    onClick={() => service.id && handleServiceToggle(service.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-5 w-5 mt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => service.id && handleServiceToggle(service.id)}
                          className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{service.name}</span>
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-500">{service.description}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          <span>{service.sub_services?.length || 0} subservicios</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subservicios (solo si el servicio está seleccionado) */}
                  {isSelected && service.sub_services && service.sub_services.length > 0 && (
                    <div className="border-t border-gray-200 p-4 pl-8 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Seleccione los subservicios:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {service.sub_services.map(subService => {
                          const isSubSelected = serviceSelection?.subServiceIds.includes(subService.id!);
                          
                          return (
                            <div key={subService.id} className="flex items-start space-x-2">
                              <div className="flex-shrink-0 h-5 w-5 mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={!!isSubSelected}
                                  onChange={() => service.id && subService.id && 
                                    handleSubServiceToggle(service.id, subService.id)}
                                  className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">{subService.name}</div>
                                {subService.description && (
                                  <p className="text-xs text-gray-500">{subService.description}</p>
                                )}
                              </div>
                            </div>
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
      
      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4">
        <DashboardButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </DashboardButton>
        
        <DashboardButton
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || services.length === 0}
        >
          {initialData ? 'Actualizar' : 'Crear'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default TemplateForm;