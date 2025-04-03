import React from 'react';
import { Link } from 'react-router-dom';

type NavbarProps = {
  transparent?: boolean;
};

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  return (
    <>
      {/* Desktop Navbar */}
      <header className={`w-full ${transparent ? 'bg-transparent absolute top-0 left-0 z-10' : 'bg-gray-900 border-b border-gray-800'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-white font-heading">MediaLab</h1>
                <span className="ml-2 text-sm bg-indigo-600 text-white px-2 py-1 rounded">
                  Galileo
                </span>
              </Link>
            </div>

            {/* Desktop Menu - Hidden on mobile */}
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li>
                  <a href="#services" className="text-gray-300 hover:text-white transition">
                    Servicios
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-300 hover:text-white transition">
                    Nosotros
                  </a>
                </li>
                <li>
                  <Link to="/form" className="text-indigo-400 hover:text-indigo-300 transition">
                    Solicitar
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Menu */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 z-50 md:hidden">
        <nav className="py-3">
          <ul className="flex justify-around">
            <li>
              <a href="#services" className="flex flex-col items-center text-gray-300 hover:text-white">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs">Servicios</span>
              </a>
            </li>
            <li>
              <Link to="/" className="flex flex-col items-center text-gray-300 hover:text-white">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs">Inicio</span>
              </Link>
            </li>
            <li>
              <a href="#about" className="flex flex-col items-center text-gray-300 hover:text-white">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs">Nosotros</span>
              </a>
            </li>
            <li>
              <Link to="/form" className="flex flex-col items-center text-indigo-400 hover:text-indigo-300">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs">Solicitar</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Navbar;