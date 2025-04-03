// src/features/request-form/components/SuccessScreen.tsx
import { useFormContext } from '@/contexts/FormContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SuccessScreenProps {
  onReset: () => void;
}

export function SuccessScreen({ onReset }: SuccessScreenProps) {
  const { formState, resetForm } = useFormContext();
  
  const getActivityTitle = () => {
    switch (formState.step1.activityType) {
      case 'unique':
        return formState.step2.uniqueActivity?.name || 'Actividad única';
      case 'recurring':
        return formState.step2.recurringActivity?.name || 'Actividad recurrente';
      case 'podcast':
        return formState.step2.podcast?.name || 'Podcast';
      case 'course':
        return formState.step2.course?.name || 'Curso';
      default:
        return 'Actividad';
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (e) {
      return dateString;
    }
  };
  
  const getActivityDate = () => {
    if (formState.step1.activityType === 'unique' && formState.step2.uniqueActivity?.startDate) {
      return formatDate(formState.step2.uniqueActivity.startDate);
    }
    return '';
  };
  
  const getNumberOfServices = () => {
    return formState.step3.services.filter(s => s.selected).length;
  };
  
  const handleNewRequest = () => {
    resetForm();
    onReset();
  };
  
  // Generar un número de solicitud único
  const requestNumber = `ML-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <svg
            className="w-16 h-16 text-primary"
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
        </div>
        <h2 className="text-2xl font-bold">¡Solicitud Enviada!</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tu solicitud de servicios de MediaLab ha sido enviada con éxito. En breve recibirás un correo 
          de confirmación y el equipo de MediaLab se pondrá en contacto contigo para coordinar los detalles.
        </p>
      </div>
      
      <Card className="bg-muted/50 max-w-lg mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Resumen de la Solicitud</h3>
              <div className="w-full h-0.5 bg-border rounded-full" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actividad:</span>
                <span className="font-medium">{getActivityTitle()}</span>
              </div>
              
              {getActivityDate() && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{getActivityDate()}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicios:</span>
                <span className="font-medium">{getNumberOfServices()} seleccionados</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solicitante:</span>
                <span className="font-medium">{formState.step4.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facultad:</span>
                <span className="font-medium">{formState.step4.faculty}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número de solicitud:</span>
                <span className="font-medium">{requestNumber}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            // Simular descarga del PDF
            alert('Descargando solicitud en PDF...');
          }}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Descargar PDF
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            // Simular envío de correo
            alert('Enviando copia por correo electrónico...');
          }}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Enviar por Correo
        </Button>
        
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleNewRequest}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nueva Solicitud
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        ¿Tienes preguntas? Contáctanos a 
        <a href="mailto:medialab@galileo.edu" className="text-primary ml-1 hover:underline">
          medialab@galileo.edu
        </a>
      </p>
    </div>
  );
}