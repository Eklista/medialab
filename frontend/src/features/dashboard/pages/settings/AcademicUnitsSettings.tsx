// src/features/dashboard/pages/settings/AcademicUnitsSettings.tsx
import React, { useState } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import AcademicUnitForm, { AcademicUnitFormData } from '../../components/config/AcademicUnitForm';
import { PlusIcon } from '@heroicons/react/24/outline';

// Tipos
interface AcademicUnit {
  id: string;
  abbreviation: string;
  name: string;
  type: 'faculty' | 'department';
  description: string;
}

const AcademicUnitsSettings: React.FC = () => {
  // Estado para unidades académicas (facultades y departamentos)
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([
    {
      id: '1',
      abbreviation: 'FISICC',
      name: 'Facultad de Ingeniería de Sistemas, Informática y Ciencias de la Computación',
      type: 'faculty',
      description: 'Facultad dedicada a la formación en ciencias de la computación e ingeniería de sistemas'
    },
    {
      id: '2',
      abbreviation: 'MEDIALAB',
      name: 'Laboratorio de Multimedia',
      type: 'department',
      description: 'Departamento especializado en Producción Audiovisual'
    },
    {
      id: '3',
      abbreviation: 'FACOM',
      name: 'Facultad de Comunicación',
      type: 'faculty',
      description: 'Facultad para profesionales en comunicación y diseño'
    }
  ]);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<AcademicUnit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para filtros
  const [filterType, setFilterType] = useState<'all' | 'faculty' | 'department'>('all');
  
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
  
  const handleDeleteUnit = () => {
    if (currentUnit) {
      setAcademicUnits(academicUnits.filter(unit => unit.id !== currentUnit.id));
      setIsDeleteModalOpen(false);
      setCurrentUnit(null);
    }
  };
  
  const handleAddSubmit = (data: AcademicUnitFormData) => {
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      const newUnit: AcademicUnit = {
        id: Date.now().toString(),
        ...data
      };
      
      setAcademicUnits([...academicUnits, newUnit]);
      setIsAddModalOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const handleEditSubmit = (data: AcademicUnitFormData) => {
    if (!currentUnit) return;
    
    setIsSubmitting(true);
    
    // Simulamos una petición a la API
    setTimeout(() => {
      setAcademicUnits(academicUnits.map(unit => 
        unit.id === currentUnit.id
          ? { ...unit, ...data }
          : unit
      ));
      
      setIsEditModalOpen(false);
      setCurrentUnit(null);
      setIsSubmitting(false);
    }, 500);
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
  
  // Helper functions for other components to use
  // const getAllAcademicUnits = () => [...academicUnits];
  // const getFaculties = () => academicUnits.filter(unit => unit.type === 'faculty');
  // const getDepartments = () => academicUnits.filter(unit => unit.type === 'department');
  
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
        keyExtractor={(unit) => unit.id}
        onEdit={handleEditUnit}
        onDelete={handleDeleteClick}
        actionColumn={true}
        emptyMessage="No hay unidades académicas configuradas"
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
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleDeleteUnit}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default AcademicUnitsSettings;