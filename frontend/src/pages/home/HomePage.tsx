// src/pages/home/HomePage.tsx - Código Limpio y Corregido
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PublicLayout, 
  Section,
  Button
} from '../../components';
import { HeroSlider } from '../../components/ui/HeroSlider';
import { CardSlider } from '../../components/ui/CardSlider';
import { 
  AcademicCapIcon, 
  VideoCameraIcon, 
  MicrophoneIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Importar imágenes reales
import medialabHero from '../../assets/images/medialab-hero.jpg';
import gallery1 from '../../assets/images/gallery1.jpg';
import gallery2 from '../../assets/images/gallery2.jpg';
import gallery3 from '../../assets/images/gallery3.jpg';
import serviceAudiovisual from '../../assets/images/service-audiovisual.jpg';
import serviceContent from '../../assets/images/service-content.jpg';
import serviceAcademic from '../../assets/images/service-academic.jpg';

// Datos para el hero slider con imágenes reales
const heroSlides = [
  {
    id: '1',
    title: 'Laboratorio de Multimedia Universidad Galileo',
    description: 'Creamos contenido audiovisual de alta calidad para documentar y compartir los momentos más importantes de nuestra comunidad académica.',
    image: medialabHero,
    category: 'MediaLab',
    faculty: 'Universidad Galileo',
    video: {
      id: 'medialab-intro',
      thumbnail: gallery1,
      duration: '3:45'
    },
    cta: {
      text: 'Conocer más',
      action: () => console.log('Ver más sobre MediaLab')
    }
  },
  {
    id: '2',
    title: 'Galería Visual Universidad Galileo',
    description: 'Explora nuestro archivo visual que documenta la vida académica, eventos especiales y logros de nuestra comunidad universitaria.',
    image: gallery1,
    category: 'Galerías',
    faculty: 'Universidad Galileo',
    video: {
      id: 'gallery-showcase',
      thumbnail: gallery2,
      duration: '5:20'
    }
  },
  {
    id: '3',
    title: 'Servicios Multimedia Profesionales',
    description: 'Ofrecemos servicios completos de producción audiovisual, desde transmisiones en vivo hasta contenido para redes sociales.',
    image: gallery3,
    category: 'Servicios',
    faculty: 'MediaLab',
    video: {
      id: 'services-overview',
      thumbnail: serviceAudiovisual,
      duration: '4:15'
    }
  }
];

// Videos de ejemplo con imágenes reales
const videosByCategory = {
  conferencias: [
    {
      id: '1',
      title: 'Conferencia Internacional de Tecnología',
      description: 'Expertos mundiales discuten las últimas tendencias tecnológicas',
      thumbnail: serviceContent,
      duration: '1:45:20',
      views: 18750,
      category: 'Conferencias',
      faculty: 'FISICC',
      publishedAt: '2024-03-15'
    },
    {
      id: '2',
      title: 'Simposio de Medicina Moderna',
      description: 'Avances en medicina y nuevos tratamientos',
      thumbnail: gallery2,
      duration: '2:10:30',
      views: 12400,
      category: 'Conferencias',
      faculty: 'FACIMED',
      publishedAt: '2024-03-10'
    },
    {
      id: '3',
      title: 'Conferencia de Innovación Educativa',
      description: 'Nuevas metodologías en educación superior',
      thumbnail: serviceAcademic,
      duration: '1:30:15',
      views: 9600,
      category: 'Conferencias',
      faculty: 'IDEA',
      publishedAt: '2024-03-05'
    },
    {
      id: '4',
      title: 'Foro de Emprendimiento Digital',
      description: 'Startups y tecnología en Guatemala',
      thumbnail: gallery3,
      duration: '2:00:45',
      views: 15300,
      category: 'Conferencias',
      faculty: 'FCEA',
      publishedAt: '2024-02-28'
    }
  ],
  reportajes: [
    {
      id: '5',
      title: 'Reportaje: Innovación en Universidad Galileo',
      description: 'Conoce los proyectos más innovadores de nuestros estudiantes',
      thumbnail: serviceAcademic,
      duration: '25:15',
      views: 8950,
      category: 'Reportajes',
      faculty: 'Universidad Galileo',
      publishedAt: '2024-03-08'
    },
    {
      id: '6',
      title: 'Campus Sustentable UG',
      description: 'Iniciativas verdes y sostenibles en el campus universitario',
      thumbnail: gallery1,
      duration: '18:40',
      views: 6780,
      category: 'Reportajes',
      faculty: 'Universidad Galileo',
      publishedAt: '2024-03-05'
    },
    {
      id: '7',
      title: 'Vida Estudiantil en FISICC',
      description: 'Un día en la facultad de ingeniería',
      thumbnail: serviceContent,
      duration: '22:30',
      views: 11200,
      category: 'Reportajes',
      faculty: 'FISICC',
      publishedAt: '2024-03-01'
    },
    {
      id: '8',
      title: 'Investigación Médica en FACIMED',
      description: 'Proyectos de investigación que salvan vidas',
      thumbnail: gallery2,
      duration: '28:15',
      views: 14600,
      category: 'Reportajes',
      faculty: 'FACIMED',
      publishedAt: '2024-02-25'
    }
  ],
  graduaciones: [
    {
      id: '9',
      title: 'Graduación Medicina 2024',
      description: 'Ceremonia de graduación de nuevos médicos',
      thumbnail: gallery3,
      duration: '1:20:45',
      views: 25600,
      category: 'Graduaciones',
      faculty: 'FACIMED',
      publishedAt: '2024-02-28'
    },
    {
      id: '10',
      title: 'Graduación Ingeniería en Sistemas',
      description: 'Nuevos ingenieros en sistemas se gradúan con honores',
      thumbnail: serviceContent,
      duration: '1:15:20',
      views: 19800,
      category: 'Graduaciones',
      faculty: 'FISICC',
      publishedAt: '2024-02-25'
    },
    {
      id: '11',
      title: 'Graduación Comunicación 2024',
      description: 'Nuevos profesionales en comunicación',
      thumbnail: serviceAudiovisual,
      duration: '1:10:30',
      views: 16500,
      category: 'Graduaciones',
      faculty: 'FACOM',
      publishedAt: '2024-02-20'
    },
    {
      id: '12',
      title: 'Graduación Administración de Empresas',
      description: 'Ceremonia de graduación FCEA',
      thumbnail: gallery1,
      duration: '1:25:15',
      views: 18900,
      category: 'Graduaciones',
      faculty: 'FCEA',
      publishedAt: '2024-02-15'
    }
  ],
  podcasts: [
    {
      id: '13',
      title: 'Podcast: El Futuro de la Educación',
      description: 'Conversación sobre tendencias educativas y tecnología',
      thumbnail: serviceAudiovisual,
      duration: '45:30',
      views: 15200,
      category: 'Podcasts',
      faculty: 'IDEA',
      publishedAt: '2024-03-01'
    },
    {
      id: '14',
      title: 'Emprendimiento Universitario',
      description: 'Historias de éxito de estudiantes emprendedores',
      thumbnail: gallery2,
      duration: '38:15',
      views: 11400,
      category: 'Podcasts',
      faculty: 'Universidad Galileo',
      publishedAt: '2024-02-20'
    },
    {
      id: '15',
      title: 'Ciencia y Tecnología en Guatemala',
      description: 'Conversamos sobre investigación e innovación',
      thumbnail: serviceContent,
      duration: '52:45',
      views: 13800,
      category: 'Podcasts',
      faculty: 'FACTI',
      publishedAt: '2024-02-15'
    },
    {
      id: '16',
      title: 'Medicina y Sociedad',
      description: 'El impacto social de la medicina moderna',
      thumbnail: serviceAcademic,
      duration: '41:20',
      views: 10900,
      category: 'Podcasts',
      faculty: 'FACIMED',
      publishedAt: '2024-02-10'
    }
  ]
};

// Facultades de Universidad Galileo - Versión compacta
const facultades = [
  { id: 'todas', name: 'Todas las Facultades' },
  { id: 'fisicc', name: 'FISICC' },
  { id: 'facimed', name: 'FACIMED' },
  { id: 'idea', name: 'IDEA' },
  { id: 'facom', name: 'FACOM' },
  { id: 'fcea', name: 'FCEA' },
  { id: 'face', name: 'FACE' },
  { id: 'facti', name: 'FACTI' },
  { id: 'medialab', name: 'MediaLab' }
];

// Categorías principales con iconos
const categorias = [
  {
    id: 'conferencias',
    name: 'Conferencias',
    icon: <UserGroupIcon className="h-5 w-5" />,
    description: 'Conferencias académicas y eventos especiales'
  },
  {
    id: 'reportajes',
    name: 'Reportajes',
    icon: <VideoCameraIcon className="h-5 w-5" />,
    description: 'Documentales y reportajes institucionales'
  },
  {
    id: 'graduaciones',
    name: 'Graduaciones',
    icon: <AcademicCapIcon className="h-5 w-5" />,
    description: 'Ceremonias de graduación por facultad'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    icon: <MicrophoneIcon className="h-5 w-5" />,
    description: 'Contenido de audio y conversaciones'
  }
];

const HomePage: React.FC = () => {
  const [selectedFacultad, setSelectedFacultad] = useState('todas');

  // Manejar click en video
  const handleVideoClick = (video: any) => {
    console.log('Reproducir video:', video.title);
    // Abrir modal o navegar a página del video
  };

  // Manejar reproducción de video del hero
  const handleHeroVideoPlay = (videoId: string) => {
    console.log('Reproducir video del hero:', videoId);
  };

  // Manejar navegación a categorías
  const handleCategoryClick = (categoryId: string) => {
    console.log('Navegar a categoría:', categoryId);
    // Aquí navegarías a /categoria/[categoryId]
  };

  return (
    <PublicLayout>
      {/* Hero Section - ANCHO COMPLETO SIN MÁRGENES */}
      <div className="w-full">
        <HeroSlider
          slides={heroSlides}
          autoPlay={true}
          autoPlayInterval={6000}
          onVideoPlay={handleHeroVideoPlay}
        />
      </div>

      {/* Main Content - ANCHO COMPLETO */}
      <Section padding="lg" background="white">
        <div className="w-full">
          <div className="flex gap-6">
            {/* Sidebar Compacto de Facultades */}
            <aside className="w-64 flex-shrink-0">
              <div className="sticky top-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Filtrar por Facultad
                  </h3>
                  
                  <div className="space-y-1">
                    {facultades.map((facultad) => (
                      <button
                        key={facultad.id}
                        onClick={() => setSelectedFacultad(facultad.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedFacultad === facultad.id 
                            ? 'bg-gray-900 text-white' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {facultad.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Content Area Principal - ANCHO COMPLETO */}
            <main className="flex-1 min-w-0">
              {/* Explorar Categorías */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Explorar Contenido MediaLab
                </h2>
                
                <div className="grid grid-cols-4 gap-6 mb-12">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                      onClick={() => handleCategoryClick(categoria.id)}
                      className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                        <div className="text-gray-600 group-hover:text-gray-900">
                          {categoria.icon}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {categoria.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {categoria.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido por Categoría con CardSlider */}
              <div className="space-y-12">
                {categorias.map((categoria) => (
                  <CardSlider
                    key={categoria.id}
                    title={categoria.name}
                    items={videosByCategory[categoria.id as keyof typeof videosByCategory] || []}
                    onItemClick={handleVideoClick}
                    onViewAll={() => handleCategoryClick(categoria.id)}
                    itemsPerView={4}
                    className="mb-12"
                  />
                ))}
              </div>

              {/* Estadísticas y CTA */}
              <div className="bg-gray-50 rounded-lg p-8 text-center mt-16">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Contenido MediaLab Universidad Galileo
                </h3>
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">1,500+</div>
                    <div className="text-gray-600">Videos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">300+</div>
                    <div className="text-gray-600">Graduaciones</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">150+</div>
                    <div className="text-gray-600">Conferencias</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">8</div>
                    <div className="text-gray-600">Facultades</div>
                  </div>
                </div>
                
                {/* CTA con colores coherentes */}
                <Link to="/request">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Solicitar Servicio MediaLab
                  </Button>
                </Link>
              </div>
            </main>
          </div>
        </div>
      </Section>
    </PublicLayout>
  );
};

export default HomePage;