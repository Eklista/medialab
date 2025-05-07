// src/features/dashboard/pages/settings/AcademicUnitsSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import AcademicUnitForm, { AcademicUnitFormData } from '../../components/config/AcademicUnitForm';
import DashboardInputWithButton from '../../components/ui/DashboardInputWithButton';
import { PlusIcon, AdjustmentsHorizontalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { academicUnitService, departmentTypeService } from '../../../../services';
import { AcademicUnit } from '../../../../services/academicUnits.service';
import { DepartmentType } from '../../../../services/departmentTypes.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

const AcademicUnitsSettings: React.FC = () => {
  // Estado para unidades académicas
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
  const [departmentTypes, setDepartmentTypes] = useState<DepartmentType[]>([]);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<AcademicUnit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para carga y errores
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTypesLoading, setIsTypesLoading] = useState(true);
  
  // Estado para filtros
  const [filterTypeId, setFilterTypeId] = useState<number | null>(null);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAcademicUnits();
    fetchDepartmentTypes();
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
  
  // Función para cargar tipos de departamentos
  const fetchDepartmentTypes = async () => {
    setIsTypesLoading(true);
    
    try {
      const data = await departmentTypeService.getDepartmentTypes();
      setDepartmentTypes(data);
    } catch (err) {
      console.error('Error al cargar tipos de departamentos:', err);
      // No bloqueamos toda la interfaz por este error
    } finally {
      setIsTypesLoading(false);
    }
  };

  const handleViewUnit = (unit: AcademicUnit) => {
    setCurrentUnit(unit);
    setIsViewModalOpen(true);
    setIsEditMode(false);
  };
  
  // Handler para cambiar a modo edición
  const handleSwitchToEditMode = () => {
    setIsEditMode(true);
  };
  
  // Función para agregar nuevo tipo de departamento
  const handleAddDepartmentType = async (name: string): Promise<DepartmentType> => {
    try {
      // Crear objeto con los datos del tipo
      const typeData = { name };
      
      // Llamar al servicio para crear el nuevo tipo
      const newType = await departmentTypeService.createDepartmentType(typeData);
      
      // Actualizar la lista de tipos
      setDepartmentTypes(prev => [...prev, newType]);
      
      return newType;
    } catch (err) {
      console.error('Error al crear tipo de departamento:', err);
      throw err;
    }
  };

  // Función para actualizar un tipo de departamento
  const handleUpdateDepartmentType = async (id: number, name: string): Promise<DepartmentType> => {
    try {
      const updatedType = await departmentTypeService.updateDepartmentType(id, { name });
      
      // Actualizar la lista de tipos
      setDepartmentTypes(prev => 
        prev.map(type => type.id === id ? updatedType : type)
      );
      
      return updatedType;
    } catch (err) {
      console.error('Error al actualizar tipo de departamento:', err);
      throw err;
    }
  };

  // Función para eliminar un tipo de departamento
  const handleDeleteDepartmentType = async (id: number): Promise<void> => {
    try {
      await departmentTypeService.deleteDepartmentType(id);
      
      // Actualizar la lista de tipos
      setDepartmentTypes(prev => prev.filter(type => type.id !== id));
      
    } catch (err) {
      console.error('Error al eliminar tipo de departamento:', err);
      throw err;
    }
  };
  
  // Handlers para unidades académicas
  const handleAddUnit = () => {
    setIsAddModalOpen(true);
  };
  
  const handleDeleteUnit = async () => {
    if (!currentUnit || !currentUnit.id) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null); // Limpiar mensaje de éxito anterior
    
    try {
      await academicUnitService.deleteAcademicUnit(currentUnit.id);
      
      setAcademicUnits(academicUnits.filter(unit => unit.id !== currentUnit.id));
      setSuccessMessage("La unidad académica ha sido eliminada correctamente"); // Mostrar mensaje de éxito
      
      // Opcional: Cerrar automáticamente después de un tiempo
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setCurrentUnit(null);
      }, 1500);
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
    setSuccessMessage(null); // Limpiar mensaje de éxito anterior
    
    try {
      const newUnit = await academicUnitService.createAcademicUnit(data);
      
      setAcademicUnits([...academicUnits, newUnit]);
      setSuccessMessage("La unidad académica ha sido creada correctamente"); // Mostrar mensaje de éxito
      
      // Opcional: Cerrar automáticamente después de un tiempo
      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1500);
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
    setSuccessMessage(null); // Limpiar mensaje de éxito anterior
    
    try {
      const updatedUnit = await academicUnitService.updateAcademicUnit(currentUnit.id, data);
      
      setAcademicUnits(academicUnits.map(unit => 
        unit.id === currentUnit.id ? updatedUnit : unit
      ));
      
      setSuccessMessage("La unidad académica ha sido actualizada correctamente"); // Mostrar mensaje de éxito
      
      // Opcional: Cerrar automáticamente después de un tiempo
      setTimeout(() => {
        setIsEditMode(false);
      }, 1500);
      
      setCurrentUnit(updatedUnit); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la unidad académica');
      console.error('Error al actualizar unidad académica:', err);
    } finally {
      setIsSubmitting(false);
    }
  };  

  // Handler para abrir el modal de gestión de tipos
  const handleOpenTypesManager = () => {
    setIsTypesModalOpen(true);
  };
  
  // Filtramos las unidades por tipo
  const filteredUnits = academicUnits.filter(unit => {
    if (filterTypeId === null) return true;
    return unit.type_id === filterTypeId;
  });
  
  // Columnas para la tabla con truncamiento y tooltip elegante
  const columns = [
    {
      header: 'Siglas',
      accessor: (unit: AcademicUnit) => unit.abbreviation,
      width: '15%'
    },
    {
      header: 'Nombre',
      accessor: (unit: AcademicUnit) => {
        const MAX_LENGTH = 25;
        if (!unit.name || unit.name.length <= MAX_LENGTH) {
          return unit.name || '-';
        }
        
        return (
          <div className="group relative truncate max-w-full">
            <span className="truncate">{unit.name.substring(0, MAX_LENGTH)}...</span>
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
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {type?.name || 'Desconocido'}
          </span>
        );
      },
      width: '15%'
    },
    {
      header: 'Descripción',
      accessor: (unit: AcademicUnit) => {
        const MAX_LENGTH = 40;
        const description = unit.description || '-';
        
        if (description.length <= MAX_LENGTH) {
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
  
  return (
    <div>
      {/* Cabecera con botones de acción */}
      <div className="border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">Gestión de Unidades Académicas</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 w-full sm:w-auto">
            <DashboardButton
              variant="outline"
              onClick={handleOpenTypesManager}
              leftIcon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
              fullWidth={window.innerWidth < 640}
              className="mb-2 sm:mb-0"
            >
              {window.innerWidth < 480 ? "Gestionar Tipos" : "Gestionar Tipos de Unidad"}
            </DashboardButton>
            <DashboardButton
              onClick={handleAddUnit}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              fullWidth={window.innerWidth < 640}
            >
              {window.innerWidth < 480 ? "Agregar" : "Agregar Unidad"}
            </DashboardButton>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Mostrar errores si los hay */}
        {error && (
          <ApiErrorHandler 
            error={error} 
            onRetry={fetchAcademicUnits} 
            resourceName="las unidades académicas"
          />
        )}
        
        {/* Filtros en formato de pestañas con scroll horizontal en móvil */}
        <div className="-mb-px border-b border-gray-200 overflow-x-auto pb-px scrollbar-thin">
          <nav className="flex space-x-2 min-w-max">
            <button
              className={`py-3 px-4 border-b-2 text-sm font-medium ${
                filterTypeId === null
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setFilterTypeId(null)}
            >
              Todas
            </button>
            
            {departmentTypes.map(type => (
              <button
                key={type.id}
                className={`py-3 px-4 border-b-2 text-sm font-medium whitespace-nowrap ${
                  filterTypeId === type.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setFilterTypeId(type.id)}
              >
                {type.name}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Mensaje de carga de tipos */}
        {isTypesLoading && (
          <div className="bg-blue-50 p-3 rounded-md mt-4 mb-4 text-blue-700 text-sm">
            <p>Cargando tipos de departamentos...</p>
          </div>
        )}
        
        {/* Tabla optimizada */}
        <div className="mt-4">
        <DashboardDataTable
          columns={columns}
          data={filteredUnits}
          keyExtractor={(unit) => unit.id.toString()}
          actionColumn={true}
          emptyMessage={isLoading ? "Cargando unidades académicas..." : "No hay unidades académicas configuradas"}
          isLoading={isLoading}
          className="max-h-[calc(100vh-280px)] scrollbar-thin"
          renderActions={(unit) => (
            <DashboardButton
              variant="text"
              size="sm"
              onClick={() => handleViewUnit(unit)}
              className="text-blue-600 hover:text-blue-900"
            >
              Ver
            </DashboardButton>
          )}
        />
        </div>
      </div>
      
      {/* Modal para agregar unidad académica */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSuccessMessage(null); // Limpiar mensaje al cerrar
        }}
        title="Agregar Unidad Académica"
        size="lg"
        error={error}
        success={successMessage}
      >
        <AcademicUnitForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
          departmentTypes={departmentTypes}
          onManageTypes={handleOpenTypesManager}
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
            departmentTypes={departmentTypes}
            onManageTypes={handleOpenTypesManager}
          />
        )}
      </DashboardModal>
      
      {/* Modal para confirmar eliminación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentUnit(null);
          setSuccessMessage(null); // Limpiar mensaje al cerrar
        }}
        title="Confirmar Eliminación"
        error={error}
        success={successMessage}
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

      {/* Modal para gestionar tipos de departamentos */}
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
                        <button
                          onClick={() => {
                            const newName = prompt('Nuevo nombre:', type.name);
                            if (newName && newName !== type.name) {
                              handleUpdateDepartmentType(type.id, newName);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo "${type.name}"?`)) {
                              handleDeleteDepartmentType(type.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
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

      {/* Modal para ver detalles y editar */}
      <DashboardModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setCurrentUnit(null);
          setIsEditMode(false);
          setSuccessMessage(null); // Limpiar mensaje al cerrar
        }}
        title={isEditMode ? "Editar Unidad Académica" : "Detalle de Unidad Académica"}
        size="lg"
        error={error}
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
              />
            ) : (
              // Vista en modo lectura
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Siglas</h3>
                    <p className="mt-1 text-base text-gray-900">{currentUnit.abbreviation}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {departmentTypes.find(t => t.id === currentUnit.type_id)?.name || 'Desconocido'}
                      </span>
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
                  
                  <DashboardButton
                    type="button"
                    variant="secondary"
                    onClick={handleSwitchToEditMode}
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                  >
                    Editar
                  </DashboardButton>
                  
                  <DashboardButton
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    leftIcon={<TrashIcon className="h-4 w-4" />}
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