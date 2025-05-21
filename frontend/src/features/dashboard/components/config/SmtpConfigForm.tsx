// src/features/dashboard/components/config/SmtpConfigForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardButton from '../ui/DashboardButton';
import Switch from '../ui/Switch';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export interface SmtpConfigFormData {
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  use_ssl: boolean;
  timeout: number;
  default_from_name: string;
  default_from_email: string;
  is_active: boolean;
}

interface SmtpConfigFormProps {
  initialData?: Partial<SmtpConfigFormData>;
  onSubmit: (data: SmtpConfigFormData) => void;
  onCancel: () => void;
  onTestConnection?: (data: SmtpConfigFormData) => Promise<boolean>;
  isSubmitting?: boolean;
  isTesting?: boolean;
}

const SmtpConfigForm: React.FC<SmtpConfigFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onTestConnection,
  isSubmitting = false,
  isTesting = false,
}) => {
  const [formData, setFormData] = useState<SmtpConfigFormData>({
    host: '',
    port: 587,
    username: '',
    password: '',
    use_tls: true,
    use_ssl: false,
    timeout: 30,
    default_from_name: '',
    default_from_email: '',
    is_active: false,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof SmtpConfigFormData, string>>>({});
  const [testStatus, setTestStatus] = useState<'none' | 'success' | 'error'>('none');
  const [testMessage, setTestMessage] = useState<string>('');
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Asegurarse de que si password viene oculto, lo dejamos vacío para edición
        password: initialData.password === '●●●●●●●●' ? '' : (initialData.password || ''),
      }));
    }
  }, [initialData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Manejar el caso especial del puerto que debe ser un número
    if (name === 'port' || name === 'timeout') {
      const numValue = parseInt(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: isNaN(numValue) ? 0 : numValue 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name as keyof SmtpConfigFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Reset test status when form changes
    setTestStatus('none');
  };
  
  // Handlers para switches (TLS, SSL, Active)
  const handleToggleTLS = () => {
    setFormData(prev => {
      // Si activamos TLS, desactivamos SSL
      const newUseSSL = prev.use_ssl && !prev.use_tls ? false : prev.use_ssl;
      return { 
        ...prev, 
        use_tls: !prev.use_tls,
        use_ssl: newUseSSL
      };
    });
    setTestStatus('none');
  };
  
  const handleToggleSSL = () => {
    setFormData(prev => {
      // Si activamos SSL, desactivamos TLS
      const newUseTLS = prev.use_tls && !prev.use_ssl ? false : prev.use_tls;
      return { 
        ...prev, 
        use_ssl: !prev.use_ssl,
        use_tls: newUseTLS
      };
    });
    setTestStatus('none');
  };
  
  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SmtpConfigFormData, string>> = {};
    
    // Validate host
    if (!formData.host.trim()) {
      newErrors.host = 'El host es requerido';
    }
    
    // Validate port
    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'El puerto debe estar entre 1 y 65535';
    }
    
    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }
    
    // Validate password if it's a new config or if it was changed
    if ((!initialData && !formData.password) || 
        (initialData && formData.password !== initialData.password && !formData.password)) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    // Validate from name
    if (!formData.default_from_name.trim()) {
      newErrors.default_from_name = 'El nombre del remitente es requerido';
    }
    
    // Validate from email
    if (!formData.default_from_email.trim()) {
      newErrors.default_from_email = 'El correo del remitente es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.default_from_email)) {
      newErrors.default_from_email = 'Formato de correo electrónico inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const handleTestConnection = async () => {
    if (!validateForm() || !onTestConnection) return;
    
    try {
      const result = await onTestConnection(formData);
      setTestStatus(result ? 'success' : 'error');
      setTestMessage(result ? 'Conexión exitosa! La configuración funciona correctamente.' : 'Error de conexión. Verifique los datos y que el servidor SMTP esté disponible.');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardTextInput
            id="host"
            name="host"
            label="Servidor SMTP"
            value={formData.host}
            onChange={handleInputChange}
            placeholder="smtp.gmail.com"
            required
            error={errors.host}
          />
          
          <DashboardTextInput
            id="port"
            name="port"
            label="Puerto"
            value={formData.port.toString()}
            onChange={handleInputChange}
            placeholder="587"
            type="number"
            min="1"
            max="65535"
            required
            error={errors.port}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardTextInput
            id="username"
            name="username"
            label="Usuario"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="correo@dominio.com"
            required
            error={errors.username}
          />
          
          <DashboardTextInput
            id="password"
            name="password"
            label={initialData ? "Contraseña (dejar vacío para mantener)" : "Contraseña"}
            value={formData.password}
            onChange={handleInputChange}
            placeholder={initialData ? "••••••••" : "Ingrese la contraseña"}
            type="password"
            required={!initialData}
            error={errors.password}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Usar TLS
            </label>
            <Switch
              checked={formData.use_tls}
              onChange={handleToggleTLS}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Recomendado para la mayoría de servidores SMTP.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Usar SSL
            </label>
            <Switch
              checked={formData.use_ssl}
              onChange={handleToggleSSL}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Solo para servidores con conexión SSL directa.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Timeout (segundos)
            </label>
            <DashboardTextInput
              id="timeout"
              name="timeout"
              value={formData.timeout.toString()}
              onChange={handleInputChange}
              placeholder="30"
              type="number"
              min="5"
              max="120"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardTextInput
            id="default_from_name"
            name="default_from_name"
            label="Nombre del Remitente"
            value={formData.default_from_name}
            onChange={handleInputChange}
            placeholder="MediaLab Sistema"
            required
            error={errors.default_from_name}
          />
          
          <DashboardTextInput
            id="default_from_email"
            name="default_from_email"
            label="Correo del Remitente"
            value={formData.default_from_email}
            onChange={handleInputChange}
            placeholder="noreply@ejemplo.com"
            required
            error={errors.default_from_email}
          />
        </div>
        
        <div className="border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Switch
                checked={formData.is_active}
                onChange={handleToggleActive}
                disabled={isSubmitting}
              />
              <span className="ml-3 text-sm">
                {formData.is_active ? 'Configuración Activa' : 'Configuración Inactiva'}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Solo una configuración puede estar activa a la vez. La configuración activa es la que se usará para enviar correos.
          </p>
        </div>
      </div>
      
      {/* Test Connection Status */}
      {testStatus !== 'none' && (
        <div className={`mt-4 p-3 rounded-md ${
          testStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {testStatus === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {testMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 flex justify-between">
        <DashboardButton
          type="button"
          variant="secondary"
          onClick={handleTestConnection}
          loading={isTesting}
          disabled={isSubmitting || isTesting || !onTestConnection}
        >
          Probar Conexión
        </DashboardButton>
        
        <div className="flex space-x-3">
          <DashboardButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isTesting}
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || isTesting}
          >
            {initialData?.host ? 'Actualizar' : 'Crear'}
          </DashboardButton>
        </div>
      </div>
    </form>
  );
};

export default SmtpConfigForm;