// src/features/dashboard/pages/settings/EmailTemplatesSettings.tsx
import React, { useState, useEffect } from 'react';
import ConfigPageHeader from '../../components/config/ConfigPageHeader';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardPlaceholder, { NoPermissionPlaceholder, ErrorPlaceholder } from '../../components/ui/DashboardPlaceholder';
import EmailTemplateForm, { EmailTemplateFormData } from '../../components/config/EmailTemplateForm';
import Badge from '../../components/ui/Badge';
import { emailTemplateService, EmailTemplate } from '../../../../services/emailTemplate.service';
import { useAuth } from '../../../auth/hooks/useAuth';
import { 
  PlusIcon, 
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

const EmailTemplatesSettings: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Verificar permisos
  const canView = hasPermission('email_template_view');
  const canCreate = hasPermission('email_template_create');
  const canEdit = hasPermission('email_template_edit');
  const canDelete = hasPermission('email_template_delete');

  // Estado para las plantillas
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  
  // Estado para operaciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    if (canView) {
      fetchEmailTemplates();
    }
  }, [canView]);
  
  // Función para cargar plantillas desde la API
  const fetchEmailTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await emailTemplateService.getEmailTemplates();
      setEmailTemplates(data);
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las plantillas de correo');
    } finally {
      setIsLoading(false);
    }
  };

  // Si no tiene permisos de visualización
  if (!canView) {
    return (
      <NoPermissionPlaceholder
        title="Acceso Restringido"
        description="No tienes permisos para acceder a la gestión de plantillas de correo."
        size="md"
      >
        <p className="text-xs text-gray-400 mt-2">
          Permiso requerido: email_template_view
        </p>
      </NoPermissionPlaceholder>
    );
  }
  
  // Handlers para plantillas
  const handleEditTemplate = (template: EmailTemplate) => {
    if (!canEdit) return;
    
    setModalError(null);
    setSuccessMessage(null);
    setCurrentTemplate(template);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteTemplate = (template: EmailTemplate) => {
    if (!canDelete) return;
    
    setModalError(null);
    setSuccessMessage(null);
    setCurrentTemplate(template);
    setIsDeleteModalOpen(true);
  };
  
  const handlePreviewTemplate = async (template: EmailTemplate) => {
    try {
      // Generar datos de prueba
      const context: Record<string, string> = {
        username: 'Usuario Ejemplo',
        project_name: 'MediaLab Sistema'
      };
      
      if (template.available_variables) {
        const variables = template.available_variables.split(',').map(v => v.trim());
        variables.forEach(variable => {
          context[variable] = `[${variable}]`;
        });
      }
      
      const result = await emailTemplateService.renderTemplate(template.code, context);
      setRenderedHtml(result.html);
      setCurrentTemplate(template);
      setIsPreviewModalOpen(true);
    } catch (err) {
      console.error('Error al renderizar plantilla:', err);
      setError(err instanceof Error ? err.message : 'Error al renderizar la plantilla');
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!currentTemplate) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await emailTemplateService.deleteEmailTemplate(currentTemplate.id);
      setEmailTemplates(prev => prev.filter(template => template.id !== currentTemplate.id));
      setSuccessMessage("Plantilla eliminada correctamente");
      
      setTimeout(() => {
        setIsDeleteModalOpen(false);
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
  
  const handleAddSubmit = async (data: EmailTemplateFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const newTemplate = await emailTemplateService.createEmailTemplate(data);
      setEmailTemplates(prev => [...prev, newTemplate]);
      setSuccessMessage("Plantilla creada correctamente");
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear la plantilla');
      console.error('Error al crear plantilla:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: EmailTemplateFormData) => {
    if (!currentTemplate) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const { code, ...updateData } = data;
      
      const updatedTemplate = await emailTemplateService.updateEmailTemplate(
        currentTemplate.id, 
        updateData
      );
      
      setEmailTemplates(prev => 
        prev.map(template => 
          template.id === currentTemplate.id ? updatedTemplate : template
        )
      );
      setSuccessMessage("Plantilla actualizada correctamente");
      
      setTimeout(() => {
        setIsEditModalOpen(false);
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

  // Obtener categorías únicas para estadísticas
  const categories = Array.from(new Set(emailTemplates.map(t => t.category))).filter(Boolean);

  // Estadísticas para el header
  const stats = [
    {
      label: 'Total',
      value: emailTemplates.length,
      variant: 'default' as const
    },
    {
      label: 'Activas',
      value: emailTemplates.filter(t => t.is_active).length,
      variant: 'success' as const
    },
    {
      label: 'Inactivas',
      value: emailTemplates.filter(t => !t.is_active).length,
      variant: 'warning' as const
    },
    {
      label: 'Categorías',
      value: categories.length,
      variant: 'default' as const
    }
  ];
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Código',
      accessor: (template: EmailTemplate) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {template.code}
        </span>
      ),
    },
    {
      header: 'Nombre',
      accessor: (template: EmailTemplate) => (
        <div>
          <div className="font-medium text-gray-900">{template.name}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {template.subject}
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      accessor: (template: EmailTemplate) => (
        <Badge variant="primary">{template.category}</Badge>
      ),
    },
    {
      header: 'Estado',
      accessor: (template: EmailTemplate) => (
        template.is_active ? 
          <Badge variant="success">Activa</Badge> : 
          <Badge variant="secondary">Inactiva</Badge>
      ),
    }
  ];
  
  // Renderizar acciones personalizadas
  const renderTemplateActions = (template: EmailTemplate) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handlePreviewTemplate(template)}
        className="text-blue-600 hover:text-blue-900"
        leftIcon={<EyeIcon className="h-4 w-4" />}
      >
        <span className="hidden lg:inline">Vista previa</span>
        <span className="lg:hidden">Ver</span>
      </DashboardButton>
      
      {canEdit && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleEditTemplate(template)}
          className="text-blue-600 hover:text-blue-900"
          leftIcon={<PencilIcon className="h-4 w-4" />}
        >
          Editar
        </DashboardButton>
      )}
      
      {canDelete && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleDeleteTemplate(template)}
          className="text-red-600 hover:text-red-900"
          leftIcon={<TrashIcon className="h-4 w-4" />}
        >
          Eliminar
        </DashboardButton>
      )}
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <ConfigPageHeader
        title="Plantillas de Correo"
        subtitle="Gestiona las plantillas de correo electrónico del sistema"
        icon={<EnvelopeIcon className="h-6 w-6" />}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={fetchEmailTemplates}
        stats={!isLoading ? stats : undefined}
        actionButton={canCreate ? (
          <DashboardButton
            onClick={() => {
              setModalError(null);
              setSuccessMessage(null);
              setIsAddModalOpen(true);
            }}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Nueva Plantilla</span>
            <span className="sm:hidden">Nueva</span>
          </DashboardButton>
        ) : undefined}
      />

      {/* Contenido principal */}
      {error ? (
        <ErrorPlaceholder
          title="Error al cargar plantillas"
          description={error}
          onRetry={fetchEmailTemplates}
          size="sm"
          showBackground={false}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <DashboardDataTable
            columns={columns}
            data={emailTemplates}
            keyExtractor={(template) => template.id.toString()}
            actionColumn={true}
            emptyMessage=""
            isLoading={isLoading}
            renderActions={renderTemplateActions}
            striped={true}
            hover={true}
          />
          
          {/* Empty state */}
          {!isLoading && !error && emailTemplates.length === 0 && (
            <div className="p-8">
              <DashboardPlaceholder
                type="empty"
                title="No hay plantillas"
                description="No hay plantillas de correo. Crea una nueva plantilla para empezar."
                size="sm"
                showBackground={false}
                primaryAction={canCreate ? {
                  label: 'Crear Primera Plantilla',
                  onClick: () => {
                    setModalError(null);
                    setSuccessMessage(null);
                    setIsAddModalOpen(true);
                  },
                  icon: <PlusIcon className="h-4 w-4" />
                } : undefined}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Modal para añadir plantilla */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Crear plantilla de correo"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        <EmailTemplateForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DashboardModal>
      
      {/* Modal para editar plantilla */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentTemplate(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar plantilla de correo"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        {currentTemplate && (
          <EmailTemplateForm
            initialData={{
              code: currentTemplate.code,
              name: currentTemplate.name,
              subject: currentTemplate.subject,
              category: currentTemplate.category,
              is_active: currentTemplate.is_active,
              available_variables: currentTemplate.available_variables || ''
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentTemplate(null);
            }}
            isSubmitting={isSubmitting}
            isEditing={true}
          />
        )}
      </DashboardModal>
      
      {/* Modal para confirmar eliminación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentTemplate(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar eliminación"
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
              <p className="text-gray-600 text-sm mt-1">
                Código: <span className="font-mono bg-gray-100 px-1 rounded">{currentTemplate?.code}</span>
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setCurrentTemplate(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleConfirmDelete}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<TrashIcon className="h-4 w-4" />}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
      
      {/* Modal para previsualizar plantilla */}
      <DashboardModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Vista previa: ${currentTemplate?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Código:</span>
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded break-all">
                  {currentTemplate?.code}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Categoría:</span>
                <span className="ml-2">
                  <Badge variant="primary" size="sm">{currentTemplate?.category}</Badge>
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Asunto:</span>
              <span className="ml-2 break-words">{currentTemplate?.subject}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Contenido renderizado:</h4>
            <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            </div>
          </div>
          
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800">💡 Nota importante</p>
            <p className="mt-1">
              Esta es una vista previa con datos de ejemplo. Las variables reales se reemplazarán 
              automáticamente al enviar el correo electrónico.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <DashboardButton onClick={() => setIsPreviewModalOpen(false)}>
            Cerrar Vista Previa
          </DashboardButton>
        </div>
      </DashboardModal>
    </div>
  );
};

export default EmailTemplatesSettings;