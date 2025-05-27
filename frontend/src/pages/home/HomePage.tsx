// src/pages/home/NewHomePage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PublicLayout, 
  Section,
  HeroSlider, 
  VideoGrid, 
  CategorySidebar, 
  SearchInput,
  Button,
  ThemeToggle
} from '../../components';
import { 
  PlayIcon, 
  AcademicCapIcon, 
  VideoCameraIcon, 
  MicrophoneIcon,
  DocumentTextIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Datos de ejemplo para el hero slider
const heroSlides = [
  {
    id: '1',
    title: 'Graduación Ingeniería en Sistemas 2024',
    description: 'Celebramos el logro de nuestros nuevos ingenieros en una ceremonia llena de emociones y orgullo institucional.',
    image: '/api/placeholder/1200/600',
    category: 'Graduaciones',
    faculty: 'FISICC',
    video: {
      id: 'grad-2024',
      thumbnail: '/api/placeholder/300/200',
      duration: '45:32'
    },
    cta: {
      text: 'Ver más graduaciones',
      action: () => console.log('Ver graduaciones')
    }
  },
  {
    id: '2',
    title: 'Conferencia Internacional de IA',
    description: 'Expertos mundiales se reunieron en Universidad Galileo para discutir el futuro de la inteligencia artificial.',
    image: '/api/placeholder/1200/600',
    category: 'Conferencias',
    faculty: 'IDEA',
    video: {
      id: 'ai-conf-2024',
      thumbnail: '/api/placeholder/300/200',
      duration: '2:15:45'
    }
  },
  {
    id: '3',
    title: 'Festival Cultural MediaLab',
    description: 'Una celebración de arte, tecnología y creatividad que unió a toda la comunidad universitaria.',
    image: '/api/placeholder/1200/600',
    category: 'Eventos',
    faculty: 'MediaLab',
    video: {
      id: 'festival-2024',
      thumbnail: '/api/placeholder/300/200',
      duration: '1:30:20'
    }
  }
];

// Datos de ejemplo para videos
const featuredVideos = [
  {
    id: '1',
    title: 'Ceremonia de Graduación - Medicina 2024',
    description: 'Nuevos médicos se gradúan con honores en una emotiva ceremonia',
    thumbnail: '/api/placeholder/400/250',
    duration: '42:15',
    views: 15420,
    category: 'Graduaciones',
    faculty: 'FACIMED',
    publishedAt: '2024-03-15'
  },
  {
    id: '2',
    title: 'Innovación en Energías Renovables',
    description: 'Estudiantes presentan proyectos sustentables para el futuro',
    thumbnail: '/api/placeholder/400/250',
    duration: '28:40',
    views: 8950,
    category: 'Proyectos',
    faculty: 'FISICC',
    publishedAt: '2024-03-10'
  },
  {
    id: '3',
    title: 'Podcast: El Futuro de la Educación Digital',
    description: 'Conversamos sobre las tendencias educativas post-pandemia',
    thumbnail: '/api/placeholder/400/250',
    duration: '35:22',
    views: 12300,
    category: 'Podcasts',
    faculty: 'IDEA',
    publishedAt: '2024-03-08'
  },
  {
    id: '4',
    title: 'Reportaje: Impacto Social UG',
    description: 'Conoce los programas de responsabilidad social universitaria',
    thumbnail: '/api/placeholder/400/250',
    duration: '18:55',
    views: 7680,
    category: 'Reportajes',
    faculty: 'Universidad Galileo',
    publishedAt: '2024-03-05'
  },
  {
    id: '5',
    title: 'Galería: Campus Sustentable',
    description: 'Recorrido visual por las iniciativas verdes del campus',
    thumbnail: '/api/placeholder/400/250',
    duration: '12:30',
    views: 5240,
    category: 'Galerías',
    faculty: 'Universidad Galileo',
    publishedAt: '2024-03-01'
  },
  {
    id: '6',
    title: 'Conferencia: Blockchain y Fintech',
    description: 'Expertos internacionales hablan sobre el futuro financiero',
    thumbnail: '/api/placeholder/400/250',
    duration: '1:45:20',
    views: 18750,
    category: 'Conferencias',
    faculty: 'FISICC',
    publishedAt: '2024-02-28'
  }
];

// Categorías para el sidebar
const categories = [
  {
    id: 'graduaciones',
    name: 'Graduaciones',
    count: 156,
    icon: <AcademicCapIcon className="h-5 w-5" />,
    subcategories: [
      { id: 'medicina', name: 'Medicina', count: 45 },
      { id: 'ingenieria', name: 'Ingeniería', count: 62 },
      { id: 'comunicacion', name: 'Comunicación', count: 34 },
      { id: 'administracion', name: 'Administración', count: 15 }
    ]
  },
  {
    id: 'conferencias',
    name: 'Conferencias',
    count: 89,
    icon: <UserGroupIcon className="h-5 w-5" />,
    subcategories: [
      { id: 'tecnologia', name: 'Tecnología', count: 32 },
      { id: 'medicina-conf', name: 'Medicina', count: 28 },
      { id: 'negocios', name: 'Negocios', count: 29 }
    ]
  },
  {
    id: 'eventos',
    name: 'Eventos',
    count: 124,
    icon: <SparklesIcon className="h-5 w-5" />
  },
  {
    id: 'reportajes',
    name: 'Reportajes',
    count: 67,
    icon: <VideoCameraIcon className="h-5 w-5" />
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    count: 203,
    icon: <MicrophoneIcon className="h-5 w-5" />
  },
  {
    id: 'galerias',
    name: 'Galerías',
    count: 78,
    icon: <DocumentTextIcon className="h-5 w-5" />
  }
];

const HomePage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [displayedVideos, setDisplayedVideos] = useState(featuredVideos);

  // Manejar búsqueda
  const handleSearch = (query: string) => {
    console.log('Buscando:', query);
    // Aquí implementarías la lógica de búsqueda real
  };

  // Filtrar por categoría
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === '') {
      setDisplayedVideos(featuredVideos);
    } else {
      const filtered = featuredVideos.filter(video => 
        video.category.toLowerCase() === categoryId
      );
      setDisplayedVideos(filtered);
    }
  };

  // Manejar click en video
  const handleVideoClick = (video: any) => {
    console.log('Reproducir video:', video.title);
    // Aquí abrirías el modal del video o navegarías a la página del video
  };

  // Manejar reproducción de video del hero
  const handleHeroVideoPlay = (videoId: string) => {
    console.log('Reproducir video del hero:', videoId);
  };

  const suggestions = [
    'graduaciones 2024',
    'conferencias tecnología',
    'medicina',
    'ingeniería sistemas',
    'podcasts educación'
  ];

  return (
    <PublicLayout>
      {/* Hero Section - ANCHO COMPLETO 100% */}
      <Section padding="none" className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="w-full">
          <HeroSlider
            slides={heroSlides}
            autoPlay={true}
            autoPlayInterval={6000}
            onVideoPlay={handleHeroVideoPlay}
          />
        </div>
      </Section>

      {/* Search Section - Ancho 80% */}
      <Section background="white" padding="md">
        <div className="w-full max-w-[80vw] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              onSearch={handleSearch}
              suggestions={suggestions}
              size="lg"
              placeholder="Buscar graduaciones, eventos, conferencias, podcasts..."
            />
          </div>
        </div>
      </Section>

      {/* Main Content - Ancho 80% */}
      <Section padding="lg">
        <div className="w-full max-w-[80vw] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-8 space-y-6">
                <CategorySidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  onCategorySelect={handleCategorySelect}
                  onSubcategorySelect={setSelectedSubcategory}
                  title="Explorar por categoría"
                  collapsible={true}
                />
                
                {/* Theme Toggle en sidebar para desktop */}
                <div className="hidden lg:block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-(--color-text-main) dark:text-white mb-3">
                    Tema
                  </h4>
                  <ThemeToggle variant="switch" showLabel={true} />
                </div>
              </div>
            </aside>

            {/* Content Area - Más ancho para videos */}
            <main className="flex-1 min-w-0">
              {/* Stats Bar - Más ancho y visual */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-(--color-text-main) dark:text-white">
                      Contenido Multimedia MediaLab
                    </h2>
                    <p className="text-lg text-(--color-text-secondary) dark:text-gray-300 mt-1">
                      {selectedCategory ? 
                        `Mostrando ${displayedVideos.length} videos de ${categories.find(c => c.id === selectedCategory)?.name}` :
                        `${displayedVideos.length} videos destacados de nuestra colección`
                      }
                    </p>
                  </div>
                  <div className="flex gap-8 text-sm">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-(--color-accent-1)">1000+</div>
                      <div className="text-(--color-text-secondary) dark:text-gray-300">Videos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-(--color-accent-1)">500+</div>
                      <div className="text-(--color-text-secondary) dark:text-gray-300">Galerías</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-(--color-accent-1)">15</div>
                      <div className="text-(--color-text-secondary) dark:text-gray-300">Facultades</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Grid - Grid más amplio */}
              <div className="w-full">
                <VideoGrid
                  videos={displayedVideos}
                  columns={3}
                  gap="xl"
                  onVideoClick={handleVideoClick}
                />
              </div>

              {/* Load More Button */}
              <div className="mt-16 text-center">
                <Button
                  variant="outline"
                  size="xl"
                  leftIcon={<PlayIcon className="h-6 w-6" />}
                  className="px-12 py-4"
                >
                  Cargar más contenido
                </Button>
              </div>
            </main>
          </div>
        </div>
      </Section>

      {/* About Section - Ancho 85% para más respiración */}
      <Section background="gray" padding="xl">
        <div className="w-full max-w-[85vw] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-(--color-text-main) dark:text-white mb-6">
              Acerca de MediaLab
            </h2>
            <p className="text-xl text-(--color-text-secondary) dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              El Laboratorio de Multimedia de Universidad Galileo documenta y comparte los momentos más importantes de nuestra comunidad académica a través de contenido audiovisual de alta calidad.
            </p>
          </div>

          {/* Grid de servicios más amplio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 mx-auto mb-6 bg-(--color-accent-1) rounded-full flex items-center justify-center">
                <VideoCameraIcon className="h-10 w-10 text-(--color-text-main)" />
              </div>
              <h3 className="text-2xl font-semibold text-(--color-text-main) dark:text-white mb-4">
                Producción Audiovisual
              </h3>
              <p className="text-(--color-text-secondary) dark:text-gray-300 leading-relaxed">
                Documentamos graduaciones, eventos y conferencias con la más alta calidad profesional, capturando cada momento importante.
              </p>
            </div>

            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 mx-auto mb-6 bg-(--color-accent-1) rounded-full flex items-center justify-center">
                <MicrophoneIcon className="h-10 w-10 text-(--color-text-main)" />
              </div>
              <h3 className="text-2xl font-semibold text-(--color-text-main) dark:text-white mb-4">
                Contenido Digital
              </h3>
              <p className="text-(--color-text-secondary) dark:text-gray-300 leading-relaxed">
                Creamos podcasts, reportajes y contenido multimedia para todas las plataformas digitales y redes sociales.
              </p>
            </div>

            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 mx-auto mb-6 bg-(--color-accent-1) rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-10 w-10 text-(--color-text-main)" />
              </div>
              <h3 className="text-2xl font-semibold text-(--color-text-main) dark:text-white mb-4">
                Apoyo Académico
              </h3>
              <p className="text-(--color-text-secondary) dark:text-gray-300 leading-relaxed">
                Brindamos soporte técnico y creativo a estudiantes y docentes en sus proyectos multimedia y académicos.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link to="/request">
              <Button 
                variant="primary" 
                size="xl"
                className="px-12 py-4 text-lg font-semibold"
              >
                Solicitar Servicio MediaLab
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </PublicLayout>
  );
};

export default HomePage;