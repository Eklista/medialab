// src/features/dashboard/components/config/AcademicUnitForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import { 
  BuildingOfficeIcon, 
  TagIcon, 
  DocumentTextIcon,
  AcademicCapIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

export interface AcademicUnitFormData {
  abbreviation: string;
  name: string;
  type_id: number;
  description: string;
}

interface DepartmentType {
  id: number;
  name: string;
}

interface AcademicUnitFormProps {
  initialData?: AcademicUnitFormData;
  onSubmit: (data: AcademicUnitFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  departmentTypes?: DepartmentType[];
  onManageTypes?: () => void;
}

const AcademicUnitForm: React.FC<AcademicUnitFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  departmentTypes = [],
  onManageTypes
}) => {
  const [formData, setFormData] = useState<AcademicUnitFormData>({
    abbreviation: '',
    name: '',
    type_id: departmentTypes.length > 0 ? departmentTypes[0].id : 0,
    description: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AcademicUnitFormData, string>>>({});
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (departmentTypes.length > 0) {
      setFormData(prev => ({
        ...prev,
        type_id: departmentTypes[0].id
      }));
    }
  }, [initialData, departmentTypes]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'type_id' ? parseInt(value, 10) : value 
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof AcademicUnitFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AcademicUnitFormData, string>> = {};
    
    // Validate abbreviation
    if (!formData.abbreviation.trim()) {
      newErrors.abbreviation = 'Las siglas son requeridas';
    } else if (formData.abbreviation.length < 2) {
      newErrors.abbreviation = 'Las siglas deben tener al menos 2 caracteres';
    }
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    // Validate type_id
    if (!formData.type_id || formData.type_id === 0) {
      newErrors.type_id = 'El tipo es requerido';
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
  
  // Crear opciones para el select
  const typeOptions = departmentTypes.map(type => ({
    value: type.id.toString(),
    label: type.name
  }));

  const hasValidTypes = Array.isArray(departmentTypes) && departmentTypes.length > 0;

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

        {/* Warning for missing types */}
        {!hasValidTypes && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Advertencia</h3>
                <p className="mt-1 text-sm text-amber-700">
                  No se pudieron cargar los tipos de unidades académicas. El campo de tipo no estará disponible.
                </p>
                {onManageTypes && (
                  <div className="mt-3">
                    <DashboardButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onManageTypes}
                      leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
                    >
                      Gestionar Tipos
                    </DashboardButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Basic Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
              <p className="text-sm text-gray-500">Datos principales de la unidad académica</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="unit-abbreviation"
              name="abbreviation"
              label="Siglas"
              value={formData.abbreviation}
              onChange={handleInputChange}
              placeholder="Ej: FISICC"
              required
              error={errors.abbreviation}
              icon={<TagIcon className="h-5 w-5" />}
              maxLength={10}
              showCharCount
            />
            
            {hasValidTypes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="unit-type" className="block text-sm font-medium text-gray-700">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  {onManageTypes && (
                    <DashboardButton
                      type="button"
                      variant="text"
                      size="sm"
                      onClick={onManageTypes}
                      leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Gestionar
                    </DashboardButton>
                  )}
                </div>
                <DashboardSelect
                  id="unit-type"
                  name="type_id"
                  value={formData.type_id.toString()}
                  onChange={handleInputChange}
                  options={typeOptions}
                  placeholder="Seleccione un tipo"
                  required
                  error={errors.type_id}
                  icon={<BuildingOfficeIcon className="h-5 w-5" />}
                  className="mb-0"
                />
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <DashboardTextInput
              id="unit-name"
              name="name"
              label="Nombre completo"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación"
              required
              error={errors.name}
              icon={<BuildingOfficeIcon className="h-5 w-5" />}
              maxLength={255}
              showCharCount
            />
          </div>
        </div>
        
        {/* Description Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Descripción</h3>
              <p className="text-sm text-gray-500">Información adicional sobre la unidad académica</p>
            </div>
          </div>
          
          <DashboardTextarea
            id="unit-description"
            name="description"
            label="Descripción (Opcional)"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describa brevemente esta unidad académica, su misión, objetivos principales, o cualquier información relevante..."
            rows={4}
            maxLength={1000}
            showCharCount
            helperText="Una breve descripción ayudará a identificar mejor la unidad académica"
          />
        </div>
        
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
            disabled={isSubmitting || (!hasValidTypes)}
            className="w-full sm:w-auto"
          >
            {initialData ? 'Actualizar Unidad Académica' : 'Crear Unidad Académica'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default AcademicUnitForm;