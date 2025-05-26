// src/features/dashboard/components/config/EmailTemplateForm.tsx
import React, { useState, useEffect } from 'react';
import DashboardTextInput from '../ui/DashboardTextInput';
import DashboardTextarea from '../ui/DashboardTextArea';
import DashboardSelect from '../ui/DashboardSelect';
import DashboardButton from '../ui/DashboardButton';
import Switch from '../ui/Switch';
import Badge from '../ui/Badge';
import { 
  EyeIcon, 
  CodeBracketIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  VariableIcon,
  CogIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

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
    <div className="relative border border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: height }}>
      <textarea
        value={value}
        onChange={handleChange}
        className="font-mono text-sm w-full h-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        style={{ minHeight: height, whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" }}
        spellCheck="false"
        placeholder="<!-- Escribe tu plantilla HTML aquí -->
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
  <h1>{{title}}</h1>
  <p>Hola {{username}},</p>
  <p>{{message}}</p>
  
  {% if action_url and action_text %}
  <a href='{{action_url}}' style='background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
    {{action_text}}
  </a>
  {% endif %}
  
  <p>Saludos,<br>El equipo de {{project_name}}</p>
</div>"
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
        else if (variable === 'title') newContext[variable] = 'Título de Ejemplo';
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

  // Obtener información de la categoría
  const getCategoryInfo = () => {
    const categoryInfo: Record<string, { color: string; description: string; examples: string }> = {
      general: {
        color: 'blue',
        description: 'Plantillas de uso general para comunicaciones básicas',
        examples: 'Bienvenida, confirmaciones, avisos generales'
      },
      user: {
        color: 'purple',
        description: 'Plantillas relacionadas con la gestión de usuarios',
        examples: 'Registro, activación, cambio de contraseña'
      },
      service: {
        color: 'green',
        description: 'Plantillas para servicios y producciones',
        examples: 'Confirmación de servicios, actualizaciones de estado'
      },
      notification: {
        color: 'amber',
        description: 'Plantillas para notificaciones del sistema',
        examples: 'Alertas, recordatorios, avisos importantes'
      },
      system: {
        color: 'red',
        description: 'Plantillas técnicas del sistema',
        examples: 'Errores, mantenimiento, actualizaciones'
      }
    };

    return categoryInfo[formData.category] || categoryInfo.general;
  };

  const categoryInfo = getCategoryInfo();
  
  return (
    <div className="max-w-6xl mx-auto">
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
              <h3 className="text-sm font-medium text-blue-800">Acerca de las Plantillas de Correo</h3>
              <p className="mt-1 text-sm text-blue-700">
                Las plantillas permiten crear correos consistentes y reutilizables. 
                Utiliza variables como <code className="bg-blue-100 px-1 rounded">{'{{username}}'}</code> para personalizar el contenido.
              </p>
            </div>
          </div>
        </div>
        
        {/* Basic Information Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <EnvelopeIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
              <p className="text-sm text-gray-500">Datos identificadores de la plantilla</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="code"
              name="code"
              label="Código"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="welcome_email"
              required
              error={errors.code}
              disabled={isEditing} // Solo deshabilitado en edición
              helperText="Identificador único (no editable después de crear)"
              icon={<CogIcon className="h-5 w-5" />}
              maxLength={50}
              showCharCount
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
              icon={<DocumentTextIcon className="h-5 w-5" />}
              maxLength={100}
              showCharCount
            />
          </div>
        </div>

        {/* Email Content Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <EnvelopeIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contenido del Correo</h3>
              <p className="text-sm text-gray-500">Asunto y configuración básica</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardTextInput
              id="subject"
              name="subject"
              label="Asunto"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Bienvenido a MediaLab Sistema"
              required
              error={errors.subject}
              icon={<EnvelopeIcon className="h-5 w-5" />}
              maxLength={200}
              showCharCount
              helperText="Puede incluir variables como {{username}}"
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
              icon={<DocumentTextIcon className="h-5 w-5" />}
              className="mb-0"
            />
          </div>

          {/* Category Information */}
          <div className={`mt-4 rounded-xl border border-${categoryInfo.color}-200 bg-${categoryInfo.color}-50 p-4`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-${categoryInfo.color}-100`}>
                  <SparklesIcon className={`h-4 w-4 text-${categoryInfo.color}-600`} />
                </div>
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium text-${categoryInfo.color}-800`}>
                  Categoría: {categoryOptions.find(c => c.value === formData.category)?.label}
                </h4>
                <p className={`mt-1 text-sm text-${categoryInfo.color}-700`}>
                  {categoryInfo.description}
                </p>
                <p className={`mt-2 text-xs text-${categoryInfo.color}-600 font-medium`}>
                  Ejemplos: {categoryInfo.examples}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Variables Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <VariableIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Variables y Descripción</h3>
              <p className="text-sm text-gray-500">Variables disponibles y documentación</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <DashboardTextarea
              id="available_variables"
              name="available_variables"
              label="Variables disponibles"
              value={formData.available_variables || ''}
              onChange={handleInputChange}
              placeholder="username, email, recovery_link, project_name, title, message, action_url, action_text"
              rows={3}
              maxLength={500}
              showCharCount
              helperText="Lista de variables separadas por comas que se pueden usar en la plantilla"
            />
            
            <DashboardTextarea
              id="description"
              name="description"
              label="Descripción (Opcional)"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Correo enviado a nuevos usuarios al crear su cuenta. Incluye enlace de activación y datos básicos del sistema..."
              rows={3}
              maxLength={500}
              showCharCount
              helperText="Información sobre cuándo y cómo se usa esta plantilla"
            />
          </div>
        </div>
        
        {/* HTML Content Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                <CodeBracketIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contenido HTML</h3>
                <p className="text-sm text-gray-500">Editor y vista previa de la plantilla</p>
              </div>
            </div>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'editor' 
                    ? 'bg-indigo-100 text-indigo-800 border-r border-indigo-200' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                <CodeBracketIcon className="h-4 w-4" />
                Editor
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'preview' 
                    ? 'bg-indigo-100 text-indigo-800 border-l border-indigo-200' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('preview')}
              >
                <EyeIcon className="h-4 w-4" />
                Vista previa
              </button>
            </div>
          </div>
          
          {errors.body_html && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.body_html}</p>
            </div>
          )}
          
          <div className="rounded-lg border border-gray-300 overflow-hidden">
            {activeTab === 'editor' ? (
              <HtmlEditor
                value={formData.body_html}
                onChange={handleHtmlChange}
                height="500px"
              />
            ) : (
              <div className="p-6 min-h-[500px] overflow-auto bg-gray-50">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto">
                  <div className="p-6">
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900">Vista Previa del Correo</h4>
                      <p className="text-sm text-gray-500">
                        Asunto: {formData.subject ? renderPreview().replace(/{{.*?}}/g, (match) => {
                          const variable = match.slice(2, -2).trim();
                          return previewContext[variable] || match;
                        }) : 'Sin asunto'}
                      </p>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderPreview() }} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ayuda de Sintaxis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p><strong>Variables:</strong> <code>{'{{variable}}'}</code></p>
                <p><strong>Condicionales:</strong> <code>{'{% if condition %} ... {% endif %}'}</code></p>
              </div>
              <div>
                <p><strong>Enlaces:</strong> <code>{'<a href="{{action_url}}">{{action_text}}</a>'}</code></p>
                <p><strong>Vista previa:</strong> Usa datos de ejemplo para probar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <CogIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Estado de la Plantilla</h3>
              <p className="text-sm text-gray-500">Configuración de activación</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Estado de activación</h4>
              <p className="text-sm text-gray-500">
                {formData.is_active 
                  ? 'La plantilla está activa y disponible para usar en el sistema' 
                  : 'La plantilla está inactiva y no se puede usar'
                }
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onChange={handleToggleActive}
              disabled={isSubmitting}
              size="md"
              onLabel="Activa"
              offLabel="Inactiva"
            />
          </div>
        </div>

        {/* Preview Summary */}
        {(formData.name || formData.code) && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-2">Resumen de la Plantilla</h4>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900">
                          {formData.name || 'Nombre no especificado'}
                        </h5>
                        <Badge variant={formData.is_active ? "success" : "secondary"} size="sm">
                          {formData.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {formData.code || 'codigo_no_especificado'}
                        </span>
                        <Badge variant="info" size="sm">
                          {categoryOptions.find(c => c.value === formData.category)?.label}
                        </Badge>
                      </div>
                      
                      {formData.subject && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Asunto:</strong> {formData.subject}
                        </p>
                      )}
                      
                      {formData.available_variables && (
                        <p className="text-xs text-gray-500">
                          <strong>Variables:</strong> {formData.available_variables}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Vista previa de cómo aparecerá la plantilla en el sistema.
                </p>
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
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </DashboardButton>
          
          <DashboardButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Actualizar Plantilla' : 'Crear Plantilla'}
          </DashboardButton>
        </div>
      </form>
    </div>
  );
};

export default EmailTemplateForm;