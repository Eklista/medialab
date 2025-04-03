// src/features/request-form/components/Step2Details/UniqueActivity.tsx
import { useState } from 'react';
import { useFormContext, UniqueActivityDetails } from '@/contexts/FormContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Esquema de validación para la actividad única
const uniqueActivitySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  faculty: z.string().min(1, "La facultad es requerida"),
  startDate: z.string().min(1, "La fecha es requerida"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  location: z.object({
    type: z.enum(["university", "external", "virtual"]),
    tower: z.string().optional(),
    classroom: z.string().optional(),
    address: z.string().optional(),
  }).refine(data => {
    if (data.type === 'university') {
      return !!data.tower && !!data.classroom;
    } else if (data.type === 'external') {
      return !!data.address;
    }
    return true;
  }, {
    message: "Complete la información de ubicación",
    path: ["type"],
  }),
  additionalDetails: z.string().optional(),
});

type UniqueActivityValues = z.infer<typeof uniqueActivitySchema>;

interface UniqueActivityFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function UniqueActivityForm({ onNext, onBack }: UniqueActivityFormProps) {
  const { formState, updateStep2 } = useFormContext();
  const uniqueActivityDetails = formState.step2.uniqueActivity;
  
  // Estado para controlar el tipo de ubicación
  const [locationType, setLocationType] = useState<"university" | "external" | "virtual">(
    uniqueActivityDetails?.location?.type || "university"
  );
  
  const form = useForm<UniqueActivityValues>({
    resolver: zodResolver(uniqueActivitySchema),
    defaultValues: {
      name: uniqueActivityDetails?.name || "",
      faculty: uniqueActivityDetails?.faculty || "",
      startDate: uniqueActivityDetails?.startDate || "",
      startTime: uniqueActivityDetails?.startTime || "",
      endTime: uniqueActivityDetails?.endTime || "",
      location: {
        type: uniqueActivityDetails?.location?.type || "university",
        tower: uniqueActivityDetails?.location?.tower || "",
        classroom: uniqueActivityDetails?.location?.classroom || "",
        address: uniqueActivityDetails?.location?.address || "",
      },
      additionalDetails: uniqueActivityDetails?.additionalDetails || "",
    },
  });
  
  const handleSubmit = (data: UniqueActivityValues) => {
    updateStep2({
      uniqueActivity: data as UniqueActivityDetails,
    });
    onNext();
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Detalles de la Actividad Única</h2>
        <p className="text-muted-foreground text-center">
          Por favor proporciona los detalles específicos de tu actividad
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Actividad</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo de la actividad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facultad</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una facultad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FACTI">Facultad de Ciencia, Tecnología e Industria</SelectItem>
                          <SelectItem value="FACED">Facultad de Educación</SelectItem>
                          <SelectItem value="FACOM">Facultad de Comunicación</SelectItem>
                          <SelectItem value="FACS">Facultad de Ciencias de la Salud</SelectItem>
                          <SelectItem value="FADMI">Facultad de Administración</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Finalización</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="location.type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Ubicación</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          setLocationType(value as "university" | "external" | "virtual");
                        }}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="university" id="university" />
                          <Label htmlFor="university">En Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="external" id="external" />
                          <Label htmlFor="external">Fuera de la Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="virtual" id="virtual" />
                          <Label htmlFor="virtual">Virtual</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {locationType === "university" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location.tower"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Torre</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una torre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Torre A">Torre A</SelectItem>
                            <SelectItem value="Torre B">Torre B</SelectItem>
                            <SelectItem value="Torre C">Torre C</SelectItem>
                            <SelectItem value="Torre D">Torre D</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location.classroom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salón</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de salón" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {locationType === "external" && (
                <FormField
                  control={form.control}
                  name="location.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dirección completa del lugar" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {locationType === "virtual" && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-muted-foreground text-sm">
                    <svg
                      className="w-5 h-5 inline-block mr-2 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    MediaLab enviará el enlace de la reunión virtual previo a la actividad.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="additionalDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalles Adicionales</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Proporciona cualquier información adicional relevante para MediaLab"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Puedes incluir detalles sobre el propósito de la actividad, público objetivo, o requerimientos especiales.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}