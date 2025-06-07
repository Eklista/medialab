// frontend/src/features/dashboard/inventory/dashboard/ActivityFeed.tsx

import React, { useState } from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardSelect from '../../components/ui/DashboardSelect';
import Badge from '../../components/ui/Badge';
import { useActivityFeed } from '../../../../services/inventory/hooks/useActivityFeed';
import { ActivityItem } from '../../../../services/inventory/activitiesService';
import { 
  ComputerDesktopIcon,
  CubeIcon,
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  onActivityClick?: (activity: ActivityItem) => void;
  refreshInterval?: number;
}

interface ActivityFilters {
  type: string;
  action: string;
  user: string;
  dateRange: string;
  status: string;
}

// ===== HELPERS =====
const getActivityIcon = (type: string, action: string, iconName?: string) => {
  // Si el backend proporciona un ícono específico, usar mapeo
  if (iconName) {
    const iconMap: Record<string, React.ReactElement> = {
      'plus': <PlusIcon className="h-5 w-5 text-green-600" />,
      'pencil': <PencilIcon className="h-5 w-5 text-amber-600" />,
      'trash': <TrashIcon className="h-5 w-5 text-red-600" />,
      'user-plus': <UserPlusIcon className="h-5 w-5 text-blue-600" />,
      'user-minus': <UserMinusIcon className="h-5 w-5 text-orange-600" />,
      'cube': <CubeIcon className="h-5 w-5 text-purple-600" />,
      'arrow-up': <ArrowUpIcon className="h-5 w-5 text-red-600" />,
      'arrow-down': <ArrowDownIcon className="h-5 w-5 text-green-600" />,
      'arrow-path': <ArrowPathIcon className="h-5 w-5 text-blue-600" />,
      'exclamation-triangle': <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />,
      'adjustments': <AdjustmentsHorizontalIcon className="h-5 w-5 text-amber-600" />,
      'clock': <ClockIcon className="h-5 w-5 text-gray-600" />
    };
    
    return iconMap[iconName] || <ClockIcon className="h-5 w-5 text-gray-600" />;
  }

  // Fallback al mapeo original
  switch (type) {
    case 'equipment':
      switch (action) {
        case 'created':
          return <PlusIcon className="h-5 w-5 text-blue-600" />;
        case 'updated':
          return <PencilIcon className="h-5 w-5 text-amber-600" />;
        case 'deleted':
          return <TrashIcon className="h-5 w-5 text-red-600" />;
        case 'assigned':
          return <UserPlusIcon className="h-5 w-5 text-green-600" />;
        case 'unassigned':
          return <UserMinusIcon className="h-5 w-5 text-orange-600" />;
        default:
          return <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />;
      }
    case 'supply':
      switch (action) {
        case 'created':
          return <PlusIcon className="h-5 w-5 text-green-600" />;
        case 'low_stock':
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
        default:
          return <CubeIcon className="h-5 w-5 text-green-600" />;
      }
    case 'movement':
      switch (action) {
        case 'stock_in':
          return <ArrowDownIcon className="h-5 w-5 text-green-600" />;
        case 'stock_out':
          return <ArrowUpIcon className="h-5 w-5 text-red-600" />;
        case 'stock_adjusted':
          return <AdjustmentsHorizontalIcon className="h-5 w-5 text-amber-600" />;
        default:
          return <ArrowPathIcon className="h-5 w-5 text-indigo-600" />;
      }
    default:
      return <ClockIcon className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;
  
  const variants = {
    success: 'success' as const,
    warning: 'warning' as const,
    error: 'danger' as const,
    pending: 'info' as const
  };

  const labels = {
    success: 'Completado',
    warning: 'Advertencia',
    error: 'Error',
    pending: 'Pendiente'
  };

  return (
    <Badge variant={variants[status as keyof typeof variants]} size="xs">
      {labels[status as keyof typeof labels]}
    </Badge>
  );
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'critical':
      return 'border-l-red-500';
    case 'high':
      return 'border-l-orange-500';
    case 'medium':
      return 'border-l-yellow-500';
    default:
      return 'border-l-blue-500';
  }
};

