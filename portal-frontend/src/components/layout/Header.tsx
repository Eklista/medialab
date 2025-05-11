import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">Portal MediaLab</span>
            </Link>
          </div>
          <div className="flex items-center">
            <span className="inline-flex rounded-md">
              <button 
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cerrar Sesión
              </button>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;