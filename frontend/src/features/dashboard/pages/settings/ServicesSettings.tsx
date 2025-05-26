// src/features/dashboard/pages/settings/ServicesSettings.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ConfigPageHeader from '../../components/config/ConfigPageHeader';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardPlaceholder, { NoPermissionPlaceholder, ErrorPlaceholder } from '../../components/ui/DashboardPlaceholder';
import ServiceForm, { ServiceFormData } from '../../components/config/ServiceForm';
import TemplateForm, { TemplateFormData } from '../../components/config/TemplateForm';
import Badge from '../../components/ui/Badge';
import { servicesService, serviceTemplatesService } from '../../../../services';
import { Service } from '../../../../services/services.service';
import { ServiceTemplate } from '../../../../services/serviceTemplates.service';
import { usePermissions } from '../../../../hooks/usePermissions';
import { 
  PlusIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ServicesSettings: React.FC = () => {
  // 🎯 Usar el nuevo hook de permisos
  const { 
    canView,
    isLoading: permissionsLoading, 
    error: permissionsError 
  } = usePermissions();
  
  // 🎯 Verificaciones de permisos específicas
  const canViewServices = canView('service');
  const canViewTemplates = canView('template');
  
  // Determinar la pestaña inicial basada en permisos
  const getInitialTab = () => {
    if (canViewServices) return 'services';
    if (canViewTemplates) return 'templates';
    return 'services';
  };
  
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'services' | 'templates'>(getInitialTab());
  
  // Estado para servicios y plantillas
  const [services, setServices] = useState<Service[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  
  // Estado para modales de servicios
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  // Estado para modales de plantillas
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [isDeleteTemplateModalOpen, setIsDeleteTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ServiceTemplate | null>(null);
  
  // Estado para operaciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 🎯 Verificación de permisos mejorada
  const hasAnyPermission = canViewServices || canViewTemplates;
  
  // 🎯 Función para cargar servicios desde la API (ÚNICA VERSIÓN)
  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await servicesService.getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los servicios');
      console.error('Error al cargar servicios:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 🎯 Función para cargar plantillas desde la API (ÚNICA VERSIÓN)
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await serviceTemplatesService.getServiceTemplates();
      
      const enrichedTemplates = await Promise.all(
        data.map(async (template) => {
          try {
            const serviceRelations = await serviceTemplatesService.getTemplateServiceRelations(template.id!);
            
            return {
              ...template,
              services: serviceRelations.map(rel => ({
                id: rel.service_id,
                name: '',
                description: '',
                icon_name: '',
                sub_services: []
              }))
            };
          } catch (error) {
            console.warn(`No se pudieron cargar servicios para plantilla ${template.id}:`, error);
            return {
              ...template,
              services: []
            };
          }
        })
      );
      
      setTemplates(enrichedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las plantillas');
      console.error('Error al cargar plantillas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cargar datos al montar el componente o cambiar de pestaña
  useEffect(() => {
    if (activeTab === 'services' && canViewServices) {
      fetchServices();
    } else if (activeTab === 'templates' && canViewTemplates) {
      fetchTemplates();
    }
  }, [activeTab, canViewServices, canViewTemplates, fetchServices, fetchTemplates]);

  // 🎯 TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER EARLY RETURN

  // 🎯 Ahora sí podemos hacer early returns después de todos los hooks
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Cargando permisos...</span>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <ErrorPlaceholder
        title="Error al cargar permisos"
        description={permissionsError}
        onRetry={() => window.location.reload()}
        size="md"
      />
    );
  }

  if (!hasAnyPermission) {
    return (
      <NoPermissionPlaceholder
        title="Acceso Restringido"
        description="No tienes permisos para acceder a la gestión de servicios y plantillas."
        size="md"
      >
        <p className="text-xs text-gray-400 mt-2">
          Permisos requeridos: service_view o template_view
        </p>
      </NoPermissionPlaceholder>
    );
  }

  // 🎯 NO HAY MÁS FUNCIONES DUPLICADAS AQUÍ

  const fetchTemplateDetails = async (templateId: number) => {
    setIsSubmitting(true);
    try {
      const template = await serviceTemplatesService.getServiceTemplateById(templateId);
      const tempServiceRelations = await serviceTemplatesService.getTemplateServiceRelations(templateId);
      const tempSubServiceRelations = await serviceTemplatesService.getTemplateSubServiceRelations(templateId);
      
      const enrichedTemplate = {
        ...template,
        services: tempServiceRelations.map(rel => 
          services.find(s => s.id === rel.service_id) || { 
            id: rel.service_id, 
            name: `Servicio ${rel.service_id}`,
            sub_services: []
          }
        ),
        subservices: tempSubServiceRelations,
        service_selections: tempServiceRelations.map(rel => ({
          service_id: rel.service_id,
          sub_service_ids: tempSubServiceRelations
            .filter(sub => sub.service_id === rel.service_id)
            .map(sub => sub.id)
        }))
      };
      
      setCurrentTemplate(enrichedTemplate);
      setIsEditTemplateModalOpen(true);
    } catch (err) {
      console.error('Error al cargar detalles de plantilla:', err);
      setModalError(err instanceof Error ? err.message : 'Error al cargar detalles de la plantilla');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 🎯 HANDLERS PARA SERVICIOS - Simplificados sin verificaciones manuales
  const handleAddService = () => {
    setModalError(null);
    setSuccessMessage(null);
    setIsAddServiceModalOpen(true);
  };
  
  const handleEditService = (service: Service) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentService(service);
    setIsEditServiceModalOpen(true);
  };
  
  const handleDeleteServiceClick = (service: Service) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentService(service);
    setIsDeleteServiceModalOpen(true);
  };
  
  const handleDeleteService = async () => {
    if (!currentService || !currentService.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await servicesService.deleteService(currentService.id);
      
      setServices(services.filter(s => s.id !== currentService.id));
      setSuccessMessage("Servicio eliminado correctamente");
      
      setTimeout(() => {
        setIsDeleteServiceModalOpen(false);
        setCurrentService(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar el servicio');
      console.error('Error al eliminar servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddServiceSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const serviceData = {
        name: data.name,
        description: data.description,
        icon_name: data.iconName,
        sub_services: data.subServices.map(sub => ({
          name: sub.name,
          description: sub.description
        }))
      };
      
      const newService = await servicesService.createService(serviceData);
      
      setServices([...services, newService]);
      setSuccessMessage("Servicio creado correctamente");
      
      setTimeout(() => {
        setIsAddServiceModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear el servicio');
      console.error('Error al crear servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditServiceSubmit = async (data: ServiceFormData) => {
    if (!currentService || !currentService.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const serviceUpdateData = {
        name: data.name,
        description: data.description,
        icon_name: data.iconName
      };
      
      const updatedService = await servicesService.updateService(
        currentService.id, 
        serviceUpdateData
      );
      
      setServices(services.map(s => s.id === currentService.id ? updatedService : s));
      
      // Manejar cambios en los sub-servicios
      const existingSubServiceIds = new Set(currentService.sub_services.map(sub => sub.id));
      const newSubServiceIds = new Set(
        data.subServices
          .filter(sub => sub.id !== undefined)
          .map(sub => sub.id)
      );
      
      const subServicesToDelete = currentService.sub_services.filter(
        sub => sub.id && !newSubServiceIds.has(sub.id)
      );
      
      const subServicesToAdd = data.subServices.filter(sub => !sub.id);
      
      const subServicesToUpdate = data.subServices.filter(
        sub => sub.id && existingSubServiceIds.has(sub.id)
      );
      
      // Ejecutar las operaciones
      for (const subService of subServicesToDelete) {
        if (subService.id) {
          await servicesService.deleteSubService(subService.id);
        }
      }
      
      for (const subService of subServicesToAdd) {
        if (currentService.id) {
          await servicesService.addSubService(currentService.id, {
            name: subService.name,
            description: subService.description
          });
        }
      }
      
      for (const subService of subServicesToUpdate) {
        if (subService.id) {
          await servicesService.updateSubService(subService.id, {
            name: subService.name,
            description: subService.description
          });
        }
      }
      
      await fetchServices(); // 🎯 Usar la función definida arriba
      setSuccessMessage("Servicio actualizado correctamente");
      
      setTimeout(() => {
        setIsEditServiceModalOpen(false);
        setCurrentService(null);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar el servicio');
      console.error('Error al actualizar servicio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 🎯 HANDLERS PARA PLANTILLAS - Simplificados sin verificaciones manuales
  const handleAddTemplate = () => {
    setModalError(null);
    setSuccessMessage(null);
    setIsAddTemplateModalOpen(true);
  };
  
  const handleEditTemplate = (template: ServiceTemplate) => {
    setModalError(null);
    setSuccessMessage(null);
    fetchTemplateDetails(template.id!);
  };
  
  const handleDeleteTemplateClick = (template: ServiceTemplate) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentTemplate(template);
    setIsDeleteTemplateModalOpen(true);
  };
  
  const handleDeleteTemplate = async () => {
    if (!currentTemplate || !currentTemplate.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await serviceTemplatesService.deleteServiceTemplate(currentTemplate.id);
      
      setTemplates(templates.filter(t => t.id !== currentTemplate.id));
      setSuccessMessage("Plantilla eliminada correctamente");
      
      setTimeout(() => {
        setIsDeleteTemplateModalOpen(false);
        setCurrentTemplate(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar la plantilla');
      console.error('Error al eliminar plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddTemplateSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const templateData = {
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        service_selections: data.serviceSelections.map(sel => ({
          service_id: sel.serviceId,
          sub_service_ids: sel.subServiceIds
        }))
      };
      
      await serviceTemplatesService.createServiceTemplate(templateData);
      await fetchTemplates(); // 🎯 Usar la función definida arriba
      setSuccessMessage("Plantilla creada correctamente");
      
      setTimeout(() => {
        setIsAddTemplateModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear la plantilla');
      console.error('Error al crear plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditTemplateSubmit = async (data: TemplateFormData) => {
    if (!currentTemplate || !currentTemplate.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const templateData = {
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        service_selections: data.serviceSelections.map(sel => ({
          service_id: sel.serviceId,
          sub_service_ids: sel.subServiceIds
        }))
      };
      
      await serviceTemplatesService.updateServiceTemplate(
        currentTemplate.id, 
        templateData
      );
      
      await fetchTemplates(); // 🎯 Usar la función definida arriba
      setSuccessMessage("Plantilla actualizada correctamente");
      
      setTimeout(() => {
        setIsEditTemplateModalOpen(false);
        setCurrentTemplate(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar la plantilla');
      console.error('Error al actualizar plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estadísticas para el header
  const stats = activeTab === 'services' ? [
    {
      label: 'Total Servicios',
      value: services.length,
      variant: 'default' as const
    },
    {
      label: 'Total Subservicios',
      value: services.reduce((acc, service) => acc + service.sub_services.length, 0),
      variant: 'success' as const
    },
    {
      label: 'Con Icono',
      value: services.filter(s => s.icon_name && s.icon_name.trim().length > 0).length,
      variant: 'success' as const
    }
  ] : [
    {
      label: 'Total Plantillas',
      value: templates.length,
      variant: 'default' as const
    },
    {
      label: 'Públicas',
      value: templates.filter(t => t.is_public).length,
      variant: 'success' as const
    },
    {
      label: 'Privadas',
      value: templates.filter(t => !t.is_public).length,
      variant: 'warning' as const
    }
  ];

  // Configurar tabs
  const tabs = [
    canViewServices && {
      id: 'services',
      label: 'Servicios',
      count: services.length,
      isActive: activeTab === 'services',
      onClick: () => setActiveTab('services'),
      icon: <WrenchScrewdriverIcon className="h-4 w-4" />
    },
    canViewTemplates && {
      id: 'templates',
      label: 'Plantillas',
      count: templates.length,
      isActive: activeTab === 'templates',
      onClick: () => setActiveTab('templates'),
      icon: <ClipboardDocumentListIcon className="h-4 w-4" />
    }
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
  }>;
  
  // Columnas para la tabla de servicios
  const serviceColumns = [
    {
      header: 'Nombre',
      accessor: (service: Service) => (
        <div>
          <div className="font-medium text-gray-900">{service.name}</div>
          <div className="text-sm text-gray-500 break-words">
            {service.description || 'Sin descripción'}
          </div>
        </div>
      )
    },
    {
      header: 'Icono',
      accessor: (service: Service) => (
        service.icon_name ? 
          <Badge variant="primary">{service.icon_name}</Badge> : 
          <span className="text-gray-400 text-sm italic">Sin icono</span>
      )
    },
    {
      header: 'Subservicios',
      accessor: (service: Service) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            {service.sub_services.length}
          </span>
          {service.sub_services.length > 0 && (
            <span className="text-xs text-gray-500">subservicios</span>
          )}
        </div>
      )
    }
  ];
  
  // Columnas para la tabla de plantillas
  const templateColumns = [
    {
      header: 'Nombre',
      accessor: (template: ServiceTemplate) => (
        <div>
          <div className="font-medium text-gray-900">{template.name}</div>
          <div className="text-sm text-gray-500 break-words">
            {template.description || 'Sin descripción'}
          </div>
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: (template: ServiceTemplate) => (
        template.is_public ? 
          <Badge variant="success">Pública</Badge> : 
          <Badge variant="secondary">Privada</Badge>
      )
    },
    {
      header: 'Servicios',
      accessor: (template: ServiceTemplate) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
            {template.services ? template.services.length : 0}
          </span>
          {template.services && template.services.length > 0 && (
            <span className="text-xs text-gray-500">servicios</span>
          )}
        </div>
      )
    }
  ];

  // 🎯 Renderizar acciones para servicios con permisos automáticos
  const renderServiceActions = (service: Service) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        permissionCategory="service"
        permissionAction="edit"
        variant="text"
        size="sm"
        onClick={() => handleEditService(service)}
        className="text-blue-600 hover:text-blue-900"
        leftIcon={<PencilIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Editar
      </DashboardButton>
      
      <DashboardButton
        permissionCategory="service"
        permissionAction="delete"
        variant="text"
        size="sm"
        onClick={() => handleDeleteServiceClick(service)}
        className="text-red-600 hover:text-red-900"
        leftIcon={<TrashIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Eliminar
      </DashboardButton>
    </div>
  );

  // 🎯 Renderizar acciones para plantillas con permisos automáticos
  const renderTemplateActions = (template: ServiceTemplate) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        permissionCategory="template"
        permissionAction="edit"
        variant="text"
        size="sm"
        onClick={() => handleEditTemplate(template)}
        className="text-blue-600 hover:text-blue-900"
        leftIcon={<PencilIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Editar
      </DashboardButton>
      
      <DashboardButton
        permissionCategory="template"
        permissionAction="delete"
        variant="text"
        size="sm"
        onClick={() => handleDeleteTemplateClick(template)}
        className="text-red-600 hover:text-red-900"
        leftIcon={<TrashIcon className="h-4 w-4" />}
        showPermissionTooltip={true}
      >
        Eliminar
      </DashboardButton>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <ConfigPageHeader
        title="Servicios y Plantillas"
        subtitle="Gestiona los servicios disponibles y las plantillas de servicio del sistema"
        icon={<WrenchScrewdriverIcon className="h-6 w-6" />}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={activeTab === 'services' ? fetchServices : fetchTemplates}
        stats={!isLoading ? stats : undefined}
        tabs={tabs}
        actionButton={
          activeTab === 'services' ? (
            <DashboardButton
              permissionCategory="service"
              permissionAction="create"
              onClick={handleAddService}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              disabled={isLoading}
              className="w-full sm:w-auto"
              showPermissionTooltip={true}
            >
              <span className="hidden sm:inline">Agregar Servicio</span>
              <span className="sm:hidden">Nuevo</span>
            </DashboardButton>
          ) : (
            <DashboardButton
              permissionCategory="template"
              permissionAction="create"
              onClick={handleAddTemplate}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              disabled={isLoading}
              className="w-full sm:w-auto"
              showPermissionTooltip={true}
            >
              <span className="hidden sm:inline">Crear Plantilla</span>
              <span className="sm:hidden">Nueva</span>
            </DashboardButton>
          )
        }
      />

      {/* Contenido principal */}
      {error ? (
        <ErrorPlaceholder
          title={`Error al cargar ${activeTab === 'services' ? 'servicios' : 'plantillas'}`}
          description={error}
          onRetry={activeTab === 'services' ? fetchServices : fetchTemplates}
          size="sm"
          showBackground={false}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* 🎯 Renderizar tabla específica según pestaña activa */}
          {activeTab === 'services' ? (
            <DashboardDataTable
              columns={serviceColumns}
              data={services}
              keyExtractor={(item) => item.id?.toString() || ''}
              actionColumn={true}
              emptyMessage=""
              isLoading={isLoading}
              renderActions={renderServiceActions}
              striped={true}
              hover={true}
            />
          ) : (
            <DashboardDataTable
              columns={templateColumns}
              data={templates}
              keyExtractor={(item) => item.id?.toString() || ''}
              actionColumn={true}
              emptyMessage=""
              isLoading={isLoading}
              renderActions={renderTemplateActions}
              striped={true}
              hover={true}
            />
          )}
          
          {/* Empty state */}
          {!isLoading && !error && (
            (activeTab === 'services' && services.length === 0) || 
            (activeTab === 'templates' && templates.length === 0)
          ) && (
            <div className="p-8">
              <DashboardPlaceholder
                type="empty"
                title={`No hay ${activeTab === 'services' ? 'servicios' : 'plantillas'}`}
                description={`No hay ${activeTab === 'services' ? 'servicios' : 'plantillas'} configurados. Crea ${activeTab === 'services' ? 'el primer servicio' : 'la primera plantilla'} para empezar.`}
                size="sm"
                showBackground={false}
                primaryAction={{
                  label: `Crear ${activeTab === 'services' ? 'Primer Servicio' : 'Primera Plantilla'}`,
                  onClick: activeTab === 'services' ? handleAddService : handleAddTemplate,
                  icon: <PlusIcon className="h-4 w-4" />
                }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* 🎯 Modales para Servicios */}
      <DashboardModal
        isOpen={isAddServiceModalOpen}
        onClose={() => {
          setIsAddServiceModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Agregar Servicio"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        <ServiceForm
          onSubmit={handleAddServiceSubmit}
          onCancel={() => setIsAddServiceModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      <DashboardModal
        isOpen={isEditServiceModalOpen}
        onClose={() => {
          setIsEditServiceModalOpen(false);
          setCurrentService(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar Servicio"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        {currentService && (
          <ServiceForm
            initialData={{
              name: currentService.name,
              description: currentService.description || '',
              iconName: currentService.icon_name || '',
              subServices: currentService.sub_services.map(sub => ({
                id: sub.id,
                name: sub.name,
                description: sub.description || ''
              }))
            }}
            onSubmit={handleEditServiceSubmit}
            onCancel={() => {
              setIsEditServiceModalOpen(false);
              setCurrentService(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>

      {/* 🎯 Modal de eliminación de servicios con permisos automáticos */}
      <DashboardModal
        isOpen={isDeleteServiceModalOpen}
        onClose={() => {
          setIsDeleteServiceModalOpen(false);
          setCurrentService(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
        success={successMessage}
      >
        <div className="py-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
              <TrashIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                ¿Eliminar servicio "{currentService?.name}"?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Esta acción también eliminará todos los subservicios asociados y no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteServiceModalOpen(false);
              setCurrentService(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          
          {/* 🎯 Botón eliminar con permisos automáticos */}
          <DashboardButton
            permissionCategory="service"
            permissionAction="delete"
            onClick={handleDeleteService}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<TrashIcon className="h-4 w-4" />}
            showPermissionTooltip={true}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
      
      {/* 🎯 Modales para Plantillas */}
      <DashboardModal
        isOpen={isAddTemplateModalOpen}
        onClose={() => {
          setIsAddTemplateModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Crear Plantilla de Servicios"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        <TemplateForm
          services={services}
          onSubmit={handleAddTemplateSubmit}
          onCancel={() => setIsAddTemplateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      <DashboardModal
        isOpen={isEditTemplateModalOpen}
        onClose={() => {
          setIsEditTemplateModalOpen(false);
          setCurrentTemplate(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar Plantilla de Servicios"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        {currentTemplate && (
          <TemplateForm
            services={services}
            initialData={{
              name: currentTemplate.name,
              description: currentTemplate.description || '',
              isPublic: currentTemplate.is_public,
              serviceSelections: 
                currentTemplate.service_selections 
                  ? currentTemplate.service_selections.map(sel => ({
                      serviceId: sel.service_id,
                      subServiceIds: sel.sub_service_ids || []
                    }))
                  : currentTemplate.services 
                      ? currentTemplate.services.map(service => {
                          let subServiceIds: number[] = [];
                          
                          if (currentTemplate.subservices && Array.isArray(currentTemplate.subservices)) {
                            subServiceIds = currentTemplate.subservices
                              .filter(sub => sub.service_id === service.id)
                              .map(sub => sub.id!)
                              .filter(Boolean);
                          }
                          
                          return {
                            serviceId: service.id!,
                            subServiceIds: subServiceIds
                          };
                        })
                      : []
            }}
            onSubmit={handleEditTemplateSubmit}
            onCancel={() => {
              setIsEditTemplateModalOpen(false);
              setCurrentTemplate(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DashboardModal>

      {/* 🎯 Modal de eliminación de plantillas con permisos automáticos */}
      <DashboardModal
        isOpen={isDeleteTemplateModalOpen}
        onClose={() => {
          setIsDeleteTemplateModalOpen(false);
          setCurrentTemplate(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
        success={successMessage}
      >
        <div className="py-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
              <TrashIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                ¿Eliminar plantilla "{currentTemplate?.name}"?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Esta acción no se puede deshacer.
              </p>
              
              {/* Información adicional de la plantilla */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <span className="ml-2">
                      {currentTemplate?.is_public ? 
                        <Badge variant="success" size="sm">Pública</Badge> : 
                        <Badge variant="secondary" size="sm">Privada</Badge>
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Servicios:</span>
                    <span className="ml-2 text-gray-900">
                      {currentTemplate?.services?.length || 0} servicios
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteTemplateModalOpen(false);
              setCurrentTemplate(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          
          {/* 🎯 Botón eliminar con permisos automáticos */}
          <DashboardButton
            permissionCategory="template"
            permissionAction="delete"
            onClick={handleDeleteTemplate}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<TrashIcon className="h-4 w-4" />}
            showPermissionTooltip={true}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default ServicesSettings;