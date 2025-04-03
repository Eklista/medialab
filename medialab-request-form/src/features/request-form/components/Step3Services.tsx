// src/features/request-form/components/Step3Services.tsx
import { useState, useEffect } from 'react';
import { useFormContext, Service, Template } from '@/contexts/FormContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Datos de ejemplo para templates y servicios
const TEMPLATES: Template[] = [
  {
    id: 'template-1',
    name: 'Evento estándar',
    services: ['service-1', 'service-2', 'service-4'],
    subservices: ['subservice-1-1', 'subservice-2-1', 'subservice-4-1', 'subservice-4-2'],
  },
  {
    id: 'template-2',
    name: 'Producción de podcast',
    services: ['service-1', 'service-3', 'service-5'],
    subservices: ['subservice-1-1', 'subservice-3-1', 'subservice-3-2', 'subservice-5-1'],
  },
  {
    id: 'template-3',
    name: 'Curso completo',
    services: ['service-1', 'service-2', 'service-3', 'service-4', 'service-5'],
    subservices: ['subservice-1-1', 'subservice-2-1', 'subservice-3-1', 'subservice-4-1', 'subservice-5-1'],
  },
];

const SERVICES: Service[] = [
  {
    id: 'service-1',
    name: 'Grabación de video',
    selected: false,
    subservices: [
      { id: 'subservice-1-1', name: 'Cámara fija', selected: false },
      { id: 'subservice-1-2', name: 'Multicámara', selected: false },
      { id: 'subservice-1-3', name: 'Tomas aéreas (drone)', selected: false },
    ],
  },
  {
    id: 'service-2',
    name: 'Grabación de audio',
    selected: false,
    subservices: [
      { id: 'subservice-2-1', name: 'Micrófono de solapa', selected: false },
      { id: 'subservice-2-2', name: 'Micrófono ambiental', selected: false },
    ],
  },
  {
    id: 'service-3',
    name: 'Edición',
    selected: false,
    subservices: [
      { id: 'subservice-3-1', name: 'Edición básica', selected: false },
      { id: 'subservice-3-2', name: 'Edición avanzada', selected: false },
      { id: 'subservice-3-3', name: 'Corrección de color', selected: false },
      { id: 'subservice-3-4', name: 'Animaciones', selected: false },
    ],
  },
  {
    id: 'service-4',
    name: 'Fotografía',
    selected: false,
    subservices: [
      { id: 'subservice-4-1', name: 'Cobertura del evento', selected: false },
      { id: 'subservice-4-2', name: 'Sesión fotográfica', selected: false },
    ],
  },
  {
    id: 'service-5',
    name: 'Streaming',
    selected: false,
    subservices: [
      { id: 'subservice-5-1', name: 'Transmisión en vivo', selected: false },
      { id: 'subservice-5-2', name: 'Configuración de plataformas', selected: false },
    ],
  },
];

interface Step3ServicesProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step3Services({ onNext, onBack }: Step3ServicesProps) {
  const { formState, updateStep3 } = useFormContext();
  
