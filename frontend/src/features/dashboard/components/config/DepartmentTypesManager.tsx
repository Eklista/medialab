// src/features/dashboard/components/config/DepartmentTypesManager.tsx
import React, { useState } from 'react';
import DashboardModal from '../ui/DashboardModal';
import DashboardInputWithButton from '../ui/DashboardInputWithButton';
import DashboardButton from '../ui/DashboardButton';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

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
  
  const handleAddType = async (name: string) => {
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      await onAddType(name);
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
    
    try {
      await onUpdateType(editTypeId, editTypeName);
      setEditTypeId(null);
      setEditTypeName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el tipo');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteType = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este tipo? Esta acción no se puede deshacer.')) {
      setIsSubmitting(true);
      setError(undefined);
      
      try {
        await onDeleteType(id);
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
      size="md"
    >
      <div className="mb-5">
        <DashboardInputWithButton
          id="new-type-name"
          name="new-type-name"
          label="Nuevo tipo de unidad académica"
          placeholder="Ej: Facultad, Escuela, Departamento"
          buttonText="Añadir"
          buttonIcon={<PlusIcon className="h-4 w-4" />}
          onSubmit={handleAddType}
          disabled={isSubmitting}
          validateInput={validateTypeName}
          className="mb-2"
        />
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}
      
      <div className="border rounded-md overflow-hidden mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departmentTypes.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay tipos de unidades académicas definidos
                </td>
              </tr>
            ) : (
              departmentTypes.map(type => (
                <tr key={type.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editTypeId === type.id ? (
                      <input
                        type="text"
                        value={editTypeName}
                        onChange={(e) => setEditTypeName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        disabled={isSubmitting}
                      />
                    ) : (
                      type.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editTypeId === type.id ? (
                      <div className="flex space-x-2 justify-end">
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
                          disabled={isSubmitting || !editTypeName.trim() || editTypeName === type.name}
                          loading={isSubmitting}
                        >
                          Guardar
                        </DashboardButton>
                      </div>
                    ) : (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleEditClick(type)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={isSubmitting}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isSubmitting}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end">
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