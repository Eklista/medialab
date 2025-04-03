// src/features/request-form/components/Step4Requester.tsx
import { useFormContext, RequesterDetails } from '@/contexts/FormContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Esquema de validación para el paso 4
const requesterSchema = z.object({
  requestDate: z.string(),
  faculty: z.string().min(1, "La facultad es requerida"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  extension: z.string().min(3, "La extensión debe tener al menos 3 caracteres"),
});

type RequesterFormValues = z.infer<typeof requesterSchema>;

interface Step4RequesterProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function Step4Requester({ onBack, onSubmit }: Step4RequesterProps) {
  const { formState, updateStep4 } = useFormContext();
  const requesterDetails = formState.step4;
  
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd');
  const formattedDateDisplay = format(today, "dd 'de' MMMM 'de' yyyy", { locale: es });
  
  const form = useForm<RequesterFormValues>({
    resolver: zodResolver(requesterSchema),
    defaultValues: {
      requestDate: formattedDate,
      faculty: requesterDetails.faculty || "",
      name: requesterDetails.name || "",
      email: requesterDetails.email || "",
      extension: requesterDetails.extension || "",
    },
  });
  
  const handleSubmit = (data: RequesterFormValues) => {
    updateStep4(data as RequesterDetails);
    onSubmit();
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Detalles del Solicitante</h2>
        <p className="text-muted-foreground text-center">
          Por favor proporciona tus datos de contacto
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Información del Solicitante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-foreground">
                    Fecha de solicitud: <strong>{formattedDateDisplay}</strong>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facultad / Departamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una facultad o departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FACTI">Facultad de Ciencia, Tecnología e Industria</SelectItem>
                          <SelectItem value="FACED">Facultad de Educación</SelectItem>
                          <SelectItem value="FACOM">Facultad de Comunicación</SelectItem>
                          <SelectItem value="FACS">Facultad de Ciencias de la Salud</SelectItem>
                          <SelectItem value="FADMI">Facultad de Administración</SelectItem>
                          <SelectItem value="RRHH">Recursos Humanos</SelectItem>
                          <SelectItem value="MARKET">Marketing</SelectItem>
                          <SelectItem value="RRPP">Relaciones Públicas</SelectItem>
                          <SelectItem value="ADMIN">Administración</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="tu.correo@galileo.edu" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="extension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extensión</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="bg-background p-4 rounded-md">
                <h3 className="text-base font-medium mb-2">Resumen de la Solicitud</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Antes de enviar tu solicitud, revisa que toda la información sea correcta.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-foreground">
                      {formState.step1.activityType === 'unique' && 'Actividad Única'}
                      {formState.step1.activityType === 'recurring' && 'Actividad Recurrente'}
                      {formState.step1.activityType === 'podcast' && 'Podcast'}
                      {formState.step1.activityType === 'course' && 'Curso'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-foreground">
                      {formState.step3.services.filter(s => s.selected).length} servicios seleccionados
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Atrás
            </Button>
            
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}