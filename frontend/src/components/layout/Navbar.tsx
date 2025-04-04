import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/images/logo.png'

export const Navbar = () => {
  // Estado para controlar el menú móvil
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para alternar el estado del menú
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Prevenir el scroll cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <div>
      {/* Topbar con redes sociales */}
      <div className="bg-(--color-text-main) text-white py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span>Universidad Galileo</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Redes sociales */}
              <a href="#" className="text-white hover:text-(--color-accent-1) transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-(--color-accent-1) transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-(--color-accent-1) transition-colors" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
              <div className="h-4 w-px bg-white/30 mx-1"></div>
              {/* Botón de login */}
              <a href="#" className="text-white hover:text-(--color-accent-1) transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar principal mejorado */}
      <header className="bg-(--color-bg-secondary) shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src={logo} 
                  alt="MediaLab Logo" 
                  className="h-12 w-auto"
                />
              </Link>
            </div>
            
            {/* Menú de escritorio */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2">
                Nosotros
              </a>
              <a href="#services" className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2">
                Servicios
              </a>
              <a href="#gallery" className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2">
                Galería
              </a>
              <a href="/documentation/components-test" className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2">
                Componentes
              </a>
              <Link 
                to="/request" 
                className="bg-(--color-accent-1) text-(--color-text-main) px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                Solicitar Servicio
              </Link>
            </nav>
            
            {/* Botón de menú móvil - Ahora con z-index menor que el menú */}
            <div className="md:hidden">
              <button 
                className={`text-(--color-text-main) p-2 relative ${isMenuOpen ? 'z-40' : 'z-30'}`} 
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Overlay solo se renderiza cuando el menú está abierto */}
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden ${
            isMenuOpen ? 'opacity-50 z-40 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
          onClick={() => setIsMenuOpen(false)}
        ></div>

        
        {/* Menú móvil slide-in desde la derecha - Ahora con z-index mayor que el botón */}
        <div className={`fixed top-0 right-0 bottom-0 z-50 w-64 bg-(--color-bg-secondary) shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-(--color-border)">
              <span className="font-bold text-lg text-(--color-text-main)">Menú</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-(--color-text-main) p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 p-4">
              <div className="flex flex-col space-y-4">
                <a 
                  href="#about" 
                  className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2 border-b border-(--color-border) pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Nosotros
                </a>
                <a 
                  href="#services" 
                  className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2 border-b border-(--color-border) pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Servicios
                </a>
                <a 
                  href="#gallery" 
                  className="text-(--color-text-main) hover:text-(--color-accent-1) transition-colors py-2 border-b border-(--color-border) pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Galería
                </a>
              </div>
            </nav>
            
            <div className="p-4 border-t border-(--color-border)">
              <Link 
                to="/request" 
                className="bg-(--color-accent-1) text-(--color-text-main) py-3 px-6 rounded-lg font-medium shadow-md hover:shadow-lg transition-all block text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Solicitar Servicio
              </Link>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}