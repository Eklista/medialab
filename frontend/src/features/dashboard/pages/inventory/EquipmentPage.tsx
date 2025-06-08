// frontend/src/features/dashboard/pages/inventory/EquipmentPage.tsx - OPTIMIZADO

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Importar los componentes de inventario
import EquipmentList from '../../inventory/equipment/EquipmentList';
import EquipmentForm from '../../inventory/equipment/EquipmentForm';
import AssignmentModal from '../../inventory/equipment/AssignmentModal';
import QuickActions from '../../inventory/common/QuickActions';

// Icons
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

// Hooks
import { useEquipmentList, useInventoryCommon } from '../../../../services/inventory';
import { useDebounce } from '../../../../hooks/useDebounce';
import type { EquipmentWithDetails } from '../../../../services/inventory/types';

const EquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ===== ESTADOS LOCALES =====
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithDetails | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentWithDetails | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // ===== PARÁMETROS DE URL =====
  const urlParams = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    state: searchParams.get('state') || '',
    location: searchParams.get('location') || '',
    assignment: searchParams.get('assignment') || '',
    limit: parseInt(searchParams.get('limit') || '25')
  }), [searchParams]);

  // ===== FILTROS CON DEBOUNCE =====
  const [searchValue, setSearchValue] = useState(urlParams.search);
  const debouncedSearch = useDebounce(searchValue, 300);
  
  const [activeFilters, setActiveFilters] = useState({
    category_id: urlParams.category,
    state_id: urlParams.state,
    location_id: urlParams.location,
    assignment_status: urlParams.assignment
  });

  // ===== HOOKS DE DATOS =====
  const {
    equipment,
    totalCount,
    isLoading,
    error,
    refresh,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    unassignEquipment,
    exportEquipment
  } = useEquipmentList({
    autoFetch: true,
    searchParams: {
      q: debouncedSearch,
      skip: (urlParams.page - 1) * urlParams.limit,
      limit: urlParams.limit,
      category_id: activeFilters.category_id ? parseInt(activeFilters.category_id) : undefined,
      state_id: activeFilters.state_id ? parseInt(activeFilters.state_id) : undefined,
      location_id: activeFilters.location_id ? parseInt(activeFilters.location_id) : undefined,
      assigned_only: activeFilters.assignment_status === 'assigned' ? true : undefined,
      unassigned_only: activeFilters.assignment_status === 'unassigned' ? true : undefined
    }
  });

  const { categories, locations, equipmentStates, suppliers } = useInventoryCommon();

  // ===== HANDLERS DE URL =====
  const updateURL = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      
      // Reset página cuando cambian filtros (excepto cambio directo de página)
      if (Object.keys(updates).some(key => key !== 'page')) {
        newParams.set('page', '1');
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  // ===== HANDLERS DE FILTROS =====
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    updateURL({ search: value });
  }, [updateURL]);

  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    // Asegurar que tenemos todos los campos requeridos
    const newFilters = {
      category_id: filters.category_id || '',
      state_id: filters.state_id || '',
      location_id: filters.location_id || '',
      assignment_status: filters.assignment_status || ''
    };
    setActiveFilters(newFilters);
    updateURL(filters);
  }, [updateURL]);

  const handlePageChange = useCallback((page: number) => {
    updateURL({ page: page.toString() });
  }, [updateURL]);

  // ===== HANDLERS DE EQUIPOS =====
  const handleCreateEquipment = useCallback(() => {
    setEditingEquipment(null);
    setShowCreateForm(true);
  }, []);

  const handleEditEquipment = useCallback((equipment: any) => {
    setEditingEquipment(equipment);
    setShowCreateForm(true);
  }, []);

  const handleViewEquipment = useCallback((equipment: any) => {
    navigate(`/dashboard/inventory/equipment/${equipment.id}`);
  }, [navigate]);

  const handleDeleteEquipment = useCallback(async (equipment: any) => {
    const equipmentName = equipment.codigo_ug || `Equipo #${equipment.id}`;
    if (window.confirm(`¿Estás seguro de eliminar ${equipmentName}?`)) {
      try {
        await deleteEquipment(equipment.id);
      } catch (error) {
        console.error('Error eliminando equipo:', error);
      }
    }
  }, [deleteEquipment]);

  const handleAssignEquipment = useCallback((equipment: any) => {
    setSelectedEquipment(equipment);
    setShowAssignmentModal(true);
  }, []);

  const handleUnassignEquipment = useCallback(async (equipment: any) => {
    const equipmentName = equipment.codigo_ug || `Equipo #${equipment.id}`;
    if (window.confirm(`¿Desasignar ${equipmentName}?`)) {
      try {
        await unassignEquipment(equipment.id);
      } catch (error) {
        console.error('Error desasignando equipo:', error);
      }
    }
  }, [unassignEquipment]);

  const handleQrCodeEquipment = useCallback((equipment: any) => {
    console.log('Generar QR para equipo:', equipment.id);
    // TODO: Implementar generación de QR
  }, []);

  // ===== HANDLERS DE FORMULARIOS =====
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
      throw error;
    }
  }, [editingEquipment, updateEquipment, createEquipment]);

  const handleFormCancel = useCallback(() => {
    setShowCreateForm(false);
    setEditingEquipment(null);
  }, []);

  // ===== HANDLERS DE ASIGNACIÓN =====
  const handleAssignmentSuccess = useCallback(() => {
    setShowAssignmentModal(false);
    setSelectedEquipment(null);
    refresh();
  }, [refresh]);

  const handleAssignmentClose = useCallback(() => {
    setShowAssignmentModal(false);
    setSelectedEquipment(null);
  }, []);

  // ===== HANDLERS DE ACCIONES MASIVAS =====
  const handleBulkAction = useCallback(async (action: string, equipmentIds: number[]) => {
    console.log(`Acción masiva: ${action} para equipos:`, equipmentIds);
    
    switch (action) {
      case 'assign':
        setSelectedEquipment(null);
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

  // ===== HANDLERS DE ACCIONES RÁPIDAS =====
  const handleQuickAction = useCallback((actionId: string) => {
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
  }, [handleCreateEquipment, selectedIds.length, handleExport]);

  // ===== DATOS PARA COMPONENTES =====
  // Convertir a formato esperado por EquipmentList (sin transformaciones complejas)
  const filterOptions = useMemo(() => ({
    categories: categories.map(cat => ({
      value: cat.id.toString(),
      label: cat.name,
      count: 0 // El backend podría proporcionar esto
    })),
    locations: locations.map(loc => ({
      value: loc.id.toString(),
      label: loc.name,
      count: 0
    })),
    states: equipmentStates.map(state => ({
      value: state.id.toString(),
      label: state.name,
      count: 0
    }))
  }), [categories, locations, equipmentStates]);

  const formOptions = useMemo(() => ({
    categories: categories.map(cat => ({ value: cat.id.toString(), label: cat.name })),
    states: equipmentStates.map(state => ({ value: state.id.toString(), label: state.name })),
    locations: locations.map(loc => ({ value: loc.id.toString(), label: loc.name })),
    suppliers: suppliers.map(sup => ({ value: sup.id.toString(), label: sup.name }))
  }), [categories, equipmentStates, locations, suppliers]);

  // ===== MANEJO DE ERRORES =====
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
            onCustomAction={handleQuickAction}
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
          currentPage={urlParams.page}
          itemsPerPage={urlParams.limit}
          onPageChange={handlePageChange}
          
          // Filtros
          searchValue={searchValue}
          onSearchChange={handleSearch}
          filters={activeFilters}
          onFiltersChange={handleFiltersChange}
          
          // Datos para filtros
          categories={filterOptions.categories}
          locations={filterOptions.locations}
          states={filterOptions.states}
          
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
            initialData={editingEquipment || undefined}
            isEditing={!!editingEquipment}
            isLoading={isLoading}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            
            // Opciones para selects
            categories={formOptions.categories}
            states={formOptions.states}
            locations={formOptions.locations}
            suppliers={formOptions.suppliers}
            
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