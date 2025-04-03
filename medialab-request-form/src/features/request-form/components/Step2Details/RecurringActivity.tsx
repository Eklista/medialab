// src/features/request-form/components/Step2Details/RecurringActivity.tsx
import { useState } from 'react';
import { useFormContext, RecurringActivityDetails } from '@/contexts/FormContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isEqual, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Esquema de validación para actividad recurrente
const recurringActivitySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  faculty: z.string().min(1, "La facultad es requerida"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de finalización es requerida"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  recurrence: z.object({
    type: z.enum(["daily", "weekly", "monthly", "manual"]),
    pattern: z.string().optional(),
    selectedDates: z.array(z.string()).optional(),
  }),
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
}).refine(data => {
  // Validar que la fecha de fin no sea antes que la de inicio
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: "La fecha de finalización debe ser posterior a la fecha de inicio",
  path: ["endDate"],
}).refine(data => {
  // Si es manual, debe tener fechas seleccionadas
  if (data.recurrence.type === 'manual') {
    return data.recurrence.selectedDates && data.recurrence.selectedDates.length > 0;
  }
  return true;
}, {
  message: "Debe seleccionar al menos una fecha",
  path: ["recurrence.selectedDates"],
});

type RecurringActivityValues = z.infer<typeof recurringActivitySchema>;

interface RecurringActivityFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function RecurringActivityForm({ onNext, onBack }: RecurringActivityFormProps) {
  const { formState, updateStep2 } = useFormContext();
  const recurringActivityDetails = formState.step2.recurringActivity;
  
  // Estado para controlar el tipo de ubicación
  const [locationType, setLocationType] = useState<"university" | "external" | "virtual">(
    recurringActivityDetails?.location?.type || "university"
  );
  
  // Estado para controlar el tipo de recurrencia
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | "manual">(
    recurringActivityDetails?.recurrence?.type || "daily"
  );
  
