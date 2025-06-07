// frontend/src/features/dashboard/inventory/equipment/EquipmentForm.tsx

import React, { useState, useEffect } from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardSelect from '../../components/ui/DashboardSelect';
import DashboardTextArea from '../../components/ui/DashboardTextArea';
import DashboardTabs, { DashboardTabPanel, useDashboardTabs } from '../../components/ui/DashboardTabs';
import Badge from '../../components/ui/Badge';
import { 
  ComputerDesktopIcon,
  InformationCircleIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  BeakerIcon,
  ScaleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// ===== TIPOS =====
interface EquipmentFormData {
  // Identificación
  codigo_ug?: string;
  numero_serie?: string;
  service_tag?: string;
  
  // Especificaciones
  marca?: string;
  modelo?: string;
  descripcion?: string;
  
  // Relaciones
  category_id: number | '';
  state_id: number | '';
  location_id: number | '';
  supplier_id?: number | '';
  
  // Fechas
  fecha_entrega?: string;
  numero_hoja_envio?: string;
  observaciones?: string;
  
  // Detalles de laboratorio (opcional)
  lab_details?: {
    numero_pc?: string;
    procesador?: string;
    memoria_ram?: string;
    capacidad_hdd?: string;
    monitor_serie?: string;
    monitor_codigo_ug?: string;
    fecha_recepcion_sega?: string;
    fecha_entrega_medialab?: string;
  };
}

interface ValidationErrors {
  [key: string]: string;
}

interface EquipmentFormProps {
  initialData?: Partial<EquipmentFormData>;
  isEditing?: boolean;
  isLoading?: boolean;
  onSubmit: (data: EquipmentFormData) => Promise<void>;
  onCancel: () => void;
  
  // Opciones para selects
  categories: Array<{ value: string; label: string; disabled?: boolean }>;
  states: Array<{ value: string; label: string; disabled?: boolean }>;
  locations: Array<{ value: string; label: string; disabled?: boolean }>;
  suppliers: Array<{ value: string; label: string; disabled?: boolean }>;
  
  // Configuración
  showLabDetails?: boolean;
  autoGenerateCode?: boolean;
  
  className?: string;
}

// ===== HELPERS =====
const validateForm = (data: EquipmentFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Campos requeridos
  if (!data.category_id) {
    errors.category_id = 'La categoría es requerida';
  }
  
  if (!data.state_id) {
    errors.state_id = 'El estado es requerido';
  }
  
  if (!data.location_id) {
    errors.location_id = 'La ubicación es requerida';
  }
  
  // Validaciones específicas
  if (data.codigo_ug && data.codigo_ug.length > 50) {
    errors.codigo_ug = 'El código UG no puede exceder 50 caracteres';
  }
  
  if (data.numero_serie && data.numero_serie.length > 100) {
    errors.numero_serie = 'El número de serie no puede exceder 100 caracteres';
  }
  
  if (data.service_tag && data.service_tag.length > 50) {
    errors.service_tag = 'El service tag no puede exceder 50 caracteres';
  }
  
  if (data.descripcion && data.descripcion.length > 500) {
    errors.descripcion = 'La descripción no puede exceder 500 caracteres';
  }
  
  if (data.observaciones && data.observaciones.length > 1000) {
    errors.observaciones = 'Las observaciones no pueden exceder 1000 caracteres';
  }
  
  return errors;
};

const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

// ===== COMPONENTE PRINCIPAL =====
const EquipmentForm: React.FC<EquipmentFormProps> = ({
  initialData = {},
  isEditing = false,
  isLoading = false,
  onSubmit,
  onCancel,
  categories,
  states,
  locations,
  suppliers,
  showLabDetails = false,
  autoGenerateCode = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<EquipmentFormData>({
    codigo_ug: '',
    numero_serie: '',
    service_tag: '',
    marca: '',
    modelo: '',
    descripcion: '',
    category_id: '',
    state_id: '',
    location_id: '',
    supplier_id: '',
    fecha_entrega: '',
    numero_hoja_envio: '',
    observaciones: '',
    lab_details: {
      numero_pc: '',
      procesador: '',
      memoria_ram: '',
      capacidad_hdd: '',
      monitor_serie: '',
      monitor_codigo_ug: '',
      fecha_recepcion_sega: '',
      fecha_entrega_medialab: ''
    },
    ...initialData
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { activeTabId, createTab } = useDashboardTabs('general');

  // Crear tabs
  const tabs = [
    createTab('general', 'Información General', {
      icon: <InformationCircleIcon className="h-4 w-4" />
    }),
    createTab('location', 'Ubicación y Asignación', {
      icon: <MapPinIcon className="h-4 w-4" />
    }),
    createTab('supplier', 'Proveedor y Documentación', {
      icon: <BuildingStorefrontIcon className="h-4 w-4" />
    }),
    ...(showLabDetails ? [
      createTab('lab', 'Detalles de Laboratorio', {
        icon: <BeakerIcon className="h-4 w-4" />
      })
    ] : [])
  ];

  // Efectos
  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(initialData));
  }, [formData, initialData]);

  // Manejadores
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLabDetailChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lab_details: {
        ...prev.lab_details,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('¿Estás seguro? Se perderán los cambios no guardados.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Auto-generar código
  const generateCode = () => {
    if (autoGenerateCode && formData.marca && formData.modelo) {
      const brand = formData.marca.substring(0, 3).toUpperCase();
      const model = formData.modelo.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-4);
      const code = `${brand}-${model}-${timestamp}`;
      handleInputChange('codigo_ug', code);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Header */}
      <DashboardCard>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Actualiza la información del equipo' : 'Registra un nuevo equipo en el inventario'}
              </p>
            </div>
          </div>
          
          {hasChanges && (
            <Badge variant="warning" size="sm">
              Cambios pendientes
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="p-4">
          <DashboardTabs
            tabs={tabs}
            variant="underline"
            size="md"
          />

          {/* Panel: Información General */}
          <DashboardTabPanel tabId="general" isActive={activeTabId === 'general'}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <DashboardTextInput
                      id="codigo_ug"
                      name="codigo_ug"
                      label="Código UG"
                      value={formData.codigo_ug || ''}
                      onChange={(e) => handleInputChange('codigo_ug', e.target.value)}
                      placeholder="Ej: DELL-LAT-2024"
                      error={errors.codigo_ug}
                      helperText="Código único de identificación del equipo"
                    />
                  </div>
                  {autoGenerateCode && (
                    <div className="flex items-end">
                      <DashboardButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateCode}
                        disabled={!formData.marca || !formData.modelo}
                      >
                        Generar
                      </DashboardButton>
                    </div>
                  )}
                </div>

                <DashboardTextInput
                  id="numero_serie"
                  name="numero_serie"
                  label="Número de Serie"
                  value={formData.numero_serie || ''}
                  onChange={(e) => handleInputChange('numero_serie', e.target.value)}
                  placeholder="Ej: ABC123456789"
                  error={errors.numero_serie}
                />

                <DashboardTextInput
                  id="service_tag"
                  name="service_tag"
                  label="Service Tag"
                  value={formData.service_tag || ''}
                  onChange={(e) => handleInputChange('service_tag', e.target.value)}
                  placeholder="Ej: 7XYZ123"
                  error={errors.service_tag}
                />

                <DashboardSelect
                  id="category_id"
                  name="category_id"
                  label="Categoría"
                  value={formData.category_id.toString()}
                  onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : '')}
                  options={[
                    { value: '', label: 'Seleccionar categoría' },
                    ...categories
                  ]}
                  required
                  error={errors.category_id}
                />
              </div>

              <div className="space-y-4">
                <DashboardTextInput
                  id="marca"
                  name="marca"
                  label="Marca"
                  value={formData.marca || ''}
                  onChange={(e) => handleInputChange('marca', e.target.value)}
                  placeholder="Ej: Dell, HP, Lenovo"
                  error={errors.marca}
                />

                <DashboardTextInput
                  id="modelo"
                  name="modelo"
                  label="Modelo"
                  value={formData.modelo || ''}
                  onChange={(e) => handleInputChange('modelo', e.target.value)}
                  placeholder="Ej: Latitude 5520, ThinkPad X1"
                  error={errors.modelo}
                />

                <DashboardTextArea
                  id="descripcion"
                  name="descripcion"
                  label="Descripción"
                  value={formData.descripcion || ''}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Descripción detallada del equipo..."
                  rows={4}
                  maxLength={500}
                  showCharCount
                  error={errors.descripcion}
                />
              </div>
            </div>
          </DashboardTabPanel>

          {/* Panel: Ubicación y Asignación */}
          <DashboardTabPanel tabId="location" isActive={activeTabId === 'location'}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DashboardSelect
                  id="state_id"
                  name="state_id"
                  label="Estado"
                  value={formData.state_id.toString()}
                  onChange={(e) => handleInputChange('state_id', e.target.value ? parseInt(e.target.value) : '')}
                  options={[
                    { value: '', label: 'Seleccionar estado' },
                    ...states
                  ]}
                  required
                  error={errors.state_id}
                />

                <DashboardSelect
                  id="location_id"
                  name="location_id"
                  label="Ubicación"
                  value={formData.location_id.toString()}
                  onChange={(e) => handleInputChange('location_id', e.target.value ? parseInt(e.target.value) : '')}
                  options={[
                    { value: '', label: 'Seleccionar ubicación' },
                    ...locations
                  ]}
                  required
                  error={errors.location_id}
                />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Información de Asignación</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    La asignación del equipo a un usuario se realizará después de crear el registro.
                    Esto permitirá llevar un historial completo de asignaciones.
                  </p>
                </div>
              </div>
            </div>
          </DashboardTabPanel>

          {/* Panel: Proveedor y Documentación */}
          <DashboardTabPanel tabId="supplier" isActive={activeTabId === 'supplier'}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DashboardSelect
                  id="supplier_id"
                  name="supplier_id"
                  label="Proveedor"
                  value={formData.supplier_id?.toString() || ''}
                  onChange={(e) => handleInputChange('supplier_id', e.target.value ? parseInt(e.target.value) : '')}
                  options={[
                    { value: '', label: 'Seleccionar proveedor (opcional)' },
                    ...suppliers
                  ]}
                  error={errors.supplier_id}
                />

                <DashboardTextInput
                  id="numero_hoja_envio"
                  name="numero_hoja_envio"
                  label="Número de Hoja de Envío"
                  value={formData.numero_hoja_envio || ''}
                  onChange={(e) => handleInputChange('numero_hoja_envio', e.target.value)}
                  placeholder="Ej: ENV-2024-001"
                  error={errors.numero_hoja_envio}
                />
              </div>

              <div className="space-y-4">
                <DashboardTextInput
                  id="fecha_entrega"
                  name="fecha_entrega"
                  label="Fecha de Entrega"
                  type="date"
                  value={formatDateForInput(formData.fecha_entrega)}
                  onChange={(e) => handleInputChange('fecha_entrega', e.target.value)}
                  error={errors.fecha_entrega}
                />

                <DashboardTextArea
                  id="observaciones"
                  name="observaciones"
                  label="Observaciones"
                  value={formData.observaciones || ''}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales sobre el equipo..."
                  rows={4}
                  maxLength={1000}
                  showCharCount
                  error={errors.observaciones}
                />
              </div>
            </div>
          </DashboardTabPanel>

          {/* Panel: Detalles de Laboratorio */}
          {showLabDetails && (
            <DashboardTabPanel tabId="lab" isActive={activeTabId === 'lab'}>
              <div className="mt-6">
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-900">Detalles Específicos de Laboratorio</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Esta sección es específica para equipos de cómputo que pasan por el proceso SEGA → Laboratorio → MediaLab.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Especificaciones Técnicas</h4>
                    
                    <DashboardTextInput
                      id="numero_pc"
                      name="numero_pc"
                      label="Número de PC"
                      value={formData.lab_details?.numero_pc || ''}
                      onChange={(e) => handleLabDetailChange('numero_pc', e.target.value)}
                      placeholder="Ej: PC-001"
                    />

                    <DashboardTextInput
                      id="procesador"
                      name="procesador"
                      label="Procesador"
                      value={formData.lab_details?.procesador || ''}
                      onChange={(e) => handleLabDetailChange('procesador', e.target.value)}
                      placeholder="Ej: Intel Core i5-10210U"
                    />

                    <DashboardTextInput
                      id="memoria_ram"
                      name="memoria_ram"
                      label="Memoria RAM"
                      value={formData.lab_details?.memoria_ram || ''}
                      onChange={(e) => handleLabDetailChange('memoria_ram', e.target.value)}
                      placeholder="Ej: 8GB DDR4"
                    />

                    <DashboardTextInput
                      id="capacidad_hdd"
                      name="capacidad_hdd"
                      label="Capacidad de Disco"
                      value={formData.lab_details?.capacidad_hdd || ''}
                      onChange={(e) => handleLabDetailChange('capacidad_hdd', e.target.value)}
                      placeholder="Ej: 256GB SSD"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Monitor y Fechas</h4>
                    
                    <DashboardTextInput
                      id="monitor_serie"
                      name="monitor_serie"
                      label="Serie del Monitor"
                      value={formData.lab_details?.monitor_serie || ''}
                      onChange={(e) => handleLabDetailChange('monitor_serie', e.target.value)}
                      placeholder="Ej: MON123456"
                    />

                    <DashboardTextInput
                      id="monitor_codigo_ug"
                      name="monitor_codigo_ug"
                      label="Código UG del Monitor"
                      value={formData.lab_details?.monitor_codigo_ug || ''}
                      onChange={(e) => handleLabDetailChange('monitor_codigo_ug', e.target.value)}
                      placeholder="Ej: MON-DELL-001"
                    />

                    <DashboardTextInput
                      id="fecha_recepcion_sega"
                      name="fecha_recepcion_sega"
                      label="Fecha Recepción SEGA"
                      type="date"
                      value={formatDateForInput(formData.lab_details?.fecha_recepcion_sega)}
                      onChange={(e) => handleLabDetailChange('fecha_recepcion_sega', e.target.value)}
                    />

                    <DashboardTextInput
                      id="fecha_entrega_medialab"
                      name="fecha_entrega_medialab"
                      label="Fecha Entrega MediaLab"
                      type="date"
                      value={formatDateForInput(formData.lab_details?.fecha_entrega_medialab)}
                      onChange={(e) => handleLabDetailChange('fecha_entrega_medialab', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </DashboardTabPanel>
          )}
        </div>
      </DashboardCard>

      {/* Acciones */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{Object.keys(errors).length} error(es) encontrado(s)</span>
            </div>
          )}
          
          {hasChanges && Object.keys(errors).length === 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Formulario válido</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <DashboardButton
            type="button"
            variant="outline"
            onClick={handleCancel}
            leftIcon={<XMarkIcon className="h-4 w-4" />}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            variant="primary"
            loading={isSubmitting || isLoading}
            leftIcon={<ScaleIcon className="h-4 w-4" />}
            disabled={!hasChanges || Object.keys(errors).length > 0}
          >
            {isEditing ? 'Actualizar' : 'Crear'} Equipo
          </DashboardButton>
        </div>
      </div>
    </form>
  );
};

export default EquipmentForm;