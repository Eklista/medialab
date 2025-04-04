import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar, Footer } from '../../components/layout'

import heroImage from '../../assets/images/medialab-hero.jpg'
import service1 from '../../assets/images/service-audiovisual.jpg'
import service2 from '../../assets/images/service-content.jpg'
import service3 from '../../assets/images/service-academic.jpg'
import galleryImage1 from '../../assets/images/gallery1.jpg'
import galleryImage2 from '../../assets/images/gallery2.jpg'
import galleryImage3 from '../../assets/images/gallery3.jpg'
import teamImage from '../../assets/images/medialab-team.jpg'

export const HomePage = () => {
  // Title Underline
  const SectionTitle: React.FC<{
    children: React.ReactNode;
    color?: string;
    textColor?: string;
  }> = ({ children, color = "--color-accent-1", textColor = "--color-text-main" }) => (
    <div className="flex flex-col items-center mb-6">
      <h2 className={`text-2xl font-bold text-(${textColor}) mb-2`}>
        {children}
      </h2>
      <div className={`h-2 w-32 bg-(${color}) rounded-full`}></div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative">
        <div className="h-[550px] overflow-hidden">
          <img 
            src={heroImage} 
            alt="MediaLab en acción" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50 flex items-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Laboratorio de Multimedia <span className="text-(--color-accent-1)">MediaLab</span>
                </h1>
                <p className="text-xl text-white/90 mb-8">
                  Damos vida a las ideas, proyectos y eventos que marcan el día a día académico en Universidad Galileo.
                </p>
                <Link to="/request" 
                  className="inline-block bg-(--color-accent-1) border-2 border-(--color-accent-1) text-(--color-text-main) px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-transparent hover:text-white transition-all duration-300">
                  Solicitar Servicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-10">
            <SectionTitle>
              Conoce la importante labor de MediaLab
            </SectionTitle>
            <p className="text-base text-(--color-text-secondary) max-w-3xl mx-auto text-center">
              En el corazón de Universidad Galileo, el Laboratorio de Multimedia, mejor conocido como 
              MediaLab, se encarga de dar vida a las ideas, proyectos y eventos que marcan el día a día académico.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src={teamImage} 
                alt="Equipo de MediaLab" 
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-(--color-text-main) mb-4">¿Quiénes lo conforman?</h3>
              
              <p className="text-base text-(--color-text-secondary) mb-4">
                El equipo está dirigido por el <strong className="text-(--color-text-main)">M.Sc. David Antonio Castillo Cobos</strong> y lo integran 
                <strong className="text-(--color-text-main)"> 17 profesionales multidisciplinarios</strong> con experiencia en:
              </p>
              
              <ul className="text-(--color-text-secondary) space-y-1 mb-4 list-disc pl-5">
                <li>Diseño gráfico</li>
                <li>Producción audiovisual</li>
                <li>Comunicación y publicidad</li>
                <li>Mercadeo</li>
                <li>Tecnología, electrónica y sistemas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-10 text-center">
            <SectionTitle color="--color-accent-1" textColor="white">
              Nuestros Servicios
            </SectionTitle>
            <p className="text-base text-gray-300 max-w-3xl mx-auto">
              La labor de MediaLab se divide en tres grandes áreas que cubren todo el espectro multimedia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <img 
                src={service1} 
                alt="Servicios audiovisuales" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-lg font-bold text-(--color-text-main) mb-2">
                  Servicios audiovisuales y multimedia
                </h3>
                <ul className="text-(--color-text-secondary) space-y-1 mb-3 list-disc pl-5 text-sm">
                  <li>Videos institucionales y promocionales</li>
                  <li>Cobertura de eventos y webinars</li>
                  <li>Diseño interactivo y animaciones</li>
                  <li>Video marketing para redes sociales</li>
                </ul>
                <Link to="/request" className="text-blue-600 font-medium hover:underline text-sm">
                  Solicitar este servicio →
                </Link>
              </div>
            </div>
            
            {/* Service 2 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <img 
                src={service2} 
                alt="Producción de contenido" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-lg font-bold text-(--color-text-main) mb-2">
                  Producción de contenido
                </h3>
                <ul className="text-(--color-text-secondary) space-y-1 mb-3 list-disc pl-5 text-sm">
                  <li>Televisión</li>
                  <li>Radio y podcasts</li>
                  <li>Streaming</li>
                  <li>Redes sociales</li>
                  <li>Eventos híbridos o virtuales</li>
                </ul>
                <Link to="/request" className="text-blue-600 font-medium hover:underline text-sm">
                  Solicitar este servicio →
                </Link>
              </div>
            </div>
            
            {/* Service 3 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <img 
                src={service3} 
                alt="Apoyo académico" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-lg font-bold text-(--color-text-main) mb-2">
                  Apoyo académico
                </h3>
                <p className="text-(--color-text-secondary) mb-3 text-sm">
                  Funcionamos como un laboratorio equipado para que estudiantes de áreas afines puedan utilizar tecnología 
                  de punta en sus proyectos, desde software especializado hasta estaciones de trabajo para diseño y 
                  producción multimedia.
                </p>
                <Link to="/request" className="text-blue-600 font-medium hover:underline text-sm">
                  Solicitar este servicio →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-10 text-center">
            <SectionTitle>
              Nuestro Trabajo
            </SectionTitle>
            <p className="text-base text-(--color-text-secondary) max-w-3xl mx-auto">
              Cada actividad que realiza MediaLab tiene su propia dinámica y proceso. Nuestro trabajo va más allá 
              de grabar y editar. Se trata de transmitir el mensaje correcto de forma atractiva y efectiva.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="overflow-hidden rounded-lg shadow-sm">
              <img 
                src={galleryImage1} 
                alt="Producción MediaLab" 
                className="w-full h-56 object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-lg shadow-sm">
              <img 
                src={galleryImage2} 
                alt="Producción MediaLab" 
                className="w-full h-56 object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-lg shadow-sm">
              <img 
                src={galleryImage3} 
                alt="Producción MediaLab" 
                className="w-full h-56 object-cover"
              />
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Link to="/gallery" className="text-blue-600 font-medium hover:underline inline-flex items-center">
              Ver más proyectos →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}