// src/lib/mock-data.ts
import { 
    Service, 
    Template, 
    UniqueActivityDetails, 
    RecurringActivityDetails,
    PodcastDetails, 
    CourseDetails
  } from '@/contexts/FormContext';
  
  // Plantillas predefinidas para selección de servicios
  export const TEMPLATES: Template[] = [
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
  
  // Servicios disponibles
  export const SERVICES: Service[] = [
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
  
  // Datos de ejemplo para actividad única
  export const SAMPLE_UNIQUE_ACTIVITY: UniqueActivityDetails = {
    name: 'Conferencia de Inteligencia Artificial',
    faculty: 'FACTI',
    startDate: '2025-05-15',
    startTime: '14:00',
    endTime: '17:00',
    location: {
      type: 'university',
      tower: 'Torre B',
      classroom: '403',
    },
    additionalDetails: 'Conferencia con expertos internacionales sobre IA y Machine Learning.',
  };
  
  // Datos de ejemplo para actividad recurrente
  export const SAMPLE_RECURRING_ACTIVITY: RecurringActivityDetails = {
    name: 'Taller de Diseño UX/UI',
    faculty: 'FACOM',
    startDate: '2025-06-01',
    endDate: '2025-07-15',
    startTime: '10:00',
    endTime: '12:00',
    recurrence: {
      type: 'weekly',
      pattern: 'martes-jueves',
    },
    location: {
      type: 'university',
      tower: 'Torre C',
      classroom: '205',
    },
    additionalDetails: 'Taller práctico de diseño de interfaces y experiencia de usuario.',
  };
  
  // Datos de ejemplo para podcast
  export const SAMPLE_PODCAST: PodcastDetails = {
    name: 'Tecnología en 10 Minutos',
    faculty: 'FACTI',
    startDate: '2025-05-20',
    endDate: '2025-07-20',
    startTime: '15:00',
    endTime: '16:00',
    isRecurring: true,
    recurrence: {
      type: 'weekly',
      pattern: 'miercoles',
    },
    location: {
      type: 'university',
      tower: 'Torre A',
      classroom: '105',
    },
    moderators: ['Dr. Juan Pérez', 'Ing. María Rodríguez'],
    episodes: [
      {
        id: 'ep-1',
        name: 'Introducción a la IA',
        topic: 'Conceptos básicos de inteligencia artificial',
        recordingTime: '15:00',
        date: '2025-05-20',
      },
      {
        id: 'ep-2',
        name: 'Machine Learning',
        topic: 'Algoritmos y aplicaciones prácticas',
        recordingTime: '15:00',
        date: '2025-05-27',
      },
      {
        id: 'ep-3',
        name: 'Blockchain y Criptomonedas',
        topic: 'Tecnología detrás de las criptomonedas',
        recordingTime: '15:00',
        date: '2025-06-03',
      },
    ],
    additionalDetails: 'Podcast educativo sobre tecnologías emergentes.',
  };
  
  // Datos de ejemplo para curso
  export const SAMPLE_COURSE: CourseDetails = {
    name: 'Desarrollo Full Stack',
    faculty: 'FACTI',
    startDate: '2025-08-10',
    endDate: '2025-11-20',
    startTime: '17:00',
    endTime: '19:00',
    isRecurring: true,
    recurrence: {
      type: 'weekly',
      pattern: 'lunes-miercoles-viernes',
    },
    location: {
      type: 'university',
      tower: 'Torre D',
      classroom: '301',
    },
    courses: [
      {
        id: 'course-1',
        name: 'Fundamentos de JavaScript',
        classCount: 5,
        schedule: [
          {
            id: 'class-1-1',
            date: '2025-08-10',
            startTime: '17:00',
            endTime: '19:00',
          },
          {
            id: 'class-1-2',
            date: '2025-08-12',
            startTime: '17:00',
            endTime: '19:00',
          },
        ],
      },
      {
        id: 'course-2',
        name: 'React.js',
        classCount: 8,
        schedule: [
          {
            id: 'class-2-1',
            date: '2025-09-01',
            startTime: '17:00',
            endTime: '19:00',
          },
          {
            id: 'class-2-2',
            date: '2025-09-03',
            startTime: '17:00',
            endTime: '19:00',
          },
        ],
      },
    ],
    additionalDetails: 'Curso práctico de desarrollo web Full Stack con JavaScript, React, Node.js y MongoDB.',
  };
  
  // Lista de facultades disponibles
  export const FACULTIES = [
    { value: 'FACTI', label: 'Facultad de Ciencia, Tecnología e Industria' },
    { value: 'FACED', label: 'Facultad de Educación' },
    { value: 'FACOM', label: 'Facultad de Comunicación' },
    { value: 'FACS', label: 'Facultad de Ciencias de la Salud' },
    { value: 'FADMI', label: 'Facultad de Administración' },
  ];
  
  // Lista de torres disponibles
  export const TOWERS = [
    { value: 'Torre A', label: 'Torre A' },
    { value: 'Torre B', label: 'Torre B' },
    { value: 'Torre C', label: 'Torre C' },
    { value: 'Torre D', label: 'Torre D' },
  ];
  
  // Patrones de recurrencia para actividades semanales
  export const WEEKLY_PATTERNS = [
    { value: 'lunes', label: 'Todos los lunes' },
    { value: 'martes', label: 'Todos los martes' },
    { value: 'miercoles', label: 'Todos los miércoles' },
    { value: 'jueves', label: 'Todos los jueves' },
    { value: 'viernes', label: 'Todos los viernes' },
    { value: 'sabado', label: 'Todos los sábados' },
    { value: 'lunes-miercoles-viernes', label: 'Lunes, Miércoles y Viernes' },
    { value: 'martes-jueves', label: 'Martes y Jueves' },
  ];
  
  // Patrones de recurrencia para actividades mensuales
  export const MONTHLY_PATTERNS = [
    { value: 'primer-dia', label: 'Primer día del mes' },
    { value: 'ultimo-dia', label: 'Último día del mes' },
    { value: 'primer-lunes', label: 'Primer lunes del mes' },
    { value: 'segundo-lunes', label: 'Segundo lunes del mes' },
    { value: 'tercer-lunes', label: 'Tercer lunes del mes' },
    { value: 'cuarto-lunes', label: 'Cuarto lunes del mes' },
    { value: 'primer-viernes', label: 'Primer viernes del mes' },
    { value: 'segundo-viernes', label: 'Segundo viernes del mes' },
    { value: 'tercer-viernes', label: 'Tercer viernes del mes' },
    { value: 'cuarto-viernes', label: 'Cuarto viernes del mes' },
  ];