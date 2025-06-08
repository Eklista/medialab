import React, { useState, useEffect } from 'react';
import { 
  UserIcon,
  CheckIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Importar componentes UI
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardTextInput from '../../components/ui/DashboardTextInput';
import DashboardTextArea from '../../components/ui/DashboardTextArea';
import DashboardSelect from '../../components/ui/DashboardSelect';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import Badge from '../../components/ui/Badge';
import DashboardTabs, { useDashboardTabs } from '../../components/ui/DashboardTabs';
import DashboardCheckbox from '../../components/ui/DashboardCheckbox';

// Importar hooks y tipos
import { useEquipmentList } from '../../../../services/inventory/hooks';
import type { 
  EquipmentWithDetails 
} from '../../../../services/inventory/types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: EquipmentWithDetails | null; // Si se pasa, es asignación individual
  onSuccess?: (equipment: EquipmentWithDetails | EquipmentWithDetails[]) => void;
  onError?: (error: string) => void;
  mode?: 'single' | 'bulk'; // Modo individual o masivo
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  position?: string;
  fullName: string;
  hasActiveAssignments?: boolean;
  assignmentCount?: number;
}

interface AssignmentFormData {
  user_id: string;
  equipment_ids: number[];
  notes: string;
  delivery_date: string;
  return_expected: boolean;
  return_date: string;
}

interface AssignmentFormErrors {
  user_id?: string;
  equipment_ids?: string;
  general?: string;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  equipment = null,
  onSuccess,
  onError,
  mode = 'single'
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState<AssignmentFormData>({
    user_id: '',
    equipment_ids: equipment ? [equipment.id] : [],
    notes: '',
    delivery_date: new Date().toISOString().split('T')[0],
    return_expected: false,
    return_date: ''
  });

  const [errors, setErrors] = useState<AssignmentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithDetails[]>(
    equipment ? [equipment] : []
  );

  // Hooks
  const { equipment: availableEquipment, isLoading: loadingEquipment } = useEquipmentList();
  const { activeTabId, createTab } = useDashboardTabs('available');

  // Datos simulados de usuarios (en producción vendrían de un hook de usuarios)
  const allUsers: User[] = [
    {
      id: 1,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@medialab.gt',
      department: 'Desarrollo',
      position: 'Developer Senior',
      fullName: 'Juan Pérez',
      hasActiveAssignments: true,
      assignmentCount: 3
    },
    {
      id: 2,
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@medialab.gt',
      department: 'Diseño',
      position: 'UI/UX Designer',
      fullName: 'María García',
      hasActiveAssignments: false,
      assignmentCount: 0
    },
    {
      id: 3,
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@medialab.gt',
      department: 'Desarrollo',
      position: 'Frontend Developer',
      fullName: 'Carlos López',
      hasActiveAssignments: true,
      assignmentCount: 2
    },
    {
      id: 4,
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@medialab.gt',
      department: 'Administración',
      position: 'Project Manager',
      fullName: 'Ana Martínez',
      hasActiveAssignments: false,
      assignmentCount: 0
    },
    {
      id: 5,
      firstName: 'Luis',
      lastName: 'González',
      email: 'luis.gonzalez@medialab.gt',
      department: 'Desarrollo',
      position: 'Backend Developer',
      fullName: 'Luis González',
      hasActiveAssignments: true,
      assignmentCount: 1
    }
  ];

