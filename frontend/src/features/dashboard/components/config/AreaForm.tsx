// src/features/dashboard/components/config/AreaForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';

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
        <DashboardTextInput
          id="area-name"
          name="name"
          label="Nombre del área"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ingrese el nombre del área"
          required
          error={errors.name}
        />
        
        <DashboardTextarea
          id="area-description"
          name="description"
          label="Descripción"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describa brevemente el propósito de esta área"
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

export default AreaForm;