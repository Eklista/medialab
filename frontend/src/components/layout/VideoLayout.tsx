// src/components/layout/VideoLayout.tsx - Layout específico para páginas de video
import React from 'react';
import { Navbar } from './Navbar';

interface VideoLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const VideoLayout: React.FC<VideoLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main content - Ancho completo sin container */}
      <main className={`${className}`}>
        {children}
      </main>
    </div>
  );
};