// ===== COMPONENTE DE ITEM DE ACTIVIDAD =====
const ActivityItemComponent: React.FC<{
  activity: ActivityItem;
  onClick?: () => void;
  showMetadata?: boolean;
}> = ({ activity, onClick, showMetadata = true }) => {
  return (
    <div 
      className={`border-l-4 ${getPriorityColor(activity.priority)} p-4 hover:bg-gray-50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getActivityIcon(activity.type, activity.action, activity.display?.icon)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </h4>
            <div className="flex items-center gap-2">
              {activity.display?.badge_text && (
                <Badge variant="info" size="xs">
                  {activity.display.badge_text}
                </Badge>
              )}
              {getStatusBadge(activity.status)}
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {activity.relative_time || new Date(activity.timestamp).toLocaleDateString('es-GT')}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {activity.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {activity.user && <span>Por {activity.user.name}</span>}
              {activity.entity && (
                <>
                  <span>•</span>
                  <span>{activity.entity.type}: {activity.entity.name}</span>
                </>
              )}
            </div>
            
            {onClick && (
              <DashboardButton
                variant="text"
                size="sm"
                leftIcon={<EyeIcon className="h-3 w-3" />}
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                Ver
              </DashboardButton>
            )}
          </div>
          
          {/* Metadata adicional */}
          {showMetadata && activity.metadata && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs space-y-1">
              {activity.metadata.quantity && (
                <div className="flex justify-between">
                  <span>Cantidad:</span>
                  <span className="font-medium">{activity.metadata.quantity}</span>
                </div>
              )}
              {activity.metadata.location && (
                <div className="flex justify-between">
                  <span>Ubicación:</span>
                  <span className="font-medium">{activity.metadata.location}</span>
                </div>
              )}
              {activity.metadata.category && (
                <div className="flex justify-between">
                  <span>Categoría:</span>
                  <span className="font-medium">{activity.metadata.category}</span>
                </div>
              )}
              {activity.metadata.oldValue && activity.metadata.newValue && (
                <div className="flex justify-between">
                  <span>Cambio:</span>
                  <span className="font-medium">
                    {activity.metadata.oldValue} → {activity.metadata.newValue}
                  </span>
                </div>
              )}
              {activity.metadata.currentStock !== undefined && activity.metadata.minimumStock !== undefined && (
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span className="font-medium">
                    {activity.metadata.currentStock} / {activity.metadata.minimumStock}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE DE FILTROS =====
const ActivityFiltersComponent: React.FC<{
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  isLoading?: boolean;
}> = ({ filters, onFiltersChange, isLoading }) => {
  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'equipment', label: 'Equipos' },
    { value: 'supply', label: 'Suministros' },
    { value: 'movement', label: 'Movimientos' },
    { value: 'system', label: 'Sistema' }
  ];

  const actionOptions = [
    { value: '', label: 'Todas las acciones' },
    { value: 'created', label: 'Creado' },
    { value: 'updated', label: 'Actualizado' },
    { value: 'deleted', label: 'Eliminado' },
    { value: 'assigned', label: 'Asignado' },
    { value: 'unassigned', label: 'Desasignado' },
    { value: 'moved', label: 'Movido' },
    { value: 'adjusted', label: 'Ajustado' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'Todo el tiempo' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'success', label: 'Completado' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'error', label: 'Error' },
    { value: 'pending', label: 'Pendiente' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
      <DashboardSelect
        id="type-filter"
        name="type"
        label="Tipo"
        value={filters.type}
        onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
        options={typeOptions}
        className="mb-0"
        loading={isLoading}
      />

      <DashboardSelect
        id="action-filter"
        name="action"
        label="Acción"
        value={filters.action}
        onChange={(e) => onFiltersChange({ ...filters, action: e.target.value })}
        options={actionOptions}
        className="mb-0"
        loading={isLoading}
      />

      <DashboardSelect
        id="date-filter"
        name="dateRange"
        label="Período"
        value={filters.dateRange}
        onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
        options={dateRangeOptions}
        className="mb-0"
        loading={isLoading}
      />

      <DashboardSelect
        id="status-filter"
        name="status"
        label="Estado"
        value={filters.status}
        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
        options={statusOptions}
        className="mb-0"
        loading={isLoading}
      />
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const ActivityFeed: React.FC<ActivityFeedProps> = ({
  className = '',
  maxItems = 50,
  showFilters = true,
  onActivityClick,
  refreshInterval = 300000 // 5 minutos por defecto
}) => {
  // Estado de filtros locales
  const [localFilters, setLocalFilters] = useState<ActivityFilters>({
    type: '',
    action: '',
    user: '',
    dateRange: '',
    status: ''
  });

  // Hook de actividades
  const {
    activities,
    totalActivities,
    hasMore,
    isLoading,
    error,
    refresh,
    loadMore,
    updateFilters,
    stats
  } = useActivityFeed({
    limit: maxItems,
    autoFetch: true,
    refreshInterval
  });

  // Handlers
  const handleFiltersChange = (newFilters: ActivityFilters) => {
    setLocalFilters(newFilters);
    
    // Convertir filtros a formato del API
    const apiFilters: any = {};
    
    if (newFilters.type) {
      apiFilters.activity_types = newFilters.type;
    }
    
    if (newFilters.dateRange) {
      const daysMap: Record<string, number> = {
        'today': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      };
      apiFilters.days_back = daysMap[newFilters.dateRange] || 30;
    }
    
    updateFilters(apiFilters);
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleLoadMore = async () => {
    if (hasMore && !isLoading) {
      await loadMore();
    }
  };

  return (
    <DashboardCard className={className}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Actividad Reciente
          </h3>
          <p className="text-sm text-gray-600">
            {totalActivities} actividades • {stats.period_days} días
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showFilters && (
            <DashboardButton
              variant="outline"
              size="sm"
              leftIcon={<FunnelIcon className="h-4 w-4" />}
            >
              Filtros
            </DashboardButton>
          )}
          
          <DashboardButton
            variant="outline"
            size="sm"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            Actualizar
          </DashboardButton>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <ActivityFiltersComponent
          filters={localFilters}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
        />
      )}

      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {isLoading && activities.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Cargando actividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No hay actividades recientes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <ActivityItemComponent
                key={activity.id}
                activity={activity}
                onClick={() => handleActivityClick(activity)}
                showMetadata={true}
              />
            ))}
          </div>
        )}

        {/* Botón Cargar Más */}
        {hasMore && (
          <div className="p-4 border-t bg-gray-50">
            <DashboardButton
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Cargando...' : 'Cargar más actividades'}
            </DashboardButton>
          </div>
        )}

        {/* Footer con estadísticas */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {stats.equipment_created}
              </div>
              <div className="text-xs text-gray-600">Equipos creados</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {stats.equipment_assigned}
              </div>
              <div className="text-xs text-gray-600">Asignaciones</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {stats.stock_movements}
              </div>
              <div className="text-xs text-gray-600">Movimientos</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {stats.low_stock_alerts}
              </div>
              <div className="text-xs text-gray-600">Alertas stock</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default ActivityFeed;