// src/features/dashboard/data/mockRequestFiles.ts

export interface RequestFile {
    id: string;
    name: string;
    description?: string;
    type: string;
    size: string;
    uploadDate: string;
    url: string;
    requestId: string;
  }
  
  // Archivo de ejemplo para simular PDF
  const PDF_SAMPLE_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  
  // Datos mock para archivos asociados a solicitudes
  export const mockRequestFiles: Record<string, RequestFile[]> = {
    'req-001': [
      {
        id: 'file-001',
        name: 'Formulario_Solicitud_Conferencia.pdf',
        description: 'Formulario oficial de solicitud',
        type: 'pdf',
        size: '245 KB',
        uploadDate: '15/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-001'
      },
      {
        id: 'file-002',
        name: 'Programa_Conferencia_Innovacion.pdf',
        description: 'Programa detallado del evento',
        type: 'pdf',
        size: '320 KB',
        uploadDate: '16/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-001'
      }
    ],
    'req-002': [
      {
        id: 'file-003',
        name: 'Solicitud_Ciclo_Seminarios.pdf',
        description: 'Formulario de solicitud de ciclo completo',
        type: 'pdf',
        size: '410 KB',
        uploadDate: '10/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-002'
      },
      {
        id: 'file-004',
        name: 'Calendario_Seminarios.pdf',
        description: 'Calendario de todas las sesiones',
        type: 'pdf',
        size: '185 KB',
        uploadDate: '10/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-002'
      },
      {
        id: 'file-005',
        name: 'Requerimientos_Tecnicos.pdf',
        description: 'Lista de equipos y requerimientos técnicos',
        type: 'pdf',
        size: '156 KB',
        uploadDate: '12/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-002'
      }
    ],
    'req-003': [
      {
        id: 'file-006',
        name: 'Solicitud_Podcast_TecnoInnova.pdf',
        description: 'Formulario de solicitud para serie de podcast',
        type: 'pdf',
        size: '389 KB',
        uploadDate: '01/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-003'
      },
      {
        id: 'file-007',
        name: 'Guion_Episodio1_IA.pdf',
        description: 'Guion para el primer episodio',
        type: 'pdf',
        size: '275 KB',
        uploadDate: '05/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-003'
      },
      {
        id: 'file-008',
        name: 'Lista_Invitados.pdf',
        description: 'Lista de invitados y temas a tratar',
        type: 'pdf',
        size: '142 KB',
        uploadDate: '08/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-003'
      }
    ],
    'req-004': [
      {
        id: 'file-009',
        name: 'Solicitud_Curso_Python.pdf',
        description: 'Formulario de solicitud para grabación de curso',
        type: 'pdf',
        size: '425 KB',
        uploadDate: '15/02/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-004'
      },
      {
        id: 'file-010',
        name: 'Syllabus_Curso_Python.pdf',
        description: 'Contenido completo del curso',
        type: 'pdf',
        size: '512 KB',
        uploadDate: '17/02/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-004'
      },
      {
        id: 'file-011',
        name: 'Material_Didactico.pdf',
        description: 'Material didáctico para estudiantes',
        type: 'pdf',
        size: '730 KB',
        uploadDate: '20/02/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-004'
      },
      {
        id: 'file-012',
        name: 'Informe_Final_Curso.pdf',
        description: 'Informe final de producción',
        type: 'pdf',
        size: '380 KB',
        uploadDate: '16/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-004'
      }
    ],
    'req-005': [
      {
        id: 'file-013',
        name: 'Solicitud_ObraTeatro.pdf',
        description: 'Formulario de solicitud para grabación',
        type: 'pdf',
        size: '255 KB',
        uploadDate: '05/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-005'
      },
      {
        id: 'file-014',
        name: 'Notificacion_Rechazo.pdf',
        description: 'Documento de notificación de rechazo',
        type: 'pdf',
        size: '120 KB',
        uploadDate: '12/04/2025',
        url: PDF_SAMPLE_URL,
        requestId: 'req-005'
      }
    ]
  };
  
  // Función para obtener archivos por ID de solicitud
  export const getRequestFiles = (requestId: string): RequestFile[] => {
    return mockRequestFiles[requestId] || [];
  };