// src/features/request-form/components/Step2Details/Course.tsx
import React, { useState, useEffect } from 'react';
import { useFormContext, CourseDetails } from '@/contexts/FormContext';
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

// Esquema para los horarios de clase
const classScheduleSchema = z.object({
  id: z.string(),
  date: z.string().min(1, "La fecha es requerida"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
});

// Esquema para los cursos
const courseItemSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  classCount: z.coerce.number().int().min(1, "Debe haber al menos una clase"),
  schedule: z.array(classScheduleSchema).min(1, "Debe agregar al menos un horario"),
});

// Esquema para el formulario de cursos
const courseFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  faculty: z.string().min(1, "La facultad es requerida"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de finalización es requerida"),
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
  isRecurring: z.boolean(),
  recurrence: z.object({
    type: z.enum(["daily", "weekly", "monthly", "manual"]).optional(),
    pattern: z.string().optional(),
    selectedDates: z.array(z.string()).optional(),
  }).optional(),
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
  courses: z.array(courseItemSchema).min(1, "Debe agregar al menos un curso"),
  additionalDetails: z.string().optional(),
}).refine(data => {
  // Validar que la fecha de fin no sea antes que la de inicio
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: "La fecha de finalización debe ser posterior a la fecha de inicio",
  path: ["endDate"],
});

type CourseFormValues = z.infer<typeof courseFormSchema>;
type CourseItemValues = z.infer<typeof courseItemSchema>;
type ClassScheduleValues = z.infer<typeof classScheduleSchema>;

interface CourseFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function CourseForm({ onNext, onBack }: CourseFormProps) {
  const { formState, updateStep2 } = useFormContext();
  const courseDetails = formState.step2.course;
  
  // Estado para controlar el tipo de ubicación
  const [locationType, setLocationType] = useState<"university" | "external" | "virtual">(
    courseDetails?.location?.type || "university"
  );
  
  // Estado para controlar si es recurrente
  const [isRecurring, setIsRecurring] = useState<boolean>(
    courseDetails?.isRecurring || false
  );
  
  // Estado para el curso que se está editando
  const [currentCourse, setCurrentCourse] = useState<CourseItemValues | null>(null);
  const [courses, setCourses] = useState<CourseItemValues[]>(
    courseDetails?.courses || []
  );
  
