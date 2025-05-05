// src/features/dashboard/components/config/AcademicUnitForm.tsx (actualizado)
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import DashboardModal from '../ui/DashboardModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export interface AcademicUnitFormData {
  abbreviation: string;
  name: string;
  type_id: number;  // Cambiado de 'type' a 'type_id'
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
  departmentTypes?: DepartmentType[]; // Lista de tipos disponibles
  onAddDepartmentType?: (name: string) => Promise<DepartmentType>; // Función para agregar nuevo tipo
}

const AcademicUnitForm: React.FC<AcademicUnitFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  departmentTypes = [],
  onAddDepartmentType
}) => {
  const [formData, setFormData] = useState<AcademicUnitFormData>({
    abbreviation: '',
    name: '',
    type_id: departmentTypes.length > 0 ? departmentTypes[0].id : 0,
    description: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AcademicUnitFormData, string>>>({});
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);
  
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
    
    // Manejo especial para la opción "agregar nuevo tipo"
    if (name === 'type_id' && value === 'new') {
      setIsAddTypeModalOpen(true);
      return;
    }
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const handleAddNewType = async () => {
    if (!newTypeName.trim() || !onAddDepartmentType) {
      return;
    }
    
    setAddingType(true);
    try {
      const newType = await onAddDepartmentType(newTypeName);
      
      // Actualizar el formulario con el nuevo tipo
      setFormData(prev => ({
        ...prev,
        type_id: newType.id
      }));
      
      setIsAddTypeModalOpen(false);
      setNewTypeName('');
    } catch (error) {
      console.error('Error al agregar nuevo tipo:', error);
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setAddingType(false);
    }
  };
  
  // Crear opciones para el select, incluyendo la opción especial para agregar tipo
  const typeOptions = [
    ...departmentTypes.map(type => ({
      value: type.id.toString(),
      label: type.name
    }))
  ];
  
  // Solo agregar la opción "Agregar nuevo tipo" si la función onAddDepartmentType está disponible
  if (onAddDepartmentType) {
    typeOptions.push({
      value: 'new',
      label: '+ Agregar nuevo tipo...',
    });
  }
  
  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <DashboardSelect
              id="unit-type"
              name="type_id"
              label="Tipo"
              value={formData.type_id.toString()}
              onChange={handleInputChange}
              options={typeOptions}
              required
            />
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

      {/* Modal para agregar nuevo tipo */}
      <DashboardModal
        isOpen={isAddTypeModalOpen}
        onClose={() => {
          setIsAddTypeModalOpen(false);
          setNewTypeName('');
        }}
        title="Agregar Nuevo Tipo de Unidad"
        size="sm"
      >
        <div className="space-y-4">
          <DashboardTextInput
            id="new-type-name"
            name="newTypeName"
            label="Nombre del tipo"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="Ej: Maestría"
            required
          />
          
          <div className="flex justify-end space-x-3 mt-6">
            <DashboardButton
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddTypeModalOpen(false);
                setNewTypeName('');
              }}
              disabled={addingType}
            >
              Cancelar
            </DashboardButton>
            
            <DashboardButton
              type="button"
              onClick={handleAddNewType}
              loading={addingType}
              disabled={addingType || !newTypeName.trim()}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Agregar
            </DashboardButton>
          </div>
        </div>
      </DashboardModal>
    </>
  );
};

export default AcademicUnitForm;