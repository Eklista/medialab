// src/features/service-request/data/services.ts

export interface SubService {
    id: string;
    name: string;
    description?: string;
  }
  
  export interface MainService {
    id: string;
    name: string;
    description?: string;
    iconName: string;
    subServices: SubService[];
  }
  
  export const mainServices: MainService[] = [
    {
      id: 'audiovisual',
      name: 'Producción Audiovisual',
      description: 'Servicios relacionados con producción de contenido audiovisual',
      iconName: 'video-camera',
      subServices: [
        { id: 'video', name: 'Grabación de Video', description: 'Grabación profesional con equipo de alta calidad' },
        { id: 'audio', name: 'Grabación de Audio', description: 'Grabación y procesamiento de audio' },
        { id: 'editing', name: 'Edición de Video', description: 'Montaje y post-producción de contenido audiovisual' },
        { id: 'streaming', name: 'Transmisión en vivo', description: 'Streaming para eventos y actividades' }
      ]
    },
    {
      id: 'academic',
      name: 'Apoyo Académico',
      description: 'Servicios relacionados con apoyo a actividades académicas',
      iconName: 'academic-cap',
      subServices: [
        { id: 'classroom', name: 'Apoyo en Aula', description: 'Asistencia técnica para clases y presentaciones' },
        { id: 'workshop', name: 'Talleres Prácticos', description: 'Implementación de talleres especializados' },
        { id: 'material', name: 'Material Didáctico', description: 'Creación de recursos pedagógicos digitales' }
      ]
    },
    {
      id: 'content',
      name: 'Creación de Contenido',
      description: 'Servicios relacionados con creación de contenido digital',
      iconName: 'photo',
      subServices: [
        { id: 'graphic', name: 'Diseño Gráfico', description: 'Creación de piezas gráficas para diferentes medios' },
        { id: 'web', name: 'Diseño Web', description: 'Desarrollo de sitios web y aplicaciones' },
        { id: 'social', name: 'Contenido para Redes Sociales', description: 'Estrategias y creación de contenido digital' },
        { id: 'animation', name: 'Animación', description: 'Creación de animaciones 2D y 3D' }
      ]
    }
  ];