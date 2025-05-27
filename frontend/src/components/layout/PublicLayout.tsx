// src/components/layout/PublicLayout.tsx - Versión simplificada sin tema oscuro
import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className={`${className}`}>
        {children}
      </main>
      
      <Footer />
    </div>
  );
};