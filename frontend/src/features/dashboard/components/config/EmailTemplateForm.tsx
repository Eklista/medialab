// src/features/dashboard/components/config/EmailTemplateForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import Switch from '../ui/Switch';
import { EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export interface EmailTemplateFormData {
  code: string;
  name: string;
  subject: string;
  body_html: string;
  description?: string;
  available_variables?: string;
  category: string;
  is_active: boolean;
}

interface EmailTemplateFormProps {
  initialData?: Partial<EmailTemplateFormData>;
  onSubmit: (data: EmailTemplateFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

// Componente para editar HTML con resaltado de sintaxis
const HtmlEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  height?: string;
}> = ({ value, onChange, height = "400px" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative border border-gray-300 rounded-md overflow-hidden" style={{ minHeight: height }}>
      <textarea
        value={value}
        onChange={handleChange}
        className="font-mono text-sm w-full h-full p-4 resize-none focus:outline-none focus:ring-1 focus:ring-black"
        style={{ minHeight: height, whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" }}
        spellCheck="false"
      />
    </div>
  );
};

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<EmailTemplateFormData>({
    code: '',
    name: '',
    subject: '',
    body_html: '',
    description: '',
    available_variables: '',
    category: 'general',
    is_active: true,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof EmailTemplateFormData, string>>>({});
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  // Contexto de ejemplo para la vista previa
  const [previewContext, setPreviewContext] = useState<Record<string, string>>({});
  
  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);
  
  // Generar contexto de ejemplo basado en variables disponibles
  useEffect(() => {
    if (formData.available_variables) {
      const newContext: Record<string, string> = {};
      const variables = formData.available_variables.split(',').map(v => v.trim());
      
      variables.forEach(variable => {
        // Valores de ejemplo para variables comunes
        if (variable === 'username') newContext[variable] = 'Usuario Ejemplo';
        else if (variable === 'email') newContext[variable] = 'usuario@ejemplo.com';
        else if (variable === 'recovery_link') newContext[variable] = '#';
        else if (variable === 'reset_url') newContext[variable] = '#';
        else if (variable === 'project_name') newContext[variable] = 'MediaLab Sistema';
        else if (variable === 'code') newContext[variable] = '123456';
        else if (variable === 'subject') newContext[variable] = 'Asunto de ejemplo';
        else if (variable === 'message') newContext[variable] = 'Este es un mensaje de ejemplo para mostrar en la vista previa.';
        else if (variable === 'action_url') newContext[variable] = '#';
        else if (variable === 'action_text') newContext[variable] = 'Ver más';
        else newContext[variable] = `[${variable}]`;
      });
      
      setPreviewContext(newContext);
    }
  }, [formData.available_variables]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof EmailTemplateFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleHtmlChange = (newHtml: string) => {
    setFormData(prev => ({ ...prev, body_html: newHtml }));
    if (errors.body_html) {
      setErrors(prev => ({ ...prev, body_html: undefined }));
    }
  };
  
  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EmailTemplateFormData, string>> = {};
    
    // Validate required fields
    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'El código solo puede contener letras minúsculas, números y guiones bajos';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'El asunto es requerido';
    }
    
    if (!formData.body_html.trim()) {
      newErrors.body_html = 'El contenido HTML es requerido';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es requerida';
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
  
  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'user', label: 'Usuarios' },
    { value: 'service', label: 'Servicios' },
    { value: 'notification', label: 'Notificaciones' },
    { value: 'system', label: 'Sistema' },
  ];

  // Renderiza la vista previa aplicando las variables de ejemplo
  const renderPreview = () => {
    let renderedHtml = formData.body_html;
    
    // Reemplazar variables de ejemplo en el formato {{variable}}
    Object.entries(previewContext).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      renderedHtml = renderedHtml.replace(regex, value);
    });
    
    // Reemplazar condiciones Jinja2 básicas para la vista previa
    // Esto es una aproximación muy simple y no cubre todos los casos
    if (previewContext.action_url && previewContext.action_text) {
      renderedHtml = renderedHtml.replace(
        /{% if action_url and action_text %}(.*?){% endif %}/gs,
        '$1'
      );
    } else {
      renderedHtml = renderedHtml.replace(
        /{% if action_url and action_text %}(.*?){% endif %}/gs,
        ''
      );
    }
    
    return renderedHtml;
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardTextInput
            id="code"
            name="code"
            label="Código"
            value={formData.code}
            onChange={handleInputChange}
            placeholder="welcome_email"
            required
            error={errors.code}
            disabled={true} // Siempre deshabilitado
            helperText="Identificador único (no editable)"
          />
          
          <DashboardTextInput
            id="name"
            name="name"
            label="Nombre"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Correo de bienvenida"
            required
            error={errors.name}
          />
        </div>
        
        <DashboardTextInput
          id="subject"
          name="subject"
          label="Asunto"
          value={formData.subject}
          onChange={handleInputChange}
          placeholder="Bienvenido a MediaLab Sistema"
          required
          error={errors.subject}
        />
        
        <DashboardSelect
          id="category"
          name="category"
          label="Categoría"
          value={formData.category}
          onChange={handleInputChange}
          options={categoryOptions}
          required
          error={errors.category}
        />
        
        <DashboardTextarea
          id="description"
          name="description"
          label="Descripción"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Correo enviado a nuevos usuarios al crear su cuenta"
          rows={2}
        />
        
        <DashboardTextarea
          id="available_variables"
          name="available_variables"
          label="Variables disponibles"
          value={formData.available_variables || ''}
          onChange={handleInputChange}
          placeholder="username, email, recovery_link, project_name"
          rows={2}
          helperText="Lista de variables que se pueden usar en la plantilla, separadas por comas"
        />
        
        <div className="border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Contenido HTML
            </label>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm flex items-center ${
                  activeTab === 'editor' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-600'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                <CodeBracketIcon className="h-4 w-4 mr-1" />
                Editor
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm flex items-center ${
                  activeTab === 'preview' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-600'
                }`}
                onClick={() => setActiveTab('preview')}
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                Vista previa
              </button>
            </div>
          </div>
          
          {errors.body_html && (
            <p className="mt-1 text-sm text-red-600">{errors.body_html}</p>
          )}
          
          <div className="mt-2">
            {activeTab === 'editor' ? (
              <HtmlEditor
                value={formData.body_html}
                onChange={handleHtmlChange}
                height="400px"
              />
            ) : (
              <div className="border border-gray-300 rounded-md p-4 min-h-[400px] overflow-auto bg-white">
                <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
              </div>
            )}
          </div>
          
          <p className="mt-2 text-xs text-gray-500">
            Utiliza sintaxis {'{{variable}}'} para incluir variables en el contenido. El HTML debe ser válido.
            Cambia a la vista previa para ver cómo se verá el correo con datos de ejemplo.
          </p>
        </div>
        
        <div className="flex items-center">
          <Switch
            checked={formData.is_active}
            onChange={handleToggleActive}
            disabled={isSubmitting}
          />
          <span className="ml-3 text-sm">
            {formData.is_active ? 'Plantilla Activa' : 'Plantilla Inactiva'}
          </span>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <DashboardButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </DashboardButton>
        
        <DashboardButton
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditing ? 'Actualizar' : 'Crear'}
        </DashboardButton>
      </div>
    </form>
  );
};

export default EmailTemplateForm;