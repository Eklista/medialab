// src/features/dashboard/components/config/TestEmailModal.tsx
import React, { useState } from 'react';
import DashboardModal from '../ui/DashboardModal';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardButton from '../ui/DashboardButton';
import { smtpService } from '../../../../services';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestEmailModal: React.FC<TestEmailModalProps> = ({ isOpen, onClose }) => {
  const [emailData, setEmailData] = useState({
    to_email: '',
    subject: 'Correo de prueba',
    message: 'Este es un correo de prueba enviado desde MediaLab Sistema.'
  });
  
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const response = await smtpService.sendTestEmail(emailData);
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
      message: 'Este es un correo de prueba enviado desde MediaLab Sistema.'
    });
    setError(null);
    setResult(null);
  };
  
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