  // Filtrar usuarios por búsqueda
  const filteredUsers = allUsers.filter(user =>
    user.fullName.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Filtrar equipos disponibles (operativos y sin asignar)
  const filteredEquipment = React.useMemo(() => {
    const operational = availableEquipment.filter(eq => 
      eq.state?.is_operational && !eq.assigned_user_id
    );

    switch (activeTabId) {
      case 'available':
        return operational;
      case 'selected':
        return selectedEquipment;
      default:
        return operational;
    }
  }, [activeTabId, availableEquipment, selectedEquipment]);

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '',
        equipment_ids: equipment ? [equipment.id] : [],
        notes: '',
        delivery_date: new Date().toISOString().split('T')[0],
        return_expected: false,
        return_date: ''
      });
      setSelectedEquipment(equipment ? [equipment] : []);
      setErrors({});
      setIsSubmitting(false);
      setSubmitSuccess(false);
      setSearchUser('');
    }
  }, [isOpen, equipment]);

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: AssignmentFormErrors = {};

    if (!formData.user_id) {
      newErrors.user_id = 'Debe seleccionar un usuario';
    }

    if (formData.equipment_ids.length === 0) {
      newErrors.equipment_ids = 'Debe seleccionar al menos un equipo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name as keyof AssignmentFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof AssignmentFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Manejar selección de equipos
  const handleEquipmentSelect = (equipment: EquipmentWithDetails, selected: boolean) => {
    if (selected) {
      setSelectedEquipment(prev => [...prev, equipment]);
      setFormData(prev => ({
        ...prev,
        equipment_ids: [...prev.equipment_ids, equipment.id]
      }));
    } else {
      setSelectedEquipment(prev => prev.filter(eq => eq.id !== equipment.id));
      setFormData(prev => ({
        ...prev,
        equipment_ids: prev.equipment_ids.filter(id => id !== equipment.id)
      }));
    }
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Simular llamada al API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // En producción, aquí llamarías a tu servicio de asignación
      // const result = await assignEquipment(formData.equipment_ids, parseInt(formData.user_id), formData.notes);

      setSubmitSuccess(true);
      
      setTimeout(() => {
        onSuccess?.(mode === 'single' ? selectedEquipment[0] : selectedEquipment);
        onClose();
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al asignar equipos';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configuración de columnas para equipos disponibles
  const equipmentColumns = [
    {
      header: 'Seleccionar',
      accessor: ((eq: EquipmentWithDetails) => (
        <DashboardCheckbox
          id={`eq-${eq.id}`}
          checked={formData.equipment_ids.includes(eq.id)}
          onChange={(checked) => handleEquipmentSelect(eq, checked)}
        />
      )) as any,
      width: '80px'
    },
    {
      header: 'Equipo',
      accessor: ((eq: EquipmentWithDetails) => (
        <div>
          <div className="font-medium text-gray-900">
            {eq.codigo_ug || `Equipo #${eq.id}`}
          </div>
          <div className="text-sm text-gray-500">
            {eq.marca} {eq.modelo}
          </div>
        </div>
      )) as any
    },
    {
      header: 'Categoría',
      accessor: ((eq: EquipmentWithDetails) => eq.category?.name || '-') as any,
      width: '120px'
    },
    {
      header: 'Estado',
      accessor: ((eq: EquipmentWithDetails) => (
        <Badge 
          variant={eq.state?.is_operational ? 'success' : 'danger'}
          size="sm"
        >
          {eq.state?.name || 'Sin estado'}
        </Badge>
      )) as any,
      width: '100px'
    },
    {
      header: 'Ubicación',
      accessor: ((eq: EquipmentWithDetails) => eq.location?.name || '-') as any,
      width: '120px'
    }
  ];

  // Opciones para select de usuarios
  const userOptions = filteredUsers.map(user => ({
    value: user.id.toString(),
    label: `${user.fullName} - ${user.department}`
  }));

  // Usuario seleccionado
  const selectedUser = allUsers.find(user => user.id.toString() === formData.user_id);

  // Configurar pestañas
  const tabs = [
    createTab('available', 'Disponibles', { 
      count: availableEquipment.filter(eq => eq.state?.is_operational && !eq.assigned_user_id).length,
      icon: <ComputerDesktopIcon className="h-4 w-4" />
    }),
    createTab('selected', 'Seleccionados', { 
      count: selectedEquipment.length,
      icon: <CheckIcon className="h-4 w-4" />,
      badge: selectedEquipment.length > 0 ? (
        <Badge variant="primary" size="sm">{selectedEquipment.length}</Badge>
      ) : undefined
    })
  ];

  const modalTitle = mode === 'single' 
    ? `Asignar Equipo${equipment ? ` - ${equipment.codigo_ug || equipment.id}` : ''}` 
    : 'Asignación Masiva de Equipos';

  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      error={errors.general}
      success={submitSuccess ? `Equipo${selectedEquipment.length > 1 ? 's' : ''} asignado${selectedEquipment.length > 1 ? 's' : ''} exitosamente` : null}
      footer={
        <div className="flex justify-between w-full">
          {/* Resumen de selección */}
          <div className="flex items-center gap-3">
            {selectedEquipment.length > 0 && (
              <Badge variant="primary" size="md">
                {selectedEquipment.length} equipo{selectedEquipment.length > 1 ? 's' : ''} seleccionado{selectedEquipment.length > 1 ? 's' : ''}
              </Badge>
            )}
            
            {selectedUser && (
              <Badge variant="secondary" size="md">
                Para: {selectedUser.fullName}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-3">
            <DashboardButton
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </DashboardButton>
            
            <DashboardButton
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || submitSuccess || selectedEquipment.length === 0}
              leftIcon={<CheckIcon className="h-4 w-4" />}
            >
              Asignar Equipos
            </DashboardButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Selección de usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DashboardSelect
              id="user_id"
              name="user_id"
              label="Usuario Destinatario"
              value={formData.user_id}
              onChange={handleSelectChange}
              options={userOptions}
              placeholder="Seleccionar usuario"
              required
              error={errors.user_id}
              customDropdown={true}
              searchable={true}
            />
            
            {selectedUser && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <UserIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">{selectedUser.fullName}</h4>
                    <p className="text-sm text-blue-700">{selectedUser.email}</p>
                    <p className="text-sm text-blue-600">{selectedUser.department} • {selectedUser.position}</p>
                    {selectedUser.hasActiveAssignments && (
                      <div className="flex items-center gap-1 mt-1">
                        <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          Tiene {selectedUser.assignmentCount} asignación{selectedUser.assignmentCount !== 1 ? 'es' : ''} activa{selectedUser.assignmentCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <DashboardTextInput
              id="delivery_date"
              name="delivery_date"
              label="Fecha de Entrega"
              type="date"
              value={formData.delivery_date}
              onChange={handleInputChange}
              required
              helperText="Fecha en que se entregará el equipo"
            />
          </div>
        </div>

        {/* Selección de equipos (solo en modo bulk o si no se pasó equipo específico) */}
        {(mode === 'bulk' || !equipment) && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Seleccionar Equipos</h3>
              
              {/* Pestañas */}
              <DashboardTabs
                tabs={tabs}
                variant="underline"
                isLoading={loadingEquipment}
              />
            </div>

            {/* Tabla de equipos */}
            <DashboardDataTable
              columns={equipmentColumns}
              data={filteredEquipment}
              keyExtractor={(eq) => eq.id.toString()}
              isLoading={loadingEquipment}
              emptyMessage={
                activeTabId === 'selected' 
                  ? "No hay equipos seleccionados" 
                  : "No hay equipos disponibles para asignar"
              }
              compact={true}
              className="max-h-60 overflow-y-auto"
            />

            {errors.equipment_ids && (
              <p className="mt-2 text-red-600 text-sm">{errors.equipment_ids}</p>
            )}
          </div>
        )}

        {/* Información del equipo (modo single) */}
        {mode === 'single' && equipment && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Equipo a Asignar</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Código:</span> {equipment.codigo_ug || equipment.id}
              </div>
              <div>
                <span className="font-medium">Marca/Modelo:</span> {equipment.marca} {equipment.modelo}
              </div>
              <div>
                <span className="font-medium">Categoría:</span> {equipment.category?.name}
              </div>
              <div>
                <span className="font-medium">Estado:</span> 
                <Badge variant={equipment.state?.is_operational ? 'success' : 'danger'} size="sm" className="ml-2">
                  {equipment.state?.name}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Opciones adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DashboardCheckbox
              id="return_expected"
              checked={formData.return_expected}
              onChange={(checked) => setFormData(prev => ({ ...prev, return_expected: checked }))}
              label="Devolución programada"
              description="El equipo debe ser devuelto en una fecha específica"
            />
            
            {formData.return_expected && (
              <div className="mt-3">
                <DashboardTextInput
                  id="return_date"
                  name="return_date"
                  label="Fecha de Devolución"
                  type="date"
                  value={formData.return_date}
                  onChange={handleInputChange}
                  min={formData.delivery_date}
                  helperText="Fecha programada para la devolución"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        <DashboardTextArea
          id="notes"
          name="notes"
          label="Notas de Asignación"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Propósito de uso, consideraciones especiales, instrucciones..."
          rows={3}
          maxLength={500}
          showCharCount
          helperText="Información adicional sobre la asignación"
        />

        {/* Advertencias */}
        {selectedUser?.hasActiveAssignments && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Asignaciones Activas</h4>
                <p className="text-sm text-yellow-700">
                  Este usuario ya tiene {selectedUser.assignmentCount} equipo{selectedUser.assignmentCount !== 1 ? 's' : ''} asignado{selectedUser.assignmentCount !== 1 ? 's' : ''}. 
                  Verifique que no exceda los límites establecidos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardModal>
  );
};

export default AssignmentModal;