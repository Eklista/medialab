// src/features/dashboard/pages/settings/AcademicUnitsSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import AcademicUnitForm, { AcademicUnitFormData } from '../../components/config/AcademicUnitForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { academicUnitService } from '../../../../services';
import { AcademicUnit } from '../../../../services/academicUnits.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

const AcademicUnitsSettings: React.FC = () => {
  // Estado para unidades académicas
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<AcademicUnit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para carga y errores
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para filtros
  const [filterType, setFilterType] = useState<'all' | 'faculty' | 'department'>('all');
  
  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAcademicUnits();
  }, []);
  
  // Función para cargar unidades académicas desde la API
  const fetchAcademicUnits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await academicUnitService.getAcademicUnits();
      setAcademicUnits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las unidades académicas');
      console.error('Error al cargar unidades académicas:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers
  const handleAddUnit = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditUnit = (unit: AcademicUnit) => {
    setCurrentUnit(unit);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (unit: AcademicUnit) => {
    setCurrentUnit(unit);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteUnit = async () => {
    if (!currentUnit || !currentUnit.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await academicUnitService.deleteAcademicUnit(currentUnit.id);
      
      setAcademicUnits(academicUnits.filter(unit => unit.id !== currentUnit.id));
      setIsDeleteModalOpen(false);
      setCurrentUnit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la unidad académica');
      console.error('Error al eliminar unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddSubmit = async (data: AcademicUnitFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newUnit = await academicUnitService.createAcademicUnit(data);
      
      setAcademicUnits([...academicUnits, newUnit]);
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la unidad académica');
      console.error('Error al crear unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: AcademicUnitFormData) => {
    if (!currentUnit || !currentUnit.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedUnit = await academicUnitService.updateAcademicUnit(currentUnit.id, data);
      
      setAcademicUnits(academicUnits.map(unit => 
        unit.id === currentUnit.id ? updatedUnit : unit
      ));
      
      setIsEditModalOpen(false);
      setCurrentUnit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la unidad académica');
      console.error('Error al actualizar unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filtramos las unidades por tipo
  const filteredUnits = academicUnits.filter(unit => {
    if (filterType === 'all') return true;
    return unit.type === filterType;
  });
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Siglas',
      accessor: (unit: AcademicUnit) => unit.abbreviation
    },
    {
      header: 'Nombre',
      accessor: (unit: AcademicUnit) => unit.name
    },
    {
      header: 'Tipo',
      accessor: (unit: AcademicUnit) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          unit.type === 'faculty' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {unit.type === 'faculty' ? 'Facultad' : 'Departamento'}
        </span>
      )
    },
    {
      header: 'Descripción',
      accessor: (unit: AcademicUnit) => unit.description
    }
  ];
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Gestión de Unidades Académicas</h2>
        <DashboardButton
          onClick={handleAddUnit}
          leftIcon={<PlusIcon className="w-5 h-5" />}
        >
          Agregar Nueva Unidad
        </DashboardButton>
      </div>
      
      {/* Mostrar errores si los hay */}
      {error && (
        <ApiErrorHandler 
          error={error} 
          onRetry={fetchAcademicUnits} 
          resourceName="las unidades académicas"
        />
      )}
      
      {/* Filtros */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterType === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilterType('all')}
          >
            Todas
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterType === 'faculty'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilterType('faculty')}
          >
            Facultades
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterType === 'department'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilterType('department')}
          >
            Departamentos
          </button>
        </div>
      </div>
      
      <DashboardDataTable
        columns={columns}
        data={filteredUnits}
        keyExtractor={(unit) => unit.id.toString()}
        onEdit={handleEditUnit}
        onDelete={handleDeleteClick}
        actionColumn={true}
        emptyMessage={isLoading ? "Cargando unidades académicas..." : "No hay unidades académicas configuradas"}
        isLoading={isLoading}
      />
      
      {/* Modal para agregar unidad académica */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Unidad Académica"
        size="lg"
      >
        <AcademicUnitForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      {/* Modal para editar unidad académica */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentUnit(null);
        }}
        title="Editar Unidad Académica"
        size="lg"
      >
        {currentUnit && (
          <AcademicUnitForm
            initialData={currentUnit}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentUnit(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>
      
      {/* Modal para confirmar eliminación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentUnit(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar <span className="font-medium">{currentUnit?.abbreviation} - {currentUnit?.name}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setCurrentUnit(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteUnit}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default AcademicUnitsSettings;