// src/features/dashboard/components/config/AcademicUnitForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';

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
  departmentTypes = []
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
      newErrors.abbreviation = 'La sigla es requerida';
    }
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    // Validate type_id
    if (!formData.type_id) {
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
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardTextInput
            id="unit-abbreviation"
            name="abbreviation"
            label="Siglas"
            value={formData.abbreviation}
            onChange={handleInputChange}
            placeholder="Ej: FISICC"
            required
            error={errors.abbreviation}
          />
          
          <div className="space-y-2">
            <label htmlFor="unit-type" className="block text-sm font-medium text-gray-700">
              Tipo <span className="text-red-500">*</span>
            </label>
            <DashboardSelect
              id="unit-type"
              name="type_id"
              value={formData.type_id.toString()}
              onChange={handleInputChange}
              options={typeOptions}
              required
              error={errors.type_id}
            />
          </div>
        </div>
        
        <DashboardTextInput
          id="unit-name"
          name="name"
          label="Nombre completo"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ej: Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación"
          required
          error={errors.name}
        />
        
        <DashboardTextarea
          id="unit-description"
          name="description"
          label="Descripción (Opcional)"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describa brevemente esta unidad académica"
          rows={3}
        />
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
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

export default AcademicUnitForm;