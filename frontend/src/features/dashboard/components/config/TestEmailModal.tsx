// src/features/dashboard/components/config/TestEmailModal.tsx
import React, { useState, useEffect } from 'react';
import DashboardModal from '../ui/DashboardModal';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import DashboardSelect from '../ui/DashboardSelect';
import { smtpService } from '../../../../services';
import { emailTemplateService, EmailTemplate } from '../../../../services/emailTemplate.service';

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
  
  // Cargar plantillas disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
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
  };
  
  const handleSendTest = async () => {
    // Validar correo destino
    if (!emailData.to_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.to_email)) {
      setError('Por favor, ingresa un correo electrónico válido');
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
        dataToSend.subject = emailData.subject; // Opcional, como override
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
  
  return (
    <DashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Correo de Prueba"
      size="md"
      error={error}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Usa este formulario para probar el envío de correos utilizando la configuración SMTP activa.
        </p>
        
        <DashboardTextInput
          id="to_email"
          name="to_email"
          label="Correo Destinatario"
          value={emailData.to_email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          required
        />
        
        <DashboardSelect
          id="template_code"
          name="template_code"
          label="Plantilla de correo"
          value={emailData.template_code}
          onChange={handleChange}
          options={templateOptions}
          placeholder="Seleccione una plantilla o mensaje personalizado"
          disabled={isLoadingTemplates}
          helperText={isLoadingTemplates ? "Cargando plantillas..." : "Selecciona una plantilla predefinida o envía un mensaje personalizado"}
        />
        
        {!isUsingTemplate && (
          <>
            <DashboardTextInput
              id="subject"
              name="subject"
              label="Asunto"
              value={emailData.subject}
              onChange={handleChange}
              placeholder="Asunto del correo"
            />
            
            <DashboardTextarea
              id="message"
              name="message"
              label="Mensaje"
              value={emailData.message}
              onChange={handleChange}
              placeholder="Contenido del correo"
              rows={4}
            />
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Botón de acción (opcional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardTextInput
                  id="action_text"
                  name="action_text"
                  label="Texto del botón"
                  value={emailData.action_text}
                  onChange={handleChange}
                  placeholder="Ej: Ver detalles"
                />
                
                <DashboardTextInput
                  id="action_url"
                  name="action_url"
                  label="URL del botón"
                  value={emailData.action_url}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/accion"
                />
              </div>
            </div>
          </>
        )}
        
        {isUsingTemplate && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-sm font-medium mb-1">Usando plantilla: {emailData.template_code}</p>
            <p className="text-xs text-gray-600">
              Se usarán datos de ejemplo adecuados para esta plantilla. 
              El correo se enviará utilizando la configuración predefinida.
            </p>
            <DashboardTextInput
              id="subject"
              name="subject"
              label="Asunto (opcional, sobrescribe el de la plantilla)"
              value={emailData.subject}
              onChange={handleChange}
              placeholder="Dejar vacío para usar el asunto predefinido"
              className="mt-3"
            />
          </div>
        )}
        
        {result && (
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{result.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <DashboardButton
          variant="outline"
          onClick={handleClearForm}
          disabled={isSending}
        >
          Limpiar
        </DashboardButton>
        
        <DashboardButton
          onClick={handleSendTest}
          loading={isSending}
          disabled={isSending || !emailData.to_email}
        >
          Enviar Prueba
        </DashboardButton>
      </div>
    </DashboardModal>
  );
};

export default TestEmailModal;