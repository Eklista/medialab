import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/images/logo.png'
import { useAuth } from '../../features/auth/hooks'
import LockScreen from '../../features/auth/components/LockScreen'
import { SearchInput } from '../ui/SearchInput'
import { ExploreDropdown } from '../ui/ExploreDropdown'

export const Navbar = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { state } = useAuth();

  const handleSearch = (query: string) => {
    console.log('Buscando en navbar:', query);
    // Implementar lógica de búsqueda global
    setShowMobileSearch(false); // Cerrar search móvil después de buscar
  };

  const handleCategorySelect = (facultadId: string, categoryId: string) => {
    console.log('Navegando a:', facultadId, categoryId);
    // Navegar a /facultad/[facultadId]/categoria/[categoryId] o filtrar resultados
  };

  const handleFacultySelect = (facultadId: string) => {
    console.log('Navegando a facultad:', facultadId);
    // Navegar a /facultad/[facultadId] o mostrar contenido de la facultad
  };

  if (state.isAuthenticated && state.isLocked) {
    return <LockScreen />;
  }

  const suggestions = [
    'graduaciones 2024',
    'conferencias medicina',
    'ingeniería sistemas',
    'podcasts galileo',
    'eventos fisicc'
  ];

  return (
    <div>
      {/* Topbar con redes sociales - COLOR NEGRO */}
      <div className="bg-black text-white py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span>Universidad Galileo</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Redes sociales */}
              <a href="#" className="text-white hover:opacity-75 transition-opacity" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="#" className="text-white hover:opacity-75 transition-opacity" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-white hover:opacity-75 transition-opacity" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
              <div className="h-4 w-px bg-white/30 mx-1"></div>
              
              {/* Botón de login o dashboard */}
              {state.isAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="text-white hover:opacity-75 transition-opacity flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              ) : (
                <Link 
                  to="/ml-admin/login" 
                  className="text-white hover:opacity-75 transition-opacity flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navbar principal - Responsive mejorado */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src={logo} 
                  alt="MediaLab Logo" 
                  className="h-12 w-auto"
                />
              </Link>
            </div>
            
            {/* Navegación central - SOLO DESKTOP */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Botón Explorar */}
              <ExploreDropdown 
                onCategorySelect={handleCategorySelect}
                onFacultySelect={handleFacultySelect}
              />
              
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <SearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  onSearch={handleSearch}
                  suggestions={suggestions}
                  size="md"
                  placeholder="Buscar videos, eventos, facultades..."
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center gap-3">
              {/* Botón Solicitar Servicio - NEGRO */}
              <Link 
                to="/request" 
                className="bg-black text-white px-4 py-2 lg:px-6 lg:py-2 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition-all text-sm lg:text-base"
              >
                <span className="hidden sm:inline">Solicitar Servicio</span>
                <span className="sm:hidden">Servicio</span>
              </Link>
            </div>
          </div>

          {/* Barra de búsqueda móvil/tablet - SOLO PARA DESKTOP AHORA */}
          {showMobileSearch && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30"
                onClick={() => setShowMobileSearch(false)}
              />
              
              {/* Search Modal */}
              <div className="fixed top-0 left-0 right-0 bg-white p-4 shadow-lg z-40">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <SearchInput
                      value={searchValue}
                      onChange={setSearchValue}
                      onSearch={handleSearch}
                      suggestions={suggestions}
                      size="lg"
                      placeholder="Buscar videos, eventos, facultades..."
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => setShowMobileSearch(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  )
}