import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const PortalLayout: React.FC = () => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;