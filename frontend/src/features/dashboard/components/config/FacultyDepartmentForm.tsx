// src/features/dashboard/components/config/FacultyDepartmentForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';

export interface FacultyDepartmentFormData {
  abbreviation: string;
  name: string;
  type: 'faculty' | 'department';
  description: string;
}

interface FacultyDepartmentFormProps {
  initialData?: FacultyDepartmentFormData;
  onSubmit: (data: FacultyDepartmentFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const FacultyDepartmentForm: React.FC<FacultyDepartmentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<FacultyDepartmentFormData>({
    abbreviation: '',
    name: '',
    type: 'faculty',
    description: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FacultyDepartmentFormData, string>>>({});
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof FacultyDepartmentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FacultyDepartmentFormData, string>> = {};
    
    // Validate abbreviation
    if (!formData.abbreviation.trim()) {
      newErrors.abbreviation = 'La sigla es requerida';
    }
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
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
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardTextInput
            id="faculty-abbreviation"
            name="abbreviation"
            label="Siglas"
            value={formData.abbreviation}
            onChange={handleInputChange}
            placeholder="Ej: FISICC"
            required
            error={errors.abbreviation}
          />
          
          <DashboardSelect
            id="faculty-type"
            name="type"
            label="Tipo"
            value={formData.type}
            onChange={handleInputChange}
            options={[
              { value: 'faculty', label: 'Facultad' },
              { value: 'department', label: 'Departamento' },
            ]}
            required
          />
        </div>
        
        <DashboardTextInput
          id="faculty-name"
          name="name"
          label="Nombre completo"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ej: Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación"
          required
          error={errors.name}
        />
        
        <DashboardTextarea
          id="faculty-description"
          name="description"
          label="Descripción (Opcional)"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describa brevemente esta facultad o departamento"
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

export default FacultyDepartmentForm;