  // Estado para las fechas seleccionadas manualmente
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    recurringActivityDetails?.recurrence?.selectedDates
      ? recurringActivityDetails.recurrence.selectedDates.map(d => new Date(d))
      : []
  );
  
  const form = useForm<RecurringActivityValues>({
    resolver: zodResolver(recurringActivitySchema),
    defaultValues: {
      name: recurringActivityDetails?.name || "",
      faculty: recurringActivityDetails?.faculty || "",
      startDate: recurringActivityDetails?.startDate || "",
      endDate: recurringActivityDetails?.endDate || "",
      startTime: recurringActivityDetails?.startTime || "",
      endTime: recurringActivityDetails?.endTime || "",
      recurrence: {
        type: recurringActivityDetails?.recurrence?.type || "daily",
        pattern: recurringActivityDetails?.recurrence?.pattern || "",
        selectedDates: recurringActivityDetails?.recurrence?.selectedDates || [],
      },
      location: {
        type: recurringActivityDetails?.location?.type || "university",
        tower: recurringActivityDetails?.location?.tower || "",
        classroom: recurringActivityDetails?.location?.classroom || "",
        address: recurringActivityDetails?.location?.address || "",
      },
      additionalDetails: recurringActivityDetails?.additionalDetails || "",
    },
  });
  
  // Función para manejar la selección de fecha en el calendario
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Verificar si la fecha ya está seleccionada
    const dateExists = selectedDates.some(d => isEqual(d, date));
    
    if (dateExists) {
      // Remover la fecha si ya está seleccionada
      const newDates = selectedDates.filter(d => !isEqual(d, date));
      setSelectedDates(newDates);
      form.setValue('recurrence.selectedDates', newDates.map(d => format(d, 'yyyy-MM-dd')));
    } else {
      // Agregar la fecha si no está seleccionada
      const newDates = [...selectedDates, date];
      setSelectedDates(newDates);
      form.setValue('recurrence.selectedDates', newDates.map(d => format(d, 'yyyy-MM-dd')));
    }
  };
  
  // Función para eliminar una fecha seleccionada
  const removeSelectedDate = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(d => !isEqual(d, dateToRemove));
    setSelectedDates(newDates);
    form.setValue('recurrence.selectedDates', newDates.map(d => format(d, 'yyyy-MM-dd')));
  };
  
  const handleSubmit = (data: RecurringActivityValues) => {
    updateStep2({
      recurringActivity: data as RecurringActivityDetails,
    });
    onNext();
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Detalles de la Actividad Recurrente</h2>
        <p className="text-muted-foreground text-center">
          Por favor proporciona los detalles específicos de tus actividades recurrentes
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Finalización</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <CardTitle className="text-lg font-medium">Recurrencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="recurrence.type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Recurrencia</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          setRecurrenceType(value as "daily" | "weekly" | "monthly" | "manual");
                        }}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily" id="daily" />
                          <Label htmlFor="daily">Diario</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label htmlFor="weekly">Semanal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly">Mensual</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual" />
                          <Label htmlFor="manual">Manual (seleccionar fechas específicas)</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(recurrenceType === "weekly" || recurrenceType === "monthly") && (
                <FormField
                  control={form.control}
                  name="recurrence.pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patrón de Recurrencia</FormLabel>
                      {recurrenceType === "weekly" && (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona los días de la semana" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lunes">Todos los lunes</SelectItem>
                            <SelectItem value="martes">Todos los martes</SelectItem>
                            <SelectItem value="miercoles">Todos los miércoles</SelectItem>
                            <SelectItem value="jueves">Todos los jueves</SelectItem>
                            <SelectItem value="viernes">Todos los viernes</SelectItem>
                            <SelectItem value="sabado">Todos los sábados</SelectItem>
                            <SelectItem value="lunes-miercoles-viernes">Lunes, Miércoles y Viernes</SelectItem>
                            <SelectItem value="martes-jueves">Martes y Jueves</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {recurrenceType === "monthly" && (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el patrón mensual" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primer-dia">Primer día del mes</SelectItem>
                            <SelectItem value="ultimo-dia">Último día del mes</SelectItem>
                            <SelectItem value="primer-lunes">Primer lunes del mes</SelectItem>
                            <SelectItem value="segundo-lunes">Segundo lunes del mes</SelectItem>
                            <SelectItem value="tercer-lunes">Tercer lunes del mes</SelectItem>
                            <SelectItem value="cuarto-lunes">Cuarto lunes del mes</SelectItem>
                            <SelectItem value="primer-viernes">Primer viernes del mes</SelectItem>
                            <SelectItem value="segundo-viernes">Segundo viernes del mes</SelectItem>
                            <SelectItem value="tercer-viernes">Tercer viernes del mes</SelectItem>
                            <SelectItem value="cuarto-viernes">Cuarto viernes del mes</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {recurrenceType === "manual" && (
                <FormField
                  control={form.control}
                  name="recurrence.selectedDates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecciona las Fechas</FormLabel>
                      <FormDescription>
                        Haz clic en las fechas para seleccionarlas o deseleccionarlas
                      </FormDescription>
                      <Tabs defaultValue="calendar" className="w-full mt-2">
                        <TabsList className="grid grid-cols-2">
                          <TabsTrigger value="calendar">Calendario</TabsTrigger>
                          <TabsTrigger value="selected">
                            Fechas Seleccionadas ({selectedDates.length})
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="calendar" className="border rounded-md p-3">
                          <Calendar
                            mode="multiple"
                            selected={selectedDates}
                            onSelect={(dates) => {
                              if (Array.isArray(dates)) {
                                setSelectedDates(dates);
                                field.onChange(dates.map(d => format(d, 'yyyy-MM-dd')));
                              }
                            }}
                            className="rounded-md border"
                            locale={es}
                          />
                        </TabsContent>
                        <TabsContent value="selected">
                          {selectedDates.length === 0 ? (
                            <div className="text-center p-6 text-muted-foreground">
                              No hay fechas seleccionadas
                            </div>
                          ) : (
                            <ScrollArea className="h-64 w-full rounded-md border p-2">
                              <div className="space-y-2">
                                {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 rounded-md bg-background">
                                    <span>{format(date, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => removeSelectedDate(date)}
                                    >
                                      <svg
                                        className="w-4 h-4 text-destructive"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          )}
                        </TabsContent>
                      </Tabs>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                          <RadioGroupItem value="university" id="rec-university" />
                          <Label htmlFor="rec-university">En Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="external" id="rec-external" />
                          <Label htmlFor="rec-external">Fuera de la Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="virtual" id="rec-virtual" />
                          <Label htmlFor="rec-virtual">Virtual</Label>
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
                    MediaLab enviará el enlace de la reunión virtual previo a cada actividad programada.
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
                      Puedes incluir detalles sobre el propósito de las actividades, público objetivo, o requerimientos especiales.
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