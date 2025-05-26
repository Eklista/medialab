// src/features/dashboard/pages/settings/AcademicUnitsSettings.tsx - PARTE 1
import React, { useState, useEffect, useCallback } from 'react';
import ConfigPageHeader from '../../components/config/ConfigPageHeader';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardPlaceholder, { NoPermissionPlaceholder, ErrorPlaceholder } from '../../components/ui/DashboardPlaceholder';
import AcademicUnitForm, { AcademicUnitFormData } from '../../components/config/AcademicUnitForm';
import DashboardInputWithButton from '../../components/ui/DashboardInputWithButton';
import Badge from '../../components/ui/Badge';
import { 
  PlusIcon, 
  AdjustmentsHorizontalIcon, 
  PencilIcon, 
  TrashIcon,
  AcademicCapIcon 
} from '@heroicons/react/24/outline';
import { academicUnitService, departmentTypeService } from '../../../../services';
import { AcademicUnit } from '../../../../services/academicUnits.service';
import { DepartmentType } from '../../../../services/departmentTypes.service';
import { usePermissions } from '../../../../hooks/usePermissions';

const AcademicUnitsSettings: React.FC = () => {
  // 🎯 Usar el nuevo hook de permisos
  const { 
    canView,
    canCreate,
    isLoading: permissionsLoading, 
    error: permissionsError 
  } = usePermissions();
  
  // 🎯 Verificaciones de permisos específica
  const canViewUnits = canView('department');
  const canManageTypes = canView('department_type') && canCreate('department_type');

  // Estado para unidades académicas
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
  const [departmentTypes, setDepartmentTypes] = useState<DepartmentType[]>([]);
  
  // Estado para modales de unidades
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<AcademicUnit | null>(null);
  
  // Estado para modal de tipos
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);
  
  // Estado para operaciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTypesLoading, setIsTypesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para filtros
  const [filterTypeId, setFilterTypeId] = useState<number | null>(null);
  
  // 🎯 Función para cargar unidades académicas desde la API (ÚNICA VERSIÓN)
  const fetchAcademicUnits = useCallback(async () => {
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
  }, []);
  
  // 🎯 Función para cargar tipos de departamentos (ÚNICA VERSIÓN)
  const fetchDepartmentTypes = useCallback(async () => {
    setIsTypesLoading(true);
    
    try {
      const data = await departmentTypeService.getDepartmentTypes();
      setDepartmentTypes(data);
    } catch (err) {
      console.error('Error al cargar tipos de departamentos:', err);
    } finally {
      setIsTypesLoading(false);
    }
  }, []);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    if (canViewUnits) {
      fetchAcademicUnits();
      fetchDepartmentTypes();
    }
  }, [canViewUnits, fetchAcademicUnits, fetchDepartmentTypes]);

  // 🎯 TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER EARLY RETURN

  // 🎯 Ahora sí podemos hacer early returns después de todos los hooks
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Cargando permisos...</span>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <ErrorPlaceholder
        title="Error al cargar permisos"
        description={permissionsError}
        onRetry={() => window.location.reload()}
        size="md"
      />
    );
  }

  if (!canViewUnits) {
    return (
      <NoPermissionPlaceholder
        title="Acceso Restringido"
        description="No tienes permisos para acceder a la gestión de unidades académicas."
        size="md"
      >
        <p className="text-xs text-gray-400 mt-2">
          Permiso requerido: department_view
        </p>
      </NoPermissionPlaceholder>
    );
  }

  // src/features/dashboard/pages/settings/AcademicUnitsSettings.tsx - PARTE 2

  // 🎯 HANDLERS PARA VISTAS Y NAVEGACIÓN - Simplificados sin verificaciones manuales
  const handleViewUnit = (unit: AcademicUnit) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentUnit(unit);
    setIsViewModalOpen(true);
    setIsEditMode(false);
  };
  
  const handleSwitchToEditMode = () => {
    setIsEditMode(true);
  };
  
  // 🎯 HANDLERS PARA TIPOS DE DEPARTAMENTOS - Simplificados
  const handleAddDepartmentType = async (name: string): Promise<DepartmentType> => {
    try {
      const typeData = { name };
      const newType = await departmentTypeService.createDepartmentType(typeData);
      setDepartmentTypes(prev => [...prev, newType]);
      return newType;
    } catch (err) {
      console.error('Error al crear tipo de departamento:', err);
      throw err;
    }
  };

  const handleUpdateDepartmentType = async (id: number, name: string): Promise<DepartmentType> => {
    try {
      const updatedType = await departmentTypeService.updateDepartmentType(id, { name });
      setDepartmentTypes(prev => 
        prev.map(type => type.id === id ? updatedType : type)
      );
      return updatedType;
    } catch (err) {
      console.error('Error al actualizar tipo de departamento:', err);
      throw err;
    }
  };

  const handleDeleteDepartmentType = async (id: number): Promise<void> => {
    try {
      await departmentTypeService.deleteDepartmentType(id);
      setDepartmentTypes(prev => prev.filter(type => type.id !== id));
    } catch (err) {
      console.error('Error al eliminar tipo de departamento:', err);
      throw err;
    }
  };
  
  // 🎯 HANDLERS PARA UNIDADES ACADÉMICAS - Simplificados sin verificaciones manuales
  const handleAddUnit = () => {
    setModalError(null);
    setSuccessMessage(null);
    setIsAddModalOpen(true);
  };
  
  const handleEditUnit = (unit: AcademicUnit) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentUnit(unit);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteUnitClick = (unit: AcademicUnit) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentUnit(unit);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteUnit = async () => {
    if (!currentUnit || !currentUnit.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await academicUnitService.deleteAcademicUnit(currentUnit.id);
      
      setAcademicUnits(academicUnits.filter(unit => unit.id !== currentUnit.id));
      setSuccessMessage("La unidad académica ha sido eliminada correctamente");
      
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setCurrentUnit(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar la unidad académica');
      console.error('Error al eliminar unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubmit = async (data: AcademicUnitFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const newUnit = await academicUnitService.createAcademicUnit(data);
      
      setAcademicUnits([...academicUnits, newUnit]);
      setSuccessMessage("La unidad académica ha sido creada correctamente");
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear la unidad académica');
      console.error('Error al crear unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };  
  
  const handleEditSubmit = async (data: AcademicUnitFormData) => {
    if (!currentUnit || !currentUnit.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const updatedUnit = await academicUnitService.updateAcademicUnit(currentUnit.id, data);
      
      setAcademicUnits(academicUnits.map(unit => 
        unit.id === currentUnit.id ? updatedUnit : unit
      ));
      
      setSuccessMessage("La unidad académica ha sido actualizada correctamente");
      
      setTimeout(() => {
        if (isEditMode) {
          setIsEditMode(false);
        } else {
          setIsEditModalOpen(false);
          setCurrentUnit(null);
        }
        setSuccessMessage(null);
      }, 2000);
      
      setCurrentUnit(updatedUnit); 
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar la unidad académica');
      console.error('Error al actualizar unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };  

  // Handler para abrir el modal de gestión de tipos
  const handleOpenTypesManager = () => {
    setIsTypesModalOpen(true);
  };
  
  // Filtrar las unidades por tipo
  const filteredUnits = academicUnits.filter(unit => {
    if (filterTypeId === null) return true;
    return unit.type_id === filterTypeId;
  });

  // Estadísticas para el header
  const uniqueTypes = new Set(academicUnits.map(unit => unit.type_id)).size;
  const stats = [
    {
      label: 'Total',
      value: academicUnits.length,
      variant: 'default' as const
    },
    {
      label: 'Tipos diferentes',
      value: uniqueTypes,
      variant: 'success' as const
    },
    {
      label: 'Con descripción',
      value: academicUnits.filter(unit => unit.description && unit.description.trim().length > 0).length,
      variant: 'warning' as const
    }
  ];

  // Crear tabs para los filtros de tipo
  const filterTabs = isTypesLoading 
    ? [{ id: 'all', label: 'Cargando..', isActive: true, onClick: () => {}, count: 0 }] 
    : [
        {
          id: 'all',
          label: 'Todas',
          isActive: filterTypeId === null,
          onClick: () => setFilterTypeId(null),
          count: academicUnits.length
        },
        ...departmentTypes.map(type => {
          const count = academicUnits.filter(unit => unit.type_id === type.id).length;
          return {
            id: `type-${type.id}`,
            label: type.name,
            isActive: filterTypeId === type.id,
            onClick: () => setFilterTypeId(type.id),
            count: count
          };
        })
      ];

      // src/features/dashboard/pages/settings/AcademicUnitsSettings.tsx - PARTE 3
  
  // Columnas para la tabla con truncamiento y tooltip elegante
  const columns = [
    {
      header: 'Siglas',
      accessor: (unit: AcademicUnit) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {unit.abbreviation}
        </span>
      ),
      width: '15%'
    },
    {
      header: 'Nombre',
      accessor: (unit: AcademicUnit) => {
        const MAX_LENGTH = 25;
        if (!unit.name || unit.name.length <= MAX_LENGTH) {
          return (
            <div>
              <div className="font-medium text-gray-900">{unit.name || '-'}</div>
            </div>
          );
        }
        
        return (
          <div className="group relative truncate max-w-full">
            <div className="font-medium text-gray-900 truncate">
              {unit.name.substring(0, MAX_LENGTH)}...
            </div>
            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
              <div className="bg-gray-800 text-white text-sm rounded shadow-lg p-2 max-w-[300px] whitespace-normal break-words">
                {unit.name}
              </div>
            </div>
          </div>
        );
      },
      width: '35%'
    },
    {
      header: 'Tipo',
      accessor: (unit: AcademicUnit) => {
        const type = departmentTypes.find(t => t.id === unit.type_id);
        return (
          <Badge variant="primary">{type?.name || 'Desconocido'}</Badge>
        );
      },
      width: '15%'
    },
    {
      header: 'Descripción',
      accessor: (unit: AcademicUnit) => {
        const MAX_LENGTH = 40;
        const description = unit.description || '-';
        
        if (description === '-' || description.length <= MAX_LENGTH) {
          return <div className="text-sm text-gray-600 truncate">{description}</div>;
        }
        
        return (
          <div className="group relative text-sm text-gray-600 truncate max-w-full">
            <span className="truncate">{description.substring(0, MAX_LENGTH)}...</span>
            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
              <div className="bg-gray-800 text-white text-sm rounded shadow-lg p-2 max-w-[350px] whitespace-normal break-words">
                {description}
              </div>
            </div>
          </div>
        );
      },
      width: '35%'
    }
  ];

  // 🎯 Renderizar acciones personalizadas con permisos automáticos
  const renderUnitActions = (unit: AcademicUnit) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        permissionCategory="department"
        permissionAction="view"
        variant="text"
        size="sm"
        onClick={() => handleViewUnit(unit)}
        className="text-blue-600 hover:text-blue-900"
        showPermissionTooltip={true}
      >
        Ver
      </DashboardButton>
      
      <DashboardButton
        permissionCategory="department"
        permissionAction="edit"
        variant="text"
        size="sm"
        onClick={() => handleEditUnit(unit)}
        className="text-blue-600 hover:text-blue-900"
        leftIcon={<PencilIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Editar
      </DashboardButton>
      
      <DashboardButton
        permissionCategory="department"
        permissionAction="delete"
        variant="text"
        size="sm"
        onClick={() => handleDeleteUnitClick(unit)}
        className="text-red-600 hover:text-red-900"
        leftIcon={<TrashIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Eliminar
      </DashboardButton>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <ConfigPageHeader
        title="Unidades Académicas"
        subtitle="Gestiona las unidades académicas y sus tipos en el sistema"
        icon={<AcademicCapIcon className="h-6 w-6" />}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={fetchAcademicUnits}
        stats={!isLoading ? stats : undefined}
        tabs={filterTabs}
        actionButton={
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 w-full sm:w-auto">
            {/* 🎯 Botón gestionar tipos con permisos automáticos */}
            <DashboardButton
              permissionCategory="department_type"
              permissionAction="view"
              variant="outline"
              onClick={handleOpenTypesManager}
              leftIcon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
              className="w-full sm:w-auto mb-2 sm:mb-0"
              disabled={isLoading}
              showPermissionTooltip={true}
            >
              <span className="hidden sm:inline">Gestionar Tipos</span>
              <span className="sm:hidden">Tipos</span>
            </DashboardButton>
            
            {/* 🎯 Botón crear con permisos automáticos */}
            <DashboardButton
              permissionCategory="department"
              permissionAction="create"
              onClick={handleAddUnit}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              className="w-full sm:w-auto"
              disabled={isLoading}
              showPermissionTooltip={true}
            >
              <span className="hidden sm:inline">Agregar Unidad</span>
              <span className="sm:hidden">Nueva</span>
            </DashboardButton>
          </div>
        }
      />

      {/* Contenido principal */}
      {error ? (
        <ErrorPlaceholder
          title="Error al cargar unidades académicas"
          description={error}
          onRetry={fetchAcademicUnits}
          size="sm"
          showBackground={false}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Mensaje de carga de tipos */}
          {isTypesLoading && (
            <div className="p-4 bg-blue-50 border-b border-blue-200 text-blue-700 text-sm">
              <p>Cargando tipos de departamentos...</p>
            </div>
          )}
          
          <DashboardDataTable
            columns={columns}
            data={filteredUnits}
            keyExtractor={(unit) => unit.id.toString()}
            actionColumn={true}
            emptyMessage=""
            isLoading={isLoading}
            renderActions={renderUnitActions}
            striped={true}
            hover={true}
            className="max-h-[calc(100vh-280px)] scrollbar-thin"
          />
          
          {/* Empty state */}
          {!isLoading && !error && filteredUnits.length === 0 && (
            <div className="p-8">
              <DashboardPlaceholder
                type="empty"
                title="No hay unidades académicas"
                description={filterTypeId === null 
                  ? "No hay unidades académicas configuradas. Crea la primera unidad para empezar."
                  : "No hay unidades académicas de este tipo. Prueba con otro filtro o crea una nueva unidad."
                }
                size="sm"
                showBackground={false}
                primaryAction={{
                  label: 'Crear Primera Unidad',
                  onClick: handleAddUnit,
                  icon: <PlusIcon className="h-4 w-4" />
                }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* 🎯 Modal para agregar unidad académica */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Agregar Unidad Académica"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        <AcademicUnitForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
          departmentTypes={departmentTypes}
          onManageTypes={canManageTypes ? handleOpenTypesManager : undefined}
        />
      </DashboardModal>
      
      {/* 🎯 Modal para editar unidad académica */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentUnit(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar Unidad Académica"
        size="lg"
        error={modalError}
        success={successMessage}
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
            departmentTypes={departmentTypes}
            onManageTypes={canManageTypes ? handleOpenTypesManager : undefined}
          />
        )}
      </DashboardModal>
      
      {/* 🎯 Modal para confirmar eliminación con permisos automáticos */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentUnit(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
        success={successMessage}
      >
        <div className="py-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
              <TrashIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                ¿Eliminar unidad "{currentUnit?.abbreviation} - {currentUnit?.name}"?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Esta acción no se puede deshacer.
              </p>
              
              {/* Información adicional de la unidad */}
              {currentUnit && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <span className="ml-2 text-gray-900">
                        {departmentTypes.find(t => t.id === currentUnit.type_id)?.name || 'Desconocido'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Siglas:</span>
                      <span className="ml-2 text-gray-900 font-mono">
                        {currentUnit.abbreviation}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
          
          {/* 🎯 Botón eliminar con permisos automáticos */}
          <DashboardButton
            permissionCategory="department"
            permissionAction="delete"
            onClick={handleDeleteUnit}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<TrashIcon className="h-4 w-4" />}
            showPermissionTooltip={true}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>

      {/* 🎯 Modal para gestionar tipos de departamentos con permisos integrados */}
      <DashboardModal
        isOpen={isTypesModalOpen}
        onClose={() => setIsTypesModalOpen(false)}
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
            onSubmit={handleAddDepartmentType}
            validateInput={(value) => {
              if (value.length < 2) {
                return 'El nombre debe tener al menos 2 caracteres';
              }
              if (departmentTypes.some(type => type.name.toLowerCase() === value.toLowerCase())) {
                return 'Este tipo ya existe';
              }
              return undefined;
            }}
            className="mb-2"
          />
        </div>
        
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
                      {type.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        {/* 🎯 Botón editar tipo con permisos automáticos */}
                        <DashboardButton
                          permissionCategory="department_type"
                          permissionAction="edit"
                          variant="text"
                          size="sm"
                          onClick={() => {
                            const newName = prompt('Nuevo nombre:', type.name);
                            if (newName && newName !== type.name) {
                              handleUpdateDepartmentType(type.id, newName);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          showPermissionTooltip={true}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </DashboardButton>
                        
                        {/* 🎯 Botón eliminar tipo con permisos automáticos */}
                        <DashboardButton
                          permissionCategory="department_type"
                          permissionAction="delete"
                          variant="text"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo "${type.name}"?`)) {
                              handleDeleteDepartmentType(type.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          showPermissionTooltip={true}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </DashboardButton>
                      </div>
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
            onClick={() => setIsTypesModalOpen(false)}
          >
            Cerrar
          </DashboardButton>
        </div>
      </DashboardModal>

      {/* 🎯 Modal para ver detalles y editar con permisos automáticos */}
      <DashboardModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setCurrentUnit(null);
          setIsEditMode(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title={isEditMode ? "Editar Unidad Académica" : "Detalle de Unidad Académica"}
        size="lg"
        error={modalError}
        success={successMessage}
      >
        {currentUnit && (
          <>
            {isEditMode ? (
              // Formulario de edición
              <AcademicUnitForm
                initialData={currentUnit}
                onSubmit={handleEditSubmit}
                onCancel={() => {
                  setIsEditMode(false);
                }}
                isSubmitting={isSubmitting}
                departmentTypes={departmentTypes}
                onManageTypes={canManageTypes ? handleOpenTypesManager : undefined}
              />
            ) : (
              // Vista en modo lectura
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Siglas</h3>
                    <p className="mt-1 text-base text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                      {currentUnit.abbreviation}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
                    <p className="mt-1">
                      <Badge variant="primary">
                        {departmentTypes.find(t => t.id === currentUnit.type_id)?.name || 'Desconocido'}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nombre completo</h3>
                  <p className="mt-1 text-base text-gray-900">{currentUnit.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="mt-1 text-base text-gray-900">{currentUnit.description || 'No disponible'}</p>
                </div>
                
                <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end space-x-3">
                  <DashboardButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setCurrentUnit(null);
                    }}
                  >
                    Cerrar
                  </DashboardButton>
                  
                  {/* 🎯 Botón editar con permisos automáticos */}
                  <DashboardButton
                    permissionCategory="department"
                    permissionAction="edit"
                    type="button"
                    variant="secondary"
                    onClick={handleSwitchToEditMode}
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                    showPermissionTooltip={true}
                  >
                    Editar
                  </DashboardButton>
                  
                  {/* 🎯 Botón eliminar con permisos automáticos */}
                  <DashboardButton
                    permissionCategory="department"
                    permissionAction="delete"
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                    showPermissionTooltip={true}
                  >
                    Eliminar
                  </DashboardButton>
                </div>
              </div>
            )}
          </>
        )}
      </DashboardModal>
    </div>
  );
};

export default AcademicUnitsSettings;