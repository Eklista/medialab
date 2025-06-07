// frontend/src/features/dashboard/inventory/equipment/EquipmentList.tsx

import React, { useState, useCallback } from 'react';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardCard from '../../components/ui/DashboardCard';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import EquipmentCard from './EquipmentCard';
import SearchFilters from '../common/SearchFilters';
import { 
  TableCellsIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  QrCodeIcon,
  UserPlusIcon,
  UserMinusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface Equipment {
  id: number;
  codigo_ug?: string;
  numero_serie?: string;
  service_tag?: string;
  marca?: string;
  modelo?: string;
  descripcion?: string;
  
  // Relaciones expandidas
  category?: {
    id: number;
    name: string;
    is_equipment: boolean;
  };
  state?: {
    id: number;
    name: string;
    color: string;
    is_operational: boolean;
  };
  location?: {
    id: number;
    name: string;
    is_external: boolean;
  };
  supplier?: {
    id: number;
    name: string;
  };
  assigned_user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  
  // Fechas
  fecha_entrega?: string;
  created_at: string;
  updated_at: string;
  
  // Metadata
  numero_hoja_envio?: string;
  observaciones?: string;
}

interface EquipmentListProps {
  equipment: Equipment[];
  totalCount: number;
  isLoading?: boolean;
  error?: string | null;
  
  // Configuración de vista
  defaultViewMode?: 'table' | 'cards';
  showFilters?: boolean;
  showBulkActions?: boolean;
  
  // Paginación
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  
  // Filtros
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  
  // Datos para filtros
  categories?: Array<{ value: string; label: string; count?: number }>;
  locations?: Array<{ value: string; label: string; count?: number }>;
  states?: Array<{ value: string; label: string; count?: number }>;
  suppliers?: Array<{ value: string; label: string; count?: number }>;
  
  // Selección
  selectedIds?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  
  // Acciones
  onEquipmentView?: (equipment: Equipment) => void;
  onEquipmentEdit?: (equipment: Equipment) => void;
  onEquipmentDelete?: (equipment: Equipment) => void;
  onEquipmentAssign?: (equipment: Equipment) => void;
  onEquipmentUnassign?: (equipment: Equipment) => void;
  onEquipmentQrCode?: (equipment: Equipment) => void;
  onBulkAction?: (action: string, equipmentIds: number[]) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  
  className?: string;
}

// ===== HELPERS =====
const getEquipmentCode = (equipment: Equipment): string => {
  return equipment.codigo_ug || `#${equipment.id}`;
};

const getEquipmentTitle = (equipment: Equipment): string => {
  const brand = equipment.marca || '';
  const model = equipment.modelo || '';
  return `${brand} ${model}`.trim() || 'Equipo sin nombre';
};

// ===== COMPONENTE PRINCIPAL =====
const EquipmentList: React.FC<EquipmentListProps> = ({
  equipment,
  totalCount,
  isLoading = false,
  error = null,
  defaultViewMode = 'table',
  showFilters = true,
  showBulkActions = true,
  currentPage = 1,
  itemsPerPage = 25,
  onPageChange,
  searchValue = '',
  onSearchChange,
  filters = {},
  onFiltersChange,
  categories = [],
  locations = [],
  states = [],
  suppliers = [],
  selectedIds = [],
  onSelectionChange,
  onEquipmentView,
  onEquipmentEdit,
  onEquipmentDelete,
  onEquipmentAssign,
  onEquipmentUnassign,
  onEquipmentQrCode,
  onBulkAction,
  onExport,
  onRefresh,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(defaultViewMode);
  // const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Configuración de filtros
  const filterConfig = [
    {
      key: 'category_id',
      label: 'Categoría',
      type: 'select' as const,
      placeholder: 'Todas las categorías'
    },
    {
      key: 'state_id',
      label: 'Estado',
      type: 'select' as const,
      placeholder: 'Todos los estados'
    },
    {
      key: 'location_id',
      label: 'Ubicación',
      type: 'select' as const,
      placeholder: 'Todas las ubicaciones'
    },
    {
      key: 'assignment_status',
      label: 'Asignación',
      type: 'select' as const,
      placeholder: 'Todos',
      options: [
        { value: '', label: 'Todos' },
        { value: 'assigned', label: 'Asignados' },
        { value: 'unassigned', label: 'Disponibles' }
      ]
    }
  ];

  // Configuración de columnas para la tabla
  const columns = [
    {
      header: 'Código',
      accessor: (item: Equipment) => (
        <div className="font-medium text-gray-900">
          {getEquipmentCode(item)}
        </div>
      ),
      sortable: true,
      width: '120px'
    },
    {
      header: 'Equipo',
      accessor: (item: Equipment) => (
        <div>
          <div className="font-medium text-gray-900">
            {getEquipmentTitle(item)}
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
      accessor: (item: Equipment) => (
        <Badge variant="secondary" size="sm">
          {item.category?.name || 'Sin categoría'}
        </Badge>
      ),
      width: '120px'
    },
    {
      header: 'Estado',
      accessor: (item: Equipment) => (
        <StatusBadge 
          status={item.state?.is_operational ? 'active' : 'inactive'}
          size="sm"
        />
      ),
      width: '100px'
    },
    {
      header: 'Ubicación',
      accessor: (item: Equipment) => (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">
            {item.location?.name || 'Sin ubicación'}
          </span>
          {item.location?.is_external && (
            <Badge variant="info" size="xs">Ext</Badge>
          )}
        </div>
      ),
      width: '140px'
    },
    {
      header: 'Asignado a',
      accessor: (item: Equipment) => (
        item.assigned_user ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {item.assigned_user.fullName}
            </div>
            <div className="text-gray-500 truncate max-w-xs">
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
    },
    {
      header: 'Número Serie',
      accessor: (item: Equipment) => (
        <span className="text-sm text-gray-600 font-mono">
          {item.numero_serie || '-'}
        </span>
      ),
      width: '140px'
    }
  ];

  // Configuración de paginación
  const pagination = onPageChange ? {
    currentPage,
    totalPages: Math.ceil(totalCount / itemsPerPage),
    onPageChange,
    itemsPerPage,
    totalItems: totalCount
  } : undefined;

  // Manejadores
  const handleSelectionChange = useCallback((selectedItems: Set<string | number>) => {
    const ids = Array.from(selectedItems).map(id => 
      typeof id === 'string' ? parseInt(id) : id
    ).filter(id => !isNaN(id));
    onSelectionChange?.(ids);
  }, [onSelectionChange]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedIds.length === 0) return;
    onBulkAction?.(action, selectedIds);
  }, [selectedIds, onBulkAction]);

  const renderActions = useCallback((equipment: Equipment) => (
    <div className="flex items-center gap-1">
      {onEquipmentView && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onEquipmentView(equipment)}
          leftIcon={<EyeIcon className="h-3 w-3" />}
          className="text-blue-600 hover:text-blue-900"
        >
          Ver
        </DashboardButton>
      )}
      
      {onEquipmentEdit && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onEquipmentEdit(equipment)}
          leftIcon={<PencilIcon className="h-3 w-3" />}
          className="text-gray-600 hover:text-gray-900"
        >
          Editar
        </DashboardButton>
      )}

      {equipment.assigned_user ? (
        onEquipmentUnassign && (
          <DashboardButton
            variant="text"
            size="sm"
            onClick={() => onEquipmentUnassign(equipment)}
            leftIcon={<UserMinusIcon className="h-3 w-3" />}
            className="text-orange-600 hover:text-orange-900"
          >
            Desasignar
          </DashboardButton>
        )
      ) : (
        onEquipmentAssign && (
          <DashboardButton
            variant="text"
            size="sm"
            onClick={() => onEquipmentAssign(equipment)}
            leftIcon={<UserPlusIcon className="h-3 w-3" />}
            className="text-green-600 hover:text-green-900"
          >
            Asignar
          </DashboardButton>
        )
      )}

      {onEquipmentQrCode && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onEquipmentQrCode(equipment)}
          leftIcon={<QrCodeIcon className="h-3 w-3" />}
          className="text-purple-600 hover:text-purple-900"
        >
          QR
        </DashboardButton>
      )}

      {onEquipmentDelete && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onEquipmentDelete(equipment)}
          leftIcon={<TrashIcon className="h-3 w-3" />}
          className="text-red-600 hover:text-red-900"
        >
          Eliminar
        </DashboardButton>
      )}
    </div>
  ), [onEquipmentView, onEquipmentEdit, onEquipmentAssign, onEquipmentUnassign, onEquipmentQrCode, onEquipmentDelete]);

  // Estado de error
  if (error) {
    return (
      <DashboardCard className={className}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar equipos</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          {onRefresh && (
            <DashboardButton
              variant="outline"
              onClick={onRefresh}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Reintentar
            </DashboardButton>
          )}
        </div>
      </DashboardCard>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filtros */}
      {showFilters && (
        <SearchFilters
          searchValue={searchValue}
          onSearchChange={onSearchChange || (() => {})}
          searchPlaceholder="Buscar por código, marca, modelo, serie..."
          filters={filterConfig}
          activeFilters={filters}
          onFiltersChange={onFiltersChange || (() => {})}
          categories={categories}
          locations={locations}
          states={states}
          suppliers={suppliers}
          isLoading={isLoading}
          collapsible={true}
          defaultExpanded={false}
        />
      )}

      {/* Barra de acciones */}
      <DashboardCard>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isLoading ? 'Cargando...' : `${totalCount.toLocaleString()} equipos`}
            </h3>
            
            {selectedIds.length > 0 && (
              <Badge variant="info" size="sm">
                {selectedIds.length} seleccionados
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Acciones en lote */}
            {showBulkActions && selectedIds.length > 0 && (
              <div className="flex gap-2">
                <DashboardButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                  leftIcon={<UserPlusIcon className="h-4 w-4" />}
                >
                  Asignar en lote
                </DashboardButton>
                
                <DashboardButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                >
                  Exportar selección
                </DashboardButton>
              </div>
            )}
            
            {/* Acciones generales */}
            {onExport && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={onExport}
                leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
              >
                Exportar
              </DashboardButton>
            )}
            
            {onRefresh && (
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={onRefresh}
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                loading={isLoading}
              >
                Actualizar
              </DashboardButton>
            )}
            
            {/* Toggle de vista */}
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
      </DashboardCard>

      {/* Contenido principal */}
      {viewMode === 'table' ? (
        <DashboardDataTable
          columns={columns}
          data={equipment}
          keyExtractor={(item) => item.id.toString()}
          isLoading={isLoading}
          pagination={pagination}
          renderActions={renderActions}
          actionColumn={true}
          selectable={true}
          selectedItems={new Set(selectedIds.map(id => id.toString()))}
          onSelectionChange={handleSelectionChange}
          emptyMessage="No se encontraron equipos que coincidan con los criterios de búsqueda"
          hover={true}
          striped={true}
          sortBy="codigo_ug"
          sortDirection="asc"
        />
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <DashboardCard>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              ))}
            </div>
          ) : equipment.length === 0 ? (
            <DashboardCard>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay equipos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron equipos que coincidan con los criterios de búsqueda.
                </p>
              </div>
            </DashboardCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((item) => (
                  <EquipmentCard
                    key={item.id}
                    equipment={item}
                    variant="default"
                    showActions={true}
                    selectable={true}
                    isSelected={selectedIds.includes(item.id)}
                    onSelect={(equipment) => {
                      const newSelection = selectedIds.includes(equipment.id)
                        ? selectedIds.filter(id => id !== equipment.id)
                        : [...selectedIds, equipment.id];
                      onSelectionChange?.(newSelection);
                    }}
                    onView={onEquipmentView}
                    onEdit={onEquipmentEdit}
                    onDelete={onEquipmentDelete}
                    onAssign={onEquipmentAssign}
                    onUnassign={onEquipmentUnassign}
                    onQrCode={onEquipmentQrCode}
                  />
                ))}
              </div>
              
              {/* Paginación para vista de tarjetas */}
              {pagination && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <DashboardButton
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                      disabled={pagination.currentPage <= 1}
                    >
                      Anterior
                    </DashboardButton>
                    
                    <span className="text-sm text-gray-600 px-4">
                      Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                    
                    <DashboardButton
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                      disabled={pagination.currentPage >= pagination.totalPages}
                    >
                      Siguiente
                    </DashboardButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EquipmentList;