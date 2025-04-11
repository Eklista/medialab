// src/features/dashboard/components/users/UserForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import { CalendarIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  area: string;
  joinDate: string;
}

interface UserFormProps {
  initialData?: UserFormData;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: '',
    area: '',
    joinDate: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validate role
    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }
    
    // Validate area
    if (!formData.area) {
      newErrors.area = 'El área es requerida';
    }
    
    // Validate joinDate
    if (!formData.joinDate) {
      newErrors.joinDate = 'La fecha de ingreso es requerida';
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
  
  // Áreas disponibles
  const areaOptions = [
    { value: 'Producción Audiovisual', label: 'Producción Audiovisual' },
    { value: 'Desarrollo Web', label: 'Desarrollo Web' },
    { value: 'Diseño Gráfico', label: 'Diseño Gráfico' },
    { value: 'Marketing Digital', label: 'Marketing Digital' },
    { value: 'Administración', label: 'Administración' }
  ];
  
  // Roles disponibles
  const roleOptions = [
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Visualizador' }
  ];
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-4">
          <DashboardTextInput
            id="user-name"
            name="name"
            label="Nombre completo"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ingrese el nombre completo"
            required
            error={errors.name}
            icon={<UserIcon className="h-5 w-5" />}
          />
          
          <DashboardTextInput
            id="user-email"
            name="email"
            label="Correo electrónico"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="ejemplo@medialab.com"
            required
            error={errors.email}
            icon={<EnvelopeIcon className="h-5 w-5" />}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardSelect
            id="user-area"
            name="area"
            label="Área"
            value={formData.area}
            onChange={handleInputChange}
            options={areaOptions}
            placeholder="Seleccione un área"
            required
            error={errors.area}
          />
          
          <DashboardSelect
            id="user-role"
            name="role"
            label="Rol"
            value={formData.role}
            onChange={handleInputChange}
            options={roleOptions}
            placeholder="Seleccione un rol"
            required
            error={errors.role}
          />
        </div>
        
        <DashboardTextInput
          id="user-join-date"
          name="joinDate"
          label="Fecha de ingreso"
          type="date"
          value={formData.joinDate}
          onChange={handleInputChange}
          required
          error={errors.joinDate}
          icon={<CalendarIcon className="h-5 w-5" />}
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

export default UserForm;