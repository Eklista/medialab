// frontend/src/features/dashboard/pages/inventory/SuppliesPage.tsx - CON INVENTORY LAYOUT

import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import InventoryLayout from '../../components/layout/InventoryLayout';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardTabs, { DashboardTabPanel, useDashboardTabs } from '../../components/ui/DashboardTabs';
import Badge from '../../components/ui/Badge';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// ✅ IMPORTAR COMPONENTES REALES DE SUMINISTROS
import SuppliesList from '../../inventory/supplies/SuppliesList';
import SupplyForm from '../../inventory/supplies/SupplyForm';
import StockMovements from '../../inventory/supplies/StockMovements';
import LowStockAlert from '../../inventory/supplies/LowStockAlert';
import QuickActions from '../../inventory/common/QuickActions';

// Icons
import { 
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// ✅ USAR SERVICIOS REALES
import { useSuppliesList } from '../../../../services/inventory';
import type { SupplyWithDetails } from '../../../../services/inventory/types';

const SuppliesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados de modales y componentes
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<SupplyWithDetails | null>(null);
  const [editingSupply, setEditingSupply] = useState<SupplyWithDetails | null>(null);

  // Tabs
  const { activeTabId, createTab } = useDashboardTabs(
    searchParams.get('tab') || 'list'
  );

  // ✅ HOOK REAL - Ya no simulado
  const {
    lowStockSupplies,
    isLoading,
    error,
    refresh
  } = useSuppliesList();

  // ===== HANDLERS PRINCIPALES =====
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

  const handleDeleteSupply = useCallback((supply: SupplyWithDetails) => {
    // El componente SuppliesList maneja la eliminación internamente
    console.log('Eliminar suministro:', supply.id);
  }, []);

  const handleCreateMovement = useCallback((supply: SupplyWithDetails) => {
    setSelectedSupply(supply);
    setShowMovements(true);
  }, []);

  // ===== HANDLERS DE FORMULARIOS =====
  const handleFormSuccess = useCallback((supply: SupplyWithDetails) => {
    console.log('Suministro guardado exitosamente:', supply);
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

  // ===== HANDLERS DE MOVIMIENTOS =====
  const handleMovementsClose = useCallback(() => {
    setShowMovements(false);
    setSelectedSupply(null);
    refresh(); // Refrescar datos después de crear movimientos
  }, [refresh]);

  // ===== HANDLERS DE ACCIONES RÁPIDAS =====
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

  // ===== CONFIGURAR PESTAÑAS =====
  const tabs = [
    createTab('list', 'Lista de Suministros', { 
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
      icon: <ArrowPathIcon className="h-4 w-4" />
    })
  ];

  // ===== MANEJO DE ERRORES =====
  if (error) {
    return (
      <DashboardLayout>
        <InventoryLayout>
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="la lista de suministros"
          />
        </InventoryLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <InventoryLayout 
        title="Gestión de Suministros" 
        subtitle="Control de inventario y administración de stock"
      >
        <div className="space-y-6">
          {/* Header con acciones rápidas */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <p className="text-gray-600">
                Administra stock, movimientos y alertas de suministros del inventario
              </p>
            </div>

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

            {/* ✅ USAR COMPONENTES REALES */}
            
            {/* Panel: Lista de Suministros */}
            <DashboardTabPanel tabId="list" isActive={activeTabId === 'list'}>
              <SuppliesList
                onCreateSupply={handleCreateSupply}
                onEditSupply={handleEditSupply}
                onViewSupply={handleViewSupply}
                onDeleteSupply={handleDeleteSupply}
                onCreateMovement={handleCreateMovement}
              />
            </DashboardTabPanel>

            {/* Panel: Alertas de Stock Bajo */}
            <DashboardTabPanel tabId="alerts" isActive={activeTabId === 'alerts'}>
              <LowStockAlert
                onViewSupply={handleViewSupply}
                onCreateMovement={handleCreateMovement}
                autoRefresh={true}
                refreshInterval={300000} // 5 minutos
              />
            </DashboardTabPanel>

            {/* Panel: Movimientos */}
            <DashboardTabPanel tabId="movements" isActive={activeTabId === 'movements'}>
              <StockMovements
                supply={selectedSupply}
                onClose={() => setSelectedSupply(null)}
              />
            </DashboardTabPanel>
          </DashboardCard>

          {/* ✅ USAR COMPONENTE REAL DE FORMULARIO */}
          <SupplyForm
            isOpen={showSupplyForm}
            onClose={handleFormClose}
            supply={editingSupply}
            onSuccess={handleFormSuccess}
            onError={handleFormError}
          />

          {/* ✅ USAR COMPONENTE REAL DE MOVIMIENTOS */}
          {showMovements && (
            <StockMovements
              supply={selectedSupply}
              onClose={handleMovementsClose}
            />
          )}
        </div>
      </InventoryLayout>
    </DashboardLayout>
  );
};

export default SuppliesPage;