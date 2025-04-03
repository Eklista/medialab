// src/features/request-form/components/Step2Details/Podcast.tsx
import { useState } from 'react';
import { useFormContext, PodcastDetails } from '@/contexts/FormContext';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

// Esquema para los episodios de podcast
const episodeSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  topic: z.string().min(3, "El tema debe tener al menos 3 caracteres"),
  recordingTime: z.string().min(1, "La hora de grabación es requerida"),
  date: z.string().min(1, "La fecha es requerida"),
});

// Esquema para el formulario de podcast
const podcastSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  faculty: z.string().min(1, "La facultad es requerida"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().optional(),
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
  moderators: z.array(z.string()).min(1, "Debe agregar al menos un moderador"),
  episodes: z.array(episodeSchema).min(1, "Debe agregar al menos un episodio"),
  additionalDetails: z.string().optional(),
});

type PodcastFormValues = z.infer<typeof podcastSchema>;
type EpisodeFormValues = z.infer<typeof episodeSchema>;

interface PodcastFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function PodcastForm({ onNext, onBack }: PodcastFormProps) {
  const { formState, updateStep2 } = useFormContext();
  const podcastDetails = formState.step2.podcast;
  
  // Estado para controlar el tipo de ubicación
  const [locationType, setLocationType] = useState<"university" | "external" | "virtual">(
    podcastDetails?.location?.type || "university"
  );
  
  // Estado para controlar si es recurrente
  const [isRecurring, setIsRecurring] = useState<boolean>(
    podcastDetails?.isRecurring || false
  );
  
  // Estado para los moderadores
  const [moderatorInput, setModeratorInput] = useState<string>("");
  const [moderators, setModerators] = useState<string[]>(
    podcastDetails?.moderators || []
  );
  
  // Estado para el episodio que se está editando
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeFormValues | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeFormValues[]>(
    podcastDetails?.episodes || []
  );
  
  const form = useForm<PodcastFormValues>({
    resolver: zodResolver(podcastSchema),
    defaultValues: {
      name: podcastDetails?.name || "",
      faculty: podcastDetails?.faculty || "",
      startDate: podcastDetails?.startDate || "",
      endDate: podcastDetails?.endDate || "",
      startTime: podcastDetails?.startTime || "",
      endTime: podcastDetails?.endTime || "",
      isRecurring: podcastDetails?.isRecurring || false,
      recurrence: podcastDetails?.recurrence || {
        type: "weekly",
        pattern: "",
        selectedDates: [],
      },
      location: {
        type: podcastDetails?.location?.type || "university",
        tower: podcastDetails?.location?.tower || "",
        classroom: podcastDetails?.location?.classroom || "",
        address: podcastDetails?.location?.address || "",
      },
      moderators: podcastDetails?.moderators || [],
      episodes: podcastDetails?.episodes || [],
      additionalDetails: podcastDetails?.additionalDetails || "",
    },
  });
  
  // Función para agregar un moderador
  const addModerator = () => {
    if (moderatorInput.trim() !== "") {
      const updatedModerators = [...moderators, moderatorInput.trim()];
      setModerators(updatedModerators);
      form.setValue('moderators', updatedModerators);
      setModeratorInput("");
    }
  };
  
  // Función para eliminar un moderador
  const removeModerator = (index: number) => {
    const updatedModerators = [...moderators];
    updatedModerators.splice(index, 1);
    setModerators(updatedModerators);
    form.setValue('moderators', updatedModerators);
  };
  
  // Función para agregar un nuevo episodio
  const addEpisode = () => {
    const newEpisode: EpisodeFormValues = {
      id: uuidv4(),
      name: "",
      topic: "",
      recordingTime: "",
      date: form.getValues('startDate'), // Usar la fecha de inicio como predeterminada
    };
    setCurrentEpisode(newEpisode);
  };
  
  // Función para guardar el episodio actual
  const saveEpisode = (episode: EpisodeFormValues) => {
    const existingIndex = episodes.findIndex(e => e.id === episode.id);
    let updatedEpisodes;
    
    if (existingIndex >= 0) {
      // Actualizar episodio existente
      updatedEpisodes = [...episodes];
      updatedEpisodes[existingIndex] = episode;
    } else {
      // Agregar nuevo episodio
      updatedEpisodes = [...episodes, episode];
    }
    
    setEpisodes(updatedEpisodes);
    form.setValue('episodes', updatedEpisodes);
    setCurrentEpisode(null);
  };
  
