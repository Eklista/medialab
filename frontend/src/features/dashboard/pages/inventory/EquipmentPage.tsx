// frontend/src/features/dashboard/pages/inventory/EquipmentPage.tsx

import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Importar los componentes de inventario
import EquipmentList from '../../inventory/equipment/EquipmentList';
import EquipmentForm from '../../inventory/equipment/EquipmentForm';
import AssignmentModal from '../../inventory/equipment/AssignmentModal';
import QuickActions from '../../inventory/common/QuickActions';
import { useSearchFilters } from '../../inventory/common/SearchFilters';

// Icons
import { 
  ComputerDesktopIcon,
  PlusIcon,
  UserPlusIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

// Hooks
import { useEquipmentList, useInventoryCommon } from '../../../../services/inventory';
import { useDebounce } from '../../../../hooks/useDebounce';
import type { EquipmentWithDetails } from '../../../../services/inventory/types';

const EquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados del modal/formulario
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithDetails | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentWithDetails | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filtros desde URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchTerm = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const stateFilter = searchParams.get('state') || '';
  const locationFilter = searchParams.get('location') || '';
  const assignmentFilter = searchParams.get('assignment') || '';
  const itemsPerPage = parseInt(searchParams.get('limit') || '25');

  // Hook de filtros
  const {
    searchValue,
    setSearchValue,
    activeFilters,
    setActiveFilters,
    resetFilters
  } = useSearchFilters({
    category_id: categoryFilter,
    state_id: stateFilter,
    location_id: locationFilter,
    assignment_status: assignmentFilter
  });

  // Debounced search
  const debouncedSearch = useDebounce(searchValue || searchTerm, 300);

  // Hooks de datos
  const {
    equipment,
    totalCount,
    isLoading,
    error,
    refresh,
    searchEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    assignEquipment,
    unassignEquipment,
    exportEquipment
  } = useEquipmentList({
    autoFetch: true,
    searchParams: {
      q: debouncedSearch,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
      state_id: stateFilter ? parseInt(stateFilter) : undefined,
      location_id: locationFilter ? parseInt(locationFilter) : undefined,
      assigned_only: assignmentFilter === 'assigned' ? true : undefined,
      unassigned_only: assignmentFilter === 'unassigned' ? true : undefined
    }
  });

  const {
    categories,
    locations,
    equipmentStates,
    suppliers,
    isLoading: isLoadingCommon
  } = useInventoryCommon();

  // Handlers de actualización de URL
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      
      if (Object.keys(updates).some(key => key !== 'page')) {
        newParams.set('page', '1');
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  // Handlers principales
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    updateSearchParams({ search: value });
  }, [setSearchValue, updateSearchParams]);

  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setActiveFilters(filters);
    updateSearchParams(filters);
  }, [setActiveFilters, updateSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    updateSearchParams({ page: page.toString() });
  }, [updateSearchParams]);

  // Handlers de equipos
  const handleCreateEquipment = useCallback(() => {
    setShowCreateForm(true);
    setEditingEquipment(null);
  }, []);

  const handleEditEquipment = useCallback((equipment: EquipmentWithDetails) => {
    setEditingEquipment(equipment);
    setShowCreateForm(true);
  }, []);

  const handleViewEquipment = useCallback((equipment: EquipmentWithDetails) => {
    navigate(`/dashboard/inventory/equipment/${equipment.id}`);
  }, [navigate]);

  const handleDeleteEquipment = useCallback(async (equipment: EquipmentWithDetails) => {
    if (window.confirm(`¿Estás seguro de eliminar el equipo ${equipment.codigo_ug || equipment.id}?`)) {
      try {
        await deleteEquipment(equipment.id);
      } catch (error) {
        console.error('Error eliminando equipo:', error);
      }
    }
  }, [deleteEquipment]);

  const handleAssignEquipment = useCallback((equipment: EquipmentWithDetails) => {
    setSelectedEquipment(equipment);
    setShowAssignmentModal(true);
  }, []);

  const handleUnassignEquipment = useCallback(async (equipment: EquipmentWithDetails) => {
    if (window.confirm(`¿Desasignar equipo ${equipment.codigo_ug || equipment.id}?`)) {
      try {
        await unassignEquipment(equipment.id);
      } catch (error) {
        console.error('Error desasignando equipo:', error);
      }
    }
  }, [unassignEquipment]);

  const handleQrCodeEquipment = useCallback((equipment: EquipmentWithDetails) => {
    // TODO: Implementar generación de QR
    console.log('Generar QR para equipo:', equipment.id);
  }, []);

  // Handlers de formulario
  const handleFormSubmit = useCallback(async (formData: any) => {
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, formData);
      } else {
        await createEquipment(formData);
      }
      setShowCreateForm(false);
      setEditingEquipment(null);
    } catch (error) {
      console.error('Error guardando equipo:', error);
      throw error; // Re-throw para que el formulario maneje el error
    }
  }, [editingEquipment, updateEquipment, createEquipment]);

  const handleFormCancel = useCallback(() => {
    setShowCreateForm(false);
    setEditingEquipment(null);
  }, []);

  // Handlers de asignación
  const handleAssignmentSuccess = useCallback((equipment: EquipmentWithDetails | EquipmentWithDetails[]) => {
    setShowAssignmentModal(false);
    setSelectedEquipment(null);
    refresh(); // Refrescar la lista
  }, [refresh]);

  const handleAssignmentClose = useCallback(() => {
    setShowAssignmentModal(false);
    setSelectedEquipment(null);
  }, []);

  // Handlers de acciones masivas
  const handleBulkAction = useCallback(async (action: string, equipmentIds: number[]) => {
    console.log(`Acción masiva: ${action} para equipos:`, equipmentIds);
    
    switch (action) {
      case 'assign':
        // Abrir modal de asignación masiva
        setSelectedEquipment(null); // Para modo bulk
        setShowAssignmentModal(true);
        break;
      case 'export':
        try {
          await exportEquipment({ equipment_ids: equipmentIds });
        } catch (error) {
          console.error('Error exportando equipos:', error);
        }
        break;
      default:
        console.log('Acción no implementada:', action);
    }
  }, [exportEquipment]);

  const handleExport = useCallback(async () => {
    try {
      await exportEquipment({});
    } catch (error) {
      console.error('Error exportando equipos:', error);
    }
  }, [exportEquipment]);

  // Preparar datos para el componente EquipmentList
  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name,
    count: 0 // Se podría agregar desde el backend
  }));

  const locationOptions = locations.map(loc => ({
    value: loc.id.toString(),
    label: loc.name,
    count: 0
  }));

  const stateOptions = equipmentStates.map(state => ({
    value: state.id.toString(),
    label: state.name,
    count: 0
  }));

  // Manejo de errores
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipos</h1>
          </div>
          
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="la lista de equipos"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipos</h1>
            </div>
            <p className="text-gray-600">
              Control y administración de equipos tecnológicos
            </p>
          </div>

          {/* Acciones rápidas en el header */}
          <QuickActions
            type="equipment"
            layout="horizontal"
            showTitle={false}
            alertCounts={{
              damaged: equipment.filter(eq => !eq.state?.is_operational).length,
              unassigned: equipment.filter(eq => !eq.assigned_user).length
            }}
            onCustomAction={(actionId) => {
              switch (actionId) {
                case 'add_equipment':
                  handleCreateEquipment();
                  break;
                case 'bulk_assign':
                  if (selectedIds.length > 0) {
                    setShowAssignmentModal(true);
                  }
                  break;
                case 'export_equipment':
                  handleExport();
                  break;
                default:
                  console.log('Acción:', actionId);
              }
            }}
          />
        </div>

        {/* Lista principal de equipos */}
        <EquipmentList
          equipment={equipment}
          totalCount={totalCount}
          isLoading={isLoading}
          error={error}
          
          // Configuración de vista
          defaultViewMode="table"
          showFilters={true}
          showBulkActions={true}
          
          // Paginación
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          
          // Filtros
          searchValue={searchValue}
          onSearchChange={handleSearch}
          filters={activeFilters}
          onFiltersChange={handleFiltersChange}
          
          // Datos para filtros
          categories={categoryOptions}
          locations={locationOptions}
          states={stateOptions}
          
          // Selección
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          
          // Acciones
          onEquipmentView={handleViewEquipment}
          onEquipmentEdit={handleEditEquipment}
          onEquipmentDelete={handleDeleteEquipment}
          onEquipmentAssign={handleAssignEquipment}
          onEquipmentUnassign={handleUnassignEquipment}
          onEquipmentQrCode={handleQrCodeEquipment}
          onBulkAction={handleBulkAction}
          onExport={handleExport}
          onRefresh={refresh}
        />

        {/* Modal de formulario */}
        {showCreateForm && (
          <EquipmentForm
            initialData={editingEquipment}
            isEditing={!!editingEquipment}
            isLoading={isLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            
            // Opciones para selects
            categories={categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))}
            states={equipmentStates.map(state => ({ value: state.id.toString(), label: state.name }))}
            locations={locations.map(loc => ({ value: loc.id.toString(), label: loc.name }))}
            suppliers={suppliers.map(sup => ({ value: sup.id.toString(), label: sup.name }))}
            
            // Configuración
            showLabDetails={true}
            autoGenerateCode={true}
          />
        )}

        {/* Modal de asignación */}
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={handleAssignmentClose}
          equipment={selectedEquipment}
          mode={selectedEquipment ? 'single' : 'bulk'}
          onSuccess={handleAssignmentSuccess}
          onError={(error) => console.error('Error en asignación:', error)}
        />
      </div>
    </DashboardLayout>
  );
};

export default EquipmentPage;