import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardSelect from '../../components/ui/DashboardSelect';
import Badge from '../../components/ui/Badge';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Icons
import { 
  ComputerDesktopIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';

// Hooks y servicios REALES
import { useEquipmentList, useInventoryCommon } from '../../../../services/inventory';
import { useDebounce } from '../../../../hooks/useDebounce';
import type { EquipmentWithDetails, EquipmentSearchParams } from '../../../../services/inventory/types';

const EquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ===== ESTADO LOCAL =====
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedEquipment, setSelectedEquipment] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // ===== FILTROS DESDE URL =====
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchTerm = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const stateFilter = searchParams.get('state') || '';
  const locationFilter = searchParams.get('location') || '';
  const assignmentFilter = searchParams.get('assignment') || ''; // 'assigned', 'unassigned', 'all'
  const itemsPerPage = parseInt(searchParams.get('limit') || '25');

  // ===== DEBOUNCED SEARCH =====
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ===== PARÁMETROS DE BÚSQUEDA OPTIMIZADOS =====
  const searchParams_optimized = useMemo((): EquipmentSearchParams => ({
    q: debouncedSearch || undefined,
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
    category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
    state_id: stateFilter ? parseInt(stateFilter) : undefined,
    location_id: locationFilter ? parseInt(locationFilter) : undefined,
    assigned_only: assignmentFilter === 'assigned' ? true : undefined,
    unassigned_only: assignmentFilter === 'unassigned' ? true : undefined,
    operational_only: false // Mostrar todos los estados
  }), [debouncedSearch, currentPage, itemsPerPage, categoryFilter, stateFilter, locationFilter, assignmentFilter]);

  // ===== HOOKS DE DATOS REALES =====
  const {
    equipment,
    totalCount,
    isLoading,
    error,
    refresh,
    searchEquipment,
    deleteEquipment,
    assignEquipment,
    unassignEquipment
  } = useEquipmentList({ autoFetch: false });

  const {
    categories,
    locations,
    equipmentStates,
    isLoading: isLoadingCommon
  } = useInventoryCommon();

  // ===== EFECTOS =====
  // Buscar cuando cambien los parámetros
  useEffect(() => {
    searchEquipment(searchParams_optimized);
  }, [searchParams_optimized, searchEquipment]);

  // ===== HANDLERS OPTIMIZADOS =====
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
      
      // Reset page cuando se cambian filtros
      if (Object.keys(updates).some(key => key !== 'page')) {
        newParams.set('page', '1');
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  const handleSearch = useCallback((value: string) => {
    updateSearchParams({ search: value });
  }, [updateSearchParams]);

  const handleFilterChange = useCallback((filterType: string, value: string) => {
    updateSearchParams({ [filterType]: value });
  }, [updateSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    updateSearchParams({ page: page.toString() });
  }, [updateSearchParams]);

  const handleCreate = useCallback(() => {
    navigate('/dashboard/inventory/equipment/new');
  }, [navigate]);

  const handleEdit = useCallback((equipment: EquipmentWithDetails) => {
    navigate(`/dashboard/inventory/equipment/${equipment.id}/edit`);
  }, [navigate]);

  const handleView = useCallback((equipment: EquipmentWithDetails) => {
    navigate(`/dashboard/inventory/equipment/${equipment.id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (equipment: EquipmentWithDetails) => {
    if (window.confirm(`¿Estás seguro de eliminar el equipo ${equipment.codigo_ug || equipment.id}?`)) {
      try {
        await deleteEquipment(equipment.id);
        // La tabla se actualizará automáticamente por el hook
      } catch (error) {
        // Error ya manejado por el hook
        console.error('Error eliminando equipo:', error);
      }
    }
  }, [deleteEquipment]);

  const handleAssign = useCallback((equipment: EquipmentWithDetails) => {
    // TODO: Abrir modal de asignación
    console.log('Asignar equipo:', equipment.id);
    // navigate(`/dashboard/inventory/equipment/${equipment.id}/assign`);
  }, []);

  const handleUnassign = useCallback(async (equipment: EquipmentWithDetails) => {
    if (window.confirm(`¿Desasignar equipo ${equipment.codigo_ug || equipment.id}?`)) {
      try {
        await unassignEquipment(equipment.id);
        // La tabla se actualizará automáticamente por el hook
      } catch (error) {
        // Error ya manejado por el hook
        console.error('Error desasignando equipo:', error);
      }
    }
  }, [unassignEquipment]);

  // ===== HANDLER PARA SELECCIÓN =====
  const handleSelectionChange = useCallback((selectedItems: Set<string | number>) => {
    // Convertir Set<string | number> a Set<number>
    const numberSet = new Set<number>();
    selectedItems.forEach(item => {
      if (typeof item === 'number') {
        numberSet.add(item);
      } else if (typeof item === 'string') {
        const num = parseInt(item, 10);
        if (!isNaN(num)) {
          numberSet.add(num);
        }
      }
    });
    setSelectedEquipment(numberSet);
  }, []);

  // ===== COLUMNAS DE TABLA OPTIMIZADAS =====
  const columns = useMemo(() => [
    {
      header: 'Código',
      accessor: (item: EquipmentWithDetails) => (
        <div className="font-medium">
          {item.codigo_ug || `#${item.id}`}
        </div>
      ),
      sortable: true,
      width: '120px'
    },
    {
      header: 'Equipo',
      accessor: (item: EquipmentWithDetails) => (
        <div>
          <div className="font-medium text-gray-900">
            {item.marca} {item.modelo}
          </div>
          {item.descripcion && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {item.descripcion}
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      header: 'Categoría',
      accessor: (item: EquipmentWithDetails) => (
        <Badge variant="secondary" size="sm">
          {item.category?.name || 'Sin categoría'}
        </Badge>
      ),
      width: '120px'
    },
    {
      header: 'Estado',
      accessor: (item: EquipmentWithDetails) => (
        <Badge 
          variant={item.state?.is_operational ? 'success' : 'danger'}
          size="sm"
        >
          {item.state?.name || 'Sin estado'}
        </Badge>
      ),
      width: '100px'
    },
    {
      header: 'Ubicación',
      accessor: (item: EquipmentWithDetails) => (
        <span className="text-sm text-gray-600">
          {item.location?.name || 'Sin ubicación'}
        </span>
      ),
      width: '140px'
    },
    {
      header: 'Asignado a',
      accessor: (item: EquipmentWithDetails) => (
        item.assigned_user ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {item.assigned_user.fullName}
            </div>
            <div className="text-gray-500">
              {item.assigned_user.email}
            </div>
          </div>
        ) : (
          <Badge variant="neutral" size="sm">
            Disponible
          </Badge>
        )
      ),
      width: '180px'
    }
  ], []);

  // ===== OPCIONES PARA SELECTS =====
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
  ], [categories]);

  const stateOptions = useMemo(() => [
    { value: '', label: 'Todos los estados' },
    ...equipmentStates.map(state => ({ value: state.id.toString(), label: state.name }))
  ], [equipmentStates]);

  const locationOptions = useMemo(() => [
    { value: '', label: 'Todas las ubicaciones' },
    ...locations.map(loc => ({ value: loc.id.toString(), label: loc.name }))
  ], [locations]);

  const assignmentOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    { value: 'assigned', label: 'Asignados' },
    { value: 'unassigned', label: 'Disponibles' }
  ], []);

  // ===== RENDERIZADO DE ACCIONES =====
  const renderActions = useCallback((equipment: EquipmentWithDetails) => (
    <div className="flex items-center gap-1">
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleView(equipment)}
        leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
        className="text-blue-600 hover:text-blue-900"
      >
        Ver
      </DashboardButton>
      
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleEdit(equipment)}
        leftIcon={<PencilIcon className="h-4 w-4" />}
        className="text-gray-600 hover:text-gray-900"
      >
        Editar
      </DashboardButton>

      {equipment.assigned_user ? (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleUnassign(equipment)}
          leftIcon={<UserMinusIcon className="h-4 w-4" />}
          className="text-orange-600 hover:text-orange-900"
        >
          Desasignar
        </DashboardButton>
      ) : (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleAssign(equipment)}
          leftIcon={<UserPlusIcon className="h-4 w-4" />}
          className="text-green-600 hover:text-green-900"
        >
          Asignar
        </DashboardButton>
      )}

      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleDelete(equipment)}
        leftIcon={<TrashIcon className="h-4 w-4" />}
        className="text-red-600 hover:text-red-900"
      >
        Eliminar
      </DashboardButton>
    </div>
  ), [handleView, handleEdit, handleAssign, handleUnassign, handleDelete]);

  // ===== PAGINACIÓN OPTIMIZADA =====
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const pagination = {
    currentPage,
    totalPages,
    onPageChange: handlePageChange,
    itemsPerPage,
    totalItems: totalCount
  };

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
        {/* ===== HEADER ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipos</h1>
            </div>
            <p className="text-gray-600">
              {isLoading ? 'Cargando...' : `${totalCount.toLocaleString()} equipos encontrados`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <DashboardButton
              onClick={refresh}
              variant="outline"
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              loading={isLoading}
            >
              Actualizar
            </DashboardButton>

            <DashboardButton
              onClick={handleCreate}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nuevo Equipo
            </DashboardButton>
          </div>
        </div>

        {/* ===== BÚSQUEDA Y FILTROS ===== */}
        <DashboardCard>
          <div className="space-y-4">
            {/* Búsqueda principal */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <DashboardTextInput
                  id="search"
                  name="search"
                  placeholder="Buscar por código, marca, modelo, serie..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  className="mb-0"
                />
              </div>
              
              <div className="flex gap-2">
                <DashboardButton
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<FunnelIcon className="h-4 w-4" />}
                  className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
                >
                  Filtros
                </DashboardButton>

                <div className="flex border border-gray-300 rounded-lg">
                  <DashboardButton
                    variant={viewMode === 'table' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-r-none border-r-0"
                  >
                    <TableCellsIcon className="h-4 w-4" />
                  </DashboardButton>
                  <DashboardButton
                    variant={viewMode === 'cards' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="rounded-l-none"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </DashboardButton>
                </div>
              </div>
            </div>

            {/* Filtros expandidos */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <DashboardSelect
                  id="category-filter"
                  name="category"
                  label="Categoría"
                  value={categoryFilter}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  options={categoryOptions}
                  className="mb-0"
                  loading={isLoadingCommon}
                />

                <DashboardSelect
                  id="state-filter"
                  name="state"
                  label="Estado"
                  value={stateFilter}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  options={stateOptions}
                  className="mb-0"
                  loading={isLoadingCommon}
                />

                <DashboardSelect
                  id="location-filter"
                  name="location"
                  label="Ubicación"
                  value={locationFilter}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  options={locationOptions}
                  className="mb-0"
                  loading={isLoadingCommon}
                />

                <DashboardSelect
                  id="assignment-filter"
                  name="assignment"
                  label="Asignación"
                  value={assignmentFilter}
                  onChange={(e) => handleFilterChange('assignment', e.target.value)}
                  options={assignmentOptions}
                  className="mb-0"
                />
              </div>
            )}
          </div>
        </DashboardCard>

        {/* ===== TABLA DE EQUIPOS ===== */}
        <DashboardDataTable
          columns={columns}
          data={equipment}
          keyExtractor={(item) => item.id.toString()}
          isLoading={isLoading}
          pagination={pagination}
          renderActions={renderActions}
          actionColumn={true}
          selectable={true}
          selectedItems={selectedEquipment}
          onSelectionChange={handleSelectionChange}
          emptyMessage="No se encontraron equipos que coincidan con los criterios de búsqueda"
          hover={true}
          striped={true}
        />

        {/* Info de selección */}
        {selectedEquipment.size > 0 && (
          <DashboardCard>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedEquipment.size} equipo(s) seleccionado(s)
              </span>
              
              <div className="flex gap-2">
                <DashboardButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEquipment(new Set())}
                >
                  Limpiar selección
                </DashboardButton>
                
                <DashboardButton
                  variant="outline"
                  size="sm"
                  disabled={selectedEquipment.size === 0}
                  onClick={() => {
                    // TODO: Implementar acciones en lote
                    console.log('Acciones en lote para:', Array.from(selectedEquipment));
                  }}
                >
                  Acciones en lote
                </DashboardButton>
              </div>
            </div>
          </DashboardCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EquipmentPage;