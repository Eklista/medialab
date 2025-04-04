// src/components/layout/Footer.tsx
import React from 'react'
import { Link } from 'react-router-dom'

export const Footer = () => {
  return (
    <div className="relative mt-12">
      {/* Footer */}
      <footer className="bg-(--color-text-main) text-white py-12 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MediaLab</h3>
              <p className="opacity-80">
                Laboratorio de Multimedia de Universidad Galileo. Creatividad y tecnología al servicio de la educación.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <p className="opacity-80">
                7a. Avenida, calle Dr. Eduardo Suger Cofiño, Zona 10<br />
                Guatemala, Guatemala<br />
                medialab@galileo.edu
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Enlaces rápidos</h3>
              <ul className="space-y-2 opacity-80">
                <li><a href="#about" className="hover:text-(--color-accent-1) transition-colors">Nosotros</a></li>
                <li><a href="#services" className="hover:text-(--color-accent-1) transition-colors">Servicios</a></li>
                <li><a href="#gallery" className="hover:text-(--color-accent-1) transition-colors">Galería</a></li>
                <li><Link to="/request" className="hover:text-(--color-accent-1) transition-colors">Solicitar Servicio</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="opacity-70">© {new Date().getFullYear()} MediaLab - Universidad Galileo. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}