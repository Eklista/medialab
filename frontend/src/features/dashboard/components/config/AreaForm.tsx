// src/features/dashboard/components/config/AreaForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import { 
  BuildingOffice2Icon, 
  DocumentTextIcon,
  BriefcaseIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

export interface AreaFormData {
  name: string;
  description: string;
}

interface AreaFormProps {
  initialData?: AreaFormData;
  onSubmit: (data: AreaFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const AreaForm: React.FC<AreaFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    description: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AreaFormData, string>>>({});
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof AreaFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AreaFormData, string>> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del área es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }
    
    // Validate description (optional but with limits)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
              <h3 className="text-sm font-medium text-blue-800">Información sobre las Áreas</h3>
              <p className="mt-1 text-sm text-blue-700">
                Las áreas representan departamentos o divisiones dentro de la organización. 
                Utiliza nombres simples y directos como "Producción", "Diseño", "Marketing", etc.
              </p>
            </div>
          </div>
        </div>
        
        {/* Basic Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <BriefcaseIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información del Área</h3>
              <p className="text-sm text-gray-500">Datos principales del área de trabajo</p>
            </div>
          </div>
          
          <DashboardTextInput
            id="area-name"
            name="name"
            label="Nombre del área"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ej: Producción, Diseño, Marketing, Transmisión, etc."
            required
            error={errors.name}
            icon={<BuildingOffice2Icon className="h-5 w-5" />}
            maxLength={100}
            showCharCount
            helperText="Nombre simple y directo que identifique el área"
          />
        </div>
        
        {/* Description Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Descripción del Área</h3>
              <p className="text-sm text-gray-500">Información detallada sobre el propósito y funciones</p>
            </div>
          </div>
          
          <DashboardTextarea
            id="area-description"
            name="description"
            label="Descripción (Opcional)"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describa el propósito del área, sus responsabilidades principales, objetivos, o cualquier información relevante que ayude a entender su función dentro de la organización..."
            rows={5}
            maxLength={500}
            showCharCount
            helperText="Una descripción clara ayudará a los usuarios a entender mejor las responsabilidades del área"
          />
        </div>

        {/* Preview Section - Muestra cómo se verá el área */}
        {formData.name && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <BriefcaseIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-2">Vista previa del área</h4>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <BriefcaseIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{formData.name}</h5>
                      {formData.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {formData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Así es como aparecerá el área en las listas y formularios del sistema.
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
            {initialData ? 'Actualizar Área' : 'Crear Área'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default AreaForm;