// frontend/src/features/dashboard/pages/inventory/SuppliesPage.tsx

import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardTabs, { useDashboardTabs } from '../../components/ui/DashboardTabs';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Importar componentes específicos de suministros
import SuppliesList from '../../inventory/supplies/SuppliesList';
import SupplyForm from '../../inventory/supplies/SupplyForm';
import StockMovements from '../../inventory/supplies/StockMovements';
import LowStockAlert from '../../inventory/supplies/LowStockAlert';
import QuickActions from '../../inventory/common/QuickActions';

// Icons
import { 
  CubeIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  BellIcon
} from '@heroicons/react/24/outline';

// Hooks
import { useSuppliesList, useInventoryCommon } from '../../../../services/inventory';
import type { SupplyWithDetails } from '../../../../services/inventory/types';

const SuppliesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados de modales
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<SupplyWithDetails | null>(null);
  const [editingSupply, setEditingSupply] = useState<SupplyWithDetails | null>(null);

  // Tabs
  const { activeTabId, createTab } = useDashboardTabs(
    searchParams.get('tab') || 'list'
  );

  // Hooks de datos
  const {
    supplies,
    lowStockSupplies,
    totalCount,
    isLoading,
    error,
    refresh,
    createSupply,
    updateSupply,
    deleteSupply
  } = useSuppliesList();

  const {
    categories,
    locations,
    isLoading: isLoadingCommon
  } = useInventoryCommon();

  // Handlers principales
  const handleCreateSupply = useCallback(() => {
    setEditingSupply(null);
    setShowSupplyForm(true);
  }, []);

  const handleEditSupply = useCallback((supply: SupplyWithDetails) => {
    setEditingSupply(supply);
    setShowSupplyForm(true);
  }, []);

  const handleViewSupply = useCallback((supply: SupplyWithDetails) => {
    navigate(`/dashboard/inventory/supplies/${supply.id}`);
  }, [navigate]);

  const handleDeleteSupply = useCallback(async (supply: SupplyWithDetails) => {
    if (window.confirm(`¿Estás seguro de eliminar el suministro "${supply.nombre_producto}"?`)) {
      try {
        await deleteSupply(supply.id);
      } catch (error) {
        console.error('Error eliminando suministro:', error);
      }
    }
  }, [deleteSupply]);

  const handleCreateMovement = useCallback((supply: SupplyWithDetails) => {
    setSelectedSupply(supply);
    setShowMovements(true);
  }, []);

  // Handlers de formulario
  const handleFormSuccess = useCallback((supply: SupplyWithDetails) => {
    setShowSupplyForm(false);
    setEditingSupply(null);
    refresh();
  }, [refresh]);

  const handleFormError = useCallback((error: string) => {
    console.error('Error en formulario:', error);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowSupplyForm(false);
    setEditingSupply(null);
  }, []);

  // Handlers de movimientos
  const handleMovementsClose = useCallback(() => {
    setShowMovements(false);
    setSelectedSupply(null);
    refresh(); // Refrescar datos después de crear movimientos
  }, [refresh]);

  // Handlers de acciones rápidas
  const handleQuickAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'add_supply':
        handleCreateSupply();
        break;
      case 'stock_movement':
        // Abrir modal genérico de movimientos
        setSelectedSupply(null);
        setShowMovements(true);
        break;
      case 'low_stock_alert':
        // Cambiar a tab de alertas
        navigate('/dashboard/inventory/supplies?tab=alerts');
        break;
      case 'inventory_count':
        console.log('Iniciar conteo físico');
        break;
      case 'export_supplies':
        console.log('Exportar suministros');
        break;
      case 'purchase_request':
        console.log('Generar solicitud de compra');
        break;
      default:
        console.log('Acción no implementada:', actionId);
    }
  }, [handleCreateSupply, navigate]);

  // Configurar pestañas
  const tabs = [
    createTab('list', 'Lista de Suministros', { 
      count: supplies.length,
      icon: <CubeIcon className="h-4 w-4" />
    }),
    createTab('alerts', 'Alertas de Stock', { 
      count: lowStockSupplies.length,
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      badge: lowStockSupplies.length > 0 ? (
        <Badge variant="warning" size="sm">{lowStockSupplies.length}</Badge>
      ) : undefined
    }),
    createTab('movements', 'Movimientos', { 
      count: 0, // Se puede obtener del backend si es necesario
      icon: <ArrowPathIcon className="h-4 w-4" />
    })
  ];

  // Manejo de errores
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <CubeIcon className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Suministros</h1>
          </div>
          
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="la lista de suministros"
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
              <CubeIcon className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Suministros</h1>
            </div>
            <p className="text-gray-600">
              Control de inventario y administración de stock
            </p>
          </div>

          {/* Acciones rápidas en el header */}
          <QuickActions
            type="supplies"
            layout="horizontal"
            showTitle={false}
            alertCounts={{
              lowStock: lowStockSupplies.length,
              damaged: 0, // Los suministros no tienen concepto de "dañado" como los equipos
              unassigned: 0
            }}
            onCustomAction={handleQuickAction}
          />
        </div>

        {/* Contenido principal por pestañas */}
        <DashboardCard>
          {/* Pestañas */}
          <div className="mb-6">
            <DashboardTabs
              tabs={tabs}
              variant="underline"
              isLoading={isLoading}
            />
          </div>

          {/* Contenido según la pestaña activa */}
          {activeTabId === 'list' && (
            <SuppliesList
              onCreateSupply={handleCreateSupply}
              onEditSupply={handleEditSupply}
              onViewSupply={handleViewSupply}
              onDeleteSupply={handleDeleteSupply}
              onCreateMovement={handleCreateMovement}
            />
          )}

          {activeTabId === 'alerts' && (
            <LowStockAlert
              onViewSupply={handleViewSupply}
              onCreateMovement={handleCreateMovement}
              autoRefresh={true}
              refreshInterval={300000} // 5 minutos
            />
          )}

          {activeTabId === 'movements' && (
            <StockMovements
              supply={selectedSupply}
              onClose={() => setSelectedSupply(null)}
            />
          )}
        </DashboardCard>

        {/* Modal de formulario de suministro */}
        <SupplyForm
          isOpen={showSupplyForm}
          onClose={handleFormClose}
          supply={editingSupply}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
        />

        {/* Modal/Componente de movimientos */}
        {showMovements && (
          <StockMovements
            supply={selectedSupply}
            onClose={handleMovementsClose}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuppliesPage;