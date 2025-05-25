// src/features/dashboard/pages/settings/EmailTemplatesSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import DashboardModal from '../../components/ui/DashboardModal';
import ConfigPageTemplate from '../../components/config/ConfigPageTemplate';
import EmailTemplateForm, { EmailTemplateFormData } from '../../components/config/EmailTemplateForm';
import Badge from '../../components/ui/Badge';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';
import { emailTemplateService, EmailTemplate } from '../../../../services/emailTemplate.service';

const EmailTemplatesSettings: React.FC = () => {
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
    console.log('🚀 useEffect mounting, calling fetchEmailTemplates');
    fetchEmailTemplates();
  }, [])
  
  // Función para cargar plantillas desde la API
  const fetchEmailTemplates = async () => {
    console.log('🔄 fetchEmailTemplates called');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📡 Calling emailTemplateService.getEmailTemplates()');
      const data = await emailTemplateService.getEmailTemplates();
      console.log('✅ Got data:', data.length, 'templates');
      setEmailTemplates(data);
      console.log('✅ State updated with templates');
    } catch (err) {
      console.error('💥 Error in fetchEmailTemplates:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las plantillas de correo');
    } finally {
      console.log('🏁 fetchEmailTemplates finished');
      setIsLoading(false);
    }
  };

  
  // Handlers para plantillas
  const handleEditTemplate = (template: EmailTemplate) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentTemplate(template);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteTemplate = (template: EmailTemplate) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentTemplate(template);
    setIsDeleteModalOpen(true);
  };
  
  const handlePreviewTemplate = async (template: EmailTemplate) => {
    try {
      // Generar datos de prueba basados en las variables disponibles
      const context: Record<string, string> = {};
      if (template.available_variables) {
        const variables = template.available_variables.split(',').map(v => v.trim());
        variables.forEach(variable => {
          context[variable] = `[${variable}]`;
        });
      }
      
      // Siempre incluir algunas variables comunes
      context.username = context.username || 'Usuario Ejemplo';
      context.project_name = context.project_name || 'MediaLab Sistema';
      
      // Renderizar la plantilla
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
      
      // Cerrar el modal después de un tiempo
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
      
      // Cerrar el modal después de un tiempo
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
      // Excluir el código del objeto de actualización (no se puede cambiar)
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
      
      // Cerrar el modal después de un tiempo
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
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Código',
      accessor: (template: EmailTemplate) => template.code,
    },
    {
      header: 'Nombre',
      accessor: (template: EmailTemplate) => template.name,
    },
    {
      header: 'Asunto',
      accessor: (template: EmailTemplate) => template.subject,
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
    },
  ];
  
  // Renderizar acciones personalizadas para cada plantilla
  const renderTemplateActions = (template: EmailTemplate) => (
    <div className="flex space-x-2 justify-end">
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handlePreviewTemplate(template)}
        className="text-blue-600 hover:text-blue-900"
      >
        Previsualizar
      </DashboardButton>
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleEditTemplate(template)}
        className="text-blue-600 hover:text-blue-900"
      >
        Editar
      </DashboardButton>
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleDeleteTemplate(template)}
        className="text-red-600 hover:text-red-900"
      >
        Eliminar
      </DashboardButton>
    </div>
  );
  
  return (
    <ConfigPageTemplate
      title="Plantillas de correo"
      error={error ? <ApiErrorHandler error={error} onRetry={fetchEmailTemplates} resourceName="las plantillas de correo" /> : undefined}
    >
      <div className="p-0">
        <DashboardDataTable
          columns={columns}
          data={emailTemplates}
          keyExtractor={(template) => template.id.toString()}
          actionColumn={true}
          emptyMessage={isLoading ? "Cargando plantillas de correo..." : "No hay plantillas de correo. Por favor, añada una plantilla para usarla en la aplicación."}
          isLoading={isLoading}
          renderActions={renderTemplateActions}
          className="max-h-[calc(100vh-280px)] scrollbar-thin"
        />
      </div>
      
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
            initialData={currentTemplate}
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
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar la plantilla <span className="font-medium">{currentTemplate?.name}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
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
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
      
      {/* Modal para previsualizar plantilla */}
      <DashboardModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Previsualización: ${currentTemplate?.name || ''}`}
        size="lg"
      >
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Asunto: {currentTemplate?.subject}</h3>
          <div className="p-4 border rounded bg-gray-50">
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          <p>Este es un ejemplo de cómo se verá el correo con datos de muestra.</p>
          <p>Las variables reales se reemplazarán al enviar el correo.</p>
        </div>
        
        <div className="flex justify-end">
          <DashboardButton onClick={() => setIsPreviewModalOpen(false)}>
            Cerrar
          </DashboardButton>
        </div>
      </DashboardModal>
    </ConfigPageTemplate>
  );
};

export default EmailTemplatesSettings;