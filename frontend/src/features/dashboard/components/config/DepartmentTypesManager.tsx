// src/features/dashboard/components/config/DepartmentTypesManager.tsx
import React, { useState } from 'react';
import DashboardModal from '../ui/DashboardModal';
import DashboardInputWithButton from '../ui/DashboardInputWithButton';
import DashboardButton from '../ui/DashboardButton';
import Badge from '../ui/Badge';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  BuildingOffice2Icon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DepartmentType {
  id: number;
  name: string;
}

interface DepartmentTypesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  departmentTypes: DepartmentType[];
  onAddType: (name: string) => Promise<DepartmentType>;
  onUpdateType: (id: number, name: string) => Promise<DepartmentType>;
  onDeleteType: (id: number) => Promise<void>;
}

const DepartmentTypesManager: React.FC<DepartmentTypesManagerProps> = ({
  isOpen,
  onClose,
  departmentTypes,
  onAddType,
  onUpdateType,
  onDeleteType
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTypeId, setEditTypeId] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  
  const handleAddType = async (name: string) => {
    setIsSubmitting(true);
    setError(undefined);
    setSuccessMessage(undefined);
    
    try {
      await onAddType(name);
      setSuccessMessage(`Tipo "${name}" agregado exitosamente`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(undefined), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir el tipo');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditClick = (type: DepartmentType) => {
    setEditTypeId(type.id);
    setEditTypeName(type.name);
    setError(undefined);
    setSuccessMessage(undefined);
  };
  
  const handleCancelEdit = () => {
    setEditTypeId(null);
    setEditTypeName('');
    setError(undefined);
  };
  
  const handleUpdateType = async () => {
    if (!editTypeId) return;
    
    setIsSubmitting(true);
    setError(undefined);
    setSuccessMessage(undefined);
    
    try {
      await onUpdateType(editTypeId, editTypeName);
      setSuccessMessage(`Tipo actualizado exitosamente`);
      setEditTypeId(null);
      setEditTypeName('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(undefined), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el tipo');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteType = async (id: number, typeName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo "${typeName}"?\n\nEsta acción no se puede deshacer y podría afectar las unidades académicas que usen este tipo.`)) {
      setIsSubmitting(true);
      setError(undefined);
      setSuccessMessage(undefined);
      
      try {
        await onDeleteType(id);
        setSuccessMessage(`Tipo "${typeName}" eliminado exitosamente`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(undefined), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar el tipo');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const validateTypeName = (value: string): string | undefined => {
    if (value.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (value.length > 50) {
      return 'El nombre no puede exceder 50 caracteres';
    }
    
    // Si estamos editando, solo verificamos duplicados con otros tipos (no con el actual)
    const typesToCheck = editTypeId 
      ? departmentTypes.filter(type => type.id !== editTypeId) 
      : departmentTypes;
    
    if (typesToCheck.some(type => type.name.toLowerCase() === value.toLowerCase())) {
      return 'Este tipo ya existe';
    }
    
    return undefined;
  };
  
  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Tipos de Unidades Académicas"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Information */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <InformationCircleIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Acerca de los Tipos</h3>
              <p className="mt-1 text-sm text-blue-700">
                Los tipos definen categorías como "Facultad", "Escuela", "Departamento", etc. 
                Estos se utilizan para clasificar las unidades académicas.
              </p>
            </div>
          </div>
        </div>

        {/* Add New Type Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <PlusIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Agregar Nuevo Tipo</h3>
              <p className="text-sm text-gray-500">Crear un nuevo tipo de unidad académica</p>
            </div>
          </div>
          
          <DashboardInputWithButton
            id="new-type-name"
            name="new-type-name"
            label="Nombre del nuevo tipo"
            placeholder="Ej: Facultad, Escuela, Departamento, Instituto"
            buttonText="Agregar"
            buttonIcon={<PlusIcon className="h-4 w-4" />}
            onSubmit={handleAddType}
            disabled={isSubmitting}
            validateInput={validateTypeName}
            maxLength={50}
            showCharCount
            helperText="Nombres comunes: Facultad, Escuela, Departamento, Instituto, Centro, División"
          />
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">¡Éxito!</h3>
                <p className="mt-1 text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Types Section */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <BuildingOffice2Icon className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Tipos Existentes
                  <Badge variant="secondary" className="ml-2">
                    {departmentTypes.length}
                  </Badge>
                </h3>
                <p className="text-sm text-gray-500">Gestiona los tipos de unidades académicas existentes</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden">
            {departmentTypes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <BuildingOffice2Icon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No hay tipos definidos</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Comienza agregando el primer tipo de unidad académica.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {departmentTypes.map((type, index) => (
                  <div 
                    key={type.id} 
                    className={`p-6 transition-colors duration-200 ${
                      editTypeId === type.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                          <BuildingOffice2Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {editTypeId === type.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editTypeName}
                                onChange={(e) => setEditTypeName(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                disabled={isSubmitting}
                                maxLength={50}
                                placeholder="Nombre del tipo"
                              />
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {editTypeName.length} / 50 caracteres
                                </p>
                                <div className="flex gap-2">
                                  <DashboardButton
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={isSubmitting}
                                  >
                                    Cancelar
                                  </DashboardButton>
                                  <DashboardButton
                                    size="sm"
                                    onClick={handleUpdateType}
                                    disabled={
                                      isSubmitting || 
                                      !editTypeName.trim() || 
                                      editTypeName === type.name ||
                                      validateTypeName(editTypeName) !== undefined
                                    }
                                    loading={isSubmitting}
                                  >
                                    Guardar
                                  </DashboardButton>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {type.name}
                                </h4>
                                <Badge variant="secondary" size="sm">
                                  ID: {type.id}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Tipo de unidad académica #{index + 1}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {editTypeId !== type.id && (
                        <div className="flex items-center gap-2 ml-4">
                          <DashboardButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(type)}
                            disabled={isSubmitting || editTypeId !== null}
                            leftIcon={<PencilIcon className="h-4 w-4" />}
                            className="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                          >
                            Editar
                          </DashboardButton>
                          <DashboardButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteType(type.id, type.name)}
                            disabled={isSubmitting || editTypeId !== null}
                            leftIcon={<TrashIcon className="h-4 w-4" />}
                            className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                          >
                            Eliminar
                          </DashboardButton>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <DashboardButton
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cerrar
        </DashboardButton>
      </div>
    </DashboardModal>
  );
};

export default DepartmentTypesManager;