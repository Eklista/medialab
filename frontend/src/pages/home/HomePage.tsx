// src/pages/home/HomePage.tsx - Nueva estructura completa
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components';
import { HeroSlider } from '../../components/ui/HeroSlider';
import { BottomNavigation } from '../../components/layout/BottomNavigation';

// Importaciones de secciones desde el índice
import {
  ContentTabsSection,
  ServicesCTASection,
  MostViewedSection,
  LiveStreamingCTA,
  FullExploreSection
} from '../../components/sections';

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

// Datos de contenido organizados por categoría
const contentData = {
  graduaciones: [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
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
      id: '4',
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
      id: '5',
      title: 'Graduación FACE 2024',
      description: 'Ceremonia de graduación Facultad de Educación',
      thumbnail: gallery2,
      duration: '1:18:45',
      views: 15200,
      category: 'Graduaciones',
      faculty: 'FACE',
      publishedAt: '2024-02-10'
    }
  ],
  
  conferencias: [
    {
      id: '6',
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
      id: '7',
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
      id: '8',
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
      id: '9',
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
      id: '10',
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
      id: '11',
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
      id: '12',
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
      id: '13',
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
  
  fotografias: [
    {
      id: '14',
      title: 'Galería: Festival Cultural UG 2024',
      description: 'Las mejores fotografías del festival cultural anual',
      thumbnail: gallery1,
      duration: '15:30',
      views: 7200,
      category: 'Fotografías',
      faculty: 'Universidad Galileo',
      publishedAt: '2024-03-12'
    },
    {
      id: '15',
      title: 'Detrás de Cámaras: MediaLab',
      description: 'Conoce el trabajo diario del equipo de MediaLab',
      thumbnail: serviceAudiovisual,
      duration: '12:45',
      views: 5300,
      category: 'Fotografías',
      faculty: 'MediaLab',
      publishedAt: '2024-03-08'
    },
    {
      id: '16',
      title: 'Arquitectura del Campus UG',
      description: 'Tour visual por los edificios más emblemáticos',
      thumbnail: gallery3,
      duration: '20:15',
      views: 8400,
      category: 'Fotografías',
      faculty: 'Universidad Galileo',
      publishedAt: '2024-02-28'
    },
    {
      id: '17',
      title: 'Laboratorios FISICC en Acción',
      description: 'Estudiantes trabajando en proyectos tecnológicos',
      thumbnail: serviceContent,
      duration: '18:20',
      views: 6900,
      category: 'Fotografías',
      faculty: 'FISICC',
      publishedAt: '2024-03-01'
    }
  ]
};

// Todos los videos para la sección de más vistos
const allVideos = [
  ...contentData.graduaciones,
  ...contentData.conferencias,
  ...contentData.reportajes,
  ...contentData.fotografias
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Handlers para navegación
  const handleVideoClick = (video: any) => {
    console.log('Navegando a video:', video.title);
    navigate(`/video/${video.id}`);
  };

  const handleHeroVideoPlay = (videoId: string) => {
    console.log('Navegando a video del hero:', videoId);
    // Podrías mapear videoId a un ID real de video
    // Por ahora navegar a un video de ejemplo
    navigate('/video/0');
  };

  const handleViewAllClick = (category: string) => {
    console.log('Ver todas las:', category);
    // Navegar a la página de categoría: navigate(`/categoria/${category}`)
  };

  const handleRequestService = () => {
    navigate('/request');
  };

  const handleTwitchClick = () => {
    window.open('https://twitch.tv/medialab_ug', '_blank');
  };

  const handleFacultyClick = (facultadId: string) => {
    console.log('Ver facultad:', facultadId);
    // navigate(`/facultad/${facultadId}`)
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log('Ver categoría:', categoryId);
    // navigate(`/categoria/${categoryId}`)
  };

  const handleFacultyCategoryClick = (facultadId: string, categoryId: string) => {
    console.log('Ver:', facultadId, categoryId);
    // navigate(`/facultad/${facultadId}/categoria/${categoryId}`)
  };

  const handleMostViewedViewAll = () => {
    console.log('Ver todo el contenido popular');
    // navigate('/popular')
  };

  return (
    <PublicLayout>
      {/* 1. Hero Section - ANCHO COMPLETO */}
      <div className="w-full">
        <HeroSlider
          slides={heroSlides}
          autoPlay={true}
          autoPlayInterval={6000}
          onVideoPlay={handleHeroVideoPlay}
        />
      </div>

      {/* 2. Content Tabs Section */}
      <ContentTabsSection
        graduaciones={contentData.graduaciones}
        conferencias={contentData.conferencias}
        reportajes={contentData.reportajes}
        fotografias={contentData.fotografias}
        onItemClick={handleVideoClick}
        onViewAllClick={handleViewAllClick}
      />

      {/* 3. Services CTA Section */}
      <ServicesCTASection
        onRequestService={handleRequestService}
      />

      {/* 4. Most Viewed Section */}
      <MostViewedSection
        items={allVideos}
        onItemClick={handleVideoClick}
        onViewAllClick={handleMostViewedViewAll}
      />

      {/* 5. Live Streaming CTA */}
      <LiveStreamingCTA
        onTwitchClick={handleTwitchClick}
      />

      {/* 6. Full Explore Section - SOLO DESKTOP */}
      <div className="hidden lg:block">
        <FullExploreSection
          onFacultyClick={handleFacultyClick}
          onCategoryClick={handleCategoryClick}
          onFacultyCategoryClick={handleFacultyCategoryClick}
        />
      </div>

      {/* 7. Footer ya está incluido en PublicLayout */}

      {/* Bottom Navigation para móviles */}
      <BottomNavigation 
        onCategorySelect={(facultadId, categoryId) => handleFacultyCategoryClick(facultadId, categoryId)}
        onFacultySelect={handleFacultyClick}
      />
    </PublicLayout>
  );
};

export default HomePage;