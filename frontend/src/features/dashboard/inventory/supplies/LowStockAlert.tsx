import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  BellIcon,
  BellSlashIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PlusCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Importar componentes UI
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import Badge from '../../components/ui/Badge';
import DashboardTabs, { useDashboardTabs } from '../../components/ui/DashboardTabs';
import Switch from '../../components/ui/Switch';

// Importar hooks y tipos
import { useSuppliesList } from '../../../../services/inventory/hooks';
import type { 
  SupplyWithDetails,
  StockStatus
} from '../../../../services/inventory/types';

interface LowStockAlertProps {
  onViewSupply?: (supply: SupplyWithDetails) => void;
  onCreateMovement?: (supply: SupplyWithDetails) => void;
  className?: string;
  compactMode?: boolean;
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

interface AlertItem {
  id: string;
  supply: SupplyWithDetails;
  alertType: 'critical' | 'low' | 'out_of_stock';
  severity: 'high' | 'medium' | 'low';
  daysWithoutMovement?: number;
  lastMovementDate?: string;
  suggestedAction: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({
  onViewSupply,
  onCreateMovement,
  className = '',
  compactMode = false,
  maxAlerts,
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutos
}) => {
  // Estados
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [muteAlerts, setMuteAlerts] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Hooks
  const { 
    lowStockSupplies, 
    isLoading, 
    error, 
    refreshLowStock 
  } = useSuppliesList();

  const { activeTabId, createTab } = useDashboardTabs('all');

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshLowStock();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshLowStock]);

  // Generar alertas desde los suministros con stock bajo
  useEffect(() => {
    const generateAlerts = (): AlertItem[] => {
      return lowStockSupplies.map(supply => {
        // Simular algunos datos adicionales (en producción vendrían del backend)
        const daysWithoutMovement = Math.floor(Math.random() * 30) + 1;
        const lastMovementDate = new Date(Date.now() - (daysWithoutMovement * 24 * 60 * 60 * 1000)).toISOString();
        
        let alertType: AlertItem['alertType'] = 'low';
        let severity: AlertItem['severity'] = 'medium';
        let suggestedAction = 'Revisar stock y considerar reabastecimiento';

        if (supply.stock_actual <= 0) {
          alertType = 'out_of_stock';
          severity = 'high';
          suggestedAction = '🚨 URGENTE: Reabastecer inmediatamente - Sin stock disponible';
        } else if (supply.stock_actual <= supply.stock_minimo * 0.5) {
          alertType = 'critical';
          severity = 'high';
          suggestedAction = '⚠️ CRÍTICO: Reabastecer urgentemente - Stock muy bajo';
        } else if (supply.stock_actual <= supply.stock_minimo) {
          alertType = 'low';
          severity = daysWithoutMovement > 14 ? 'high' : 'medium';
          suggestedAction = '📦 Programar reabastecimiento - Stock por debajo del mínimo';
        }

        return {
          id: `alert-${supply.id}`,
          supply,
          alertType,
          severity,
          daysWithoutMovement,
          lastMovementDate,
          suggestedAction,
          acknowledged: acknowledgedAlerts.has(`alert-${supply.id}`)
        };
      });
    };

    const newAlerts = generateAlerts();
    setAlerts(newAlerts);
  }, [lowStockSupplies, acknowledgedAlerts]);

  // Función para obtener información de estado de stock
  const getStockStatusInfo = (current: number, minimum: number): {
    status: StockStatus;
    color: string;
    label: string;
    icon: React.ReactNode;
  } => {
    if (current <= 0) {
      return { 
        status: 'out', 
        color: 'danger', 
        label: 'Sin stock',
        icon: <XMarkIcon className="h-4 w-4" />
      };
    }
    if (current <= minimum * 0.5) {
      return { 
        status: 'critical', 
        color: 'danger', 
        label: 'Crítico',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />
      };
    }
    if (current <= minimum) {
      return { 
        status: 'low', 
        color: 'warning', 
        label: 'Bajo',
        icon: <ClockIcon className="h-4 w-4" />
      };
    }
    return { 
      status: 'ok', 
      color: 'success', 
      label: 'Normal',
      icon: <CheckCircleIcon className="h-4 w-4" />
    };
  };