  // Usar los servicios del estado o los por defecto
  const [services, setServices] = useState<Service[]>(
    formState.step3.services.length > 0
      ? formState.step3.services
      : SERVICES
  );
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    formState.step3.selectedTemplate
  );
  
  const [webAuthorization, setWebAuthorization] = useState<boolean>(
    formState.step3.webAuthorization
  );
  
  const [showTemplateWarning, setShowTemplateWarning] = useState<boolean>(false);
  
  // Función para aplicar un template
  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId);
    
    if (selectedTemplate) {
      const updatedServices = services.map(service => {
        // Marcar servicios seleccionados en la plantilla
        const serviceSelected = selectedTemplate.services.includes(service.id);
        
        // Actualizar subservicios
        const updatedSubservices = service.subservices?.map(subservice => ({
          ...subservice,
          selected: selectedTemplate.subservices.includes(subservice.id),
        }));
        
        return {
          ...service,
          selected: serviceSelected,
          subservices: updatedSubservices,
        };
      });
      
      setServices(updatedServices);
      setShowTemplateWarning(true);
    }
  };
  
  // Función para actualizar la selección de un servicio
  const toggleService = (serviceId: string, checked: boolean) => {
    setServices(prevServices =>
      prevServices.map(service => {
        if (service.id === serviceId) {
          return {
            ...service,
            selected: checked,
          };
        }
        return service;
      })
    );
  };
  
  // Función para actualizar la selección de un subservicio
  const toggleSubservice = (serviceId: string, subserviceId: string, checked: boolean) => {
    setServices(prevServices =>
      prevServices.map(service => {
        if (service.id === serviceId) {
          const updatedSubservices = service.subservices?.map(subservice => {
            if (subservice.id === subserviceId) {
              return {
                ...subservice,
                selected: checked,
              };
            }
            return subservice;
          });
          
          return {
            ...service,
            subservices: updatedSubservices,
          };
        }
        return service;
      })
    );
  };
  
  // Guardar los cambios y continuar
  const handleSubmit = () => {
    updateStep3({
      selectedTemplate,
      services,
      webAuthorization,
    });
    onNext();
  };
  
  // Obtener subservicios seleccionados para mostrar en el área de contenido
  const selectedSubservices = services
    .filter(service => service.selected)
    .flatMap(service => 
      service.subservices?.filter(subservice => subservice.selected) || []
    );
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Selección de Servicios</h2>
        <p className="text-muted-foreground text-center">
          Selecciona los servicios que necesitas para tu actividad
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-muted/50 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Opciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Plantillas</Label>
                <Select 
                  onValueChange={applyTemplate} 
                  value={selectedTemplate || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Servicios Principales</Label>
                <ScrollArea className="h-64 rounded-md border border-border p-4">
                  <div className="space-y-4">
                    {services.map(service => (
                      <div key={service.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={service.id} 
                            checked={service.selected}
                            onCheckedChange={(checked) => toggleService(service.id, checked as boolean)}
                          />
                          <Label htmlFor={service.id} className="font-medium">
                            {service.name}
                          </Label>
                        </div>
                        
                        {service.selected && service.subservices && (
                          <div className="ml-6 space-y-2">
                            {service.subservices.map(subservice => (
                              <div key={subservice.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={subservice.id}
                                  checked={subservice.selected}
                                  onCheckedChange={(checked) => 
                                    toggleSubservice(service.id, subservice.id, checked as boolean)
                                  }
                                />
                                <Label htmlFor={subservice.id} className="text-sm">
                                  {subservice.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="space-y-2">
                <Label>Autorización Web</Label>
                <RadioGroup 
                  defaultValue={webAuthorization ? "yes" : "no"}
                  onValueChange={(value) => setWebAuthorization(value === "yes")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="auth-yes" />
                    <Label htmlFor="auth-yes">Autorizo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="auth-no" />
                    <Label htmlFor="auth-no">No autorizo</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Al autorizar, permites que el contenido pueda ser utilizado en medios digitales
                  de la Universidad Galileo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="bg-muted/50 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Servicios Seleccionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {showTemplateWarning && (
                <Alert className="bg-accent/10 border-accent/20">
                  <AlertTitle className="text-accent">Plantilla aplicada</AlertTitle>
                  <AlertDescription className="text-sm">
                    Las plantillas son una guía inicial. Recomendamos revisar los servicios y 
                    ajustarlos según la necesidad específica del proyecto.
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedSubservices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <svg
                    className="w-12 h-12 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>Selecciona servicios en el panel izquierdo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services
                    .filter(service => service.selected)
                    .map(service => {
                      const selectedSubservicesForService = service.subservices?.filter(
                        subservice => subservice.selected
                      );
                      
                      if (!selectedSubservicesForService || selectedSubservicesForService.length === 0) {
                        return null;
                      }
                      
                      return (
                        <Card key={service.id} className="bg-background">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base font-medium">{service.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3">
                            <ul className="space-y-1">
                              {selectedSubservicesForService.map(subservice => (
                                <li key={subservice.id} className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  {subservice.name}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      );
                    })
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Atrás
        </Button>
        
        <Button 
          type="button"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleSubmit}
          disabled={selectedSubservices.length === 0}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}