  // Estado para el horario de clase que se está editando
  const [currentSchedule, setCurrentSchedule] = useState<ClassScheduleValues | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: courseDetails?.name || "",
      faculty: courseDetails?.faculty || "",
      startDate: courseDetails?.startDate || "",
      endDate: courseDetails?.endDate || "",
      startTime: courseDetails?.startTime || "",
      endTime: courseDetails?.endTime || "",
      isRecurring: courseDetails?.isRecurring || false,
      recurrence: courseDetails?.recurrence || {
        type: "weekly",
        pattern: "",
        selectedDates: [],
      },
      location: {
        type: courseDetails?.location?.type || "university",
        tower: courseDetails?.location?.tower || "",
        classroom: courseDetails?.location?.classroom || "",
        address: courseDetails?.location?.address || "",
      },
      courses: courseDetails?.courses || [],
      additionalDetails: courseDetails?.additionalDetails || "",
    },
  });
  
  // Formulario para la edición de cursos
  const courseForm = useForm<CourseItemValues>({
    resolver: zodResolver(courseItemSchema),
    defaultValues: currentCourse || {
      id: "",
      name: "",
      classCount: 1,
      schedule: [],
    },
  });
  
  // Formulario para la edición de horarios
  const scheduleForm = useForm<ClassScheduleValues>({
    resolver: zodResolver(classScheduleSchema),
    defaultValues: currentSchedule || {
      id: "",
      date: "",
      startTime: "",
      endTime: "",
    },
  });
  
  // Actualizar el formulario de curso cuando cambia el curso actual
  React.useEffect(() => {
    if (currentCourse) {
      courseForm.reset(currentCourse);
    }
  }, [currentCourse, courseForm]);
  
  // Actualizar el formulario de horario cuando cambia el horario actual
  React.useEffect(() => {
    if (currentSchedule) {
      scheduleForm.reset(currentSchedule);
    }
  }, [currentSchedule, scheduleForm]);
  
  // Función para agregar un nuevo curso
  const addCourse = () => {
    const newCourse: CourseItemValues = {
      id: uuidv4(),
      name: "",
      classCount: 1,
      schedule: [],
    };
    setCurrentCourse(newCourse);
  };
  
  // Función para guardar el curso actual
  const saveCourse = (course: CourseItemValues) => {
    const existingIndex = courses.findIndex(c => c.id === course.id);
    let updatedCourses;
    
    if (existingIndex >= 0) {
      // Actualizar curso existente
      updatedCourses = [...courses];
      updatedCourses[existingIndex] = course;
    } else {
      // Agregar nuevo curso
      updatedCourses = [...courses, course];
    }
    
    setCourses(updatedCourses);
    form.setValue('courses', updatedCourses);
    setCurrentCourse(null);
  };
  
  // Función para editar un curso existente
  const editCourse = (course: CourseItemValues) => {
    setCurrentCourse(course);
  };
  
  // Función para eliminar un curso
  const deleteCourse = (id: string) => {
    const updatedCourses = courses.filter(c => c.id !== id);
    setCourses(updatedCourses);
    form.setValue('courses', updatedCourses);
  };
  
  // Función para agregar un nuevo horario de clase
  const addSchedule = (courseId: string) => {
    setCurrentCourseId(courseId);
    const newSchedule: ClassScheduleValues = {
      id: uuidv4(),
      date: form.getValues('startDate'), // Usar la fecha de inicio como predeterminada
      startTime: form.getValues('startTime'),
      endTime: form.getValues('endTime'),
    };
    setCurrentSchedule(newSchedule);
  };
  
  // Función para guardar el horario actual
  const saveSchedule = (schedule: ClassScheduleValues) => {
    if (!currentCourseId) return;
    
    const courseIndex = courses.findIndex(c => c.id === currentCourseId);
    if (courseIndex === -1) return;
    
    const course = courses[courseIndex];
    const scheduleIndex = course.schedule.findIndex(s => s.id === schedule.id);
    
    let updatedSchedule;
    if (scheduleIndex >= 0) {
      // Actualizar horario existente
      updatedSchedule = [...course.schedule];
      updatedSchedule[scheduleIndex] = schedule;
    } else {
      // Agregar nuevo horario
      updatedSchedule = [...course.schedule, schedule];
    }
    
    const updatedCourse = {
      ...course,
      schedule: updatedSchedule,
    };
    
    const updatedCourses = [...courses];
    updatedCourses[courseIndex] = updatedCourse;
    
    setCourses(updatedCourses);
    form.setValue('courses', updatedCourses);
    
    // Si estamos editando un curso, actualizar también el curso actual
    if (currentCourse && currentCourse.id === currentCourseId) {
      setCurrentCourse({
        ...currentCourse,
        schedule: updatedSchedule,
      });
      courseForm.setValue('schedule', updatedSchedule);
    }
    
    setCurrentSchedule(null);
    setCurrentCourseId(null);
  };
  
  // Función para editar un horario existente
  const editSchedule = (courseId: string, schedule: ClassScheduleValues) => {
    setCurrentCourseId(courseId);
    setCurrentSchedule(schedule);
  };
  
  // Función para eliminar un horario
  const deleteSchedule = (courseId: string, scheduleId: string) => {
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return;
    
    const course = courses[courseIndex];
    const updatedSchedule = course.schedule.filter(s => s.id !== scheduleId);
    
    const updatedCourse = {
      ...course,
      schedule: updatedSchedule,
    };
    
    const updatedCourses = [...courses];
    updatedCourses[courseIndex] = updatedCourse;
    
    setCourses(updatedCourses);
    form.setValue('courses', updatedCourses);
    
    // Si estamos editando un curso, actualizar también el curso actual
    if (currentCourse && currentCourse.id === courseId) {
      setCurrentCourse({
        ...currentCourse,
        schedule: updatedSchedule,
      });
      courseForm.setValue('schedule', updatedSchedule);
    }
  };
  
  // Manejar el envío del formulario principal
  const handleSubmit = (data: CourseFormValues) => {
    updateStep2({
      course: data as CourseDetails,
    });
    onNext();
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Detalles del Curso</h2>
        <p className="text-muted-foreground text-center">
          Por favor proporciona los detalles para la grabación de tus cursos
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Información de la Carrera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Carrera</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la carrera" {...field} />
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
                      <FormLabel>Hora de Inicio (General)</FormLabel>
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
                      <FormLabel>Hora de Finalización (General)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsRecurring(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        ¿Es un curso recurrente?
                      </FormLabel>
                      <FormDescription>
                        Si el curso se repite con una frecuencia regular.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
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
                          <RadioGroupItem value="university" id="course-university" />
                          <Label htmlFor="course-university">En Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="external" id="course-external" />
                          <Label htmlFor="course-external">Fuera de la Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="virtual" id="course-virtual" />
                          <Label htmlFor="course-virtual">Virtual</Label>
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
                    MediaLab enviará el enlace de la reunión virtual previo a cada clase.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Cursos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCourse}
                disabled={!!currentCourse || !!currentSchedule}
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
                Agregar Curso
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentCourse ? (
                <Card className="border border-primary">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      {courses.some(c => c.id === currentCourse.id) 
                        ? "Editar Curso" 
                        : "Nuevo Curso"
                      }
                    </CardTitle>
                  </CardHeader>
                  <Form {...courseForm}>
                    <form className="space-y-4">
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={courseForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre del Curso</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nombre del curso" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={courseForm.control}
                            name="classCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad de Clases</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    placeholder="Número de clases" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <FormLabel>Horarios de Clase</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSchedule(currentCourse.id)}
                              disabled={!!currentSchedule}
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
                              Agregar Horario
                            </Button>
                          </div>
                          
                          {currentCourse.schedule.length > 0 ? (
                            <ScrollArea className="h-40 border rounded-md p-2">
                              <div className="space-y-2">
                                {currentCourse.schedule.map((schedule) => (
                                  <div 
                                    key={schedule.id} 
                                    className="flex justify-between items-center p-2 rounded-md bg-background"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {format(new Date(schedule.date), "EEEE dd 'de' MMMM", { locale: es })}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {schedule.startTime} - {schedule.endTime}
                                      </div>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => editSchedule(currentCourse.id, schedule)}
                                      >
                                        <svg
                                          className="w-4 h-4 text-primary"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => deleteSchedule(currentCourse.id, schedule.id)}
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
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center p-4 border rounded-md text-muted-foreground text-sm">
                              No hay horarios agregados
                            </div>
                          )}
                          
                          <FormField
                            control={courseForm.control}
                            name="schedule"
                            render={() => (
                              <FormItem>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={() => setCurrentCourse(null)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="button"
                          variant="default"
                          onClick={() => saveCourse(courseForm.getValues())}
                          disabled={
                            !courseForm.getValues().name || 
                            courseForm.getValues().classCount < 1 ||
                            courseForm.getValues().schedule.length === 0
                          }
                        >
                          Guardar Curso
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </Card>
              ) : currentSchedule ? (
                <Card className="border border-primary">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      {currentCourseId && courses.find(c => c.id === currentCourseId)?.schedule.some(s => s.id === currentSchedule.id)
                        ? "Editar Horario" 
                        : "Nuevo Horario"
                      }
                    </CardTitle>
                  </CardHeader>
                  <Form {...scheduleForm}>
                    <form 
                      onSubmit={scheduleForm.handleSubmit((data) => saveSchedule(data))}
                      className="space-y-4"
                    >
                      <CardContent className="space-y-4">
                        <FormField
                          control={scheduleForm.control}
                          name="date"
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={scheduleForm.control}
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
                            control={scheduleForm.control}
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
                      <CardFooter className="flex justify-between">
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCurrentSchedule(null);
                            setCurrentCourseId(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          variant="default"
                        >
                          Guardar Horario
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </Card>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="bg-background">
                      <CardHeader className="flex flex-row items-center justify-between py-3">
                        <div>
                          <CardTitle className="text-base font-semibold">{course.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{course.classCount} clases</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editCourse(course)}
                          >
                            <svg
                              className="w-4 h-4 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteCourse(course.id)}
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
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Horarios</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addSchedule(course.id)}
                              disabled={!!currentSchedule}
                              className="h-7 px-2 text-xs"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
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
                              Agregar
                            </Button>
                          </div>
                          
                          {course.schedule.length > 0 ? (
                            <div className="space-y-1 ml-2">
                              {course.schedule.map((schedule) => (
                                <div 
                                  key={schedule.id} 
                                  className="flex justify-between items-center p-2 text-sm border-l-2 border-primary pl-2"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {format(new Date(schedule.date), "dd/MM/yyyy", { locale: es })}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      {schedule.startTime} - {schedule.endTime}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => editSchedule(course.id, schedule)}
                                    >
                                      <svg
                                        className="w-3 h-3 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => deleteSchedule(course.id, schedule.id)}
                                    >
                                      <svg
                                        className="w-3 h-3 text-destructive"
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
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-2 text-muted-foreground text-xs">
                              No hay horarios agregados
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground border rounded-md">
                  No hay cursos agregados. Haga clic en "Agregar Curso" para comenzar.
                </div>
              )}
              
              <FormField
                control={form.control}
                name="courses"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      Puedes incluir detalles sobre el contenido de los cursos, requerimientos especiales o cualquier otra información importante.
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
              disabled={!!currentCourse || !!currentSchedule}
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}