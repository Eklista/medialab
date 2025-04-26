import React, { useState } from 'react';
import DashboardButton from '../ui/DashboardButton';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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

// Lista de opciones de iconos disponibles
const ICON_OPTIONS = [
  { value: 'video-camera', label: 'Cámara de Video' },
  { value: 'microphone', label: 'Micrófono' },
  { value: 'photo', label: 'Fotografía' },
  { value: 'code', label: 'Código' },
  { value: 'chart-bar', label: 'Gráfico' },
  { value: 'document', label: 'Documento' },
  { value: 'academic-cap', label: 'Académico' },
  { value: 'desktop-computer', label: 'Computadora' },
  { value: 'cube', label: 'Cubo 3D' },
  { value: 'globe', label: 'Globo' },
  { value: 'presentation-chart-line', label: 'Presentación' },
  { value: 'template', label: 'Plantilla' },
  { value: 'cloud', label: 'Nube' },
  { value: 'terminal', label: 'Terminal' },
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
    subServices?: string;
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
    
    // Limpiar error de sub-servicios si existe
    if (errors.subServices) {
      setErrors(prev => ({ ...prev, subServices: undefined }));
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
  };
  
  // Validar el formulario antes de enviar
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servicio es obligatorio';
    }
    
    if (!formData.iconName) {
      newErrors.iconName = 'Debe seleccionar un icono';
    }
    
    // Validar que cada sub-servicio tenga un nombre
    const invalidSubService = formData.subServices.some(sub => !sub.name.trim());
    if (invalidSubService) {
      newErrors.subServices = 'Todos los sub-servicios deben tener un nombre';
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
        
        {/* Campo Icono */}
        <div>
          <label htmlFor="iconName" className="block text-sm font-medium text-gray-700">
            Icono <span className="text-red-500">*</span>
          </label>
          <select
            id="iconName"
            name="iconName"
            value={formData.iconName}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.iconName ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm`}
            disabled={isSubmitting}
          >
            {ICON_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.iconName && <p className="mt-1 text-sm text-red-600">{errors.iconName}</p>}
        </div>
      </div>
      
      {/* Sección Sub-servicios */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-medium text-gray-900">Sub-servicios</h3>
          <DashboardButton
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSubService}
            leftIcon={<PlusIcon className="h-4 w-4" />}
            disabled={isSubmitting}
          >
            Añadir
          </DashboardButton>
        </div>
        
        {formData.subServices.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">
              No hay sub-servicios definidos. Añade sub-servicios para una mejor organización.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.subServices.map((subService, index) => (
              <div key={index} className="border border-gray-200 p-3 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Sub-servicio {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubService(index)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isSubmitting}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subService.name}
                      onChange={e => handleSubServiceChange(index, 'name', e.target.value)}
                      className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={subService.description}
                      onChange={e => handleSubServiceChange(index, 'description', e.target.value)}
                      className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {errors.subServices && (
              <p className="text-sm text-red-600">{errors.subServices}</p>
            )}
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
          disabled={isSubmitting}
        >
          {initialData ? 'Actualizar' : 'Crear'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default ServiceForm;