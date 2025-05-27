// src/pages/home/HomePage.tsx - Versión mejorada sin sidebar y responsive
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PublicLayout, 
  Section,
  Button
} from '../../components';
import { HeroSlider } from '../../components/ui/HeroSlider';
import { CardSlider } from '../../components/ui/CardSlider';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { 
  AcademicCapIcon, 
  VideoCameraIcon, 
  MicrophoneIcon,
  UserGroupIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Importar imágenes reales
import medialabHero from '../../assets/images/medialab-hero.jpg';
import gallery1 from '../../assets/images/gallery1.jpg';
import gallery2 from '../../assets/images/gallery2.jpg';
import gallery3 from '../../assets/images/gallery3.jpg';
import serviceAudiovisual from '../../assets/images/service-audiovisual.jpg';
import serviceContent from '../../assets/images/service-content.jpg';
import serviceAcademic from '../../assets/images/service-academic.jpg';

// Datos para el hero slider
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

// Videos destacados por categoría (solo los más vistos)
const featuredVideos = {
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
      title: 'Foro de Emprendimiento Digital',
      description: 'Startups y tecnología en Guatemala',
      thumbnail: gallery3,
      duration: '2:00:45',
      views: 15300,
      category: 'Conferencias',
      faculty: 'FCEA',
      publishedAt: '2024-02-28'
    },
    {
      id: '4',
      title: 'Conferencia de Innovación Educativa',
      description: 'Nuevas metodologías en educación superior',
      thumbnail: serviceAcademic,
      duration: '1:30:15',
      views: 9600,
      category: 'Conferencias',
      faculty: 'IDEA',
      publishedAt: '2024-03-05'
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
      id: '7',
      title: 'Investigación Médica en FACIMED',
      description: 'Proyectos de investigación que salvan vidas',
      thumbnail: gallery2,
      duration: '28:15',
      views: 14600,
      category: 'Reportajes',
      faculty: 'FACIMED',
      publishedAt: '2024-02-25'
    },
    {
      id: '8',
      title: 'Campus Sustentable UG',
      description: 'Iniciativas verdes y sostenibles en el campus universitario',
      thumbnail: gallery1,
      duration: '18:40',
      views: 6780,
      category: 'Reportajes',
      faculty: 'Universidad Galileo',
      publishedAt: '2024-03-05'
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
      title: 'Graduación Administración de Empresas',
      description: 'Ceremonia de graduación FCEA',
      thumbnail: gallery1,
      duration: '1:25:15',
      views: 18900,
      category: 'Graduaciones',
      faculty: 'FCEA',
      publishedAt: '2024-02-15'
    },
    {
      id: '12',
      title: 'Graduación Comunicación 2024',
      description: 'Nuevos profesionales en comunicación',
      thumbnail: serviceAudiovisual,
      duration: '1:10:30',
      views: 16500,
      category: 'Graduaciones',
      faculty: 'FACOM',
      publishedAt: '2024-02-20'
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

// Categorías principales
const categorias = [
  {
    id: 'conferencias',
    name: 'Conferencias',
    icon: <UserGroupIcon className="h-6 w-6" />,
    description: 'Conferencias académicas y eventos especiales',
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 'reportajes',
    name: 'Reportajes',
    icon: <VideoCameraIcon className="h-6 w-6" />,
    description: 'Documentales y reportajes institucionales',
    color: 'bg-green-50 text-green-600'
  },
  {
    id: 'graduaciones',
    name: 'Graduaciones',
    icon: <AcademicCapIcon className="h-6 w-6" />,
    description: 'Ceremonias de graduación por facultad',
    color: 'bg-purple-50 text-purple-600'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    icon: <MicrophoneIcon className="h-6 w-6" />,
    description: 'Contenido de audio y conversaciones',
    color: 'bg-orange-50 text-orange-600'
  }
];

const HomePage: React.FC = () => {
  // Manejar click en video
  const handleVideoClick = (video: any) => {
    console.log('Reproducir video:', video.title);
    // Abrir modal o navegar a página del video
  };

  // Manejar reproducción de video del hero
  const handleHeroVideoPlay = (videoId: string) => {
    console.log('Reproducir video del hero:', videoId);
  };

  // Manejar navegación a categorías (desde bottom navigation o categorías)
  const handleCategorySelect = (categoryId: string) => {
    console.log('Navegar a categoría:', categoryId);
    // Aquí navegarías a /categoria/[categoryId] o filtrarías la vista actual
  };

  return (
    <PublicLayout>
      {/* Hero Section - ANCHO COMPLETO */}
      <div className="w-full">
        <HeroSlider
          slides={heroSlides}
          autoPlay={true}
          autoPlayInterval={6000}
          onVideoPlay={handleHeroVideoPlay}
        />
      </div>

      {/* Main Content */}
      <Section padding="lg" background="white">
        <div className="max-w-7xl mx-auto">
          {/* Quick Access Categories - Solo Desktop */}
          <div className="hidden lg:block mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Explorar Contenido MediaLab
            </h2>
            
            <div className="grid grid-cols-4 gap-6">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => handleCategorySelect(categoria.id)}
                  className="group p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 text-left bg-white"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${categoria.color} group-hover:scale-110 transition-transform`}>
                    {categoria.icon}
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

          {/* Featured Content Sections */}
          <div className="space-y-12">
            {/* Videos Más Vistos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  <EyeIcon className="h-6 w-6 inline-block mr-2" />
                  Más Vistos
                </h2>
              </div>
              
              {/* Mezclar videos más vistos de todas las categorías */}
              <CardSlider
                title=""
                items={[
                  featuredVideos.graduaciones[0], // 25,600 views
                  featuredVideos.graduaciones[1], // 19,800 views
                  featuredVideos.graduaciones[2], // 18,900 views
                  featuredVideos.conferencias[0], // 18,750 views
                  featuredVideos.graduaciones[3], // 16,500 views
                  featuredVideos.conferencias[2], // 15,300 views
                  featuredVideos.podcasts[0]      // 15,200 views
                ]}
                onItemClick={handleVideoClick}
                itemsPerView={4}
                className="mb-0"
              />
            </div>

            {/* Conferencias Destacadas */}
            <CardSlider
              title="Conferencias Destacadas"
              items={featuredVideos.conferencias}
              onItemClick={handleVideoClick}
              onViewAll={() => handleCategorySelect('conferencias')}
              itemsPerView={4}
            />

            {/* Graduaciones Recientes */}
            <CardSlider
              title="Graduaciones Recientes"
              items={featuredVideos.graduaciones}
              onItemClick={handleVideoClick}
              onViewAll={() => handleCategorySelect('graduaciones')}
              itemsPerView={4}
            />

            {/* Reportajes Institucionales */}
            <CardSlider
              title="Reportajes Institucionales"
              items={featuredVideos.reportajes}
              onItemClick={handleVideoClick}
              onViewAll={() => handleCategorySelect('reportajes')}
              itemsPerView={4}
            />

            {/* Podcasts y Audio */}
            <CardSlider
              title="Podcasts y Audio"
              items={featuredVideos.podcasts}
              onItemClick={handleVideoClick}
              onViewAll={() => handleCategorySelect('podcasts')}
              itemsPerView={4}
            />
          </div>

          {/* Call to Action Section */}
          <div className="bg-gray-50 rounded-xl p-8 text-center mt-16 mb-20 lg:mb-8">
            <div className="max-w-2xl mx-auto">
              <PlayIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                ¿Necesitas servicios de MediaLab?
              </h3>
              <p className="text-gray-600 mb-6">
                Creamos contenido audiovisual profesional para eventos, conferencias, graduaciones y más.
              </p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">1,500+</div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">300+</div>
                  <div className="text-sm text-gray-600">Graduaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">150+</div>
                  <div className="text-sm text-gray-600">Conferencias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">8</div>
                  <div className="text-sm text-gray-600">Facultades</div>
                </div>
              </div>
              
              <Link to="/request">
                <Button 
                  variant="primary" 
                  size="lg"
                  className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                >
                  Solicitar Servicio MediaLab
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Bottom Navigation para móviles */}
      <BottomNavigation onCategorySelect={handleCategorySelect} />
    </PublicLayout>
  );
};

export default HomePage;