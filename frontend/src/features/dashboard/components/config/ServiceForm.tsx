// src/features/dashboard/components/config/ServiceForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import DashboardCard from '../ui/DashboardCard';

export interface SubService {
  id: string;
  name: string;
  description: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  iconName: string;
  subServices: SubService[];
}

interface ServiceFormProps {
  initialData?: ServiceFormData;
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    iconName: '',
    subServices: [],
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  
  // New subservice form
  const [newSubService, setNewSubService] = useState<Omit<SubService, 'id'>>({
    name: '',
    description: '',
  });
  
  // Editing subservice
  const [editingSubServiceId, setEditingSubServiceId] = useState<string | null>(null);
  
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
    if (errors[name as keyof ServiceFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSubServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setNewSubService(prev => ({ ...prev, [name]: value }));
  };
  
  const addSubService = () => {
    if (!newSubService.name.trim()) return;
    
    const id = editingSubServiceId || `sub-${Date.now()}`;
    
    if (editingSubServiceId) {
      // Update existing subservice
      setFormData(prev => ({
        ...prev,
        subServices: prev.subServices.map(sub => 
          sub.id === editingSubServiceId 
            ? { ...newSubService, id } 
            : sub
        )
      }));
      
      setEditingSubServiceId(null);
    } else {
      // Add new subservice
      setFormData(prev => ({
        ...prev,
        subServices: [...prev.subServices, { ...newSubService, id }]
      }));
    }
    
    // Reset form
    setNewSubService({ name: '', description: '' });
  };
  
  const editSubService = (subService: SubService) => {
    setNewSubService({
      name: subService.name,
      description: subService.description,
    });
    setEditingSubServiceId(subService.id);
  };
  
  const removeSubService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subServices: prev.subServices.filter(sub => sub.id !== id)
    }));
    
    // If editing this subservice, cancel edit
    if (editingSubServiceId === id) {
      setEditingSubServiceId(null);
      setNewSubService({ name: '', description: '' });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ServiceFormData, string>> = {};
    
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardTextInput
            id="service-name"
            name="name"
            label="Nombre del servicio"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ingrese el nombre del servicio"
            required
            error={errors.name}
          />
          
          <DashboardTextInput
            id="service-icon"
            name="iconName"
            label="Nombre del icono"
            value={formData.iconName}
            onChange={handleInputChange}
            placeholder="video-camera, audio, etc."
            helperText="Nombre del icono para identificación visual"
          />
        </div>
        
        <DashboardTextarea
          id="service-description"
          name="description"
          label="Descripción"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describa brevemente este servicio (para tooltips y ayuda)"
          rows={3}
        />
        
        {/* Subservicios */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Subservicios</h3>
          
          <DashboardCard className="mb-4">
            <div className="space-y-4">
              <DashboardTextInput
                id="subservice-name"
                name="name"
                label="Nombre del subservicio"
                value={newSubService.name}
                onChange={handleSubServiceInputChange}
                placeholder="Ingrese el nombre del subservicio"
              />
              
              <DashboardTextarea
                id="subservice-description"
                name="description"
                label="Descripción del subservicio"
                value={newSubService.description}
                onChange={handleSubServiceInputChange}
                placeholder="Describa brevemente este subservicio"
                rows={2}
              />
              
              <div className="flex justify-end">
                {editingSubServiceId && (
                  <DashboardButton
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setEditingSubServiceId(null);
                      setNewSubService({ name: '', description: '' });
                    }}
                  >
                    Cancelar
                  </DashboardButton>
                )}
                
                <DashboardButton
                  type="button"
                  onClick={addSubService}
                  disabled={!newSubService.name.trim()}
                >
                  {editingSubServiceId ? 'Actualizar Subservicio' : 'Agregar Subservicio'}
                </DashboardButton>
              </div>
            </div>
          </DashboardCard>
          
          {/* Lista de subservicios */}
          {formData.subServices.length > 0 ? (
            <ul className="mt-4 divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {formData.subServices.map((subService) => (
                <li key={subService.id} className="px-4 py-3 bg-white flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{subService.name}</h4>
                    {subService.description && (
                      <p className="text-sm text-gray-500">{subService.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <DashboardButton
                      type="button"
                      variant="text"
                      size="sm"
                      onClick={() => editSubService(subService)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </DashboardButton>
                    <DashboardButton
                      type="button"
                      variant="text"
                      size="sm"
                      onClick={() => removeSubService(subService.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </DashboardButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No hay subservicios agregados</p>
            </div>
          )}
        </div>
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
          {initialData ? 'Actualizar Servicio' : 'Crear Servicio'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default ServiceForm;