// src/features/dashboard/data/mockRequests.ts
import { ServiceRequest, RequestStatus } from '../components/requests/types';

// Función auxiliar para generar clases CSS según el estado
export const getStatusClass = (status: RequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Función auxiliar para obtener etiqueta de estado
export const getStatusLabel = (status: RequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'approved':
      return 'Aprobada';
    case 'in_progress':
      return 'En progreso';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    case 'rejected':
      return 'Rechazada';
    default:
      return 'Desconocido';
  }
};

// Función auxiliar para obtener clases CSS según el tipo de actividad
export const getTypeClass = (type: string): string => {
  switch (type) {
    case 'single':
      return 'bg-blue-100 text-blue-800';
    case 'recurrent':
      return 'bg-purple-100 text-purple-800';
    case 'podcast':
      return 'bg-pink-100 text-pink-800';
    case 'course':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Función auxiliar para obtener etiqueta de tipo
export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'single':
      return 'Actividad Única';
    case 'recurrent':
      return 'Actividad Recurrente';
    case 'podcast':
      return 'Podcast';
    case 'course':
      return 'Curso';
    default:
      return 'Desconocido';
  }
};

// Datos mock para solicitudes de servicios
export const mockRequests: ServiceRequest[] = [
  // 1. Solicitud de Actividad Única
  {
    id: 'req-001',
    title: 'Conferencia de Innovación Tecnológica',
    type: 'single',
    typeLabel: 'Actividad Única',
    typeClass: getTypeClass('single'),
    status: 'pending',
    statusLabel: getStatusLabel('pending'),
    statusClass: getStatusClass('pending'),
    dateLabel: '30 Abr, 2025',
    createDate: '2025-04-15T10:30:00',
    updateDate: '2025-04-15T10:30:00',
    requester: {
      name: 'Carlos Mendoza',
      email: 'cmendoza@galileo.edu',
      department: 'FISICC',
      phone: '5555-1234',
      requestDate: '2025-04-15'
    },
    services: [
      {
        id: 'srv-001',
        name: 'Grabación de Video',
        description: 'Grabación profesional con equipo de alta calidad'
      },
      {
        id: 'srv-002',
        name: 'Transmisión en vivo',
        description: 'Streaming para eventos y actividades'
      }
    ],
    details: {
      activityDate: '2025-04-30',
      startTime: '14:00',
      endTime: '16:00',
      location: {
        type: 'university',
        tower: 'Torre A',
        classroom: 'Auditorio 1'
      }
    },
    additionalNotes: 'El conferencista necesitará un proyector y micrófono inalámbrico.'
  },
  
  // 2. Solicitud de Actividad Recurrente
  {
    id: 'req-002',
    title: 'Ciclo de Seminarios de Ingeniería',
    type: 'recurrent',
    typeLabel: 'Actividad Recurrente',
    typeClass: getTypeClass('recurrent'),
    status: 'approved',
    statusLabel: getStatusLabel('approved'),
    statusClass: getStatusClass('approved'),
    dateLabel: '01 May - 30 Jun, 2025',
    createDate: '2025-04-10T09:15:00',
    updateDate: '2025-04-17T14:23:00',
    requester: {
      name: 'María García',
      email: 'mgarcia@galileo.edu',
      department: 'FACTI',
      phone: '5555-5678',
      requestDate: '2025-04-10'
    },
    services: [
      {
        id: 'srv-001',
        name: 'Grabación de Video',
        description: 'Grabación profesional con equipo de alta calidad'
      },
      {
        id: 'srv-003',
        name: 'Edición de Video',
        description: 'Montaje y post-producción de contenido audiovisual'
      },
      {
        id: 'srv-004',
        name: 'Material Didáctico',
        description: 'Creación de recursos pedagógicos digitales'
      }
    ],
    details: {
      startDate: '2025-05-01',
      endDate: '2025-06-30',
      startTime: '10:30',
      endTime: '12:30',
      recurrenceType: 'weekly',
      weekDays: ['Lunes', 'Miércoles'],
      location: {
        type: 'university',
        tower: 'Torre B',
        classroom: 'Salón 204'
      }
    },
    additionalNotes: 'Requiere grabación y edición de cada sesión para publicación posterior.'
  },
  
  // 3. Solicitud de Podcast
  {
    id: 'req-003',
    title: 'Podcast: Tecnología e Innovación',
    type: 'podcast',
    typeLabel: 'Podcast',
    typeClass: getTypeClass('podcast'),
    status: 'in_progress',
    statusLabel: getStatusLabel('in_progress'),
    statusClass: getStatusClass('in_progress'),
    dateLabel: '05 May - 30 Jul, 2025',
    createDate: '2025-04-01T11:45:00',
    updateDate: '2025-04-21T13:30:00',
    daysInProgress: 2,
    requester: {
      name: 'Roberto Salazar',
      email: 'rsalazar@galileo.edu',
      department: 'FACOM',
      phone: '5555-9012',
      requestDate: '2025-04-01'
    },
    services: [
      {
        id: 'srv-002',
        name: 'Grabación de Audio',
        description: 'Grabación y procesamiento de audio'
      },
      {
        id: 'srv-003',
        name: 'Edición de Audio',
        description: 'Edición profesional de contenido de audio'
      }
    ],
    details: {
      startDate: '2025-05-05',
      endDate: '2025-07-30',
      startTime: '15:00',
      endTime: '16:30',
      isRecurrent: true,
      location: {
        type: 'university',
        tower: 'Torre C',
        classroom: 'Estudio 3'
      },
      episodes: [
        {
          id: 'ep-001',
          name: 'Inteligencia Artificial en la Educación',
          topic: 'IA y Educación',
          recordingDate: '2025-05-05'
        },
        {
          id: 'ep-002',
          name: 'Blockchain y su Impacto en la Sociedad',
          topic: 'Blockchain',
          recordingDate: '2025-05-19'
        },
        {
          id: 'ep-003',
          name: 'El Futuro de la Realidad Virtual',
          topic: 'Realidad Virtual',
          recordingDate: '2025-06-02'
        }
      ],
      moderators: [
        {
          id: 'mod-001',
          name: 'Ana López',
          position: 'Profesora',
          role: 'Presentadora'
        },
        {
          id: 'mod-002',
          name: 'Daniel Pérez',
          position: 'Investigador',
          role: 'Co-presentador'
        }
      ]
    }
  },
  
  // 4. Solicitud de Curso
  {
    id: 'req-004',
    title: 'Curso: Programación Avanzada en Python',
    type: 'course',
    typeLabel: 'Curso',
    typeClass: getTypeClass('course'),
    status: 'completed',
    statusLabel: getStatusLabel('completed'),
    statusClass: getStatusClass('completed'),
    dateLabel: '01 Mar - 15 Abr, 2025',
    createDate: '2025-02-15T08:20:00',
    updateDate: '2025-04-16T09:45:00',
    requester: {
      name: 'Julia Ramírez',
      email: 'jramirez@galileo.edu',
      department: 'FISICC',
      phone: '5555-3456',
      requestDate: '2025-02-15'
    },
    services: [
      {
        id: 'srv-001',
        name: 'Grabación de Video',
        description: 'Grabación profesional con equipo de alta calidad'
      },
      {
        id: 'srv-003',
        name: 'Edición de Video',
        description: 'Montaje y post-producción de contenido audiovisual'
      },
      {
        id: 'srv-004',
        name: 'Material Didáctico',
        description: 'Creación de recursos pedagógicos digitales'
      }
    ],
    details: {
      startDate: '2025-03-01',
      endDate: '2025-04-15',
      startTime: '09:00',
      endTime: '11:00',
      isRecurrent: true,
      location: {
        type: 'university',
        tower: 'Torre A',
        classroom: 'Laboratorio 105'
      },
      courses: [
        {
          id: 'course-001',
          name: 'Introducción a Python Avanzado',
          professor: 'Dr. Alejandro Torres',
          faculty: 'FISICC',
          duration: '2 horas',
          recordingDates: ['2025-03-01', '2025-03-03']
        },
        {
          id: 'course-002',
          name: 'Programación Orientada a Objetos en Python',
          professor: 'Dr. Alejandro Torres',
          faculty: 'FISICC',
          duration: '2 horas',
          recordingDates: ['2025-03-08', '2025-03-10']
        },
        {
          id: 'course-003',
          name: 'Frameworks y Bibliotecas Avanzadas',
          professor: 'Ing. Patricia González',
          faculty: 'FISICC',
          duration: '2 horas',
          recordingDates: ['2025-03-15', '2025-03-17']
        }
      ]
    }
  },
  
  // 5. Solicitud Rechazada
  {
    id: 'req-005',
    title: 'Grabación de Obra de Teatro',
    type: 'single',
    typeLabel: 'Actividad Única',
    typeClass: getTypeClass('single'),
    status: 'rejected',
    statusLabel: getStatusLabel('rejected'),
    statusClass: getStatusClass('rejected'),
    dateLabel: '20 Abr, 2025',
    createDate: '2025-04-05T16:20:00',
    updateDate: '2025-04-12T11:15:00',
    requester: {
      name: 'Fernando Morales',
      email: 'fmorales@galileo.edu',
      department: 'FACOM',
      phone: '5555-7890',
      requestDate: '2025-04-05'
    },
    services: [
      {
        id: 'srv-001',
        name: 'Grabación de Video',
        description: 'Grabación profesional con equipo de alta calidad'
      },
      {
        id: 'srv-003',
        name: 'Edición de Video',
        description: 'Montaje y post-producción de contenido audiovisual'
      }
    ],
    details: {
      activityDate: '2025-04-20',
      startTime: '19:00',
      endTime: '21:30',
      location: {
        type: 'external',
        address: 'Teatro Nacional, Ciudad de Guatemala'
      }
    },
    additionalNotes: 'Solicitud rechazada debido a falta de disponibilidad de equipo para la fecha solicitada.'
  }
];