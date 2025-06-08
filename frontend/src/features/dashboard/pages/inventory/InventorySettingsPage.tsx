// frontend/src/features/dashboard/pages/inventory/InventorySettingsPage.tsx

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardTabs, { DashboardTabPanel, useDashboardTabs } from '../../components/ui/DashboardTabs';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardTextArea from '../../components/ui/DashboardTextArea';
import DashboardModal from '../../components/ui/DashboardModal';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';

// Icons - solo los que se usan
import { 
  Cog6ToothIcon,
  TagIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Hooks y tipos
import { useInventoryCommon } from '../../../../services/inventory';
import type { 
  InventoryCategory
} from '../../../../services/inventory/types';

interface FormData {
  name: string;
  description: string;
  is_active: boolean;
  // Campos específicos por tipo
  is_equipment?: boolean; // Para categorías
  is_external?: boolean;  // Para ubicaciones
  is_operational?: boolean; // Para estados
  color?: string;         // Para estados
  affects_stock?: number; // Para tipos de movimiento
  contact_person?: string; // Para proveedores
  phone?: string;
  email?: string;
  address?: string;
}

interface FormErrors {
  name?: string;
  general?: string;
}

const InventorySettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // Estados de modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'location' | 'supplier' | 'state' | 'movement'>('category');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_active: true
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Tabs
  const { activeTabId, createTab } = useDashboardTabs(
    searchParams.get('tab') || 'categories'
  );

  // Hooks de datos
  const {
    categories,
    locations,
    suppliers,
    equipmentStates,
    movementTypes,
    isLoading,
    error,
    refresh
  } = useInventoryCommon();

  // ✅ Funciones simuladas para CRUD hasta que estén implementadas en el backend
  const createCategory = useCallback(async (data: any) => {
    console.log('Crear categoría:', data);
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: Date.now(), ...data };
  }, []);

  const updateCategory = useCallback(async (id: number, data: any) => {
    console.log('Actualizar categoría:', id, data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id, ...data };
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    console.log('Eliminar categoría:', id);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const createLocation = useCallback(async (data: any) => {
    console.log('Crear ubicación:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: Date.now(), ...data };
  }, []);

  const updateLocation = useCallback(async (id: number, data: any) => {
    console.log('Actualizar ubicación:', id, data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id, ...data };
  }, []);

  const deleteLocation = useCallback(async (id: number) => {
    console.log('Eliminar ubicación:', id);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const createSupplier = useCallback(async (data: any) => {
    console.log('Crear proveedor:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: Date.now(), ...data };
  }, []);

  const updateSupplier = useCallback(async (id: number, data: any) => {
    console.log('Actualizar proveedor:', id, data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id, ...data };
  }, []);

  const deleteSupplier = useCallback(async (id: number) => {
    console.log('Eliminar proveedor:', id);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  // Configurar pestañas
  const tabs = [
    createTab('categories', 'Categorías', { 
      count: categories.length,
      icon: <TagIcon className="h-4 w-4" />
    }),
    createTab('locations', 'Ubicaciones', { 
      count: locations.length,
      icon: <MapPinIcon className="h-4 w-4" />
    }),
    createTab('suppliers', 'Proveedores', { 
      count: suppliers.length,
      icon: <BuildingStorefrontIcon className="h-4 w-4" />
    }),
    createTab('states', 'Estados de Equipos', { 
      count: equipmentStates.length,
      icon: <WrenchScrewdriverIcon className="h-4 w-4" />
    }),
    createTab('movements', 'Tipos de Movimiento', { 
      count: movementTypes.length,
      icon: <ArrowPathIcon className="h-4 w-4" />
    })
  ];

  // Handlers de modal
  const openCreateModal = useCallback((type: typeof modalType) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
      ...(type === 'category' && { is_equipment: false }),
      ...(type === 'location' && { is_external: false }),
      ...(type === 'state' && { is_operational: true, color: '#10b981' }),
      ...(type === 'movement' && { affects_stock: 1 })
    });
    setErrors({});
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((type: typeof modalType, item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
      is_equipment: item.is_equipment,
      is_external: item.is_external,
      is_operational: item.is_operational,
      color: item.color || '#10b981',
      affects_stock: item.affects_stock || 0,
      contact_person: item.contact_person || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || ''
    });
    setErrors({});
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingItem(null);
    setSubmitSuccess(false);
    setIsSubmitting(false);
  }, []);

  // Validación
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = { ...formData };
      
      // Limpiar campos específicos según el tipo
      if (modalType === 'category') {
        delete submitData.is_external;
        delete submitData.is_operational;
        delete submitData.color;
        delete submitData.affects_stock;
        delete submitData.contact_person;
        delete submitData.phone;
        delete submitData.email;
        delete submitData.address;
      } else if (modalType === 'location') {
        delete submitData.is_equipment;
        delete submitData.is_operational;
        delete submitData.color;
        delete submitData.affects_stock;
        delete submitData.contact_person;
        delete submitData.phone;
        delete submitData.email;
        delete submitData.address;
      } else if (modalType === 'supplier') {
        delete submitData.is_equipment;
        delete submitData.is_external;
        delete submitData.is_operational;
        delete submitData.color;
        delete submitData.affects_stock;
      }

      let result;
      
      if (editingItem) {
        // Actualizar existente
        switch (modalType) {
          case 'category':
            result = await updateCategory(editingItem.id, submitData);
            break;
          case 'location':
            result = await updateLocation(editingItem.id, submitData);
            break;
          case 'supplier':
            result = await updateSupplier(editingItem.id, submitData);
            break;
          default:
            throw new Error('Tipo no implementado para actualización');
        }
      } else {
        // Crear nuevo
        switch (modalType) {
          case 'category':
            result = await createCategory(submitData);
            break;
          case 'location':
            result = await createLocation(submitData);
            break;
          case 'supplier':
            result = await createSupplier(submitData);
            break;
          default:
            throw new Error('Tipo no implementado para creación');
        }
      }

      if (result) {
        setSubmitSuccess(true);
        setTimeout(() => {
          closeModal();
          refresh();
        }, 1500);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers de eliminación
  const handleDelete = useCallback(async (type: typeof modalType, item: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      return;
    }

    try {
      switch (type) {
        case 'category':
          await deleteCategory(item.id);
          break;
        case 'location':
          await deleteLocation(item.id);
          break;
        case 'supplier':
          await deleteSupplier(item.id);
          break;
        default:
          throw new Error('Tipo no implementado para eliminación');
      }
      refresh();
    } catch (error) {
      console.error('Error eliminando item:', error);
    }
  }, [deleteCategory, deleteLocation, deleteSupplier, refresh]);

  // Columnas para las tablas
  const getCategoriesColumns = () => [
    {
      header: 'Nombre',
      accessor: (item: InventoryCategory) => (
        <div>
          <div className="font-medium text-gray-900">{item.name}</div>
          {item.description && (
            <div className="text-sm text-gray-500">{item.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Tipo',
      accessor: (item: InventoryCategory) => (
        <Badge variant={item.is_equipment ? 'primary' : 'secondary'} size="sm">
          {item.is_equipment ? 'Equipos' : 'Suministros'}
        </Badge>
      ),
      width: '120px'
    },
    {
      header: 'Estado',
      accessor: (item: InventoryCategory) => (
        <Badge variant={item.is_active ? 'success' : 'secondary'} size="sm">
          {item.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
      width: '100px'
    }
  ];

  // Renderizar acciones para las tablas
  const renderActions = (type: typeof modalType, item: any) => (
    <div className="flex items-center gap-1">
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => openEditModal(type, item)}
        leftIcon={<PencilIcon className="h-4 w-4" />}
        className="text-blue-600 hover:text-blue-900"
      >
        Editar
      </DashboardButton>
      
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleDelete(type, item)}
        leftIcon={<TrashIcon className="h-4 w-4" />}
        className="text-red-600 hover:text-red-900"
      >
        Eliminar
      </DashboardButton>
    </div>
  );

  // Obtener título del modal
  const getModalTitle = () => {
    const action = editingItem ? 'Editar' : 'Crear';
    const typeLabels = {
      category: 'Categoría',
      location: 'Ubicación',
      supplier: 'Proveedor',
      state: 'Estado',
      movement: 'Tipo de Movimiento'
    };
    return `${action} ${typeLabels[modalType]}`;
  };

  // Manejo de errores
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Inventario</h1>
          </div>
          
          <ApiErrorHandler 
            error={error} 
            onRetry={refresh} 
            resourceName="la configuración de inventario"
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
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">Configuración de Inventario</h1>
            </div>
            <p className="text-gray-600">
              Gestión de categorías, ubicaciones, proveedores y configuraciones del sistema
            </p>
          </div>

          <DashboardButton
            onClick={refresh}
            variant="outline"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            loading={isLoading}
          >
            Actualizar
          </DashboardButton>
        </div>

        {/* Contenido principal */}
        <DashboardCard>
          {/* Pestañas */}
          <div className="mb-6">
            <DashboardTabs
              tabs={tabs}
              variant="underline"
              isLoading={isLoading}
            />
          </div>

          {/* Panel de Categorías */}
          <DashboardTabPanel tabId="categories" isActive={activeTabId === 'categories'}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Categorías de Inventario</h3>
                <DashboardButton
                  onClick={() => openCreateModal('category')}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Nueva Categoría
                </DashboardButton>
              </div>

              <DashboardDataTable
                columns={getCategoriesColumns()}
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                isLoading={isLoading}
                emptyMessage="No hay categorías configuradas"
                actionColumn={true}
                renderActions={(item) => renderActions('category', item)}
                hover
                striped
              />
            </div>
          </DashboardTabPanel>

          {/* Panel de Tipos de Movimiento (solo lectura por ahora) */}
          <DashboardTabPanel tabId="movements" isActive={activeTabId === 'movements'}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tipos de Movimiento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movementTypes.map((movement) => (
                  <div key={movement.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${
                        movement.affects_stock > 0 ? 'bg-green-100 text-green-600' :
                        movement.affects_stock < 0 ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {movement.affects_stock > 0 ? '+' :
                         movement.affects_stock < 0 ? '-' : '±'}
                      </div>
                      <h4 className="font-medium text-gray-900">{movement.name}</h4>
                    </div>
                    {movement.description && (
                      <p className="text-sm text-gray-600 mb-2">{movement.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Afecta stock: {movement.affects_stock > 0 ? 'Incrementa' : 
                                   movement.affects_stock < 0 ? 'Reduce' : 'No afecta'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DashboardTabPanel>
        </DashboardCard>

        {/* Modal de formulario */}
        <DashboardModal
          isOpen={showModal}
          onClose={closeModal}
          title={getModalTitle()}
          size="lg"
          error={errors.general}
          success={submitSuccess ? 'Guardado exitosamente' : null}
          footer={
            <div className="flex justify-end gap-3">
              <DashboardButton
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancelar
              </DashboardButton>
              
              <DashboardButton
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || submitSuccess}
                leftIcon={<CheckIcon className="h-4 w-4" />}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </DashboardButton>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Campos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardTextInput
                id="name"
                name="name"
                label="Nombre"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nombre descriptivo"
                required
                error={errors.name}
                maxLength={100}
              />

              <div className="flex items-center justify-center">
                <Switch
                  checked={formData.is_active}
                  onChange={(checked) => handleSwitchChange('is_active', checked)}
                  size="md"
                  variant={formData.is_active ? 'success' : 'default'} // ✅ Usar variant válido
                  onLabel="Activo"
                  offLabel="Inactivo"
                />
              </div>
            </div>

            <DashboardTextArea
              id="description"
              name="description"
              label="Descripción"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descripción opcional"
              rows={3}
              maxLength={500}
              showCharCount
            />

            {/* Campos específicos por tipo */}
            {modalType === 'category' && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Configuración de Categoría</h4>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="categoryType"
                      checked={!formData.is_equipment}
                      onChange={() => handleSwitchChange('is_equipment', false)}
                      className="form-radio text-blue-600"
                    />
                    <span>Para Suministros</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="categoryType"
                      checked={formData.is_equipment === true}
                      onChange={() => handleSwitchChange('is_equipment', true)}
                      className="form-radio text-blue-600"
                    />
                    <span>Para Equipos</span>
                  </label>
                </div>
              </div>
            )}

            {modalType === 'location' && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Tipo de Ubicación</h4>
                <Switch
                  checked={formData.is_external === true}
                  onChange={(checked) => handleSwitchChange('is_external', checked)}
                  size="md"
                  variant={formData.is_external ? 'warning' : 'default'} // ✅ Usar variant válido
                  onLabel="Ubicación Externa"
                  offLabel="Ubicación Interna"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.is_external 
                    ? 'Ubicación fuera de las instalaciones principales'
                    : 'Ubicación dentro de las instalaciones'
                  }
                </p>
              </div>
            )}

            {modalType === 'supplier' && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Información de Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DashboardTextInput
                    id="contact_person"
                    name="contact_person"
                    label="Persona de Contacto"
                    value={formData.contact_person || ''}
                    onChange={handleInputChange}
                    placeholder="Nombre del contacto"
                    maxLength={100}
                  />

                  <DashboardTextInput
                    id="phone"
                    name="phone"
                    label="Teléfono"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Número de teléfono"
                    maxLength={20}
                  />

                  <DashboardTextInput
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    placeholder="correo@proveedor.com"
                    maxLength={100}
                  />
                </div>

                <div className="mt-4">
                  <DashboardTextArea
                    id="address"
                    name="address"
                    label="Dirección"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    placeholder="Dirección completa del proveedor"
                    rows={2}
                    maxLength={500}
                  />
                </div>
              </div>
            )}
          </div>
        </DashboardModal>
      </div>
    </DashboardLayout>
  );
};

export default InventorySettingsPage;