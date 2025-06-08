import React, { useState, useCallback, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

// Importar tus componentes UI
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardSelect from '../../components/ui/DashboardSelect';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import Badge from '../../components/ui/Badge';
import DashboardTabs, { useDashboardTabs } from '../../components/ui/DashboardTabs';

// Importar hooks y servicios
import { useSuppliesList, useInventoryCommon } from '../../../../services/inventory/hooks';
import { useSearchDebounce } from '../../../../hooks/useDebounce';
import type { SupplyWithDetails, StockStatus } from '../../../../services/inventory/types';

interface SuppliesListProps {
  onCreateSupply?: () => void;
  onEditSupply?: (supply: SupplyWithDetails) => void;
  onViewSupply?: (supply: SupplyWithDetails) => void;
  onDeleteSupply?: (supply: SupplyWithDetails) => void;
  onCreateMovement?: (supply: SupplyWithDetails) => void;
  className?: string;
}

const SuppliesList: React.FC<SuppliesListProps> = ({
  onCreateSupply,
  onEditSupply,
  onViewSupply,
  onDeleteSupply,
  onCreateMovement,
  className = ''
}) => {
  // Estados locales
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Hook de búsqueda con debounce optimizado
  const { 
    value: searchTerm, 
    setValue: setSearchTerm, 
    debouncedValue: debouncedSearchTerm,
    isPending: isSearchPending,
    clear: clearSearch
  } = useSearchDebounce('', 500); // 500ms de delay para búsquedas

  // Hooks
  const { activeTabId, createTab } = useDashboardTabs('all');
  
  const {
    supplies,
    lowStockSupplies,
    totalCount,
    isLoading,
    error,
    refresh,
    searchSupplies
  } = useSuppliesList({ 
    skip: (currentPage - 1) * pageSize, 
    limit: pageSize,
    autoFetch: true
  });

  const {
    categories,
    locations,
    isLoading: isLoadingCommon
  } = useInventoryCommon();

  // Efecto para búsqueda automática con debounce
  useEffect(() => {
    const performSearch = async () => {
      // Si hay término de búsqueda (mínimo 2 caracteres) o filtros activos
      if (debouncedSearchTerm.trim().length >= 2 || selectedCategory || selectedLocation) {
        try {
          await searchSupplies({
            q: debouncedSearchTerm.trim() || undefined,
            category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
            location_id: selectedLocation ? parseInt(selectedLocation) : undefined,
            low_stock_only: activeTabId === 'low_stock',
            out_of_stock_only: activeTabId === 'out_of_stock',
            limit: pageSize,
            cursor: 0
          });
          // Resetear página cuando se hace búsqueda
          setCurrentPage(1);
        } catch (error) {
          console.error('Error en búsqueda automática:', error);
        }
      } else if (debouncedSearchTerm.trim().length === 0 && !selectedCategory && !selectedLocation) {
        // Si no hay filtros ni búsqueda, mostrar todos
        refresh();
      }
    };

    performSearch();
  }, [debouncedSearchTerm, selectedCategory, selectedLocation, activeTabId, pageSize, searchSupplies, refresh]);

  // Filtrar datos según la pestaña activa
  const filteredSupplies = React.useMemo(() => {
    switch (activeTabId) {
      case 'low_stock':
        return lowStockSupplies;
      case 'out_of_stock':
        return supplies.filter(supply => supply.stock_actual <= 0);
      default:
        return supplies;
    }
  }, [activeTabId, supplies, lowStockSupplies]);

  // Función para obtener el estado de stock
  const getStockStatusInfo = (current: number, minimum: number): {
    status: StockStatus;
    color: string;
    label: string;
  } => {
    if (current <= 0) {
      return { status: 'out', color: 'danger', label: 'Sin stock' };
    }
    if (current <= minimum * 0.5) {
      return { status: 'critical', color: 'danger', label: 'Crítico' };
    }
    if (current <= minimum) {
      return { status: 'low', color: 'warning', label: 'Stock bajo' };
    }
    return { status: 'ok', color: 'success', label: 'Normal' };
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      header: 'Código',
      accessor: ((supply: SupplyWithDetails) => supply.codigo || '-') as any,
      width: '120px',
      sortable: true
    },
    {
      header: 'Producto',
      accessor: ((supply: SupplyWithDetails) => (
        <div>
          <div className="font-medium text-gray-900">{supply.nombre_producto}</div>
          {supply.presentacion && (
            <div className="text-sm text-gray-500">{supply.presentacion}</div>
          )}
        </div>
      )) as any,
      sortable: true
    },
    {
      header: 'Categoría',
      accessor: ((supply: SupplyWithDetails) => supply.category?.name || '-') as any,
      width: '150px',
      sortable: true
    },
    {
      header: 'Stock',
      accessor: ((supply: SupplyWithDetails) => {
        const stockInfo = getStockStatusInfo(supply.stock_actual, supply.stock_minimo);
        return (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-medium">{supply.stock_actual}</div>
              <div className="text-xs text-gray-500">Mín: {supply.stock_minimo}</div>
            </div>
            <Badge variant={stockInfo.color as any} size="sm">
              {stockInfo.label}
            </Badge>
          </div>
        );
      }) as any,
      width: '140px',
      align: 'center' as const
    },
    {
      header: 'Ubicación',
      accessor: ((supply: SupplyWithDetails) => supply.location?.name || '-') as any,
      width: '120px'
    },
    {
      header: 'Estado',
      accessor: ((supply: SupplyWithDetails) => (
        <Badge variant={supply.is_active ? 'success' : 'secondary'} size="sm">
          {supply.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )) as any,
      width: '100px',
      align: 'center' as const
    }
  ];

  // Función de búsqueda manual (para el botón)
  const handleManualSearch = useCallback(async () => {
    try {
      await searchSupplies({
        q: searchTerm.trim() || undefined,
        category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
        location_id: selectedLocation ? parseInt(selectedLocation) : undefined,
        low_stock_only: activeTabId === 'low_stock',
        out_of_stock_only: activeTabId === 'out_of_stock',
        limit: pageSize,
        cursor: 0
      });
      setCurrentPage(1);
    } catch (error) {
      console.error('Error en búsqueda manual:', error);
    }
  }, [searchTerm, selectedCategory, selectedLocation, activeTabId, pageSize, searchSupplies]);

  // Función para crear movimiento rápido
  const handleQuickMovement = async (supply: SupplyWithDetails) => {
    if (onCreateMovement) {
      onCreateMovement(supply);
    }
  };

  // Manejar refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  }, [refresh]);

  // Función para limpiar todos los filtros
  const handleClearAllFilters = useCallback(() => {
    clearSearch();
    setSelectedCategory('');
    setSelectedLocation('');
    setCurrentPage(1);
    refresh();
  }, [clearSearch, refresh]);

  // Renderizar acciones personalizadas
  const renderActions = (supply: SupplyWithDetails) => (
    <div className="flex items-center gap-1">
      {onViewSupply && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onViewSupply(supply)}
          className="text-blue-600 hover:text-blue-900"
          leftIcon={<EyeIcon className="h-4 w-4" />}
        >
          Ver
        </DashboardButton>
      )}
      
      {onCreateMovement && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleQuickMovement(supply)}
          className="text-green-600 hover:text-green-900"
          leftIcon={<PlusCircleIcon className="h-4 w-4" />}
        >
          Movimiento
        </DashboardButton>
      )}
      
      {onEditSupply && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onEditSupply(supply)}
          className="text-blue-600 hover:text-blue-900"
          leftIcon={<PencilIcon className="h-4 w-4" />}
        >
          Editar
        </DashboardButton>
      )}
      
      {onDeleteSupply && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onDeleteSupply(supply)}
          className="text-red-600 hover:text-red-900"
          leftIcon={<TrashIcon className="h-4 w-4" />}
        >
          Eliminar
        </DashboardButton>
      )}
    </div>
  );

  // Configurar pestañas
  const tabs = [
    createTab('all', 'Todos', { 
      count: supplies.length,
      icon: <FunnelIcon className="h-4 w-4" />
    }),
    createTab('low_stock', 'Stock Bajo', { 
      count: lowStockSupplies.length,
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      badge: lowStockSupplies.length > 0 ? (
        <Badge variant="warning" size="sm">!</Badge>
      ) : undefined
    }),
    createTab('out_of_stock', 'Sin Stock', { 
      count: supplies.filter(s => s.stock_actual <= 0).length,
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      badge: supplies.filter(s => s.stock_actual <= 0).length > 0 ? (
        <Badge variant="danger" size="sm">!</Badge>
      ) : undefined
    })
  ];

  // Opciones para selects
  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories
      .filter(cat => !cat.is_equipment && cat.is_active)
      .map(cat => ({ value: cat.id.toString(), label: cat.name }))
  ];

  const locationOptions = [
    { value: '', label: 'Todas las ubicaciones' },
    ...locations
      .filter(loc => loc.is_active)
      .map(loc => ({ value: loc.id.toString(), label: loc.name }))
  ];

  // Determinar si hay filtros activos
  const hasActiveFilters = searchTerm.trim() || selectedCategory || selectedLocation;

  return (
    <div className={className}>
      <DashboardCard
        title="Gestión de Suministros"
        subtitle="Control de inventario y stock de productos"
        headerAction={
          <div className="flex items-center gap-3">
            <DashboardButton
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              disabled={isLoading}
              loading={isLoading}
            >
              Actualizar
            </DashboardButton>
            
            {onCreateSupply && (
              <DashboardButton
                variant="primary"
                size="sm"
                onClick={onCreateSupply}
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                Nuevo Suministro
              </DashboardButton>
            )}
          </div>
        }
        loading={isLoading && !supplies.length}
        error={error}
        onRetry={handleRefresh}
      >
        {/* Pestañas */}
        <div className="mb-6">
          <DashboardTabs
            tabs={tabs}
            variant="underline"
            isLoading={isLoadingCommon}
          />
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <DashboardTextInput
              id="search"
              name="search"
              placeholder="Buscar por código, nombre o presentación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              className="mb-0"
              helperText={
                searchTerm.trim().length > 0 && searchTerm.trim().length < 2
                  ? "Mínimo 2 caracteres para buscar"
                  : "Búsqueda automática mientras escribes"
              }
              loading={isSearchPending}
              clearable
              onClear={clearSearch}
            />
          </div>
          
          <DashboardSelect
            id="category"
            name="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categoryOptions}
            placeholder="Filtrar por categoría"
            className="mb-0"
            loading={isLoadingCommon}
          />
          
          <DashboardSelect
            id="location"
            name="location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            options={locationOptions}
            placeholder="Filtrar por ubicación"
            className="mb-0"
            loading={isLoadingCommon}
          />
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="mb-6 flex items-center gap-3">
          <DashboardButton
            variant="outline"
            onClick={handleManualSearch}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            disabled={isLoading}
            loading={isLoading}
          >
            Buscar Ahora
          </DashboardButton>

          {/* Mostrar filtros activos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              {searchTerm.trim() && (
                <Badge variant="secondary" size="sm">
                  Búsqueda: "{searchTerm.trim()}"
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" size="sm">
                  {categories.find(c => c.id.toString() === selectedCategory)?.name}
                </Badge>
              )}
              {selectedLocation && (
                <Badge variant="secondary" size="sm">
                  {locations.find(l => l.id.toString() === selectedLocation)?.name}
                </Badge>
              )}
              <DashboardButton
                variant="text"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Limpiar Todo
              </DashboardButton>
            </div>
          )}

          {/* Indicador de búsqueda pendiente */}
          {isSearchPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Buscando...
            </div>
          )}
        </div>

        {/* Información de resultados */}
        {!isLoading && (
          <div className="mb-4 text-sm text-gray-600">
            {activeTabId === 'low_stock' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                <span>
                  Mostrando {filteredSupplies.length} suministros con stock bajo o crítico
                </span>
              </div>
            )}
            {activeTabId === 'out_of_stock' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <span>
                  Mostrando {filteredSupplies.length} suministros sin stock
                </span>
              </div>
            )}
            {activeTabId === 'all' && (
              <span>
                Mostrando {filteredSupplies.length} de {totalCount} suministros
                {hasActiveFilters && " (filtrados)"}
              </span>
            )}
          </div>
        )}

        {/* Tabla de datos */}
        <DashboardDataTable
          columns={columns}
          data={filteredSupplies}
          keyExtractor={(supply) => supply.id.toString()}
          isLoading={isLoading}
          emptyMessage={
            hasActiveFilters ? 
              `No se encontraron suministros que coincidan con los filtros aplicados` :
              activeTabId === 'low_stock' ? 
                "No hay suministros con stock bajo" : 
                activeTabId === 'out_of_stock' ?
                  "No hay suministros sin stock" :
                  "No se encontraron suministros"
          }
          actionColumn={Boolean(onViewSupply || onEditSupply || onDeleteSupply || onCreateMovement)}
          renderActions={renderActions}
          pagination={{
            currentPage,
            totalPages: Math.ceil(totalCount / pageSize),
            onPageChange: setCurrentPage,
            itemsPerPage: pageSize,
            totalItems: totalCount
          }}
          hover
          striped
        />

        {/* Información adicional en modo de stock bajo */}
        {activeTabId === 'low_stock' && lowStockSupplies.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Acciones Recomendadas</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Revisar los niveles mínimos de stock configurados</li>
              <li>• Crear movimientos de entrada para reabastecer</li>
              <li>• Contactar proveedores para nuevos pedidos</li>
              <li>• Considerar ajustar las alertas de stock mínimo</li>
            </ul>
          </div>
        )}
      </DashboardCard>
    </div>
  );
};

export default SuppliesList;