// src/features/dashboard/components/config/SmtpConfigForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardButton from '../ui/DashboardButton';
import Switch from '../ui/Switch';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ServerIcon,
  LockClosedIcon,
  EnvelopeIcon,
  CogIcon,
  InformationCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserIcon,
  KeyIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

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

// Configuraciones SMTP comunes
const SMTP_PRESETS = [
  {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    use_tls: true,
    use_ssl: false,
    icon: '📧'
  },
  {
    name: 'Outlook',
    host: 'smtp-mail.outlook.com',
    port: 587,
    use_tls: true,
    use_ssl: false,
    icon: '📨'
  },
  {
    name: 'Yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    use_tls: true,
    use_ssl: false,
    icon: '💌'
  },
  {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    use_tls: true,
    use_ssl: false,
    icon: '🚀'
  }
];

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
  const [showPresets, setShowPresets] = useState(false);
  
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
    setTestMessage('');
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

  const handlePresetSelect = (preset: typeof SMTP_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      use_tls: preset.use_tls,
      use_ssl: preset.use_ssl
    }));
    setShowPresets(false);
    setTestStatus('none');
    setTestMessage('');
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

    // Validate timeout
    if (formData.timeout < 5 || formData.timeout > 120) {
      newErrors.timeout = 'El timeout debe estar entre 5 y 120 segundos';
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
    
    setTestStatus('none');
    setTestMessage('');
    
    try {
      const result = await onTestConnection(formData);
      setTestStatus(result ? 'success' : 'error');
      setTestMessage(result ? 'Conexión exitosa! La configuración funciona correctamente.' : 'Error de conexión. Verifique los datos y que el servidor SMTP esté disponible.');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getEncryptionInfo = () => {
    if (formData.use_tls && formData.use_ssl) {
      return { 
        status: 'warning', 
        message: 'Advertencia: TLS y SSL no deberían estar activos simultáneamente',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />
      };
    } else if (formData.use_tls) {
      return { 
        status: 'success', 
        message: 'TLS habilitado - Conexión segura recomendada',
        icon: <ShieldCheckIcon className="h-4 w-4" />
      };
    } else if (formData.use_ssl) {
      return { 
        status: 'success', 
        message: 'SSL habilitado - Conexión segura',
        icon: <LockClosedIcon className="h-4 w-4" />
      };
    } else {
      return { 
        status: 'warning', 
        message: 'Sin encriptación - No recomendado para producción',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />
      };
    }
  };

  const encryptionInfo = getEncryptionInfo();
  
  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Por favor, corrige los siguientes errores:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc space-y-1 pl-5">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Note */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <InformationCircleIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Configuración SMTP</h3>
              <p className="mt-1 text-sm text-blue-700">
                Configura los parámetros de conexión para el servidor de correo electrónico. 
                Esta configuración se utilizará para enviar correos desde el sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Setup Presets */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <WifiIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configuración Rápida</h3>
                <p className="text-sm text-gray-500">Selecciona un proveedor popular para auto-configurar</p>
              </div>
            </div>
            <DashboardButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPresets(!showPresets)}
            >
              {showPresets ? 'Ocultar' : 'Mostrar'} Proveedores
            </DashboardButton>
          </div>

          {showPresets && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SMTP_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                  <div className="text-xs text-gray-500">{preset.host}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Server Configuration Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <ServerIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración del Servidor</h3>
              <p className="text-sm text-gray-500">Parámetros de conexión al servidor SMTP</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DashboardTextInput
                id="host"
                name="host"
                label="Servidor SMTP"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="smtp.gmail.com"
                required
                error={errors.host}
                icon={<GlobeAltIcon className="h-5 w-5" />}
                disabled={isSubmitting || isTesting}
              />
            </div>
            
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
              disabled={isSubmitting || isTesting}
              helperText="Común: 587 (TLS), 465 (SSL), 25 (sin encriptación)"
            />
          </div>
        </div>

        {/* Authentication Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Autenticación</h3>
              <p className="text-sm text-gray-500">Credenciales de acceso al servidor</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="username"
              name="username"
              label="Usuario"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="correo@dominio.com"
              required
              error={errors.username}
              icon={<UserIcon className="h-5 w-5" />}
              disabled={isSubmitting || isTesting}
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
              icon={<KeyIcon className="h-5 w-5" />}
              disabled={isSubmitting || isTesting}
            />
          </div>
        </div>

        {/* Security Configuration Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <LockClosedIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración de Seguridad</h3>
              <p className="text-sm text-gray-500">Encriptación y configuraciones avanzadas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <Switch
                id="use_tls"
                checked={formData.use_tls}
                onChange={handleToggleTLS}
                disabled={isSubmitting || isTesting}
                label="Usar TLS"
                description="Recomendado para la mayoría de servidores SMTP"
                size="md"
              />
              
              <Switch
                id="use_ssl"
                checked={formData.use_ssl}
                onChange={handleToggleSSL}
                disabled={isSubmitting || isTesting}
                label="Usar SSL"
                description="Solo para servidores con conexión SSL directa"
                size="md"
              />
            </div>
            
            <DashboardTextInput
              id="timeout"
              name="timeout"
              label="Timeout (segundos)"
              value={formData.timeout.toString()}
              onChange={handleInputChange}
              placeholder="30"
              type="number"
              min="5"
              max="120"
              error={errors.timeout}
              disabled={isSubmitting || isTesting}
              icon={<ClockIcon className="h-5 w-5" />}
              helperText="Tiempo límite para conexión"
            />

            {/* Encryption Status */}
            <div className={`p-4 rounded-lg border ${
              encryptionInfo.status === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={encryptionInfo.status === 'success' ? 'text-green-600' : 'text-amber-600'}>
                  {encryptionInfo.icon}
                </span>
                <span className={`text-sm font-medium ${
                  encryptionInfo.status === 'success' ? 'text-green-800' : 'text-amber-800'
                }`}>
                  Estado de Encriptación
                </span>
              </div>
              <p className={`text-sm ${
                encryptionInfo.status === 'success' ? 'text-green-700' : 'text-amber-700'
              }`}>
                {encryptionInfo.message}
              </p>
            </div>
          </div>
        </div>

        {/* Default From Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <EnvelopeIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información del Remitente</h3>
              <p className="text-sm text-gray-500">Datos que aparecerán como remitente por defecto</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="default_from_name"
              name="default_from_name"
              label="Nombre del Remitente"
              value={formData.default_from_name}
              onChange={handleInputChange}
              placeholder="MediaLab Sistema"
              required
              error={errors.default_from_name}
              disabled={isSubmitting || isTesting}
              maxLength={100}
              showCharCount
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
              icon={<EnvelopeIcon className="h-5 w-5" />}
              disabled={isSubmitting || isTesting}
            />
          </div>
        </div>

        {/* Configuration Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <CogIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Estado de la Configuración</h3>
              <p className="text-sm text-gray-500">Activación y configuraciones finales</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Configuración Activa</h4>
              <p className="text-sm text-gray-500">
                {formData.is_active 
                  ? 'Esta configuración está activa y se usará para enviar correos' 
                  : 'Esta configuración está inactiva'
                }
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onChange={handleToggleActive}
              disabled={isSubmitting || isTesting}
              size="md"
              onLabel="Activa"
              offLabel="Inactiva"
            />
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> Solo una configuración puede estar activa a la vez. 
              Activar esta configuración desactivará cualquier otra configuración SMTP existente.
            </p>
          </div>
        </div>
        
        {/* Test Connection Status */}
        {testStatus !== 'none' && (
          <div className={`rounded-xl border p-6 ${
            testStatus === 'success' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {testStatus === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  testStatus === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testStatus === 'success' ? 'Prueba de Conexión Exitosa' : 'Error en la Prueba de Conexión'}
                </h3>
                <p className={`mt-1 text-sm ${
                  testStatus === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testMessage}
                </p>
                {testStatus === 'success' && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Probado a las {new Date().toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          <DashboardButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isTesting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </DashboardButton>

          <DashboardButton
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            loading={isTesting}
            disabled={isSubmitting || isTesting || !onTestConnection}
            leftIcon={<WifiIcon className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            {isTesting ? 'Probando Conexión...' : 'Probar Conexión'}
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || isTesting}
            className="w-full sm:w-auto"
          >
            {initialData?.host ? 'Actualizar Configuración' : 'Crear Configuración'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default SmtpConfigForm;