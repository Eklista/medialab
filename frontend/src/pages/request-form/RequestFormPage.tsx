// src/pages/request-form/RequestFormPage.tsx
import React from 'react'
import { Navbar, Footer } from '../../components/layout'

export const RequestFormPage = () => {
  return (
    <div className="bg-(--color-bg-main) min-h-screen flex flex-col">
      <Navbar />

      {/* Form Section */}
      <section className="py-16 flex-grow bg-[url('../../assets/images/pattern-light.png')] bg-fixed bg-opacity-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-(--color-bg-secondary) rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-(--color-text-main) mb-2">Solicitud de Servicio</h1>
            <div className="w-16 h-1 bg-(--color-accent-1) mb-6"></div>
            <p className="text-(--color-text-secondary) mb-8">
              Completa el siguiente formulario para solicitar los servicios de MediaLab.
            </p>
            
            <form className="space-y-8">
              {/* Información personal */}
              <div>
                <h2 className="text-xl font-semibold text-(--color-text-main) mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-(--color-accent-1) text-(--color-text-main) flex items-center justify-center mr-2 font-bold">1</span>
                  Información del solicitante
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Nombre completo *
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      placeholder="Ingresa tu nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Correo electrónico *
                    </label>
                    <input 
                      type="email" 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      placeholder="Ingresa tu correo electrónico"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Teléfono
                    </label>
                    <input 
                      type="tel" 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      placeholder="Ingresa tu número de teléfono"
                    />
                  </div>
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Departamento o Facultad *
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      placeholder="Departamento o facultad a la que perteneces"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Información del servicio */}
              <div>
                <h2 className="text-xl font-semibold text-(--color-text-main) mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-(--color-accent-1) text-(--color-text-main) flex items-center justify-center mr-2 font-bold">2</span>
                  Detalles del servicio
                </h2>
                <div className="space-y-6 mt-4">
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Tipo de servicio requerido *
                    </label>
                    <select 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      required
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="video">Producción de video</option>
                      <option value="event">Cobertura de evento</option>
                      <option value="design">Diseño multimedia</option>
                      <option value="streaming">Transmisión en vivo</option>
                      <option value="audio">Producción de audio</option>
                      <option value="lab">Uso del laboratorio</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Fecha requerida *
                    </label>
                    <input 
                      type="date" 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-(--color-text-main) text-sm font-medium mb-1">
                      Descripción del proyecto *
                    </label>
                    <textarea 
                      className="w-full bg-(--color-bg-main) border border-(--color-border) rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-(--color-accent-1) transition-all"
                      rows={5}
                      placeholder="Describe brevemente el proyecto o servicio que necesitas"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* Botón de envío */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full md:w-auto bg-(--gradient-accent) text-(--color-text-main) font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 duration-300"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}