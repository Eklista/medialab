import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

// Importamos las imágenes locales
import heroBackground from '../../assets/images/hero-background.jpg';
import about1 from '../../assets/images/about-1.jpg';
import about2 from '../../assets/images/about-2.jpg';
import about3 from '../../assets/images/about-3.jpg';
import about4 from '../../assets/images/about-4.jpg';
import showreelThumbnail from '../../assets/images/showreel-thumbnail.jpg';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar transparent={true} />

      {/* Hero Section - Full Viewport Height with Background Image */}
      <section className="relative flex items-center justify-center min-h-screen">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-black opacity-50 z-10"
            style={{ backgroundImage: "linear-gradient(to bottom, rgba(15, 17, 23, 0.8), rgba(15, 17, 23, 0.9))" }}
          ></div>
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${heroBackground})` }}
          ></div>
        </div>
        
        {/* Hero Content */}
        <div className="container relative z-20 mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white font-heading leading-tight">
              Producción audiovisual para Universidad Galileo
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Transformamos ideas académicas y culturales en contenido visual de alta calidad.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/form">
                <Button variant="primary" size="lg">
                  Solicitar Servicio
                </Button>
              </Link>
              <a href="#services">
                <Button variant="outline" size="lg">
                  Conocer Más
                </Button>
              </a>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white font-heading">Nuestros Servicios</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              En MediaLab ofrecemos una variedad de servicios audiovisuales para apoyar las actividades académicas y culturales de la Universidad Galileo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Grabación</h3>
              <p className="text-gray-300">
                Capturamos tus eventos, conferencias y actividades con equipos profesionales para garantizar la mejor calidad.
              </p>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Transmisión</h3>
              <p className="text-gray-300">
                Transmitimos en vivo tus eventos a través de diferentes plataformas digitales, llegando a audiencias globales.
              </p>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Edición</h3>
              <p className="text-gray-300">
                Editamos y post-producimos material audiovisual para que tenga un aspecto profesional y consiga sus objetivos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h2 className="text-3xl font-bold mb-4 text-white font-heading">Sobre MediaLab</h2>
              <p className="text-gray-300 mb-4">
                En MediaLab, colaboramos con la comunidad de la Universidad Galileo para transformar ideas académicas y culturales en conceptos visuales innovadores, listos para ser llevados a la acción.
              </p>
              <p className="text-gray-300 mb-4">
                Desde la concepción hasta la producción, trabajamos con estudiantes, docentes y personal universitario para crear contenido audiovisual que refleje los valores y la creatividad de la Universidad Galileo.
              </p>
              <p className="text-gray-300">
                El resultado final es un reflejo de nuestro compromiso con la excelencia. Ofrecemos contenido visual de alta calidad que captura la esencia de cada proyecto y contribuye al impacto educativo de la universidad.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={about1} 
                    alt="Producción audiovisual" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={about2} 
                    alt="Equipo MediaLab" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={about3} 
                    alt="Producción en estudio" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={about4} 
                    alt="Edición de vídeo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Showreel and Web Link */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold mb-4 text-white font-heading">¿Listo para comenzar?</h2>
              <p className="text-gray-200 mb-8 max-w-lg">
                Solicita nuestros servicios y lleva tus proyectos académicos al siguiente nivel con producción audiovisual profesional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/form">
                  <Button variant="primary" size="lg">
                    Solicitar Servicio
                  </Button>
                </Link>
                <a href="https://medialab.galileo.edu" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg">
                    Visitar Web
                  </Button>
                </a>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                {/* Showreel thumbnail con overlay */}
                <img 
                  src={showreelThumbnail} 
                  alt="MediaLab Showreel" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:bg-indigo-500 transition-colors">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.5 5.5L15 10l-8.5 4.5v-9z"></path>
                      </svg>
                    </div>
                    <p className="text-white font-medium">Ver Showreel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Extra padding for mobile to account for fixed bottom menu */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
};

export default LandingPage;