  // Función para editar un episodio existente
  const editEpisode = (episode: EpisodeFormValues) => {
    setCurrentEpisode(episode);
  };
  
  // Función para eliminar un episodio
  const deleteEpisode = (id: string) => {
    const updatedEpisodes = episodes.filter(e => e.id !== id);
    setEpisodes(updatedEpisodes);
    form.setValue('episodes', updatedEpisodes);
  };
  
  // Formulario para la edición de episodios
  const episodeForm = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: currentEpisode || {
      id: "",
      name: "",
      topic: "",
      recordingTime: "",
      date: "",
    },
  });
  
  // Actualizar el formulario de episodio cuando cambia el episodio actual
  React.useEffect(() => {
    if (currentEpisode) {
      episodeForm.reset(currentEpisode);
    }
  }, [currentEpisode, episodeForm]);
  
  // Manejar el envío del formulario principal
  const handleSubmit = (data: PodcastFormValues) => {
    updateStep2({
      podcast: data as PodcastDetails,
    });
    onNext();
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Detalles del Podcast</h2>
        <p className="text-muted-foreground text-center">
          Por favor proporciona los detalles para la grabación de tu podcast
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Información del Podcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Podcast</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del podcast" {...field} />
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
                      <FormLabel>Fecha de Finalización {!isRecurring && "(Opcional)"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={!isRecurring}
                          required={isRecurring}
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
                        ¿Es un podcast recurrente?
                      </FormLabel>
                      <FormDescription>
                        Si se graban varios episodios con una frecuencia regular.
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
                          <RadioGroupItem value="university" id="pod-university" />
                          <Label htmlFor="pod-university">En Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="external" id="pod-external" />
                          <Label htmlFor="pod-external">Fuera de la Universidad</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="virtual" id="pod-virtual" />
                          <Label htmlFor="pod-virtual">Virtual</Label>
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
                    MediaLab enviará el enlace de la reunión virtual previo a cada grabación.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Moderadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-2">
                <Input
                  placeholder="Nombre del moderador"
                  value={moderatorInput}
                  onChange={(e) => setModeratorInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addModerator}
                  disabled={!moderatorInput.trim()}
                >
                  Agregar
                </Button>
              </div>
              
              {moderators.length > 0 ? (
                <ScrollArea className="h-40 border rounded-md p-2">
                  <div className="space-y-2">
                    {moderators.map((moderator, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 rounded-md bg-background"
                      >
                        <span>{moderator}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeModerator(index)}
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
              ) : (
                <div className="text-center p-6 text-muted-foreground border rounded-md">
                  No hay moderadores agregados
                </div>
              )}
              
              <FormField
                control={form.control}
                name="moderators"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Episodios</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEpisode}
                disabled={!!currentEpisode}
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
                Agregar Episodio
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentEpisode ? (
                <Card className="border border-primary">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      {episodes.some(e => e.id === currentEpisode.id) 
                        ? "Editar Episodio" 
                        : "Nuevo Episodio"
                      }
                    </CardTitle>
                  </CardHeader>
                  <Form {...episodeForm}>
                    <form 
                      onSubmit={episodeForm.handleSubmit((data) => saveEpisode(data))}
                      className="space-y-4"
                    >
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={episodeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre del Episodio</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nombre del episodio" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={episodeForm.control}
                            name="topic"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tema</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tema del episodio" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={episodeForm.control}
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
                          
                          <FormField
                            control={episodeForm.control}
                            name="recordingTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hora de Grabación</FormLabel>
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
                          onClick={() => setCurrentEpisode(null)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          variant="default"
                        >
                          Guardar Episodio
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </Card>
              ) : episodes.length > 0 ? (
                <ScrollArea className="h-60 border rounded-md p-2">
                  <div className="space-y-3">
                    {episodes.map((episode) => (
                      <div 
                        key={episode.id} 
                        className="flex flex-col p-3 rounded-md bg-background"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{episode.name}</h4>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => editEpisode(episode)}
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
                              onClick={() => deleteEpisode(episode.id)}
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
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center mb-1">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                            <span>{episode.topic}</span>
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
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
                            <span>
                              {format(new Date(episode.date), "d 'de' MMMM", { locale: es })} - {episode.recordingTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-6 text-muted-foreground border rounded-md">
                  No hay episodios agregados
                </div>
              )}
              
              <FormField
                control={form.control}
                name="episodes"
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
                      Puedes incluir detalles sobre el propósito del podcast, audiencia objetivo, o requerimientos especiales.
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
              disabled={!!currentEpisode}
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}