  // Filtrar alertas según la pestaña activa
  const filteredAlerts = React.useMemo(() => {
    let filtered = alerts;

    switch (activeTabId) {
      case 'critical':
        filtered = alerts.filter(alert => alert.alertType === 'out_of_stock' || alert.alertType === 'critical');
        break;
      case 'low':
        filtered = alerts.filter(alert => alert.alertType === 'low');
        break;
      case 'acknowledged':
        filtered = alerts.filter(alert => alert.acknowledged);
        break;
      case 'unacknowledged':
        filtered = alerts.filter(alert => !alert.acknowledged);
        break;
      default:
        filtered = alerts;
    }

    // Aplicar límite si se especifica
    if (maxAlerts && maxAlerts > 0) {
      filtered = filtered.slice(0, maxAlerts);
    }

    return filtered;
  }, [activeTabId, alerts, maxAlerts]);

  // Manejar reconocimiento de alertas
  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleUnacknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.delete(alertId);
      return newSet;
    });
  };

  // Reconocer todas las alertas visibles
  const handleAcknowledgeAll = () => {
    const visibleAlertIds = filteredAlerts.map(alert => alert.id);
    setAcknowledgedAlerts(prev => new Set([...prev, ...visibleAlertIds]));
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      header: 'Suministro',
      accessor: ((alert: AlertItem) => (
        <div>
          <div className="font-medium text-gray-900">{alert.supply.nombre_producto}</div>
          <div className="text-sm text-gray-500">
            {alert.supply.codigo && `Código: ${alert.supply.codigo}`}
            {alert.supply.presentacion && ` • ${alert.supply.presentacion}`}
          </div>
        </div>
      )) as any,
      width: '250px'
    },
    {
      header: 'Estado',
      accessor: ((alert: AlertItem) => {
        const stockInfo = getStockStatusInfo(alert.supply.stock_actual, alert.supply.stock_minimo);
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant={stockInfo.color as any} 
              size="sm"
              icon={stockInfo.icon}
            >
              {stockInfo.label}
            </Badge>
            {alert.acknowledged && (
              <Badge variant="secondary" size="sm">
                Reconocida
              </Badge>
            )}
          </div>
        );
      }) as any,
      width: '150px'
    },
    {
      header: 'Stock',
      accessor: ((alert: AlertItem) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {alert.supply.stock_actual} / {alert.supply.stock_minimo}
          </div>
          <div className="text-xs text-gray-500">
            Actual / Mínimo
          </div>
        </div>
      )) as any,
      width: '100px',
      align: 'center' as const
    },
    {
      header: 'Severidad',
      accessor: ((alert: AlertItem) => (
        <Badge 
          variant={
            alert.severity === 'high' ? 'danger' : 
            alert.severity === 'medium' ? 'warning' : 'secondary'
          }
          size="sm"
        >
          {alert.severity === 'high' ? 'Alta' : 
           alert.severity === 'medium' ? 'Media' : 'Baja'}
        </Badge>
      )) as any,
      width: '100px',
      align: 'center' as const
    },
    {
      header: 'Última Actividad',
      accessor: ((alert: AlertItem) => (
        <div className="text-sm text-gray-600">
          {alert.daysWithoutMovement ? (
            <>
              <div>{alert.daysWithoutMovement} días</div>
              <div className="text-xs text-gray-400">sin movimiento</div>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )) as any,
      width: '120px'
    },
    {
      header: 'Acción Sugerida',
      accessor: ((alert: AlertItem) => (
        <div className="text-sm text-gray-700 max-w-xs">
          {alert.suggestedAction}
        </div>
      )) as any
    }
  ];

  // Renderizar acciones para cada alerta
  const renderActions = (alert: AlertItem) => (
    <div className="flex items-center gap-1">
      {!alert.acknowledged ? (
        <DashboardButton
          variant="outline"
          size="sm"
          onClick={() => handleAcknowledgeAlert(alert.id)}
          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
          className="text-green-600 hover:text-green-900"
        >
          Reconocer
        </DashboardButton>
      ) : (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleUnacknowledgeAlert(alert.id)}
          leftIcon={<XMarkIcon className="h-4 w-4" />}
          className="text-gray-600 hover:text-gray-900"
        >
          Quitar
        </DashboardButton>
      )}

      {onViewSupply && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onViewSupply(alert.supply)}
          leftIcon={<EyeIcon className="h-4 w-4" />}
          className="text-blue-600 hover:text-blue-900"
        >
          Ver
        </DashboardButton>
      )}

      {onCreateMovement && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => onCreateMovement(alert.supply)}
          leftIcon={<PlusCircleIcon className="h-4 w-4" />}
          className="text-green-600 hover:text-green-900"
        >
          Reabastecer
        </DashboardButton>
      )}
    </div>
  );

  // Configurar pestañas
  const criticalCount = alerts.filter(a => a.alertType === 'out_of_stock' || a.alertType === 'critical').length;
  const lowCount = alerts.filter(a => a.alertType === 'low').length;
  const acknowledgedCount = alerts.filter(a => a.acknowledged).length;
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const tabs = [
    createTab('all', 'Todas', { 
      count: alerts.length,
      icon: <BellIcon className="h-4 w-4" />
    }),
    createTab('critical', 'Críticas', { 
      count: criticalCount,
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      badge: criticalCount > 0 ? (
        <Badge variant="danger" size="sm">!</Badge>
      ) : undefined
    }),
    createTab('low', 'Stock Bajo', { 
      count: lowCount,
      icon: <ClockIcon className="h-4 w-4" />
    }),
    createTab('unacknowledged', 'Sin Reconocer', { 
      count: unacknowledgedCount,
      icon: <BellIcon className="h-4 w-4" />,
      badge: unacknowledgedCount > 0 ? (
        <Badge variant="warning" size="sm">{unacknowledgedCount}</Badge>
      ) : undefined
    }),
    createTab('acknowledged', 'Reconocidas', { 
      count: acknowledgedCount,
      icon: <CheckCircleIcon className="h-4 w-4" />
    })
  ];

  // Modo compacto para widgets
  if (compactMode) {
    const urgentAlerts = alerts.filter(a => 
      (a.alertType === 'out_of_stock' || a.alertType === 'critical') && !a.acknowledged
    );

    return (
      <DashboardCard
        title="Alertas de Stock"
        subtitle={`${urgentAlerts.length} alertas críticas`}
        className={className}
        size="sm"
        badge={urgentAlerts.length > 0 ? (
          <Badge variant="danger" size="sm" pulse>
            {urgentAlerts.length}
          </Badge>
        ) : undefined}
        headerAction={
          <DashboardButton
            variant="text"
            size="sm"
            onClick={refreshLowStock}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Actualizar
          </DashboardButton>
        }
      >
        {urgentAlerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No hay alertas críticas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {urgentAlerts.slice(0, maxAlerts || 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 truncate">
                    {alert.supply.nombre_producto}
                  </p>
                  <p className="text-xs text-red-700">
                    Stock: {alert.supply.stock_actual} / {alert.supply.stock_minimo}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {onCreateMovement && (
                    <DashboardButton
                      variant="outline"
                      size="xs"
                      onClick={() => onCreateMovement(alert.supply)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reabastecer
                    </DashboardButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    );
  }

  // Vista completa
  return (
    <DashboardCard
      title="Sistema de Alertas de Stock"
      subtitle={`${alerts.length} alertas activas • Última actualización: ${lastRefresh.toLocaleTimeString('es-GT')}`}
      className={className}
      loading={isLoading}
      error={error}
      onRetry={refreshLowStock}
      headerAction={
        <div className="flex items-center gap-3">
          {/* Control de silenciar alertas */}
          <div className="flex items-center gap-2">
            <Switch
              checked={!muteAlerts}
              onChange={(checked) => setMuteAlerts(!checked)}
              size="sm"
              icons={{
                checked: <BellIcon className="h-3 w-3" />,
                unchecked: <BellSlashIcon className="h-3 w-3" />
              }}
            />
            <span className="text-sm text-gray-600">
              {muteAlerts ? 'Silenciadas' : 'Activas'}
            </span>
          </div>

          <DashboardButton
            variant="outline"
            size="sm"
            onClick={refreshLowStock}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            disabled={isLoading}
          >
            Actualizar
          </DashboardButton>

          {unacknowledgedCount > 0 && (
            <DashboardButton
              variant="secondary"
              size="sm"
              onClick={handleAcknowledgeAll}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
            >
              Reconocer Todas
            </DashboardButton>
          )}
        </div>
      }
    >
      {/* Pestañas */}
      <div className="mb-6">
        <DashboardTabs
          tabs={tabs}
          variant="underline"
          isLoading={isLoading}
        />
      </div>

      {/* Resumen de alertas críticas */}
      {criticalCount > 0 && !muteAlerts && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">
                {criticalCount} Alerta{criticalCount > 1 ? 's' : ''} Crítica{criticalCount > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Hay suministros sin stock o con niveles críticos que requieren atención inmediata.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de alertas */}
      <DashboardDataTable
        columns={columns}
        data={filteredAlerts}
        keyExtractor={(alert) => alert.id}
        isLoading={isLoading}
        emptyMessage={
          activeTabId === 'critical' 
            ? "No hay alertas críticas" 
            : activeTabId === 'acknowledged'
            ? "No hay alertas reconocidas"
            : "No hay alertas de stock"
        }
        actionColumn={Boolean(onViewSupply || onCreateMovement)}
        renderActions={renderActions}
        hover
        striped
      />
    </DashboardCard>
  );
};

export default LowStockAlert;