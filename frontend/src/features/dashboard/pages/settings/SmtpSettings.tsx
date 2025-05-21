// src/features/dashboard/pages/settings/SmtpSettings.tsx
import React, { useState, useEffect } from 'react';
import DashboardButton from '../../components/ui/DashboardButton';
import DashboardModal from '../../components/ui/DashboardModal';
import DashboardDataTable from '../../components/ui/DashboardDataTable';
import SmtpConfigForm, { SmtpConfigFormData } from '../../components/config/SmtpConfigForm';
import ConfigPageTemplate from '../../components/config/ConfigPageTemplate';
import Badge from '../../components/ui/Badge';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { smtpService } from '../../../../services';
import { SmtpConfig } from '../../../../services/smtp.service';
import ApiErrorHandler from '../../../../components/common/ApiErrorHandler';
import TestEmailModal from '../../components/config/TestEmailModal';
import { format } from 'date-fns';

const SmtpSettings: React.FC = () => {
  // Estado para SMTP configs
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  
  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestResultModalOpen, setIsTestResultModalOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SmtpConfig | null>(null);
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);

  // Estado para operaciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Estado para carga y errores
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    fetchSmtpConfigs();
  }, []);
  
  // Función para cargar configuraciones SMTP desde la API
  const fetchSmtpConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await smtpService.getSmtpConfigs();
      setSmtpConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las configuraciones SMTP');
      console.error('Error al cargar configuraciones SMTP:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers para configuraciones SMTP
  const handleAddConfig = () => {
    setModalError(null);
    setSuccessMessage(null);
    setIsAddModalOpen(true);
  };
  
  const handleEditConfig = (config: SmtpConfig) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentConfig(config);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteConfig = (config: SmtpConfig) => {
    setModalError(null);
    setSuccessMessage(null);
    setCurrentConfig(config);
    setIsDeleteModalOpen(true);
  };
  
  const handleTestConfig = async (config: SmtpConfig) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await smtpService.testSmtpConfig(config.id);
      setTestResult({
        success: result.success,
        message: result.success 
          ? '¡Conexión exitosa! La configuración funciona correctamente.' 
          : 'Error de conexión. Verifique los datos y que el servidor SMTP esté disponible.'
      });
      setIsTestResultModalOpen(true);
    } catch (err) {
      setTestResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`
      });
      setIsTestResultModalOpen(true);
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!currentConfig || !currentConfig.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      await smtpService.deleteSmtpConfig(currentConfig.id);
      
      setSmtpConfigs(smtpConfigs.filter(config => config.id !== currentConfig.id));
      setSuccessMessage("Configuración SMTP eliminada correctamente");
      
      // Cerrar el modal después de un tiempo
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setCurrentConfig(null);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al eliminar la configuración SMTP');
      console.error('Error al eliminar configuración SMTP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleActivateConfig = async (configId: number) => {
    setIsSubmitting(true);
    
    try {
      await smtpService.activateSmtpConfig(configId);
      
      // Actualizar el estado local
      setSmtpConfigs(prevConfigs => 
        prevConfigs.map(config => ({
          ...config,
          is_active: config.id === configId
        }))
      );
      
    } catch (err) {
      console.error('Error al activar configuración SMTP:', err);
      // Mostrar un mensaje de error temporal
      setError(err instanceof Error ? err.message : 'Error al activar la configuración SMTP');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddSubmit = async (data: SmtpConfigFormData) => {
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const newConfig = await smtpService.createSmtpConfig(data);
      
      setSmtpConfigs([...smtpConfigs, newConfig]);
      setSuccessMessage("Configuración SMTP creada correctamente");
      
      // Cerrar el modal después de un tiempo
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al crear la configuración SMTP');
      console.error('Error al crear configuración SMTP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async (data: SmtpConfigFormData) => {
    if (!currentConfig || !currentConfig.id) return;
    
    setIsSubmitting(true);
    setModalError(null);
    
    try {
      const updatedConfig = await smtpService.updateSmtpConfig(currentConfig.id, data);
      
      setSmtpConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.id === currentConfig.id ? updatedConfig : config
        )
      );
      setSuccessMessage("Configuración SMTP actualizada correctamente");
      
      // Cerrar el modal después de un tiempo
      setTimeout(() => {
        setIsEditModalOpen(false);
        setCurrentConfig(null);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al actualizar la configuración SMTP');
      console.error('Error al actualizar configuración SMTP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const testConnectionWithForm = async (data: SmtpConfigFormData): Promise<boolean> => {
    setIsTesting(true);
    
    try {
      const result = await smtpService.testSmtpConnection({
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        use_tls: data.use_tls,
        use_ssl: data.use_ssl,
        default_from_email: data.default_from_email
      });
      return result.success;
    } catch (err) {
      console.error('Error al probar configuración SMTP:', err);
      return false;
    } finally {
      setIsTesting(false);
    }
  };
  
  // Columnas para la tabla
  const columns = [
    {
      header: 'Servidor',
      accessor: (config: SmtpConfig) => config.host,
    },
    {
      header: 'Puerto',
      accessor: (config: SmtpConfig) => config.port,
    },
    {
      header: 'Usuario',
      accessor: (config: SmtpConfig) => config.username,
    },
    {
      header: 'Encriptación',
      accessor: (config: SmtpConfig) => {
        if (config.use_tls) return <Badge variant="primary">TLS</Badge>;
        if (config.use_ssl) return <Badge variant="secondary">SSL</Badge>;
        return <Badge variant="warning">Ninguna</Badge>;
      },
    },
    {
      header: 'Remitente',
      accessor: (config: SmtpConfig) => config.default_from_name,
    },
    {
      header: 'Estado',
      accessor: (config: SmtpConfig) => (
        config.is_active ? 
          <Badge variant="success">Activo</Badge> : 
          <Badge variant="secondary">Inactivo</Badge>
      ),
    },
    {
      header: 'Última Actualización',
      accessor: (config: SmtpConfig) => {
        try {
          return format(new Date(config.updated_at), 'dd/MM/yyyy HH:mm');
        } catch (e) {
          return config.updated_at || '-';
        }
      },
    },
  ];
  
  // Renderizar acciones personalizadas para cada configuración
  const renderConfigActions = (config: SmtpConfig) => (
    <div className="flex space-x-2 justify-end">
      {!config.is_active && (
        <DashboardButton
          variant="text"
          size="sm"
          onClick={() => handleActivateConfig(config.id)}
          disabled={isSubmitting}
          className="text-green-600 hover:text-green-900"
        >
          Activar
        </DashboardButton>
      )}
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleTestConfig(config)}
        disabled={isSubmitting || isTesting}
        className="text-blue-600 hover:text-blue-900"
      >
        Probar
      </DashboardButton>
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleEditConfig(config)}
        className="text-blue-600 hover:text-blue-900"
      >
        Editar
      </DashboardButton>
      <DashboardButton
        variant="text"
        size="sm"
        onClick={() => handleDeleteConfig(config)}
        className="text-red-600 hover:text-red-900"
        disabled={config.is_active && smtpConfigs.length === 1}
      >
        Eliminar
      </DashboardButton>
    </div>
  );
  
  return (
    <ConfigPageTemplate
        title="Configuración SMTP"
        actionButton={
        <div className="flex space-x-2">
            <DashboardButton
            variant="secondary"
            onClick={() => setIsTestEmailModalOpen(true)}
            disabled={smtpConfigs.filter(c => c.is_active).length === 0}
            >
            Probar Envío
            </DashboardButton>
            
            <DashboardButton
            onClick={handleAddConfig}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            >
            Agregar Configuración
            </DashboardButton>
        </div>
        }
        error={error ? <ApiErrorHandler error={error} onRetry={fetchSmtpConfigs} resourceName="las configuraciones SMTP" /> : undefined}
    >
      <div className="p-0">
        <DashboardDataTable
          columns={columns}
          data={smtpConfigs}
          keyExtractor={(config) => config.id.toString()}
          actionColumn={true}
          emptyMessage={isLoading ? "Cargando configuraciones SMTP..." : "No hay configuraciones SMTP. Por favor, añada una configuración para habilitar el envío de correos."}
          isLoading={isLoading}
          renderActions={renderConfigActions}
          className="max-h-[calc(100vh-280px)] scrollbar-thin"
        />
      </div>
      
      {/* Modal para agregar configuración */}
      <DashboardModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Agregar Configuración SMTP"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        <SmtpConfigForm
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAddModalOpen(false)}
          onTestConnection={testConnectionWithForm}
          isSubmitting={isSubmitting}
          isTesting={isTesting}
        />
      </DashboardModal>
      
      {/* Modal para editar configuración */}
      <DashboardModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentConfig(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Editar Configuración SMTP"
        size="lg"
        error={modalError}
        success={successMessage}
      >
        {currentConfig && (
          <SmtpConfigForm
            initialData={currentConfig}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentConfig(null);
            }}
            onTestConnection={testConnectionWithForm}
            isSubmitting={isSubmitting}
            isTesting={isTesting}
          />
        )}
      </DashboardModal>
      
      {/* Modal para confirmar eliminación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentConfig(null);
          setModalError(null);
          setSuccessMessage(null);
        }}
        title="Confirmar Eliminación"
        error={modalError}
        success={successMessage}
      >
        <div className="py-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar la configuración SMTP para <span className="font-medium">{currentConfig?.host}</span>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
          {currentConfig?.is_active && smtpConfigs.length === 1 && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              <p className="font-medium">No se puede eliminar</p>
              <p>Esta es la única configuración activa. Debes crear una nueva configuración antes de eliminar esta.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <DashboardButton
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setCurrentConfig(null);
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </DashboardButton>
          <DashboardButton
            variant="danger"
            onClick={handleConfirmDelete}
            loading={isSubmitting}
            disabled={isSubmitting || (currentConfig?.is_active && smtpConfigs.length === 1)}
          >
            Eliminar
          </DashboardButton>
        </div>
      </DashboardModal>
      
      {/* Modal para mostrar resultado de prueba */}
      <DashboardModal
        isOpen={isTestResultModalOpen}
        onClose={() => setIsTestResultModalOpen(false)}
        title="Resultado de la Prueba"
        size="sm"
      >
        {testResult && (
          <div className={`p-4 rounded-md ${
            testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {testResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <DashboardButton onClick={() => setIsTestResultModalOpen(false)}>
            Cerrar
          </DashboardButton>
        </div>
      </DashboardModal>
      {/* Añadir este componente al final, antes de cerrar el ConfigPageTemplate */}
      <TestEmailModal
          isOpen={isTestEmailModalOpen}
          onClose={() => setIsTestEmailModalOpen(false)}
        />
    </ConfigPageTemplate>
  );
};

export default SmtpSettings;