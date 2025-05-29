// src/features/dashboard/components/config/TestEmailModal.tsx
import React, { useState, useEffect } from 'react';
import DashboardModal from '../ui/DashboardModal';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import DashboardSelect from '../ui/DashboardSelect';
import Badge from '../ui/Badge';
import { smtpService } from '../../../../services';
import { emailTemplateService, EmailTemplate } from '../../../../services/templates/emailTemplate.service';
import { 
  EnvelopeIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestEmailModal: React.FC<TestEmailModalProps> = ({ isOpen, onClose }) => {
  const [emailData, setEmailData] = useState({
    to_email: '',
    subject: 'Correo de prueba',
    message: 'Este es un correo de prueba enviado desde MediaLab Sistema.',
    template_code: '',
    action_url: '',
    action_text: ''
  });
  
  const [availableTemplates, setAvailableTemplates] = useState<EmailTemplate[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    to_email?: string;
    subject?: string;
    message?: string;
    action_url?: string;
  }>({});
  
  // Cargar plantillas disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      // Reset form when modal opens
      setEmailData({
        to_email: '',
        subject: 'Correo de prueba',
        message: 'Este es un correo de prueba enviado desde MediaLab Sistema.',
        template_code: '',
        action_url: '',
        action_text: ''
      });
      setResult(null);
      setError(null);
      setValidationErrors({});
    }
  }, [isOpen]);
  
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    setError(null);
    
    try {
      const templates = await emailTemplateService.getEmailTemplates();
      setAvailableTemplates(templates);
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar plantillas de correo');
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setResult(null);
    
    // Clear validation errors when user types
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof validationErrors = {};
    
    // Validate email
    if (!emailData.to_email) {
      newErrors.to_email = 'El correo destinatario es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.to_email)) {
      newErrors.to_email = 'Por favor, ingresa un correo electrónico válido';
    }
    
    // Validate content based on template usage
    if (!emailData.template_code) {
      if (!emailData.subject.trim()) {
        newErrors.subject = 'El asunto es requerido';
      }
      if (!emailData.message.trim()) {
        newErrors.message = 'El mensaje es requerido';
      }
      
      // Validate action URL if action text is provided
      if (emailData.action_text && !emailData.action_url) {
        newErrors.action_url = 'La URL es requerida si se especifica texto del botón';
      }
      
      // Basic URL validation
      if (emailData.action_url && !/^https?:\/\/.+/.test(emailData.action_url)) {
        newErrors.action_url = 'La URL debe comenzar con http:// o https://';
      }
    }
    
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSendTest = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSending(true);
    setError(null);
    setResult(null);
    
    try {
      const dataToSend: any = { 
        to_email: emailData.to_email
      };
      
      // Añadir datos según si se seleccionó una plantilla o no
      if (emailData.template_code) {
        dataToSend.template_code = emailData.template_code;
        if (emailData.subject !== 'Correo de prueba') {
          dataToSend.subject = emailData.subject; // Override subject if changed
        }
      } else {
        dataToSend.subject = emailData.subject;
        dataToSend.message = emailData.message;
        
        if (emailData.action_url && emailData.action_text) {
          dataToSend.action_url = emailData.action_url;
          dataToSend.action_text = emailData.action_text;
        }
      }
      
      const response = await smtpService.sendTestEmail(dataToSend);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar correo de prueba');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleClearForm = () => {
    setEmailData({
      to_email: '',
      subject: 'Correo de prueba',
      message: 'Este es un correo de prueba enviado desde MediaLab Sistema.',
      template_code: '',
      action_url: '',
      action_text: ''
    });
    setError(null);
    setResult(null);
    setValidationErrors({});
  };
  
  // Opciones para el selector de plantillas
  const templateOptions = [
    { value: '', label: 'Sin plantilla (mensaje personalizado)' },
    ...availableTemplates.map(template => ({
      value: template.code,
      label: `${template.name} (${template.code})`
    }))
  ];
  
  const isUsingTemplate = !!emailData.template_code;
  const selectedTemplate = availableTemplates.find(t => t.code === emailData.template_code);

  // Get template category info
  const getTemplateCategoryInfo = () => {
    if (!selectedTemplate) return null;
    
    const categoryInfo: Record<string, { color: string; label: string }> = {
      general: { color: 'blue', label: 'General' },
      user: { color: 'purple', label: 'Usuarios' },
      service: { color: 'green', label: 'Servicios' },
      notification: { color: 'amber', label: 'Notificaciones' },
      system: { color: 'red', label: 'Sistema' }
    };
    
    return categoryInfo[selectedTemplate.category] || categoryInfo.general;
  };

  const categoryInfo = getTemplateCategoryInfo();
  
  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Correo de Prueba"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Information */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <InformationCircleIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Prueba de Correo Electrónico</h3>
              <p className="mt-1 text-sm text-blue-700">
                Utiliza este formulario para probar el envío de correos usando la configuración SMTP activa. 
                Puedes enviar un mensaje personalizado o probar una plantilla existente.
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al enviar</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {result && (
          <div className={`rounded-xl border p-4 ${
            result.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {result.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? '¡Correo enviado exitosamente!' : 'Error en el envío'}
                </h3>
                <p className={`mt-1 text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                {result.success && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Enviado a las {new Date().toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Recipient Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <EnvelopeIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Destinatario</h3>
              <p className="text-sm text-gray-500">Correo electrónico de destino</p>
            </div>
          </div>
          
          <DashboardTextInput
            id="to_email"
            name="to_email"
            label="Correo Destinatario"
            value={emailData.to_email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
            error={validationErrors.to_email}
            icon={<EnvelopeIcon className="h-5 w-5" />}
            disabled={isSending}
          />
        </div>

        {/* Template Selection */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <SparklesIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Tipo de Correo
                {availableTemplates.length > 0 && (
                  <Badge variant="info" className="ml-2">
                    {availableTemplates.length} plantillas disponibles
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-gray-500">Selecciona una plantilla o envía un mensaje personalizado</p>
            </div>
          </div>
          
          <DashboardSelect
            id="template_code"
            name="template_code"
            label="Plantilla de correo"
            value={emailData.template_code}
            onChange={handleChange}
            options={templateOptions}
            placeholder="Seleccione una plantilla o mensaje personalizado"
            disabled={isLoadingTemplates || isSending}
            helperText={isLoadingTemplates ? "Cargando plantillas..." : "Selecciona una plantilla predefinida o envía un mensaje personalizado"}
            icon={<DocumentTextIcon className="h-5 w-5" />}
            className="mb-0"
          />

          {/* Template Information */}
          {isUsingTemplate && selectedTemplate && categoryInfo && (
            <div className={`mt-4 rounded-xl border border-${categoryInfo.color}-200 bg-${categoryInfo.color}-50 p-4`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-${categoryInfo.color}-100`}>
                    <SparklesIcon className={`h-4 w-4 text-${categoryInfo.color}-600`} />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`text-sm font-medium text-${categoryInfo.color}-800`}>
                      {selectedTemplate.name}
                    </h4>
                    <Badge variant="secondary" size="sm">
                      {categoryInfo.label}
                    </Badge>
                  </div>
                  <p className={`text-sm text-${categoryInfo.color}-700 mb-2`}>
                    <strong>Asunto predefinido:</strong> {selectedTemplate.subject}
                  </p>
                  {selectedTemplate.description && (
                    <p className={`text-sm text-${categoryInfo.color}-700 mb-2`}>
                      {selectedTemplate.description}
                    </p>
                  )}
                  {selectedTemplate.available_variables && (
                    <p className={`text-xs text-${categoryInfo.color}-600`}>
                      <strong>Variables:</strong> {selectedTemplate.available_variables}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Custom Message Section */}
        {!isUsingTemplate && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <DocumentTextIcon className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Mensaje Personalizado</h3>
                <p className="text-sm text-gray-500">Configura el contenido del correo</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <DashboardTextInput
                id="subject"
                name="subject"
                label="Asunto"
                value={emailData.subject}
                onChange={handleChange}
                placeholder="Asunto del correo"
                required
                error={validationErrors.subject}
                disabled={isSending}
                maxLength={200}
                showCharCount
              />
              
              <DashboardTextarea
                id="message"
                name="message"
                label="Mensaje"
                value={emailData.message}
                onChange={handleChange}
                placeholder="Contenido del correo"
                rows={5}
                required
                error={validationErrors.message}
                disabled={isSending}
                maxLength={1000}
                showCharCount
              />
            </div>
          </div>
        )}

        {/* Template Override */}
        {isUsingTemplate && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <DocumentTextIcon className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Personalización (Opcional)</h3>
                <p className="text-sm text-gray-500">Sobrescribe el asunto predefinido si es necesario</p>
              </div>
            </div>
            
            <DashboardTextInput
              id="subject"
              name="subject"
              label="Asunto personalizado"
              value={emailData.subject}
              onChange={handleChange}
              placeholder="Dejar vacío para usar el asunto de la plantilla"
              disabled={isSending}
              maxLength={200}
              showCharCount
              helperText="Opcional: Sobrescribe el asunto predefinido de la plantilla"
            />
          </div>
        )}

        {/* Action Button Section (for custom messages) */}
        {!isUsingTemplate && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <LinkIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Botón de Acción (Opcional)</h3>
                <p className="text-sm text-gray-500">Agregar un botón con enlace al correo</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardTextInput
                id="action_text"
                name="action_text"
                label="Texto del botón"
                value={emailData.action_text}
                onChange={handleChange}
                placeholder="Ej: Ver detalles, Ir al sitio"
                disabled={isSending}
                maxLength={50}
                showCharCount
              />
              
              <DashboardTextInput
                id="action_url"
                name="action_url"
                label="URL del botón"
                value={emailData.action_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/accion"
                error={validationErrors.action_url}
                disabled={isSending}
                icon={<LinkIcon className="h-5 w-5" />}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 pt-6 border-t border-gray-200 sm:flex-row sm:justify-end">
        <DashboardButton
          variant="outline"
          onClick={handleClearForm}
          disabled={isSending}
          leftIcon={<TrashIcon className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Limpiar Formulario
        </DashboardButton>
        
        <DashboardButton
          onClick={handleSendTest}
          loading={isSending}
          disabled={isSending || !emailData.to_email}
          leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          {isSending ? 'Enviando...' : 'Enviar Correo de Prueba'}
        </DashboardButton>
      </div>
    </DashboardModal>
  );
};

export default TestEmailModal;